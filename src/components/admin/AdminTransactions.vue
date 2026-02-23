<template>
  <div class="transactions-section">
    <div class="table-wrapper">
      <table v-if="transactions.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Player</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id">
            <td class="mono">{{ tx.id }}</td>
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
      <div v-else class="empty-state">No transactions recorded</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import { DECIMALS } from '@/core/constants.js';

const transactions = computed(() => store.getters['admin/getTransactions']);
const allPlayers = computed(() => store.getters['admin/getAllPlayers']);

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

.mono {
  font-family: monospace;
  font-size: 12px;
  color: #888;
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
</style>
