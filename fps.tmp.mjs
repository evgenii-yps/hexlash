// Замер кадра в зале FORGE, три прохода, 390×844.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const out = [];
for (let i = 0; i < 3; i++) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:4173/play/pve', { waitUntil: 'commit', timeout: 40000 });
  await p.waitForTimeout(14000);
  const n = await p.evaluate(() => new Promise((res) => {
    let c = 0; const t0 = performance.now();
    const tick = () => { c += 1; if (performance.now() - t0 < 4000) requestAnimationFrame(tick); else res(Math.round(c / ((performance.now() - t0) / 1000))); };
    requestAnimationFrame(tick);
  }));
  out.push(n);
  await p.close();
}
console.log(`${process.env.LABEL || 'замер'}: ${out.join(' · ')} кадров/с   (худший ${Math.min(...out)})`);
await b.close();
