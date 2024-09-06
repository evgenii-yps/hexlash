<template>
  <div class="profile-account">
    <BackButton :defaultRoute="backRef(route)" />


    <ChangeSkin/>
    <ConfirmEmail/>
    <ChangeLogin/>
    <ChangeLanguage/>
    <Switcher3DPunch/>
    <ChangePassword/>
    <DeleteAccount/>



  </div>
</template>

<script setup>
import BackButton from "@/components/ui/BackButton.vue";
import ChangePassword from "@/components/fragments/profile/account/ChangePassword.vue";
import ConfirmEmail from "@/components/fragments/profile/account/ConfirmEmail.vue";
import ChangeLogin from "@/components/fragments/profile/account/ChangeLogin.vue";
import DeleteAccount from "@/components/fragments/profile/account/DeleteAccount.vue";
import ChangeSkin from "@/components/fragments/profile/account/ChangeSkin.vue";
import ChangeLanguage from "@/components/fragments/profile/account/ChangeLanguage.vue";
import Switcher3DPunch from "@/components/fragments/profile/account/Switcher3DPunch.vue";
import {onMounted} from "vue";
import {backRef} from "@/router/index.js";
import {useRoute} from "vue-router";
const route = useRoute();


onMounted(()=>{
  const contentContainer = document.querySelector('.profile-container');
  if (contentContainer) {
    contentContainer.scrollTo(0, 0); // Прокрутить в начало
  }
})


</script>

<style scoped>
.profile-account {
  margin-top: 2rem;
}

</style>
