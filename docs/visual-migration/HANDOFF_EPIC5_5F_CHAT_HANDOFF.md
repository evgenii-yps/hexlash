# HANDOFF — Sub-Epic 5F (или 5G) — Chat Handoff

**From:** 5E ✅ CLOSED (commit `54906d6` FINAL_REPORT, Step 11 этот handoff `<step 11>`)
**To:** Next sub-epic — 5F (i18n) or 5G (polish) per VISUAL_MIGRATION plan

---

## §1 Где мы сейчас

### Route table `/v2/*` final state

| Route | Epic / Sub-Epic | Статус |
|---|---|---|
| `/v2` | 2 + 4 | ✅ hub |
| `/v2/fd/warden` / `/v2/fd/predator` / `/v2/fd/:uuid` | 3A + 4 | ✅ FD |
| `/v2/fight` | 3A + 3Bb | ✅ via Matchmaking only |
| `/v2/training` | 3Ba | ✅ (5A migrated) |
| `/v2/matchmaking` | 3Bb | ✅ (5A migrated) |
| `/v2/create` | 3Bc + 4 | ✅ backend persist |
| `/v2/profile` | 5B | ✅ |
| `/v2/ratings` | 5C | ✅ |
| `/v2/clan` | 5D | ✅ |
| `/v2/shop` | **5E** | ✅ |

**Все 6 sub-epic views Epic 5 — мигрированы.** Visual Migration Phase 1 (sub-epic views A→E) — complete.

### Branch state

- Current branch: `claude/setup-5e-shop-mode-a-khIAi` — 5E COMPLETE.
- 5D ветка нетронутой `claude/clan-view-completion-C97qk@5f246eb` — historical reference.
- Merge target `visual-v2` — после 5G polish, в самом конце Epic 5.

### Что unmigrated (deferred к Phase 2 / 5F / 5G / backend purchase sub-epic)

См. EPIC5_5E_FINAL_REPORT.md §7 (13 items). Distributed:
- **6 items** — backend purchase sub-epic (real `POST /v1/shop/buy`, real catalog, real balance, wallet integration, boost timers, etc.)
- **5 items** — 5G polish (skin preview render-time, MODAL_CONTENT carry-over, floor texture, dust extension, sentinel pattern doc)
- **1 item** — 5F i18n
- **1 item** — separate docs commit

---

## §2 Что прочитать в новом чате

Пользователь должен загрузить в новый чат:
1. **CLAUDE.md** — full source of truth. Особенно §Sub-Epic 5A/5B/5C/5D/5E sections + lessons #1-24.
2. **EPIC5_5E_FINAL_REPORT.md** (commit `54906d6`) — precedent для FINAL_REPORT structure.
3. **HANDOFF_EPIC5_5E_CHAT_HANDOFF.md** (5D step 15, commit `5f246eb`) — precedent для handoff structure.
4. **VISUAL_MIGRATION_PLAN.md** — определяет 5F/5G scope.
5. **hexlash_v24.html** — prototype (если 5G/5F touch any visual area).

Если пользователь не загрузил эти файлы — попроси загрузить **до** ответа на любой вопрос про 5F/5G. Не работай по памяти.

## §3 Уроки 5E — actionable для 5F+

### Validated working patterns
- **Lessons #19-21 (exposure compensation FIRST)** — 5E run validated. 0 hot-fix attempts на ложной траектории. При port'е prototype scenes в 5G polish (если visual restorations) — same pre-tune approach mandatory.
- **Lesson #22 (HUD scoped selector match)** — 5E pre-commit grep workflow stable.
- **Lesson #11 (verify shape с реальным data)** — 5E run had 2 false-positive grep recoveries (v-html в Step 4, @@PART в Step 10). Pattern: при unexpected grep hit — first verify **где** именно matched, не just count.

### New 5E patterns
- **Sentinel-marker split-write** для multi-chunk SFC/CSS/Markdown port. Initial Write + N Edit ops с unique markers (`@@PART2@@`, `<!-- @@PART2@@ -->` для Markdown). Pre-commit grep includes orphan check. Documented в EPIC5_5E_FINAL_REPORT.md §3.10.
- **Static regression trace** as substitute для manual UI testing (Step 1 closing). Map all `userData.id` → click watcher branches → expected destinations. Faster than UI test, covers all paths exhaustively.

### Anti-patterns avoided
- **0 lighting tunes blindly.** При visual sign-off Step 2 — не trigger'нул "увеличить ambient" instinct. Diagnostic-first approach (lesson #18).
- **0 fabricated artifacts.** При pre-flight discovery state mismatch (Step 0 — branch не там) — STOP, не fabricate, ask user. Reset path corrected.

---

## §4 Карта Sub-Epic 5F / 5G (TBD pending VISUAL_MIGRATION_PLAN)

### Option A — 5F i18n pass

**Scope:** translate inline EN strings к i18n key system across all v2 views.

