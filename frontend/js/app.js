const API = '/api';
const token = localStorage.getItem('antarman_token');
if (!token) location.href = 'index.html';

const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });
const apiFetch = (url, opts = {}) => fetch(API + url, { ...opts, headers: headers() }).then(r => r.json());

const QUOTES = [
  '"The secret of getting ahead is getting started." — Mark Twain',
  '"Focus on being productive instead of busy." — Tim Ferriss',
  '"It\'s not about having time. It\'s about making time." — Unknown',
  '"Do the hard jobs first. The easy jobs will take care of themselves." — Dale Carnegie',
  '"You don\'t have to be great to start, but you have to start to be great." — Zig Ziglar',
  '"Concentrate all your thoughts upon the work at hand." — Alexander Graham Bell',
  '"Action is the foundational key to all success." — Pablo Picasso',
  '"Either you run the day or the day runs you." — Jim Rohn',
  '"The way to get started is to quit talking and begin doing." — Walt Disney',
  '"Your future is created by what you do today, not tomorrow." — Robert Kiyosaki'
];

// --- STATE ---
let cfg = { focusDuration: 25, shortBreak: 5, longBreak: 15, autoStart: false, soundEnabled: true };
let mode = 'focus';
let totalSecs = 1500, remaining = 1500, running = false, interval = null;
let sessionCount = 1, focusRound = 0, quoteIdx = 0;
let tasks = [], activeTaskId = null;
const CIRC = 785.4;

// --- DOM ---
const $ = id => document.getElementById(id);
const timeDisplay = $('time-display'), modeLabel = $('mode-label'), sessionCounter = $('session-counter');
const ringFg = $('ring-fg'), ringWrap = $('ring-wrap');
const startBtn = $('start-btn'), resetBtn = $('reset-btn');
const activeTaskEl = $('active-task'), quoteEl = $('quote');
const taskInput = $('task-input'), taskList = $('task-list');

// --- INIT ---
async function init() {
  document.getElementById('username-display').textContent = localStorage.getItem('antarman_username') || '';
  document.getElementById('avatar').textContent = (localStorage.getItem('antarman_username') || '?')[0].toUpperCase();

  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();

  const [profile, stats] = await Promise.all([apiFetch('/user/profile'), apiFetch('/user/stats')]);
  cfg = { ...cfg, ...profile.settings };
  updateStats(stats);
  tasks = profile.tasks || [];
  renderTasks();
  setMode('focus', false);
  showQuote();
  syncSettingsUI();
}

// --- TIMER ---
function setMode(m, reset = true) {
  mode = m;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === m));
  if (reset) { clearInterval(interval); running = false; startBtn.textContent = '▶ Start'; ringWrap.classList.remove('running'); }
  const mins = m === 'focus' ? cfg.focusDuration : m === 'short' ? cfg.shortBreak : cfg.longBreak;
  totalSecs = mins * 60; remaining = totalSecs;
  modeLabel.textContent = m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break';
  ringFg.style.stroke = m === 'focus' ? '#7c3aed' : '#06b6d4';
  updateDisplay(); updateRing();
}

function updateDisplay() {
  const m = Math.floor(remaining / 60), s = remaining % 60;
  timeDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  document.title = `${timeDisplay.textContent} — Antarman`;
}

function updateRing() {
  ringFg.style.strokeDashoffset = CIRC * (1 - remaining / totalSecs);
}

function tick() {
  if (remaining <= 0) { onSessionEnd(); return; }
  remaining--; updateDisplay(); updateRing();
}

function toggleTimer() {
  if (running) {
    clearInterval(interval); running = false;
    startBtn.textContent = '▶ Start'; ringWrap.classList.remove('running');
  } else {
    interval = setInterval(tick, 1000); running = true;
    startBtn.textContent = '⏸ Pause'; ringWrap.classList.add('running');
  }
}

function resetTimer() {
  clearInterval(interval); running = false;
  startBtn.textContent = '▶ Start'; ringWrap.classList.remove('running');
  setMode(mode, false);
}

async function onSessionEnd() {
  clearInterval(interval); running = false;
  startBtn.textContent = '▶ Start'; ringWrap.classList.remove('running');
  playBell(); notify();

  if (mode === 'focus') {
    focusRound++; sessionCount++;
    sessionCounter.textContent = `Session ${sessionCount} of 4`;
    showQuote();
    const stats = await apiFetch('/user/session', {
      method: 'POST', body: JSON.stringify({ minutes: cfg.focusDuration })
    });
    updateStats(stats);
    setMode(focusRound % 4 === 0 ? 'long' : 'short', true);
  } else {
    setMode('focus', true);
  }
  if (cfg.autoStart) setTimeout(toggleTimer, 800);
}

