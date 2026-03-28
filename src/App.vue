<template>
  <div class="app-container">
    <header :style="headerStyle" class="header">
      <div class="header-content">
        <Logo/>
        <div v-if="balance !== null && isAuth" class="balance">
          {{ balance }}$
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView v-if="isScrollableComponent" @scroll="handleChildScroll"/>
      <RouterView v-else/>
    </main>

    <!-- FindFight removed: card-based combat uses client-side simulation -->

    <Info :text="infoMessage.text"
          :timeout="infoMessage.timeout"
          :showButton="infoMessage.showButton"
    />

    <Error :text="errorMessage.text"
          :timeout="errorMessage.timeout"
          :showButton="errorMessage.showButton"
    />

    <NoConnection v-if="isAuth" />

    <NewAchievement v-if="isAuth"/>

    <!-- Global challenge notification (top of screen) -->
    <ChallengeNotification v-if="isAuth" />
    <ClubInviteNotification v-if="isAuth" />

    <footer class="footer">
      <transition name="slide-up-down">
        <BottomMenu v-if="isAuth && scrollDirection !== 'down' && !isPvPScreen"/>
      </transition>
    </footer>
  </div>
</template>

<script setup>
import {RouterView, useRoute, useRouter} from 'vue-router'
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";
import store from "@/core/state/store.js";
import Info from "@/components/Info.vue";
import NoConnection from "@/components/ui/NoConnection.vue";
import Error from "@/components/Error.vue";
import NewAchievement from "@/components/NewAchievement.vue";
import ChallengeNotification from "@/components/pvp/ChallengeNotification.vue";
import ClubInviteNotification from "@/components/club/ClubInviteNotification.vue";
import { t } from "@/locales/index.js";
import * as amplitude from "@amplitude/analytics-browser";



const balance = computed(() => {
  const master = store.getters['master/getMaster'];
  if (master && master.userData) {
    return master.getBalance();
  }
  return null;
});


const isNotArenaScreen = computed(() => route.name !== 'Arena');

const showInfoMessage = ref(false);

const infoMessage = computed(() => {
  const newInfoMessage = store.getters['master/getInfoMessage'];
  showInfoMessage.value = newInfoMessage.text !== "";
  return newInfoMessage;
});

const showErrorMessage = ref(false);

const errorMessage = computed(() => {
  const newErrorMessage = store.getters['master/getErrorMessage'];
  showErrorMessage.value = newErrorMessage.text !== "";
  return newErrorMessage;
});

const isAuth = computed(() => {
  return store.getters['master/getLoginState'].isAuthenticated
});

const route = useRoute();

// Hide BottomMenu during PvP: matchmaking, spectate, or fight with mode=pvp
const isPvPScreen = computed(() => {
  return route.path === '/matchmaking' ||
      route.path.startsWith('/spectate') ||
      (route.path === '/fight' && route.query.mode === 'pvp');
});

const isScrollableComponent = computed(() => {
  const scrollablePrefixes = ['/profile', '/ratings', '/fight', '/training/']; // Префиксы маршрутов с дочерними маршрутами
  const scrollableRoutes = ['/training', '/arena', '/arena/autofight-log', '/404', '/verify-email', '/friends', '/matchmaking']; // Точные маршруты

  // Проверка на точный маршрут или маршрут, начинающийся с одного из префиксов
  return scrollableRoutes.includes(route.path) ||
      scrollablePrefixes.some(prefix => route.path.startsWith(prefix));
});

const scrollTop = ref(0);
const scrollDirection = ref('up');
const lastScrollTop = ref(1);
const scrollTimeout = ref(null);

const handleChildScroll = (newScrollTop) => {
  if (newScrollTop !== undefined) {
    scrollTop.value = newScrollTop;

    clearTimeout(scrollTimeout.value);

    scrollTimeout.value = setTimeout(() => {
      if (newScrollTop > lastScrollTop.value) {
        scrollDirection.value = 'down';
      } else {
        scrollDirection.value = 'up';
      }
      lastScrollTop.value = newScrollTop;
    }, 0); // Задержка в 10 мс
  }
};

