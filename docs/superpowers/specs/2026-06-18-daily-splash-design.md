# Daily Splash Screen — Design Spec

**Date:** 2026-06-18  
**Feature:** First-visit-per-day motivational splash screen  
**App:** MyClass (tutor management, Vietnamese, single-user)

---

## Overview

When the user opens the app for the first time each calendar day (VN timezone), a fullscreen splash screen appears covering all UI (sidebar, bottom nav, header). It displays a randomly selected Vietnamese motivational message in typewriter/streaming style, with layered 3D visual effects using the app's existing background images. A "Bắt đầu ngày mới 🌸" button appears after typing finishes, and tapping it dismisses the screen.

---

## Architecture

### New file
`src/components/layout/DailySplash.tsx` — self-contained Client Component. No external state or context needed.

### Modified file
`src/app/(dashboard)/layout.tsx` — add `<DailySplash />` inside `<div className="flex h-[100dvh]">`, before `<Sidebar>`. Because it uses `position: fixed`, DOM position does not affect layout.

### "Shown today" tracking
- **localStorage key:** `myclass_splash_date`
- **Value format:** `YYYY-MM-DD` (VN timezone via `todayVN()` from `src/lib/time.ts`)
- **Logic:** On mount, compare stored value to today. If different (or absent) → show splash. On dismiss → write today's date to localStorage.

### Message pool
All ~400 motivational messages (5 groups provided by the user) are stored as a static array inside `DailySplash.tsx`. On each splash show, one message is selected with `Math.floor(Math.random() * messages.length)`.

---

## Visual Design

### Background
Reuses the app's existing CSS background exactly:
- Desktop: `bg-main.png`
- Mobile (`max-width: 767px`): `bg-mobile.png`
- Applied as `background: url(...) center/cover fixed` on the overlay element

### Layer stack (bottom → top)
1. **Background image** — same as app body
2. **Floating particles** — 15–20 emoji (🌸 💖 ✨ 🌷 🍀 🌺 💐) with randomised position, size (16–28px), speed, and rotation; CSS `@keyframes` float upward from bottom, rotate slightly, fade out near top; pure CSS, no library
3. **Center card** — glassmorphism card (`backdrop-blur-md`, `bg-white/20`, `border border-white/30`, `rounded-3xl`, `shadow-2xl`); contains the message text and button
4. **Shimmer overlay on card** — `linear-gradient` at ~20° animating across card surface; opacity ~15%; creates soft iridescent light sweep
5. **Button** — appears after typing; app primary color `#E8788A`

### 3D perspective (card)
- **Desktop:** `onMouseMove` on the overlay calculates cursor offset from screen center → maps to `rotateX` (±12°) and `rotateY` (±12°) applied via `transform: perspective(800px) rotateX() rotateY()` on the card
- **Mobile:** `DeviceOrientationEvent` listener; if events fire naturally (Android), use beta/gamma to drive the same transform. **No permission request.** iOS fallback: breathing keyframe animation (`scale(1) → scale(1.015) → scale(1)` on a 3s loop)

### Typography
- Message text: `font-size: 22px` (mobile: 18px), `font-weight: 600`, color white, `text-shadow: 0 1px 8px rgba(0,0,0,0.3)`
- Center-aligned, max-width `520px`, padding `32px`

### Entrance / exit animations
- **Enter:** `opacity: 0 → 1` + `scale(0.97 → 1)` over 500ms `ease-out`
- **Exit:** `opacity: 1 → 0` + `scale(1 → 1.03)` over 400ms `ease-in` → then unmount

---

## Typewriter / Streaming Effect

1. After splash enters (delay 400ms), begin character-by-character append at **35ms per character**
2. Use `[...message]` (unicode spread) to iterate — preserves multi-codepoint emoji intact
3. When typing complete → wait 300ms → fade in dismiss button (`opacity: 0 → 1` over 600ms)
4. Button label: `"Bắt đầu ngày mới 🌸"`
5. Button is not tappable while text is still typing (it does not exist in DOM yet)

---

## Dismiss Flow

```
mount → check localStorage
  ├─ today already stored → return null (no render)
  └─ not stored / different date
       → render splash (enter animation)
       → typewriter runs
       → button appears
       → user taps button
            → write today's date to localStorage
            → run exit animation (400ms)
            → unmount
```

---

## Edge Cases

| Case | Handling |
|---|---|
| SSR / hydration | `useState(null)` as initial "unknown" state; only determine show/hide after `useEffect` mount; return `null` during SSR |
| `localStorage` unavailable | Wrap in `try/catch`; if error, default to **not showing** splash (fail silent) |
| Emoji splitting in typewriter | Use `[...str]` spread, not `str[i]`, to correctly iterate unicode |
| DeviceOrientation on iOS | No `requestPermission()` call; breathing animation is the default; gyroscope activates only if events fire naturally |
| Very long message | Card has `overflow-y: auto` with `max-height: 70dvh`; text can scroll within card if needed |
| User bookmarks `/students` or `/calendar` | Splash still fires because it lives in the shared dashboard layout |

---

## Files Changed

| File | Change |
|---|---|
| `src/components/layout/DailySplash.tsx` | **New** — full component |
| `src/app/(dashboard)/layout.tsx` | Add `<DailySplash />` import and render |
