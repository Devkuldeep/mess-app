# Work-flow story: ek IT company ye app A se Z kaise banati hai

> **Maqsad:** seekhna ki industry mein ek product **idea se lekar production aur growth tak** kaise banta hai: business level, team level aur developer level (high level + low level).
> **Tareeka:** ek kahani. Ek fictional company **Rasoi Labs** yahi app (Mess Manager, ye repo) bana rahi hai, aur **"Tum"** usme naye junior developer ho. Har chapter mein Tum ek nayi team ke saath baith kar seekhte ho.
>
> Company aur log kaalpanik hain. Code, docs aur plans **asli** hain (isi repo ke), taaki har baat ko khud chhoo kar dekh sako.
>
> 🌐 **Website par bhi padh sakte ho:** app ke domain par `/learn`. Wahan akshar ka size aur Din/Sepia/Raat mode bhi hai. Ye files hi wahan dikhti hain, isliye yahan badlo to agle deploy mein wahan bhi badal jaayega.

## Har chapter ka format
| Hissa | Kya milega |
|---|---|
| 📖 **Kahani** | Us stage par team mein kya hua, kisne kya kaha, kya galti hui |
| 🏢 **Industry mein kaise hota hai** | General practice: startup, badi company aur service company mein farak |
| 👨‍💻 **Developer deep dive** | Low-level: patterns, commands, code, aur is repo mein kahan hai |
| 📄 **Namuna (artifact)** | Asli document ka template: PRD, user story, ADR, PR, bug report, postmortem… |
| ⚠️ **Aam galtiyan** | Jo log aksar karte hain |
| ✅ **Checklist / seekh** | Yaad rakhne layak baatein |

## Chapters
| # | Chapter | Stage | Kaun lead karta hai |
|---|---|---|---|
| 01 | [Idea aur business](01-idea-aur-business.md) | Kyun banana hai, kiske liye, paisa kaise | Founder, PM |
| 02 | [Discovery aur requirements](02-discovery-requirements.md) | Kya banana hai, kitna, kis order mein | PM, BA |
| 03 | [Design (UX/UI)](03-design-ux.md) | Kaisa dikhega, kaise chalega | Designer |
| 04 | [Architecture aur tech decisions](04-architecture-tech.md) | Kis tech se, kis structure mein | Tech Lead |
| 05 | [Project setup](05-project-setup.md) | Repo, tools, conventions, onboarding | Tech Lead, DevOps |
| 06 | [Agile process](06-agile-process.md) | Team roz aur har sprint kaise kaam karti hai | PM, Scrum Master |
| 07 | [Developer ka din (feature end-to-end)](07-developer-ka-din.md) | Ticket se production tak ek feature | Developers |
| 08 | [Backend deep dive](08-backend-deep-dive.md) | Data, auth, tenancy, idempotency, jobs, performance | Backend devs |
| 09 | [Frontend aur mobile deep dive](09-frontend-mobile.md) | RSC, forms, offline PWA, performance, a11y, TWA | Frontend devs |
| 10 | [Testing aur QA](10-testing-qa.md) | Kya, kab, kaise test karna | QA + sab |
| 11 | [Security, privacy, compliance (SMS/DLT bhi)](11-security-compliance.md) | Data, paisa aur kanoon ki suraksha | Security, legal |
| 12 | [DevOps, CI/CD, release](12-devops-release.md) | Code se live app tak, aur Play Store | DevOps |
| 13 | [Production operations](13-operations.md) | Monitoring, incidents, support | SRE, Support |
| 14 | [Growth, scale aur team](14-growth-scale-team.md) | Badhna: users, tech, team, career | Sab |
| 15 | [Glossary + learning path](15-glossary-learning-path.md) | Shabd-kosh, kya padhein, practice tasks | Tum |

## Kirdaar (cast)
| Naam | Role | Kaam | Developer ko inse kya seekhna hai |
|---|---|---|---|
| **Aarav** | Founder / CEO | Vision, paisa, sales, faisle | Business ki bhasha: kamai, kharcha, risk |
| **Meera** | Product Manager (PM) | Kya banega aur kyun; priority | Problem ko user ki nazar se dekhna |
| **Kabir** | Business Analyst (BA) | Requirements ko detail mein likhna | Edge cases, acceptance criteria |
| **Sana** | UX/UI Designer | Research, flows, design system | User ke liye sochna, states |
| **Vikram** | Tech Lead / Architect | Architecture, tech faisle, code quality | Trade-offs, ADRs, "kyun" poochna |
| **Neha** | Senior Backend Developer | Data, APIs, security | Data integrity, tenant isolation |
| **Rohan** | Frontend Developer | UI, offline, performance | User-facing engineering |
| **Isha** | QA Engineer | Test plans, bugs, quality | Todne ki soch (tester mindset) |
| **Arjun** | DevOps / SRE | CI/CD, infra, monitoring, incidents | Production ko zinda rakhna |
| **Farhan** | Security consultant | Threat model, reviews | Attacker ki tarah sochna |
| **Tara** | Data Analyst | Metrics, dashboards | Data se faisle |
| **Pooja** | Customer Success / Support | Owners ki madad, feedback | User ka asli dard |
| **Imran** | Sales / Reseller manager | Messes tak pahunchna | Product kaise bikta hai |
| **Adv. Rao, CA Mehta** | Lawyer, Chartered Accountant | Kanoon, tax | Compliance ki seemayein |
| **Sunita didi, Sharma ji** | Pilot mess owners | Asli users | Sabse zaroori: inki baat suno |
| **Tum** | Junior Developer | Seekhna aur banana | Ye poori kahani tumhari hai |

## Timeline (ek nazar mein)
```
Hafta 0–2    💡 Idea + business validation ............ 01
Hafta 2–4    🔍 Discovery + requirements .............. 02
Hafta 3–6    🎨 Design ................................ 03
Hafta 4–6    🏗️ Architecture + tech decisions ......... 04
Hafta 5      🧰 Project setup ......................... 05
Hafta 6–14   🔁 Sprints: development (06, 07, 08, 09)
             🧪 Testing + 🔐 security, saath-saath (10, 11)
Hafta 14     🚀 Release: pilot launch ................. 12
Launch ke baad 📟 Operations + support ................ 13
Mahina 6+    📈 Growth, scale, team ................... 14
```
> **Zaroori baat:** asli life mein ye stages **overlap** karti hain aur baar-baar dohraayi jaati hain (iterative). Design chal raha hota hai jab architecture ban raha hota hai, aur pilot ka feedback wapas requirements badal deta hai. Ye "waterfall" nahi hai. Order sirf samajhne ke liye hai.

## Is repo se judav
| Story ka stage | Is repo mein |
|---|---|
| Business, vision | [../product/vision.md](../product/vision.md), [../product/business-model.md](../product/business-model.md), [../product/competitors.md](../product/competitors.md) |
| Requirements, backlog | [../modules/](../modules/), [../product/feature-backlog.md](../product/feature-backlog.md) |
| Roadmap, faisle | [../roadmap.md](../roadmap.md): stages, modules, decision log, Decision register |
| Technical plans | [../plan/](../plan/) |
| Developer rules | root ka `CLAUDE.md`, `src/server/CLAUDE.md`, `prisma/CLAUDE.md`, `.claude/skills/mobile-ui/SKILL.md` |

**Kaise padhein:** ek chapter, phir uske "Is repo mein" wale files kholo. Har chapter ke end mein ek practice task bhi hai.
