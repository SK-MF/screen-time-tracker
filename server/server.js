const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { auth, requiresAuth } = require("express-openid-connect");
require("dotenv").config();
const authRoutes = require("./routes/auth");

const app = express();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || process.env.JWT_SECRET,
  baseURL: "https://screenguard-api.onrender.com",
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
};

app.use(auth(config));

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://screentime-trackers.netlify.app"
  ],
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  family: 4,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);

// ── GOOGLE LOGIN CALLBACK ──
app.get("/api/google/callback", requiresAuth(), async (req, res) => {
  try {
    const { email, name, picture } = req.oidc.user;
    const User = require("./model/User");

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: name,
        email: email,
        password: "google-oauth",
        picture: picture
      });
      await user.save();
    }

    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`https://screentime-trackers.netlify.app?token=${token}&name=${encodeURIComponent(user.name)}`);

  } catch (err) {
    res.redirect("https://screentime-trackers.netlify.app?error=server_error");
  }
});

app.get("/api/google/login", (req, res) => {
  res.oidc.login({
    returnTo: "/api/google/callback"
  });
});

app.get("/", (req, res) => {
  res.send("ScreenGuard API is running!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});