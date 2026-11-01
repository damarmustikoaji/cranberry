# Skill: Analisis Bug

## Langkah
1. **Pahami gejala**: pesan error, halaman, rilis, perangkat, seberapa sering.
2. **Baca stack trace dari atas**: cari frame pertama yang berada di kode aplikasi (bukan `node_modules`).
3. **Susun hipotesis** (maksimal 3), urutkan dari yang paling mungkin.
4. **Cara membuktikan**: test atau langkah reproduksi untuk setiap hipotesis.
5. **Usulan perbaikan** dan test regresi yang mencegahnya terulang.

## Pola penyebab umum di aplikasi ini
- Input kosong / bukan angka / desimal pakai koma (`7,5`) di form kalkulator
- Usia di luar rentang tabel WHO (di bawah 0 atau di atas 60 bulan)
- Perbedaan zona waktu saat menghitung usia dari tanggal lahir
- Komponen grafik dirender di server padahal butuh `window` (harus komponen client)
- Fitur browser yang tidak ada di Safari/iOS lama

## Format hasil
```markdown
## Dugaan akar masalah
## Bukti / cara reproduksi
## Rencana perbaikan
## Test yang perlu ditambah
```
