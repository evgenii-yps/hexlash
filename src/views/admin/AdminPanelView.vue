<template>
  <div class="admin-panel">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Hexlash</h2>
        <span class="badge">Admin</span>
      </div>
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-item', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <header class="top-bar">
        <h1 class="page-title">{{ currentTabLabel }}</h1>
        <div class="admin-info">
          <span class="admin-name">Admin</span>
          <div class="admin-avatar">A</div>
        </div>
      </header>

      <div class="content-area">
        <!-- Dashboard -->
        <AdminDashboard v-if="activeTab === 'dashboard'" />

        <!-- Players -->
        <AdminPlayers v-if="activeTab === 'players'" />

        <!-- Game Keys -->
        <AdminGameKeys v-if="activeTab === 'keys'" />

        <!-- Balances -->
        <AdminBalances v-if="activeTab === 'balances'" />

        <!-- Content -->
        <AdminContent v-if="activeTab === 'content'" />

        <!-- Transactions -->
        <AdminTransactions v-if="activeTab === 'transactions'" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import AdminDashboard from '@/components/admin/AdminDashboard.vue';
import AdminPlayers from '@/components/admin/AdminPlayers.vue';
import AdminGameKeys from '@/components/admin/AdminGameKeys.vue';
import AdminBalances from '@/components/admin/AdminBalances.vue';
import AdminContent from '@/components/admin/AdminContent.vue';
import AdminTransactions from '@/components/admin/AdminTransactions.vue';

const router = useRouter();
const activeTab = ref('dashboard');

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'players', label: 'Players', icon: '👥' },
  { id: 'keys', label: 'Game Keys', icon: '🔑' },
  { id: 'balances', label: 'Balances', icon: '💰' },
  { id: 'content', label: 'Content', icon: '🃏' },
  { id: 'transactions', label: 'Transactions', icon: '📋' },
];

const currentTabLabel = computed(() => {
  const tab = tabs.find(t => t.id === activeTab.value);
  return tab ? tab.label : '';
});

function handleLogout() {
  store.dispatch('admin/adminLogout');
  router.push('/admin');
}
</script>

<style scoped>
.admin-panel {
  display: flex;
  min-height: 100vh;
  background: #0a0a0a;
  color: #fff;
}

/* Sidebar */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #111;
  border-right: 1px solid #222;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #222;
}

.sidebar-header h2 {
  font-size: 18px;
  margin: 0;
  color: #FF066F;
}

.badge {
  background: rgba(255, 6, 111, 0.2);
  color: #FF066F;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: #1a1a1a;
  color: #ddd;
}

.nav-item.active {
  background: rgba(255, 6, 111, 0.1);
  color: #FF066F;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #222;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-btn:hover {
  background: #2a1a1a;
  color: #ff4444;
  border-color: #ff4444;
}

/* Main content */
.main-content {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  border-bottom: 1px solid #1a1a1a;
  background: #0d0d0d;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-name {
  color: #888;
  font-size: 14px;
}

.admin-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.content-area {
  padding: 24px 32px;
  flex: 1;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
    min-width: 60px;
  }

  .sidebar-header h2,
  .nav-label,
  .sidebar-footer {
    display: none;
  }

  .sidebar-header {
    justify-content: center;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }

  .nav-icon {
    margin: 0;
  }

  .main-content {
    margin-left: 60px;
  }

  .content-area {
    padding: 16px;
  }

  .top-bar {
    padding: 12px 16px;
  }
}
</style>
