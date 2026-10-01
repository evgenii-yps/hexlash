// Финальная карточка: матовая связка «знак + слово» на #08080A, без свечения.
// Канон — docs/design-handoff/hexlash_mark/README.md: знак 44 · слово 24 · зазор 14,
// слово Saira Condensed 900 заглавными, разрядка 0,14em, оптический центр.
// Всё выводится от одной переменной --mark (как в шапке лендинга); размер задан долей ширины
// кадра (132 px на 1280), чтобы на 1080p связка была той же величины относительно кадра.
// Знак — public/brand/mark-full-512.png (с надрезами и розовым росчерком); слово — живой текст.
//
// BAM, шаги 2 и 3 (ТЗ v2 §3.7): связка появляется с масштаба ≈5 %, выходит на ≈108 % и оседает
// на 100 % за 9 кадров (6 вверх + 3 вниз); на кадре пика — толчок кадра на 3 кадра. Никакого
// перехода прозрачности 0 → 100 и никакого свечения: удар передаётся только движением.
export const LOGO_PATH = '/__showcase/logo.html';
export const logoHtml = (plan) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@900&display=swap">
<style>
  html,body{margin:0;height:100%;background:#08080A;overflow:hidden}
  .stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;will-change:transform}
  .lock{--mark:calc(100vw*${(plan.mark || 132) / 1280});display:flex;align-items:center;gap:calc(var(--mark)*14/44);color:#F6F4F6;transform:scale(0);will-change:transform}
  .lock img{width:var(--mark);height:var(--mark);display:block}
  .lock span{font:900 calc(var(--mark)*24/44)/1 'Saira Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase}
</style></head><body><div class="stage" id="stage"><div class="lock" id="lock"><img src="/brand/mark-full-512.png" alt=""><span>HEXLASH</span></div></div>
<script>
  const DELAY=${plan.delay ?? 6};
  const UP=${plan.up ?? 6}, DOWN=${plan.down ?? 3}, S0=0.05, PEAK=1.08;
  // толчок кадра: смещения в долях ширины кадра на кадрах UP, UP+1, UP+2
  const SHOVE=[[0.0094,-0.0070],[-0.0060,0.0045],[0.0020,-0.0012]];
  let F0=null; const el=document.getElementById('lock'), stage=document.getElementById('stage');
  const easeOut=(u)=>1-Math.pow(1-u,3), easeInOut=(u)=>u*u*(3-2*u);
  const scaleAt=(f)=>{
    if(f<0) return 0;
    if(f<UP) return S0+(PEAK-S0)*easeOut(f/UP);
    if(f<UP+DOWN) return PEAK+(1-PEAK)*easeInOut((f-UP)/DOWN);
    return 1;
  };
  function tick(){
    if(F0===null) F0=window.__vt.frame;
    const f=window.__vt.frame-F0-DELAY;
    el.style.transform='scale('+scaleAt(f)+')';
    const k=f-UP, sv=(k>=0&&k<SHOVE.length)?SHOVE[k]:[0,0], w=window.innerWidth;
    stage.style.transform='translate('+(sv[0]*w)+'px,'+(sv[1]*w)+'px)';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
</script></body></html>`;
