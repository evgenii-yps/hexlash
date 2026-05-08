# Handoff — Post Stream 1, Next Direction

**State as of handoff:** Stream 1 Cleanup Batch closed (✅), streak 1 → 2.
**Branch:** `claude/cleanup-stream-1-phase0` (continue stack от Stream 1) ИЛИ fresh from main per next sub-epic preference.

**Project state:**
- Эпик 8 (Marketing Site) closed
- Stream 1 cleanup closed
- Production: hexlash.com live с marketing site (`/`) + game (`/play/*`)
- Auth: provider-selector via Эпик 9 auth-redesign (PR #369 merged)
- Bundle: main brotli 475.75 kB (post-Stream 1)

---

## Carry-overs alive (post-Stream 1)

### Stream 3 — BE features

- Password reset full backend (email — SendGrid/Postmark/SMTP decision pending). Currently `POST /v1/user/reset` returns 501.
- Subscribe email collection backend (Mailchimp/SendGrid/in-house — currently FE-only "Coming soon" toast)
- Help anonymous-access UX caveat — `/help` cascades через `/play/help` which may auth-gate anonymous users
- BE `email` field acceptance в `POST /v1/auth/register` — currently FE collects email in signup UI but не отправляет в payload (TODO(auth-email) per auth-redesign Эпик 9)

### Stream 4 — Visual Polish

- Auth refinement (background blur fighters image, layout proportions, possible red CTA variant per 1b G2 feedback)
- Proper og:image banner (1200×630 vs current 1024² square placeholder)
- Hero hex pattern tempo / opacity tuning если user feedback during 8c live review
- Gameplay section 16:9 placeholder → real video / screenshot
- Roadmap content from generic Q1-Q4 placeholders → real product roadmap
- Partners section COMING SOON → real partner logos when partnerships sign
- Auth provider button icons — currently minimal inline SVG (Hexlash convention); brand-correct logos (Google G, X, Discord) если product decision

### Stream 5 — Token launch

- $HEX Token section live ticker + DEX widget + tokenomics page (currently placeholder + Base chain reference only)

### Stream 6 — Web3

- Connect Wallet auth — actual SIWE backend integration. Currently FE button shows "Coming soon" toast (auth-redesign + Profile contexts both)

### Эпик 6 deferred carry-overs (#38-#46)

См. Sub-epic 8 closure entry в CLAUDE.md.

### Stream 1 surfaced (NEW)

- `updateJwtToken` pre-existing dead import at `src/core/state/modules/masterState.js:10` (unused, predates Stream 1, ~1 line cleanup в next cleanup batch — Lesson #18 scope discipline left in place)

### Auth-redesign (Эпик 9) tech debt

- 5 proposed semantic tokens в `hexlash-ui.css` (`--hex-bg-elev`, `--hex-bg-elev-hover`, `--hex-focus-ring`, `--hex-danger-soft`, `--hex-text-on-primary`) — eliminates 3× `#fff` hardcode + inline rgba in 7 auth files
- Referral storage persistence edge case (manual entry persists across users on shared device)

См. `docs/auth-redesign-implementation-report.md` §"Follow-ups / Tech debt".

---

## Recommended next direction

**Top 3 candidates с rationale:**

### Option 1 — Stream 4 Visual Polish (RECOMMENDED)

**Rationale:** Marketing site live, user-facing first impressions matter. og:image banner — quick win (1 asset swap). Auth refinement — visual debt от 1b G2 review + 5 semantic token additions for design-system hygiene. Low BE coordination, high visible impact.

**Size:** S-M (depends on scope split — "polish batch" pattern Эпик 5 5O/5P precedent)

**Risk:** Low (visual-only, isolated from logic)

**Possible Phase 0 split:**
- Sub-epic 4a — og:image + Hero polish + auth refinement (S, ~3-5 commits)
- Sub-epic 4b — gameplay video asset + Roadmap real content + token additions (M, ~6-10 commits, dependent на user content)

### Option 2 — Stream 3 Subscribe Email Backend

**Rationale:** 8c added FE-only subscribe form. Currently dead UX (toast only). Real backend = real value. SendGrid/Postmark integration well-documented.

**Size:** M (BE endpoint + email service integration + storage decision)

**Risk:** Medium (3rd-party service decision, secret management, cherry-pick PR pattern per Lesson #33 для BE deploys)

### Option 3 — Stream 6 SIWE Wallet Auth

**Rationale:** Connect Wallet button visible everywhere (auth + profile + marketing CTA), currently dead. Web3 identity auth differentiator vs traditional email/password.

**Size:** L (FE wagmi integration + BE SIWE verification + nonce flow + session model decision)

**Risk:** Higher (cryptography correctness, replay protection, session/JWT integration). Best когда clear product priority requires it.

**My recommendation:** **Option 1 (Stream 4 Visual Polish).** Closes recent visual debt (1b auth + 8b og:image), low risk, fast win, maintains streak momentum. Stream 3/6 are larger commitments better tackled когда clear product priorities push them.

---

## Mode for next chat session

Recommended:
- **Same Mode A discipline** (Phase 0 read-only investigation → Phase 1 functional commits with STOP gates → CL closure phase)
- **New chat session с этим handoff приложен + fresh `CLAUDE.md`** (post-Stream 1 state)
- **Branch slug pattern** matching `claude/<descriptor>-<id>`
- **STEP 0 mandatory** (Lesson #43 FORMALIZED, sub-variants α/β/γ — see CLAUDE.md canonical entry):
  - α (harness slug variance, same SHA, content-identical) → adaptation-tier proceed silent
  - β (post-merge label drift, content-identical to origin/main) → adaptation-tier proceed silent
  - γ (real divergence, SHA + content differ) → STOP, surface to user
  - Recovery counter: only γ counts, α/β no longer increment

---

## Open questions для design-Claude следующей session

1. **Confirm direction** (Stream 4 vs 3 vs 6 vs other)
2. **Если Stream 4** — split scope decision (og:image + auth refinement atomic batch как 4a-S vs separate sub-epics; gameplay video + Roadmap real content await user input в 4b-M)
3. **Если Stream 3 subscribe** — email service vendor decision (SendGrid vs Postmark vs Mailchimp vs SMTP self-host); persist subscribers где (DB column / new table / 3rd-party list)
4. **Если Stream 6 SIWE** — session model decision (extend existing JWT vs new wallet-bound session vs hybrid); replay protection (nonce TTL); BE endpoint shape (`POST /v1/auth/wallet-challenge` + `/wallet-verify` или single-call)

---

## Streak journey at handoff

`0 → 1 → 2 → 3 → 4 → 0 → 1 → 2 ✅` (Stream 1 close)

Target: maintain или increment к 3 в next sub-epic.

---

## Reference documents

- **Stream 1 final report:** `docs/STREAM_1_FINAL_REPORT.md`
- **Auth-redesign implementation report (Эпик 9):** `docs/auth-redesign-implementation-report.md`
- **8c final report:** `docs/visual-migration/EPIC8_SUBEPIC_8C_FINAL_REPORT.md`
- **CLAUDE.md** — primary methodology + history reference (Stream 1 closure entry at end of file)
- **Lesson #43 FORMALIZED canonical entry** — `CLAUDE.md` post-Lesson #46 PROMOTED block

---

## End of handoff
