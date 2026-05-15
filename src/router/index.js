import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";


export const authRoutes = [
    // Sub-epic 1b C2: /auth/login + /auth/signup migrated to AuthLayoutView shell.
    // Route names preserved verbatim ('Login', 'Signup') — router.beforeEach guard
    // line ~250 uses next({name: 'Login'}) for unauth redirect.
    {
        path: '/auth',
        component: () => import('@/views/AuthLayoutView.vue'),
        children: [
            // Эпик 9 auth-redesign: /auth/login + /auth/signup share single
            // AuthSelectorView (provider-selector with state machine: provider/more/email).
            // Route names 'Login' and 'Signup' preserved — router.beforeEach line ~296
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
            // Bare /auth → redirect to /auth/login
            {path: '', redirect: '/auth/login'},
        ],
    },
    // Sub-epic 1b:
    //   C5: /auth/reset route DELETED (decision #4 — backend /user/reset returns 501).
    //   C6: /auth/telegram route DELETED (decision #2 — Telegram-as-auth excised).
    // Adaptive UI isTelegram flag (App.vue + ProfileButtons.vue) preserved per
    // decision #2 — flag setter re-wired to App.vue init-time TG webview detection.
];

const publicRoutes = [
    {
        path: '/',
        name: 'Home',
        component: () => import("/src/views/MarketingView.vue"),
        beforeEnter: (to, from, next) => {
            // Authed users skip marketing site — go straight to /play hub.
            // Anonymous users see MarketingView (Sub-epic 8b — replaces 1a LandingView).
            const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
            if (isAuthenticated) {
                next('/play');
            } else {
                next();
            }
        },
    },
    {path: '/privacy', name: 'Privacy', component: () => import("/src/views/PrivacyView.vue")},
    {path: '/404', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
    // /rules ported to v2 (RulesView at /play/rules) in Phase 8. Old path
    // preserved as redirect for URL-stability (legal page, public links
    // from landing/socials/email-templates may reference it).
    {path: '/rules', redirect: '/play/rules'},
    {path: '/verify-email', name: 'VerifyEmail', component: () => import("/src/views/VerifyEmailView.vue")},
    // Email Auth Phase 5 — reset-password public route (Vercel auto-deploy
    // on merge). User lands here from email link с ?token=... query param.
    {path: '/reset-password', name: 'ResetPassword', component: () => import("/src/views/ResetPasswordView.vue")},
    {
        // Sub-epic 1b C9: function-form redirect preserves localStorage side-effect
        // (referral code capture) without requiring a component (RainView deleted).
        // Phase 0 §"Bonus findings #2" recommended pattern. Vue Router 4 native.
        path: '/r/:username',
        name: 'Referral',
        redirect: to => {
            localStorage.setItem('hexlash_referral_code', to.params.username);
            return '/auth/signup';
        },
    },
];

const protectedRoutes = [
    {path: '/help', redirect: '/play/help'},
    {path: '/arena', redirect: '/arena/club'},
    {path: '/arena/fight', name: 'ArenaFight', component: () => import("/src/views/PreparationView.vue")},
    {path: '/arena/club', name: 'ArenaFightClub', component: () => import("/src/views/FightClubView.vue")},
    {path: '/create-fighter', redirect: '/play/create'},
    {path: '/fighter/:key', redirect: to => `/play/fd/${to.params.key}`},
    {path: '/arena/club/create', redirect: '/create-fighter'},
    {path: '/arena/club/:agentId', redirect: to => `/fighter/${to.params.agentId}`},

    {
        path: '/user/:userLogin',
        redirect: to => ({ name: 'V2UserProfile', params: { userLogin: to.params.userLogin } }),
    },
    {path: '/profile', redirect: '/play/profile'},
    {path: '/profile/balance', redirect: '/play/profile'},
    {path: '/profile/wallet', redirect: '/play/wallet'},
    {path: '/profile/account', redirect: '/play/account'},
    {path: '/profile/skins', redirect: '/play/profile'},

    {
        path: '/clan/:id',
        redirect: to => ({ name: 'V2GuestClan', params: { id: to.params.id } }),
    },
    {path: '/club/:id', redirect: to => '/clan/' + to.params.id},
    {path: '/fight-club', redirect: '/arena/club'},
    {path: '/club/agent/create', redirect: '/create-fighter'},
    {path: '/club/agent/:agentId', redirect: to => `/fighter/${to.params.agentId}`},

    {path: '/ratings/:type', redirect: to => '/play/ratings'},
    {path: '/ratings', redirect: '/play/ratings'},

    {path: '/training', redirect: '/play/training'},
    {path: '/fight', redirect: '/play/fight'},
    {path: '/friends', redirect: '/play/profile'},
    {path: '/matchmaking', redirect: '/play/matchmaking'},
    {path: '/spectate/:odId', redirect: to => `/play/spectate/${to.params.odId}`},

];

// v2 PvP routes protected by name marker (Sub-epic 4a P1 fix per Phase 0 Q12).
// v2Routes defined separately below — these names mark them as auth-protected
// without duplicating route registration. Carry-over #10 (systematic v2 cutover
// auth audit, Sub-epic 8 territory) may migrate this to meta.requiresAuth pattern.
const v2ProtectedNames = ['V2Fight', 'V2Matchmaking', 'V2Spectate'];

// v2 Migration — feature flag через URL-префикс. Sub-epic 8a renamed URL prefix
// /v2 → /play (user-facing). Internal architecture identifiers (v2Routes name,
// V2Root/V2Pit/etc. route names, .app-v2 CSS namespace, src/views-v2/ directory,
// AppV2.vue file) PRESERVED — decoupled from URL per Phase 0 §4.2 + §5.3 locks.
// Backward compat: /v2 + /v2/:pathMatch(.*)* cascade-redirect to /play/*.
// Источник правды: docs/visual-migration/HANDOFF_VISUAL_MIGRATION.md
const v2Routes = [
    {
        path: '/play',
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
                // Phase 8 implementation — /rules ported to v2.
                // Public (NOT in v2ProtectedNames) — legal content stays auth-free.
                path: 'rules',
                name: 'V2Rules',
                component: () => import('@/views-v2/RulesView.vue'),
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

// Sub-epic 8a — backward compat cascade redirect for legacy /v2/* URLs.
// User bookmarks, shared friend-Watch links, Telegram-share URLs preserved.
// Order: must come AFTER v2Routes (so /play/* takes precedence) but BEFORE
// the global 404 catch-all (so /v2/* still matches before falling through).
// Vue Router 4 (.*)* matcher returns pathMatch as string OR array — handle both.
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

// Helper: load saved fight from localStorage (no store dependency)
function getSavedFightPhase() {
    try {
        const s = localStorage.getItem('hexlash_current_fight');
        return s ? JSON.parse(s).fightPhase : null;
    } catch(e) { return null; }
}

// Навигационный гвард
router.beforeEach(async (to, from, next) => {
    const isAuthenticated = store.getters["master/getLoginState"]?.isAuthenticated || false;
    const isProtectedRoute =
        protectedRoutes.some(route => route.name === to.name || route.path === to.path) ||
        v2ProtectedNames.includes(to.name);

    // Проверяем, если маршрут не является авторизационным и защищённым
    if (isProtectedRoute) {
        if (!isAuthenticated) {
            // Sub-epic 1a: Home (/) moved to publicRoutes — exemption wrapper
            // (`if (to.name !== 'Home')`) removed as unreachable. Toast now
            // unconditional within the unauth-protected-route branch.
            const customMessage = InfoMessageModel.withTimeout("Access denied. You need to log in first", 2000);
            store.commit('master/setInfoMessage', customMessage);

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
