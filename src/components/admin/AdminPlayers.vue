<template>
  <div class="players-section">
    <div class="section-toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Search by login, name or ID..."
          @input="onSearch"
        />
      </div>
      <button class="add-btn" @click="showAddModal = true">+ Add Player</button>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Login</th>
            <th>Name</th>
            <th>Balance</th>
            <th>Fights</th>
            <th>W / L</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="player in players" :key="player.id" :class="{ blocked: player.isBlocked }">
            <td class="mono">{{ player.id }}</td>
            <td>@{{ player.login }}</td>
            <td>{{ player.name }}</td>
            <td>{{ formatBalance(player.balance) }}$</td>
            <td>{{ player.totalFights }}</td>
            <td>
              <span class="win">{{ player.wins }}</span> / <span class="loss">{{ player.losses }}</span>
            </td>
            <td>
              <span :class="['status-badge', player.isBlocked ? 'blocked-status' : 'active-status']">
                {{ player.isBlocked ? 'Blocked' : 'Active' }}
              </span>
            </td>
            <td>{{ formatDate(player.createdAt) }}</td>
            <td class="actions-cell">
              <button class="action-btn" @click="toggleBlock(player.id)" :title="player.isBlocked ? 'Unblock' : 'Block'">
                {{ player.isBlocked ? '✅' : '🚫' }}
              </button>
              <button class="action-btn danger" @click="deletePlayer(player.id)" title="Delete">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!players.length" class="empty-state">No players found</div>
    </div>

    <!-- Add Player Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <h3>Add New Player</h3>
        <div class="form-group">
          <label>Login</label>
          <input v-model="newPlayer.login" placeholder="player_login" />
        </div>
        <div class="form-group">
          <label>Name</label>
          <input v-model="newPlayer.name" placeholder="Player Name" />
        </div>
        <div class="form-group">
          <label>Initial Balance ($)</label>
          <input v-model.number="newPlayer.balance" type="number" placeholder="0" />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddModal = false">Cancel</button>
          <button class="btn-primary" @click="addPlayer">Add Player</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import store from '@/core/state/store.js';
import { DECIMALS } from '@/core/constants.js';

const searchQuery = ref('');
const showAddModal = ref(false);
const newPlayer = ref({ login: '', name: '', balance: 0 });

const players = computed(() => store.getters['admin/getPlayers']);

function onSearch() {
  store.commit('admin/setSearchQuery', searchQuery.value);
}

function toggleBlock(playerId) {
  store.commit('admin/togglePlayerBlock', playerId);
}

function deletePlayer(playerId) {
  if (confirm('Are you sure you want to delete this player?')) {
    store.commit('admin/deletePlayer', playerId);
  }
}

function addPlayer() {
  if (!newPlayer.value.login) return;
  store.commit('admin/addPlayer', {
    id: Date.now().toString(),
    login: newPlayer.value.login,
    name: newPlayer.value.name || 'Anonymous',
    balance: Math.round((newPlayer.value.balance || 0) * (10 ** DECIMALS)),
    wins: 0,
    losses: 0,
    totalFights: 0,
    isBlocked: false,
    createdAt: new Date().toISOString(),
  });
  newPlayer.value = { login: '', name: '', balance: 0 };
  showAddModal.value = false;
}

function formatBalance(val) {
  return (val / (10 ** DECIMALS)).toFixed(2);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
</script>

<style scoped>
.section-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-box input {
  width: 100%;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.search-box input:focus {
  border-color: #FF066F;
}

.add-btn {
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.add-btn:hover {
  opacity: 0.9;
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

tr.blocked {
  opacity: 0.6;
}

.mono {
  font-family: monospace;
  font-size: 12px;
  color: #888;
}

.win {
  color: #00c853;
}

.loss {
  color: #ff4444;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.active-status {
  background: rgba(0, 200, 83, 0.15);
  color: #00c853;
}

.blocked-status {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}

.actions-cell {
  display: flex;
  gap: 6px;
}

.action-btn {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #2a2a2a;
}

.action-btn.danger:hover {
  background: #2a1a1a;
  border-color: #ff4444;
}

.empty-state {
  text-align: center;
  color: #555;
  padding: 40px;
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
}

.modal h3 {
  margin: 0 0 20px;
  font-size: 18px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  color: #888;
  font-size: 13px;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  background: #111;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.form-group input:focus {
  border-color: #FF066F;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-secondary {
  background: #222;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 20px;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
