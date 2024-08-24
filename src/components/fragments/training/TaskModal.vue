<template>
  <VModal v-model="dialog" max-width="500" @click:outside="closeDialog">
    <VCard>
      <v-card-title class="headline">Daily task</v-card-title>
      <v-card-text class="text">
        {{ props.task?.description }}
      </v-card-text>

      <VBtn v-if="isSocialTask" size="large" @click="goToLink(props.task)" class="execute-task confirm-btn">Go to Task</VBtn>

      <div v-if="isSocialTask" class="notice"><span style="color:var(--white)">ВНИМАНИЕ</span> - Нажимая "Подтвердить", ты берёшь на
        себя обязательство. В этом клубе нет места для пустых обещаний. Например если подписался на канал, обратного
        пути нет.
        Отписка после подтверждения - прямой путь к бану. Здесь всё серьёзно: нарушил слово - попал в вечный бан.
      </div>

      <v-card-actions>
        <div v-if="isSocialTask">
          <VBtnDark @click="closeDialog" class="cancel-btn">Cancel</VBtnDark>
          <VBtn @click="completeTask" :disabled="!isOpenLink" class="confirm-btn">Подтвердить</VBtn>
        </div>
        <div v-else>
          <VBtn @click="closeDialog" class="confirm-btn">OK</VBtn>
        </div>

      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {ref, defineEmits, computed} from 'vue';

const dialog = ref(false);
const emit = defineEmits(['close', 'complete']);

const isOpenLink = ref(false);

const props = defineProps({
  task: Object
});

const isSocialTask = computed(() =>
    props.task?.category === 'social_media' || props.task?.category === 'watch_video');

const goToLink = (task) => {
  if (task.link.startsWith('https')) {
    // Внешняя ссылка
    window.open(task.link, '_blank');
    isOpenLink.value = true;
  }
}

const closeDialog = () => {
  emit('close');
  isOpenLink.value = false;
}

const completeTask = () => {
  emit('complete', props.task.id);
  emit('close');
  isOpenLink.value = false;
};

</script>

<style scoped>
.execute-task {
  width: 70%;
  margin: 0 auto;
  text-transform: none !important;
}

.notice {
  margin-top: 20px;
  color: var(--gray2);
  font-size: 0.8rem;
  padding: 0 15px;
  line-height: 1.1rem;
}
</style>
