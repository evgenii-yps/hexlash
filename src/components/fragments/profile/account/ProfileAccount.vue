<template>
  <div class="profile-account">
    <BackButton/>


    <ChangeSkin/>
    <ConfirmEmail/>
    <ChangeLogin/>
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


</script>

<style scoped>
.profile-account {
  margin-top: 2rem;
}
</style>
