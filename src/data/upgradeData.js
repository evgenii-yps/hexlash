/* HEXLASH — экран прокачки · КОНТЕНТ (заглушки · правит геймдизайн).
   Перенос 1:1 из upgrade_handoff/data.js (контент-блок). Имена ядер/кристаллов/
   граней, числа и лимиты — рабочие заглушки. id ядер уходят в стор — НЕ МЕНЯТЬ. */

/* RESOURCE — общий пул очков ядра. Делится между всеми кристаллами. */
export const RESOURCE = 5;

/* Четыре ядра (данные экрана прокачки). id — НЕ МЕНЯТЬ (уходят в стор).
   hue — основной цвет ядра (в него темится весь экран через --core).
   sup — поддерживающий тон (нижний слой свечения ядра, внутренний рисунок). */
export const CORES = [
  { id: 'natisk', ix: '01', name: 'Натиск', hue: '#FF3344', sup: '#FF7A3D',
    manner: 'Прёт и давит вплотную — не отпускает дистанцию.' },
  { id: 'nalet', ix: '02', name: 'Налётчик', hue: '#FFA526', sup: '#FFD93D',
    manner: 'Налетает и уходит — серия касаний, разрыв, снова.' },
  { id: 'skala', ix: '03', name: 'Скала', hue: '#2ED6B0', sup: '#5DD6E6',
    manner: 'Терпит и перемалывает — держит удар, отдаёт позже.' },
  { id: 'zasada', ix: '04', name: 'Засада', hue: '#9461FF', sup: '#D461FF',
    manner: 'Выжидает и наказывает — тишина, затем один удар.' },
];

/* грань: { id, name, state }   state ∈ 'lit' | 'open' | 'locked'  — НЕ МЕНЯТЬ имена */
function mkFaces(states) {
  return states.map((s, i) => ({ id: i + 1, name: 'Грань ' + String(i + 1).padStart(2, '0'), state: s }));
}

/* CRYSTALS[coreId] = [{ id, name, limit, faces:[...] }]
   limit — личный потолок кристалла (сколько граней он вообще даст зажечь).
   Двойной ограничитель: limit кристалла + общий RESOURCE ядра. */
export const CRYSTALS = {
  natisk: [
    { id: 'a', name: 'Напор', limit: 3, faces: mkFaces(['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Захват', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Темп', limit: 3, faces: mkFaces(['open', 'open', 'open', 'locked', 'locked']) },
  ],
  nalet: [
    { id: 'a', name: 'Налёт', limit: 3, faces: mkFaces(['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Отрыв', limit: 2, faces: mkFaces(['lit', 'lit', 'open', 'locked']) },
    { id: 'c', name: 'Финт', limit: 2, faces: mkFaces(['open', 'open', 'open', 'locked']) },
    { id: 'd', name: 'Касание', limit: 3, faces: mkFaces(['open', 'open', 'locked', 'locked']) },
  ],
  skala: [
    { id: 'a', name: 'Корка', limit: 3, faces: mkFaces(['lit', 'lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Помол', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Опора', limit: 3, faces: mkFaces(['open', 'open', 'open', 'locked', 'locked']) },
  ],
  zasada: [
    { id: 'a', name: 'Тишина', limit: 2, faces: mkFaces(['lit', 'open', 'open', 'locked']) },
    { id: 'b', name: 'Капкан', limit: 3, faces: mkFaces(['lit', 'open', 'open', 'open', 'locked']) },
    { id: 'c', name: 'Расплата', limit: 2, faces: mkFaces(['open', 'open', 'locked']) },
  ],
};

/* Мост id экрана выбора (src/data/cores.js) → id хэндофа прокачки.
   Отличается только Налётчик (naletchik → nalet); остальные совпадают. */
const PREFIGHT_TO_HANDOFF = { natisk: 'natisk', naletchik: 'nalet', skala: 'skala', zasada: 'zasada' };
export const toHandoffCoreId = (prefightId) => PREFIGHT_TO_HANDOFF[prefightId] || 'skala';
export const getHandoffCore = (handoffId) => CORES.find((c) => c.id === handoffId) || CORES[2];
