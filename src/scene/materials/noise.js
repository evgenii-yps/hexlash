// Epic 2 — pit-view hub. Step 2.
// Source: hexlash_v24.html lines 5062-5080 (makeNoiseTexture).
// THREE passed as param (в прототипе был глобальный).

export function makeNoiseTexture(THREE, size, scale, contrast) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    let v = Math.random();
    // soft cloud-like noise via simple averaging
    v = (v + Math.random() + Math.random()) / 3;
    v = Math.pow(v, contrast);
    const g = Math.floor(v * 255);
    img.data[i] = g;
    img.data[i + 1] = g;
    img.data[i + 2] = g;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(scale, scale);
  return tex;
}
