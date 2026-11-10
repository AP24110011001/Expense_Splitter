/**
 * settle.js
 * Calculates the minimum number of payments to settle all debts
 * using the greedy approach (matching largest debtor with largest creditor).
 */

/**
 * Calculates net balances for each participant given participants and expenses.
 * @param {string[]} participants - List of participant names
 * @param {Array<{amount: number, paidBy: string, splitWith?: string[]}>} expenses
 * @returns {Record<string, number>} Map of participant name to net balance (+ is owed, - owes)
 */
function calculateBalances(participants, expenses) {
  const balances = {};
  participants.forEach(p => {
    balances[p] = 0;
  });

  expenses.forEach(e => {
    // Credit the payer
    if (balances[e.paidBy] !== undefined) {
      balances[e.paidBy] += e.amount;
    }

    // Determine who shares this expense
    const sharers = (e.splitWith && e.splitWith.length > 0)
      ? e.splitWith.filter(p => participants.includes(p))
      : participants;

    // Debit each sharer their equal share
    if (sharers.length > 0) {
      const share = e.amount / sharers.length;
      sharers.forEach(p => {
        if (balances[p] !== undefined) {
          balances[p] -= share;
        }
      });
    }
  });

  return balances;
}

/**
 * Computes the minimum payments to settle all debts using a greedy algorithm.
 * @param {Record<string, number>} balances - Map of person to net balance
 * @returns {Array<{from: string, to: string, amount: number}>} List of settlement transactions
 */
function settleDebts(balances) {
  const settlements = [];

  // Separate participants into debtors (owe money) and creditors (owed money)
  const debtors = [];
  const creditors = [];

  const EPSILON = 0.005; // Threshold for floating point precision

  Object.entries(balances).forEach(([name, balance]) => {
    if (balance > EPSILON) {
      creditors.push({ name, amount: balance });
    } else if (balance < -EPSILON) {
      debtors.push({ name, amount: -balance });
    }
  });

  // Greedily match largest debtor with largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    // Settle the smaller of what debtor owes and creditor is owed
    const payment = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(payment * 100) / 100
    });

    debtor.amount -= payment;
    creditor.amount -= payment;

    // Remove if settled
    if (debtor.amount <= EPSILON) {
      debtors.shift();
    }
    if (creditor.amount <= EPSILON) {
      creditors.shift();
    }
  }

  return settlements;
}

/**
 * Convenience helper that accepts either (participants, expenses) or a balances map.
 */
function calculateSettlements(arg1, arg2) {
  if (Array.isArray(arg1) && Array.isArray(arg2)) {
    const balances = calculateBalances(arg1, arg2);
    return settleDebts(balances);
  } else if (typeof arg1 === 'object' && arg1 !== null) {
    return settleDebts(arg1);
  }
  return [];
}

// Support both Node.js (CommonJS) and browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateBalances,
    settleDebts,
    calculateSettlements
  };
}

if (typeof window !== 'undefined') {
  window.settle = {
    calculateBalances,
    settleDebts,
    calculateSettlements
  };
}

