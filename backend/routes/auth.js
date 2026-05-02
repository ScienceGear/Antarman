const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers, findByEmail } = require('../utils/fileStore');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (findByEmail(email))
    return res.status(409).json({ error: 'Email already registered' });

  const data = readUsers();
  const user = {
    id: uuidv4(),
    username: username.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
    stats: { totalSessions: 0, totalFocusMinutes: 0, dailyLog: {} },
    tasks: [],
    settings: { focusDuration: 25, shortBreak: 5, longBreak: 15, autoStart: false, soundEnabled: true }
  };
  data.users.push(user);
  writeUsers(data);
  res.status(201).json({ token: sign(user.id), username: user.username });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = findByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(user.id), username: user.username });
});

module.exports = router;
