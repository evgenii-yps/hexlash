<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in statsCards" :key="stat.label">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="dashboard-sections">
      <div class="section">
        <h3>Recent Transactions</h3>
        <div class="table-wrapper">
          <table v-if="recentTransactions.length">
            <thead>
              <tr>
                <th>Date</th>
                <th>Player ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in recentTransactions" :key="tx.id">
                <td>{{ formatDate(tx.createdAt) }}</td>
                <td class="mono">{{ tx.playerId }}</td>
                <td>
                  <span :class="['type-badge', tx.type]">{{ tx.type }}</span>
                </td>
                <td>{{ formatBalance(tx.amount) }}$</td>
                <td class="note-cell">{{ tx.note || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">No transactions yet</div>
        </div>
      </div>

      <div class="section">
        <h3>Top Players by Balance</h3>
        <div class="top-players">
          <div class="player-row" v-for="(player, idx) in topPlayers" :key="player.id">
            <span class="rank">#{{ idx + 1 }}</span>
            <span class="player-name">{{ player.name }}</span>
            <span class="player-login">@{{ player.login }}</span>
            <span class="player-balance">{{ formatBalance(player.balance) }}$</span>
          </div>
          <div v-if="!topPlayers.length" class="empty-state">No players</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import store from '@/core/state/store.js';
import { DECIMALS } from '@/core/constants.js';

const stats = computed(() => store.getters['admin/getStats']);
const transactions = computed(() => store.getters['admin/getTransactions']);
const allPlayers = computed(() => store.getters['admin/getAllPlayers']);

const statsCards = computed(() => [
  { icon: '👥', label: 'Total Players', value: stats.value.totalPlayers },
  { icon: '✅', label: 'Active Players', value: stats.value.activePlayers },
  { icon: '🚫', label: 'Blocked', value: stats.value.blockedPlayers },
  { icon: '⚔️', label: 'Total Fights', value: stats.value.totalFights.toLocaleString() },
  { icon: '🔑', label: 'Active Keys', value: stats.value.activeKeys },
  { icon: '📋', label: 'Transactions', value: stats.value.totalTransactions },
]);

const recentTransactions = computed(() => transactions.value.slice(0, 5));

const topPlayers = computed(() =>
  [...allPlayers.value].sort((a, b) => b.balance - a.balance).slice(0, 5)
);

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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  border-radius: 10px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.section {
  background: #141414;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 20px;
}

.section h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #ccc;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 12px;
  text-align: left;
  font-size: 13px;
  border-bottom: 1px solid #1e1e1e;
}

th {
  color: #666;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
}

td {
  color: #ccc;
}

.mono {
  font-family: monospace;
  font-size: 12px;
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

.note-cell {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-players {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #1a1a1a;
  border-radius: 8px;
}

.rank {
  color: #FF066F;
  font-weight: 700;
  font-size: 14px;
  width: 30px;
}

.player-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.player-login {
  color: #666;
  font-size: 12px;
}

.player-balance {
  color: #00c853;
  font-weight: 600;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  color: #555;
  padding: 30px;
  font-size: 14px;
}

@media (max-width: 900px) {
  .dashboard-sections {
    grid-template-columns: 1fr;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
