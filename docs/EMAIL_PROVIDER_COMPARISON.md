# Email provider comparison — Hexlash transactional auth emails

**Research date:** 2026-05-08
**Branch:** `claude/audit-email-auth` (same as backend audit — coupled deliverables)
**Scope:** decision support для email-auth implementation. Read-only research; no code changes, no API keys, no integrations.
**Mode:** uses public pricing pages + secondary review sources (cited at end). Pricing snapshot — verify before signing contracts.

**Pre-read:** `docs/BACKEND_AUDIT_EMAIL_AUTH.md` (same PR) covers backend state + gap analysis. This file picks vendor.

---

## TL;DR — recommendation

For Hexlash's expected volume (~3-10k emails/month, dominated by verify-email + password-reset transactional flows):

**Primary: Resend** — modern DX, generous free tier (3k/mo), automated DNS verification, official Node.js SDK + React Email integration, webhooks, fast setup (<30 min from signup to first email). Free tier covers expected volume entirely.

**Backup if Resend doesn't work out: Postmark** — best-in-class deliverability (98.5% inbox, 93.8% delivery in independent tests), transactional-only focus (no marketing IP pollution), SMTP fallback available. $15/mo Basic tier when Resend free runs out, well-priced for volume.

**Avoid for Hexlash specifically:**
- ❌ **AWS SES** — cheapest at scale but high setup complexity (sandbox mode, IAM policies, dedicated bounce SNS handling). Overkill for current volume + steep learning curve. Re-evaluate if ever scaling past 100k emails/mo.
- ⚠️ **SendGrid** — solid but no longer free (March 2025: free tier replaced with 60-day trial). Cheapest paid at $19.95/mo for 50k. Mixed transactional + marketing IPs hurt deliverability vs Postmark.
- ⚠️ **Mailgun** — average deliverability on shared IPs, dedicated IP requires Scale tier ($59+/mo). Reasonable middle option but no clear win over Resend or Postmark.

---

## Volume estimate for Hexlash

**Inputs (per CLAUDE.md project state):**
- Production at hexlash.com — game live since Эпик 6 cutover
- User registrations: no explicit count в CLAUDE.md, but Эпик 6 + Эпик 8 closure suggests pre-launch / early-launch state
- Email transactions per user: 1× verify-email at signup + occasional password-reset (~5-10% of users) + future notification flows (TBD per Stream 3 carry-overs)

**Assumption (best-effort, **explicit assumption — not measured**):**
- 100-1000 new registrations/mo near-term (small/mid scale)
- Email volume: ~150-1500/mo currently, scaling к 5-10k/mo if growth accelerates
- Free tiers at all 5 providers comfortably absorb this range

**If actual volume diverges drastically (e.g. >10k/mo registrations from Telegram-share campaign):** revisit comparison — at >50k/mo SendGrid Essentials becomes cheapest published rate, at >200k/mo AWS SES wins decisively.

---

## 1. Resend

| Criterion | Detail |
|---|---|
| **Pricing — free** | 3,000 emails/mo, 100/day cap |
| **Pricing — first paid** | Pro $20/mo (50k) → $35/mo (100k); recent restructure doubled some Scale tier prices in late 2025 |
| **Pricing — 10k/mo** | Free (under 3k/mo) OR Pro $20/mo if exceeded |
| **Setup complexity** | **LOW.** Sign up → add domain → Resend auto-generates SPF + DKIM DNS records → add to registrar → click Verify → API key → first email in <30 min |
| **Deliverability** | Newer player (founded 2023), no extensive independent benchmarks. Anecdotal reports good. Less data than Postmark. |
| **SDK / DX** | **Excellent.** Official Node.js SDK (`resend` npm package). React Email templates first-class integration (their own product). Modern docs, lots of "send your first email" tutorials. |
| **Webhooks** | Yes — `email.delivered`, `email.bounced`, `email.opened`, `email.clicked`, `email.complained`. Real-time |
| **DNS requirements** | SPF + DKIM **required** (auto-generated). DMARC recommended (manual). Custom domain required for production sending |
| **Rate limits** | Free tier 100/day; paid scales by plan volume |
| **Vendor lock-in** | API-first, **no traditional SMTP endpoint** — moderate lock-in. Switching requires code change (one service file per audit gap analysis) |
| **Regional notes** | US-based. No specific RU/BY restrictions documented in public T&C; standard OFAC compliance applies. EU-resident user receivers fine |

**Best for:** modern apps starting fresh, low-medium volume, prioritizing DX over absolute lowest cost.

---

## 2. Postmark

