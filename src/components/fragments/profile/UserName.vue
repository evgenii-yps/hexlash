<template>
  <div class="name-container">
    <div class="name-edit-container">
      <h2 class="label-name">
        {{ userName || t('profile.anonymous') }}
      </h2>
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const { t } = useI18n({ useScope: 'global' })

// Определяем пропс userName
defineProps({
  userName: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.name-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.name-edit-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.label-name {
  flex-grow: 1;
  font-weight: normal;
  font-size: 2.3em;
  max-width: 70vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
