import { computed } from 'vue';
import store from '@/core/state/store.js';

export function useScene() {
    const scene = computed(() => store.getters['scene/current']);
    const params = computed(() => store.getters['scene/params']);
    const isImmersive = computed(() => store.getters['scene/isImmersive']);
    const setScene = (payload) => store.dispatch('scene/setScene', payload);
    const back = () => store.dispatch('scene/back');
    return { scene, params, isImmersive, setScene, back };
}
