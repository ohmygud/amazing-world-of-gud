/* =====================================================================
   GUDQUEST — CV CONTENT (IT / EN). Edit freely: everything in the game
   and in the "CV rapido" panel is generated from this block.
   ===================================================================== */
const CONTACTS = [
  { k: 'site', label: 'OHMYGUD.COM', url: 'https://ohmygud.com' },
  { k: 'mail', label: 'EMAIL', url: 'mailto:goldengud@gmail.com', show: 'goldengud@gmail.com' },
  { k: 'ig', label: 'INSTAGRAM @TYPODIVA', url: 'https://www.instagram.com/typodiva/' },
  { k: 'in', label: 'LINKEDIN', url: 'https://www.linkedin.com/in/ohmygud/' }
];
const L = (it, en) => ({ it, en });
const CV = {
  name: 'GUD', full: 'Giulia Ursenna Dorati Gherardi',
  role: L('Creative director, type designer, docente, curatrice, autrice. Firenze.', 'Creative director, type designer, teacher, curator, writer. Florence.'),
  education: [
    L('ISIA Firenze, 2015. Diploma Accademico di I livello in Disegno Industriale.', 'ISIA Florence, 2015. First-level Academic Diploma in Industrial Design.'),
    L('IED Firenze, 2016. Specializzazione in Grafica per l\'Editoria.', 'IED Florence, 2016. Specialisation in Editorial Graphic Design.'),
    L('IED Firenze, 2018. Master in Typography, Calligraphy & Font Design.', 'IED Florence, 2018. Master in Typography, Calligraphy & Font Design.')
  ],
  languages: L('Italiano madrelingua. Inglese C1. Francese A1. Coreano A1.', 'Italian native. English C1. French A1. Korean A1.'),
  sections: {
    teaching: {
      title: L('Insegnamento', 'Teaching'), place: L('ACCADEMIA', 'ACADEMY'),
      badge: L('MEDAGLIA GRIGLIA', 'GRID BADGE'),
      summary: L('GUD insegna dal 2016: IED, TheSign, Lorenzo de\' Medici, ISIA Firenze. Con i suoi studenti progetta per aziende e istituzioni vere.',
        'GUD has been teaching since 2016: IED, TheSign, Lorenzo de\' Medici, ISIA Florence. With her students she designs for real companies and institutions.'),
      items: [
        { t: 'IED FIRENZE', d: L('Master in Graphic Design (New Media). Docente di Graphic Design, 2020-2024.', 'Master in Graphic Design (New Media). Graphic Design teacher, 2020-2024.') },
        { t: 'THESIGN ACADEMY', d: L('Comics & Arts Academy, corso di Graphic Design. Docente di Visual Design & Typography, 2022-2026.', 'Comics & Arts Academy, Graphic Design course. Visual Design & Typography teacher, 2022-2026.') },
        { t: 'LORENZO DE\' MEDICI', d: L('Istituto Lorenzo de\' Medici. Graphic Design, Web Design, Portfolio Review e Visual Design, 2022-2024.', 'Lorenzo de\' Medici Institute. Graphic Design, Web Design, Portfolio Review and Visual Design, 2022-2024.') },
        { t: 'ISIA FIRENZE', d: L('Workshop "Brividi": progettazione grafica, metodologia, orientamento. 2016-2026.', '"Brividi" workshop: graphic design, methodology, orientation. 2016-2026.') },
        { t: 'CHINESE PRE ACADEMY', d: L('Chinese Pre Academy School, docente di Visual Art, 2019/2020.', 'Chinese Pre Academy School, Visual Art teacher, 2019/2020.') },
        { t: 'WORKSHOP', d: L('Workshop di lettering, tipografia e progettazione grafica in tutta Italia, dal 2017.', 'Lettering, typography and graphic design workshops across Italy, since 2017.') },
        { t: 'METODO', d: L('Ricerca teorica, sperimentazione e pratica professionale. Il designer come autore di sistemi ed esperienze.', 'Theory, experimentation and professional practice. The designer as an author of systems and experiences.') }
      ]
    },
    studio: {
      title: L('Studio e clienti', 'Studio and clients'), place: L('STUDIO ERGONAUTH', 'ERGONAUTH STUDIO'),
      badge: L('MEDAGLIA VETTORE', 'VECTOR BADGE'),
      summary: L('Ergonauth è lo studio di GUD dal 2016. Tra clienti e partner: Disney, Mondadori, Jaguar Land Rover, Artribune, Comune di Firenze.',
        'Ergonauth has been GUD\'s studio since 2016. Clients and partners include Disney, Mondadori, Jaguar Land Rover, Artribune and the City of Florence.'),
      items: [
        { t: 'ERGONAUTH S.A.S.', d: L('Studio fondato a Firenze nel 2016. GUD è socia fondatrice, CEO e Creative Director.', 'Studio founded in Florence in 2016. GUD is co-founder, CEO and Creative Director.') },
        { t: 'THE WALT DISNEY COMPANY', d: L('Milano, 2018-2019. Lettering artist e illustratrice per Art of Hand Lettering.', 'Milan, 2018-2019. Lettering artist and illustrator for Art of Hand Lettering.') },
        { t: 'GRUPPO MONDADORI', d: L('Con TheSign Academy, 2024. Direzione artistica.', 'With TheSign Academy, 2024. Art direction.') },
        { t: 'JAGUAR LAND ROVER', d: L('Con IED Firenze, 2023. Art direction per i 75 anni del Defender: la livrea.', 'With IED Florence, 2023. Art direction for the Defender 75th anniversary livery.') },
        { t: 'ARTRIBUNE', d: L('Con il Master in Graphic Design di IED Firenze, 2023. Art direction.', 'With the IED Florence Master in Graphic Design, 2023. Art direction.') },
        { t: 'COMUNE DI FIRENZE', d: L('Estate Fiorentina 2022. Visual design della campagna istituzionale, realizzata con l\'intelligenza artificiale.', 'Estate Fiorentina 2022. Visual design of the city campaign, made with artificial intelligence.') },
        { t: 'SPENCER', d: L('Con IED Firenze, 2021. Project management: il visual storytelling dei volontari Covid-19.', 'With IED Florence, 2021. Project management: visual storytelling of Covid-19 volunteers.') },
        { t: 'BRANDING E NAMING', d: L('Identità e naming per aziende e agenzie, come NTC.', 'Identity and naming for companies and agencies, such as NTC.') }
      ]
    },
    lucca: {
      title: L('Lucca Comics & Games', 'Lucca Comics & Games'), place: L('LUCCA CREA', 'LUCCA CREA'),
      badge: L('MEDAGLIA MURA', 'WALLS BADGE'),
      summary: L('Dal 2023 GUD guida la comunicazione di Lucca Crea. Per i 60 anni del festival ha firmato art direction, progetto e mostra.',
        'Since 2023 GUD has led communication for Lucca Crea. For the festival\'s 60th anniversary she signed art direction, project and exhibition.'),
      items: [
        { t: 'LUCCA CREA', d: L('Dal 2023: art director, communication consultant e project manager.', 'Since 2023: art director, communication consultant and project manager.') },
        { t: 'LCG60', d: L('Art direction, project management e curatela per i 60 anni di Lucca Comics & Games, 2025-2026.', 'Art direction, project management and curation for the 60th anniversary of Lucca Comics & Games, 2025-2026.') },
        { t: 'LUCCA LEGACY', d: L('A Comics & Games Story. Mostra inaugurata il 3 ottobre 2026: Legacy Board, The Vault, Tree of Strips, Cover Story. Progetto visivo e cura editoriale.', 'A Comics & Games Story. Exhibition opened on 3 October 2026: Legacy Board, The Vault, Tree of Strips, Cover Story. Visual design and editorial curation.') },
        { t: 'TALK LCG 2023', d: L('Relatrice: intelligenza artificiale e progettazione grafica.', 'Speaker: artificial intelligence and graphic design.') },
        { t: 'COMUNICAZIONE', d: L('Comunicazione istituzionale e LinkedIn per Lucca Crea e Lucca Comics & Games.', 'Institutional communication and LinkedIn for Lucca Crea and Lucca Comics & Games.') }
      ]
    },
    type: {
      title: L('Type design', 'Type design'), place: L('FONDERIA TYPODIVA', 'TYPODIVA FOUNDRY'),
      badge: L('MEDAGLIA GLIFO', 'GLYPH BADGE'),
      summary: L('Typodiva è il type design di GUD: lettere disegnate, strumenti costruiti in codice, una comunità a TypeThursday.',
        'Typodiva is GUD\'s type design: drawn letters, tools built in code, a community at TypeThursday.'),
      items: [
        { t: 'TYPODIVA', d: L('Il marchio di type design di GUD.', 'GUD\'s type design label.') },
        { t: 'MASTER', d: L('Master in Typography, Calligraphy & Font Design, IED Firenze, 2018.', 'Master in Typography, Calligraphy & Font Design, IED Florence, 2018.') },
        { t: 'STRUMENTI', d: L('Glyphs, RoboFont, fontTools. E codice, tanto codice.', 'Glyphs, RoboFont, fontTools. And code, lots of code.') },
        { t: 'TYPETHURSDAY FIRENZE', d: L('Dialogue Lead dal 2019. Autrice e ideatrice di TGITT.', 'Dialogue Lead since 2019. Author and creator of TGITT.') },
        { t: 'OHMYFONT', d: L('Un corso di tipografia: programma e progetto didattico.', 'A typography course: syllabus and teaching project.') },
        { t: 'TYPOGRAPHY TAROT', d: L('22 Arcani Maggiori, 22 principi tipografici.', '22 Major Arcana, 22 typographic principles.') },
        { t: 'TOOL IN CODICE', d: L('FONTain, visualizzatore tipografico ad acqua. Un generatore di schermate Televideo. Un generatore di cruciverba.', 'FONTain, a typographic water visualiser. A Televideo screen generator. A crossword generator.') }
      ]
    },
    gallery: {
      title: L('Curatela e arte', 'Curation and art'), place: L('GALLERIA', 'GALLERY'),
      badge: L('MEDAGLIA CORNICE', 'FRAME BADGE'),
      summary: L('GUD cura mostre e progetti culturali: dal segno di Roberto Innocenti al fumetto italiano contemporaneo.',
        'GUD curates exhibitions and cultural projects: from Roberto Innocenti\'s drawings to contemporary Italian comics.'),
      items: [
        { t: 'ROBERTO INNOCENTI', d: L('Dal Sogno al Segno, Scandicci. Curatela e art direction della mostra.', 'Dal Sogno al Segno, Scandicci. Curation and art direction of the exhibition.') },
        { t: 'NERO SU BIANCO', d: L('Serate di fumetto italiano contemporaneo al Caffè Letterario Le Murate, Firenze.', 'Contemporary Italian comics evenings at Caffè Letterario Le Murate, Florence.') },
        { t: 'SKYN MAP', d: L('Web app artistica: trasforma i segni della pelle in costellazioni. Project by GUD.', 'Artistic web app: turns skin marks into constellations. Project by GUD.') },
        { t: 'WHY FESTIVAL', d: L('Professionista e divulgatrice.', 'Professional and speaker.') },
        { t: 'THANK GUD IT\'S FRIDAY', d: L('Un arcade pixel art girlpop: GUD sopravvive alla settimana lavorativa. Lo trovi sul sito.', 'A girlpop pixel arcade: GUD survives the working week. Find it on the website.') }
      ]
    },
    library: {
      title: L('Scrittura', 'Writing'), place: L('BIBLIOTECA', 'LIBRARY'),
      badge: L('MEDAGLIA INCHIOSTRO', 'INK BADGE'),
      summary: L('GUD scrive da sempre: saggi sulla tipografia, prosa lirica, rubriche, testi per la cultura.',
        'GUD has always written: essays on typography, lyric prose, columns, texts for culture.'),
      items: [
        { t: 'FONT DI POTERE', d: L('Tipografia, norma e dissidenza visiva nel design contemporaneo. Saggio, ISIA Journal, Firenze.', 'Typography, norm and visual dissent in contemporary design. Essay, ISIA Journal, Florence.') },
        { t: 'THE CRYSTAL GOBLET', d: L('Prosa lirica. Un archivio di scrittura attivo dal 2009, anche su ohmygud.com.', 'Lyric prose. A writing archive active since 2009, also on ohmygud.com.') },
        { t: 'POSTA DEL KUORE', d: L('La rubrica di consigli firmata Vodka Madonna.', 'The advice column signed Vodka Madonna.') },
        { t: 'COPYWRITING', d: L('Testi editoriali e istituzionali per la cultura, dalla critica ai social.', 'Editorial and institutional writing for culture, from criticism to social media.') },
        { t: 'LINGUE', d: L('Italiano madrelingua. Inglese C1. Francese A1. Coreano A1.', 'Italian native. English C1. French A1. Korean A1.') }
      ]
    }
  }
};
const SECTION_ORDER = ['teaching', 'studio', 'lucca', 'type', 'gallery', 'library'];

