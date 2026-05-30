const API_URL = "https://screenguard-api.onrender.com/api/auth";

// ─── AUTH LOGIC ───────────────────────────────────────────
let isLogin = true;

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");
const authTitle = document.getElementById("authTitle");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const authBtn = document.getElementById("authBtn");
const authMessage = document.getElementById("authMessage");
const toggleLink = document.getElementById("toggleLink");
const welcomeMsg = document.getElementById("welcomeMsg");

// Toggle between Login and Register
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? "Login" : "Register";
  authBtn.textContent = isLogin ? "Login" : "Register";
  nameInput.style.display = isLogin ? "none" : "block";
  toggleLink.textContent = isLogin ? "Register" : "Login";
  document.querySelector("#toggleAuth").firstChild.textContent = isLogin
    ? "Don't have an account? "
    : "Already have an account? ";
});

// Login or Register
authBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const name = nameInput.value.trim();

  if (!email || !password || (!isLogin && !name)) {
    authMessage.textContent = "Please fill in all fields.";
    return;
  }

  const endpoint = isLogin ? "/login" : "/register";
  const body = isLogin ? { email, password } : { name, email, password };

  try {
    const res = await fetch(API_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      authMessage.textContent = data.error || "Something went wrong.";
      return;
    }

    if (isLogin) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("name", data.name);
      showApp(data.name);
    } else {
      authMessage.style.color = "green";
      authMessage.textContent = "Registered! Please login.";
      toggleLink.click(); // switch to login
    }

  } catch (err) {
    authMessage.textContent = "Server error. Is your server running?";
  }
});

// Show app if already logged in
window.addEventListener("load", () => {
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  if (token) {
    showApp(name);
  }
});

function showApp(name) {
  authScreen.style.display = "none";
  appScreen.style.display = "block";
  welcomeMsg.textContent = `Welcome back, ${name}! 👋`;
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
  appScreen.style.display = "none";
  authScreen.style.display = "block";
  emailInput.value = "";
  passwordInput.value = "";
});

// ─── TIMER LOGIC ───────────────────────────────────────────
let seconds = 0;
const timerElement = document.getElementById("timer");
const resetBtn = document.getElementById("resetBtn");

if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

function updateTimer() {
  seconds++;
  let hrs = Math.floor(seconds / 3600);
  let mins = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;

  timerElement.textContent =
    String(hrs).padStart(2, "0") + ":" +
    String(mins).padStart(2, "0") + ":" +
    String(secs).padStart(2, "0");

  if (seconds % 3600 === 0) sendBreakNotification();
}

function sendBreakNotification() {
  if (Notification.permission === "granted") {
    new Notification("Time for a Break!", {
      body: "You've been using your device for 1 hour. Take a 5-minute break."
    });
  }
}

setInterval(updateTimer, 1000);
resetBtn.addEventListener("click", () => { seconds = 0; });