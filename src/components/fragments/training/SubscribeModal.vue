<template>
  <VModal v-model="dialog" max-width="500" @click:outside="closeDialog">
    <VCard>
      <v-card-title class="headline">{{ props.task?.title }}</v-card-title>
      <v-card-text class="text">
        {{ props.task?.description }}
      </v-card-text>

      <VBtn size="large" @click="goToLink(props.task)" class="execute-task confirm-btn">Go to Task</VBtn>

      <div class="notice"><span style="color:var(--white)">ВНИМАНИЕ</span> - Нажимая "Подтвердить", ты берёшь на
        себя обязательство. В этом клубе нет места для пустых обещаний. Например если подписался на канал, обратного пути нет.
        Отписка после подтверждения - прямой путь к бану. Здесь всё серьёзно: нарушил слово - попал в вечный бан.
      </div>

      <v-card-actions>
        <VBtnDark @click="closeDialog" class="cancel-btn">Cancel</VBtnDark>
        <VBtn @click="completeTask" :disabled="!isOpenLink" class="confirm-btn">Подтвердить</VBtn>
      </v-card-actions>
    </VCard>
  </VModal>
</template>

<script setup>
import {ref, defineEmits, computed} from 'vue';
import router from "@/router/index.js";

const dialog = ref(false);
const emit = defineEmits(['close', 'complete']);

const isOpenLink = ref(false);

const props = defineProps({
  task: Object
});


function goToLink(task) {
  if (task.link.startsWith('https')) {
    // Внешняя ссылка
    window.open(task.link, '_blank');

    isOpenLink.value = true;

  } else {
    // Внутренний маршрут
    router.push( task.link);
  }
}

function closeDialog() {
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

.execute-task{
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
