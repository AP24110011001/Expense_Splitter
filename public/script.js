// DOM Elements - Participants
const personInput = document.getElementById('personInput');
const addPersonBtn = document.getElementById('addPersonBtn');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');

// DOM Elements - Expense Form
const expenseForm = document.getElementById('expenseForm');
const expenseDesc = document.getElementById('expenseDesc');
const expenseAmount = document.getElementById('expenseAmount');
const paidBySelect = document.getElementById('paidBySelect');
const splitCheckboxes = document.getElementById('splitCheckboxes');

// DOM Elements - Summaries & Settlements
const totalSpentEl = document.getElementById('totalSpent');
const fairShareEl = document.getElementById('fairShare');
const balancesList = document.getElementById('balancesList');
const settlementsList = document.getElementById('settlementsList');

// DOM Elements - Expense History Table
const expensesTableBody = document.getElementById('expensesTableBody');
const noExpensesMsg = document.getElementById('noExpensesMsg');
const expenseCount = document.getElementById('expenseCount');

// DOM Elements - Reset
const resetBtn = document.getElementById('resetBtn');

// Local state cache
let currentParticipants = [];

// Fetch and refresh all data from the server
async function loadData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();

    const participants = data.participants || [];
    const expenses = data.expenses || [];
    // Use server settlements or compute via settle.js if available
    const settlements = data.settlements || (window.settle ? window.settle.calculateSettlements(participants, expenses) : []);

    currentParticipants = participants;

    // Refresh all UI components from server data
    renderParticipants(participants);
    renderPayerDropdown(participants);
    renderSplitCheckboxes(participants);
    renderExpenses(expenses, participants);
    renderSummary(participants, expenses);
    renderSettlements(settlements, expenses);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// 1. Render Participants as tags and update the friend count badge
function renderParticipants(participants) {
  // Update the counter badge
  if (participantCount) {
    const count = participants.length;
    participantCount.textContent = `${count} Friend${count === 1 ? '' : 's'}`;
  }

  participantsList.innerHTML = '';
  if (participants.length === 0) {
    participantsList.innerHTML = '<span class="text-muted">No participants added yet.</span>';
    return;
  }

  participants.forEach((name) => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `
      ${escapeHtml(name)}
      <span class="tag-remove" title="Remove ${escapeHtml(name)}">&times;</span>
    `;

    // Click handler to remove participant
    tag.querySelector('.tag-remove').addEventListener('click', () => removeParticipant(name));
    participantsList.appendChild(tag);
  });
}

// 2. Populate the "Paid By" dropdown
function renderPayerDropdown(participants) {
  paidBySelect.innerHTML = '';
  if (participants.length === 0) {
    paidBySelect.innerHTML = '<option value="">No participants</option>';
    return;
  }

  participants.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    paidBySelect.appendChild(option);
  });
}

// 3. Render checkboxes for selecting who shares an expense (default: all checked)
function renderSplitCheckboxes(participants) {
  splitCheckboxes.innerHTML = '';
  if (participants.length === 0) {
    splitCheckboxes.innerHTML = '<span class="text-muted">Add participants above to split expenses.</span>';
    return;
  }

  participants.forEach((name) => {
    const label = document.createElement('label');
    label.className = 'checkbox-tag';
    label.innerHTML = `
      <input type="checkbox" name="splitParticipant" value="${escapeHtml(name)}" checked>
      <span>${escapeHtml(name)}</span>
    `;
    splitCheckboxes.appendChild(label);
  });
}

