# Codex for Open Source — application draft

Use with the official form: https://openai.com/form/codex-for-oss/

Program page: https://developers.openai.com/community/codex-for-oss  
Terms: https://developers.openai.com/codex/codex-for-oss-terms  
Scorecard gap plan: [`oss-scorecard.md`](./oss-scorecard.md)

**Update metrics from GitHub before submit.** Do not invent stars or downloads.

## Lessons from a teammate’s weak scorecard

Even with **~34 stars**, these columns were marked weak and can sink an application:

| Weak signal | Fix before submit |
|-------------|-------------------|
| Releases = 0 | Publish GitHub Release `v0.1.0` |
| Community issues ≈ 0 | Open ≥3 issues (use `good-first-issues.md`) |
| Forks / contributors = 0–1 | Organic only; optional real teammate PR |
| External adoption unproven | Demo URL, screenshots, honest niche story |
| Stars mid/low | Do not fake; emphasize ecosystem niche in form |

**MyClass must push LICENSE first** — remote currently has `license: null` until packaging lands on `main`.

## Pre-submit checklist

### Repo files (done in working tree)

- [x] `LICENSE` (MIT)
- [x] Accurate `README.md` + preview image
- [x] `CONTRIBUTING.md` + `SECURITY.md` + `CODE_OF_CONDUCT.md` + `CHANGELOG.md`
- [x] Issue / PR templates
- [x] `docs/release-v0.1.0.md` + `docs/good-first-issues.md` + `docs/oss-scorecard.md`

### GitHub actions

- [x] `git push` packaging to `main` (commit `899e3a1`)
- [x] Confirm SPDX on GitHub — **MIT** detected
- [ ] Settings → **Description** + **Topics** — **needs repo Admin** (owner `t1112000`; collaborator `esp-tuyen` only has Write)
- [x] **Release** [`v0.1.0`](https://github.com/t1112000/tutor-management-app/releases/tag/v0.1.0)
- [x] Opened issues [#2](https://github.com/t1112000/tutor-management-app/issues/2)–[#5](https://github.com/t1112000/tutor-management-app/issues/5); pin #5 if you have Admin
- [ ] Enable **Private vulnerability reporting** (Admin)
- [ ] ChatGPT email = form email; GitHub profile **public**
- [ ] Form submit as the account that is **primary maintainer** with write access
- [ ] Read Program Terms
- [ ] Optional: teammate opens a small docs PR → 2nd contributor

### Suggested GitHub topics

`nextjs` `typescript` `tutoring` `education` `vietnam` `postgresql` `self-hosted` `pwa` `open-source` `docker`

### Suggested description

```
MyClass — open-source private tutoring management (students, schedules, bills, VN timezone). Next.js 15 + Postgres. Self-hosted.
```

## Form drafts (edit metrics to live numbers)

### Maintainer role

Primary / core maintainer.

### Why does this repository qualify? (≤500 chars)

```
I am the primary maintainer of MyClass, a real self-hosted OSS app for private tutors (students, VN timezone schedules, session billing, calendar, PWA push). Stack: Next.js 15, Postgres, Docker, CI on every PR (typecheck/lint/test/build). Early stars/forks, but the project fills a concrete niche: independent VN tutors who need correct local-time scheduling and soft-delete-safe invoices without SaaS lock-in. I ship releases, security policy, issue triage, and full ownership of reviews.
```

Character count ~480 — trim if form is stricter after you add exact star count, e.g. “N GitHub stars”.

### How will you use API credits? (≤500 chars)

```
Credits only on this authorized repo: first-pass PR review, regression risk notes, release notes, issue triage, and test suggestions. Human review before every merge. Goal is maintainer workload (triage/review/docs/security), not personal experiments or third-party repos. Aligns with Codex-for-OSS maintainer automation use cases.
```

### Anything else? (≤500 chars)

```
Addressed common weak signals before apply: MIT license, CONTRIBUTING/SECURITY/CoC, issue templates, public roadmap issues, and a tagged release. Solo-maintained with honest metrics. Benefits fund ongoing triage and hardening of auth/billing paths. Happy to verify write access. Niche education tooling for VN tutors—applying under “explain ecosystem role” guidance.
```

### Interested in

- [x] API credits
- [x] Codex Security (this owned repo only)

## After packaging push — suggested commands

```bash
# from main, after commit
git push origin main

# tag release (after push)
git tag -a v0.1.0 -m "v0.1.0 — Initial open-source release"
git push origin v0.1.0

# if gh is authenticated:
gh release create v0.1.0 -F docs/release-v0.1.0.md --title "v0.1.0 — Initial open-source release"
gh api -X PATCH repos/t1112000/tutor-management-app -f description='MyClass — open-source private tutoring management (students, schedules, bills, VN timezone). Next.js 15 + Postgres. Self-hosted.'
gh api -X PUT repos/t1112000/tutor-management-app/topics -f names[]=nextjs -f names[]=typescript -f names[]=tutoring -f names[]=education -f names[]=vietnam -f names[]=postgresql -f names[]=self-hosted -f names[]=pwa -f names[]=open-source -f names[]=docker
```

## Expectation

| Signal strength | Likely outcome |
|-----------------|----------------|
| Packaging + release + issues only, 1 star | Apply allowed; **approve odds low–medium** |
| + real demo + organic stars/contributors | Better re-apply |

Approval is OpenAI’s discretion. Never fabricate metrics (Program Terms allow revoke for false info).
