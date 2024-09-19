<template>
  <div class="app-container">
    <header :style="headerStyle" class="header">
      <div class="header-content">
        <Logo/>
        <div v-if="balance !== null" class="balance">
          {{ balance }}$
        </div>
      </div>
    </header>

    <main class="content">
      <RouterView v-if="isScrollableComponent" @scroll="handleChildScroll"/>
      <RouterView v-else/>
    </main>

    <Info :text="infoMessage.text"
          :timeout="infoMessage.timeout"
          :showButton="infoMessage.showButton"
    />

    <footer class="footer">
      <transition name="slide-up-down">
        <BottomMenu v-if="showBottomMenu && scrollDirection !== 'down'"/>
      </transition>
    </footer>
  </div>
</template>

<script setup>
import {RouterView, useRoute} from 'vue-router'
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import BottomMenu from "@/components/menu/BottomMenu.vue";
import Logo from "@/components/Logo.vue";
import store from "@/core/state/store.js";
import Info from "@/components/Info.vue";
import {createWeb3Modal, defaultConfig} from "@web3modal/ethers/vue";

const balance = computed(() => {
  const master = store.getters['master/getMaster'];
  if (master && master.userData) {
    return master.getBalance();
  }
  return null;
});

// Определяем, нужно ли показывать InfoMessage
const showInfoMessage = ref(false);

const infoMessage = computed(() => {
  const newInfoMessage = store.getters['master/getInfoMessage'];
  showInfoMessage.value = newInfoMessage.text !== "";
  return newInfoMessage;
});

const showBottomMenu = computed(() => {
  return store.getters['master/getAuthState'].isAuthenticated
});

const route = useRoute();
const isScrollableComponent = computed(() => {
  const scrollablePrefixes = ['/profile']; // Префиксы маршрутов с дочерними маршрутами
  const scrollableRoutes = ['/trainings']; // Точные маршруты

  // Проверка на точный маршрут или маршрут, начинающийся с одного из префиксов
  return scrollableRoutes.includes(route.path) ||
      scrollablePrefixes.some(prefix => route.path.startsWith(prefix));
});


const projectId = '96482c2638a251eef7399e040f66bcb5';

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

const metadata = {
  name: 'FightClub',
  description: 'The club is your right to life, a real life.\n' +
      'Join us. Your liberation awaits.',
  url: 'https://bitfightclub.com',
  icons: ['/images/logo500x500.png'],
}

const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  auth: {
    email: false,
    socials: [],
    showWallets: true,
    walletFeatures: true
  },

  /*Optional*/
  enableEIP6963: true, // true by default
  enableInjected: true, // true by default
  enableCoinbase: true, // true by default
  rpcUrl: '...', // used for the Coinbase SDK
  defaultChainId: 1, // used for the Coinbase SDK
})


const modal = createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
})

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
    }, 10); // Задержка в 10 мс
  }
};

// Высчитываем стиль заголовка
const headerStyle = computed(() => {
  // Если скролл меньше 50px, плавно изменяем положение черного в градиенте
  if (scrollTop.value <= 50) {
    const blackStop = scrollTop.value; // Плавно изменяем точку остановки черного цвета от 0 до 50%
    return {
      background: `linear-gradient(to bottom, black ${blackStop}%, transparent ${blackStop * 2}%)`,
      transition: 'background 0.3s ease', // Плавный переход для фона
    };
  }
  // Если скролл больше 50px, фиксируем черный цвет на 50%
  return {
    background: 'linear-gradient(to bottom, black 50%, transparent 100%)',
    transition: 'background 0.3s ease', // Плавный переход для фона
  };
});


onMounted(() => {
  store.commit('contract/setWeb3Modal', modal)

})


</script>

<style scoped>

@font-face {
  font-family: 'AnonymousBalance';
  src: url('@/assets/fonts/AnonymousBalance.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.content {
  position: fixed;
  overflow-y: auto;
  height: 100vh;
}

@supports (height: 100dvh) {
  .content {
    height: 100dvh;
  }
}

.header {
  width: 100vw;
  height: 70px;
  position: fixed;
  z-index: 2;
}


.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance {
  font-size: 2.5em;
  color: white;
  font-family: 'AnonymousBalance', sans-serif;
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
