# THE AMAZING WORLD OF GUD — come metterlo online

Questo pacchetto è il sito completo per **ohmygud.com**, al posto di Readymag:

- **benvenuto** nell'Amazing World of GUD, poi **TGIF**;
- la barra sempre visibile: **ESPLORA IL CV** (scelta tra **GUDQUEST** e **BANALE CV**), **TRUCCHI**, **HACK**, **AUDIO**, **IT/EN**;
- il pannello **CMS** in `/admin` per modificare CV, Quest, GUDMON, testi e media;
- la guida del brand in `/brand` e i pacchetti da scaricare in `/downloads`.

Non serve un database. Serve un hosting con **PHP 7.4 o più recente** (meglio PHP 8). Quasi tutti gli hosting classici ce l'hanno: Aruba, SiteGround, Register, Netsons, Hostinger, OVH, Serverplan e simili.

---

## 1. Cosa c'è nella cartella `ohmygud.com`

| Cartella | Cosa contiene |
|---|---|
| `index.html` | la home: benvenuto, TGIF e la barra in alto |
| `tgif/` | il gioco TGIF (versione desktop e mobile) |
| `quest/` | GUDQUEST (desktop e mobile) |
| `cv/` | il BANALE CV, stampabile in PDF |
| `tricks/` | i trucchi, in italiano e inglese |
| `admin/` | il pannello CMS |
| `api/` | il piccolo motore PHP del CMS |
| `content/` | **i tuoi contenuti**: `content.json` (tutti i testi) e `media/` (immagini e video caricati) |
| `assets/`, `fonts/`, `brand/`, `downloads/` | personaggio, icone, font, palette, guida del brand, zip |
| `.htaccess` | impostazioni del server (file nascosto: va caricato anche lui) |

Il CMS crea da solo una cartella privata `_data/` con password e backup automatici. Non è raggiungibile dal web.

---

## 2. Caricare il sito via FTP

1. Scarica **FileZilla** (gratis) da filezilla-project.org.
2. Prendi dall'hosting i dati FTP: server, utente, password. Di solito stanno nel pannello, alla voce "FTP" o "Accesso FTP".
3. In FileZilla vai su **Server → Forza la visualizzazione dei file nascosti**. Senza questo passaggio `.htaccess` e `api/.user.ini` non vengono caricati.
4. A destra apri la cartella pubblica del sito. Di solito si chiama `public_html`, `htdocs`, `www` o `httpdocs`.
5. A sinistra apri la cartella **`ohmygud.com`** di questo pacchetto, selezionane **tutto il contenuto** e trascinalo a destra. Va trascinato il contenuto, non la cartella.
6. Alla fine sul server devi vedere `index.html`, `admin/`, `api/`, `content/` e le altre cartelle direttamente dentro `public_html`.

**Permessi.** Di solito vanno già bene. Se il CMS dice "controlla i permessi delle cartelle":

