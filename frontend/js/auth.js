const API = '/api';

// Redirect if already logged in
if (localStorage.getItem('antarman_token')) location.href = 'app.html';

const errorMsg = document.getElementById('error-msg');
const showError = (msg) => { errorMsg.textContent = msg; errorMsg.hidden = false; };
const hideError = () => { errorMsg.hidden = true; };

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    document.getElementById('login-form').hidden = !isLogin;
    document.getElementById('register-form').hidden = isLogin;
    hideError();
  });
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const btn = document.getElementById('login-btn');
  btn.disabled = true; btn.textContent = 'Logging in…';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('l-email').value,
        password: document.getElementById('l-password').value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('antarman_token', data.token);
    localStorage.setItem('antarman_username', data.username);
    location.href = 'app.html';
  } catch (err) {
    showError(err.message);
    btn.disabled = false; btn.textContent = 'Login';
  }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  const password = document.getElementById('r-password').value;
  const confirm = document.getElementById('r-confirm').value;
  if (password !== confirm) return showError('Passwords do not match');
  const btn = document.getElementById('register-btn');
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('r-username').value,
        email: document.getElementById('r-email').value,
        password
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('antarman_token', data.token);
    localStorage.setItem('antarman_username', data.username);
    location.href = 'app.html';
  } catch (err) {
    showError(err.message);
    btn.disabled = false; btn.textContent = 'Create Account';
  }
});
