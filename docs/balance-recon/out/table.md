«Кристалл» = один из 5 шагов внутри грани (в коде `face` в ветке a|b|c). 15 кристаллов × 4 ядра = 60 ячеек.
Δ осей — фактическая (после зажима 0..100) при зажжённом ЭТОМ кристалле одном, относительно стартового профиля ядра.
Δ stats — замер у живого бойца (`buildFighter().stats`): strikePower / toughness / mobility / accuracy / blockMitigation / blockPenetration / chargeMax…
Рычаги, которых нет в `stats` (feintChance, feintPayoff, staminaRegen, blockCounter, interruptBonus, dodgeCounter, missCounter, interruptResist), видны только в колонке «бонусы» — как записано в данных.

| ядро | грань/кристалл | имя в данных | Δ осей (факт, от старта ядра) | бонусы (% к рычагу) | Δ stats у бойца (замер) | теги (мертвы) | CHARACTER, что видит игрок | текст vs механика |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY/ROOT (a1) | Heavy Hit | wt+14 | strikePower +4% | strikePower +4, mobility -11 | — | Stubborn. He backs off less often than he should. | не совпало (оси resilience,stick,distance не двигаются) |
| ONSLAUGHT | BODY/DRIVE (a2) | Guard Crush | wt+8 | strikePower +7%, blockPenetration +40% | strikePower +7, blockPenetration +0.4, mobility -6 | — | Impatient. He opens the exchange first. | частично |
| ONSLAUGHT | BODY/GRIND (a3) | Unshaken | res+14 | strikePower +10%, interruptResist +70% | strikePower +10 | — | Takes punishment well. Stays in an exchange past the point where it pays. | частично |
| ONSLAUGHT | BODY/BREAK (a4) | Close Power | dist−8 wt+6 | strikePower +14% | strikePower +14, mobility -5 | close_damage_ramp | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| ONSLAUGHT | BODY/ANVIL (a5) | Breakthrough | wt+10 | strikePower +22%, blockPenetration +95% | strikePower +22, blockPenetration +0.95, mobility -8 | overload_strike | Calm under pressure. He no longer panics in the corner. | не совпало (оси resilience,counter не двигаются) |
| ONSLAUGHT | MIND/WATCH (b1) | Hard Entry | dist−8 init+6 | — | — | — | Careful. Waits a little longer before he enters. | ПРОТИВОПОЛОЖНО (initiative) |
| ONSLAUGHT | MIND/TIMING (b2) | Run-Down | dist−6 stick+8 | — | — | chase_strike | Deliberate. Throws fewer blind punches. | не совпало (оси tempo,counter не двигаются) |
| ONSLAUGHT | MIND/FEINT (b3) | Cut Off | stick+10 | — | — | — | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| ONSLAUGHT | MIND/ADAPT (b4) | Cling | dist−6 stick+10 | — | — | — | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | MIND/COLD (b5) | Lockdown | dist−8 stick+14 | — | — | lockdown | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| ONSLAUGHT | WILL/HOLD (c1) | Long Combo | tempo+8 | — | — | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/SPITE (c2) | No Pause | tempo+10 | — | — | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/VOW (c3) | Building Momentum | tempo+6 | — | — | hit_accel | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/HUNGER (c4) | No Breather | tempo+6 stick+6 | — | — | no_breather | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| ONSLAUGHT | WILL/STILL (c5) | Rampage | tempo+12 | — | — | rampage | Ice. His overall liveliness drops. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | BODY/ROOT (a1) | Quick Out | dist+8 tempo+6 | — | — | — | Stubborn. He backs off less often than he should. | ПРОТИВОПОЛОЖНО (distance) |
| RAIDER | BODY/DRIVE (a2) | Pinpoint Entry | init+6 | accuracy +35% | accuracy +18 | — | Impatient. He opens the exchange first. | частично |
| RAIDER | BODY/GRIND (a3) | Far Bounce | dist+10 slip+6 | — | — | — | Takes punishment well. Stays in an exchange past the point where it pays. | не совпало (оси resilience,stick не двигаются) |
| RAIDER | BODY/BREAK (a4) | Clean Exchange | tempo+8 | — | — | clean_chain | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| RAIDER | BODY/ANVIL (a5) | Perfect Prick | dist+8 init+10 slip+6 | — | — | perfect_jab | Calm under pressure. He no longer panics in the corner. | не совпало (оси resilience,counter не двигаются) |
| RAIDER | MIND/WATCH (b1) | Fake-In | tempo+4 | feintChance +20% | — | — | Careful. Waits a little longer before he enters. | не совпало (оси counter,initiative не двигаются) |
| RAIDER | MIND/TIMING (b2) | Punish Reaction | tempo+4 | feintPayoff +50% | — | — | Deliberate. Throws fewer blind punches. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | MIND/FEINT (b3) | Broken Rhythm | tempo+8 | — | — | rhythm_break | Sly. Starts playing with the opponent and loses tempo. | ПРОТИВОПОЛОЖНО (tempo) |
| RAIDER | MIND/ADAPT (b4) | Feint to Interrupt | tempo+6 | — | — | feint_interrupt | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | MIND/COLD (b5) | Setup Combo | tempo+6 | feintPayoff +120% | — | feint_combo | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| RAIDER | WILL/HOLD (c1) | Read the Tell | init−6 | strikePower +4%, accuracy +30% | strikePower +4, accuracy +15 | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/SPITE (c2) | Strike the Open | init+4 | strikePower +7% | strikePower +7 | punish_exhausted | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/VOW (c3) | Charged Run | dist+6 | strikePower +10%, chargeGain +60% | strikePower +10, chargeGain/с +7.2 | — | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/HUNGER (c4) | Punish Aggression | ctr+10 | strikePower +14% | strikePower +14 | punish_aggression | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| RAIDER | WILL/STILL (c5) | Killing Run | dist+6 | strikePower +22%, chargePower +60% | strikePower +22, chargePowerMax +0.36 | lethal_entry | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |
| BULWARK | BODY/ROOT (a1) | Tough Hide | res+8 | toughness +4% | toughness +8 | — | Stubborn. He backs off less often than he should. | частично |
| BULWARK | BODY/DRIVE (a2) | Steady Guard | res+10 | toughness +7% | toughness +14 | — | Impatient. He opens the exchange first. | не совпало (оси weight,initiative не двигаются) |
| BULWARK | BODY/GRIND (a3) | Catch Breath | res+6 | toughness +10%, staminaRegen +60% | toughness +20 | — | Takes punishment well. Stays in an exchange past the point where it pays. | частично |
| BULWARK | BODY/BREAK (a4) | Dig In | dist−6 | toughness +14% | toughness +28 | dig_in | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| BULWARK | BODY/ANVIL (a5) | Unbreakable | res+8 | toughness +22%, blockMitigation +60% | toughness +44, blockMitigation +0.3 | fortress | Calm under pressure. He no longer panics in the corner. | частично |
| BULWARK | MIND/WATCH (b1) | Riposte | stick+6 ctr+8 | toughness +4%, blockCounter +50% | toughness +8 | — | Careful. Waits a little longer before he enters. | частично |
| BULWARK | MIND/TIMING (b2) | Catch & Punish | ctr+8 | toughness +7%, interruptBonus +50% | toughness +14 | — | Deliberate. Throws fewer blind punches. | частично |
| BULWARK | MIND/FEINT (b3) | Hard Meet | stick+6 ctr+10 | toughness +10% | toughness +20 | — | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| BULWARK | MIND/ADAPT (b4) | Retaliation | ctr+8 | toughness +14% | toughness +28 | retaliate_ramp | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | MIND/COLD (b5) | Sea Wall | stick+6 ctr+8 | toughness +22%, blockCounter +100%, interruptBonus +100% | toughness +44 | counter_trap | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| BULWARK | WILL/HOLD (c1) | Body Shove | dist−6 stick+8 | — | — | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/SPITE (c2) | Heavy Slam | wt+10 | blockPenetration +35% | blockPenetration +0.35, mobility -8 | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/VOW (c3) | No Way Around | stick+10 | — | — | — | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/HUNGER (c4) | Pin | dist−6 stick+8 | — | — | pin | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| BULWARK | WILL/STILL (c5) | Clinch | wt+8 stick+14 | blockPenetration +50% | blockPenetration +0.5, mobility -6 | clinch | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |
| AMBUSH | BODY/ROOT (a1) | Hard Counter | ctr+8 | — | — | — | Stubborn. He backs off less often than he should. | не совпало (оси resilience,stick,distance не двигаются) |
| AMBUSH | BODY/DRIVE (a2) | Slip Counter | slip+6 | dodgeCounter +50% | — | — | Impatient. He opens the exchange first. | не совпало (оси weight,initiative не двигаются) |
| AMBUSH | BODY/GRIND (a3) | Punish Aggression | ctr+8 | — | — | punish_aggression | Takes punishment well. Stays in an exchange past the point where it pays. | не совпало (оси resilience,stick не двигаются) |
| AMBUSH | BODY/BREAK (a4) | Punish Whiff | dist+6 | missCounter +50% | — | — | Greedy for the finish. Forgets his guard when he smells weakness. | не совпало (оси initiative,counter не двигаются) |
| AMBUSH | BODY/ANVIL (a5) | Perfect Trap | ctr+8 slip+4 | dodgeCounter +100%, missCounter +100% | — | perfect_trap | Calm under pressure. He no longer panics in the corner. | частично |
| AMBUSH | MIND/WATCH (b1) | Long Slip | dist+6 slip+10 | — | — | — | Careful. Waits a little longer before he enters. | не совпало (оси counter,initiative не двигаются) |
| AMBUSH | MIND/TIMING (b2) | Hard to Reach | dist+6 slip+8 | — | — | — | Deliberate. Throws fewer blind punches. | не совпало (оси tempo,counter не двигаются) |
| AMBUSH | MIND/FEINT (b3) | Run 'Em Ragged | dist+8 slip+6 | — | — | exhaust | Sly. Starts playing with the opponent and loses tempo. | не совпало (оси tempo не двигаются) |
| AMBUSH | MIND/ADAPT (b4) | Open Window | slip+8 | dodgeCounter +40% | — | — | Flexible. Changes the plan even where holding it would have paid. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | MIND/COLD (b5) | Phantom | dist+6 slip+12 | — | — | phantom | Cold. Never rattled, and never lit up when a spark is what he needs. | не совпало (оси resilience не двигаются) |
| AMBUSH | WILL/HOLD (c1) | Loaded Hit | dist+6 | strikePower +4%, chargePower +50% | strikePower +4, chargePowerMax +0.3 | — | Composed. Asks for fewer pauses. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/SPITE (c2) | Long Charge | dist+6 init−6 | strikePower +7%, chargeMax +60% | strikePower +7, chargeMax +60 | — | Angry. Dull in an even fight. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/VOW (c3) | Hit the Opening | init−6 | strikePower +10% | strikePower +10 | vulnerable_strike | Loyal to the order. Improvises worse. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/HUNGER (c4) | Pierce | dist+6 | strikePower +14%, chargePen +60% | strikePower +14, chargePenetrationMax +0.42 | — | Eager. Probes where he should not. | НЕТ ОСИ: текст про механику, которой у оси нет |
| AMBUSH | WILL/STILL (c5) | Execution | dist+6 | strikePower +22%, chargePower +80% | strikePower +22, chargePowerMax +0.48 | execute | Ice. His overall liveliness drops. | не совпало (оси tempo не двигаются) |

Сводка сверки текста с механикой (по моему чтению CLAIMS в скрипте): {"не совпало":26,"частично":9,"противоположно":5,"нет оси у механики":20}
