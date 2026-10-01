// Виртуальные часы. Ставится в страницу ДО загрузки игры (addInitScript).
//
// Время идёт только когда рендер-обвязка говорит `__vt.step()`: ровно на один кадр
// вперёд и ни мгновением больше. Под этим работают requestAnimationFrame,
// performance.now, Date, таймеры и случайность. Игра про это не знает.
//
// Что НЕ покрывается JS-подменой и покрыто здесь отдельно:
//  • CSS-анимации и переходы идут по часам браузера → каждый кадр прокручиваем
//    через Web Animations API (pause + currentTime = виртуальное время);
//  • события transitionend/animationend браузер шлёт на СВОЁМ кадре отрисовки →
//    после каждого шага ждём два настоящих кадра (`settle`), иначе порядок событий
//    зависел бы от реальной скорости машины.
(() => {
  const DT = 16.6667;          // мс на кадр. ⚠️ НЕ 1000/60: игра пропускает кадр, если
                               // time - lastFrame < 16.6667, и при дробной ошибке дрожит
  const BASE_DATE = 1_700_000_000_000;
  const realRAF = window.requestAnimationFrame.bind(window);
  const realST = window.setTimeout.bind(window);

  let now = 0;                 // виртуальные мс с «старта страницы»
  let frame = 0;
  let rafId = 0, rafQ = [];
  let tid = 1; const timers = new Map();

  window.requestAnimationFrame = (cb) => { rafQ.push([++rafId, cb]); return rafId; };
  window.cancelAnimationFrame = (id) => { rafQ = rafQ.filter((x) => x[0] !== id); };
  window.setTimeout = (fn, ms = 0, ...a) => { const id = tid++; timers.set(id, { at: now + Math.max(0, +ms || 0), fn, a, iv: 0, id }); return id; };
  window.setInterval = (fn, ms = 0, ...a) => { const iv = Math.max(1, +ms || 0); const id = tid++; timers.set(id, { at: now + iv, fn, a, iv, id }); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers.delete(id); };
  window.requestIdleCallback = (cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 10 }), 1);
  window.cancelIdleCallback = (id) => window.clearTimeout(id);
  performance.now = () => now;

  const RealDate = Date;
  class VDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(BASE_DATE + now); else super(...a); }
    static now() { return BASE_DATE + now; }
  }
  window.Date = VDate;

  // ── учёт запросов в полёте ──
  let inflight = 0;
  const XO = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...a) {
    inflight++; let done = false;
    const fin = () => { if (!done) { done = true; inflight--; } };
    this.addEventListener('loadend', fin); this.addEventListener('error', fin); this.addEventListener('abort', fin); this.addEventListener('timeout', fin);
    return XO.apply(this, a);
  };
  const FO = window.fetch.bind(window);
  window.fetch = (...a) => { inflight++; const p = FO(...a); const fin = () => { inflight--; }; p.then(fin, fin); return p; };

  // ── случайность ──
  //
  // Два потока. Игра и сторонние библиотеки (аналитика с повтором запросов «с дрожью»)
  // тянут один и тот же Math.random, и сторонний код дёргает его на кадрах, зависящих
  // от реальной скорости сети, — из-за одного такого вызова весь дальнейший бой сдвигался
  // бы на одно число. Поэтому вызовы из сторонних модулей (файлы зависимостей dev-сервера,
  // кроме общих чанков с three) уходят в ОТДЕЛЬНЫЙ поток и игровой не трогают.
  let rs = 1; let os = 99;
  const gen = (get, set) => () => { let x = (get() + 0x6D2B79F5) | 0; set(x); let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gameRand = gen(() => rs, (v) => { rs = v; });
  const otherRand = gen(() => os, (v) => { os = v; });
  const THIRD = /\.vite\/deps\/(?!chunk-)/;
  // смотрим только два ближайших кадра стека: глубже сидит рантайм Vue, который зовёт и игру
  Math.random = () => (THIRD.test(((new Error().stack || '').split('\n').slice(2, 4)).join('\n')) ? otherRand() : gameRand());

  // Якорь «сцена начала строиться»: первый WebGL-контекст. Всё, что бросается после
  // него, не зависит от того, сколько кадров и асинхронных загрузок было до.
  let anchored = false; let anchorSeed = 1; let anchorFrame = -1;
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (!anchored && /webgl/i.test(type)) { anchored = true; anchorFrame = frame; rs = anchorSeed; }
    return origGetContext.call(this, type, ...rest);
  };

  // ── CSS-анимации по виртуальному времени ──
  const animBase = new WeakMap();
  function syncAnimations() {
    let list; try { list = document.getAnimations(); } catch (_) { return; }
    for (const a of list) {
      let base = animBase.get(a);
      // Новую анимацию начинаем с нуля ОТ СЕЙЧАС. Нельзя сохранять её текущее время:
      // между созданием и нашим шагом она успевает пробежать сколько-то РЕАЛЬНЫХ
      // миллисекунд, и это число (разное от запуска к запуску) попало бы в кадры.
      if (base === undefined) { base = now; animBase.set(a, base); try { a.pause(); a.currentTime = 0; } catch (_) {} }
      try { a.currentTime = now - base; } catch (_) {}
    }
  }

  // Бесконечные CSS-анимации (пульс свечения кнопки FIGHT и т. п.) стартуют на том виртуальном кадре, когда интерфейс успел смонтироваться, а он
  // зависит от скорости загрузки (реальное время): фаза у снимка плыла от запуска к запуску (≤4 уровней вокруг кнопки). Перед первым кадром
  // плана / снимка переводим ВСЕ бесконечные анимации на общую точку отсчёта «сейчас». Конечные не трогаем: их перезапуск показал бы переход заново.
  function rebaseAnimations() {
    let list; try { list = document.getAnimations(); } catch (_) { return 0; }
    let n = 0;
    for (const a of list) {
      let inf = false; try { inf = a.effect && a.effect.getComputedTiming().iterations === Infinity; } catch (_) {}
      if (!inf) continue;
      animBase.set(a, now); try { a.pause(); a.currentTime = 0; } catch (_) {}
      n++;
    }
    return n;
  }

  function fireTimers() {
    // по порядку срока, внутри кадра допускаем цепочки коротких таймеров
    for (let guard = 0; guard < 1000; guard++) {
      let next = null;
      for (const t of timers.values()) if (t.at <= now && (!next || t.at < next.at || (t.at === next.at && t.id < next.id))) next = t;
      if (!next) return;
      if (next.iv) next.at += next.iv; else timers.delete(next.id);
      try { next.fn(...next.a); } catch (e) { console.error('[vt timer]', e); }
    }
  }

  window.__vt = {
    DT,
    get frame() { return frame; },
    get now() { return now; },
    step(n = 1) {
      for (let i = 0; i < n; i++) {
        now += DT; frame++;
        fireTimers();
        if (window.__vt.pre) { try { window.__vt.pre(frame); } catch (e) { console.error('[vt pre]', e); } }
        const q = rafQ; rafQ = [];
        for (const [, cb] of q) { try { cb(now); } catch (e) { console.error('[vt raf]', e); } }
        syncAnimations();
      }
    },
    // Вызывается сразу после действия мыши: подхватить только что созданные переходы CSS
    // ДО того, как они проживут хоть сколько-то реального времени (и завершатся на медленной машине).
    sync() { syncAnimations(); },
    rebase() { return rebaseAnimations(); },
    seed(s) { rs = s | 0; },
    setAnchorSeed(s) { anchorSeed = s | 0; },
    anchored: () => anchored,
    anchorFrame: () => anchorFrame,
    // Два настоящих кадра отрисовки браузера: доставить события transitionend и т.п.
    // И дождаться ответов на запросы, которые игра успела отправить в ЭТОМ кадре (мы
    // их обрываем, и обрыв приходит в реальное время): иначе под нагрузкой ответ
    // попадал бы в разные виртуальные кадры и бой расходился.
    async settle() {
      await new Promise((r) => realRAF(() => realRAF(r)));
      for (let i = 0; i < 100 && inflight > 0; i++) await new Promise((r) => realST(r, 10));
      // Переходы CSS, созданные в ЭТИ два настоящих кадра (например, подписи ворот после выбора бойца), успели
      // бы прожить сколько-то реального времени до снимка, а оно зависит от машины и частоты снимков.
      // Ставим их на паузу в ноль сразу, до снимка.
      syncAnimations();
    },
    realDelay(ms) { return new Promise((r) => realST(r, ms)); },
  };
})();
