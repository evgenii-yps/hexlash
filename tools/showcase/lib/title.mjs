// Титр в чёрном кадре перехода (T1–T3): короткая матовая надпись Saira Condensed 900 на #08080A,
// цвет и фон — как у финальной карточки, без свечения. Появление — «щелчок» масштаба
// from (≈92 %) → 100 % за snap кадров, без перехода прозрачности; уход — срез в чёрный.
// Намеренно СЛАБЕЕ BAM логотипа: ни перерегулирования выше 100 %, ни толчка кадра — финал остаётся самым сильным ударом.
// Всё берётся из плана (plan.text, delay, hold, snap, from, size) — тексты и тайминг правятся без кода.
import { LOGO_PATH } from './logo.mjs';
export const TITLE_PATH = LOGO_PATH;   // та же служебная страница обвязки (её маршрут подменяет сессия)
export const titleHtml = (plan) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@900&display=swap">
<style>
  html,body{margin:0;height:100%;background:#08080A;overflow:hidden}
  .stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
  .t{font:900 ${plan.size ?? 4.4}vw/1 'Saira Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#F6F4F6;white-space:nowrap;
     transform:scale(${plan.from ?? 0.92});visibility:hidden;will-change:transform;padding-left:.14em}
</style></head><body><div class="stage"><div class="t" id="t">${String(plan.text).replace(/[<>&]/g, '')}</div></div>
<script>
  const DELAY=${plan.delay ?? 6}, HOLD=${plan.hold ?? 60}, SNAP=${plan.snap ?? 4}, FROM=${plan.from ?? 0.92};
  const el=document.getElementById('t'), easeOut=(u)=>1-Math.pow(1-u,3);
  function tick(){
    const base=(window.__logoBase!==undefined)?window.__logoBase:window.__vt.frame;
    const f=window.__vt.frame-base-DELAY;
    if(f<0||f>=HOLD){ el.style.visibility='hidden'; }
    else { el.style.visibility='visible'; el.style.transform='scale('+(FROM+(1-FROM)*easeOut(Math.min(1,f/SNAP)))+')'; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
</script></body></html>`;
