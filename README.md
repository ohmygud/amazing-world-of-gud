# THE AMAZING WORLD OF GUD

Un mondo in cui ci sono troppe cose belle da fare per preoccuparsi del portfolio.
*A world with far too many beautiful things to do to worry about a portfolio.*

**▶ Gioca / Play: https://ohmygud.github.io/amazing-world-of-gud/**

| | |
|---|---|
| **THANK GUD IT'S FRIDAY** | arcade a scorrimento: sopravvivi alla settimana lavorativa, poi al weekend, poi il livello segreto · `docs/tgif/` |
| **GUDQUEST** | il CV come un gioco di ruolo da Game Boy, con GUD e Ludo · `docs/quest/` |
| **BANALE CV** | il CV classico, stampabile · `docs/cv/` |
| **TRUCCHI** | comandi e codici segreti · `docs/tricks/` |
| **BRAND KIT** | palette, font GUD Pixel, icone, personaggio · `docs/brand/` |
| **CMS** | pannello per modificare CV, Quest e testi · `docs/admin/` |

## Struttura

```
docs/            il sito pubblicato (GitHub Pages serve questa cartella)
src/             sorgenti: motore di gioco, giochi, pagine, CMS, contenuti predefiniti
  content.default.json   tutti i testi IT/EN del sito
  php/                   API del CMS (serve un hosting con PHP)
tools/           script di build: font, sprite, asset, kit, libreria completa
build_all.sh     ricostruisce tutto dentro docs/
LEGGIMI.md       come mettere il sito su un hosting con PHP (FTP, DNS, CMS)
```

## GitHub Pages e CMS

GitHub Pages pubblica solo file statici, quindi qui il CMS (`/admin`) si apre in **modalità senza server**: modifichi i testi, premi SCARICA e ottieni un `content.json`. Per aggiornare il sito su Pages basta sostituire `docs/content/content.json` nel repository (anche dal sito di GitHub: *Add file → Upload files*).

Su un hosting con PHP (vedi `LEGGIMI.md`) il CMS salva direttamente, carica immagini e video e fa i backup.

## Ricostruire

```sh
python3 -m http.server 8800 --directory docs &   # serve per esportare la libreria
./build_all.sh
```

Servono Node, Python 3 (Pillow, fontTools, skia-pathops) e Playwright con Chromium.

---

© GUD · Giulia Ursenna Dorati Gherardi · [ohmygud.com](https://ohmygud.com) · font VT323 e Press Start 2P con licenza SIL OFL (`docs/fonts/`)
