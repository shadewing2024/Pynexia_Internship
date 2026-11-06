const express = require("express");
const Config = require("../config/officeConfig");

// Karachi timezone functions
const { toZonedTime, fromZonedTime } = require("date-fns-tz");

const TIME_ZONE = Config.timeZone; // "Asia/Karachi"

const router = express.Router();

router.get("/office-config", async (req, res) => {

    try {

        const timeZone = TIME_ZONE;
        const openingTime = Config.openingTime;
        const closingTime = Config.closingTime;
        const workingDays = Config.workingDays;

        const currentTime = toZonedTime(new Date(), timeZone);
        const currentDay = currentTime.getDay();

        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        const [openingHour, openingMinute] = openingTime.split(":").map(Number);
        const [closingHour, closingMinute] = closingTime.split(":").map(Number);

        const openingMinutes = openingHour * 60 + openingMinute;
        const closingMinutes = closingHour * 60 + closingMinute;

        return res.status(200).json({
            timeZone: Config.timeZone,
            openingTime: Config.openingTime,
            closingTime: Config.closingTime,
            workingDays: Config.workingDays,
            currentDay: currentDay,
            currentMinutes: currentMinutes,
            openingMinutes: openingMinutes,
            closingMinutes: closingMinutes
        });

    } catch (error) {
        console.error("Error in /office-config route:", error);
        res.status(500).json({
            message: "Internal server error."
        });
    }
})

module.exports = router;