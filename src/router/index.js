import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import {beginFade, beginFightCard, end as endSceneTransition, transitionState} from "@/services/sceneTransition.js";


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

// /play hosts the temporary pre-fight flow (Stage 1 visualization):
//   /play         → core selection  (CoreSelectView)
//   /play/upgrade → upgrade screen   (UpgradeView — temp shell pending the
//                   Claude Design drill-down handoff)
//   /play/arena   → the 3D arena     (ArenaScene via PlayStubView)
// The player's chosen core glows its colour on the arena fighter. The .app-v2
// CSS namespace and src/views-v2/ directory are preserved from the rebuild.
// /play is public (reached after login and via "Play as Guest").
//
// requireCore guards the upgrade + arena steps: without a pick (e.g. a hard
// refresh — pre-fight state is in-memory only) bounce back to selection.
const requireCore = (to, from, next) => {
    if (store.state.prefight?.selectedCoreId) next();
    else next({ name: 'PrefightSelect' });
};

const v2Routes = [
    {
        path: '/play',
        name: 'V2Root',
        component: () => import('@/AppV2.vue'),
        children: [
            {
                path: '',
                name: 'PrefightSelect',
                component: () => import('@/views-v2/CoreSelectView.vue'),
            },
            {
                // Player home ("дом игрока"): calm 3D stage (arena slab + idle
                // fighter, no rift/opponent/HUD) under a 2D nav layer. Public like
                // the rest of /play. This is the post-login / post-registration
                // landing (master/login + master/register push here directly; the
                // '/' authed-redirect guard is left untouched for direct visits).
                path: 'home',
                name: 'V2Home',
                // meta.scene3d lets the bootstrap (src/main.js) hold the page-load
                // splash until HomeScene emits its first-frame signal, and lets the
                // SPA transition cover (beforeEach below) lift on real readiness.
                meta: { scene3d: true },
                component: () => import('@/views-v2/HomeView.vue'),
            },
            {
                // Mode Select — the PVE / PVP fork. FIGHT on the home opens this;
                // PVE → /play/pve (stub), PVP → /play (core select). A normal
                // pre-fight screen (no meta.arena, no requireCore — it's the place
                // a core-less player chooses, so it must be reachable without one).
                path: 'mode',
                name: 'V2ModeSelect',
                component: () => import('@/views-v2/ModeSelectView.vue'),
            },
            {
                // Ground Select — the ARENA / SPACE fork. The Mode Select PVP door
                // opens this; ARENA → /play (core select), SPACE is locked (SOON,
                // no-op). A normal 2D pre-fight screen (no meta.scene3d / meta.arena
                // — no 3D scene, so it stays off the sceneTransition layer; no
                // requireCore — ARENA is the way TO core select, must be reachable
                // without a core).
                path: 'ground',
                name: 'V2GroundSelect',
                component: () => import('@/views-v2/GroundSelectView.vue'),
            },
            {
                // Space — a standalone 3D preview scene (SpaceScene): a big hex field,
                // a roster wandering it, one glowing leader. Reached from the Ground
                // Select SPACE door. Visual only (no combat/match). A heavy 3D route →
                // meta.scene3d so the load layer covers it; no requireCore (preview).
                path: 'space',
                name: 'V2Space',
                meta: { scene3d: true },
                component: () => import('@/views-v2/SpaceView.vue'),
            },
            {
                // PVE space — a standalone 3D scene (PveScene): the club roster walks
                // the plate, the trainer-legend floats above. Visual only. A normal
                // pre-fight screen (no meta.arena, no requireCore).
                path: 'pve',
                name: 'V2Pve',
                // meta.scene3d — see /play/home note.
                meta: { scene3d: true },
                component: () => import('@/views-v2/PveView.vue'),
            },
            {
                // Back-compat: old /play/training links → /play/pve.
                path: 'training',
                redirect: { name: 'V2Pve' },
            },
            {
                path: 'upgrade',
                name: 'PrefightUpgrade',
                beforeEnter: requireCore,
                component: () => import('@/views-v2/UpgradeView.vue'),
            },
            {
                path: 'arena',
                name: 'V2Arena',
                // meta.arena lets the bootstrap (src/main.js) hold the pre-load
                // splash until the WebGL arena emits its first-frame signal,
                // instead of hiding on first DOM paint like non-arena routes.
                meta: { arena: true },
                beforeEnter: requireCore,
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

// Dev-only routes — reachable by direct URL, NOT linked from any in-app menu.
// /dev/lab is the fighter "лаборатория": one fighter on a podium, orbit camera,
// every movement / technique played through the SAME body driver used in the
// arena/fight (buildFighter.update) with playback transport (once/loop/pause/
// slow/frame-step). Public, no new auth (Этап 1).
const devRoutes = [
    {path: '/dev/lab', name: 'DevFighterLab', component: () => import('@/views/DevFighterLabView.vue')},
];

const routes = [
    ...authRoutes,
    ...publicRoutes,
    ...v2Routes,
    ...legacyV2Redirects,
    ...devRoutes,
    {path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import("/src/views/NotFoundView.vue")},
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// No protected routes remain after the game-cleanup reset — /play is public.
// (The auth/account engine stays in the backend + Vuex; it just has no
// in-app screen entry point until the rebuild.) No navigation guard needed.

// SPA scene-transition cover. Only on IN-APP navigation (window.__hexBootstrapped
// is set by src/main.js once the page-load splash has finished) — the very first
// navigation is covered by the page-load splash instead, so we skip it here.
//   → arena  : full "Fight Card", lifts on the arena's first frame
//   → home/pve: light fade, lifts on that scene's first frame
//   → a 2D route while a cover is up (e.g. requireCore bouncing an arena entry
//     back to core-select): drop the cover so it never hangs.
router.beforeEach((to, from, next) => {
    if (window.__hexBootstrapped) {
        if (to.meta?.arena) {
            beginFightCard();
        } else if (to.meta?.scene3d) {
            beginFade(
                to.name === 'V2Pve' ? 'hexlash:pve-ready'
                : to.name === 'V2Space' ? 'hexlash:space-ready'
                : 'hexlash:home-ready',
            );
        } else if (transitionState.mode !== 'none') {
            endSceneTransition();
        }
    }
    next();
});


export default router;
