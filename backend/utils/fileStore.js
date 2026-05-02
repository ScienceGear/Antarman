const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../data/users.json');

function readUsers() {
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ users: [] }));
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

function writeUsers(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function findByEmail(email) {
  return readUsers().users.find(u => u.email === email.toLowerCase());
}

function findById(id) {
  return readUsers().users.find(u => u.id === id);
}

function updateUser(id, fields) {
  const data = readUsers();
  const idx = data.users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  data.users[idx] = { ...data.users[idx], ...fields };
  writeUsers(data);
  return data.users[idx];
}

module.exports = { readUsers, writeUsers, findByEmail, findById, updateUser };
