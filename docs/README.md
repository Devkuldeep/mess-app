# Docs: kya kahan hai

Shuruaat [roadmap.md](roadmap.md) se karo. Usme build order hai, har module ki dependencies hain, aur ab tak ke faisle bhi.

```
docs/
├── README.md            ← ye file
├── roadmap.md           ← MASTER: stages, modules (M-…), dependencies, decisions
├── progress.md          ← kya bana hai (live status, har feature ke baad update)
├── product/             ← business: kyun aur kiske liye
│   ├── vision.md            positioning, target, sidhant, validation
│   ├── business-model.md    SaaS levels, plans, reseller, billing, kamai ke raaste
│   ├── competitors.md       market aur competitors
│   ├── feature-backlog.md   saare ideas, module + stage ke saath
│   └── us-market.md         USA version (baad mein)
├── modules/             ← product modules: feature spec + status
│   ├── core-operations.md   headcount, delivery, payments, customer link, menu
│   ├── wastage-forecast.md  wastage, forecast, festival calendar
│   └── academy-content.md   Growth Academy, blog, AI help
└── plan/                ← technical implementation plans (build karne se pehle)
    ├── production-readiness.md  CI, tests, security, envs, release, DR, performance
    ├── platform-foundations.md  commands, errors, money, scoped DB, idempotency, settings, entitlements, storage, import, i18n, search
    ├── core-domain-v2.md    subscriptions, plan versions, billing engine, ledger, mahina band, catalog + menu, extras
    ├── roles-permissions.md
    ├── observability.md     logging, audit, reports, analytics
    ├── business-growth.md   finance, inventory, growth reports, SaaS metrics
    └── notifications.md     jobs, events, push/email/WhatsApp
```

## Rules
- **Naya idea aaye:** [product/feature-backlog.md](product/feature-backlog.md) mein sahi module ke neeche ❌ ke saath likho.
- **Kuch build karna ho:** pehle us module ka plan `plan/<module>.md` mein likho (planning session mein), phir roadmap mein "Plan ✅" karo. Jin plans ko likhna baaki hai, woh roadmap mein 📝 se marked hain.
- **Kuch ban jaaye:** [progress.md](progress.md) mein status, aur roadmap mein "Build" column update karo.
- **Koi bada faisla badle:** roadmap ke "Faisle" table mein naya entry jodo. Purane docs chupchaap mat badlo.
- **Koi faisla baaki ho, approval chahiye, ya lawyer/CA ka sawal ho:** roadmap ke **Decision register** mein likho, kisi plan ke andar nahi. Ho jaane par wahan ✅ karo aur D-entry jodo.
- **Language:** docs Hinglish mein hain. Developer ke liye rules root ke `CLAUDE.md` aur `src/server/CLAUDE.md` mein hain.

## Purani files kahan gayi (2026-11-27)
| Purani | Ab |
|---|---|
| `init.md` | [modules/core-operations.md](modules/core-operations.md) + [product/vision.md](product/vision.md) + backlog |
| `init-2.md` | [product/business-model.md](product/business-model.md) |
| `init-3.md` | [modules/wastage-forecast.md](modules/wastage-forecast.md) |
| `init-4.md` | [roadmap.md](roadmap.md) (build order) + [product/vision.md](product/vision.md) (positioning, validation) |
| `feature-list.md` | [product/feature-backlog.md](product/feature-backlog.md) + [modules/academy-content.md](modules/academy-content.md) |
| `compititor.md` | [product/competitors.md](product/competitors.md) |
| `init-us.md` | [product/us-market.md](product/us-market.md) |
| `plan/role-permssion.md` | [plan/roles-permissions.md](plan/roles-permissions.md) |
| root `plan-buiness.md` (content/AI ideas) | [modules/academy-content.md](modules/academy-content.md) + [product/business-model.md](product/business-model.md) §7 |

Purana content git history mein abhi bhi hai.
