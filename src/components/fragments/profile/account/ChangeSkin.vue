<template>
  <div class="scroll-container">
    <button class="scroll-button prev" @click="scrollLeft">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </svg>
    </button>

    <div class="horizontal-scroll" ref="scrollContainer">
      <div
          v-for="(skin, index) in skins"
          :key="index"
          @click="selectSkin(skin)"
          :class="{ 'selected-skin': skin.id === selectedSkin, 'locked': skin.locked }"
          class="skin-item"
          ref="skinItems"
      >
        <v-img :src="`/images/skins/${skin.image}`" aspect-ratio="1" class="skin-img"/>

        <div v-if="skin.locked" class="lock-overlay">
          <img src="@/assets/images/icon_lock.png" alt="Locked Overlay" class="lock-icon"/>
          <p class="locked-text">{{ t.profile.account.lblLockedOverlay }}</p>
        </div>

        <div class="price-overlay">
          <p class="price-text">{{ skin.price === 0 ? 'Free' : skin.price + '$' }}</p>
        </div>

      </div>
    </div>

    <button class="scroll-button next" @click="scrollRight">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
      </svg>
    </button>

    <VModal v-model="dialog" max-width="500">
      <VCard>
        <v-card-title class="headline">{{ t.profile.account.lblConfirmation }}</v-card-title>
        <v-card-text v-if="!skinToSelect.locked">{{ t.profile.account.msgSelectSkin }}</v-card-text>
        <v-card-text v-else>{{ t.profile.account.msgInsufficientFunds }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false" class="cancel-btn">{{ t.modal.btnCancel }}</v-btn>
          <v-btn v-if="!skinToSelect.locked" @click="confirmSelection" class="confirm-btn">{{ t.modal.btnConfirm }}</v-btn>
        </v-card-actions>
      </VCard>
    </VModal>
  </div>
</template>

<script setup>
import { nextTick, ref, watch} from 'vue';
import {VImg, VBtn, VCard, VCardTitle, VCardText, VCardActions, VSpacer} from 'vuetify/components';
import store from "@/core/state/store.js";
import {t} from "@/locales/index.js";


const skins = ref([
  {id: 'skin_m_1.png', image: 'skin_m_1.png', price: 0, locked: false},
  {id: 'skin_m_2.png', image: 'skin_m_2.png', price: 0, locked: false},
  {id: 'skin_m_3.png', image: 'skin_m_3.png', price: 0, locked: false},
  {id: 'skin_m_4.png', image: 'skin_m_4.png', price: 0, locked: false},
  {id: 'skin_m_5.png', image: 'skin_m_5.png', price: 0, locked: false},
  {id: 'skin_m_6.png', image: 'skin_m_6.png', price: 100, locked: false},
  {id: 'skin_m_7.png', image: 'skin_m_7.png', price: 100, locked: false},
  {id: 'skin_m_8.png', image: 'skin_m_8.png', price: 100, locked: false},
  {id: 'skin_m_9.png', image: 'skin_m_9.png', price: 100, locked: false},
  {id: 'skin_m_10.png', image: 'skin_m_10.png', price: 100, locked: false},
  {id: 'skin_m_11.png', image: 'skin_m_11.png', price: 100, locked: false},
  {id: 'skin_m_12.png', image: 'skin_m_12.png', price: 100, locked: false},
  {id: 'skin_m_13.png', image: 'skin_m_13.png', price: 100, locked: false},
  {id: 'skin_m_14.png', image: 'skin_m_14.png', price: 100, locked: false},
  {id: 'skin_m_15.png', image: 'skin_m_15.png', price: 100, locked: false},
  {id: 'skin_m_16.png', image: 'skin_m_16.png', price: 100, locked: false},
  {id: 'skin_m_17.png', image: 'skin_m_17.png', price: 100, locked: false},
  {id: 'skin_m_18.png', image: 'skin_m_18.png', price: 100, locked: false},
  {id: 'skin_m_19.png', image: 'skin_m_19.png', price: 100, locked: false},
  {id: 'skin_m_20.png', image: 'skin_m_20.png', price: 100, locked: false},
  {id: 'skin_w_1.png', image: 'skin_w_1.png', price: 100, locked: false},
  {id: 'skin_w_2.png', image: 'skin_w_2.png', price: 100, locked: false},
  {id: 'skin_w_3.png', image: 'skin_w_3.png', price: 100, locked: false},
  {id: 'skin_w_4.png', image: 'skin_w_4.png', price: 100, locked: false},
  {id: 'skin_w_5.png', image: 'skin_w_5.png', price: 100, locked: false},
  {id: 'skin_m_21.png', image: 'skin_m_21.png', price: 100, locked: false},
  {id: 'skin_m_22.png', image: 'skin_m_22.png', price: 150, locked: false},
  {id: 'skin_m_23_notstandart.png', image: 'skin_m_23_notstandart.png', price: 200, locked: false},
  {id: 'skin_m_24.png', image: 'skin_m_24.png', price: 250, locked: false},
  {id: 'skin_m_25.png', image: 'skin_m_25.png', price: 300, locked: false},
  {id: 'skin_m_26.png', image: 'skin_m_26.png', price: 350, locked: false},
  {id: 'skin_m_27.png', image: 'skin_m_27.png', price: 400, locked: false},
  {id: 'skin_m_28.png', image: 'skin_m_28.png', price: 450, locked: false},
  {id: 'skin_m_29.png', image: 'skin_m_29.png', price: 500, locked: false},
  {id: 'skin_m_30.png', image: 'skin_m_30.png', price: 550, locked: false},
  {id: 'skin_m_31.png', image: 'skin_m_31.png', price: 600, locked: false},
  {id: 'skin_m_32.png', image: 'skin_m_32.png', price: 650, locked: false},
  {id: 'skin_m_33.png', image: 'skin_m_33.png', price: 700, locked: false},
  {id: 'skin_m_34.png', image: 'skin_m_34.png', price: 750, locked: false},
  {id: 'skin_m_35.png', image: 'skin_m_35.png', price: 800, locked: false},
  {id: 'skin_m_36.png', image: 'skin_m_36.png', price: 850, locked: false},
  {id: 'skin_m_37.png', image: 'skin_m_37.png', price: 900, locked: false},
  {id: 'skin_m_38.png', image: 'skin_m_38.png', price: 950, locked: false},
  {id: 'skin_m_39.png', image: 'skin_m_39.png', price: 1000, locked: false},
  {id: 'skin_m_40.png', image: 'skin_m_40.png', price: 150, locked: false},
  {id: 'skin_m_41.png', image: 'skin_m_41.png', price: 200, locked: false},
  {id: 'skin_m_42.png', image: 'skin_m_42.png', price: 250, locked: false},
  {id: 'skin_m_43.png', image: 'skin_m_43.png', price: 300, locked: false},
  {id: 'skin_m_44.png', image: 'skin_m_44.png', price: 350, locked: false},
  {id: 'skin_m_45.png', image: 'skin_m_45.png', price: 400, locked: false},
  {id: 'skin_m_46.png', image: 'skin_m_46.png', price: 450, locked: false},
  {id: 'skin_m_47.png', image: 'skin_m_47.png', price: 500, locked: false},
  {id: 'skin_m_48.png', image: 'skin_m_48.png', price: 550, locked: false},
  {id: 'skin_m_49.png', image: 'skin_m_49.png', price: 600, locked: false},
  {id: 'skin_m_50.png', image: 'skin_m_50.png', price: 650, locked: false},
  {id: 'skin_m_51.png', image: 'skin_m_51.png', price: 700, locked: false},
  {id: 'skin_m_52.png', image: 'skin_m_52.png', price: 750, locked: false},
  {id: 'skin_m_53.png', image: 'skin_m_53.png', price: 800, locked: false},
  {id: 'skin_m_54.png', image: 'skin_m_54.png', price: 850, locked: false},
  {id: 'skin_m_55.png', image: 'skin_m_55.png', price: 900, locked: false},
  {id: 'skin_m_56.png', image: 'skin_m_56.png', price: 950, locked: false},
  {id: 'skin_m_57.png', image: 'skin_m_57.png', price: 1000, locked: false},
  {id: 'skin_m_58.png', image: 'skin_m_58.png', price: 150, locked: false},
  {id: 'skin_m_59.png', image: 'skin_m_59.png', price: 200, locked: false},
  {id: 'skin_m_60.png', image: 'skin_m_60.png', price: 250, locked: false},
  {id: 'skin_m_61.png', image: 'skin_m_61.png', price: 300, locked: false},
  {id: 'skin_m_62.png', image: 'skin_m_62.png', price: 350, locked: false},
  {id: 'skin_m_63.png', image: 'skin_m_63.png', price: 400, locked: false},
  {id: 'skin_m_64.png', image: 'skin_m_64.png', price: 450, locked: false},
  {id: 'skin_m_65.png', image: 'skin_m_65.png', price: 500, locked: false},
  {id: 'skin_m_66.png', image: 'skin_m_66.png', price: 550, locked: false},
  {id: 'skin_m_67.png', image: 'skin_m_67.png', price: 600, locked: false},
  {id: 'skin_m_68.png', image: 'skin_m_68.png', price: 650, locked: false},
  {id: 'skin_m_69.png', image: 'skin_m_69.png', price: 700, locked: false},
  {id: 'skin_m_70.png', image: 'skin_m_70.png', price: 750, locked: false},
  {id: 'skin_m_71.png', image: 'skin_m_71.png', price: 800, locked: false},
  {id: 'skin_m_72.png', image: 'skin_m_72.png', price: 850, locked: false},
  {id: 'skin_m_73.png', image: 'skin_m_73.png', price: 900, locked: false},
  {id: 'skin_m_74.png', image: 'skin_m_74.png', price: 950, locked: false},
  {id: 'skin_m_75.png', image: 'skin_m_75.png', price: 1000, locked: false},
  {id: 'skin_m_76.png', image: 'skin_m_76.png', price: 150, locked: false},
  {id: 'skin_m_77.png', image: 'skin_m_77.png', price: 200, locked: false},
  {id: 'skin_m_78.png', image: 'skin_m_78.png', price: 250, locked: false},
  {id: 'skin_m_79.png', image: 'skin_m_79.png', price: 300, locked: false},
  {id: 'skin_m_80.png', image: 'skin_m_80.png', price: 350, locked: false},
  {id: 'skin_m_81.png', image: 'skin_m_81.png', price: 400, locked: false},
  {id: 'skin_m_82.png', image: 'skin_m_82.png', price: 450, locked: false},
  {id: 'skin_m_83.png', image: 'skin_m_83.png', price: 500, locked: false},
  {id: 'skin_m_84.png', image: 'skin_m_84.png', price: 550, locked: false},
  {id: 'skin_m_85.png', image: 'skin_m_85.png', price: 600, locked: false},
  {id: 'skin_m_86.png', image: 'skin_m_86.png', price: 650, locked: false},
  {id: 'skin_m_87.png', image: 'skin_m_87.png', price: 700, locked: false},
  {id: 'skin_m_88.png', image: 'skin_m_88.png', price: 750, locked: false},
  {id: 'skin_m_89.png', image: 'skin_m_89.png', price: 800, locked: false},
  {id: 'skin_m_90.png', image: 'skin_m_90.png', price: 850, locked: false},
  {id: 'skin_m_91.png', image: 'skin_m_91.png', price: 900, locked: false},
  {id: 'skin_m_92.png', image: 'skin_m_92.png', price: 950, locked: false},
  {id: 'skin_m_93.png', image: 'skin_m_93.png', price: 1000, locked: false},
  {id: 'skin_m_94.png', image: 'skin_m_94.png', price: 150, locked: false},
  {id: 'skin_m_95.png', image: 'skin_m_95.png', price: 200, locked: false},
  {id: 'skin_m_96.png', image: 'skin_m_96.png', price: 250, locked: false},
  {id: 'skin_m_97.png', image: 'skin_m_97.png', price: 300, locked: false},
  {id: 'skin_m_98.png', image: 'skin_m_98.png', price: 350, locked: false},
  {id: 'skin_m_99.png', image: 'skin_m_99.png', price: 400, locked: false},
  {id: 'skin_m_100.png', image: 'skin_m_100.png', price: 450, locked: false},
  {id: 'skin_m_101.png', image: 'skin_m_101.png', price: 500, locked: false},
  {id: 'skin_m_102.png', image: 'skin_m_102.png', price: 550, locked: false},
  {id: 'skin_m_103.png', image: 'skin_m_103.png', price: 600, locked: false},
  {id: 'skin_m_104.png', image: 'skin_m_104.png', price: 650, locked: false},
  {id: 'skin_m_105.png', image: 'skin_m_105.png', price: 700, locked: false},
  {id: 'skin_m_106.png', image: 'skin_m_106.png', price: 750, locked: false},
  {id: 'skin_m_107.png', image: 'skin_m_107.png', price: 800, locked: false},
  {id: 'skin_m_108.png', image: 'skin_m_108.png', price: 850, locked: false},
  {id: 'skin_m_109.png', image: 'skin_m_109.png', price: 900, locked: false},
  {id: 'skin_m_110.png', image: 'skin_m_110.png', price: 950, locked: false},
  {id: 'skin_m_111.png', image: 'skin_m_111.png', price: 1000, locked: false},
  {id: 'skin_m_112.png', image: 'skin_m_112.png', price: 150, locked: false},
  {id: 'skin_m_113.png', image: 'skin_m_113.png', price: 200, locked: false},
  {id: 'skin_m_114.png', image: 'skin_m_114.png', price: 250, locked: false},
  {id: 'skin_m_115.png', image: 'skin_m_115.png', price: 300, locked: false},
  {id: 'skin_m_116.png', image: 'skin_m_116.png', price: 350, locked: false},
  {id: 'skin_m_117.png', image: 'skin_m_117.png', price: 400, locked: false},
  {id: 'skin_w_6.png', image: 'skin_w_6.png', price: 200, locked: false},
  {id: 'skin_w_7.png', image: 'skin_w_7.png', price: 250, locked: false},
  {id: 'skin_w_8.png', image: 'skin_w_8.png', price: 300, locked: false},
  {id: 'skin_w_9.png', image: 'skin_w_9.png', price: 350, locked: false},
  {id: 'skin_w_10.png', image: 'skin_w_10.png', price: 400, locked: false},
  {id: 'skin_w_11.png', image: 'skin_w_11.png', price: 450, locked: false},
  {id: 'skin_w_12.png', image: 'skin_w_12.png', price: 500, locked: false},
  {id: 'skin_w_13.png', image: 'skin_w_13.png', price: 550, locked: false},
  {id: 'skin_w_14.png', image: 'skin_w_14.png', price: 600, locked: false},
  {id: 'skin_w_15.png', image: 'skin_w_15.png', price: 650, locked: false},
  {id: 'skin_w_16.png', image: 'skin_w_16.png', price: 700, locked: false},
  {id: 'skin_w_17.png', image: 'skin_w_17.png', price: 750, locked: false},
  {id: 'skin_w_18.png', image: 'skin_w_18.png', price: 800, locked: false},
  {id: 'skin_w_19.png', image: 'skin_w_19.png', price: 850, locked: false},
  {id: 'skin_w_20.png', image: 'skin_w_20.png', price: 900, locked: false},
  {id: 'skin_w_21.png', image: 'skin_w_21.png', price: 950, locked: false},
  {id: 'skin_w_22.png', image: 'skin_w_22.png', price: 1000, locked: false},
  {id: 'skin_w_23.png', image: 'skin_w_23.png', price: 150, locked: false},
  {id: 'skin_w_24.png', image: 'skin_w_24.png', price: 200, locked: false},
  {id: 'skin_w_25.png', image: 'skin_w_25.png', price: 250, locked: false},
  {id: 'skin_w_26.png', image: 'skin_w_26.png', price: 300, locked: false},
  {id: 'vip_k1.png', image: 'vip_k1.png', price: 1500, locked: false},
  {id: 'vip_k2.png', image: 'vip_k2.png', price: 1500, locked: false},
  {id: 'vip_t1.png', image: 'vip_t1.png', price: 1500, locked: false},
  {id: 'vip_t2.png', image: 'vip_t2.png', price: 1500, locked: false}
]);

const selectedSkin = ref(skins.value[0].id);
const dialog = ref(false);
const skinToSelect = ref(null);

const scrollContainer = ref(null);

const selectSkin = (skin) => {
  skinToSelect.value = skin;
  dialog.value = true;
};

const confirmSelection = () => {
  selectedSkin.value = skinToSelect.value.id;

  store.dispatch('master/changeSkin', selectedSkin.value);

  dialog.value = false;
};

const scrollLeft = () => {
  scrollContainer.value.scrollBy({
    left: -300, // Adjust the value as needed
    behavior: 'smooth'
  });
};

const scrollRight = () => {
  scrollContainer.value.scrollBy({
    left: 300, // Adjust the value as needed
    behavior: 'smooth'
  });
};

const scrollToSelectedSkin = () => {
  if (scrollContainer.value) {
    const selectedSkinElement = scrollContainer.value.querySelector('.selected-skin');
    if (selectedSkinElement) {
      selectedSkinElement.scrollIntoView({
        behavior: 'instant',
        block: 'nearest',
        inline: 'center'}
      );
    }
  }
};

const loadData = async (userData) => {
  skins.value.forEach(skin => {
    skin.locked = (skin.price * 100) > userData.balance;
  });
  selectedSkin.value = userData.skin;

  await nextTick(); // Ensure DOM updates
  scrollToSelectedSkin();
};

watch(store.getters['master/getMaster'], (newMaster) => {
  if (newMaster && newMaster.userData) {
    loadData(newMaster.userData);
  }
}, {immediate: true});


</script>

<style scoped>
.scroll-container {
  display: flex;
  align-items: center;
  position: relative;
  margin: 10px 0 0;
}

.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding: 0.3rem 1rem;
  height: auto;
  margin-bottom: 20px;
  width: 100%;
  --webkit-overflow-scrolling: touch;
}

