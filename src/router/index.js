import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import RainView from "@/views/RainView.vue";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";

const routeHistory = [];


export const authRoutes = [
    {path: '/auth/login', name: 'Login', component: RainView},
    {path: '/auth/signup', name: 'Signup', component: RainView},
    {path: '/auth/reset', name: 'Reset', component: RainView},
    {path: '/auth/telegram', name: 'TelegramLogin', component: RainView}
];

const publicRoutes = [
    {path: '/privacy', name: 'Privacy', component: () => import("/src/views/PrivacyView.vue")},
    {path: '/404', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
    {path: '/rules', name: 'Rules', component: () => import("/src/views/PageView.vue")},
    {path: '/verify-email', name: 'VerifyEmail', component: () => import("/src/views/VerifyEmailView.vue")},
    {
        path: '/r/:username',
        name: 'Referral',
        beforeEnter: (to, from, next) => {
            localStorage.setItem('hexlash_referral_code', to.params.username);
            next('/auth/signup');
        },
        component: RainView,
    },
];

const protectedRoutes = [
    {path: '/', name: 'Home', component: RainView},
    {path: '/help', name: 'Help', component: () => import("/src/views/PageView.vue")},
    {path: '/arena', name: 'ArenaHub', component: () => import("/src/views/ArenaHubView.vue")},
    {path: '/arena/fight', name: 'ArenaFight', component: () => import("/src/views/PreparationView.vue")},
    {path: '/arena/club', name: 'ArenaClub', component: () => import("/src/views/FightClubView.vue")},
    {path: '/arena/club/create', name: 'CreateAgent', component: () => import("/src/views/CreateAgentView.vue")},
    {path: '/arena/club/:agentId', name: 'AgentDetail', component: () => import("/src/views/AgentDetailView.vue")},

    {path: '/user/:userLogin', name: 'UserProfile', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile', name: 'Profile', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/balance', name: 'Balance', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/wallet', name: 'Wallet', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/account', name: 'Account', component: () => import("/src/views/ProfileView.vue")},
    {path: '/profile/skins', name: 'Skins', component: () => import("/src/views/ProfileView.vue")},

    {path: '/clan/:id', name: 'Clan', component: () => import("/src/views/ClanView.vue")},
    {path: '/club/:id', redirect: to => '/clan/' + to.params.id},
    {path: '/fight-club', redirect: '/arena/club'},
    {path: '/club/agent/create', redirect: '/arena/club/create'},
    {path: '/club/agent/:agentId', redirect: to => `/arena/club/${to.params.agentId}`},

    {path: '/ratings/:type', name: 'Ratings', component: () => import("/src/views/RatingsView.vue"), props: true},
    {path: '/ratings', redirect: '/ratings/myclan'},

    {path: '/training', name: 'Training', component: () => import("/src/views/TrainingView.vue")},
    {path: '/training/moves', name: 'MoveTree', component: () => import("/src/views/MoveTreeView.vue")},
    {path: '/training/deck', name: 'DeckBuilder', component: () => import("/src/views/DeckBuilderView.vue")},
    {path: '/fight', name: 'Fight', component: () => import("/src/views/CardFightView.vue")},
    {path: '/friends', name: 'Friends', component: () => import("/src/views/FriendsView.vue")},
    {path: '/matchmaking', name: 'Matchmaking', component: () => import("/src/views/MatchmakingView.vue")},
    {path: '/spectate/:odId', name: 'Spectate', component: () => import("/src/views/SpectateView.vue")},

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
        return 'Home';
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

// Helper: load saved fight from localStorage (no store dependency)
function getSavedFightPhase() {
    try {
        const s = localStorage.getItem('hexlash_current_fight');
        return s ? JSON.parse(s).fightPhase : null;
    } catch(e) { return null; }
}

// Навигационный гвард
router.beforeEach(async (to, from, next) => {
    routeHistory.push(from);

    // Ограничиваем историю, например, до последних 10 маршрутов
    if (routeHistory.length > 10) {
        routeHistory.shift();
    }

    const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
    const isProtectedRoute = protectedRoutes.some(route => route.name === to.name || route.path === to.path);

    // Проверяем, если маршрут не является авторизационным и защищённым
    if (isProtectedRoute) {
        if (!isAuthenticated) {

            if (to.name !== 'Home') {
                const customMessage = InfoMessageModel.withTimeout("Access denied. You need to log in first", 2000);
                store.commit('master/setInfoMessage', customMessage);
            }

            next({name: 'Login'});
        } else {
            // If navigating to arena/fight but a fight is already in progress, redirect to fight
            if (to.path === '/arena/fight' || to.path === '/arena') {
                const savedPhase = getSavedFightPhase();
                if (savedPhase === 'fighting' || savedPhase === 'coach' || savedPhase === 'results') {
                    next('/fight');
                    return;
                }
            }

            next();
        }
    } else {
        next();
    }
});


export default router;
