<template>
  <!-- B-AW2 (#4): VCard → HexCard wrapper swap. Visual override via scoped .game-card class
       (border: none + width 180px + center text — preserves existing visual character). -->
  <HexCard class="game-card">
    <h3>  {{ t.profile.wallet.lblGameBalance }}</h3>
    <p>{{ balance }}</p>
    <img src="@/assets/images/icon_money_out.svg" alt="withdraw"/>
    <div class="desc">{{ t.profile.wallet.lblWithdrawToWallet }}</div>
  </HexCard>
</template>

<script setup>
import {t} from "@/locales/index.js";
import HexCard from '@/components/ui/HexCard.vue';

const props = defineProps({
  balance: {
    type: String,
    required: true
  }
});
</script>

<style scoped>
.game-card {
  border: none !important;
  padding: 16px;
  width: 180px;
  text-align: center;
}

.game-card h3 {
  margin: 0 0 8px;
  font-size: 0.7em;
  text-align: center;
  text-transform: capitalize;
}

.game-card p {
  margin: 0;
  color: var(--hex-text-primary);
  font-family: 'AnonymousBalance', 'Courier New', Consolas, monospace;
  font-size: 2rem;

}

.game-card img{
  margin-top: 1em;
  width: 30px;
}

.desc {
  font-size: 0.8em;
  color: var(--hex-text-primary);
  padding: 10px 0 0;
  text-align: center;
  width: 150px;
  margin: 0 auto;
}
</style>
