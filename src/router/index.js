import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import RainView from "@/views/RainView.vue";
import TrainingView from "@/views/TrainingView.vue";
import ProfileView from "@/views/ProfileView.vue";

const authRoutes = [
    {path: '/auth/login', name: 'Login', component: () => import("/src/views/RainView.vue")},
    {path: '/auth/invite', name: 'Invite', component: () => import("/src/views/RainView.vue")},
    {path: '/auth/reset', name: 'Reset', component: () => import("/src/views/RainView.vue")}
];

const publicRoutes = [
    {path: '/privacy', name: 'Privacy', component: () => import("/src/views/PageView.vue")},
    {path: '/rules', name: 'Rules', component: () => import("/src/views/PageView.vue")},
    {path: '/help', name: 'Help', component: () => import("/src/views/PageView.vue")},
    {path: '/404', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
];

const protectedRoutes = [
    {path: '/', name: 'Home', component: RainView },
    {path: '/arena', name: 'Arena', component: () => import("/src/views/ArenaView.vue")},

    {path: '/user/:userLogin', name: 'UserProfile', component: ProfileView},
    {path: '/profile', name: 'Profile', component: ProfileView},
    {path: '/profile/balance', name: 'Balance', component: ProfileView},
    {path: '/profile/wallet', name: 'Wallet', component: ProfileView},
    {path: '/profile/account', name: 'Account', component: ProfileView},

    {path: '/club/:id', name: 'Club', component: () => import("/src/views/ClubView.vue")},

    {path: '/ratings/:type', name: 'Ratings', component: () => import("/src/views/RatingsView.vue"), props: true},
    {path: '/ratings', redirect: '/ratings/clubs'},

    {path: '/training', name: 'Training', component: TrainingView},
    {path: '/training/fight', name: 'Training fight', component: () => import("/src/views/FightView.vue")},

    {path: '/fight/:id', name: 'Fight', component: () => import("/src/views/FightView.vue")},


];

const routes = [
    ...authRoutes,
    ...publicRoutes,
    ...protectedRoutes,
    {path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
];

const router = createRouter({
    history: createWebHistory(),
    routes
});


// Навигационный гвард
router.beforeEach(async (to, from, next) => {

    const isAuthenticated = store.getters["master/getAuthState"]?.isAuthenticated;
    const isInitialize = store.getters["master/getMaster"]?.isInitialize;

    if (protectedRoutes.some(route => route.name === to.name || route.path === to.path)) {
        if (!isAuthenticated) {
            console.log('Redirecting to Invite page');
            next({name: 'Invite'});
        }
        else if(!isInitialize && to.name !== 'Home') {
            next({name: 'Home'});
        }
        else{
            next();
        }
    } else {
        next();
    }
});


export default router;
