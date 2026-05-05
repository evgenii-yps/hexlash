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
    {path: '/help', redirect: '/v2/help'},
    {path: '/arena', redirect: '/arena/club'},
    {path: '/arena/fight', name: 'ArenaFight', component: () => import("/src/views/PreparationView.vue")},
    {path: '/arena/club', name: 'ArenaFightClub', component: () => import("/src/views/FightClubView.vue")},
    {path: '/create-fighter', redirect: '/v2/create'},
    {path: '/fighter/:key', redirect: to => `/v2/fd/${to.params.key}`},
    {path: '/arena/club/create', redirect: '/create-fighter'},
    {path: '/arena/club/:agentId', redirect: to => `/fighter/${to.params.agentId}`},

    {
        path: '/user/:userLogin',
        redirect: to => ({ name: 'V2UserProfile', params: { userLogin: to.params.userLogin } }),
    },
    {path: '/profile', redirect: '/v2/profile'},
    {path: '/profile/balance', redirect: '/v2/profile'},
    {path: '/profile/wallet', redirect: '/v2/wallet'},
    {path: '/profile/account', redirect: '/v2/account'},
    {path: '/profile/skins', name: 'Skins', redirect: '/v2/profile'},

    {
        path: '/clan/:id',
        redirect: to => ({ name: 'V2GuestClan', params: { id: to.params.id } }),
    },
    {path: '/club/:id', redirect: to => '/clan/' + to.params.id},
    {path: '/fight-club', redirect: '/arena/club'},
    {path: '/club/agent/create', redirect: '/create-fighter'},
    {path: '/club/agent/:agentId', redirect: to => `/fighter/${to.params.agentId}`},

    {path: '/ratings/:type', redirect: to => '/v2/ratings'},
    {path: '/ratings', redirect: '/v2/ratings'},

    {path: '/training', redirect: '/v2/training'},
    {path: '/fight', name: 'Fight', component: () => import("/src/views/CardFightView.vue")},
    {path: '/friends', name: 'Friends', component: () => import("/src/views/FriendsView.vue")},
    {path: '/matchmaking', redirect: '/v2/matchmaking'},
    {path: '/spectate/:odId', name: 'Spectate', component: () => import("/src/views/SpectateView.vue")},

];

// v2 PvP routes protected by name marker (Sub-epic 4a P1 fix per Phase 0 Q12).
// v2Routes defined separately below — these names mark them as auth-protected
// without duplicating route registration. Carry-over #10 (systematic v2 cutover
// auth audit, Sub-epic 8 territory) may migrate this to meta.requiresAuth pattern.
const v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate'];

// v2 Migration — feature flag через URL-префикс /v2. Живёт параллельно старому визуалу.
// Источник правды: docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md
const v2Routes = [
    {
        path: '/v2',
        name: 'V2Root',
        component: () => import('@/AppV2.vue'),
        children: [
            {
                path: '',
                name: 'V2Pit',
                component: () => import('@/views-v2/PitViewV2.vue'),
            },
            {
                path: 'fd/:key',
                name: 'V2FighterDetail',
                component: () => import('@/views-v2/FighterDetailView.vue'),
            },
            {
                path: 'fight',
                name: 'V2Fight',
                component: () => import('@/views-v2/FightView.vue'),
            },
            {
                path: 'training',
                name: 'V2Training',
                component: () => import('@/views-v2/TrainingView.vue'),
            },
            {
                path: 'matchmaking',
                name: 'V2Matchmaking',
                component: () => import('@/views-v2/MatchmakingView.vue'),
            },
            {
                path: 'create',
                name: 'V2Create',
                component: () => import('@/views-v2/CreateView.vue'),
            },
            {
                path: 'profile',
                name: 'V2Profile',
                component: () => import('@/views-v2/ProfileView.vue'),
            },
            {
                path: 'ratings',
                name: 'V2Ratings',
                component: () => import('@/views-v2/RatingsView.vue'),
            },
            {
                path: 'clan',
                name: 'V2Clan',
                component: () => import('@/views-v2/ClanView.vue'),
            },
            {
                path: 'clan/:id',
                name: 'V2GuestClan',
                component: () => import('@/views-v2/GuestClanView.vue'),
            },
            {
                path: 'shop',
                name: 'V2Shop',
                component: () => import('@/views-v2/ShopView.vue'),
            },
            {
                path: 'spectate/:fightId',
                name: 'V2Spectate',
                component: () => import('@/views-v2/SpectateView.vue'),
            },
            {
                path: 'help',
                name: 'V2Help',
                component: () => import('@/views-v2/HelpView.vue'),
            },
            {
                path: 'user/:userLogin',
                name: 'V2UserProfile',
                component: () => import('@/views-v2/UserProfileView.vue'),
            },
            {
                path: 'wallet',
                name: 'V2Wallet',
                component: () => import('@/views-v2/WalletView.vue'),
            },
            {
                path: 'account',
                name: 'V2Account',
                component: () => import('@/views-v2/AccountView.vue'),
            },
        ],
    },
];

const routes = [
    ...authRoutes,
    ...publicRoutes,
    ...protectedRoutes,
    ...v2Routes,
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
    const isProtectedRoute =
        protectedRoutes.some(route => route.name === to.name || route.path === to.path) ||
        v2ProtectedNames.includes(to.name);

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
