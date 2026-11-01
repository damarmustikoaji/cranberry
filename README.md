# 🍒 cranberry

Tim AI agent yang bekerja di repo aplikasi lewat GitHub Issues dan GitHub Actions, memakai LLM free tier.
Aplikasi pertama yang dikerjakan: **Teman Buku Pink** ([mustard-apple](https://github.com/damarmustikoaji/mustard-apple)).

## Alur kerja

```
error_events (Neon) ──► Monitor ──► Issue [triage]
                                       │
                         Product Manager ──► [needs-analysis]
                                       │
                          System Analyst ──► [ready-dev]
                                       │
                               Developer ──► PR  [in-review]      (belum aktif)
                                       │
                                      QA ──► [ready-deploy]       (belum aktif)
                                       │
                                  DevOps ──► deploy, [done]       (belum aktif)

Kapan pun ragu/gagal ──► [needs-human]
```

Semua tiket ada di Issues **mustard-apple**. Repo ini hanya berisi "otak" agent.

## Struktur

| Folder | Isi |
|---|---|
| `agents/` | profil tiap agent: peran, pemicu, tugas, batasan. Frontmatter menentukan skill & knowledge yang dimuat |
| `skills/` | SOP: cara menulis tiket, analisis bug, membuat PR, menulis test, deploy |
| `knowledge/` | pengetahuan proyek: produk, arsitektur, standar WHO, aturan keamanan (selalu dimuat) |
| `src/llm/` | provider Gemini, GitHub Models, Groq dengan fallback otomatis saat kuota habis |
| `src/tools/` | akses GitHub API dan tabel `error_events` di Neon |
| `src/agents/` | logika agent |
| `.github/workflows/run-agent.yml` | reusable workflow yang dipanggil repo aplikasi |

Kalau agent sering salah, perbaiki dulu file `.md`-nya, bukan kodenya.

## Status

| Agent | Status |
|---|---|
| monitor | ✅ berjalan (tanpa LLM) |
| product-manager | ✅ berjalan |
| system-analyst | ✅ berjalan (belum membaca kode, hanya struktur folder) |
| developer, qa, devops | 🚧 belum aktif, issue dialihkan ke `needs-human` |

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env    # isi token & API key
DRY_RUN=1 node --env-file=.env --import tsx src/run-agent.ts --agent product-manager --issue 1
```

`DRY_RUN=1` hanya mencetak apa yang akan dilakukan, tanpa menulis ke GitHub.

## Secrets yang dibutuhkan di repo aplikasi

| Secret | Dari mana |
|---|---|
| `BOT_TOKEN` | fine-grained PAT (atau GitHub App) dengan izin Issues, Pull requests, Contents: Read & Write di mustard-apple. **Jangan pakai `GITHUB_TOKEN`**, karena label yang dipasang dengan token itu tidak memicu workflow agent berikutnya |
| `GEMINI_API_KEY` | Google AI Studio (gratis) |
| `GROQ_API_KEY` | console.groq.com (gratis, opsional) |
| `DATABASE_URL` | Neon, untuk agent monitor |

GitHub Models memakai `GITHUB_TOKEN` bawaan Actions dengan `permissions: models: read`, jadi tidak perlu secret tambahan.

## Pengembangan

```bash
npm run typecheck
npm test
```
