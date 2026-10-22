
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const validator = require("validator");

const router = express.Router();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        if (!validator.isEmail(cleanEmail)) {
            return res.status(400).json({
                message: "Please provide a valid email address."
            });
        }

        const existingUser = await User.findOne({ email: cleanEmail });

        if (existingUser) {
            return res.status(409).json({
                message: existingUser.isVerified
                    ? "An account with this email already exists."
                    : "This email is already registered but not verified. Please contact support to resend verification."
            });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenHash = crypto
            .createHash("sha256")
            .update(verificationToken)
            .digest("hex");

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            isVerified: false,
            verificationTokenHash,
            verificationTokenExpires: Date.now() + 30 * 60 * 1000
        });

        const verificationUrl =
            `${process.env.APP_URL || "http://localhost:3000"}` +
            `/api/auth/verify-email?token=${verificationToken}`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: newUser.email,
                subject: "Verify your email - Pynexia Login System",
                text:
                    `Hello ${newUser.name},\n\n` +
                    `Please verify your email by opening this link within 30 minutes:\n` +
                    `${verificationUrl}\n\n` +
                    `If you did not create this account, you can ignore this email.`
            });
        } catch (emailError) {
            await User.deleteOne({ _id: newUser._id });
            console.error("Verification email error:", emailError.message);

            return res.status(503).json({
                message: "Unable to send verification email. Please try again later."
            });
        }

        return res.status(201).json({
            message: "Registration successful! Check your email for the verification link."
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "An error occurred during registration."
        });
    }
});

module.exports = router;
