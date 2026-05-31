const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const API_URL = "https://your-render-url.onrender.com/api/auth";

// ── TAB SWITCHER ──
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) =>
    t.classList.toggle('active', i === (tab === 'login' ? 0 : 1))
  );
  document.getElementById('login-panel').classList.toggle('active', tab === 'login');
  document.getElementById('register-panel').classList.toggle('active', tab === 'register');
  document.getElementById('formTitle').textContent = tab === 'login' ? 'Welcome back' : 'Create account';
  document.getElementById('formSub').textContent = tab === 'login'
    ? 'Track your screen time, protect your focus.'
    : 'Join thousands building better screen habits.';
}

// ── REGISTER ──
async function handleRegister() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const msg = document.getElementById('registerMessage');

  if (!name || !email || !password) {
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const res = await fetch(API_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || 'Something went wrong.';
      msg.classList.remove('success');
      return;
    }

    msg.textContent = 'Account created! Please login.';
    msg.classList.add('success');
    setTimeout(() => switchTab('login'), 1500);

  } catch (err) {
    msg.textContent = 'Server error. Is your server running?';
  }
}

// ── LOGIN ──
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const msg = document.getElementById('loginMessage');

  if (!email || !password) {
    msg.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const res = await fetch(API_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || 'Invalid email or password.';
      msg.classList.remove('success');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    showApp(data.name);

  } catch (err) {
    msg.textContent = 'Server error. Is your server running?';
  }
}

// ── SHOW APP ──
function showApp(name) {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display = 'block';
  document.getElementById('welcomeMsg').textContent = `Welcome back, ${name}! 👋`;
}

// ── AUTO LOGIN IF TOKEN EXISTS ──
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');
  if (token) showApp(name);
});

// ── LOGOUT ──
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  document.getElementById('appPage').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
});

// ── TIMER ──
let seconds = 0;
const timerElement = document.getElementById('timer');

if (Notification.permission !== 'granted') Notification.requestPermission();

function updateTimer() {
  seconds++;
  let hrs = Math.floor(seconds / 3600);
  let mins = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;
  timerElement.textContent =
    String(hrs).padStart(2, '0') + ':' +
    String(mins).padStart(2, '0') + ':' +
    String(secs).padStart(2, '0');
  if (seconds % 3600 === 0) {
    if (Notification.permission === 'granted') {
      new Notification('Time for a Break!', {
        body: "You've been using your device for 1 hour. Take a 5-minute break."
      });
    }
  }
}

setInterval(updateTimer, 1000);
document.getElementById('resetBtn').addEventListener('click', () => { seconds = 0; });