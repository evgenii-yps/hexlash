// Сеть рендера. Рендер не должен отправлять НИ ОДНОГО события в аналитику и вообще
// ничего наружу — иначе засоряется статистика настоящих игроков. Режем на уровне
// сети браузера (игру не трогаем) и ведём учёт: что попыталось уйти и что ушло.
//
// Пропускается только: сам dev-сервер (127.0.0.1) и шрифты (их отвечаем локально,
// наружу они не идут).
export function createNetLog() {
  return {
    blocked: [],        // { method, host, path, type } — попытки, которые мы оборвали
    mocked: 0,          // ответы на шрифты, подставленные локально
    sent: [],           // всё, что ВЫШЛО наружу. Должно остаться пустым
    websockets: [],     // попытки открыть WebSocket (обрываются)
  };
}

const LOCAL = /^(127\.0\.0\.1|localhost)$/;
const FONTS = /fonts\.(googleapis|gstatic)\.com/;

export async function blockNetwork(ctx, log) {
  await ctx.route((u) => !LOCAL.test(u.hostname) && !FONTS.test(u.hostname), (r) => {
    const req = r.request(); const u = new URL(req.url());
    log.blocked.push({ method: req.method(), host: u.hostname, path: u.pathname.slice(0, 80), type: req.resourceType() });
    r.abort('blockedbyclient');
  });
  // WebSocket: Playwright не отдаёт такие соединения в обычный route
  // Локальный HMR-сокет dev-сервера не трогаем: обрыв заставил бы страницу перезагрузиться.
  await ctx.routeWebSocket((u) => !LOCAL.test(u.hostname), (ws) => {
    log.websockets.push(ws.url().replace(/\?.*$/, ''));
    ws.close({ code: 1000, reason: 'showcase-blocked' });
  });
  // контроль «ушло»: запрос к внешнему хосту, который НЕ оборван, попадёт сюда
  ctx.on('requestfinished', (req) => {
    const u = new URL(req.url());
    if (!LOCAL.test(u.hostname) && !FONTS.test(u.hostname) && !u.protocol.startsWith('data') && u.protocol !== 'blob:') log.sent.push({ method: req.method(), host: u.hostname, path: u.pathname.slice(0, 80) });
  });
}

/** Сводка для отчёта: по хостам и по типам, плюс явное «ушло: N». */
export function summarizeNet(log) {
  const byHost = {};
  for (const b of log.blocked) byHost[b.host] = (byHost[b.host] || 0) + 1;
  const analytics = log.blocked.filter((b) => /amplitude|analytics|segment|mixpanel|posthog|sentry|hotjar/i.test(b.host));
  return {
    blockedTotal: log.blocked.length,
    blockedByHost: byHost,
    analyticsBlocked: analytics.length,
    analyticsHosts: [...new Set(analytics.map((b) => b.host))],
    websocketsBlocked: log.websockets.length,
    websocketHosts: [...new Set(log.websockets.map((w) => new URL(w).host))],
    fontsMocked: log.mocked,
    sentOutside: log.sent.length,
    sentList: log.sent.slice(0, 20),
  };
}
