
const express = require("express");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const Config = require("../config/officeConfig");

// Karachi timezone functions
const { toZonedTime, fromZonedTime } = require("date-fns-tz");

const TIME_ZONE = Config.timeZone; // "Asia/Karachi"

const router = express.Router();


// =====================================================
// HELPER: GET KARACHI TODAY DATE RANGE
// =====================================================

function getTodayDateRange() {

    const karachiDate = toZonedTime(new Date(), TIME_ZONE);

    const startOfDay = new Date(karachiDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(karachiDate);
    endOfDay.setHours(23, 59, 59, 999);

    return {
        startOfDayUTC: fromZonedTime(startOfDay, TIME_ZONE),
        endOfDayUTC: fromZonedTime(endOfDay, TIME_ZONE)
    };
}


// =====================================================
// CHECK-IN API
// POST /api/attendance/check-in
// =====================================================

router.post("/check-in", authMiddleware, async (req, res) => {
    try {

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // =====================================================================
        // CHECK IF CURRENT DAY AND TIME IS WITHIN OFFICE WORKINGDAYS AND HOURS
        // =====================================================================
        
        const currentTime = toZonedTime(new Date(), TIME_ZONE);
        const currentDay = currentTime.getDay();

        if (!Config.workingDays.includes(currentDay)) {
            return res.status(400).json({
                message: "Office is closed today."
            });
        }

        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const [openingHour, openingMinute] = Config.openingTime.split(":").map(Number);
        const [closingHour, closingMinute] = Config.closingTime.split(":").map(Number);

        const openingMinutes = openingHour * 60 + openingMinute;
        const closingMinutes = closingHour * 60 + closingMinute;

        if (currentMinutes < openingMinutes || currentMinutes >= closingMinutes) {
            return res.status(400).json({
                message: "Check-in is only allowed during office hours."
            });
        }

        const userId = user._id;

        const { startOfDayUTC, endOfDayUTC } = getTodayDateRange();

        const existingAttendance = await Attendance.findOne({
            userId: userId,
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            }
        });

        if (existingAttendance) {
            return res.status(409).json({
                message: "Attendance already exists for today."
            });
        }

        const attendance = await Attendance.create({
            userId: userId,
            date: startOfDayUTC,
            checkIn: new Date(),
            status: "Present"
        });

        return res.status(201).json({
            message: "Check-in successful.",
            attendance: attendance
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).json({
                message: "Attendance already exists for today."
            });
        }

        console.error("Check-in error:", error);

        return res.status(500).json({
            message: "An error occurred during check-in."
        });
    }
});


// =====================================================
// CHECK-OUT API
// POST /api/attendance/check-out
// =====================================================

router.post("/check-out", authMiddleware, async (req, res) => {
    try {

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const userId = user._id;

        const { startOfDayUTC, endOfDayUTC } = getTodayDateRange();

        const attendance = await Attendance.findOne({
            userId: userId,
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            }
        });

        if (!attendance) {
            return res.status(400).json({
                message: "Please check in first."
            });
        }

        if (attendance.checkOut) {
            return res.status(409).json({
                message: "You have already checked out today."
            });
        }

        attendance.checkOut = new Date();

        await attendance.save();

        return res.status(200).json({
            message: "Check-out successful.",
            attendance: attendance
        });

    } catch (error) {

        console.error("Check-out error:", error);

        return res.status(500).json({
            message: "An error occurred during check-out."
        });
    }
});


// =====================================================
// TODAY'S ATTENDANCE API
// GET /api/attendance/today
// =====================================================

router.get("/today", authMiddleware, async (req, res) => {
    try {

        const userId = req.user.userId;

        const { startOfDayUTC, endOfDayUTC } = getTodayDateRange();

        const attendance = await Attendance.findOne({
            userId: userId,
            date: {
                $gte: startOfDayUTC,
                $lte: endOfDayUTC
            }
        });

        return res.status(200).json({
            attendance: attendance
        });

    } catch (error) {

        console.error("Today's attendance error:", error);

        return res.status(500).json({
            message: "Unable to load today's attendance."
        });
    }
});


// =====================================================
// ATTENDANCE HISTORY API
// GET /api/attendance/history
// =====================================================

router.get("/history", authMiddleware, async (req, res) => {
    try {

        const userId = req.user.userId;

        const attendance = await Attendance.find({
            userId: userId
        })
        .sort({ date: -1 })
        .limit(30);

        return res.status(200).json({
            attendance: attendance
        });

    } catch (error) {

        console.error("Attendance history error:", error);

        return res.status(500).json({
            message: "Unable to load attendance history."
        });
    }
});


module.exports = router;
