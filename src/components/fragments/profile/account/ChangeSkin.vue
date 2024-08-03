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
        <v-img :src="skin.image" aspect-ratio="1"/>

        <div v-if="skin.locked" class="lock-overlay">
          <img src="@/assets/images/icon_lock.svg" alt="Locked Overlay" class="lock-icon"/>
          <p class="locked-text">Недостаточно средств</p>
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

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">Подтверждение выбора</v-card-title>
        <v-card-text v-if="!skinToSelect.locked">Вы уверены, что хотите выбрать этот скин?</v-card-text>
        <v-card-text v-else>У вас недостаточно средств для покупки этого скина. Хотите пополнить баланс?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" @click="dialog = false">Отмена</v-btn>
          <v-btn color="blue darken-1" v-if="!skinToSelect.locked" @click="confirmSelection">Подтвердить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeMount, ref, watch} from 'vue';
import { VImg, VBtn, VDialog, VCard, VCardTitle, VCardText, VCardActions, VSpacer } from 'vuetify/components';
import store from "@/core/state/store.js";

const master = computed(() => store.getters['master/getMaster']);

const skins = ref([
  { id: 1, image: 'skin1.png', price: 0, locked: false },
  { id: 2, image: 'skin2.png', price: 10, locked: false },
  { id: 3, image: 'skin3.png', price: 15, locked: false },
  { id: 4, image: 'skin4.png', price: 20, locked: false },
  { id: 5, image: 'skin5.png', price: 25, locked: false },
  { id: 6, image: 'skin6.png', price: 30, locked: false },
  { id: 7, image: 'skin7.png', price: 35, locked: false },
  { id: 8, image: 'skin8.png', price: 40, locked: false },
  { id: 8, image: 'skin8.png', price: 990, locked: false },
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
      selectedSkinElement.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    }
  }
};

const loadData = async (userData) => {
  skins.value.forEach(skin => {
    skin.locked = skin.price > userData.balance;
  });
  selectedSkin.value = userData.skin;

  await nextTick(); // Ensure DOM updates
  scrollToSelectedSkin();
};

watch(() => master.value, (newMaster) => {
  if (newMaster && newMaster.userData) {
    loadData(newMaster.userData);
  }
}, {immediate: true});

//onBeforeMount(() => loadData(master.value.userData));

</script>

<style scoped>
.scroll-container {
  display: flex;
  align-items: center;
  position: relative;
  margin: 30px 10px 0;
}

.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  padding: 1rem;
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
  width: 150px;
  height: 250px;
  border-radius: 4px;
  border: 1px solid white;
  background-color: var(--black-opacity-60);
}

.skin-item:hover {
  transform: scale(1.05);
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
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
}

.locked-text {
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
  font-size: 2em;
  font-family: Anonymous, sans-serif;
}
</style>
