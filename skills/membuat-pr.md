# Skill: Membuat Pull Request

## Branch & commit
- Branch: `agent/<nomor-issue>-<slug-pendek>`, contoh `agent/12-validasi-berat-desimal`
- Commit memakai Conventional Commits: `fix: ...`, `feat: ...`, `test: ...`, `docs: ...`, `chore: ...`
- Satu PR = satu issue.

## Ukuran
- Maksimal 10 file dan 400 baris berubah. Lebih dari itu: berhenti dan minta tiket dipecah.

## Deskripsi PR
```markdown
Fixes #<nomor>

## Perubahan
- ...

## Cara menguji
- ...

## Checklist
- [ ] lint, typecheck, dan unit test lulus
- [ ] test baru untuk perilaku yang diubah
- [ ] tidak menyentuh folder terkunci
```

## Dilarang
- Mematikan, melewati (`skip`), atau melemahkan test supaya lulus.
- Menambah dependency baru tanpa disebut di rencana teknis.