- cartelle `content/` e `content/media/`: **755** (se l'errore resta, **775**);
- la cartella principale del sito deve permettere al CMS di creare `_data/`. In alternativa creala tu via FTP, vuota, con permessi 755;
- i file restano a **644**.

In FileZilla si cambiano con tasto destro → "Permessi file".

---

## 3. Collegare il dominio ohmygud.com (DNS)

Il dominio è registrato in un posto diverso dall'hosting. Quindi va detto al dominio di puntare al nuovo hosting.

1. Nel pannello dell'**hosting** trova l'**indirizzo IP** del tuo spazio. Cerca la voce "IP condiviso", "IP del server" o "Record A consigliato". Aggiungi **ohmygud.com** come dominio del sito (a volte si chiama "dominio esterno", "dominio aggiuntivo" o "addon domain").
2. Nel pannello **dove hai comprato il dominio** apri la gestione **DNS** e:
   - **cancella i record di Readymag**. Sono i record A o CNAME di `@` e `www` che oggi puntano a Readymag;
   - aggiungi un record **A**: nome `@` (o vuoto), valore = **IP dell'hosting**;
   - aggiungi un record **CNAME**: nome `www`, valore = `ohmygud.com.` In alternativa usa un record A `www` con lo stesso IP.
3. **Non toccare** i record **MX** e **TXT** se usi una mail con il dominio, altrimenti la posta smette di arrivare.
4. Aspetta: di solito bastano 15–60 minuti, al massimo 24–48 ore.
5. Quando il sito risponde, nel pannello hosting attiva il **certificato SSL gratuito (Let's Encrypt)**, così il sito va in **https**. Usa il CMS sempre in https, così la password viaggia protetta.

> Un'alternativa è cambiare i **nameserver** del dominio con quelli dell'hosting, così da lì in poi gestisci tutto lì. È più semplice, ma sposta anche la gestione della posta: fallo solo se sai che la mail del dominio non c'è o la sposti anche tu.

---

## 4. Primo accesso al CMS

1. Vai su **ohmygud.com/admin** (oppure scrivi **`gudmin`** nel tasto **HACK** del sito).
2. La prima volta ti chiede di **creare la password**: almeno 8 caratteri. **Segnatela.**
3. Fatto. Dopo 5 password sbagliate il pannello si blocca per 10 minuti.

Il codice `gudmin` si cambia in **IMPOSTAZIONI**. Ricorda che è solo una scorciatoia: la porta resta chiusa dalla password.

### Come si usa

- **CV & QUEST**: ogni capitolo è una sezione del BANALE CV e un edificio di GUDQUEST, con capo palestra, nemico e medaglia. **+ NUOVO CAPITOLO** crea un edificio nuovo in un quartiere nuovo, a sud di Lucca.
- Dentro ogni capitolo ci sono le **voci**. A ciascuna aggiungi:
  - **immagini**: JPG, PNG, GIF, WEBP. Le foto vengono ridotte da sole a 2400 px;
  - **video MP4**;
  - link **YouTube / Vimeo**;
  - **pagine web**.
- Nella Quest gli oggetti con dei media **luccicano**. Quando li esamini, GUD chiede "Vuoi vedere il progetto?". Nel BANALE CV compare il tasto **VEDI PROGETTO**.
- **GUDMON**: crei o modifichi le passioni, con anteprima dal vivo (colore, lettera, accessorio).
- **TESTI**: benvenuto, TGIF (feedback, spiaggia...), Quest e CV, tutto in IT/EN.
- **PROFILO**: nome, ruolo, studi, lingue, contatti.
- **MEDIA**: tutti i file caricati.
- **💾 PUBBLICA** (o Ctrl/Cmd+S) mette online le modifiche. Prima di ogni pubblicazione il server salva un **backup** automatico: gli ultimi 40 si ritrovano in IMPOSTAZIONI → BACKUP. La bozza resta salvata anche nel browser.

### Limite dei video

Il file `api/.user.ini` chiede al server di accettare file fino a 256 MB. Alcuni hosting hanno un limite più basso: lo vedi nella pagina **MEDIA**. Per video lunghi è meglio YouTube o Vimeo, che sono anche più veloci da guardare.

### Pagine web nei progetti

Alcuni siti (Instagram, Behance, giornali) non si lasciano mostrare dentro un'altra pagina. In quel caso la finestra mostra comunque il tasto **APRI ↗**.

---

## 5. Aggiornare o traslocare

- **Se un giorno ricarichi i file del sito**, non sovrascrivere mai `content/` e `_data/`: lì ci sono i tuoi testi, i tuoi media e la password.
- **Cambiare hosting**:
  1. IMPOSTAZIONI → **ESPORTA TUTTO (ZIP)**. Contiene testi e media;
  2. carica il sito sul nuovo hosting come al punto 2;
  3. entra in /admin, crea la password;
  4. **IMPORTA** lo zip.
- **Senza PHP** (per esempio un hosting solo statico): il CMS si apre in "modalità senza server". Modifichi i testi, premi SCARICA, e carichi via FTP il `content.json` in `/content/`. I file vanno caricati via FTP in `/content/media/` e collegati come `media/nomefile.jpg`.

---

## 6. Il personaggio e il brand

- **ohmygud.com/brand**: guida viva con palette, font, icone e GUD in tutte le pose.
- **gud-character-pack.zip**: GUD in PNG (1×, 4×, 8×), SVG, sprite sheet + JSON e GIF animate.
- **gud-brand-kit.zip**:
  - font **GUD Pixel** (OTF/TTF/WOFF/WOFF2), VT323 e Press Start 2P, con le loro licenze OFL;
  - palette in CSS, JSON, GPL e ASE;
  - tutte le icone in SVG e PNG.

I due zip sono anche dentro il sito, in `/downloads/`.

---

## 7. Da ricontrollare

- Email e Instagram nei contatti: **goldengud@gmail.com** e **@typodiva**. Se sono diversi, li cambi da **PROFILO**.
- I testi vengono dal documento rivisto. Ogni ritocco ora si fa dal CMS, senza toccare il codice.

---

## Per chi mette le mani nel codice

La cartella `sorgenti/` contiene il progetto. `./build_all.sh` rigenera tutto in `site/`. Servono Node e Python 3 con Pillow, fontTools e skia-pathops, più Playwright/Chromium per esportare gli sprite. I testi predefiniti sono in `src/content.default.json`.
