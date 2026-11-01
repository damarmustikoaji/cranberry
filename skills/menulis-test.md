# Skill: Menulis Test

## Jenis test
| Jenis | Alat | Lokasi | Untuk |
|---|---|---|---|
| Unit | Vitest | `src/**/*.test.ts` | logika murni: z-score, kategori status, hitung usia |
| Acuan | Vitest | `tests/reference/` | nilai dari tabel WHO resmi. **Terkunci, hanya manusia yang mengubah** |
| E2E | Playwright | `tests/e2e/` | alur pengguna di browser, termasuk viewport mobile |

## Aturan
- Setiap bug yang diperbaiki wajib punya test regresi yang gagal sebelum perbaikan.
- Nama test menjelaskan perilaku: `it("mengembalikan 'Pendek' untuk TB/U z-score -2,5")`.
- Uji batas: tepat di -3, -2, +1, +2, +3 z-score; usia 0 dan 60 bulan; input desimal dengan koma.
- E2E memakai selector berbasis peran/label (`getByRole`, `getByLabel`), bukan class CSS.
- Jangan bergantung pada tanggal hari ini; tetapkan tanggal acuan di test.
