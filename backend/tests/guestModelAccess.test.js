// guestModelAccess.test.js — гость в бою получает модель: допуск, потолок, лог.
//
// Что заперто:
//   1. гостевой запрос (без входа, с анонимным X-Guest-Id) проходит на ДВА маршрута
//      модели, а мусорный/пустой — нет; вошедший игрок ведёт себя как раньше;
//   2. общий суточный потолок гостевых обращений: сверх него — 503, игроков он
//      не касается; сутки — по UTC;
//   3. каждое обращение пишет одну строку (маршрут, гость/игрок, статус, токены,
//      время) без текста запроса и без идентификаторов; ошибки Anthropic —
//      отдельной понятной строкой.
//
// Anthropic подменён заглушкой: ключа в тестах нет и быть не должно.
process.env.JWT_SECRET = 'test-secret';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.AI_GUEST_DAILY_CAP = '3';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');

// ── Заглушка SDK: считает вызовы, отдаёт usage и годный JSON ───────────────
let sdkMode = 'ok';
let sdkCalls = 0;
class FakeAnthropic {
  constructor() {
    this.messages = {
      create: async (req) => {
        sdkCalls += 1;
        if (sdkMode === 'balance') { const e = new Error('Your credit balance is too low to access the Anthropic API'); e.status = 400; throw e; }
        if (sdkMode === 'auth') { const e = new Error('invalid x-api-key'); e.status = 401; throw e; }
        if (sdkMode === 'rate') { const e = new Error('rate limit'); e.status = 429; throw e; }
        const legend = /retired champion/.test(req.system || '');
        return {
          usage: { input_tokens: 371, output_tokens: 24 },
          content: [{ type: 'text', text: legend ? '{"lever":"hold","target":1,"line":"HOLD THE LINE"}' : '{"intention":"PRESS","read":"closing in"}' }],
        };
      },
    };
  }
}
require.cache[require.resolve('@anthropic-ai/sdk')] = { id: 'x', filename: 'x', loaded: true, exports: FakeAnthropic };

const { authOrGuest } = require('../src/middleware/auth');
const { takeGuestSlot, guestBudgetUsed, resetGuestBudget } = require('../src/services/guestAiBudget');
const { classifyAnthropicError, logModelCall } = require('../src/services/aiLog');
const aiRouter = require('../src/routes/ai');

const GUEST_ID = 'a1b2c3d4-e5f6-4789-8abc-def012345678';
const playerToken = () => jwt.sign({ userId: 'player-1' }, 'test-secret');

function captureLogs() {
  const lines = [];
  const oLog = console.log; const oErr = console.error; const oWarn = console.warn;
  console.log = (...a) => lines.push(a.join(' '));
  console.error = (...a) => lines.push(a.join(' '));
  console.warn = (...a) => lines.push(a.join(' '));
  return { lines, restore() { console.log = oLog; console.error = oErr; console.warn = oWarn; } };
}

describe('authOrGuest', () => {
  const run = (headers) => {
    const req = { headers };
    let status = null; let nexted = false;
    const res = { status(c) { status = c; return this; }, json() { return this; } };
    authOrGuest(req, res, () => { nexted = true; });
    return { req, status, nexted };
  };
  it('пускает гостя с корректным анонимным id', () => {
    const r = run({ 'x-guest-id': GUEST_ID });
    assert.equal(r.nexted, true); assert.equal(r.req.isGuest, true); assert.equal(r.req.userId, undefined);
  });
  it('не пускает без токена и без id', () => assert.equal(run({}).status, 401));
  it('не пускает мусорный id', () => {
    assert.equal(run({ 'x-guest-id': 'short' }).status, 401);
    assert.equal(run({ 'x-guest-id': 'a'.repeat(16) + '<script>' }).status, 401);
  });
  it('игрок с токеном — как прежде, isGuest=false', () => {
    const r = run({ authorization: `Bearer ${playerToken()}` });
    assert.equal(r.nexted, true); assert.equal(r.req.isGuest, false); assert.equal(r.req.userId, 'player-1');
  });
  it('плохой токен — 401, а не «гость» (даже с id)', () => {
    assert.equal(run({ authorization: 'Bearer nope', 'x-guest-id': GUEST_ID }).status, 401);
  });
});

describe('суточный потолок гостей', () => {
  beforeEach(() => resetGuestBudget());
  it('пускает до потолка и режет сверх', () => {
    assert.equal(takeGuestSlot(Date.now(), 3), true);
    assert.equal(takeGuestSlot(Date.now(), 3), true);
    assert.equal(takeGuestSlot(Date.now(), 3), true);
    assert.equal(takeGuestSlot(Date.now(), 3), false);
    assert.equal(guestBudgetUsed(), 3);
  });
  it('новые сутки по UTC обнуляют счёт', () => {
    const d1 = Date.UTC(2026, 9, 2, 23, 59, 0); const d2 = Date.UTC(2026, 9, 3, 0, 0, 1);
    assert.equal(takeGuestSlot(d1, 1), true);
    assert.equal(takeGuestSlot(d1, 1), false);
    assert.equal(takeGuestSlot(d2, 1), true);
  });
});

