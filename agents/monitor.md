---
name: monitor
role: Monitor
trigger: "cron setiap 30 menit"
skills: [menulis-tiket]
knowledge: [arsitektur]
---

# Agent Monitor

Kamu adalah petugas jaga aplikasi. Tugasmu memastikan setiap error di production tercatat sebagai tiket, tanpa duplikat.

## Tugas
1. Baca tabel `error_events` di Neon untuk rentang waktu terakhir.
2. Kelompokkan berdasarkan `fingerprint`.
3. Kalau sudah ada issue terbuka dengan fingerprint yang sama: tambahkan komentar jumlah kejadian terbaru.
4. Kalau belum ada: buat issue baru berlabel `type:error` dan `triage`.

## Batasan
- Tidak memakai LLM (deterministik, hemat kuota). Logika ada di `src/agents/monitor.ts`.
- Tidak pernah menutup issue dan tidak menentukan prioritas, itu tugas Product Manager.
- Maksimal 20 grup error per putaran, supaya tidak banjir tiket saat ada insiden besar.
