
// =====================================================
// 1. GET HTML ELEMENTS
// =====================================================

// const { isWeekend } = require("date-fns");

// Authentication elements
const authPage = document.getElementById("auth-page");
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

// Dashboard elements
const dashboard = document.getElementById("dashboard");
const welcomeMessage = document.getElementById("welcome-message");
const logoutButton = document.getElementById("logout-button");

// Employee information
const sidebarName = document.getElementById("sidebar-name");
const headerName = document.getElementById("header-name");
const sidebarAvatar = document.getElementById("sidebar-avatar");
const headerAvatar = document.getElementById("header-avatar");

// Date and attendance information
const currentDate = document.getElementById("current-date");
const currentTime = document.getElementById("current-time");
const attendanceStatus = document.getElementById("attendance-status");
const officeStatus = document.getElementById("office-status");

// Check-in / Check-out elements
const checkInButton = document.getElementById("check-in-button");
const checkOutButton = document.getElementById("check-out-button");
const checkInTime = document.getElementById("checkin-time");
const checkOutTime = document.getElementById("checkout-time");

// Attendance history
const attendanceHistory = document.getElementById("attendance-history");


// =====================================================
// 2. APPLICATION STATE
// =====================================================

let isRegisterMode = false;
let currentUser = null;


// Pakistan Standard Time
const TIME_ZONE = "Asia/Karachi";


// =====================================================
// 3. MESSAGE FUNCTIONS
// =====================================================

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function clearMessage() {
    message.textContent = "";
    message.className = "message";
}


// =====================================================
// 4. LOGIN / REGISTRATION FORM
// =====================================================

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
        : "Welcome Back!";

    formSubtitle.textContent = isRegisterMode
        ? "Register to get started"
        : "Sign in to manage your attendance.";

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


// Switch between login and registration
switchButton.addEventListener("click", () => {
    setFormMode(!isRegisterMode);
});


// =====================================================
// 5. LOGIN / REGISTRATION API
// =====================================================

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (password.length < 8) {
        showMessage(
            "Password must be at least 8 characters.",
            "error"
        );
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
            showMessage(
                data.message || "Request failed.",
                "error"
            );
            return;
        }

        // Registration successful
        if (isRegisterMode) {

            const registeredEmail = email;

            setFormMode(false);

            emailInput.value = registeredEmail;

            showMessage(
                "Account created! Please verify your email before signing in.",
                "success"
            );

            return;
        }

        // Login successful
        if (!data.token) {

            showMessage(
                "Login response did not include a token.",
                "error"
            );

            return;
        }

        // Save token for this browser tab
        sessionStorage.setItem("authToken", data.token);

        await loadProfile();

    } catch (error) {

        console.error("Authentication error:", error);

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


// =====================================================
// 6. LOAD EMPLOYEE PROFILE
// =====================================================

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

        // Store user information
        currentUser = data.user;

        // Show dashboard
        authPage.hidden = true;
        dashboard.hidden = false;

        // Display employee name
        const employeeName = currentUser.name || "Employee";

        welcomeMessage.textContent = `Welcome, ${employeeName}!`;

        sidebarName.textContent = employeeName;
        headerName.textContent = employeeName;

        // Display first letter in profile avatars
        const firstLetter = employeeName.charAt(0).toUpperCase();

        sidebarAvatar.textContent = firstLetter;
        headerAvatar.textContent = firstLetter;

        // Initialize dashboard
        updateDateAndTime();
        updateOfficeStatus();
        await loadTodayAttendance();
        await loadAttendanceHistory();

        clearMessage();

    } catch (error) {

        console.error("Profile loading error:", error);

        showMessage(
            "Unable to load your profile.",
            "error"
        );
    }
}


// =====================================================
// 7. DATE AND TIME
// =====================================================

function updateDateAndTime() {

    const now = new Date();

    currentDate.textContent = new Intl.DateTimeFormat("en-PK", {
        timeZone: TIME_ZONE,
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(now);

    currentTime.textContent = new Intl.DateTimeFormat("en-PK", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    }).format(now);
}


// Update the displayed clock every second
setInterval(updateDateAndTime, 1000);


// =====================================================
// 8. OFFICE WORKING DAYS
// =====================================================
      
async function updateOfficeStatus() {

    const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        weekday: "long"
    }).format(new Date());

    const response = await fetch("/api/office-config", {
        method: "GET"
    });

    const Config = await response.json();   
    const isWeekend = !Config.workingDays.includes(Config.currentDay);
    const currentTime = Config.currentMinutes;
    const openingMinutes = Config.openingMinutes;
    const closingMinutes = Config.closingMinutes;

    if (isWeekend || (currentTime < openingMinutes) || (currentTime > closingMinutes)) {

        officeStatus.textContent = "Office Closed";

        attendanceStatus.textContent = "Office Closed";

        officeStatus.classList.add("closed");

        checkInButton.disabled = true;
        checkOutButton.disabled = true;

    } else {

        officeStatus.textContent = "Office Open";

        officeStatus.classList.remove("closed");

        checkInButton.disabled = false;
        checkOutButton.disabled = false;
    }
}