| Criterion | Detail |
|---|---|
| **Pricing — free** | Developer tier 100/mo, **hard cap, no overage** (sending stops at limit). Suitable for development only |
| **Pricing — first paid** | Basic $15/mo for 10k. Pro $16.50/mo for 10k (lower overage). Platform $18/mo for 10k (lowest overage) |
| **Pricing — 10k/mo** | $15/mo (Basic). Overage $1.80/1k on Basic, $1.30/1k on Pro, $1.20/1k on Platform |
| **Setup complexity** | **LOW-MEDIUM.** Standard SPF + DKIM DNS, separate "server" abstraction для transactional vs broadcast streams (good for correctness). Sender Signature verification optional but recommended |
| **Deliverability** | **BEST-IN-CLASS.** Independent tests: 98.5% deliverability, 93.8% inbox rate (highest tested). Transactional-only focus = no marketing IP pollution. "Up to 4x faster than other providers" (vendor claim) |
| **SDK / DX** | Mature Node.js SDK (`postmark` npm package). Good docs. Less hype than Resend but more battle-tested |
| **Webhooks** | Yes — full event suite (delivery, bounce, spam, open, click, subscription change) |
| **DNS requirements** | SPF + DKIM standard. Custom domain required for production |
| **Rate limits** | No hard limit per second (returns 429 on excessive). 10 concurrent SMTP connections per IP recommended. Account-level conditions: <0.1% spam complaints + <10% bounce rate to maintain unrestricted sending |
| **Vendor lock-in** | **SMTP fallback available** (`smtp.postmarkapp.com:587` or fallback `:2525`). Standard SMTP = trivial provider swap if needed |
| **Regional notes** | US-based. Same OFAC framework as competitors |

**Best for:** apps where deliverability is mission-critical (verify-email + password-reset hitting inbox = unblocking real signups). Worth paying $15/mo for materially higher inbox rate.

---

## 3. AWS SES

| Criterion | Detail |
|---|---|
| **Pricing — free** | 3,000/mo for 12 months on new accounts. Accounts after 2025-07-15 also get $200 AWS Free Tier credits applicable к SES |
| **Pricing — first paid** | $0.10 per 1,000 emails — **cheapest option by far** at scale |
| **Pricing — 10k/mo** | **$1.00/mo** (10 × $0.10) — order of magnitude cheaper than competitors |
| **Setup complexity** | **HIGH.** New accounts in **sandbox mode** (capped 200/day, can only email verified addresses) — production access requires support ticket request with business case. DKIM + SPF DNS. IAM user/policy для API access. Bounce + complaint handling via SNS + Lambda or SQS for proper compliance. Production-ready setup typically 4-8 hours initial work |
| **Deliverability** | Variable on shared IPs (IP reputation depends on neighbors). Dedicated IP $24.95/IP/mo + warming required. Virtual Deliverability Manager $0.07/1000 |
| **SDK / DX** | AWS SDK for JavaScript v3 (`@aws-sdk/client-sesv2`). Mature but heavyweight (full AWS SDK style with command pattern, region config, credentials chain) |
| **Webhooks** | Indirect — bounce/complaint events go to SNS topic → subscribe via webhook OR SQS. Extra infra (DynamoDB or other backend to track) typical |
| **DNS requirements** | SPF + DKIM required. DMARC strongly recommended. Domain ownership verification mandatory |
| **Rate limits** | Sandbox: 200/day, 1/sec. Production: starts low, increases automatically based on usage + reputation. Hard limits negotiable |
| **Vendor lock-in** | SMTP endpoint available (`email-smtp.<region>.amazonaws.com:587`), so SMTP fallback exists. SDK lock-in moderate (AWS SDK deeply integrated patterns) |
| **Regional notes** | Multiple AWS regions for sending (us-east-1, eu-west-1, eu-central-1, ap-southeast-1, etc.). **No AWS region in Russia.** Recipients globally fine |

**Best for:** high-volume operations (>50k/mo) where $0.10/1000 cost dominates other concerns + team has AWS expertise.

---

## 4. SendGrid (Twilio)

| Criterion | Detail |
|---|---|
| **Pricing — free** | ~~Permanent free tier~~ — replaced March 2025 with 60-day trial only. After trial: paid required |
| **Pricing — first paid** | Essentials $19.95/mo for 50k. Pro $89.95/mo for 100k. Premier custom |
| **Pricing — 10k/mo** | $19.95/mo (Essentials minimum) — **40k unused emails wasted at low volume**. Cheaper at higher volumes (50k = cheapest published rate among compared providers below 200k) |
| **Setup complexity** | **MEDIUM.** Domain authentication (CNAME records mostly), API key generation, optional dedicated IP. Broad documentation. SendGrid + Marketing Campaigns are separate billing — adds confusion |
| **Deliverability** | Good but variable. Mixed transactional + marketing customers share IP pools (marketing senders' bad practice can hurt transactional senders' deliverability) |
| **SDK / DX** | Mature Node.js SDK (`@sendgrid/mail`). Most extensive ecosystem of WordPress / Rails / etc. integrations. Docs comprehensive but dated in style |
| **Webhooks** | Comprehensive event webhook (processed, dropped, delivered, deferred, bounce, open, click, spam_report, unsubscribe) |
| **DNS requirements** | Domain authentication (CNAME), SPF, DKIM. DMARC recommended |
| **Rate limits** | Per-plan; Essentials 50k/mo |
| **Vendor lock-in** | SMTP available (`smtp.sendgrid.net:587`), so SMTP fallback exists. API SDK swap requires code change |
| **Regional notes** | US-based with EU sending option (Configurable Sending in EU GA per 2025 announcement). Useful for GDPR data-residency scenarios. No RU/BY-specific exceptions |