.scroll-button {
  z-index: 1;
}

.skin-item {
  position: relative;
  cursor: pointer;
  margin-right: 1.5rem;
  transition: transform 0.2s;
  display: inline-block;
  width: 100px;
  height: 180px;
  border-radius: 4px;
  border: 1px solid white;
  background-color: var(--black-opacity-80);
}

.skin-item:hover {
  transform: scale(1.05);
}

.skin-img{
  padding: 5px;
  position: absolute;
  height: 100%;
  width: 100%;
}

.skin-item :deep(.v-img__img){
  position: relative;
  z-index: 1;

}

.selected-skin {
  border: 2px solid var(--pink);
  border-radius: 8px;
  transform: scale(1.05);
}

.scroll-button {
  background: var(--black-opacity-80);
  border: 2px solid grey;
  border-radius: 50%; /* Круглая форма */
  cursor: pointer;
  padding: 6px;
  opacity: 0.5; /* Прозрачность кнопок */
  transition: opacity 0.3s;
  width: 40px; /* Ширина для круговой формы */
  height: 40px; /* Высота для круговой формы */

  position: absolute;
}

.scroll-button.next {
  right: 10px;
}

.scroll-button.prev {
  left: 10px;
}

.scroll-button:hover {
  opacity: 1;
}

.scroll-button svg {
  width: 100%;
  height: 100%;
  fill: white;
}

.locked {
  opacity: 0.5;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.lock-icon {
  width: 75px;
  height: 75px;
  margin-bottom: 10px;
}

.locked-text {
  font-size: 0.7rem;
  color: white;
  word-wrap: break-word; /* Перенос текста */
  text-align: center;
  padding: 0 10px; /* Отступы для улучшения читаемости */
  white-space: normal;
}

.price-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  color: white;
  text-align: center;
  padding: 5px 0;
}

.price-text {
  margin: 0;
  font-size: 1.5em;
  font-family: 'Anonymous', 'Courier New', Consolas, monospace;
}
</style>
