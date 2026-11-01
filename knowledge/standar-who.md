# Standar Pertumbuhan Anak (WHO / Permenkes 2/2020)

## Sumber
- WHO Child Growth Standards (2006), usia 0–60 bulan, tabel LMS per jenis kelamin
- Permenkes RI No. 2 Tahun 2020 tentang Standar Antropometri Anak (mengadopsi standar WHO)

## Indeks
| Indeks | Arti |
|---|---|
| BB/U | Berat badan menurut umur |
| PB/U atau TB/U | Panjang badan (0–24 bln, berbaring) / tinggi badan (24–60 bln, berdiri) menurut umur |
| BB/PB atau BB/TB | Berat badan menurut panjang/tinggi badan |
| IMT/U | Indeks massa tubuh menurut umur |

## Rumus z-score (metode LMS)
```
Z = ((X / M)^L − 1) / (L × S)        jika L ≠ 0
Z = ln(X / M) / S                     jika L = 0
```
X = nilai terukur, L/M/S = nilai dari tabel untuk usia (atau panjang/tinggi) dan jenis kelamin tersebut.
Untuk BB/U, BB/PB, BB/TB, dan IMT/U, WHO menyesuaikan perhitungan di luar rentang ±3 SD; ikuti prosedur WHO, jangan disederhanakan.

## Koreksi pengukuran
- Anak < 24 bulan yang diukur berdiri: tambahkan 0,7 cm
- Anak ≥ 24 bulan yang diukur berbaring: kurangi 0,7 cm

## Kategori status (Permenkes 2/2020)
| Indeks | Kategori | Ambang z-score |
|---|---|---|
| BB/U | Berat badan sangat kurang | < -3 |
| | Berat badan kurang | -3 s.d. < -2 |
| | Berat badan normal | -2 s.d. +1 |
| | Risiko berat badan lebih | > +1 |
| PB/U, TB/U | Sangat pendek | < -3 |
| | Pendek | -3 s.d. < -2 |
| | Normal | -2 s.d. +3 |
| | Tinggi | > +3 |
| BB/PB, BB/TB | Gizi buruk | < -3 |
| | Gizi kurang | -3 s.d. < -2 |
| | Gizi baik (normal) | -2 s.d. +1 |
| | Berisiko gizi lebih | > +1 s.d. +2 |
| | Gizi lebih | > +2 s.d. +3 |
| | Obesitas | > +3 |

> ⚠️ Tabel di atas adalah ringkasan untuk konteks agent. Sumber kebenaran adalah dokumen resmi dan file di `data/who/`, yang hanya boleh diubah manusia setelah dicek ulang.

## Perhitungan usia
- Usia dalam bulan penuh. Gunakan tanggal pengukuran, bukan tanggal hari ini, kalau pengguna mengisinya.
- Hindari selisih zona waktu: hitung dengan tanggal kalender lokal, bukan timestamp.
