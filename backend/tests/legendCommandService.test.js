// legendCommandService.test.js — разбраковка реплики легенды и разбор решения.
//
// ЗАЧЕМ ЭТИ ТЕСТЫ СУЩЕСТВУЮТ. ТЗ части B §3 требует жёсткой разбраковки: плохая
// реплика выбрасывается ЦЕЛИКОМ, заготовленных фраз на этот случай нет. Список
// запретов длинный и правился бы вслепую — здесь он заперт примерами, и каждая
// причина отказа названа отдельно, потому что приёмка просит доложить отказы
// РАЗДЕЛЬНО по причинам.
//
// legendCommandService транзитивно тянет config.js, а тот бросает без
// JWT_SECRET на загрузке модуля. Ставим безобидное значение, чтобы файл
// запускался простым `npm test` без настройки окружения (как в helpers.test.js).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  validateLine, parseCommand, buildUserPrompt, LINE_MAX_LEN,
} = require('../src/services/legendCommandService');

describe('validateLine — что проходит', () => {
  it('обычная реплика', () => {
    assert.deepEqual(validateLine('HOLD THE LINE. HE BREAKS.'),
      { ok: true, line: 'HOLD THE LINE. HE BREAKS.' });
  });

  it('ровно потолок знаков', () => {
    assert.equal(validateLine('A'.repeat(LINE_MAX_LEN)).ok, true);
  });

  it('обрезает пробелы по краям, а не отказывает из-за них', () => {
    assert.equal(validateLine('  UP.  ').line, 'UP.');
  });

  // ⚠️ САМЫЙ ВАЖНЫЙ ТЕСТ ФАЙЛА. ТЗ §3 перечисляет press среди слов про
  //    интерфейс, но в этой игре PRESS — одно из семи намерений, а PUSH — один
  //    из трёх кличей. Запретить слово целиком значило бы заткнуть ровно тот
  //    голос, ради которого всё делается: ядро натиска говорит «PRESS HIM».
  //    Поэтому запрещены только однозначные обороты про орган управления.
  it('PRESS про бой живёт — это голос ядра натиска, а не про интерфейс', () => {
    assert.equal(validateLine('PRESS HIM. NOW.').ok, true);
    assert.equal(validateLine('PRESS FORWARD, NO GAPS').ok, true);
  });
});

describe('validateLine — что выбрасывается и почему', () => {
  const cases = [
    ['не строка', 42, 'not_a_string'],
    ['пустая', '   ', 'empty'],
    ['длиннее потолка', 'A'.repeat(LINE_MAX_LEN + 1), 'too_long'],
    ['кириллица', 'ДЕРЖИ СТРОЙ', 'not_latin'],
    ['эмодзи', 'HOLD 🔥', 'not_latin'],
    ['внутренний словарь: HOUSE', 'THE HOUSE STANDS', 'internal_vocab'],
    ['внутренний словарь: HEXARCH', 'HEXARCH WATCHES', 'internal_vocab'],
    ['внутренний словарь: ASCENSION', 'ASCENSION WAITS', 'internal_vocab'],
    ['ругань', 'HIT HIM, DAMN IT', 'profanity'],
    ['про кнопку', 'TAP THE BUTTON NOW', 'ui_talk'],
    ['про экран', 'WATCH THE SCREEN', 'ui_talk'],
    ['press про орган управления', 'PRESS THE LEVER', 'ui_talk'],
    ['игрок в третьем лице', 'THE PLAYER DECIDES', 'third_person'],
  ];
  for (const [name, value, why] of cases) {
    it(`${name} → ${why}`, () => {
      const r = validateLine(value);
      assert.equal(r.ok, false);
      assert.equal(r.why, why);
    });
  }
});

describe('parseCommand — решение', () => {
  const LEVERS = ['hold', 'push', 'towel'];
  const P = (obj, levers = LEVERS, n = 3) => parseCommand(JSON.stringify(obj), levers, n);

  it('рычаг из списка и цель в списке — принимается', () => {
    const r = P({ lever: 'hold', target: 2, line: 'HOLD.' });
    assert.deepEqual(r, { lever: 'hold', target: 2, line: 'HOLD.', lineWhy: '' });
  });

  // Легенда идёт в ту же дверь, что палец: рычага нет в руках — ответа нет.
  it('рычага нет среди доступных — ответ негоден целиком', () => {
    assert.equal(P({ lever: 'dice', target: 1, line: 'X.' }), null);
  });

  it('цель вне списка бойцов — ответ негоден целиком', () => {
    assert.equal(P({ lever: 'hold', target: 9, line: 'X.' }), null);
  });

  it('рычаг без цели — негоден: рычаг адресный', () => {
    assert.equal(P({ lever: 'hold', target: 0, line: 'X.' }), null);
  });

  // «Ничего не делать» — полноценное решение, а не отказ: легенда бережёт заряд.
  it('none — законный ответ, и реплика при нём живёт', () => {
    const r = P({ lever: 'none', target: 0, line: 'NOT YET.' });
    assert.deepEqual(r, { lever: 'none', target: 0, line: 'NOT YET.', lineWhy: '' });
  });

  // ⚠️ ПОРОЗНЬ, И ЭТО НАРОЧНО: негодная реплика не отменяет верного решения.
  //    Легенда тогда действует и молчит — ровно то, что требует ТЗ §3.
  it('плохая реплика не уносит с собой решение', () => {
    const r = P({ lever: 'push', target: 1, line: 'ДАВАЙ' });
    assert.equal(r.lever, 'push');
    assert.equal(r.line, '');
    assert.equal(r.lineWhy, 'not_latin');
  });

  it('мусор вместо JSON — ответа нет', () => {
    assert.equal(parseCommand('я подумал и решил', LEVERS, 3), null);
    assert.equal(parseCommand('', LEVERS, 3), null);
  });

  it('JSON внутри прозы всё равно находится', () => {
    const r = parseCommand('sure: {"lever":"hold","target":1,"line":"UP."} ok', LEVERS, 3);
    assert.equal(r.lever, 'hold');
  });
});

describe('buildUserPrompt — в промпт не утекают сырые числа', () => {
  it('состояние идёт словами, а осей в тексте нет', () => {
    const txt = buildUserPrompt({
      portrait: ['ONSLAUGHT — marches in close'],
      units: [{ name: 'VULK', hp: 'hurt' }],
      foes: { count: 'three against your one', state: 'fresh' },
      levers: [{ id: 'hold', name: 'HOLD', left: 2 }],
      phase: 'mid-fight',
      trigger: 'your fighter just dropped low',
    });
    assert.match(txt, /VULK — hurt/);
    assert.match(txt, /- hold: HOLD \(2 left\)/);
    // Названий осей поведения в промпте быть не должно — характер идёт словами.
    for (const axis of ['distance', 'initiative', 'tempo', 'weight', 'stick', 'resilience', 'counter', 'slip']) {
      assert.ok(!txt.includes(axis), `ось ${axis} утекла в промпт`);
    }
  });
});
