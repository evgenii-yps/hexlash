<template>
  <div class="skin-selector-container horizontal-scroll">
    <v-row class="horizontal-scroll">
      <v-col
          v-for="(skin, index) in skins"
          :key="index"
          @click="selectSkin(skin)"
          :class="{ 'selected-skin': skin.id === selectedSkin.id }"
          class="skin-item"
      >
        <v-img :src="skin.image" aspect-ratio="1"></v-img>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">Confirm Selection</v-card-title>
        <v-card-text>Are you sure you want to select this skin?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1"  @click="dialog = false">Cancel</v-btn>
          <v-btn color="blue darken-1"  @click="confirmSelection">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VRow, VCol, VImg } from 'vuetify/components';

// Предполагается, что данные о скинах загружаются из какого-то источника
const skins = ref([
  { id: 1, image: 'skin1.png' },
  { id: 2, image: 'skin2.png' },
  { id: 3, image: 'skin3.png' },
  { id: 4, image: 'skin4.png' },
  { id: 5, image: 'skin1.png' },
  { id: 6, image: 'skin2.png' },
  { id: 7, image: 'skin3.png' },
  { id: 8, image: 'skin4.png' },
]);

const selectedSkin = ref(skins.value[0]);
const dialog = ref(false);
const skinToSelect = ref(null);

const selectSkin = (skin) => {
  skinToSelect.value = skin;
  dialog.value = true;
};

const confirmSelection = () => {
  selectedSkin.value = skinToSelect.value;
  dialog.value = false;
};
</script>

<style scoped>


.horizontal-scroll {
  max-height: 400px;
  overflow-x: auto;
  white-space: nowrap;
  padding: 1rem;
}

.skin-item {
  cursor: pointer;
  margin-right: 1rem;
  transition: transform 0.2s;
}

.skin-item:hover {
  transform: scale(1.05);
}

.selected-skin {
  border: 2px solid var(--pink);
  border-radius: 8px;
  padding: 2px;
}
</style>