Inventory (per 5E §5.12 + 5B/5C/5D similar):
- **5E HudShop:** 17 strings (Hexlash/LOCKER, All/Skins/Gloves/Boosts/Titles/Banners, Select an item to see details, Effect, Price, Owned, Purchase, Insufficient Funds, ← Items, OWNED, On-Chain, Empty category)
- **5D HudClan, 5C HudRatings, 5B HudProfile** — similar inventories carry-over из их FINAL_REPORTs.
- **Catalog data:** SHOP_ITEMS names + descriptions + effects (~54 strings × 18 items = ~54 strings minimum).

**Risk:** big sweep, low risk per file. Mostly mechanical replace `"text"` → `t('shop.text')` calls. Need i18n keymap design first.

### Option B — 5G polish

**Scope:** all carry-over polish items per cumulative FINAL_REPORTs.

5G polish list (cumulative across 5A-5E):
- Visual mood ClanScene (5D §3.6 "темновато но норм")
- HudClan splitting (5D #11 — 430 lines > soft-300)
- CreateClan + ClanEdit full v2-aware flow refactor (5D #5)
- Real ClanActivityFeed integration (5D #3)
- ProfileWallet skin tab integration (carry-over до 5E если decided B)
- 5E floor concrete texture restore (5E #7)
- 5E dust yMax extension (5E #8)
- 5E MODAL_CONTENT.warden + .predator carry-over (5E #9 / 5C/5D #14)
- 5E sentinel split-write doc (5E #11)

**Risk:** mixed bag. Each item small, but cumulative scope large. Possibly split на 5G + 5H or do incrementally.

### Recommendation

VISUAL_MIGRATION_PLAN sequence pick. Если plan says 5F next — i18n. Если 5G — polish с priority pick. Don't decide blindly без plan reference.

---

## §5 Открытые вопросы для opening новой sub-epic

(filled depending on next sub-epic — 5F или 5G; пользователь выбирает в opening message)

### Если 5F
**Q1 — i18n library choice.** Vue I18n / FormatJS / custom?
**Q2 — Key namespace structure.** Flat (`shop.title`) vs nested (`v2.shop.title`)?
**Q3 — Catalog data source.** Inline strings в `shopMock.js` vs split в i18n locale files?

### Если 5G
**Q1 — Priority order.** Какие 3-5 items из cumulative polish list делать первыми?
**Q2 — Floor texture restore strategy.** 5A helper signature extension vs custom floor in ShopScene per-view?
**Q3 — HudClan split scope.** Single splitting commit vs multi-step?

## §6 Что делать новому чату в первом сообщении

Standard pre-flight sequence:

```bash
# 1. Branch slug verification
git branch --show-current
# Expected: новый claude/* slug. Не hard-code current 5E slug.

# 2. 5E finals presence
git log --oneline -10
# Expected: <step 11 = this commit> + 54906d6 (Step 10 FINAL_REPORT) + e36dbb3 (Step 9 CLAUDE.md) reachable.

# 3. node_modules
ls node_modules/ | head -3
# If empty → npm install.

# 4. Files loaded check (chat-side, не git)
# CLAUDE.md / EPIC5_5E_FINAL_REPORT.md / HANDOFF_EPIC5_5E_CHAT_HANDOFF.md / VISUAL_MIGRATION_PLAN.md / hexlash_v24.html

# 5. Step 0 questionnaire — Q1-Q5 per VISUAL_MIGRATION plan для 5F/5G scope.
```

---

## §7 Стартовое сообщение для нового чата

```
Start 5F (or 5G — TBD per VISUAL_MIGRATION_PLAN). Mode A strict.

Mandatory pre-flight перед Step 1:

1. git branch --show-current — note slug.
2. git log --oneline -10 — verify 5E finals reachable.
3. ls node_modules → если empty → npm install.
4. Read EPIC5_5E_FINAL_REPORT.md полностью (lessons + расхождения для 5F/5G context).
5. Read CLAUDE.md Sub-Epics 5A-5E + lessons #1-24.
6. Read VISUAL_MIGRATION_PLAN.md для 5F/5G scope decision.
7. Step 0 pre-flight report.
8. Gate на Q1-Q3 (specifically для chosen sub-epic — see HANDOFF §5).

User answer → proceed Step 1.

Critical lessons applied:
- #19-21 exposure compensation: 5E validated. При visual restorations в 5G — pre-tune mandatory.
- #11 verify shape с реальным data: 5E run had 2 false-positive recoveries.
- #22 HUD scoped selector match: 5E pre-commit grep workflow stable.

Branch context:
- Predecessor 5E — claude/setup-5e-shop-mode-a-khIAi.
- Current — новый claude/* slug.
- Merge target — visual-v2 (после 5G polish, в конце Epic 5).
```

---

## §8 Чеклист самого handoff'а

- [✅] Файлы 5E final state перечислены.
- [✅] Branch state explained.
- [✅] Уроки 5E distilled (validated + new + anti-patterns avoided).
- [✅] Map для 5F vs 5G option (decision pending VISUAL_MIGRATION_PLAN).
- [✅] Open questions listed (per chosen option).
- [✅] Pre-flight sequence для нового чата documented.
- [✅] Стартовое сообщение copy-paste ready.
- [✅] Self-reference `<step 11>` для Step 11 hash placeholder.

**End of HANDOFF_EPIC5_5F_CHAT_HANDOFF.md**

**Sub-Epic 5E — TRULY CLOSED.** ✅
