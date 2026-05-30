const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  family: 4,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("ScreenGuard API is running!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});