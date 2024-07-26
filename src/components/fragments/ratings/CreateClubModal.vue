<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card title="User Profile">
      <v-card-actions>

        <v-btn text="Close" variant="plain" @click="closeDialog">Close</v-btn>
        <v-btn color="primary" text="Save" variant="tonal" @click="saveProfile">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const dialog = ref(false);
const emit = defineEmits(['close']);

function closeDialog() {
  emit('close');
}

function saveProfile() {
  emit('close');
  console.log('Profile saved');
}
</script>

<style scoped>

</style>
