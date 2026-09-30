## Третий резонанс при семи кристаллах
| ядро | всех наборов по 7 из 15 | 0 резонансов | 1 резонанс | 2 резонанса | 3 резонанса |
| --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | 6435 | 0 | 4635 | 1800 | 0 |
| RAIDER | 6435 | 0 | 4635 | 1800 | 0 |
| BULWARK | 6435 | 0 | 4635 | 1800 | 0 |
| AMBUSH | 6435 | 0 | 4635 | 1800 | 0 |

Максимум резонансов в наборе из 7: **2**. Аргумент: порог 3 × три ветки = 9 кристаллов > 7 → третий резонанс невозможен; перебор всех 6435 наборов на ядро это подтверждает. Более того, набора из 7 БЕЗ единого резонанса не бывает (2+2+2 = 6 < 7).

## Наборы из 3 и 5 кристаллов не меняются от правила половины
| ядро | наборов с одинаковыми наклонами до и после |
| --- | --- |
| ONSLAUGHT | 3458 из 3458 |
| RAIDER | 3458 из 3458 |
| BULWARK | 3458 из 3458 |
| AMBUSH | 3458 из 3458 |

## Пары веток одного ядра, складывающие одно намерение
Величины: главное намерение резонанса 0.3, второстепенное 0.15. «До» — оба резонанса полностью; «после» — первый полностью, второй ×0.5. Первым считается ветка, собранная глубже; при равенстве — та, что выше по порядку (a, b, c). Ниже первая ветка пары — первая по порядку (при 3+3 она и есть первая); если глубже вторая (4+3 наоборот) — роли меняются, сумма считается тем же способом.
| ядро | пара веток | общее намерение | вклады | сумма до | сумма после |
| --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | a BODY · RAM + b MIND · CHASE | PRESS | RAM: второстепенное 0.15; CHASE: второстепенное 0.15 | 0.3 | 0.225 |
| ONSLAUGHT | a BODY · RAM + c WILL · FRENZY | STRIKE | RAM: главное 0.3; FRENZY: главное 0.3 | 0.6 | 0.45 |
| ONSLAUGHT | a BODY · RAM + c WILL · FRENZY | PRESS | RAM: второстепенное 0.15; FRENZY: второстепенное 0.15 | 0.3 | 0.225 |
| ONSLAUGHT | b MIND · CHASE + c WILL · FRENZY | PRESS | CHASE: второстепенное 0.15; FRENZY: второстепенное 0.15 | 0.3 | 0.225 |
| RAIDER | a BODY · JAB + b MIND · FEINT | STING | JAB: главное 0.3; FEINT: главное 0.3 | 0.6 | 0.45 |
| RAIDER | a BODY · JAB + c WILL · HUNT | STING | JAB: главное 0.3; HUNT: второстепенное 0.15 | 0.45 | 0.375 (если HUNT первая: 0.3) |
| RAIDER | b MIND · FEINT + c WILL · HUNT | STING | FEINT: главное 0.3; HUNT: второстепенное 0.15 | 0.45 | 0.375 (если HUNT первая: 0.3) |
| BULWARK | a BODY · BASTION + b MIND · BREAKER | CATCH | BASTION: второстепенное 0.15; BREAKER: главное 0.3 | 0.45 | 0.3 (если BREAKER первая: 0.375) |
| BULWARK | a BODY · BASTION + c WILL · VICE | HOLD | BASTION: главное 0.3; VICE: главное 0.3 | 0.6 | 0.45 |
| AMBUSH | a BODY · TRAP + c WILL · STING | CATCH | TRAP: главное 0.3; STING: второстепенное 0.15 | 0.45 | 0.375 (если STING первая: 0.3) |
| AMBUSH | b MIND · SHADOW + c WILL · STING | STING | SHADOW: второстепенное 0.15; STING: главное 0.3 | 0.45 | 0.3 (если STING первая: 0.375) |

Всего пар веток со сложением: **10** из 12 (по 3 пары на ядро); строк в таблице 11, потому что у пары может совпасть и главное, и второстепенное намерение. Пары без сложения: BULWARK BREAKER + VICE, AMBUSH TRAP + SHADOW.

## Вершины (шаг 5) при семи кристаллах: столкновение с резонансами
| ядро | ветка | вершина | наклон · условие | то же намерение у резонанса |
| --- | --- | --- | --- | --- |
| ONSLAUGHT | a BODY · RAM | overload_strike | STRIKE · foeHpLow | своя ветка (STRIKE/PRESS); FRENZY (STRIKE главное) |
| ONSLAUGHT | b MIND · CHASE | lockdown | HOLD · close | своя ветка (HOLD/PRESS) |
| ONSLAUGHT | c WILL · FRENZY | rampage | STRIKE · selfHpLow | своя ветка (STRIKE/PRESS); RAM (STRIKE главное) |
| RAIDER | a BODY · JAB | perfect_jab | STING · foeQuiet | своя ветка (STING/); FEINT (STING главное); HUNT (STING второстепенное) |
| RAIDER | b MIND · FEINT | feint_combo | STRIKE · close | HUNT (STRIKE главное) |
| RAIDER | c WILL · HUNT | lethal_entry | PRESS · foeHpLow | — |
| BULWARK | a BODY · BASTION | fortress | HOLD · selfHpLow | своя ветка (HOLD/CATCH); VICE (HOLD главное) |
| BULWARK | b MIND · BREAKER | counter_trap | CATCH · longFight | своя ветка (CATCH/); BASTION (CATCH второстепенное) |
| BULWARK | c WILL · VICE | clinch | PRESS · close | своя ветка (HOLD/PRESS) |
| AMBUSH | a BODY · TRAP | perfect_trap | STRIKE · foeHpLow&foeQuiet | — |
| AMBUSH | b MIND · SHADOW | phantom | BREAK · hpDropped | своя ветка (BREAK/STING) |
| AMBUSH | c WILL · STING | execute | STRIKE · foeHpLow | — |
