<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card title="Subscribe">
      <v-card-actions>

        <v-btn text="Close" variant="plain" @click="closeDialog">Close</v-btn>
        <v-btn color="primary" text="Save" variant="tonal" @click="completeTask">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, defineEmits} from 'vue';

const dialog = ref(false);
const emit = defineEmits(['close', 'complete']);

function closeDialog() {
  emit('close');
}

const props = defineProps({
  task: Object
});

const completeTask = () => {
  emit('complete', props.task.id);
  emit('close');
};

</script>

<style scoped>

</style>
