/**
 * test-settle.js
 * Test suite to verify settle.js greedy debt simplification logic
 */

const assert = require('assert');
const { calculateBalances, settleDebts, calculateSettlements } = require('./settle');

console.log('Running settle.js tests...\n');

// Test Case 1: Simple two-person debt
{
  console.log('Test 1: Two people (Bob owes Alice $20)');
  const balances = { Alice: 20, Bob: -20 };
  const settlements = settleDebts(balances);

  assert.strictEqual(settlements.length, 1);
  assert.deepStrictEqual(settlements[0], { from: 'Bob', to: 'Alice', amount: 20 });
  console.log('✔ Passed\n');
}

// Test Case 2: Three people circular / equal split
{
  console.log('Test 2: Three people ($60 dinner paid by Alice, split equally)');
  const participants = ['Alice', 'Bob', 'Charlie'];
  const expenses = [
    { amount: 60, paidBy: 'Alice', splitWith: ['Alice', 'Bob', 'Charlie'] }
  ];

  const settlements = calculateSettlements(participants, expenses);

  assert.strictEqual(settlements.length, 2);
  // Both Bob and Charlie owe $20 to Alice
  const bobPay = settlements.find(s => s.from === 'Bob');
  const charliePay = settlements.find(s => s.from === 'Charlie');

  assert.ok(bobPay && bobPay.to === 'Alice' && bobPay.amount === 20);
  assert.ok(charliePay && charliePay.to === 'Alice' && charliePay.amount === 20);
  console.log('✔ Passed\n');
}

// Test Case 3: Greedy matching with multiple debts (simplifies transactions)
{
  console.log('Test 3: Multi-person debt simplification');
  // Alice is owed 50, Bob is owed 20, Charlie owes 40, David owes 30
  const balances = {
    Alice: 50,
    Bob: 20,
    Charlie: -40,
    David: -30
  };

  const settlements = settleDebts(balances);

  // Largest debtor Charlie (-40) matches with largest creditor Alice (+50): Charlie pays Alice 40
  // Next largest debtor David (-30) pays Alice 10 (Alice settled), then David pays Bob 20 (both settled)
  // Total transactions should be 3
  assert.strictEqual(settlements.length, 3);

  const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
  assert.strictEqual(totalSettled, 70);
  console.log('✔ Passed\n');
}

// Test Case 4: Zero debts / everyone settled
{
  console.log('Test 4: Everyone already settled up');
  const balances = { Alice: 0, Bob: 0 };
  const settlements = settleDebts(balances);

  assert.strictEqual(settlements.length, 0);
  console.log('✔ Passed\n');
}

console.log('All tests in test-settle.js passed successfully! 🎉');

