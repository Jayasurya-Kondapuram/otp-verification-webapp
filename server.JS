require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose"); // MongoDB

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ===== 1. MongoDB Setup =====
mongoose.connect("mongodb://localhost:27017/otpDB");

const OTPSchema = new mongoose.Schema({
    email: String,
    code: String,
    expiresAt: Date
});

const OTPModel = mongoose.model("OTP", OTPSchema);

// ===== 2. Gmail Email Setup =====
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS
}
});

// ===== 3. OTP Generation =====
function generateOTP() {
    return {
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)  // 5 minutes from now
    };
}

// ===== 4. Routes =====

// Send OTP Route
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required!" });

    const otpData = generateOTP();

    // Save OTP
    await OTPModel.create({
        email,
        code: otpData.code,
        expiresAt: otpData.expiresAt
    });

    try {
        // Send Email
        await transporter.sendMail({
            from: '"OTP Service" <jayasuryakondapuram@gmail.com>',
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otpData.code}. It expires in 5 minutes.`
        });
        console.log("✅ OTP sent to:", email);
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Email error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

// Verify OTP Route
app.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    console.log("🔍 Verifying OTP for:", email, "| Entered OTP:", otp);

    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required!" });

const otpRecord = await OTPModel.findOne({ email }).sort({ expiresAt: -1 });

    if (!otpRecord) {
        console.log("❌ No OTP record found");
        return res.status(401).json({ error: "OTP not found!" });
    }

    const now = new Date();
    const expires = new Date(otpRecord.expiresAt);

    console.log("NOW     :", now);
    console.log("EXPIRES :", expires);

    if (now.getTime() > expires.getTime()) {
        await OTPModel.deleteOne({ email });
        console.log("⏰ OTP expired");
        return res.status(401).json({ error: "OTP expired!" });
    }

    if (otpRecord.code === otp) {
        await OTPModel.deleteOne({ email });
        console.log("✅ OTP verified successfully");
        return res.json({ success: true });
    } else {
        console.log("❌ Invalid OTP entered");
        return res.status(401).json({ error: "Invalid OTP!" });
    }
});

// Serve Frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});
