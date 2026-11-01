# Skill: Deploy & Rollback

## Deploy
1. Merge PR (squash) ke `master`; Vercel otomatis membuat deployment production.
2. Tunggu status deployment `READY` (maksimal 10 menit).

## Smoke test setelah deploy
- `GET /api/health` → HTTP 200, `{"status":"ok"}`, dan `release` sama dengan commit yang di-merge
- `GET /` → HTTP 200
- `GET /cek-pertumbuhan` → HTTP 200
- Tidak ada lonjakan baris baru di `error_events` dalam 10 menit setelah deploy

## Rollback
1. Promosikan deployment production sebelumnya di Vercel (instant rollback), **atau** buat PR `revert` dari commit tersebut.
2. Buka issue `type:error` `P0` berisi: commit yang di-rollback, hasil smoke test, dan error yang muncul.
3. Label issue asal `needs-human`.
