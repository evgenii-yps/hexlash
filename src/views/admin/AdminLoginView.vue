<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="lock-icon">🔒</div>
        <h1>Hexlash Admin</h1>
        <p class="subtitle">Control Panel</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label>Login</label>
          <input
            v-model="login"
            type="text"
            placeholder="Enter admin login"
            autocomplete="username"
            :class="{ 'input-error': error }"
          />
        </div>

        <div class="input-group">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter password"
            autocomplete="current-password"
            :class="{ 'input-error': error }"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <div class="login-footer">
        <router-link to="/" class="back-link">&larr; Back to game</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';

const router = useRouter();
const login = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  if (!login.value || !password.value) {
    error.value = 'Please fill in all fields';
    return;
  }
  loading.value = true;
  // Simulated delay for UX
  await new Promise(r => setTimeout(r, 500));
  const success = await store.dispatch('admin/adminLogin', {
    login: login.value,
    password: password.value,
  });
  loading.value = false;
  if (success) {
    router.push('/admin/panel');
  } else {
    error.value = 'Invalid login or password';
    password.value = '';
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
  padding: 20px;
}

.login-card {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.lock-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-header h1 {
  color: #fff;
  font-size: 24px;
  margin: 0;
}

.subtitle {
  color: #888;
  font-size: 14px;
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  color: #aaa;
  font-size: 13px;
  font-weight: 500;
}

.input-group input {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px 14px;
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: #FF066F;
}

.input-group input.input-error {
  border-color: #ff4444;
}

.error-message {
  color: #ff4444;
  font-size: 13px;
  text-align: center;
}

.login-btn {
  background: linear-gradient(135deg, #FF066F, #cc33ff);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.login-btn:hover {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  margin-top: 24px;
}

.back-link {
  color: #888;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.back-link:hover {
  color: #FF066F;
}
</style>
