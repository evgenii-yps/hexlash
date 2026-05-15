// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Hexlash Legacy Cleanup wrap-up smoke.
 *
 * Read-only against Vercel preview / prod. ZERO form submissions, ZERO writes
 * to backend. See README.md for full coverage scope + exclusions.
 *
 * Console signature check — these strings must NOT appear in console.error /
 * unhandled-rejection messages on any anonymous public surface. Their presence
 * implies a retired symbol leaked (legacy-cleanup series regression).
 */
const FORBIDDEN_CONSOLE_SIGNATURES = [
  'PageView',
  'BackButton',
  'background_page',
  'ProfileAccount',
  'ProfileSkins',
  'ProfileInvite',
  'ProfileWallet',
  'DailyTasks',
  'SocialTasks',
  'TaskModal',
  'progression/',           // namespaced action prefix — survivors are dead module
  'sendShare',
  'initGetStarted',
  'clearSavedFight',
  'syncProgression',
  'uploadMasterAvatar',
  'User.language',
  'master.language',
];

// "Card" is too generic to grep blindly (e.g. AgentCard / HexCard are alive).
// "lblChangeLanguage" — retired key from L6.
const FORBIDDEN_NAME_TOKENS = [
  '"Card"',                 // exact Vue warning shape ("<Card>" component refs)
  '<Card>',
  'lblChangeLanguage',
];

/**
 * Per-test console buffer. Filled by page.on('console') + page.on('pageerror').
 * @type {Array<{type: string, text: string}>}
 */
let consoleBuffer = [];

test.beforeEach(async ({ page }) => {
  consoleBuffer = [];
  page.on('console', (msg) => {
    consoleBuffer.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    consoleBuffer.push({ type: 'pageerror', text: err.message });
  });
});

/**
 * Inspect console buffer for forbidden signatures.
 * Returns array of offending entries (empty = clean).
 */
function findForbiddenInConsole() {
  const offenders = [];
  for (const entry of consoleBuffer) {
    if (entry.type !== 'error' && entry.type !== 'pageerror') continue;
    for (const sig of FORBIDDEN_CONSOLE_SIGNATURES) {
      if (entry.text.includes(sig)) {
        offenders.push({ signature: sig, type: entry.type, text: entry.text });
      }
    }
    for (const tok of FORBIDDEN_NAME_TOKENS) {
      if (entry.text.includes(tok)) {
        offenders.push({ signature: tok, type: entry.type, text: entry.text });
      }
    }
  }
  return offenders;
}

/**
 * SPA wait — Vue router resolves + lazy chunk renders.
 * `networkidle` covers backend fetches that block initial paint.
 */
async function waitSpaReady(page) {
  await page.waitForLoadState('networkidle');
  // Extra micro-tick for Vue transition end + composable onMounted.
  await page.waitForTimeout(500);
}

// ─────────────────────────────────────────────────────────────────────────────
// A. Public anonymous surfaces
// ─────────────────────────────────────────────────────────────────────────────

test('A1 — Marketing landing renders + hero + CTA', async ({ page }) => {
  await page.goto('/');
  await waitSpaReady(page);

  // Hero copy from MarketingView §Hero (8b/8c port).
  const heroVisible = await page.locator('.marketing-hero, .marketing__hero').count();
  expect(heroVisible, 'hero section absent').toBeGreaterThan(0);

  // Play CTA — accept either anchor (/auth/*) or button (@click → router.push).
  // MarketingView 8b ships a <button class="marketing-hero__cta"> with click handler.
  const ctaCount = await page.locator(
    'a[href*="/auth/signup"], a[href*="/auth/login"], button.marketing-hero__cta, .marketing__cta'
  ).count();
  expect(ctaCount, 'play CTA absent from landing').toBeGreaterThan(0);

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A2 — /play/rules renders RulesView + inline back button', async ({ page }) => {
  await page.goto('/play/rules');
  await waitSpaReady(page);

  // RulesView (Phase 8 Path A v2 port). Use a tolerant locator —
  // exact class may evolve, but heading semantics + back-link must exist.
  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  expect(bodyText, 'rules content absent').toContain('rules');

  // Inline back button — RulesView ships its own (not the deleted global BackButton.vue).
  const backCount = await page.locator('a:has-text("back"), button:has-text("back"), [class*="back"]').count();
  expect(backCount, 'no back affordance on /play/rules').toBeGreaterThan(0);

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A3 — /rules redirects to /play/rules + same content', async ({ page }) => {
  await page.goto('/rules');
  await waitSpaReady(page);

  expect(page.url(), 'redirect target mismatch').toContain('/play/rules');

  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  expect(bodyText).toContain('rules');

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A4 — /play/help renders + cross-link to /play/rules (not /rules)', async ({ page }) => {
  await page.goto('/play/help');
  await waitSpaReady(page);

  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  expect(bodyText.length, 'help page empty').toBeGreaterThan(50);

  // Phase 8 cross-link refresh: help should reference /play/rules, not legacy /rules.
  // Look at all anchors — if any "rules" link exists, it must point to /play/rules.
  const rulesLinks = await page.locator('a[href*="rules"]').all();
  for (const link of rulesLinks) {
    const href = await link.getAttribute('href');
    if (href && href.includes('rules')) {
      expect(href, `legacy /rules link found on /play/help: ${href}`).toContain('/play/rules');
    }
  }

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A5 — /auth/signup form loads (no submit)', async ({ page }) => {
  await page.goto('/auth/signup');
  await waitSpaReady(page);

  // AuthSelectorView (Эпик 9) — provider-selector with state machine.
  // Form may be behind a provider chip (email path). Tolerant check: page
  // is rendered with at least one interactive element + on the right URL.
  expect(page.url(), 'navigation did not land on /auth/signup').toContain('/auth/signup');

  const interactiveCount = await page.locator('button, input, a').count();
  expect(interactiveCount, 'signup view has no interactive elements').toBeGreaterThan(2);

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A6 — /auth/login form loads (no submit)', async ({ page }) => {
  await page.goto('/auth/login');
  await waitSpaReady(page);

  expect(page.url(), 'navigation did not land on /auth/login').toContain('/auth/login');

  const interactiveCount = await page.locator('button, input, a').count();
  expect(interactiveCount, 'login view has no interactive elements').toBeGreaterThan(2);

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

test('A7 — /privacy renders', async ({ page }) => {
  await page.goto('/privacy');
  await waitSpaReady(page);

  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  expect(bodyText.length, 'privacy page empty').toBeGreaterThan(50);

  expect(findForbiddenInConsole(), 'forbidden console signatures').toEqual([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// B. Cross-surface console aggregate (catch leaked retired symbols)
// ─────────────────────────────────────────────────────────────────────────────

test('B1 — anonymous browse sweep — zero forbidden console signatures', async ({ page }) => {
  // Re-walk every anonymous surface in sequence inside one buffer.
  // This catches symbols that only emit on cross-page Vuex hydration.
  consoleBuffer = [];
  const surfaces = ['/', '/play/rules', '/rules', '/play/help', '/auth/login', '/auth/signup', '/privacy'];
  for (const url of surfaces) {
    await page.goto(url);
    await waitSpaReady(page);
  }
  const offenders = findForbiddenInConsole();
  if (offenders.length > 0) {
    console.error('Forbidden console offenders:', JSON.stringify(offenders, null, 2));
  }
  expect(offenders, 'forbidden console signatures across anonymous browse').toEqual([]);
});
