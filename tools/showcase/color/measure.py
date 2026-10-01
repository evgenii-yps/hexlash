"""Замер цвета ТОЛЬКО 3D-сцены: без полосы браузера, панели задач и интерфейса игры.
Эталоны (экран владельца ≈2560 px) и кадры ролика (1280×720) меряются одним способом."""
from PIL import Image
import numpy as np, glob, os, json, sys

# обрезка эталонов (px): top, bottom, left, right — полоса браузера, панель задач, рамка окна
REF_CROP = {
 'island.png':(8,1306,8,8), 'duel1.png':(8,1296,8,8), 'duel2.png':(24,1316,8,8),
 'squad1.png':(36,1316,8,8), 'squad2.png':(28,1320,8,8), 'squad3.png':(8,1272,8,8), 'forge_image.png':(28,1320,8,8)}
REF_SCENE = {'island.png':'home','duel1.png':'arena','duel2.png':'arena','squad1.png':'arena','squad2.png':'arena','squad3.png':'arena','forge_image.png':'hall'}
# маски интерфейса в долях кадра (x0,y0,x1,y1) после обрезки: правая панель (COOLDOWN, LEGEND LEADS, SHOP, профиль),
# карточки команд внизу по центру (и кнопка FIGHT на острове), углы
UI_MASKS = [(0.915,0.0,1.0,1.0),(0.0,0.0,0.12,0.14),(0.42,0.80,0.58,1.0),(0.0,0.0,0.30,0.06)]
HOME_EXTRA = [(0.88,0.92,1.0,1.0),(0.42,0.80,0.58,1.0)]

def load(path): return np.asarray(Image.open(path).convert('RGB')).astype(np.float32)/255.0

def mask_for(h,w):
    m = np.ones((h,w),bool)
    for x0,y0,x1,y1 in UI_MASKS: m[int(y0*h):int(y1*h), int(x0*w):int(x1*w)] = False
    return m

def stats(a, m):
    """a: H×W×3 (0..1), m: булева маска «это сцена»."""
    L = a @ np.array([0.2126,0.7152,0.0722],np.float32)
    mx = a.max(2); mn = a.min(2); sat = np.where(mx>1e-4,(mx-mn)/np.maximum(mx,1e-4),0)
    px = a[m]; l = L[m]; s = sat[m]
    out = {'n': int(m.sum())}
    out['pct'] = {p: float(np.percentile(l,p)) for p in (5,25,50,75,90,95,99,99.9)}
    bg = l < 0.05                      # «почти чёрный» фон
    out['bg_share'] = float(bg.mean()); out['bg_rgb'] = [float(x) for x in px[bg].mean(0)] if bg.any() else None
    lit = (l >= 0.05) & (s < 0.35)     # освещённое, не цветное: пол, стены арены, тела
    out['lit_share'] = float(lit.mean()); out['lit_rgb'] = [float(x) for x in px[lit].mean(0)] if lit.any() else None
    out['lit_L'] = {p: float(np.percentile(l[lit],p)) for p in (10,50,90)} if lit.any() else None
    col = (s >= 0.5) & (l >= 0.15)     # цветное: розовые трещины, сердца бойцов
    out['col_share'] = float(col.mean()); out['col_rgb'] = [float(x) for x in px[col].mean(0)] if col.any() else None
    out['clip_share'] = float((px.max(1) > 0.985).mean())   # пересвет
    out['mean_sat_lit'] = float(s[lit].mean()) if lit.any() else None
    return out

def ref_stats(path):
    name = os.path.basename(path); a = load(path); t,b,l,r = REF_CROP[name]; a = a[t:b, l:a.shape[1]-r]
    return stats(a, mask_for(*a.shape[:2]))
def frame_stats(path, home=False):
    a = load(path); return stats(a, mask_for(*a.shape[:2]))

if __name__ == '__main__':
    res = {}
    for f in sorted(glob.glob('color-ref/*.png')):
        n = os.path.basename(f); res[n] = ref_stats(f)
    print(json.dumps(res, indent=1))
