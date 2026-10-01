| ядро | грань | № | имя на экране | имя в данных | что делает по коду | вердикт |
|---|---|---|---|---|---|---|
| ONSLAUGHT | BODY | 1 | Heavy Hit | Heavy Hit | оси: weight+14 · рамп: strikePower+0.01 | совпадает |
| ONSLAUGHT | BODY | 2 | Guard Crush | Guard Crush | оси: weight+8 · рамп: strikePower+0.015 · рычаги: blockPenetration+0.12 · наклон: guard_crush→strike@foeGuard:0.12 | совпадает |
| ONSLAUGHT | BODY | 3 | Unshaken | Unshaken | оси: resilience+5 · рамп: strikePower+0.025 · рычаги: interruptResist+0.1 · наклон: unshaken→hold@foeSwing:0.27 | совпадает |
| ONSLAUGHT | BODY | 4 | Inside Work | Close Power | оси: distance-8 weight+6 · рамп: strikePower+0.035 · наклон: close_damage_ramp→strike@close:0.05 | ~ CHARACTER «Wants to be at arm's length» читается как «держит дистанцию», а кристалл тянет ВПЛОТНУЮ (distance −8) |
| ONSLAUGHT | BODY | 5 | Breakthrough | Breakthrough | оси: weight+10 · рамп: strikePower+0.04 · рычаги: blockPenetration+0.2 · наклон: overload_strike→strike@foeHpLow:0.45 | совпадает |
| ONSLAUGHT | MIND | 1 | Hard Entry | Hard Entry | оси: distance-6 initiative+6 · рычаги: accuracy+0.2 · наклон: hard_entry→strike@always:0.05 | совпадает |
| ONSLAUGHT | MIND | 2 | Run-Down | Run-Down | оси: stick+5 distance-4 · рычаги: strikePower+0.04 · наклон: chase_strike→strike@foeQuiet:0.14 | совпадает |
| ONSLAUGHT | MIND | 3 | Sticky | Cut Off | оси: stick+6 · рычаги: blockPenetration+0.25 · наклон: cut_off→hold@close:0.27 | ~ CHARACTER «stays and trades»: HOLD не начинает удар (attack: none) — остаётся рядом и держит стойку, но не обменивается ударами |
| ONSLAUGHT | MIND | 4 | Cling | Cling | оси: stick+6 distance-4 · рычаги: interruptResist+0.3 · наклон: cling→hold@close:0.45 | совпадает |
| ONSLAUGHT | MIND | 5 | Lockdown | Lockdown | оси: stick+8 distance-6 · рычаги: strikePower+0.04 blockPenetration+0.1 · наклон: lockdown→hold@close:0.27 | совпадает |
| ONSLAUGHT | WILL | 1 | Long Combo | Long Combo | оси: tempo+3 · рычаги: strikePower+0.01 · наклон: long_combo→strike@close:0.05 | совпадает |
| ONSLAUGHT | WILL | 2 | No Pause | No Pause | оси: tempo+3 · рычаги: strikePower+0.02 · наклон: no_pause→strike@foeOpen:0.09 | совпадает |
| ONSLAUGHT | WILL | 3 | Late Fire | Building Momentum | оси: tempo+2 · рычаги: strikePower+0.02 · наклон: hit_accel→strike@longFight:0.09 | совпадает |
| ONSLAUGHT | WILL | 4 | No Letup | No Breather | оси: tempo+3 stick+6 · рычаги: strikePower+0.02 · наклон: no_breather→strike@foeQuiet:0.14 | совпадает |
| ONSLAUGHT | WILL | 5 | Rampage | Rampage | оси: tempo+3 · рычаги: strikePower+0.07 · наклон: rampage→strike@always:0.3 | совпадает |
| RAIDER | BODY | 1 | Quick Out | Quick Out | оси: distance+8 tempo+6 · рычаги: strikePower+0.05 · наклон: quick_out→break@close:0.15 | совпадает |
| RAIDER | BODY | 2 | Pinpoint Entry | Pinpoint Entry | оси: initiative+9 · рычаги: accuracy+0.2 · наклон: pinpoint_entry→press@foeQuiet:0.3 | совпадает |
| RAIDER | BODY | 3 | Far Bounce | Far Bounce | оси: distance+10 slip+6 · рычаги: strikePower+0.04 | совпадает |
| RAIDER | BODY | 4 | Clean Exchange | Clean Exchange | оси: tempo+8 · рычаги: strikePower+0.07 · наклон: clean_chain→sting@always:0.1 | совпадает |
| RAIDER | BODY | 5 | Perfect Prick | Perfect Prick | оси: initiative+10 distance+8 slip+6 · рычаги: strikePower+0.08 · наклон: perfect_jab→sting@foeQuiet:0.45 | совпадает |
| RAIDER | MIND | 1 | Fake-In | Fake-In | оси: tempo+4 · рычаги: feintChance+0.05 strikePower+0.03 · наклон: fake_in→break@foeSwing:0.15 | совпадает |
| RAIDER | MIND | 2 | Punish Reaction | Punish Reaction | оси: tempo+4 · рычаги: feintPayoff+0.5 strikePower+0.06 · наклон: punish_reaction→press@foeGuard:0.18 | совпадает |
| RAIDER | MIND | 3 | Broken Rhythm | Broken Rhythm | оси: tempo+8 · рычаги: strikePower+0.05 · наклон: rhythm_break→break@close:0.15 | совпадает |
| RAIDER | MIND | 4 | Sting the Swing | Feint to Interrupt | оси: tempo+6 · рычаги: strikePower+0.06 · наклон: feint_interrupt→sting@foeSwing:0.18 | совпадает |
| RAIDER | MIND | 5 | Setup Combo | Setup Combo | оси: tempo+6 · рычаги: feintPayoff+1.2 strikePower+0.04 blockPenetration+0.2 · наклон: feint_combo→strike@close:0.45 | совпадает |
| RAIDER | WILL | 1 | Read the Tell | Read the Tell | оси: initiative-6 · рамп: strikePower+0.02 · рычаги: accuracy+0.16 · наклон: read_tell→catch@foeSwing:0.31 | совпадает |
| RAIDER | WILL | 2 | Seize the Open | Strike the Open | оси: initiative+4 · рамп: strikePower+0.035 · наклон: punish_exhausted→press@foeOpen:0.18 | совпадает |
| RAIDER | WILL | 3 | Charged Run | Charged Run | оси: distance+6 · рамп: strikePower+0.045 · рычаги: chargeGain+0.3 · наклон: charged_run→sting@always:0.1 | совпадает |
| RAIDER | WILL | 4 | Punish Aggression | Punish Aggression | оси: counter+10 · рамп: strikePower+0.05 · наклон: hunt_reply→strike@foeSwing:0.45 | совпадает |
| RAIDER | WILL | 5 | Killing Run | Killing Run | оси: distance+6 · рамп: strikePower+0.06 · рычаги: chargePower+0.3 · наклон: lethal_entry→press@charged:0.45 | ~ EFFECT «lands at full power»: даёт +30% к силе заряженного удара, а не «полную» силу |
| BULWARK | BODY | 1 | Tough Hide | Tough Hide | оси: resilience+3 · рамп: toughness+0.03 · рычаги: blockMitigation+0.03 · наклон: tough_hide→hold@close:0.25 | ~ CHARACTER «Stands and trades in close»: та же причина, что у ONSLAUGHT MIND 3 — HOLD не начинает удар |
| BULWARK | BODY | 2 | Steady Guard | Steady Guard | оси: resilience+2 · рамп: toughness+0.05 · рычаги: interruptResist+0.15 blockMitigation+0.05 · наклон: steady_guard→hold@foeSwing:0.31 | совпадает |
| BULWARK | BODY | 3 | Catch Breath | Catch Breath | оси: resilience+3 · рамп: toughness+0.07 · рычаги: staminaRegen+0.7 blockMitigation+0.05 · наклон: catch_breath→hold@foeQuiet:0.27 | совпадает |
| BULWARK | BODY | 4 | Dig In | Dig In | оси: distance-6 · рамп: toughness+0.09 · рычаги: blockMitigation+0.12 · наклон: dig_in→hold@close:0.25 | совпадает |
| BULWARK | BODY | 5 | Unbreakable | Unbreakable | оси: resilience+2 · рамп: toughness+0.06 · рычаги: blockMitigation+0.15 · наклон: fortress→hold@always:0.15 | ~ EFFECT «stops most of the damage»: стойка режет базово 50%, кристалл добавляет +15% к её силе → 57,5%. «Больше половины» верно, «большую часть» читается сильнее |
| BULWARK | MIND | 1 | Riposte | Riposte | оси: counter+8 stick+6 · рамп: toughness+0.04 · рычаги: blockCounter+0.5 · наклон: riposte→press@foeSwing:0.19 | совпадает |
| BULWARK | MIND | 2 | Catch & Punish | Catch & Punish | оси: counter+8 · рамп: toughness+0.07 · рычаги: interruptBonus+0.4 · наклон: catch_punish→press@foeOpen:0.45 | совпадает |
| BULWARK | MIND | 3 | Hard Meet | Hard Meet | оси: counter+10 stick+6 · рамп: toughness+0.1 · рычаги: interruptBonus+0.9 · наклон: hard_meet→press@close:0.17 | совпадает |
| BULWARK | MIND | 4 | Retaliation | Retaliation | оси: counter+7 · рамп: toughness+0.14 · рычаги: blockCounter+0.3 · наклон: retaliate_ramp→strike@foeSwing:0.45 | совпадает |
| BULWARK | MIND | 5 | Sea Wall | Sea Wall | оси: counter+8 stick+6 · рамп: toughness+0.14 · рычаги: blockCounter+0.6 interruptBonus+0.6 · наклон: counter_trap→catch@longFight:0.45 | ✗ EFFECT «strongest answers, after a block and after a caught swing»: ответ после блока (blockCounter 0.6) — действительно сильнейший в грани (Riposte 0.5, Retaliation 0.3); а вот ответ на пойманный замах (interruptBonus) у Sea Wall 0.6, у Hard Meet (№3) — 0.9, у Catch & Punish — 0.4. Сильнейший в грани — Hard Meet |
| BULWARK | WILL | 1 | Body Shove | Body Shove | оси: stick+6 distance-6 · рычаги: blockPenetration+0.1 · наклон: body_shove→press@close:0.17 | совпадает |
| BULWARK | WILL | 2 | Heavy Slam | Heavy Slam | оси: weight+10 · рычаги: blockPenetration+0.3 · наклон: heavy_slam→strike@close:0.26 | совпадает |
| BULWARK | WILL | 3 | No Way Around | No Way Around | оси: stick+7 · наклон: no_way_around→hold@foeGuard:0.45 | совпадает |
| BULWARK | WILL | 4 | Pin | Pin | оси: stick+6 distance-6 · наклон: pin→hold@close:0.25 | совпадает |
| BULWARK | WILL | 5 | Clinch | Clinch | оси: stick+11 weight+8 · рычаги: blockPenetration+0.4 · наклон: clinch→press@close:0.17 | совпадает |
| AMBUSH | BODY | 1 | Hard Counter | Hard Counter | оси: counter+6 · наклон: hard_counter→strike@foeSwing:0.45 | совпадает |
| AMBUSH | BODY | 2 | Slip Counter | Slip Counter | оси: slip+4 · рычаги: dodgeCounter+0.03 · наклон: slip_counter→strike@foeQuiet:0.45 | совпадает |
| AMBUSH | BODY | 3 | Answer the Swing | Punish Aggression | оси: counter+5 · наклон: punish_aggression→strike@foeSwing:0.45 | совпадает |
| AMBUSH | BODY | 4 | Punish Whiff | Punish Whiff | оси: counter+5 · рычаги: missCounter+0.4 · наклон: punish_whiff→strike@foeOpen:0.6 | совпадает |
| AMBUSH | BODY | 5 | Perfect Trap | Perfect Trap | оси: counter+2 slip+2 · рычаги: dodgeCounter+0.05 missCounter+0.05 · наклон: perfect_trap→strike@foeQuiet:0.45 | ✗ EFFECT «strongest counters, after a slip and after a miss»: после уворота (dodgeCounter 0.05) — сильнейший в грани (Slip Counter 0.03); а после промаха (missCounter) у Perfect Trap 0.05, у Punish Whiff (№4) — 0.4. Сильнейший в грани — Punish Whiff |
| AMBUSH | MIND | 1 | Long Slip | Long Slip | оси: slip+8 distance+5 · наклон: long_slip→sting@foeSwing:0.45 | совпадает |
| AMBUSH | MIND | 2 | Hard to Reach | Hard to Reach | оси: slip+6 distance+5 · наклон: hard_to_reach→sting@longFight:0.4 | совпадает |
| AMBUSH | MIND | 3 | Long Game | Run 'Em Ragged | оси: distance+4 slip+4 · наклон: exhaust→sting@longFight:0.4 | совпадает |
| AMBUSH | MIND | 4 | Open Window | Open Window | оси: slip+6 · рычаги: dodgeCounter+0.15 · наклон: open_window→strike@foeOpen:0.45 | совпадает |
| AMBUSH | MIND | 5 | Phantom | Phantom | оси: slip+9 distance+5 · наклон: phantom→sting@hpDropped:0.45 | совпадает |
| AMBUSH | WILL | 1 | Loaded Hit | Loaded Hit | оси: distance+6 · рамп: strikePower+0.04 · рычаги: chargePower+0.05 · наклон: loaded_hit→strike@charged:0.45 | совпадает |
| AMBUSH | WILL | 2 | Long Charge | Long Charge | оси: distance+4 · рамп: strikePower+0.09 · рычаги: chargeMax+0.6 strikePower+0.03 · наклон: long_charge→sting@charged:0.3 | совпадает |
| AMBUSH | WILL | 3 | Hit the Opening | Hit the Opening | оси: initiative-6 · рамп: strikePower+0.1 · наклон: vulnerable_strike→strike@foeOpen:0.45 | совпадает |
| AMBUSH | WILL | 4 | Pierce | Pierce | оси: distance+6 · рамп: strikePower+0.11 · рычаги: chargePen+0.8 · наклон: pierce→strike@foeGuard:0.45 | совпадает |
| AMBUSH | WILL | 5 | Execution | Execution | оси: distance+5 · рамп: strikePower+0.07 · рычаги: chargePower+0.07 · наклон: execute→strike@close:0.35 | совпадает |
