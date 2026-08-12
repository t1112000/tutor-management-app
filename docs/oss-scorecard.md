# OSS scorecard — Codex for Open Source

Đối chiếu với bảng đánh giá (Public OSS, maintainer, stars, forks, releases, community, adoption…).

> **Lưu ý:** Bạn bè có **34 stars** vẫn bị chấm **Yếu** ở forks / contributors / releases / community / external adoption. Repo MyClass hiện **yếu hơn** ở metrics (1 star) nhưng đã có **code depth + CI** tốt. Packaging OSS phải **được push** lên GitHub trước khi submit.

## MyClass vs bảng tiêu chí

| Tiêu chí | Bạn bè (ảnh) | MyClass (API GitHub, chưa push docs) | Sau khi làm nốt (kỳ vọng) | Ghi chú |
|----------|--------------|--------------------------------------|---------------------------|---------|
| Public OSS | Public + MIT — Rất tốt | Public, **LICENSE chưa trên remote** | Public + MIT — Rất tốt | **Phải commit + push** `LICENSE` |
| Primary maintainer | Rất tốt | ✅ (write access owner) | Rất tốt | Form: primary maintainer |
| Project thực sự có code | Rất tốt | ✅ Next.js app đầy đủ | Rất tốt | Không phải empty repo |
| Active maintenance | Tốt | ✅ commits gần đây, CI | Tốt | Giữ nhịp commit/PR |
| Technical depth | Cao — Rất tốt | ✅ auth, soft-delete, VN time, Docker, push | Rất tốt | Điểm mạnh narrative |
| Stars | 34 — TB/thấp | **1** — Yếu | Vẫn TB/thấp nếu không grow | **Không fake stars** |
| Forks | 0 — Yếu | 0 — Yếu | Organic only | Không mua/fake |
| Contributors | 1 — Yếu | 1 — Yếu | ≥2 nếu teammate PR thật | Invite collab + PR nhỏ |
| Releases | 0 — Yếu | 0 — Yếu | **≥1** (`v0.1.0`) | Làm ngay sau push |
| Community issues | Gần như chưa — Yếu | 0 — Yếu | **≥3** good-first + roadmap | Mở issue sau push |
| External adoption | Chưa chứng minh — Yếu | Chưa — Yếu | Demo URL / screenshot / seed | Chứng minh use-case |
| Ecosystem importance | TB | Niche gia sư VN — TB | Narrative niche rõ | Form “why qualifies” |

## Vì sao dễ “báo lỗi” / reject dù có 34 stars?

OpenAI **không** publish hard fail text giống form validation, nhưng scorecard kiểu này khớp Program Terms:

- Cần **signals of usage + active maintenance + ecosystem role**
- Repo “đẹp kỹ thuật” nhưng **không có release / issue / fork / adoption** trông như personal project, không phải OSS maintainer workload
- Stars trung bình **không đủ** nếu các cột community = 0

## Việc đã làm trong repo (local)

- [x] `LICENSE` MIT
- [x] README đúng auth/setup (bỏ OAuth/Resend sai)
- [x] CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG
- [x] Issue templates + PR template
- [x] Draft form: `docs/codex-for-oss-application.md`
- [x] Release body: `docs/release-v0.1.0.md`
- [x] Issue bodies sẵn: `docs/good-first-issues.md`

## Việc **bắt buộc** trên GitHub (không làm bằng edit file)

1. **Push** branch `main` (LICENSE + docs) — nếu không, API vẫn `license: null`
2. Settings → **Description** + **Topics** (copy trong application draft)
3. **Create Release** `v0.1.0` (dùng body trong `docs/release-v0.1.0.md`)
4. Mở **3–4 issues** từ `docs/good-first-issues.md` (label `good first issue`)
5. Security → bật **Private vulnerability reporting**
6. (Tuỳ chọn) Homepage = demo URL production nếu public
7. (Tuỳ chọn) Teammate trong nhóm: 1 PR docs nhỏ → contributor count > 1 (thật)

## Việc **không** làm

- Fake stars / bot forks
- Nói dối download metrics trên form
- Đổi logic app chỉ để “trông OSS hơn”
- Multi-tenant rewrite

## Thứ tự ưu tiên trước submit

```
Push packaging → Release v0.1.0 → Open issues → Topics/description
→ (optional) teammate PR → Submit form với số liệu THẬT
```

Nếu metrics vẫn thấp: **vẫn apply** kèm narrative niche (Program cho phép “explain why”), kỳ vọng approve **thấp–trung bình**; boost adoption rồi re-apply nếu cần.
