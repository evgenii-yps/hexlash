/* ============================================================
   HEXLASH — ЭКРАН ПРОКАЧКИ · drill-down (ядро → кристалл → грань)
   ------------------------------------------------------------
   Единственное свечение = ядро. Кристаллы и грани — плоские.
   Весь экран темится в цвет ВЫБРАННОГО ядра через --core.

   Vue-порт (контракт 1:1):
   · CORES / CRYSTALS / RESOURCE  (data.js) → props / store
   · hexPts/coreSVG/shardSVG/faceHex/radial (data.js) → чистые функции, как есть
   · setLevel() / openCrystal() / toggleFace() → методы компонента
   · уровень (core|crystal|face) → реактивное поле вместо data-level
   ============================================================ */
(function(){
  const screen = document.getElementById('upg');
  const scene  = document.getElementById('scene');
  if(!screen) return;

  /* контекст ядра приходит с прошлого экрана выбора (заглушка) */
  let coreId   = 'skala';
  let level    = 'core';     // 'core' | 'crystal' | 'face'
  let selCrystal = null;

  const HUE = {}, SUP = {}, IX = {}, NAME = {};
  CORES.forEach(c=>{ HUE[c.id]=c.hue; SUP[c.id]=c.sup; IX[c.id]=c.ix; NAME[c.id]=c.name; });

  /* глубокая копия — правки не мутируют исходные данные */
  let state = JSON.parse(JSON.stringify(CRYSTALS));

  const els = {
    glyph:    screen.querySelector('.core-node .glyph'),
    coreNode: screen.querySelector('.core-node'),
    crystals: screen.querySelector('.crystals'),
    spokes:   screen.querySelector('.spokes'),
    facepanel:screen.querySelector('.facepanel'),
    back:     screen.querySelector('.back'),
    coresel:  screen.querySelector('.coresel'),
    coreTag:  screen.querySelector('.core-tag'),
    poolPips: screen.querySelector('.s-bottom .pool .pips'),
    poolFree: screen.querySelector('.pool-free'),
    poolTotal:screen.querySelector('.pool-total'),
    crumb: {
      core:   screen.querySelector('.crumb .lvl-core'),
      crystal:screen.querySelector('.crumb .lvl-crystal'),
      face:   screen.querySelector('.crumb .lvl-face')
    }
  };

  /* ---------- ресурс ---------- */
  function spentTotal(){
    let n=0; state[coreId].forEach(cr=>{ n += cr.faces.filter(f=>f.state==='lit').length; });
    return n;
  }
  function freePts(){ return RESOURCE - spentTotal(); }

  /* ---------- контекст ядра (свап --core по всему экрану) ---------- */
  function setCoreContext(){
    [screen, scene].forEach(el=>{
      el.style.setProperty('--core', HUE[coreId]);
      el.style.setProperty('--core-sup', SUP[coreId]);
    });
    els.coreTag.querySelector('.nm').textContent = NAME[coreId];
    els.coreTag.querySelector('.ix').textContent = 'ЯДРО ' + IX[coreId];
  }
  function renderCore(){
    setCoreContext();
    els.glyph.innerHTML = coreSVG(coreId, {seed:true});
  }

  /* ---------- кристаллы по радиусу ---------- */
  function renderCrystals(){
    const list = state[coreId];
    const pos  = radial(list.length, 124);
    els.crystals.innerHTML = list.map((cr,i)=>{
      const lit = cr.faces.filter(f=>f.state==='lit').length;
      return `<button class="crystal" data-cr="${cr.id}"
                style="--x:${pos[i].x.toFixed(0)}px;--y:${pos[i].y.toFixed(0)}px">
        <span class="shard">${shardSVG(lit/cr.limit, coreId+'-'+cr.id)}</span>
        <span class="nm">${cr.name}</span>
        <span class="ratio"><b>${lit}</b>/${cr.limit}</span>
      </button>`;
    }).join('');
    // спицы — по измеренному центру, чтобы линии били точно в кристаллы
    const w = els.spokes.clientWidth || 386, h = els.spokes.clientHeight || 674;
    els.spokes.setAttribute('viewBox', `0 0 ${w} ${h}`);
    els.spokes.innerHTML = pos.map(p=>
      `<line x1="${(w/2).toFixed(0)}" y1="${(h/2).toFixed(0)}"
             x2="${(w/2+p.x).toFixed(0)}" y2="${(h/2+p.y).toFixed(0)}"/>`).join('');
    els.crystals.querySelectorAll('.crystal').forEach(btn=>{
      btn.addEventListener('click',()=>openCrystal(btn.dataset.cr));
    });
    renderPool();
  }

  /* ---------- общий пул очков ядра (низ) ---------- */
  function renderPool(){
    const spent = spentTotal();
    els.poolFree.textContent  = freePts();
    els.poolTotal.textContent = RESOURCE;
    els.poolPips.innerHTML = Array.from({length:RESOURCE},(_,i)=>
      `<span class="pip ${i<spent?'on':''}"></span>`).join('');
  }

  /* ---------- панель граней ---------- */
  function renderFaces(){
    const cr = state[coreId].find(c=>c.id===selCrystal);
    if(!cr) return;
    const lit = cr.faces.filter(f=>f.state==='lit').length;
    const atLimit = lit>=cr.limit;
    const spent = spentTotal();
    const free = RESOURCE - spent;
    const fp = els.facepanel;

    fp.querySelector('.cr-name').textContent = cr.name;

    const limEl = fp.querySelector('.limit');
    limEl.innerHTML = lit + '<small>/' + cr.limit + '</small>';
    limEl.classList.toggle('max', atLimit);

    fp.querySelector('.meter .pips').innerHTML =
      Array.from({length:RESOURCE},(_,i)=>`<span class="pip ${i<spent?'on':''}"></span>`).join('');
    const freeEl = fp.querySelector('.free');
    freeEl.innerHTML = free + '<small> своб.</small>';
    freeEl.classList.toggle('none', free<=0);

    const grid = fp.querySelector('.faces');
    grid.innerHTML = cr.faces.map(f=>{
      let cls=f.state, label;
      if(f.state==='lit') label='зажжена';
      else if(f.state==='locked') label='недоступна';
      else { // open
        if(atLimit){ cls='open blocked'; label='лимит'; }
        else if(spent>=RESOURCE){ cls='open blocked'; label='нет очков'; }
        else label='доступна';
      }
      return `<div class="face ${cls}" data-f="${f.id}">
        <span class="fhex">${faceHex()}</span>
        <span class="fl-nm">${f.name}</span>
        <span class="fl-st">${label}</span>
      </div>`;
    }).join('');
    grid.querySelectorAll('.face').forEach(el=>{
      el.addEventListener('click',()=>toggleFace(cr, el));
    });
  }

  /* зажечь / погасить грань с двойным ограничителем (лимит + пул) */
  function toggleFace(cr, el){
    const id = +el.dataset.f;
    const f  = cr.faces.find(x=>x.id===id);
    const lit = cr.faces.filter(x=>x.state==='lit').length;
    if(f.state==='locked'){ deny(el); return; }
    if(f.state==='lit'){ f.state='open'; }                       // вернуть очко
    else{
      if(lit>=cr.limit || spentTotal()>=RESOURCE){ deny(el); return; }
      f.state='lit';
    }
    renderFaces();
  }
  function deny(el){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  /* ---------- навигация по уровням ---------- */
  function setLevel(l){
    level = l; screen.dataset.level = l;
    els.crumb.core.className    = 'lvl-core ' + (l==='core' ? 'here' : 'on');
    els.crumb.crystal.className = 'lvl-crystal ' + (l==='crystal' ? 'here' : (l==='face' ? 'on' : ''));
    els.crumb.face.className    = 'lvl-face ' + (l==='face' ? 'here' : '');
  }
  function openCrystal(id){
    selCrystal = id;
    els.crystals.querySelectorAll('.crystal').forEach(el=>
      el.classList.toggle('sel', el.dataset.cr===id));
    renderFaces();
    setLevel('face');
  }
  function goCrystals(){ setLevel('crystal'); }
  function goCore(){ selCrystal=null; setLevel('core'); }

  els.coreNode.addEventListener('click',()=>{ if(level==='core') goCrystals(); });
  els.coreNode.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ') && level==='core'){ e.preventDefault(); goCrystals(); }
  });
  els.back.addEventListener('click',()=>{
    if(level==='face'){ goCrystals(); renderCrystals(); }   // обновить счётчики на возврате
    else if(level==='crystal') goCore();
  });

  /* ---------- демо-свитчер контекст-ядра (только хэндоф) ---------- */
  function buildCoresel(){
    els.coresel.insertAdjacentHTML('beforeend', CORES.map(c=>
      `<button class="cs ${c.id===coreId?'on':''}" data-core="${c.id}" title="${c.name}"
               style="color:${c.hue}">${coreSVG(c.id)}</button>`).join(''));
    els.coresel.querySelectorAll('.cs').forEach(cs=>{
      cs.addEventListener('click',()=>{
        coreId = cs.dataset.core;
        els.coresel.querySelectorAll('.cs').forEach(x=>x.classList.toggle('on',x===cs));
        renderCore(); renderCrystals(); goCore();
      });
    });
  }

  /* «В БОЙ» — главный CTA (в игре уводит на арену; здесь — фидбэк) */
  screen.querySelector('.tobattle').addEventListener('click',function(){
    this.animate(
      [{transform:'scale(1)'},{transform:'scale(.97)'},{transform:'scale(1)'}],
      {duration:220, easing:'cubic-bezier(.4,.05,.1,1)'});
  });

  /* ---------- фит холста под вьюпорт (letterbox) ---------- */
  const device = document.getElementById('device');
  function fit(){
    const W = device.offsetWidth, H = device.offsetHeight;
    const s = Math.min(window.innerWidth/(W+48), window.innerHeight/(H+48), 1.25);
    device.style.transform = 'scale('+s.toFixed(4)+')';
  }
  window.addEventListener('resize', fit);

  /* init */
  buildCoresel(); renderCore(); renderCrystals(); setLevel('core'); fit();
})();