**Best for:** established teams already on Twilio ecosystem, or volumes 50k-200k/mo where Essentials price wins.

---

## 5. Mailgun

| Criterion | Detail |
|---|---|
| **Pricing — free** | 100/day (long-term free tier still exists) |
| **Pricing — first paid** | Basic $15/mo for 10k. Foundation $35/mo for 50k. Scale $90/mo for 100k |
| **Pricing — 10k/mo** | $15/mo (Basic) — matches Postmark. Overage $1.80/1k Basic |
| **Setup complexity** | **MEDIUM.** Domain verification (multiple DNS records), API key. Mailgun Optimize (deliverability tools) separate $49/mo upcharge |
| **Deliverability** | Average on shared IPs ("not bad, not Postmark-level"). Dedicated IP $59/mo recommended for serious deliverability |
| **SDK / DX** | Official Node.js SDK (`mailgun.js`). Decent docs. Less polished than Resend or Postmark |
| **Webhooks** | Yes — comprehensive event suite |
| **DNS requirements** | SPF + DKIM standard, plus MX record for inbound parsing if used |
| **Rate limits** | Per-plan |
| **Vendor lock-in** | SMTP fallback yes (`smtp.mailgun.org:587`) |
| **Regional notes** | US + EU regions selectable. Standard OFAC framework |

**Best for:** mid-range volume on Basic/Foundation tiers ($15-35/mo) when Postmark deliverability premium not required.

---

## Cross-comparison matrix

| Criterion | Resend | Postmark | AWS SES | SendGrid | Mailgun |
|---|---|---|---|---|---|
| Free tier | 3k/mo | 100/mo (hard) | 3k/mo (12mo) | 60-day trial only | 100/day |
| 10k/mo cost | **Free** | $15 | **$1** | $19.95 | $15 |
| 50k/mo cost | $20 | ~$87 (overage) | $5 | **$19.95** | $35 |
| Setup time | 30 min | 1 hr | 4-8 hrs | 1 hr | 1 hr |
| Deliverability rank | Likely good | **Best (98.5%)** | Variable | Good | Average |
| Node.js SDK quality | **Modern** | Mature | Heavyweight | Mature | Decent |
| Webhooks | Direct | Direct | Via SNS | Direct | Direct |
| SMTP fallback | ❌ | ✅ | ✅ | ✅ | ✅ |
| EU sending option | — | — | EU regions | EU GA | EU region |
| RU/BY availability | OFAC standard | OFAC standard | OFAC standard | OFAC standard | OFAC standard |

**Notes:**
- "OFAC standard" = no Russia/Belarus-specific blocks documented in public terms; standard US sanctions compliance applies (subject to receiver-end blocks if user IPs come from sanctioned regions; sender-end account access typically uncompromised). All 5 providers are US-based, so equivalent regulatory framework.
- **None of the 5 providers have a documented "Russia/Belarus user-friendly" stance** — if Hexlash has substantial RU/BY user base needing to receive emails, all 5 should work for sending TO those addresses (recipient region rarely blocked), but **payment / billing access from RU/BY accounts may be restricted** by these US providers. Consideration for the project owner if billing card is RU/BY issued.

---

## Hexlash-specific recommendation

### Choice criteria for this project

| Priority | Why this matters for Hexlash |
|---|---|
| **1. DX speed** | Solo / small team, finite engineering hours per Stream pace |
| **2. Free tier coverage** | Pre-token-launch / early-monetization stage, every $/mo counts |
| **3. Deliverability for verify-email** | If verify-email lands in spam, signup conversion drops materially |
| **4. SDK simplicity** | Per `BACKEND_AUDIT.md` §7.3, `services/emailService.js` skeleton needs vendor-agnostic wrapper — simpler vendor SDK = simpler wrapper |
| **5. Vendor lock-in low** | Future migration possible if scale changes priorities |

### Recommendation: **Resend**

