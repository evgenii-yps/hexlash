// Финальная карточка: матовая связка «знак + слово» на #08080A, без свечения.
// Канон — docs/design-handoff/hexlash_mark/README.md: знак 44 · слово 24 · зазор 14,
// слово Saira Condensed 900 заглавными, разрядка 0,14em, оптический центр.
// Всё выводится от одной переменной --mark (как в шапке лендинга).
// Знак — public/brand/mark-full-512.png (с надрезами и розовым росчерком); слово — живой текст.
export const LOGO_PATH = '/__showcase/logo.html';
export const logoHtml = (plan) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@900&display=swap">
<style>
  html,body{margin:0;height:100%;background:#08080A;overflow:hidden}
  .stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
  .lock{--mark:${plan.mark || 132}px;display:flex;align-items:center;gap:calc(var(--mark)*14/44);color:#F6F4F6;transform:scale(0);will-change:transform}
  .lock img{width:var(--mark);height:var(--mark);display:block}
  .lock span{font:900 calc(var(--mark)*24/44)/1 'Saira Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase}
</style></head><body><div class="stage"><div class="lock" id="lock"><img src="/brand/mark-full-512.png" alt=""><span>HEXLASH</span></div></div>
<script>
  const DELAY=${plan.delay ?? 36}, GROW=${plan.grow ?? 12};
  let F0=null; const el=document.getElementById('lock');
  const easeOut=(u)=>1-Math.pow(1-u,3);
  function tick(){
    if(F0===null) F0=window.__vt.frame;
    const f=window.__vt.frame-F0-DELAY;
    const s=f<0?0:(0.3+0.7*easeOut(Math.min(1,f/GROW)));
    el.style.transform='scale('+s+')';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
</script></body></html>`;
