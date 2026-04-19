<template>
  <HudFighterDetail :key-prop="validatedKey" />
</template>

<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HudFighterDetail from '@/components/hud/HudFighterDetail.vue';

const VALID_KEYS = ['warden', 'predator'];

const route = useRoute();
const router = useRouter();

const validatedKey = computed(() => {
  const k = route.params.key;
  return VALID_KEYS.includes(k) ? k : 'warden';
});

function guard(key) {
  if (!VALID_KEYS.includes(key)) router.replace('/v2');
}

guard(route.params.key);
watch(() => route.params.key, guard);
</script>
