import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";


export const authRoutes = [
    {
        path: '/auth',
        component: () => import('@/views/AuthLayoutView.vue'),
        children: [
            // Route names 'Login' and 'Signup' preserved — beforeEach guard
            // uses next({name: 'Login'}) for unauth redirect.
            {
                path: 'login',
                name: 'Login',
                component: () => import('@/views/auth/AuthSelectorView.vue'),
            },
            {
                path: 'signup',
                name: 'Signup',
                component: () => import('@/views/auth/AuthSelectorView.vue'),
            },
            {path: '', redirect: '/auth/login'},
        ],
    },
];

const publicRoutes = [
    {
        path: '/',
        name: 'Home',
        component: () => import("/src/views/MarketingView.vue"),
        beforeEnter: (to, from, next) => {
            // Authed users skip the marketing site — go straight to /play.
            // Anonymous users see MarketingView. An explicit in-app navigation
            // FROM a /play screen (the ‹ Home button) is a deliberate
            // "leave the game" intent — let it through.
            const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
            const leavingPlay = from.path.startsWith('/play');
            if (isAuthenticated && !leavingPlay) {
                next('/play');
            } else {
                next();
            }
        },
    },
    {path: '/privacy', name: 'Privacy', component: () => import("/src/views/PrivacyView.vue")},
    {path: '/404', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
    {path: '/verify-email', name: 'VerifyEmail', component: () => import("/src/views/VerifyEmailView.vue")},
    // Email Auth Phase 5 — reset-password public route. User lands here from
    // email link с ?token=... query param.
    {path: '/reset-password', name: 'ResetPassword', component: () => import("/src/views/ResetPasswordView.vue")},
    {
        // function-form redirect preserves localStorage side-effect
        // (referral code capture) without requiring a component.
        path: '/r/:username',
        name: 'Referral',
        redirect: to => {
            localStorage.setItem('hexlash_referral_code', to.params.username);
            return '/auth/signup';
        },
    },
];

// Legacy account-route redirects → /play sub-routes. Kept for URL stability
// (old bookmarks / shared links). Game-route redirects removed with the game.
const protectedRoutes = [
    {path: '/profile', redirect: '/play/profile'},
    {path: '/profile/account', redirect: '/play/account'},
    {path: '/profile/wallet', redirect: '/play/wallet'},
];

// /play sub-routes that require auth (account/profile). The bare /play stub is
// public so the "Play as Guest" button can reach it.
const v2ProtectedNames = ['V2Profile', 'V2Account', 'V2Wallet'];

// Game screens removed in the game-cleanup reset. /play now hosts a stub hub
// plus the kept account/wallet surfaces and an empty profile stub. The .app-v2
// CSS namespace, V2* route names and src/views-v2/ directory are preserved.
const v2Routes = [
    {
        path: '/play',
        name: 'V2Root',
        component: () => import('@/AppV2.vue'),
        children: [
            {
                path: '',
                name: 'V2Pit',
                component: () => import('@/views-v2/PlayStubView.vue'),
            },
            {
                path: 'profile',
                name: 'V2Profile',
                component: () => import('@/views-v2/ProfileStubView.vue'),
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

// Backward compat cascade redirect for legacy /v2/* URLs → /play/*.
const legacyV2Redirects = [
    {path: '/v2', redirect: '/play'},
    {
        path: '/v2/:pathMatch(.*)*',
        redirect: to => {
            const tail = Array.isArray(to.params.pathMatch)
                ? to.params.pathMatch.join('/')
                : (to.params.pathMatch || '');
            return tail ? `/play/${tail}` : '/play';
        },
    },
];

const routes = [
    ...authRoutes,
    ...publicRoutes,
    ...protectedRoutes,
    ...v2Routes,
    ...legacyV2Redirects,
    {path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
    const isProtectedRoute =
        protectedRoutes.some(route => route.name === to.name || route.path === to.path) ||
        v2ProtectedNames.includes(to.name);

    if (isProtectedRoute && !isAuthenticated) {
        const customMessage = InfoMessageModel.withTimeout("Access denied. You need to log in first", 2000);
        store.commit('master/setInfoMessage', customMessage);
        next({name: 'Login'});
    } else {
        next();
    }
});


export default router;
