import {createRouter, createWebHistory} from "vue-router";
import store from "@/core/state/store.js";
import {cancelLoading, curtainUp, dropCurtain, loadingState, openLoading} from "@/services/sceneLoading.js";


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
//   /play       → выбор состава (SquadSelectView) → сразу на арену
//   /play/gate  → ворота арены — пространство за дверью ARENA (ArenaGateScene)
//   /play/arena → the 3D arena    (ArenaScene via PlayStubView)
// There is no upgrade STEP any more: upgrading moved into the FORGE hall
// (/play/pve), where each fighter has their own tree, so the pre-fight screen
// that edited one shared tree was retired (25.08.2026) and its old address
// redirects there. The player's chosen core still glows its colour on the arena
// fighter. The .app-v2 CSS namespace and src/views-v2/ directory are preserved
// from the rebuild. /play is public (reached after login and via "Play as Guest").
//
// requireSquad guards the arena: без набранного состава (например, обновление
// страницы прямо на /play/arena) возвращаем на экран выбора состава.
//
// Раньше сторож спрашивал «выбрано ли ядро». Ядро больше не выбирают — выбирают
// бойцов, — поэтому спрашивает он теперь «есть ли в составе хоть кто-то».
const requireSquad = (to, from, next) => {
    // Режим показа (?showcase=1) — вход на арену со страницы-деки. Состава там
    // нет и быть не может: инвестор открывает окно, а не проходит поток. Оба
    // бойца в этом режиме назначены жёстко внутри самой сцены.
    //
    // Сам признак ставится и СНИМАЕТСЯ выше, в общей проверке на каждый переход
    // (см. beforeEach) — здесь он только читается.
    if (store.state.prefight?.showcase) return next();

    // ⚠️ Спрашиваем СЛОЙ СОХРАНЕНИЯ, а не живой экран, и не полагаемся на то,
    // что модуль состояния успел подняться раньше. Этот сторож — единственное
    // место, решающее, останется ли игрок на месте после обновления страницы,
    // поэтому он не должен зависеть от порядка загрузки экранов и кусков кода.
    // Снимок уже в памяти, стоит он ноль. Возвращает только тогда, когда во
    // вкладке действительно ничего не сохранено.
    store.commit('prefight/RESTORE_IF_EMPTY');
    if (store.state.prefight?.squad?.length) next();
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
                // Выбор СОСТАВА — кого игрок ведёт в бой. До 15.09.2026 здесь
                // стоял выбор ядра; он ушёл из потока целиком (см. заголовок
                // SquadSelectView). Адрес и имя маршрута оставлены прежними
                // нарочно: по этому имени сюда возвращает сторож арены, и по
                // этому адресу сюда приходят старые ссылки и закладки — обе
                // дороги ведут на новый экран сами, без отдельного перенаправления.
                path: '',
                name: 'PrefightSelect',
                component: () => import('@/views-v2/SquadSelectView.vue'),
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
                // meta.scene3d so the load layer covers it; no requireSquad (preview).
                path: 'space',
                name: 'V2Space',
                meta: { scene3d: true },
                component: () => import('@/views-v2/SpaceView.vue'),
            },
            {
                // PVE space — a standalone 3D scene (PveScene): the club roster walks
                // the plate, the trainer-legend floats above. Visual only. A normal
                // pre-fight screen (no meta.arena, no requireSquad).
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
                // ВОРОТА АРЕНЫ — пространство за дверью ARENA (ArenaGateScene).
                // Не «ещё один экран подготовки», а другое МЕСТО: дом и острова
                // режимов при входе сюда выгружаются, пространство собирается с
                // нуля под экраном загрузки, и растемнение идёт вместе с подлётом
                // камеры. Здесь встанут острова выбора режима, потом острова
                // выбора бойцов, потом объёмная кнопка старта.
                //
                // Стража нет намеренно: состав здесь ещё не набран — его и
                // набирают дальше по дороге. Сторож стоит там, где он нужен, —
                // на самой арене (requireSquad).
                path: 'gate',
                name: 'V2ArenaGate',
                // meta.scene3d — тяжёлый вход, экран загрузки держится до готовности
                meta: { scene3d: true },
                component: () => import('@/views-v2/ArenaGateView.vue'),
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
                beforeEnter: requireSquad,
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
    // /dev/core — превью НОВОЙ формы ядра (ТЗ 21.09.2026). Ничего не встраивает:
    // лист состояний, песочница и прототип фона живут только здесь, до выбора
    // владельца. Страница закрывает себя от поисковиков тегом robots (не через
    // robots.txt — строка запрета там публична и работает как указатель).
    {path: '/dev/core', name: 'DevCorePreview', component: () => import('@/views/DevCorePreviewView.vue')},
    // /dev/buffs — превью баффов (ТЗ 22.09.2026, «Баффы и LASH»): 3D-предметы,
    // плоские иконки, панель боя и слоты выбора — до того, как баффы попадут в
    // бой. Ничего не встраивает, тот же принцип, что и у /dev/core.
    {path: '/dev/buffs', name: 'DevBuffsPreview', component: () => import('@/views/DevBuffsPreviewView.vue')},
    // /dev/forge — макет зала FORGE в новом виде (ТЗ 23.09.2026): интерфейс зала
    // предметами внутри сцены вместо плоских панелей. Ничего не встраивает —
    // настоящий зал живёт по адресу /play/pve и этой страницей не задет. Тот же
    // принцип скрытия, что у /dev/core и /dev/buffs.
    {path: '/dev/forge', name: 'DevForgeMockup', component: () => import('@/views/DevForgeMockupView.vue')},
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
    // ── Признак показа для деки ──
    // Ставится и СНИМАЕТСЯ на каждом переходе, по адресу того экрана, куда идём.
    // Раньше он ставился только в стороже арены, то есть при ВХОДЕ на арену. Для
    // всех сегодняшних путей это одно и то же, но переход арена→арена со сменой
    // одного адреса сторож не перезапускает — и признак пережил бы такой переход.
    // Здесь же проверка общая: она срабатывает на любом переходе, включая смену
    // адреса без пересборки экрана. Обновление страницы снимает признак само —
    // состояние живёт в памяти вкладки и рождается заново.
    //
    // ⚠️ Признак управляет ТОЛЬКО подачей. Он НИКОГДА не включает думающий мозг
    // модели и ничего платного — его подставит кто угодно из адресной строки.
    // Полное правило — рядом с самим признаком в src/scene/ArenaScene.vue.
    store.commit('prefight/SET_SHOWCASE', to.name === 'V2Arena' && to.query.showcase === '1');

    if (window.__hexBootstrapped && !isHomeStageHop(to, from)) {
        if (to.meta?.arena || to.meta?.scene3d) {
            openLoading(to.name);
        } else if (loadingState.active) {
            cancelLoading();
        }
    }
    next();
});

// Занавес — чёрный кадр, под которым уехали с прошлого экрана (пролёт камеры
// внутрь острова, см. islandDive.js). Снимается ЗДЕСЬ, а не тем, кто его поднял:
// поднявший к этому моменту размонтирован вместе со своим экраном.
//
// Два кадра ожидания, а не ноль: afterEach срабатывает, когда адрес уже сменился,
// но следующий вид ещё не нарисован. Снять занавес в этот миг — показать пустоту
// между экранами, то есть ровно то, что он закрывает. Первый кадр отдаёт Vue на
// монтаж, второй — браузеру на отрисовку.
//
// Экран загрузки при этом не трогается: на тяжёлых маршрутах он уже стоит ПОВЕРХ
// занавеса (beforeEach выше поднял его), и снятие занавеса под ним невидимо. На
// лёгких маршрутах экрана загрузки нет, и занавес уходит, открывая новый вид.
router.afterEach(() => {
    if (!curtainUp()) return;
    requestAnimationFrame(() => requestAnimationFrame(() => dropCurtain()));
});


export default router;
