const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../model/User");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// ── REGISTER ──
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ──
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, name: user.name });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FORGOT PASSWORD ──
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email not found" });

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.resetCode = code;
    user.resetCodeExpiry = expiry;
    await user.save();

    // Send email
    await sendEmail(
      email,
      "ScreenGuard - Password Reset Code",
      `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color: #378add;">ScreenGuard</h2>
          <p>Your password reset code is:</p>
          <h1 style="letter-spacing: 8px; color: #0a0f1e;">${code}</h1>
          <p style="color: #888;">This code expires in 15 minutes.</p>
          <p style="color: #888;">If you didn't request this, ignore this email.</p>
        </div>
      `
    );

    res.json({ message: "Reset code sent to your email" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── VERIFY CODE ──
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email not found" });

    if (user.resetCode !== code) {
      return res.status(400).json({ error: "Invalid code" });
    }

    if (Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ error: "Code has expired" });
    }

    res.json({ message: "Code verified" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RESET PASSWORD ──
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email not found" });

    if (user.resetCode !== code || Date.now() > user.resetCodeExpiry) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;