<template>
  <div class="profile-v2">
    <div class="profile-scroll">
      <h1 class="profile-title">{{ master?.userData?.name || master?.userData?.login || 'Profile' }}</h1>

      <div class="profile-grid">
        <!-- Identity Card -->
        <div class="p-card">
          <div class="p-card-title">{{ pv2.lblIdentity || 'IDENTITY' }}</div>
          <div class="id-row">
            <img :src="`/images/skins/${master?.userData?.skin || 'skin_m_1.png'}`" class="id-avatar" alt="" />
            <div class="id-info">
              <div class="id-name">{{ master?.userData?.name || master?.userData?.login || '—' }}</div>
              <div class="id-meta">{{ master?.userData?.login || '' }}</div>
            </div>
          </div>
          <div class="id-fields">
            <div class="id-field" @click="copyWallet">
              <span class="id-field-label">{{ pv2.lblWallet || 'Wallet' }}</span>
              <span class="id-field-value wallet-val">{{ walletDisplay }}</span>
            </div>
            <div class="id-field">
              <span class="id-field-label">{{ pv2.lblEmail || 'Email' }}</span>
              <span class="id-field-value">{{ master?.userData?.email || '—' }}
                <span :class="master?.userData?.emailVerified ? 'verified' : 'not-verified'">
                  {{ master?.userData?.emailVerified ? (pv2.lblVerified || '✓') : (pv2.lblNotVerified || '✗') }}
                </span>
              </span>
            </div>
            <div class="id-field">
              <span class="id-field-label">{{ pv2.lblActiveAgent || 'Active Agent' }}</span>
              <span class="id-field-value">{{ activeAgent?.name || (pv2.lblNoAgent || 'No agent yet') }}</span>
            </div>
            <div class="id-field">
              <span class="id-field-label">{{ pv2.lblClan || 'Clan' }}</span>
              <span class="id-field-value">{{ master?.userData?.clanId ? 'In Clan' : '—' }}</span>
            </div>
            <div class="id-field">
              <span class="id-field-label">{{ pv2.lblBalance || 'BALANCE' }}</span>
              <span class="id-field-value balance-val">{{ balance }}</span>
            </div>
          </div>
        </div>

        <!-- Performance Card -->
        <div class="p-card">
          <div class="p-card-title">{{ pv2.lblPerformance || 'PERFORMANCE' }}</div>
          <div class="stats-grid">
            <div class="stat-cell">
              <span class="stat-val">{{ ud?.totalFights || 0 }}</span>
              <span class="stat-label">{{ pv2.lblFights || 'Fights' }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-val wins">{{ ud?.wins || 0 }}</span>
              <span class="stat-label">{{ pv2.lblWins || 'Wins' }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-val">{{ winRate }}%</span>
              <span class="stat-label">{{ pv2.lblWinrate || 'Winrate' }}</span>
            </div>
            <div class="stat-cell">
              <span class="stat-val">{{ beltDisplay }}</span>
              <span class="stat-label">{{ pv2.lblBelt || 'Belt' }}</span>
            </div>
          </div>
          <HexButton variant="secondary" size="sm" block @click="$router.push('/arena/club')" class="view-club-btn">
            {{ pv2.lblViewClub || 'View Club' }}
          </HexButton>
        </div>

        <!-- Friends Card -->
        <div class="p-card">
          <div class="p-card-title">{{ pv2.lblFriends || 'FRIENDS' }} <span class="count-badge">{{ friends.length }}</span></div>
          <div class="fc-list">
            <div v-if="friendsLoading" class="fc-loading">...</div>
            <div v-else-if="friends.length === 0" class="fc-empty">{{ t.friends?.lblNoFriends || 'No friends yet' }}</div>
            <div v-for="f in friends.slice(0, 5)" :key="f.id" class="fc-row">
              <span class="fc-dot" :class="f.status === 'online' ? 'online' : ''"></span>
              <span class="fc-name">{{ f.username }}</span>
            </div>
            <div v-if="friends.length > 5" class="fc-more" @click="$router.push('/friends')">
              +{{ friends.length - 5 }} more →
            </div>
          </div>
          <HexButton variant="ghost" size="sm" block @click="$router.push('/friends')">
            {{ t.friends?.lblAllFriends || 'All Friends' }}
          </HexButton>
        </div>

        <!-- Settings Card -->
        <div class="p-card">
          <div class="p-card-title">{{ pv2.lblSettings || 'SETTINGS' }}</div>

          <div class="settings-block">
            <div class="settings-label">{{ pv2.lblLanguage || 'Language' }}</div>
            <div class="lang-picker">
              <button v-for="lang in langs" :key="lang" :class="['lang-btn', { active: currentLang === lang }]" @click="switchLang(lang)">
                {{ lang.toUpperCase() }}
              </button>
            </div>
          </div>

          <div class="settings-block">
            <div class="toggle-row">
              <span>{{ pv2.lblSound || 'Ambient' }}</span>
              <button :class="['toggle-pip', { on: !isMuted }]" @click="toggleMute">
                <span class="pip-knob"></span>
              </button>
            </div>
          </div>

          <div class="settings-block">
            <div class="build-row">
              <span>{{ pv2.lblBuildVersion || 'Build' }}</span>
              <span class="build-val">{{ appVersion }}</span>
            </div>
          </div>

          <HexButton variant="danger" size="sm" block @click="doLogout" class="logout-btn">
            {{ pv2.lblLogout || 'Logout' }}
          </HexButton>
        </div>
      </div>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t, setLanguage } from '@/locales/index.js';
import { getBeltDisplay } from '@/utils/beltDisplay.js';
import HexButton from '@/components/ui/HexButton.vue';

export default {
  name: 'ProfileViewV2',
  components: { HexButton },
  setup() {
    const router = useRouter();
    const master = computed(() => store.getters['master/getMaster']);
    const ud = computed(() => master.value?.userData);
    const pv2 = computed(() => t.value.profile?.v2 || {});
    const activeAgent = computed(() => store.getters['agent/activeAgent']);
    const balance = computed(() => master.value?.userData?.balance || 0);
    const friends = computed(() => store.getters['friends/getFriends'] || []);
    const friendsLoading = computed(() => false);
    const isMuted = computed(() => store.getters['punch/isMuted']);
    const currentLang = computed(() => ud.value?.language || 'en');
    const langs = ['en', 'ru', 'de', 'es', 'fr', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh'];

    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

    const winRate = computed(() => {
      const u = ud.value;
      if (!u || !u.totalFights) return 0;
      return Math.round((u.wins / u.totalFights) * 100);
    });

    const beltDisplay = computed(() => {
      const agent = activeAgent.value;
      if (!agent) return '—';
      const d = getBeltDisplay(agent.belt || 0);
      return d.color || 'White';
    });

    const walletDisplay = computed(() => {
      const addr = ud.value?.walletAddress;
      if (!addr) return pv2.value?.lblConnectWallet || 'Connect Wallet';
      return addr.slice(0, 6) + '...' + addr.slice(-4);
    });

    function copyWallet() {
      const addr = ud.value?.walletAddress;
      if (!addr) return;
      navigator.clipboard.writeText(addr).then(() => {
        store.commit('master/setInfoMessage', { text: pv2.value?.lblWalletCopied || 'Copied!', timeout: 1500 });
      }).catch(() => {});
    }

    function switchLang(lang) {
      setLanguage(lang);
      store.dispatch('master/setLanguage', lang).catch(() => {});
    }

    function toggleMute() {
      store.commit('punch/setMuted', !isMuted.value);
    }

    function doLogout() {
      store.dispatch('master/logout');
      router.push('/auth/login');
    }

    onMounted(() => {
      if (!friends.value.length) {
        store.dispatch('friends/loadFriends').catch(() => {});
      }
      if (!store.state.agent?.agents?.length) {
        store.dispatch('agent/fetchAgents').catch(() => {});
      }
    });

    return { t, pv2, master, ud, activeAgent, balance, friends, friendsLoading, isMuted, currentLang, langs, appVersion, winRate, beltDisplay, walletDisplay, copyWallet, switchLang, toggleMute, doLogout };
  },
};
</script>

<style scoped>
.profile-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .profile-v2 { height: 100dvh; } }

.profile-scroll {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  padding: 80px 16px 120px;
  max-width: 800px;
  margin: 0 auto;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

.profile-title {
  font-family: var(--hex-font-display);
  font-size: 28px;
  color: var(--hex-text-primary);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 20px;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }

/* Card */
.p-card {
  background: var(--hex-bg-card);
  border: 1px solid var(--hex-border-default);
  border-radius: var(--hex-radius-lg);
  padding: 16px;
}
.p-card-title {
  font-family: var(--hex-font-display);
  font-size: 11px;
  color: var(--hex-text-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Identity */
.id-row { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
.id-avatar { width: 56px; height: 56px; border-radius: var(--hex-radius-md); object-fit: cover; object-position: top; border: 1px solid var(--hex-border-default); }
.id-name { font-family: var(--hex-font-body); font-size: 18px; color: var(--hex-text-primary); font-weight: 500; }
.id-meta { font-size: 12px; color: var(--hex-text-muted); }
.id-fields { display: flex; flex-direction: column; gap: 8px; }
.id-field { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-top: 1px solid var(--hex-border-default); }
.id-field-label { color: var(--hex-text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; }
.id-field-value { color: var(--hex-text-primary); font-family: var(--hex-font-mono); font-size: 12px; }
.wallet-val { cursor: pointer; }
.wallet-val:hover { color: var(--hex-primary); }
.verified { color: var(--hex-success); margin-left: 4px; }
.not-verified { color: var(--hex-text-muted); margin-left: 4px; }

/* Performance */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.stat-cell { text-align: center; padding: 8px; background: var(--hex-bg-medium); border-radius: var(--hex-radius-md); }
.stat-val { display: block; font-family: var(--hex-font-mono); font-size: 20px; color: var(--hex-text-primary); }
.stat-val.wins { color: var(--hex-victory); }
.stat-label { font-size: 9px; color: var(--hex-text-muted); text-transform: uppercase; letter-spacing: 1px; }
.view-club-btn { margin-top: 4px; }

/* Friends */
.count-badge { font-family: var(--hex-font-mono); font-size: 10px; background: var(--hex-primary); color: #fff; padding: 1px 6px; border-radius: 10px; margin-left: 6px; }
.fc-list { margin-bottom: 10px; }
.fc-loading, .fc-empty { font-size: 12px; color: var(--hex-text-muted); padding: 8px 0; }
.fc-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--hex-border-default); font-size: 13px; color: var(--hex-text-primary); }
.fc-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--hex-text-muted); flex-shrink: 0; }
.fc-dot.online { background: var(--hex-victory); box-shadow: 0 0 6px var(--hex-victory); }
.fc-more { font-size: 11px; color: var(--hex-primary); cursor: pointer; padding: 6px 0; }

/* Settings */
.settings-block { margin-bottom: 14px; }
.settings-label { font-size: 10px; color: var(--hex-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.lang-picker { display: flex; flex-wrap: wrap; gap: 4px; }
.lang-btn {
  padding: 4px 8px; font-size: 10px; font-family: var(--hex-font-mono);
  background: var(--hex-bg-medium); border: 1px solid var(--hex-border-default);
  color: var(--hex-text-muted); border-radius: var(--hex-radius-sm); cursor: pointer;
  transition: all 0.15s;
}
.lang-btn.active { background: var(--hex-primary); color: #fff; border-color: var(--hex-primary); }
.lang-btn:hover:not(.active) { border-color: var(--hex-border-active); color: var(--hex-text-primary); }

.toggle-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--hex-text-primary); }
.toggle-pip {
  width: 36px; height: 20px; border-radius: 10px; background: var(--hex-bg-light);
  border: 1px solid var(--hex-border-default); cursor: pointer; position: relative;
  transition: background 0.2s;
}
.toggle-pip.on { background: var(--hex-success); border-color: var(--hex-success); }
.pip-knob {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  border-radius: 50%; background: #fff; transition: transform 0.2s;
}
.toggle-pip.on .pip-knob { transform: translateX(16px); }

.build-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--hex-text-muted); }
.build-val { font-family: var(--hex-font-mono); }

.logout-btn { margin-top: 8px; }
.scroll-gap { height: 80px; }
</style>
