<template>
  <div class="clan-v2">
    <div class="clan-scroll">
      <!-- Loading -->
      <div v-if="loading" class="clan-loading">
        <v-progress-circular size="36" indeterminate />
      </div>

      <!-- No clan ID in route → browse/create mode -->
      <template v-else-if="!clanId">
        <MyClanTab :active="true" />
      </template>

      <!-- Clan not found -->
      <template v-else-if="notFound">
        <div class="clan-not-found">
          <div class="cnf-icon">✕</div>
          <div class="cnf-title">{{ t.clan?.lblNotFound || 'Clan not found' }}</div>
          <HexButton variant="secondary" size="sm" @click="$router.push('/ratings/myclan')">
            {{ t.clan?.lblBrowse || 'Browse Clans' }}
          </HexButton>
        </div>
      </template>

      <!-- My clan (member view) -->
      <template v-else-if="isMyClan && clanData">
        <ClanPageContent
          :club-data="clanData"
          :club-id="clanId"
          @club-left="onClanLeft"
          @club-deleted="onClanDeleted"
        />
      </template>

      <!-- Visitor view -->
      <template v-else-if="clanData">
        <div class="visitor-view">
          <!-- Header -->
          <div class="vis-header">
            <div class="vis-avatar-wrap">
              <img v-if="clanData.avatarUrl" :src="clanData.avatarUrl" class="vis-avatar" alt="" />
              <div v-else class="vis-avatar-placeholder">{{ (clanData.name || '?')[0] }}</div>
            </div>
            <div class="vis-info">
              <h2 class="vis-name">{{ clanData.name }}</h2>
              <p v-if="clanData.description" class="vis-desc">{{ clanData.description }}</p>
              <div class="vis-meta">
                <span class="vis-lvl">LVL {{ clanData.level || 1 }}</span>
                <span>{{ clanData.members || 0 }} / {{ clanData.maxMembers || 20 }} members</span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <ClanStats :clan-data="clanData" />

          <!-- Top members -->
          <div class="vis-members">
            <div v-for="(m, i) in visitorMembers" :key="m.id" class="vis-member-row">
              <span class="vis-rank">{{ i + 1 }}</span>
              <img :src="`/images/skins/${m.skin || 'skin_m_1.png'}`" class="vis-member-skin" alt="" />
              <span class="vis-member-name">{{ m.login || m.name }}</span>
            </div>
            <div v-if="totalMembers > 5" class="vis-more">+ {{ totalMembers - 5 }} more members</div>
          </div>

          <!-- Join action -->
          <div class="vis-action">
            <HexButton
              v-if="clanData.isPublic && !isClanFull"
              variant="primary"
              block
              @click="joinClan"
            >
              {{ t.clan?.lblJoin || 'JOIN' }} {{ clanData.name }}
            </HexButton>
            <div v-else-if="!clanData.isPublic" class="vis-private">{{ t.clan?.lblClanPrivate || 'This clan is private' }}</div>
            <div v-else class="vis-full">{{ t.clan?.lblClanFull || 'Clan is full' }}</div>
          </div>
        </div>
      </template>

      <div class="scroll-gap"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import store from '@/core/state/store.js';
import { t } from '@/locales/index.js';
import ClanPageContent from '@/components/fragments/clan/ClanPageContent.vue';
import MyClanTab from '@/components/fragments/clan/MyClanTab.vue';
import ClanStats from '@/components/fragments/clan/ClanStats.vue';
import HexButton from '@/components/ui/HexButton.vue';
import { searchParticipants } from '@/core/services/userService.js';