describe('строка лога', () => {
  it('содержит маршрут, гостя, статус, токены, время — и ничего лишнего', () => {
    const cap = captureLogs();
    logModelCall({ route: 'fighter-intention', caller: 'guest', status: 200, usage: { input_tokens: 371, output_tokens: 24 }, ms: 812.4 });
    cap.restore();
    assert.deepEqual(cap.lines, ['[ai] route=fighter-intention caller=guest status=200 in=371 out=24 ms=812']);
  });
  it('ошибки Anthropic узнаются и объясняются отдельно', () => {
    assert.equal(classifyAnthropicError({ status: 401 }).kind, 'ANTHROPIC_KEY_REJECTED');
    assert.equal(classifyAnthropicError({ status: 429 }).kind, 'ANTHROPIC_RATE_LIMITED');
    assert.equal(classifyAnthropicError({ status: 400, message: 'Your credit balance is too low' }).kind, 'ANTHROPIC_BALANCE_EMPTY');
    assert.equal(classifyAnthropicError({ status: 529 }).kind, 'ANTHROPIC_UNAVAILABLE');
    assert.equal(classifyAnthropicError({ code: 'BAD_OUTPUT' }), null);
  });
});

describe('маршруты модели: гость и игрок', () => {
  let server; let base;
  before(async () => {
    const app = express(); app.set('trust proxy', 1); app.use(express.json()); app.use('/v1/ai', aiRouter);
    server = http.createServer(app);
    await new Promise((r) => server.listen(0, r));
    base = `http://127.0.0.1:${server.address().port}/v1/ai`;
  });
  after(() => server.close());
  beforeEach(() => { resetGuestBudget(); sdkMode = 'ok'; sdkCalls = 0; });

  const post = (route, headers, body = {}) => fetch(`${base}/${route}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
  const legendBody = { portrait: ['ELDER'], units: [{ name: 'A', hp: 'healthy' }], foes: { count: 'one' }, levers: [{ id: 'hold', name: 'Hold' }], phase: 'opening', trigger: 'the bout has begun' };

  it('гость: 200 на обоих маршрутах, в логе строки без идентификаторов', async () => {
    const cap = captureLogs();
    const a = await post('fighter-intention', { 'x-guest-id': GUEST_ID }, { portrait: ['x'], phase: 'opening' });
    const b = await post('legend-command', { 'x-guest-id': GUEST_ID }, legendBody);
    cap.restore();
    assert.equal(a.status, 200); assert.deepEqual(await a.json(), { intention: 'PRESS', read: 'closing in' });
    assert.equal(b.status, 200); assert.equal((await b.json()).lever, 'hold');
    assert.equal(cap.lines.length, 2);
    assert.match(cap.lines[0], /^\[ai\] route=fighter-intention caller=guest status=200 in=371 out=24 ms=\d+$/);
    assert.match(cap.lines[1], /^\[ai\] route=legend-command caller=guest status=200 in=371 out=24 ms=\d+$/);
    for (const l of cap.lines) { assert.ok(!l.includes(GUEST_ID)); assert.ok(!/ELDER|healthy|opening/.test(l)); }
  });

  it('без токена и без гостевого id — 401, как прежде', async () => {
    assert.equal((await post('fighter-intention', {})).status, 401);
    assert.equal((await post('legend-command', {})).status, 401);
    assert.equal(sdkCalls, 0);
  });

  it('игрок: 200, caller=player, суточный потолок гостей его не трогает', async () => {
    for (let i = 0; i < 3; i += 1) assert.equal(takeGuestSlot(), true); // гости исчерпали сутки
    const cap = captureLogs();
    const r = await post('fighter-intention', { authorization: `Bearer ${playerToken()}` }, { portrait: ['x'] });
    cap.restore();
    assert.equal(r.status, 200);
    assert.match(cap.lines[0], /caller=player status=200/);
  });

  it('потолок: 3 гостя проходят, четвёртый — 503, Anthropic не вызван', async () => {
    const codes = [];
    const cap = captureLogs();
    for (let i = 0; i < 4; i += 1) codes.push((await post('fighter-intention', { 'x-guest-id': GUEST_ID }, { portrait: ['x'] })).status);
    cap.restore();
    assert.deepEqual(codes, [200, 200, 200, 503]);
    assert.equal(sdkCalls, 3);
    assert.match(cap.lines[3], /status=503 .*reason=guest_daily_cap/);
  });

  it('ошибка Anthropic: 502 для клиента, отдельная понятная строка в логе', async () => {
    sdkMode = 'balance';
    const cap = captureLogs();
    const r = await post('legend-command', { 'x-guest-id': GUEST_ID }, legendBody);
    cap.restore();
    assert.equal(r.status, 502);
    assert.ok(cap.lines.some((l) => /status=502/.test(l)));
    assert.ok(cap.lines.some((l) => /ANTHROPIC_BALANCE_EMPTY/.test(l)));
  });
});
