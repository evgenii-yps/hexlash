«Кристалл» = один из 5 шагов внутри грани (в коде `face` в ветке a|b|c). 15 кристаллов × 4 ядра = 60 ячеек.
Δ осей — фактическая (после зажима 0..100) при зажжённом ЭТОМ кристалле одном, относительно стартового профиля ядра.
Δ stats — замер у живого бойца (`buildFighter().stats`): strikePower / toughness / mobility / accuracy / blockMitigation / blockPenetration / chargeMax…
Рычаги, которых нет в `stats` (feintChance, feintPayoff, staminaRegen, blockCounter, interruptBonus, dodgeCounter, missCounter, interruptResist), видны только в колонке «бонусы» — как записано в данных.

| ядро | грань/кристалл | имя в данных | Δ осей (факт, от старта ядра) | бонусы (% к рычагу) | Δ stats у бойца (замер) | теги (мертвы) | CHARACTER, что видит игрок | текст vs механика |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ONSLAUGHT | BODY/HEAVY HIT (a1) | Heavy Hit | wt+14 | strikePower +1% | strikePower +1, mobility -11 | — | Heavy and unhurried. Trades speed for mass. | частично (не двигаются: tempo) |
| ONSLAUGHT | BODY/GUARD CRUSH (a2) | Guard Crush | wt+8 | strikePower +2%, blockPenetration +12% | strikePower +1, blockPenetration +0.12, mobility -6 | guard_crush | Sees a closed guard and swings into it anyway. | совпало |
| ONSLAUGHT | BODY/UNSHAKEN (a3) | Unshaken | res+5 | strikePower +3%, interruptResist +10% | strikePower +2 | unshaken | Stands his ground when the opponent attacks. | совпало |
| ONSLAUGHT | BODY/INSIDE WORK (a4) | Close Power | dist−8 wt+6 | strikePower +4% | strikePower +3, mobility -5 | close_damage_ramp | Wants to be right up close. Swings the moment he is in reach. | совпало |
| ONSLAUGHT | BODY/BREAKTHROUGH (a5) | Breakthrough | wt+10 | strikePower +4%, blockPenetration +20% | strikePower +4, blockPenetration +0.2, mobility -8 | overload_strike | Smells a hurt opponent and goes for the finish. | частично (не двигаются: initiative) |
| ONSLAUGHT | MIND/HARD ENTRY (b1) | Hard Entry | dist−6 init+6 | accuracy +20% | accuracy +10 | hard_entry | Goes in first and swings on arrival. | совпало |
| ONSLAUGHT | MIND/RUN-DOWN (b2) | Run-Down | dist−4 stick+5 | strikePower +4% | strikePower +4 | chase_strike | When the opponent goes quiet, he attacks. | частично (не двигаются: initiative) |
| ONSLAUGHT | MIND/STICKY (b3) | Cut Off | stick+6 | blockPenetration +25% | blockPenetration +0.25 | cut_off | Once he is close, he stays there and holds his ground. | совпало |
| ONSLAUGHT | MIND/CLING (b4) | Cling | dist−4 stick+6 | interruptResist +30% | — | cling | Refuses to step back once inside. | частично (не двигаются: resilience) |
| ONSLAUGHT | MIND/LOCKDOWN (b5) | Lockdown | dist−6 stick+8 | strikePower +4%, blockPenetration +10% | strikePower +4, blockPenetration +0.1 | lockdown | Pins himself to the opponent. Almost never lets go. | совпало |
| ONSLAUGHT | WILL/LONG COMBO (c1) | Long Combo | tempo+3 | strikePower +1% | strikePower +1 | long_combo | In reach, he throws instead of waiting. | частично (не двигаются: initiative) |
| ONSLAUGHT | WILL/NO PAUSE (c2) | No Pause | tempo+3 | strikePower +2% | strikePower +2 | no_pause | Swings the moment the opponent is caught off balance. | частично (не двигаются: initiative) |
| ONSLAUGHT | WILL/LATE FIRE (c3) | Building Momentum | tempo+2 | strikePower +2% | strikePower +2 | hit_accel | The longer the fight, the more he swings. | частично (не двигаются: initiative) |
| ONSLAUGHT | WILL/NO LETUP (c4) | No Breather | tempo+3 stick+6 | strikePower +2% | strikePower +2 | no_breather | If the opponent stops attacking, he does not stop. | частично (не двигаются: initiative) |
| ONSLAUGHT | WILL/RAMPAGE (c5) | Rampage | tempo+3 | strikePower +7% | strikePower +7 | rampage | Swings at every chance he gets. | частично (не двигаются: initiative) |
| RAIDER | BODY/QUICK OUT (a1) | Quick Out | dist+8 tempo+6 | strikePower +5% | strikePower +5 | quick_out | Lands and gets out. Breaks off when the opponent gets close. | совпало |
| RAIDER | BODY/PINPOINT ENTRY (a2) | Pinpoint Entry | init+9 | accuracy +20% | accuracy +10 | pinpoint_entry | Takes the initiative when the opponent goes quiet. | совпало |
| RAIDER | BODY/FAR BOUNCE (a3) | Far Bounce | dist+10 slip+6 | strikePower +4% | strikePower +4 | — | Lives at long range. | совпало |
| RAIDER | BODY/CLEAN EXCHANGE (a4) | Clean Exchange | tempo+8 | strikePower +7% | strikePower +7 | clean_chain | Prefers quick pokes to a long exchange. | совпало |
| RAIDER | BODY/PERFECT PRICK (a5) | Perfect Prick | dist+8 init+10 slip+6 | strikePower +8% | strikePower +8 | perfect_jab | When the opponent goes quiet, he darts in. | совпало |
| RAIDER | MIND/FAKE-IN (b1) | Fake-In | tempo+4 | feintChance +5%, strikePower +3% | strikePower +3 | fake_in | When the opponent swings, he steps off instead of meeting it. | не совпало (slip не двигаются) |
| RAIDER | MIND/PUNISH REACTION (b2) | Punish Reaction | tempo+4 | feintPayoff +50%, strikePower +6% | strikePower +6 | punish_reaction | Presses in when the opponent covers up. | частично (не двигаются: initiative) |
| RAIDER | MIND/BROKEN RHYTHM (b3) | Broken Rhythm | tempo+8 | strikePower +5% | strikePower +5 | rhythm_break | Breaks off in close and comes back on his own timing. | совпало |
| RAIDER | MIND/STING THE SWING (b4) | Feint to Interrupt | tempo+6 | strikePower +6% | strikePower +6 | feint_interrupt | Answers the opponent's swing with a quick poke. | частично (не двигаются: counter) |
| RAIDER | MIND/SETUP COMBO (b5) | Setup Combo | tempo+6 | feintPayoff +120%, strikePower +4%, blockPenetration +20% | strikePower +4, blockPenetration +0.2 | feint_combo | Up close, he commits to the full combination. | частично (не двигаются: distance) |
| RAIDER | WILL/READ THE TELL (c1) | Read the Tell | init−6 | strikePower +2%, accuracy +16% | strikePower +2, accuracy +8 | read_tell | Waits for the opponent to swing, then answers. | частично (не двигаются: counter) |
| RAIDER | WILL/SEIZE THE OPEN (c2) | Strike the Open | init+4 | strikePower +4% | strikePower +3 | punish_exhausted | Goes in when the opponent is off balance. | совпало |
| RAIDER | WILL/CHARGED RUN (c3) | Charged Run | dist+6 | strikePower +5%, chargeGain +30% | strikePower +5, chargeGain/с +3.6 | charged_run | Keeps his distance and pokes while he loads. | совпало |
| RAIDER | WILL/PUNISH AGGRESSION (c4) | Punish Aggression | ctr+10 | strikePower +5% | strikePower +5 | hunt_reply | Answers aggression with a counter. | совпало |
| RAIDER | WILL/KILLING RUN (c5) | Killing Run | dist+6 | strikePower +6%, chargePower +30% | strikePower +6, chargePowerMax +0.18 | lethal_entry | Once loaded, he goes in to spend it. | частично (не двигаются: initiative) |
| BULWARK | BODY/TOUGH HIDE (a1) | Tough Hide | res+3 | toughness +3%, blockMitigation +3% | toughness +6, blockMitigation +0.015 | tough_hide | Holds his ground in close. | частично (не двигаются: stick) |
| BULWARK | BODY/STEADY GUARD (a2) | Steady Guard | res+2 | toughness +5%, interruptResist +15%, blockMitigation +5% | toughness +10, blockMitigation +0.025 | steady_guard | Holds his ground against an attack. | частично (не двигаются: stick) |
| BULWARK | BODY/CATCH BREATH (a3) | Catch Breath | res+3 | toughness +7%, staminaRegen +70%, blockMitigation +5% | toughness +14, blockMitigation +0.025 | catch_breath | Uses the quiet moments to steady himself. | совпало |
| BULWARK | BODY/DIG IN (a4) | Dig In | dist−6 | toughness +9%, blockMitigation +12% | toughness +18, blockMitigation +0.06 | dig_in | Close in, he digs in and does not move. | частично (не двигаются: stick) |
| BULWARK | BODY/UNBREAKABLE (a5) | Unbreakable | res+2 | toughness +6%, blockMitigation +15% | toughness +12, blockMitigation +0.075 | fortress | Always ready to stand and absorb. | совпало |
| BULWARK | MIND/RIPOSTE (b1) | Riposte | stick+6 ctr+8 | toughness +4%, blockCounter +50% | toughness +8 | riposte | Meets an attack by stepping into it. | совпало |
| BULWARK | MIND/CATCH & PUNISH (b2) | Catch & Punish | ctr+8 | toughness +7%, interruptBonus +40% | toughness +14 | catch_punish | Pushes in when the opponent is off balance. | частично (не двигаются: initiative) |
| BULWARK | MIND/HARD MEET (b3) | Hard Meet | stick+6 ctr+10 | toughness +10%, interruptBonus +90% | toughness +20 | hard_meet | Steps forward into anyone who comes close. | частично (не двигаются: distance) |
| BULWARK | MIND/RETALIATION (b4) | Retaliation | ctr+7 | toughness +14%, blockCounter +30% | toughness +28 | retaliate_ramp | Swings back when the opponent swings. | совпало |
| BULWARK | MIND/SEA WALL (b5) | Sea Wall | stick+6 ctr+8 | toughness +14%, blockCounter +60%, interruptBonus +60% | toughness +28 | counter_trap | In a long fight he waits for the swing and punishes it. | совпало |
| BULWARK | WILL/BODY SHOVE (c1) | Body Shove | dist−6 stick+6 | blockPenetration +10% | blockPenetration +0.1 | body_shove | Leans on the opponent in close. | совпало |
| BULWARK | WILL/HEAVY SLAM (c2) | Heavy Slam | wt+10 | blockPenetration +30% | blockPenetration +0.3, mobility -8 | heavy_slam | In reach, he throws the heavy one. | совпало |
| BULWARK | WILL/NO WAY AROUND (c3) | No Way Around | stick+7 | — | — | no_way_around | When the opponent covers up, he holds his place and keeps him in front. | совпало |
| BULWARK | WILL/PIN (c4) | Pin | dist−6 stick+6 | — | — | pin | Once close, he holds the opponent in place. | совпало |
| BULWARK | WILL/CLINCH (c5) | Clinch | wt+8 stick+11 | blockPenetration +40% | blockPenetration +0.4, mobility -6 | clinch | Grinds forward in close and never lets go. | частично (не двигаются: distance) |
| AMBUSH | BODY/HARD COUNTER (a1) | Hard Counter | ctr+6 | — | — | hard_counter | Answers a swing with a swing. | совпало |
| AMBUSH | BODY/SLIP COUNTER (a2) | Slip Counter | slip+4 | dodgeCounter +3% | — | slip_counter | Strikes when the opponent goes quiet. | частично (не двигаются: counter,initiative) |
| AMBUSH | BODY/ANSWER THE SWING (a3) | Punish Aggression | ctr+5 | — | — | punish_aggression | The opponent's attack is his cue to strike. | совпало |
| AMBUSH | BODY/PUNISH WHIFF (a4) | Punish Whiff | ctr+5 | missCounter +40% | — | punish_whiff | Strikes the moment the opponent is off balance. | совпало |
| AMBUSH | BODY/PERFECT TRAP (a5) | Perfect Trap | ctr+2 slip+2 | dodgeCounter +5%, missCounter +5% | — | perfect_trap | Waits in silence, then strikes. | совпало |
| AMBUSH | MIND/LONG SLIP (b1) | Long Slip | dist+5 slip+8 | — | — | long_slip | Meets a swing with a poke from range. | совпало |
| AMBUSH | MIND/HARD TO REACH (b2) | Hard to Reach | dist+5 slip+6 | — | — | hard_to_reach | In a long fight he works from range. | совпало |
| AMBUSH | MIND/LONG GAME (b3) | Run 'Em Ragged | dist+4 slip+4 | — | — | exhaust | Settles into pokes from range as the fight drags on. | совпало |
| AMBUSH | MIND/OPEN WINDOW (b4) | Open Window | slip+6 | dodgeCounter +15% | — | open_window | Strikes when the opponent is off balance. | частично (не двигаются: counter) |
| AMBUSH | MIND/PHANTOM (b5) | Phantom | dist+5 slip+9 | — | — | phantom | When he takes damage, he goes elusive and pokes. | совпало |
| AMBUSH | WILL/LOADED HIT (c1) | Loaded Hit | dist+6 | strikePower +4%, chargePower +5% | strikePower +4, chargePowerMax +0.03 | loaded_hit | Once loaded, he lets it go. | совпало |
| AMBUSH | WILL/LONG CHARGE (c2) | Long Charge | dist+4 | strikePower +9%, chargeMax +60%, strikePower +3% | strikePower +12, chargeMax +60 | long_charge | Keeps loading instead of spending. | совпало |
| AMBUSH | WILL/HIT THE OPENING (c3) | Hit the Opening | init−6 | strikePower +10% | strikePower +10 | vulnerable_strike | Waits for the opening, then strikes. | совпало |
| AMBUSH | WILL/PIERCE (c4) | Pierce | dist+6 | strikePower +11%, chargePen +80% | strikePower +11, chargePenetrationMax +0.56 | pierce | Swings into a raised guard. | совпало |
| AMBUSH | WILL/EXECUTION (c5) | Execution | dist+5 | strikePower +7%, chargePower +7% | strikePower +7, chargePowerMax +0.042 | execute | Close in, he goes for the finish. | совпало |

Сводка сверки текста с механикой (по моему чтению CLAIMS в скрипте): {"частично":22,"совпало":37,"не совпало":1}