export default {
  name: 'ClanViewV2',
  components: { ClanPageContent, MyClanTab, ClanStats, HexButton },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const notFound = ref(false);
    const visitorMembers = ref([]);
    const totalMembers = ref(0);

    const clanId = computed(() => route.params.id || null);
    const master = computed(() => store.getters['master/getMaster']);
    const isMyClan = computed(() => {
      return master.value && master.value.userData?.clanId === clanId.value;
    });
    const clanData = computed(() => {
      if (!clanId.value) return null;
      return store.getters['clan/getClanById'](clanId.value);
    });
    const isClanFull = computed(() => {
      if (!clanData.value) return false;
      return (clanData.value.members || 0) >= (clanData.value.maxMembers || 20);
    });

    async function loadClan() {
      if (!clanId.value) {
        loading.value = false;
        return;
      }
      loading.value = true;
      notFound.value = false;
      try {
        const result = await store.dispatch('clan/loadClanById', clanId.value);
        if (!result) notFound.value = true;
        if (!isMyClan.value && result) {
          const res = await searchParticipants({ clanId: clanId.value, page: 0, size: 5 });
          visitorMembers.value = res || [];
          totalMembers.value = clanData.value?.members || visitorMembers.value.length;
        }
      } catch (e) {
        notFound.value = true;
      }
      loading.value = false;
    }

    function joinClan() {
      store.dispatch('clan/changeClan', clanId.value).then(() => {
        router.go(0);
      }).catch(e => {
        store.commit('master/setError', { text: e?.response?.data?.error || 'Failed to join' });
      });
    }

    function onClanLeft() { router.push('/ratings/myclan'); }
    function onClanDeleted() { router.push('/ratings/myclan'); }

    onMounted(loadClan);
    watch(clanId, loadClan);

    return { t, loading, notFound, clanId, clanData, isMyClan, isClanFull, visitorMembers, totalMembers, joinClan, onClanLeft, onClanDeleted };
  },
};
</script>

<style scoped>
.clan-v2 {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--hex-bg-deep);
}
@supports (height: 100dvh) { .clan-v2 { height: 100dvh; } }

.clan-scroll {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  height: 100%;
  padding: 80px 16px 120px;
  max-width: 700px;
  margin: 0 auto;
  -webkit-overflow-scrolling: auto;
  overscroll-behavior-y: none;
}

.clan-loading { display: flex; justify-content: center; padding: 80px 0; color: var(--hex-primary); }

/* Not found */
.clan-not-found { text-align: center; padding: 80px 20px; }
.cnf-icon { font-size: 48px; opacity: 0.5; margin-bottom: 12px; }
.cnf-title { font-size: 16px; color: var(--hex-text-muted); margin-bottom: 20px; }

/* Visitor header */
.vis-header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
.vis-avatar-wrap { flex-shrink: 0; }
.vis-avatar { width: 64px; height: 64px; border-radius: 12px; border: 2px solid var(--hex-primary); object-fit: cover; }
.vis-avatar-placeholder {
  width: 64px; height: 64px; border-radius: 12px; border: 2px solid var(--hex-primary);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--hex-font-display); font-size: 28px; color: var(--hex-primary);
  background: var(--hex-bg-card);
}
.vis-info { flex: 1; min-width: 0; }
.vis-name { font-family: var(--hex-font-display); font-size: 22px; color: var(--hex-text-primary); margin: 0 0 4px; }
.vis-desc { font-size: 13px; color: var(--hex-text-muted); font-style: italic; margin: 0 0 8px; }
.vis-meta { font-size: 11px; color: var(--hex-text-muted); display: flex; gap: 8px; }
.vis-lvl {
  font-family: var(--hex-font-mono); font-size: 10px;
  background: var(--hex-primary); color: #fff; padding: 2px 6px; border-radius: 4px;
}

/* Visitor members */
.vis-members { margin: 16px 0; }
.vis-member-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--hex-border-default);
}
.vis-rank { width: 24px; text-align: center; font-family: var(--hex-font-mono); font-size: 14px; color: var(--hex-text-muted); }
.vis-member-skin { width: 32px; height: 32px; border-radius: var(--hex-radius-sm); object-fit: cover; object-position: top; }
.vis-member-name { font-size: 14px; color: var(--hex-text-primary); }
.vis-more { font-size: 12px; color: var(--hex-text-muted); text-align: center; padding: 8px 0; }

/* Join action */
.vis-action { margin-top: 16px; }
.vis-private, .vis-full { text-align: center; font-size: 13px; color: var(--hex-text-muted); padding: 12px; }

.scroll-gap { height: 80px; }
</style>
