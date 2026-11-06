
const cron = require("node-cron");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const Config = require("../config/officeConfig");

// Date ko Karachi timezone ke mutabiq calculate karne ke liye
const { toZonedTime, fromZonedTime } = require("date-fns-tz");

const TIME_ZONE = Config.timeZone; // "Asia/Karachi"
console.log(`Attendance scheduler initialized with timezone: ${TIME_ZONE}`);

const [hour, minute] = Config.closingTime.split(":").map(Number);
const cronExpression = `${minute} ${hour} * * 1-5`; // Monday to Friday

// AUTOMATIC ABSENCE SCHEDULER
// Monday to Friday, Pakistan time ke mutabiq 6:00 PM
cron.schedule(cronExpression, async () => {
    try {
        console.log("Starting automatic attendance checking...");

        // 1. Get today's date and time in Karachi timezone
        const karachiDate = toZonedTime(new Date(), TIME_ZONE);

        // 2. Get Karachi date's start and end boundaries
        const startOfDay = new Date(karachiDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(karachiDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 3. Convert Karachi boundaries into UTC dates for MongoDB
        const startOfDayUTC = fromZonedTime(startOfDay, TIME_ZONE);
        const endOfDayUTC = fromZonedTime(endOfDay, TIME_ZONE);

        // 4. Get all registered users
        const users = await User.find({
            isVerified: true,
            $or: [
                { role: "employee" },
                { role: { $exists: false } }
            ]
        });

        // 5. Check attendance of every user
        for (const user of users) {

            const existingAttendance = await Attendance.findOne({
                userId: user._id,
                date: {
                    $gte: startOfDayUTC,
                    $lte: endOfDayUTC
                }
            });

            // 6. If attendance does not exist, mark Absent
            if (!existingAttendance) {

                await Attendance.create({
                    userId: user._id,
                    date: startOfDayUTC,
                    checkIn: null,
                    checkOut: null,
                    status: "Absent"
                });

                console.log(`${user.name} marked as Absent.`);
            }
        }

        console.log("Automatic attendance checking completed.");

    } catch (error) {
        console.error("Attendance scheduler error:", error);
    }
}, {
    timezone: TIME_ZONE
});

console.log("Attendance scheduler initialized.");

