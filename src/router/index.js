import { createRouter, createWebHistory } from "vue-router";
import store from "@/core/state/store.js";

const authRoutes = [
    { path: '/auth/login', name: 'Login', component: () => import("/src/views/AuthView.vue") },
    { path: '/auth/invite', name: 'Invite', component: () => import("/src/views/AuthView.vue") }
];

const publicRoutes = [
    { path: '/privacy', name: 'Privacy', component: () => import("/src/views/PageView.vue") }
];

const protectedRoutes = [
    { path: '/', name: 'Home' },
    { path: '/arena', name: 'Arena', component: () => import("/src/views/ArenaView.vue") },
    { path: '/profile', name: 'Profile', component: () => import("/src/views/ProfileView.vue") },
    { path: '/profile/balance', name: 'Balance', component: () => import("/src/views/ProfileView.vue") },
    { path: '/profile/wallet', name: 'Wallet', component: () => import("/src/views/ProfileView.vue") },
    { path: '/profile/account', name: 'Account', component: () => import("/src/views/ProfileView.vue") },
    { path: '/ratings', name: 'Ratings', component: () => import("/src/views/RatingsView.vue") },
    { path: '/training', name: 'Training', component: () => import("/src/views/TrainingView.vue") },
    { path: '/training/fight', name: 'Training fight', component: () => import("/src/views/FightView.vue") },
    { path: '/club/:id', name: 'Club', component: () => import("/src/views/ClubView.vue") },
    { path: '/training/punch', name: 'Punch', component: () => import("/src/components/fragments/training/Punch.vue") },
    // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue") }
];

const routes = [
    ...authRoutes,
    ...publicRoutes,
    ...protectedRoutes
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});


// Навигационный гвард
router.beforeEach((to, from, next) => {

    const isAuthenticated =  store.getters["master/isAuthenticated"];

    if (protectedRoutes.some(route => route.name === to.name || route.path === to.path)) {
        if (!isAuthenticated) {
            console.log('Redirecting to Invite page');
            next({ name: 'Invite' });
        } else if (to.name === 'Home') {
            next({ name: 'Profile' });
        } else {
            next();
        }
    } else {
        next();
    }
});


export default router;
