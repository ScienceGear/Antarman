require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Antarman → http://localhost:${PORT}`));
