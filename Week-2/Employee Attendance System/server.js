
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const registerRoute = require("./routes/register");
const loginRoute = require("./routes/login");
const profileRoute = require("./routes/profile");
const verifyEmailRoute = require("./routes/verifyEmail");
const attendanceRoutes = require("./routes/attendanceRoutes");
const officeConfigRoutes = require("./routes/officeConfigRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Office configuration routes
app.use("/api", officeConfigRoutes);

// Authentication routes
app.use("/api/auth", registerRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", profileRoute);
app.use("/api/auth", verifyEmailRoute);

// Attendance routes
app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 3000;

// Home route
app.get("/", (req, res) => {
    res.send("Employee Attendance System is running!");
});

// Start server
async function startServer() {
    try {
        // 1. Connect to MongoDB first
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        // 2. Initialize attendance scheduler after DB connection
        require("./scheduler/attendanceScheduler");

        // 3. Start Express server
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
