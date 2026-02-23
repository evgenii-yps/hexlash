<template>
  <div class="keys-section">
    <div class="section-toolbar">
      <div class="gen-controls">
        <div class="form-inline">
          <label>Prefix (optional)</label>
          <input v-model="prefix" placeholder="e.g. HEX-" class="input-sm" />
        </div>
        <div class="form-inline">
          <label>Count</label>
          <input v-model.number="count" type="number" min="1" max="100" class="input-sm" />
        </div>
        <button class="gen-btn" @click="generateKeys">Generate Keys</button>
      </div>
      <button v-if="gameKeys.length" class="export-btn" @click="exportKeys">Export CSV</button>
    </div>

    <div v-if="justGenerated.length" class="generated-notice">
      <p>Generated {{ justGenerated.length }} new keys:</p>
      <div class="generated-keys">
        <div class="key-chip" v-for="k in justGenerated" :key="k.id" @click="copyKey(k.key)">
          {{ k.key }}
          <span class="copy-hint">click to copy</span>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Created</th>
            <th>Status</th>
            <th>Used By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="gk in gameKeys" :key="gk.id">
            <td class="mono key-cell" @click="copyKey(gk.key)" title="Click to copy">{{ gk.key }}</td>
            <td>{{ formatDate(gk.createdAt) }}</td>
            <td>
              <span :class="['status-badge', gk.usedBy ? 'used-status' : 'available-status']">
                {{ gk.usedBy ? 'Used' : 'Available' }}
              </span>
            </td>
            <td>{{ gk.usedBy || '—' }}</td>
            <td>
              <button class="action-btn danger" @click="deleteKey(gk.id)" title="Delete">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!gameKeys.length" class="empty-state">No game keys generated yet</div>
    </div>

    <div v-if="copied" class="toast">Copied to clipboard!</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import store from '@/core/state/store.js';

const prefix = ref('');
const count = ref(5);
const justGenerated = ref([]);
const copied = ref(false);

const gameKeys = computed(() => store.getters['admin/getGameKeys']);

async function generateKeys() {
  const keys = await store.dispatch('admin/generateGameKeys', {
    count: count.value || 5,
    prefix: prefix.value,
  });
  justGenerated.value = keys;
}

function deleteKey(keyId) {
  store.commit('admin/deleteGameKey', keyId);
}

function copyKey(key) {
  navigator.clipboard.writeText(key);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1500);
}

function exportKeys() {
  const csv = 'Key,Created,Status,UsedBy\n' + gameKeys.value.map(k =>
    `${k.key},${k.createdAt},${k.usedBy ? 'Used' : 'Available'},${k.usedBy || ''}`
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hexlash-keys-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
</script>

<style scoped>
.section-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.gen-controls {
  display: flex;
  gap: 14px;
  align-items: flex-end;
}

.form-inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-inline label {
  color: #888;
  font-size: 12px;
}

.input-sm {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 8px 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  width: 120px;
}

.input-sm:focus {
  border-color: #FF066F;
}

.gen-btn {
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.gen-btn:hover {
  opacity: 0.9;
}

.export-btn {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px 16px;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
}

.export-btn:hover {
  color: #fff;
  border-color: #555;
}

.generated-notice {
  background: rgba(255, 6, 111, 0.08);
  border: 1px solid rgba(255, 6, 111, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.generated-notice p {
  color: #FF066F;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 10px;
}

.generated-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.key-chip {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 13px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
}

.key-chip:hover {
  border-color: #FF066F;
}

.copy-hint {
  color: #555;
  font-size: 10px;
  font-family: sans-serif;
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

.mono {
  font-family: monospace;
}

.key-cell {
  cursor: pointer;
}

.key-cell:hover {
  color: #FF066F;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.available-status {
  background: rgba(0, 200, 83, 0.15);
  color: #00c853;
}

.used-status {
  background: rgba(255, 165, 0, 0.15);
  color: #ffa500;
}

.action-btn {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 14px;
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

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #00c853;
  color: #fff;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  animation: fadeInOut 1.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>