// =====================================================
// 9. CHECK-IN API
// =====================================================

checkInButton.addEventListener("click", async () => {

    await sendAttendanceRequest(
        "/api/attendance/check-in",
        checkInButton,
        "Checking In..."
    );

});


// =====================================================
// 10. CHECK-OUT API
// =====================================================

checkOutButton.addEventListener("click", async () => {

    await sendAttendanceRequest(
        "/api/attendance/check-out",
        checkOutButton,
        "Checking Out..."
    );

});


// Common function for check-in and check-out
async function sendAttendanceRequest(endpoint, button, loadingText) {

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        return;
    }

    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = loadingText;

    try {

        const response = await fetch(endpoint, {

            method: "POST",

            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }

        });

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Attendance request failed.");

            return;
        }

        alert(data.message || "Attendance updated successfully.");

        // Refresh today's attendance after successful action
        await loadTodayAttendance();

        // Refresh attendance history
        await loadAttendanceHistory();

    } catch (error) {

        console.error("Attendance request error:", error);

        alert("Unable to connect to the server.");

    } finally {

        button.textContent = originalText;

        updateOfficeStatus();

        await updateButtonStates();
    }
}


// =====================================================
// 11. LOAD TODAY'S ATTENDANCE
// =====================================================

async function loadTodayAttendance() {

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            "/api/attendance/today",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const attendance = data.attendance;

        if (!attendance) {

            checkInTime.textContent = "--:--";
            checkOutTime.textContent = "--:--";

            attendanceStatus.textContent = "Not Checked In";

            await updateButtonStates();

            return;
        }

        checkInTime.textContent = attendance.checkIn
            ? formatTime(attendance.checkIn)
            : "--:--";

        checkOutTime.textContent = attendance.checkOut
            ? formatTime(attendance.checkOut)
            : "--:--";

        attendanceStatus.textContent = attendance.status;

        await updateButtonStates();

    } catch (error) {

        console.error("Today's attendance error:", error);

    }
}


// =====================================================
// 12. CHECK-IN / CHECK-OUT BUTTON STATES
// =====================================================

async function updateButtonStates() {

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            "/api/attendance/today",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        const attendance = data.attendance;

        if (!attendance) {

            checkInButton.disabled = false;
            checkOutButton.disabled = true;

        } else {

            checkInButton.disabled = true;

            checkOutButton.disabled = Boolean(attendance.checkOut);
        }

        updateOfficeStatus();

    } catch (error) {

        console.error("Button state error:", error);

    }
}


// =====================================================
// 13. ATTENDANCE HISTORY
// =====================================================

async function loadAttendanceHistory() {

    const token = sessionStorage.getItem("authToken");

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            "/api/attendance/history",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Unable to retrieve attendance history.");
        }

        const data = await response.json();

        const records = data.attendance;

        attendanceHistory.innerHTML = "";

        if (!records || records.length === 0) {

            attendanceHistory.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-history">
                        No attendance records found.
                    </td>
                </tr>
            `;

            return;
        }

        records.forEach((record) => {

            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            const checkInCell = document.createElement("td");
            const checkOutCell = document.createElement("td");
            const statusCell = document.createElement("td");

            dateCell.textContent = formatDate(record.date);

            checkInCell.textContent = record.checkIn
                ? formatTime(record.checkIn)
                : "--";

            checkOutCell.textContent = record.checkOut
                ? formatTime(record.checkOut)
                : "--";

            statusCell.textContent = record.status;

            statusCell.className =
                `status-badge status-${record.status.toLowerCase()}`;

            row.append(
                dateCell,
                checkInCell,
                checkOutCell,
                statusCell
            );

            attendanceHistory.appendChild(row);

        });

    } catch (error) {

        console.error("Attendance history error:", error);

        attendanceHistory.innerHTML = `
            <tr>
                <td colspan="4" class="empty-history">
                    Attendance history is currently unavailable.
                </td>
            </tr>
        `;
    }
}


// =====================================================
// 14. DATE / TIME FORMATTING
// =====================================================

function formatTime(dateValue) {

    return new Intl.DateTimeFormat("en-PK", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(new Date(dateValue));
}


function formatDate(dateValue) {

    return new Intl.DateTimeFormat("en-PK", {
        timeZone: TIME_ZONE,
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(new Date(dateValue));
}


// =====================================================
// 15. LOGOUT
// =====================================================

logoutButton.addEventListener("click", () => {

    sessionStorage.removeItem("authToken");

    currentUser = null;

    dashboard.hidden = true;
    authPage.hidden = false;

    setFormMode(false);

    showMessage(
        "You have logged out successfully.",
        "success"
    );

});


// =====================================================
// 16. CHECK EXISTING LOGIN
// =====================================================

async function checkExistingLogin() {

    if (sessionStorage.getItem("authToken")) {

        await loadProfile();

    }
}


// Start the application
checkExistingLogin();
