<template>
  <div class="delete-account-container">
    <HexButton
        variant="secondary"
        size="md"
        block
        class="delete-btn"
        @click="confirmDelete">
      {{ t.profile.account.lblDeleteAccount }}
      <img src="@/assets/images/icon_close.svg" alt="Close" class="custom-icon"/>
    </HexButton>

    <!-- C9: VModal/VCard/v-card-*/v-spacer → inline Teleport + canonical .hex-modal-*.
         Confirm uses HexButton variant=danger (destructive flow). -->
    <Teleport to="body">
      <div
          v-if="dialog"
          class="hex-modal-overlay"
          @click.self="dialog = false"
      >
        <div class="hex-modal" @click.stop>
          <h2 class="hex-modal-title">{{ t.profile.account.lblConfirmDeletion }}</h2>
          <button class="hex-modal-close" @click="dialog = false" aria-label="Close">×</button>
          <div class="hex-modal-body">
            {{ t.profile.account.msgConfirmDelete }}
          </div>
          <div class="hex-modal-actions">
            <HexButton variant="secondary" size="md" @click="dialog = false">
              {{ t.modal.btnCancel }}
            </HexButton>
            <HexButton variant="danger" size="md" @click="handleDelete">
              {{ t.modal.btnConfirm }}
            </HexButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import HexButton from '@/components/ui/HexButton.vue';
import store from "@/core/state/store.js";
import router from "@/router/index.js";
import {t} from "@/locales/index.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const dialog = ref(false);

const confirmDelete = () => {
  dialog.value = true;
};

const handleDelete = async () => {
  await store.dispatch("master/deleteAccount")
};
</script>

<style scoped>
.delete-account-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 20px;
}


.delete-btn {
  width: 100%;
  height: 40px !important;
  max-width: 500px;
  text-align: center;
  color: var(--hex-text-primary);
  cursor: pointer;
  opacity: 0.7;
  font-size: 0.7rem !important;
  background-color: var(--hex-text-secondary) !important;
}

.custom-icon {
  width: 15px; /* Увеличиваем ширину изображения */
  height: 15px; /* Увеличиваем высоту изображения */
  margin-left: 15px; /* Добавляем отступ справа для расстояния между иконкой и текстом */
}

.confirm-delete-btn {
  cursor: pointer;
  background-color: var(--hex-danger);
  color: var(--hex-text-primary) !important;
  margin: 10px;
  opacity: 0.9;
}

</style>
