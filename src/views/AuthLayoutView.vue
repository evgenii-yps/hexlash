<template>
  <div class="auth-layout">
    <!-- Background glow (same as Landing 1a) -->
    <div class="auth-layout__glow" aria-hidden="true"></div>

    <!-- Logo header -->
    <header class="auth-layout__header">
      <router-link to="/" class="auth-layout__logo-link" aria-label="Hexlash home">
        <img
          :src="logoSrc"
          alt="Hexlash"
          class="auth-layout__logo"
          draggable="false"
        />
      </router-link>
    </header>

    <!-- Form slot via router-view (AuthSelectorView mounts here for both /auth/login and /auth/signup) -->
    <main class="auth-layout__main">
      <router-view v-slot="{ Component }">
        <transition name="auth-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import logoSrc from '@/assets/images/logo-512.png';
</script>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--hex-bg-dark);
  color: var(--hex-text-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.auth-layout__glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 900px);
  height: clamp(400px, 60vw, 900px);
  background: radial-gradient(
    circle at center,
    rgba(255, 6, 111, 0.12) 0%,
    rgba(255, 6, 111, 0.04) 35%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

.auth-layout__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  padding: 32px 16px 16px;
}

.auth-layout__logo-link {
  display: inline-block;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.auth-layout__logo-link:hover {
  opacity: 0.85;
}

.auth-layout__logo {
  width: clamp(120px, 18vw, 180px);
  height: auto;
  user-select: none;
  -webkit-user-drag: none;
}

.auth-layout__main {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 16px 32px;
  width: 100%;
}

/* Form transition */
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.auth-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.auth-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Mobile narrow viewport */
@media (max-width: 480px) {
  .auth-layout__header {
    padding: 24px 12px 12px;
  }
  .auth-layout__main {
    padding: 12px 12px 24px;
  }
}
</style>
