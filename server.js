
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const registerRoute = require("./routes/register"); 
const loginRoute = require("./routes/login");
const profileRoute = require("./routes/profile");
const verifyEmailRoute = require("./routes/verifyEmail");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", profileRoute);
app.use("/api/auth", verifyEmailRoute);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Pynexia Login System Backend is running!");
});

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
