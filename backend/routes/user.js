const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/authMiddleware');
const { findById, updateUser } = require('../utils/fileStore');

router.use(auth);

const getUser = (req, res) => {
  const u = findById(req.userId);
  if (!u) { res.status(404).json({ error: 'User not found' }); return null; }
  return u;
};

// Profile
router.get('/profile', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const { passwordHash, ...safe } = u;
  res.json(safe);
});

// Settings
router.put('/settings', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const allowed = ['focusDuration','shortBreak','longBreak','autoStart','soundEnabled'];
  const updated = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updated[k] = req.body[k]; });
  const user = updateUser(u.id, { settings: { ...u.settings, ...updated } });
  res.json(user.settings);
});

// Tasks
router.get('/tasks', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  res.json(u.tasks);
});

router.post('/tasks', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  const task = { id: uuidv4(), text: text.trim(), completed: false, createdAt: new Date().toISOString() };
  const user = updateUser(u.id, { tasks: [...u.tasks, task] });
  res.status(201).json(task);
});

router.patch('/tasks/:id', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const tasks = u.tasks.map(t =>
    t.id === req.params.id
      ? { ...t, ...(req.body.text !== undefined && { text: req.body.text }),
               ...(req.body.completed !== undefined && { completed: req.body.completed }) }
      : t
  );
  updateUser(u.id, { tasks });
  res.json(tasks.find(t => t.id === req.params.id) || {});
});

router.delete('/tasks/:id', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  updateUser(u.id, { tasks: u.tasks.filter(t => t.id !== req.params.id) });
  res.json({ ok: true });
});

// Session logging
router.post('/session', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const mins = Number(req.body.minutes) || 0;
  const today = new Date().toISOString().slice(0, 10);
  const log = { ...u.stats.dailyLog };
  log[today] = { sessions: (log[today]?.sessions || 0) + 1, minutes: (log[today]?.minutes || 0) + mins };
  const stats = {
    totalSessions: u.stats.totalSessions + 1,
    totalFocusMinutes: u.stats.totalFocusMinutes + mins,
    dailyLog: log
  };
  const user = updateUser(u.id, { stats });
  res.json(user.stats);
});

// Stats
router.get('/stats', (req, res) => {
  const u = getUser(req, res); if (!u) return;
  const today = new Date().toISOString().slice(0, 10);
  res.json({ ...u.stats, today: u.stats.dailyLog[today] || { sessions: 0, minutes: 0 } });
});

module.exports = router;
