# Arsitektur Aplikasi (repo mustard-apple)

> Rencana struktur. Perbarui file ini setiap kali struktur repo aplikasi berubah.

## Stack
- Next.js (App Router) + TypeScript, Tailwind CSS
- Vitest (unit), Playwright (e2e)
- Deploy: Vercel Hobby. Setiap PR mendapat URL preview.
- Neon Postgres: **hanya** tabel `error_events` untuk log error
- CI: GitHub Actions. Branch utama: `master`

## Struktur folder
```
mustard-apple/
├─ app/
│  ├─ page.tsx                  # beranda
│  ├─ cek-pertumbuhan/page.tsx  # form + hasil + kurva
│  └─ api/
│     ├─ health/route.ts        # smoke test DevOps
│     └─ errors/route.ts        # menerima laporan error dari browser → error_events
├─ components/                  # komponen UI (form, kartu hasil, grafik)
├─ lib/
│  ├─ growth/                   # logika murni: usia, z-score (metode LMS), kategori status
│  └─ error-logger.ts           # kirim error ke /api/errors
├─ data/who/                    # 🔒 tabel LMS WHO (JSON)
├─ content/medis/               # 🔒 isi panduan (Markdown)
├─ tests/
│  ├─ reference/                # 🔒 test acuan nilai WHO
│  └─ e2e/                      # Playwright
└─ .github/workflows/           # 🔒 CI + pemanggil agent cranberry
```

## Tabel error_events
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigserial | |
| fingerprint | text | hash dari pesan + frame pertama stack, untuk pengelompokan |
| message | text | |
| stack | text | |
| path | text | halaman tempat error terjadi |
| release | text | commit SHA (`VERCEL_GIT_COMMIT_SHA`) |
| user_agent | text | |
| created_at | timestamptz | default `now()` |

Tidak boleh ada data pengguna (input berat/tinggi, tanggal lahir) yang ikut dikirim ke tabel ini.
