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
      <AppShell @scroll="handleChildScroll" />
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
    <ClanInviteNotification v-if="isAuth" />

    <footer class="footer">
      <transition name="slide-up-down">
        <BottomMenu v-if="isAuth && scrollDirection !== 'down' && !isPvPScreen"/>
      </transition>
    </footer>
  </div>
</template>

<script setup>
import {useRoute, useRouter} from 'vue-router'
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";
import store from "@/core/state/store.js";
import Info from "@/components/Info.vue";
import NoConnection from "@/components/ui/NoConnection.vue";
import Error from "@/components/Error.vue";
import NewAchievement from "@/components/NewAchievement.vue";
import ChallengeNotification from "@/components/pvp/ChallengeNotification.vue";
import ClanInviteNotification from "@/components/clan/ClanInviteNotification.vue";
import AppShell from "@/components/shell/AppShell.vue";
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

// Hide BottomMenu during PvP or immersive screens
const isPvPScreen = computed(() => {
  return route.path === '/matchmaking' ||
      route.path.startsWith('/spectate') ||
      route.path === '/arena/pit' ||
      (route.path === '/fight' && route.query.mode === 'pvp');
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




onMounted(() => {

  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.expand(); // Развернуть на весь экран
    window.Telegram.WebApp.disableVerticalSwipes();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnlineStatus);

  // Initialize PvP system
  store.dispatch('pvp/init');

  amplitude.init('b8821737459f00f1058fd8ede71459fe', {"autocapture":true});

})

onBeforeUnmount(() => {
  store.dispatch('webSocket/disconnectWebSocket');

  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('online', handleOnlineStatus);
});


</script>

<style scoped>

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
  font-family: var(--hex-font-mono);
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
