import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import {cancelLoading, loadingState, openLoading} from "@/services/sceneLoading.js";


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
//   /play       → core selection (CoreSelectView) → straight to the arena
//   /play/arena → the 3D arena    (ArenaScene via PlayStubView)
// There is no upgrade STEP any more: upgrading moved into the FORGE hall
// (/play/pve), where each fighter has their own tree, so the pre-fight screen
// that edited one shared tree was retired (25.08.2026) and its old address
// redirects there. The player's chosen core still glows its colour on the arena
// fighter. The .app-v2 CSS namespace and src/views-v2/ directory are preserved
// from the rebuild. /play is public (reached after login and via "Play as Guest").
//
// requireCore guards the arena: without a pick (e.g. a hard refresh straight
// onto /play/arena) bounce back to selection.
const requireCore = (to, from, next) => {
    // Ask the save layer here rather than trusting that the store module was
    // evaluated first. This guard is the ONE place that decides whether a
    // refresh keeps the player where they are, so it must not depend on module
    // /chunk evaluation order — in-memory snapshot, no I/O cost when already
    // restored. Still bounces when the tab genuinely has nothing saved.
    store.commit('prefight/RESTORE_IF_EMPTY');
    if (store.state.prefight?.selectedCoreId) next();
    else next({ name: 'PrefightSelect' });
};

// ONE component behind both home-stage paths (see the /play/mode record below).
// It has to be the same async wrapper OBJECT for Vue to reuse the instance, so it is
// declared once here rather than inlined twice.
const HomeStageView = () => import('@/views-v2/HomeView.vue');

// The two paths that are two framings of ONE live scene. AppV2 keys them together;
// the transition cover skips hops between them (see beforeEach).
export const HOME_STAGE_PATHS = ['/play/home', '/play/mode'];

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
                component: HomeStageView,
            },
            {
                // Mode select — the PVE / PVP fork. NOT a screen any more: it is a
                // place in the SAME 3D world as the home, a long way across the void,
                // and FIGHT flies the camera out to it. So this route renders the very
                // same component as /play/home; AppV2 keys the two paths together so
                // Vue REUSES the instance instead of remounting it, which is what
                // keeps the WebGL scene alive across the hop (a remount would tear it
                // down under the camera). HomeView reads route.path to know which
                // framing it belongs on. The URL is kept so bookmarks, a refresh and
                // the browser's back button all work — a direct load simply lands on
                // the mode framing with no flight.
                path: 'mode',
                name: 'V2ModeSelect',
                meta: { scene3d: true },
                component: HomeStageView,
            },
            {
                // Ground Select — REMOVED 24.08.2026. It sat between the mode stage
                // and core select and asked "ARENA or SPACE", which is the question
                // the door the player had just pressed was already called ARENA to
                // answer. Space is a seasonal event now, not a ground, so the fork
                // had nothing left to fork. The ARENA door goes straight to /play.
                //
                // The path stays as a REDIRECT, not a deletion: someone may have this
                // address open in a tab or saved as a bookmark, and a dead route drops
                // them on the 404 page. Sending them to the mode stage puts them back
                // in the flow one step above where they were.
                path: 'ground',
                redirect: '/play/mode',
            },
            {
                // Space — a standalone 3D preview scene (SpaceScene): a big hex field,
                // a roster wandering it, one glowing leader. Visual only (no combat /
                // match). Since Ground Select went, NOTHING in the app links here: it
                // is reachable by direct URL only, on purpose — the scene is finished
                // work and is kept, the door into it is not. A heavy 3D route →
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
                // The pre-fight upgrade screen was retired (25.08.2026) — upgrading
                // lives in the FORGE hall now, per fighter. Old links land there.
                path: 'upgrade',
                redirect: { name: 'V2Pve' },
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

// The loading screen, on in-app navigation. Only here — the very FIRST navigation
// is covered by the page-load splash instead (window.__hexBootstrapped is set by
// src/main.js once that splash has taken over), so we skip it and the player never
// sees two covers hand off.
//
// ONE screen for every heavy 3D entry — arena, home, mode stage, forge, space.
// There used to be two (a light translucent dim for home/pve, the full card for
// the arena); the dim carried no progress and no explanation, so a slow hop just
// looked like the game had gone dark. It is gone.
//
// Leaving a 3D route for a 2D one while the screen is still up (a guard bouncing
// an arena entry back to core-select) cancels it, so it can never hang.
//
// The home ⇄ mode-select pair is deliberately EXCLUDED: those two paths share one
// route record and one live 3D scene, and the hop between them is a camera flight,
// not a load. Covering it would hide the very thing it exists to show.
const isHomeStageHop = (to, from) => HOME_STAGE_PATHS.includes(to.path) && HOME_STAGE_PATHS.includes(from.path);

router.beforeEach((to, from, next) => {
    if (window.__hexBootstrapped && !isHomeStageHop(to, from)) {
        if (to.meta?.arena || to.meta?.scene3d) {
            openLoading(to.name);
        } else if (loadingState.active) {
            cancelLoading();
        }
    }
    next();
});


export default router;
