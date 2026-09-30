// СЦЕНАРИЙ РОЛИКА — единственный файл, который правится ради тайминга и камеры.
// Вся шкала — кадры при 60 кадр/с (FPS). Логики здесь нет, только данные.
//
// Ключ камеры: f — кадр плана; pos — положение камеры; look — точка взгляда;
// roll — крен в градусах; fov — угол обзора (не указан → как у сцены);
// ease — сглаживание входа в этот ключ (linear | smooth | smoother).
export const FPS = 60;

export const plans = [
  {
    id: 's00-pipeline-home',
    title: 'Конвейер: 3 секунды на главном острове',
    route: '/play/home',
    len: 180,            // 3 с
    align: 420,          // на каком кадре после постройки сцены стартует план (7 с)
    world: {
      // герой + по одному на каждое ядро; все «готовы» = стоят без груш и блуждания
      roster: [
        { callsign: 'HAWK',   core: 'natisk', ready: true },
        { callsign: 'RAZOR',  core: 'nalet',  ready: true },
        { callsign: 'CINDER', core: 'skala',  ready: true },
        { callsign: 'ASH',    core: 'zasada', ready: true },
        { callsign: 'DRAKE',  core: 'natisk', ready: true },
      ],
    },
    // Закрытые кнопки прячем ЦЕЛИКОМ (решение архитектора 30.09): иначе ролик
    // показывал бы их рабочими. FIGHT остаётся — это сцена 01.
    hide: ['.hs-strip', '.edit-space', '.fighter-tag', '.perf-hud'],
    camera: {
      ease: 'smoother',
      keys: [
        { f: 0,   pos: [4.6, 5.2, 6.7], look: [0, 1.6, 1.0], roll: 0,   fov: 40 },
        { f: 179, pos: [2.2, 3.0, 5.6], look: [-0.4, 1.4, 0.6], roll: 1.5, fov: 36 },
      ],
    },
  },
];
