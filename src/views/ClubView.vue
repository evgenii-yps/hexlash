<template>
  <div class="background background_club">
    <div class="club-container">
      <div class="club-content-wrapper">
        <div class="club-header">
          <img :src="clubAvatar" alt="Club Avatar" class="club-avatar" @click="isOwner && editAvatar" />
          <input v-if="isEditingAvatar" type="file" @change="uploadAvatar" ref="avatarInput" class="edit-avatar-input" />

          <div class="club-info">
            <h2 class="club-name" v-if="!isEditingName" @click="isOwner && editName">
              {{ clubName }}
              <img v-if="isOwner" src="@/assets/images/icon_pencil.svg" alt="Change Name" class="change-name-icon" />
            </h2>
            <input v-else
                   type="text"
                   v-model="clubName"
                   @blur="saveName"
                   ref="nameInput"
                   class="edit-name-input"
            />
          </div>
        </div>

        <div class="club-description-wrapper">
          <p class="club-description" v-if="!isEditingDescription" @click="isOwner && editDescription">
            {{ clubDescription }}
            <img v-if="isOwner" src="@/assets/images/icon_pencil.svg" alt="Change Description" class="change-description-icon" />
          </p>
          <textarea v-else
                    v-model="clubDescription"
                    @blur="saveDescription"
                    ref="descriptionInput"
                    class="edit-description-input"
          ></textarea>
        </div>

        <ClubStats v-if="clubData" :club="clubData" />

        <div class="club-buttons" v-if="!isMember">
          <button @click="joinClub">Перейти в клуб</button>
        </div>

        <div class="club-buttons">
          <button @click="viewMembers">Участники</button>
        </div>

        <div v-if="isOwner">
          <Withdraw />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Withdraw from "@/components/fragments/club/Withdraw.vue";
import ClubStats from "@/components/fragments/club/ClubStats.vue";
import store from "@/core/state/store.js";

const route = useRoute();
const clubId = route.params.id;

const clubData = ref(null);
let isOwner = ref(false);
const isMember = computed(() => store.getters['club/isMyClub']);

const clubAvatar = computed(() => clubData.value ? clubData.value.avatarUrl : '');
const clubName = ref('');
const clubDescription = ref('');
const isEditingName = ref(false);
const isEditingDescription = ref(false);
const isEditingAvatar = ref(false);

const nameInput = ref(null);
const descriptionInput = ref(null);
const avatarInput = ref(null);

onMounted(async () => {
  await store.dispatch('club/fetchClubById', clubId);
  clubData.value = store.getters['club/getSelectedClub'];
  if (clubData.value) {
    clubName.value = clubData.value.name;
    clubDescription.value = clubData.value.description;
    isOwner.value = await store.dispatch('club/isOwner', clubId);
  }
});

const editName = () => {
  isEditingName.value = true;
  nextTick(() => {
    nameInput.value.focus();
  });
};

const saveName = () => {
  isEditingName.value = false;
  store.dispatch('club/updateSelectedClub', { name: clubName.value });
};

const editDescription = () => {
  isEditingDescription.value = true;
  nextTick(() => {
    descriptionInput.value.focus();
  });
};

const saveDescription = () => {
  isEditingDescription.value = false;
  store.dispatch('club/updateSelectedClub', { description: clubDescription.value });
};

const editAvatar = () => {
  isEditingAvatar.value = true;
  nextTick(() => {
    avatarInput.value.click();
  });
};

const uploadAvatar = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Логика для загрузки аватара
    isEditingAvatar.value = false;
    const reader = new FileReader();
    reader.onload = () => {
      store.dispatch('club/uploadAvatarForSelectedClub', { avatarDataUrl: reader.result });
    };
    reader.readAsDataURL(file);
  }
};

const joinClub = () => {
  // Логика для вступления в клуб
};

const viewMembers = () => {
  // Логика для просмотра участников клуба
};
</script>

<style scoped>
.background_club {
  background: url('@/assets/images/background_club.webp') no-repeat center center;
}

.background_club::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to left top, black 40%, transparent 75%);
  z-index: 1;
}

.background_club::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 2;
  opacity: 1;
  animation: fadeOut 1s forwards;
}

@keyframes fadeOut {
  to {
    opacity: 0;
  }
}

.club-container {
  position: relative;
  z-index: 10;
  overflow-y: auto;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.club-content-wrapper {
  width: 100%;
  padding: 10vh 0;
  box-sizing: border-box;
}

.club-header {
  display: flex;
  align-items: center;
}

.club-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-right: 20px;
  cursor: pointer;
  background-color:white;
}

.edit-avatar-input {
  display: none;
}

.club-name {
  font-size: 2.5em;
  color: white;
}

.club-info {
  display: flex;
  align-items: center;
}

.change-name-icon, .change-description-icon {
  width: 24px;
  height: 24px;
  margin-left: 10px;
  cursor: pointer;
}

.edit-name-input, .edit-description-input {
  font-size: 2.5em;
  background: transparent;
  border: none;
  border-bottom: 1px solid white;
  color: white;
  max-width: 70vw;
  outline: none;
}

.club-description-wrapper {
  margin: 20px 0;
}

.club-description {
  color: white;
  cursor: pointer;
}

.edit-description-input {
  width: 100%;
  height: 100px;
  background: transparent;
  border: 1px solid white;
  color: white;
  outline: none;
  resize: none;
}

.club-buttons {
  display: flex;
  gap: 10px;
}

.club-buttons button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>
