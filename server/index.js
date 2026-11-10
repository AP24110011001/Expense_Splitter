// Import Express, Path, and File System modules
const express = require('express');
const path = require('path');
const fs = require('fs');
const { calculateSettlements } = require('../settle');

// Initialize the Express app
const app = express();
const PORT = 3000;

// Path to persistent data file
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Serve settle.js for client-side use
app.get('/settle.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../settle.js'));
});

// Default data template
const defaultData = {
  participants: ['Alice', 'Bob', 'Charlie'],
  expenses: [],
  nextExpenseId: 1
};

// In-memory data store
let appData = { ...defaultData };

// Helper function to load data from disk on startup
function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      appData = JSON.parse(content);
    } else {
      saveDataToFile();
    }
  } catch (err) {
    console.error('Error loading data file, using defaults:', err.message);
    appData = { ...defaultData };
  }
}

// Helper function to save current data to disk
function saveDataToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data to file:', err.message);
  }
}

// Load existing data immediately
loadDataFromFile();

// 1. GET /api/data - Retrieve all participants, expenses, and current settlements
app.get('/api/data', (req, res) => {
  const settlements = calculateSettlements(appData.participants, appData.expenses);
  res.json({
    participants: appData.participants,
    expenses: appData.expenses,
    settlements
  });
});

// 2. POST /api/participants - Add a new participant
app.post('/api/participants', (req, res) => {
  const { name } = req.body;
  const trimmed = (name || '').trim();

  if (!trimmed) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  // Prevent duplicate names (case-insensitive)
  const exists = appData.participants.some(
    p => p.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ error: 'Participant already exists' });
  }

  appData.participants.push(trimmed);
  saveDataToFile();
  res.json({ success: true, participants: appData.participants });
});

// 3. DELETE /api/participants/:name - Remove a participant
app.delete('/api/participants/:name', (req, res) => {
  const nameToRemove = decodeURIComponent(req.params.name);

  // Prevent removal if they paid for any logged expenses or are part of a split
  const hasExpenses = appData.expenses.some(
    e => e.paidBy === nameToRemove || (e.splitWith && e.splitWith.includes(nameToRemove))
  );
  if (hasExpenses) {
    return res.status(400).json({
      error: `Cannot remove ${nameToRemove} because they are linked to logged expenses.`
    });
  }

  appData.participants = appData.participants.filter(p => p !== nameToRemove);
  saveDataToFile();
  res.json({ success: true, participants: appData.participants });
});

// 4. POST /api/expenses - Add an expense
app.post('/api/expenses', (req, res) => {
  const { description, amount, paidBy, splitWith } = req.body;
  const numericAmount = parseFloat(amount);

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Description is required' });
  }
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  if (!paidBy || !appData.participants.includes(paidBy)) {
    return res.status(400).json({ error: 'Invalid payer selected' });
  }

  // Validate splitWith: default to all participants if not specified or empty
  let selectedSplitWith = Array.isArray(splitWith) && splitWith.length > 0
    ? splitWith.filter(p => appData.participants.includes(p))
    : [...appData.participants];

  if (selectedSplitWith.length === 0) {
    return res.status(400).json({ error: 'At least one participant must share the expense' });
  }

  const newExpense = {
    id: appData.nextExpenseId++,
    description: description.trim(),
    amount: numericAmount,
    paidBy: paidBy,
    splitWith: selectedSplitWith,
    date: new Date().toLocaleDateString()
  };

  appData.expenses.push(newExpense);
  saveDataToFile();
  res.json({ success: true, expense: newExpense });
});

// 5. DELETE /api/expenses/:id - Delete an expense
app.delete('/api/expenses/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  appData.expenses = appData.expenses.filter(e => e.id !== id);
  saveDataToFile();
  res.json({ success: true });
});

// 6. POST /api/reset - Reset everything back to defaults
app.post('/api/reset', (req, res) => {
  appData = {
    participants: ['Alice', 'Bob', 'Charlie'],
    expenses: [],
    nextExpenseId: 1
  };
  saveDataToFile();
  res.json({ success: true, message: 'All data reset to default' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
