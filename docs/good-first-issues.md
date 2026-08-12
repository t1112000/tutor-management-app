# Good first issues — mở trên GitHub sau khi push

Tạo issue mới → paste title/body → add labels.  
Mục tiêu scorecard: **Community issues** không còn “gần như chưa có”.

---

## Issue 1

**Title:** `docs: add Vietnamese quick-start section to README`  
**Labels:** `documentation`, `good first issue`

**Body:**

```markdown
## Summary
README is English-first. Many target users are Vietnamese private tutors.

## Proposal
Add a short **Tiếng Việt** quick-start (Docker + set-password + first login) without duplicating the entire README.

## Acceptance
- [ ] Section "Bắt đầu nhanh" with 5–10 steps
- [ ] Links to full English setup for env details
- [ ] No secrets committed

## Notes
Docs-only; no app logic changes.
```

---

## Issue 2

**Title:** `a11y: audit dashboard navigation focus states`  
**Labels:** `enhancement`, `good first issue`, `accessibility`

**Body:**

```markdown
## Summary
Keyboard users should see clear focus rings on Sidebar / BottomNav.

## Tasks
- [ ] Tab through main nav on desktop and mobile
- [ ] Fix missing `focus-visible` styles if any
- [ ] Note before/after in the PR

## Out of scope
Visual redesign, new features.
```

---

## Issue 3

**Title:** `docs: screenshot gallery for students / bills / calendar`  
**Labels:** `documentation`, `good first issue`

**Body:**

```markdown
## Summary
README should show what the product looks like for external adopters.

## Tasks
- [ ] Capture 3 screens (students list, bill detail, calendar) from a **local** empty/demo account
- [ ] Store under `docs/screenshots/` (no real student PII)
- [ ] Embed in README under "Screenshots"

## Privacy
Never upload production data or real student names/phones.
```

---

## Issue 4 (pin this one)

**Title:** `meta: public roadmap & help wanted`  
**Labels:** `meta`, `help wanted`

**Body:**

```markdown
## Roadmap (help wanted)

Near-term (docs / DX — no product scope creep):
- [ ] Vietnamese quick-start
- [ ] Screenshot gallery
- [ ] Accessibility pass on nav

Later (discuss before coding):
- [ ] Better onboarding for first-time self-hosters
- [ ] Optional multi-language UI strings
- [ ] Extracted pure helpers as docs examples (not required)

## How to help
Read CONTRIBUTING.md → pick a `good first issue` → open a PR.

## Not planned
Multi-tenant marketplace, public open signup SaaS.
```

After creating, **Pin** issue 4 on the repo.
