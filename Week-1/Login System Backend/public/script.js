
const authForm = document.getElementById("auth-form");
const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");
const nameGroup = document.getElementById("name-group");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submit-button");
const switchButton = document.getElementById("switch-button");
const switchText = document.getElementById("switch-text");
const message = document.getElementById("message");
const dashboard = document.getElementById("dashboard");
const welcomeMessage = document.getElementById("welcome-message");
const profileEmail = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");

let isRegisterMode = false;

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
}

function setFormMode(registerMode) {
    isRegisterMode = registerMode;
    authForm.reset();
    clearMessage();

    nameGroup.hidden = !isRegisterMode;
    nameInput.required = isRegisterMode;
    passwordInput.autocomplete = isRegisterMode
        ? "new-password"
        : "current-password";

    formTitle.textContent = isRegisterMode
        ? "Create Account"
        : "Welcome Back";

    formSubtitle.textContent = isRegisterMode
        ? "Register to get started"
        : "Sign in to access your account";

    submitButton.textContent = isRegisterMode
        ? "Create Account"
        : "Sign In";

    switchText.firstChild.textContent = isRegisterMode
        ? "Already have an account? "
        : "Don't have an account? ";

    switchButton.textContent = isRegisterMode
        ? "Sign In"
        : "Create Account";
}

switchButton.addEventListener("click", () => {
    setFormMode(!isRegisterMode);
});

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (password.length < 8) {
        showMessage("Password must be at least 8 characters.", "error");
        return;
    }

    const endpoint = isRegisterMode
        ? "/api/auth/register"
        : "/api/auth/login";

    const requestBody = isRegisterMode
        ? {
            name: nameInput.value.trim(),
            email,
            password
        }
        : {
            email,
            password
        };

    submitButton.disabled = true;
    submitButton.textContent = isRegisterMode
        ? "Creating Account..."
        : "Signing In...";

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || "Request failed.", "error");
            return;
        }

        if (isRegisterMode) {
            showMessage(
                "Account created successfully! You can now sign in.",
                "success"
            );

            setFormMode(false);
            showMessage(
                "Please verify your email.",
                "success"
            );
            emailInput.value = email;
        } else {
            if (!data.token) {
                showMessage("Login response did not include a token.", "error");
                return;
            }

            // Keep the token only for this browser tab.
            sessionStorage.setItem("authToken", data.token);

            await loadProfile();
        }
    } catch (error) {
        showMessage(
            "Cannot connect to the server. Please try again.",
            "error"
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = isRegisterMode
            ? "Create Account"
            : "Sign In";
    }
});

async function loadProfile() {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        return;
    }

    try {
        const response = await fetch("/api/auth/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            sessionStorage.removeItem("authToken");
            showMessage(
                data.message || "Please sign in again.",
                "error"
            );
            return;
        }

        authForm.hidden = true;
        switchText.hidden = true;
        dashboard.hidden = false;
        nameGroup.hidden = true;
        clearMessage();

        welcomeMessage.textContent = `Welcome, ${data.user.name}!`;
        profileEmail.textContent = data.user.email;
    } catch (error) {
        showMessage("Unable to load your profile.", "error");
    }
}

logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("authToken");

    authForm.hidden = false;
    switchText.hidden = false;
    dashboard.hidden = true;

    setFormMode(false);
    showMessage("You have logged out successfully.", "success");
});

async function checkExistingLogin() {
    if (sessionStorage.getItem("authToken")) {
        await loadProfile();
    }
}

checkExistingLogin();