// --- STATS ---
function updateStats(s) {
  $('stat-today-sessions').textContent = s.today?.sessions ?? 0;
  $('stat-today-mins').textContent = s.today?.minutes ?? 0;
  $('stat-total-sessions').textContent = s.totalSessions ?? 0;
  $('stat-total-mins').textContent = s.totalFocusMinutes ?? 0;
}

// --- TASKS ---
async function loadTasks() {
  tasks = await apiFetch('/user/tasks');
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'task-item' + (t.id === activeTaskId ? ' active-item' : '');

    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = t.completed;
    cb.addEventListener('change', async (e) => {
      e.stopPropagation();
      await apiFetch(`/user/tasks/${t.id}`, { method: 'PATCH', body: JSON.stringify({ completed: cb.checked }) });
      t.completed = cb.checked; renderTasks();
    });

    const span = document.createElement('span');
    span.className = 'task-text' + (t.completed ? ' done' : '');
    span.textContent = t.text;

    const del = document.createElement('button'); del.className = 'task-del'; del.textContent = '✕';
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      await apiFetch(`/user/tasks/${t.id}`, { method: 'DELETE' });
      tasks = tasks.filter(x => x.id !== t.id);
      if (activeTaskId === t.id) { activeTaskId = null; updateActiveLabel(); }
      renderTasks();
    });

    li.addEventListener('click', () => {
      activeTaskId = activeTaskId === t.id ? null : t.id;
      updateActiveLabel(); renderTasks();
    });

    li.append(cb, span, del);
    taskList.appendChild(li);
  });
  updateActiveLabel();
}

function updateActiveLabel() {
  const t = tasks.find(x => x.id === activeTaskId);
  activeTaskEl.textContent = t ? `🎯 ${t.text}` : 'No task selected — pick one below';
}

async function addTask() {
  const text = taskInput.value.trim(); if (!text) return;
  const task = await apiFetch('/user/tasks', { method: 'POST', body: JSON.stringify({ text }) });
  tasks.unshift(task); taskInput.value = ''; renderTasks();
}

// --- SETTINGS ---
function syncSettingsUI() {
  $('s-focus').value = cfg.focusDuration;
  $('s-short').value = cfg.shortBreak;
  $('s-long').value = cfg.longBreak;
  $('s-auto').checked = cfg.autoStart;
  $('s-sound').checked = cfg.soundEnabled;
}

async function saveSettings() {
  cfg.focusDuration = Math.max(1, parseInt($('s-focus').value) || 25);
  cfg.shortBreak = Math.max(1, parseInt($('s-short').value) || 5);
  cfg.longBreak = Math.max(1, parseInt($('s-long').value) || 15);
  cfg.autoStart = $('s-auto').checked;
  cfg.soundEnabled = $('s-sound').checked;
  await apiFetch('/user/settings', { method: 'PUT', body: JSON.stringify(cfg) });
  $('settings-overlay').classList.remove('open');
  setMode(mode, true);
}

// --- SOUND ---
function playBell() {
  if (!cfg.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach(t => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.8);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.8);
    });
  } catch {}
}

function notify() {
  if (Notification.permission === 'granted')
    new Notification('Antarman', { body: mode === 'focus' ? 'Focus done! Take a break.' : 'Break over! Time to focus.' });
}

function showQuote() {
  quoteEl.style.opacity = 0;
  setTimeout(() => { quoteEl.textContent = QUOTES[quoteIdx++ % QUOTES.length]; quoteEl.style.opacity = 1; }, 400);
}

// --- EVENTS ---
startBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
document.querySelectorAll('.mode-tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
document.getElementById('add-task-btn').addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
$('gear-btn').addEventListener('click', () => { syncSettingsUI(); $('settings-overlay').classList.add('open'); });
$('close-settings').addEventListener('click', () => $('settings-overlay').classList.remove('open'));
$('settings-overlay').addEventListener('click', e => { if (e.target === $('settings-overlay')) $('settings-overlay').classList.remove('open'); });
$('save-settings').addEventListener('click', saveSettings);
$('logout-btn').addEventListener('click', () => { localStorage.clear(); location.href = 'index.html'; });
document.addEventListener('keydown', e => { if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); toggleTimer(); } });

init();
