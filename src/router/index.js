import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";


export const authRoutes = [
    {
        path: '/auth',
        component: () => import('@/views/AuthLayoutView.vue'),
        children: [
            // Route names 'Login' and 'Signup' preserved.
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

// /play is now a single bare dark screen — the game is being rebuilt from
// scratch. Profile / account / wallet screens were removed. The .app-v2 CSS
// namespace, V2* route names and src/views-v2/ directory are preserved for the
// rebuild. /play is public (reached after login and via "Play as Guest").
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
    ...v2Routes,
    ...legacyV2Redirects,
    {path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// No protected routes remain after the game-cleanup reset — /play is public.
// (The auth/account engine stays in the backend + Vuex; it just has no
// in-app screen entry point until the rebuild.) No navigation guard needed.


export default router;