// Высчитываем стиль заголовка
const headerStyle = computed(() => {
  // Если скролл меньше 50px, плавно изменяем положение черного в градиенте
  if (scrollTop.value <= 50) {
    const blackStop = scrollTop.value; // Плавно изменяем точку остановки черного цвета от 0 до 50%
    return {
      background: `linear-gradient(to bottom, var(--hex-bg-dark) ${blackStop}%, transparent ${blackStop * 2}%)`,
      transition: 'background 0.3s ease',
    };
  }
  // Если скролл больше 50px, фиксируем черный цвет на 50%
  return {
    background: 'linear-gradient(to bottom, var(--hex-bg-dark) 50%, transparent 100%)',
    transition: 'background 0.3s ease',
  };
});

watch(isAuth, (newAuthState) => {
  if (newAuthState) {
    // Если пользователь авторизован, подключаемся к WebSocket
    store.dispatch('webSocket/connectWebSocket');
    // Check for pending auto fights on auth
    store.dispatch('clubMode/checkAndRunPending');
  } else {
    // Отключаем WebSocket, если пользователь разлогинился
    store.dispatch('webSocket/disconnectWebSocket');
  }
}, {immediate: true});

watch(route, () => {
  scrollDirection.value = 'up'; // Всегда показываем меню при переходе на новую страницу
});

// Отслеживание видимости вкладки
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible' && isAuth.value) {
    //if (!store.getters['webSocket/isConnected']) {
      store.dispatch('webSocket/connectWebSocket');
    //}
    // Check for pending auto fights
    store.dispatch('clubMode/checkAndRunPending');
  }else if(!isAuth.value){
    store.dispatch('webSocket/disconnectWebSocket');
  }
};


// Отслеживание статуса интернет-соединения
const handleOnlineStatus = () => {
  if (navigator.onLine && isAuth.value) {
    //if (!store.getters['webSocket/isConnected']) {
      store.dispatch('webSocket/connectWebSocket');
    //}
  }
};




// Global auto-fight timer — checks every 30s regardless of which page is open
let autoFightInterval = null;

onMounted(() => {

  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand(); // Развернуть на весь экран
    window.Telegram.WebApp.disableVerticalSwipes();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnlineStatus);

  // Initialize auto fight system
  store.dispatch('clubMode/init');

  // Run pending auto fights immediately after init (catch up missed fights on reload)
  if (store.getters['clubMode/isEnabled'] && isAuth.value) {
    store.dispatch('clubMode/checkAndRunPending');
  }

  // Initialize PvP system
  store.dispatch('pvp/init');

  // Periodic auto-fight check — runs globally so fights trigger even if user
  // navigates away from Arena (where AutoFightStatus component lives)
  autoFightInterval = setInterval(() => {
    if (store.getters['clubMode/isEnabled'] && isAuth.value) {
      store.dispatch('clubMode/checkAndRunPending');
    }
  }, 30000);

  amplitude.init('b8821737459f00f1058fd8ede71459fe', {"autocapture":true});

})

onBeforeUnmount(() => {
  store.dispatch('webSocket/disconnectWebSocket');

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('online', handleOnlineStatus);

  clearInterval(autoFightInterval);
});


</script>

<style scoped>

@font-face {
  font-family: 'AnonymousBalance';
  src: url('@/assets/fonts/AnonymousBalance.woff2') format('woff2'),
       url('@/assets/fonts/AnonymousBalance.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/*.content {
  position: relative;
  overflow-y: auto;
  height: 100vh;
}

@supports (height: 100dvh) {
  .content {
    height: 100dvh;
  }
}*/

.header {
  width: 100vw;
  height: 70px;
  position: fixed;
  z-index: 100;
}


.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance {
  font-size: 2.5em;
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  position: absolute;
  top: 0;
  right: 20px;
  margin-top: 20px;
}

/* Анимация выезжания вверх и вниз */
.slide-up-down-enter-active, .slide-up-down-leave-active {
  transition: transform 0.5s ease;
}

.slide-up-down-enter-from {
  transform: translateY(100%);
}

.slide-up-down-enter-to {
  transform: translateY(0);
}

.slide-up-down-leave-from {
  transform: translateY(0);
}

.slide-up-down-leave-to {
  transform: translateY(100%);
}

.footer {
  display: flex;
  justify-content: center;
  align-items: center;
}


</style>