// 4. Render the expense history table and update the expense count badge
function renderExpenses(expenses, participants) {
  // Update the expense counter badge
  if (expenseCount) {
    const count = expenses.length;
    expenseCount.textContent = `${count} Expense${count === 1 ? '' : 's'}`;
  }

  expensesTableBody.innerHTML = '';
  if (expenses.length === 0) {
    noExpensesMsg.style.display = 'block';
    return;
  }

  noExpensesMsg.style.display = 'none';

  expenses.forEach((expense) => {
    // Determine split display text
    const sharers = expense.splitWith || participants;
    const splitText = (sharers.length === participants.length && participants.length > 0)
      ? 'All'
      : sharers.join(', ');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(expense.description)}</td>
      <td><strong>${escapeHtml(expense.paidBy)}</strong></td>
      <td><span class="split-badge">${escapeHtml(splitText)}</span></td>
      <td>${escapeHtml(expense.date || '-')}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>
        <button class="btn btn-delete" data-id="${expense.id}">Delete</button>
      </td>
    `;

    // Click handler for delete button
    row.querySelector('.btn-delete').addEventListener('click', () => deleteExpense(expense.id));
    expensesTableBody.appendChild(row);
  });
}

// 5. Calculate total, individual shares, and net balances
function renderSummary(participants, expenses) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const count = participants.length;

  totalSpentEl.textContent = `$${total.toFixed(2)}`;
  const avgCost = count > 0 ? total / count : 0;
  fairShareEl.textContent = `$${avgCost.toFixed(2)}`;

  // Track what each participant paid, and what each owes
  const paidMap = {};
  const owedMap = {};
  participants.forEach(p => {
    paidMap[p] = 0;
    owedMap[p] = 0;
  });

  expenses.forEach(e => {
    // 1. Credit the payer
    if (paidMap[e.paidBy] !== undefined) {
      paidMap[e.paidBy] += e.amount;
    }

    // 2. Debit each selected sharer their equal portion
    const sharers = (e.splitWith && e.splitWith.length > 0)
      ? e.splitWith.filter(p => participants.includes(p))
      : participants;

    if (sharers.length > 0) {
      const splitPortion = e.amount / sharers.length;
      sharers.forEach(person => {
        if (owedMap[person] !== undefined) {
          owedMap[person] += splitPortion;
        }
      });
    }
  });

  balancesList.innerHTML = '';
  if (count === 0) {
    balancesList.innerHTML = '<p class="empty-state">Add at least one participant to view settlement.</p>';
    return;
  }

  participants.forEach((person) => {
    const paid = paidMap[person] || 0;
    const owed = owedMap[person] || 0;
    const balance = paid - owed; // Positive: person is owed money; Negative: person owes money

    const div = document.createElement('div');
    div.className = 'balance-row';

    let statusText = '';
    let statusClass = 'balance-zero';

    if (balance > 0.009) {
      statusClass = 'balance-positive';
      statusText = `gets back $${balance.toFixed(2)}`;
    } else if (balance < -0.009) {
      statusClass = 'balance-negative';
      statusText = `owes $${Math.abs(balance).toFixed(2)}`;
    } else {
      statusText = 'settled up ($0.00)';
    }

    div.innerHTML = `
      <span><strong>${escapeHtml(person)}</strong> (paid $${paid.toFixed(2)}, share: $${owed.toFixed(2)})</span>
      <span class="${statusClass}">${statusText}</span>
    `;

    balancesList.appendChild(div);
  });
}

// 6. Render the minimum payment settlement plan ("Who Pays Whom")
function renderSettlements(settlements, expenses) {
  if (!settlementsList) return;

  settlementsList.innerHTML = '';

  if (expenses.length === 0) {
    settlementsList.innerHTML = '<p class="empty-state">No expenses yet. Add an expense above to calculate settlements.</p>';
    return;
  }

  if (settlements.length === 0) {
    settlementsList.innerHTML = '<p class="empty-state">🎉 All settled up! No outstanding payments required.</p>';
    return;
  }

  settlements.forEach((s) => {
    const row = document.createElement('div');
    row.className = 'settlement-row';
    row.innerHTML = `
      <span class="settlement-direction">
        <strong>${escapeHtml(s.from)}</strong>
        <span class="settlement-arrow">&rarr; pays &rarr;</span>
        <strong>${escapeHtml(s.to)}</strong>
      </span>
      <span class="settlement-amount">$${s.amount.toFixed(2)}</span>
    `;
    settlementsList.appendChild(row);
  });
}

// Helper to escape HTML and prevent injection
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Action: Add Participant
addPersonBtn.addEventListener('click', async () => {
  const name = personInput.value.trim();
  if (!name) return;

  try {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to add participant');
      return;
    }

    personInput.value = '';
    loadData();
  } catch (err) {
    console.error('Error adding participant:', err);
  }
});

// Action: Remove Participant
async function removeParticipant(name) {
  try {
    const res = await fetch(`/api/participants/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to remove participant');
      return;
    }

    loadData();
  } catch (err) {
    console.error('Error removing participant:', err);
  }
}

// Action: Add Expense
expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const description = expenseDesc.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const paidBy = paidBySelect.value;

  // Collect checked participants for this expense
  const checkedBoxes = Array.from(document.querySelectorAll('input[name="splitParticipant"]:checked'));
  const splitWith = checkedBoxes.map(cb => cb.value);

  if (!description || isNaN(amount) || !paidBy) {
    alert('Please complete all expense fields.');
    return;
  }

  if (splitWith.length === 0) {
    alert('Please select at least one person who shares this expense.');
    return;
  }

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, paidBy, splitWith })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Failed to add expense');
      return;
    }

    // Reset description & amount, restore all checkboxes to checked
    expenseDesc.value = '';
    expenseAmount.value = '';
    document.querySelectorAll('input[name="splitParticipant"]').forEach(cb => (cb.checked = true));
    loadData();
  } catch (err) {
    console.error('Error adding expense:', err);
  }
});

// Action: Delete Expense
async function deleteExpense(id) {
  try {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      loadData();
    }
  } catch (err) {
    console.error('Error deleting expense:', err);
  }
}

// Action: Reset Data
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset all participants and expenses back to default?')) {
      return;
    }
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error resetting data:', err);
    }
  });
}

// Initial load on page ready
loadData();
