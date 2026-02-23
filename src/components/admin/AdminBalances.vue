<template>
  <div class="balances-section">
    <div class="balance-form-card">
      <h3>Manage Player Balance</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Select Player</label>
          <select v-model="selectedPlayerId" class="select-input">
            <option value="">-- Choose player --</option>
            <option v-for="p in allPlayers" :key="p.id" :value="p.id">
              {{ p.name }} (@{{ p.login }}) — {{ formatBalance(p.balance) }}$
            </option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount ($)</label>
          <input v-model.number="amount" type="number" min="0" step="0.01" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label>Note (optional)</label>
          <input v-model="note" placeholder="Reason for transaction" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-deposit" @click="deposit" :disabled="!canSubmit">
          + Deposit
        </button>
        <button class="btn-withdraw" @click="withdraw" :disabled="!canSubmit">
          - Withdraw
        </button>
      </div>
      <div v-if="message" :class="['feedback', messageType]">{{ message }}</div>
    </div>

    <div class="recent-section">
      <h3>Recent Balance Operations</h3>
      <div class="table-wrapper">
        <table v-if="transactions.length">
          <thead>
            <tr>
              <th>Date</th>
              <th>Player</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions.slice(0, 20)" :key="tx.id">
              <td>{{ formatDate(tx.createdAt) }}</td>
              <td>{{ getPlayerName(tx.playerId) }}</td>
              <td>
                <span :class="['type-badge', tx.type]">{{ tx.type }}</span>
              </td>
              <td :class="tx.type === 'deposit' ? 'amount-green' : 'amount-red'">
                {{ tx.type === 'deposit' ? '+' : '-' }}{{ formatBalance(tx.amount) }}$
              </td>
              <td>{{ tx.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">No operations yet</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import store from '@/core/state/store.js';
import { DECIMALS } from '@/core/constants.js';

const selectedPlayerId = ref('');
const amount = ref(null);
const note = ref('');
const message = ref('');
const messageType = ref('success');

const allPlayers = computed(() => store.getters['admin/getAllPlayers']);
const transactions = computed(() => store.getters['admin/getTransactions']);

const canSubmit = computed(() => selectedPlayerId.value && amount.value > 0);

function deposit() {
  store.dispatch('admin/depositToPlayer', {
    playerId: selectedPlayerId.value,
    amount: amount.value,
    note: note.value,
  });
  showFeedback(`Deposited ${amount.value}$ to player`, 'success');
  resetForm();
}

function withdraw() {
  store.dispatch('admin/withdrawFromPlayer', {
    playerId: selectedPlayerId.value,
    amount: amount.value,
    note: note.value,
  });
  showFeedback(`Withdrawn ${amount.value}$ from player`, 'success');
  resetForm();
}

function showFeedback(msg, type) {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 3000);
}

function resetForm() {
  amount.value = null;
  note.value = '';
}

function getPlayerName(playerId) {
  const player = allPlayers.value.find(p => p.id === playerId);
  return player ? `${player.name} (@${player.login})` : playerId;
}

function formatBalance(val) {
  return (val / (10 ** DECIMALS)).toFixed(2);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
</script>

<style scoped>
.balance-form-card {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.balance-form-card h3 {
  margin: 0 0 20px;
  font-size: 16px;
  color: #ccc;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  color: #888;
  font-size: 13px;
}

.form-group input,
.select-input {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.form-group input:focus,
.select-input:focus {
  border-color: #FF066F;
}

.select-input {
  appearance: none;
  cursor: pointer;
}

.select-input option {
  background: #1a1a1a;
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.btn-deposit {
  background: rgba(0, 200, 83, 0.15);
  color: #00c853;
  border: 1px solid rgba(0, 200, 83, 0.3);
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-deposit:hover:not(:disabled) {
  background: rgba(0, 200, 83, 0.25);
}

.btn-withdraw {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-withdraw:hover:not(:disabled) {
  background: rgba(255, 68, 68, 0.25);
}

.btn-deposit:disabled,
.btn-withdraw:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.feedback {
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.feedback.success {
  background: rgba(0, 200, 83, 0.1);
  color: #00c853;
  border: 1px solid rgba(0, 200, 83, 0.2);
}

.recent-section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #ccc;
}

.table-wrapper {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 14px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #1e1e1e;
}

th {
  color: #666;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  background: #111;
}

td {
  color: #ccc;
}

.type-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge.deposit {
  background: rgba(0, 200, 83, 0.15);
  color: #00c853;
}

.type-badge.withdraw {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}

.amount-green { color: #00c853; font-weight: 600; }
.amount-red { color: #ff4444; font-weight: 600; }

.empty-state {
  text-align: center;
  color: #555;
  padding: 40px;
  font-size: 14px;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
