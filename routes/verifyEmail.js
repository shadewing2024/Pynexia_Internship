
const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

router.get("/verify-email", async (req, res) => {
    try {
        const { token } = req.query;

        if (typeof token !== "string" || !token) {
            return res.status(400).send(
                "<h2>Invalid verification link</h2><p>Please check your email and try again.</p>"
            );
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            verificationTokenHash: tokenHash,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).send(
                "<h2>Link expired or invalid</h2><p>Please register again or request a new verification link.</p>"
            );
        }

        user.isVerified = true;
        user.verificationTokenHash = null;
        user.verificationTokenExpires = null;

        await user.save();

        return res.status(200).send(
            "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Email Verified</title></head><body style='font-family:Arial,sans-serif;text-align:center;padding:60px 20px;background:#f1f5f9;color:#172033'><h1 style='color:#15803d'>Email Verified Successfully!</h1><p>Your email has been verified. You can now return to the login page and sign in.</p><a href='/' style='display:inline-block;margin-top:16px;padding:12px 22px;background:#4338ca;color:white;text-decoration:none;border-radius:8px'>Go to Login</a></body></html>"
        );
    } catch (error) {
        console.error("Email verification error:", error.message);

        return res.status(500).send(
            "<h2>Something went wrong</h2><p>Please try again later.</p>"
        );
    }
});

module.exports = router;
