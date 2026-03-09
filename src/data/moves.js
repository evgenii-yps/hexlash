export const allMoves = {
  // === СКОРОСТЬ ===
  jab: {
    id: "jab",
    name: "Джеб",
    branch: "speed",
    description: "Быстрый прямой удар передней рукой. Основа любой атаки.",
    damage: [8, 10, 12, 15, 18],
    speed: [1.2, 1.3, 1.4, 1.5, 1.6]
  },
  double_jab: {
    id: "double_jab",
    name: "Двойной джеб",
    branch: "speed",
    description: "Два быстрых джеба подряд. Не даёт противнику опомниться.",
    damage: [12, 15, 18, 22, 26],
    speed: [1.1, 1.2, 1.3, 1.4, 1.5]
  },
  rapid_fire: {
    id: "rapid_fire",
    name: "Скорострел",
    branch: "speed",
    description: "Серия из трёх быстрых ударов в корпус.",
    damage: [15, 18, 22, 27, 32],
    speed: [1.0, 1.1, 1.2, 1.3, 1.4]
  },
  combo_strike: {
    id: "combo_strike",
    name: "Комбо-удар",
    branch: "speed",
    description: "Связка джеб-кросс-хук на высокой скорости.",
    damage: [20, 24, 29, 35, 42],
    speed: [0.9, 1.0, 1.1, 1.2, 1.3]
  },
  flurry: {
    id: "flurry",
    name: "Шквал",
    branch: "speed",
    description: "Безостановочная серия ударов. Противник не может ответить.",
    damage: [25, 30, 36, 43, 52],
    speed: [0.8, 0.9, 1.0, 1.1, 1.2]
  },
  hurricane: {
    id: "hurricane",
    name: "Ураган",
    branch: "speed",
    description: "Ультимативная скоростная атака. Десятки ударов за секунды.",
    damage: [32, 38, 46, 55, 66],
    speed: [0.7, 0.8, 0.9, 1.0, 1.1]
  },

  // === СИЛА ===
  straight: {
    id: "straight",
    name: "Прямой",
    branch: "power",
    description: "Мощный прямой удар задней рукой. Классика бокса.",
    damage: [12, 15, 18, 22, 27],
    speed: [0.8, 0.85, 0.9, 0.95, 1.0]
  },
  hook: {
    id: "hook",
    name: "Хук",
    branch: "power",
    description: "Боковой удар с разворота. Пробивает защиту сбоку.",
    damage: [16, 20, 24, 29, 35],
    speed: [0.75, 0.8, 0.85, 0.9, 0.95]
  },
  uppercut: {
    id: "uppercut",
    name: "Апперкот",
    branch: "power",
    description: "Удар снизу вверх в челюсть. Нокаутирующий потенциал.",
    damage: [20, 25, 30, 36, 44],
    speed: [0.7, 0.75, 0.8, 0.85, 0.9]
  },
  haymaker: {
    id: "haymaker",
    name: "Размашной",
    branch: "power",
    description: "Широкий мощный удар с полного замаха.",
    damage: [26, 32, 38, 46, 56],
    speed: [0.6, 0.65, 0.7, 0.75, 0.8]
  },
  hammer_fist: {
    id: "hammer_fist",
    name: "Молот",
    branch: "power",
    description: "Удар сверху вниз как молотом. Дробит защиту.",
    damage: [32, 40, 48, 58, 70],
    speed: [0.5, 0.55, 0.6, 0.65, 0.7]
  },
  knockout_blow: {
    id: "knockout_blow",
    name: "Нокаут",
    branch: "power",
    description: "Ультимативный удар. Один удар — один нокаут.",
    damage: [42, 52, 62, 75, 90],
    speed: [0.4, 0.45, 0.5, 0.55, 0.6]
  },

  // === ТЕХНИКА ===
  block_strike: {
    id: "block_strike",
    name: "Блок-удар",
    branch: "technique",
    description: "Блокируешь удар и сразу отвечаешь. Базовая контратака.",
    damage: [10, 12, 15, 18, 22],
    speed: [1.0, 1.05, 1.1, 1.15, 1.2]
  },
  counter_jab: {
    id: "counter_jab",
    name: "Контр-джеб",
    branch: "technique",
    description: "Джеб в момент атаки противника. Ловишь на открытии.",
    damage: [14, 17, 21, 25, 30],
    speed: [0.95, 1.0, 1.05, 1.1, 1.15]
  },
  feint_cross: {
    id: "feint_cross",
    name: "Обманный кросс",
    branch: "technique",
    description: "Финт левой, удар правой. Противник ведётся на обман.",
    damage: [18, 22, 27, 32, 39],
    speed: [0.9, 0.95, 1.0, 1.05, 1.1]
  },
  parry_punish: {
    id: "parry_punish",
    name: "Парирование",
    branch: "technique",
    description: "Отводишь удар противника и наказываешь за промах.",
    damage: [22, 27, 33, 40, 48],
    speed: [0.85, 0.9, 0.95, 1.0, 1.05]
  },
  slip_counter: {
    id: "slip_counter",
    name: "Слип-контр",
    branch: "technique",
    description: "Уклоняешься от удара и бьёшь в открывшуюся зону.",
    damage: [28, 34, 41, 50, 60],
    speed: [0.8, 0.85, 0.9, 0.95, 1.0]
  },
  precision_strike: {
    id: "precision_strike",
    name: "Точный удар",
    branch: "technique",
    description: "Ультимативная техника. Бьёшь точно в уязвимое место.",
    damage: [35, 43, 52, 63, 76],
    speed: [0.75, 0.8, 0.85, 0.9, 0.95]
  }
};