**Pros (in Hexlash context):**
- 3k/mo free covers expected volume entirely (no payment setup blocker for MVP)
- Setup speed wins — engineering time better spent on game features than email infra
- Modern Node.js SDK fits backend's current Express + Prisma style
- React Email integration option opens nice template authoring если Stream 4 polish ever wants i18n templates with components
- Webhooks direct (no SNS plumbing) — bounce handling = single endpoint vs AWS SES's multi-service setup

**Cons accepted:**
- No SMTP fallback (medium-effort migration if ever needed; deferred risk acceptable at current stage)
- Less independent deliverability data than Postmark — bet on vendor reputation for now, monitor verify-email open rates post-launch and switch к Postmark if conversion suffers

### Backup: **Postmark**

If during implementation Resend hits unexpected limits, deliverability turns out subpar, OR free tier policy changes (mirroring SendGrid's March-2025 free-tier removal):
- Switch к Postmark Basic $15/mo
- SMTP fallback enables low-effort swap (just change SMTP config, no SDK rewrite if `services/emailService.js` is wrapped vendor-agnostic via SMTP transport)
- Postmark's deliverability gain (98.5% vs typical 90-95%) materially helps verify-email conversion

### Avoid for Hexlash currently

- **AWS SES** — overkill setup для volume <50k/mo. Re-consider only при scale event (token launch + retention growth >100k registrations).
- **SendGrid** — paid-only post free-tier removal. Premium price ($19.95/mo) wasted on low volume; deliverability mid-tier; ecosystem advantage doesn't apply (no existing Twilio integration in stack).
- **Mailgun** — no clear win vs Resend (same $15/mo Basic tier vs Resend $20/mo Pro, but Mailgun has no free tier coverage like Resend's 3k).

### Implementation note

When writing email-auth implementation ТЗ:
- Vendor-agnostic `services/emailService.js` interface (abstract `sendEmail({to, subject, html, text})` signature) so swap is single-file
- env vars `RESEND_API_KEY` (or vendor equivalent) + `EMAIL_FROM` (e.g. `noreply@hexlash.com`)
- Domain `hexlash.com` SPF + DKIM via Resend Domain dashboard — DNS records added once at registrar
- DMARC record manual (best practice, not vendor-required)
- Initial templates: `verify-email.html`, `reset-password.html`, plain-text siblings — start English-only, i18n per CLAUDE.md 11-locale support deferred to polish stream

---

## Sources

- [Resend pricing](https://resend.com/pricing) (vendor — primary)
- [Postmark pricing](https://postmarkapp.com/pricing) (vendor — primary)
- [Amazon SES pricing](https://aws.amazon.com/ses/pricing/) (vendor — primary)
- [Twilio SendGrid pricing](https://www.twilio.com/en-us/products/email-api/pricing) (vendor — primary)
- [Mailgun pricing](https://www.mailgun.com/pricing/) (vendor — primary)
- [Postmark vs SendGrid comparison (Postmark)](https://postmarkapp.com/compare/sendgrid-alternative) (vendor-biased, useful for feature inventory)
- [13 Best Transactional Email Services 2026 — Email Tool Tester](https://www.emailtooltester.com/en/blog/best-transactional-email-service/) (independent review with deliverability benchmarks: Postmark 93.8% inbox)
- [Postmark Review 2026 — Hackceleration](https://hackceleration.com/postmark-review/) (independent: 98.5% deliverability)
- [Resend Pricing Guide 2026 — Flexprice](https://flexprice.io/blog/detailed-resend-pricing-guide) (3rd-party pricing analysis)
- [Mailgun Review 2026 — Mailflow Authority](https://mailflowauthority.com/esp-reviews/mailgun-review) (independent deliverability review)
- [Email API Pricing Comparison April 2026 — buildmvpfast](https://www.buildmvpfast.com/api-costs/email) (cross-vendor pricing snapshot)
- [Postmark Developer API overview](https://postmarkapp.com/developer/api/overview) (vendor docs — SMTP/API rate limits)
- [Resend Domains documentation](https://resend.com/docs/dashboard/domains/introduction) (vendor docs — DNS setup)
- [Configurable Sending in EU GA — Twilio SendGrid](https://sendgrid.com/en-us/blog/Configurable-Sending-in-EU-Now-in-GA) (regional/GDPR feature)

---

## Out of scope (per ТЗ §"Out of scope")

- ❌ No API keys requested or set up
- ❌ No `npm install` for any vendor SDK
- ❌ No code changes
- ❌ No DNS records modified
- ❌ No vendor accounts created

Pricing snapshot — vendors change pricing periodically. Verify current pricing on vendor pages before committing к multi-month plans. Resend Scale tier doubled prices late 2025; SendGrid removed free tier March 2025 — these illustrate vendor flux risk.