/* GUDMON — GUD's passions, catchable in the tall grass */
const MONS = [
  { n: 'KERNIX', l: 'K', c: 'P', a: 'glasses', type: L('TIPO', 'TYPE'), d: L('Ama lo spazio tra le lettere più delle lettere stesse. La tipografia è il primo amore di GUD.', 'Loves the space between letters more than the letters. Typography is GUD\'s first love.') },
  { n: 'GLYPHO', l: 'G', c: 'Y', a: 'spark', type: L('DESIGN', 'DESIGN'), d: L('Nasce in Glyphs, cresce in RoboFont, si allena con fontTools. È il type design di Typodiva.', 'Born in Glyphs, raised in RoboFont, trained with fontTools. It is Typodiva\'s type design.') },
  { n: 'INKLINA', l: 'L', c: 'B', a: 'nib', type: L('MANO', 'HAND'), d: L('Disegna lettere a mano libera. Ha fatto la lettering artist per Disney.', 'Draws letters by hand. Worked as a lettering artist for Disney.') },
  { n: 'BALLOONA', l: 'F', c: 'W', a: 'bubble', type: L('FUMETTO', 'COMICS'), d: L('Vive tra le vignette del fumetto italiano. Habitat naturale: Lucca.', 'Lives inside Italian comics panels. Natural habitat: Lucca.') },
  { n: 'POPPY', l: 'P', c: 'Y', a: 'crown', type: L('POP', 'POP'), d: L('Mangia pop culture a colazione: icone, giochi, cosplay. Alta e bassa cultura nello stesso piatto.', 'Eats pop culture for breakfast: icons, games, cosplay. High and low culture on the same plate.') },
  { n: 'CRITIKO', l: 'C', c: 'K', a: 'glasses', type: L('TEORIA', 'THEORY'), d: L('Legge teoria letteraria e critica. Quando ti guarda, ti sta analizzando.', 'Reads literary and critical theory. When it looks at you, it is analysing you.') },
  { n: 'CONCETTA', l: 'A', c: 'W', a: 'beret', type: L('ARTE', 'ART'), d: L('Arte concettuale: l\'idea prima dell\'oggetto. A volte è solo un piedistallo vuoto.', 'Conceptual art: the idea before the object. Sometimes just an empty pedestal.') },
  { n: 'CODELLA', l: '/', c: 'B', a: 'spark', type: L('CODICE', 'CODE'), d: L('Scrive codice per creare strumenti: FONTain, Televideo, cruciverba, automazioni. E questo gioco.', 'Writes code to make tools: FONTain, Televideo, crosswords, automations. And this game.') },
  { n: 'PROFFY', l: 'I', c: 'P', a: 'cap', type: L('SCUOLA', 'SCHOOL'), d: L('Insegna dal 2016. Trasforma i brief in metodo e gli studenti in progettisti.', 'Teaching since 2016. Turns briefs into method and students into designers.') },
  { n: 'ARCHIVIA', l: 'R', c: 'B', a: 'book', type: L('ARCHIVIO', 'ARCHIVE'), d: L('Colleziona archivi: 60 anni di poster, premi e interviste di Lucca Comics & Games.', 'Collects archives: 60 years of Lucca Comics & Games posters, awards and interviews.') },
  { n: 'CURATRIX', l: 'M', c: 'Y', a: 'beret', type: L('MOSTRE', 'SHOWS'), d: L('Cura mostre: mette in fila le storie e le fa respirare nello spazio.', 'Curates exhibitions: lines up stories and lets them breathe in space.') },
  { n: 'PENNINA', l: 'W', c: 'P', a: 'nib', type: L('PAROLE', 'WORDS'), d: L('Scrive prosa lirica, critica e una posta del cuore. Archivio attivo dal 2009.', 'Writes lyric prose, criticism and an agony aunt column. Archive active since 2009.') },
  { n: 'GUDHEART', l: '♥', c: 'Y', a: 'crown', type: L('AMORE', 'LOVE'), d: L('Leggendario. Il segreto di GUD: fare le cose con amore. E con un po\' di ironia.', 'Legendary. GUD\'s secret: do things with love. And a little irony.') }
];

