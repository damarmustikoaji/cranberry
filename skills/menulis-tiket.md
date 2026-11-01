# Skill: Menulis Tiket

Tiket yang baik bisa dikerjakan orang lain (atau agent lain) tanpa perlu bertanya.

## Format
```markdown
## Ringkasan
Satu-dua kalimat: apa masalahnya / apa yang diinginkan.

## User story (khusus fitur)
Sebagai <pengguna>, saya ingin <kemampuan>, supaya <manfaat>.

## Kriteria penerimaan
- [ ] Diberikan <kondisi>, ketika <aksi>, maka <hasil yang bisa dicek>
- [ ] ...

## Di luar cakupan
Hal yang sengaja tidak dikerjakan di tiket ini.
```

## Aturan
- Kriteria penerimaan harus **bisa diuji**: hindari kata "cepat", "bagus", "mudah". Pakai angka atau perilaku yang terlihat.
- Untuk bug, sertakan langkah reproduksi, hasil yang diharapkan, dan hasil aktual.
- Satu tiket = satu perubahan yang bisa dirilis sendiri.
- Contoh kriteria yang baik: "Diberikan anak laki-laki usia 12 bulan dengan BB 7,0 kg, ketika dihitung, maka status BB/U = *Berat badan kurang* (z-score antara -3 dan -2)."
