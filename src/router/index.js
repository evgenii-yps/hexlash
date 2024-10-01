import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import RainView from "@/views/RainView.vue";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const routeHistory = [];


const authRoutes = [
    {path: '/auth/login', name: 'Login', component: () => import("/src/views/RainView.vue")},
    {path: '/auth/invite', name: 'Invite', component: () => import("/src/views/RainView.vue")},
    {path: '/auth/reset', name: 'Reset', component: () => import("/src/views/RainView.vue")}
];

const publicRoutes = [
    {path: '/privacy', name: 'Privacy', component: () => import("/src/views/PrivacyView.vue")},
    {path: '/404', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
    {path: '/rules', name: 'Rules', component: () => import("/src/views/PageView.vue")},
    {path: '/verify-email', name: 'VerifyEmail', component: () => import("/src/views/VerifyEmailView.vue")},
];

const protectedRoutes = [
    {path: '/', name: 'Home', component: RainView },
    {path: '/help', name: 'Help', component: () => import("/src/views/PageView.vue")},
    {path: '/arena', name: 'Arena', component: () => import("/src/views/ArenaView.vue")},

    {path: '/user/:userLogin', name: 'UserProfile', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile', name: 'Profile',  component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/balance', name: 'Balance', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/wallet', name: 'Wallet', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/account', name: 'Account', component: () => import("/src/views/ProfileView.vue")},

    {path: '/club/:id', name: 'Club', component: () => import("/src/views/ClubView.vue")},

    {path: '/ratings/:type', name: 'Ratings', component: () => import("/src/views/RatingsView.vue"), props: true},
    {path: '/ratings', redirect: '/ratings/clubs'},

    {path: '/training', name: 'Training', component: () => import("/src/views/TrainingView.vue")},
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

export function getPreviousRoute() {
    // Проверяем, есть ли хотя бы два маршрута в истории
    if (routeHistory.length >= 1) {
        return routeHistory[routeHistory.length - 1].name; // Возвращаем предпоследний маршрут
    } else {
        return 'Home'; // Если нет достаточной истории, возвращаем на главную
    }
}

export function backRef(route) {
    const back = route.query.back;

    if (back) {
        // Если параметр 'ref' есть, возвращаем его
        return back.charAt(0).toUpperCase() + back.slice(1);
    } else {
        // Если параметра 'ref' нет, возвращаем предпоследний маршрут
        return getPreviousRoute();
    }
}

// Навигационный гвард
router.beforeEach(async (to, from, next) => {

    routeHistory.push(from);

    // Ограничиваем историю, например, до последних 10 маршрутов
    if (routeHistory.length > 10) {
        routeHistory.shift();
    }

    const isAuthenticated = store.getters["master/getLoginState"].isAuthenticated;
    const initialVerified = store.getters["master/getMaster"]?.initialVerified;

    if (protectedRoutes.some(route => route.name === to.name || route.path === to.path)) {
        if (!isAuthenticated) {

            if (to.name !== 'Home') {
                const customMessage = InfoMessageModel.withTimeout("Access denied. You need to log in first", 2000);
                store.commit('master/setInfoMessage', customMessage);
            }

            console.log('Redirecting to Invite page');
            next({name: 'Invite'});
        }
        else if(!initialVerified && to.name !== 'Home') {
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