/* UI strings */
const TXT = {
  pressStart: L('PREMI START', 'PRESS START'),
  newGame: L('NUOVA PARTITA', 'NEW GAME'), cont: L('CONTINUA', 'CONTINUE'), quick: L('CV RAPIDO', 'QUICK CV'),
  menu: [L('GUDDEX', 'GUDDEX'), L('GUD', 'GUD'), L('ZAINO', 'BAG'), L('CV RAPIDO', 'QUICK CV'), L('LINGUA', 'LANGUAGE'), L('SALVA', 'SAVE'), L('ESCI', 'EXIT')],
  fight: L('LOTTA', 'FIGHT'), bag: L('ZAINO', 'BAG'), catchT: L('CATTURA', 'CATCH'), run: L('FUGA', 'RUN'),
  yes: L('SÌ', 'YES'), no: L('NO', 'NO'),
  saved: L('Partita salvata!', 'Game saved!'),
  hint: L('Frecce: muovi. A (Z/Spazio): parla. B (X): indietro. START (Invio): menu.', 'Arrows: move. A (Z/Space): talk. B (X): back. START (Enter): menu.'),
  hintMob: L('Croce: muovi. A: parla. B: indietro. START: menu.', 'D-pad: move. A: talk. B: back. START: menu.')
};
const PROF_INTRO = [
  L('Ciao! Benvenuto nel mondo della comunicazione visiva!', 'Hello there! Welcome to the world of visual communication!'),
  L('Mi chiamo PROF. SERIF. Studio le lettere. Quelle che prendono vita le chiamiamo GUDMON.', 'My name is PROF. SERIF. I study letters. The ones that come alive we call GUDMON.'),
  L('Questa è GUD. Art director, type designer, docente, curatrice, autrice.', 'This is GUD. Art director, type designer, teacher, curator, writer.'),
  L('Il suo sito è in costruzione. La sua storia invece è qui, in questa città.', 'Her website is under construction. Her story, though, is right here in this town.'),
  L('Entra negli edifici e parla con tutti. Vinci 6 medaglie. Cattura i GUDMON nell\'erba alta: sono le sue passioni.', 'Enter the buildings and talk to everyone. Win 6 badges. Catch GUDMON in the tall grass: they are her passions.'),
  L('Il viaggio nel CV di GUD sta per cominciare!', 'Your journey through GUD\'s CV is about to begin!')
];
