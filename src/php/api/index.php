<?php
/* =====================================================================
   GUD CMS API — one small PHP file, no database.
   Content lives in ../content/content.json (public, read by the site).
   Uploaded media in ../content/media/. Private stuff in ../_data/.
   ===================================================================== */
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

const MAX_JSON = 4 * 1024 * 1024;            // 4 MB of text is a LOT of CV
const MAX_BACKUPS = 40;
const IMG_EXT = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif', 'webp' => 'image/webp'];
const VID_EXT = ['mp4' => 'video/mp4', 'webm' => 'video/webm'];

$ROOT = dirname(__DIR__);
$CONTENT = $ROOT . '/content/content.json';
$MEDIA = $ROOT . '/content/media';
$DATA = $ROOT . '/_data';
$AUTH = $DATA . '/auth.php';
$BACKUPS = $DATA . '/backups';
$LOCK = $DATA . '/login-attempts.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function out($data, int $code = 200): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $msg, int $code = 400): void { out(['ok' => false, 'error' => $msg], $code); }
function ensure_dir(string $d): void { if (!is_dir($d) && !@mkdir($d, 0755, true)) fail('Non riesco a creare la cartella ' . basename($d) . ' (controlla i permessi delle cartelle)', 500); }
function read_private(string $f) { if (!is_file($f)) return null; $s = (string) file_get_contents($f); $s = preg_replace('/^<\?php exit; \?>\n/', '', $s); return json_decode($s, true); }
function write_private(string $f, $data): void { atomic_write($f, "<?php exit; ?>\n" . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); }
function atomic_write(string $f, string $s): void {
  $tmp = $f . '.tmp-' . bin2hex(random_bytes(4));
  if (@file_put_contents($tmp, $s, LOCK_EX) === false) fail('Non riesco a scrivere ' . basename($f) . ' (controlla i permessi delle cartelle)', 500);
  if (!@rename($tmp, $f)) { @unlink($tmp); fail('Non riesco a sostituire ' . basename($f), 500); }
  @chmod($f, 0644);
}
function body_json(): array { $raw = file_get_contents('php://input'); if ($raw === false || strlen($raw) > MAX_JSON + 1024) fail('Richiesta troppo grande', 413); $j = json_decode($raw, true); return is_array($j) ? $j : []; }
function ini_bytes(string $k): int { $v = trim((string) ini_get($k)); if ($v === '') return 0; $n = (int) $v; switch (strtolower(substr($v, -1))) { case 'g': $n *= 1024; case 'm': $n *= 1024; case 'k': $n *= 1024; } return $n; }

/* ---------- private folder protection (also for nginx: files are .php-wrapped) ---------- */
ensure_dir($DATA); ensure_dir($BACKUPS);
if (!is_file($DATA . '/.htaccess')) @file_put_contents($DATA . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n");
if (!is_file($DATA . '/index.html')) @file_put_contents($DATA . '/index.html', '');

/* ---------- session ---------- */
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
session_name('gudcms');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
$logged = !empty($_SESSION['gud_admin']) && ($_SESSION['exp'] ?? 0) > time();
if ($logged) $_SESSION['exp'] = time() + 60 * 60 * 8;

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$auth = read_private($AUTH);

function need_post(): void { if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail('POST required', 405); }
function need_csrf(): void { $t = $_SERVER['HTTP_X_CSRF'] ?? ($_POST['csrf'] ?? ''); if (!is_string($t) || !hash_equals($_SESSION['csrf'], $t)) fail('Sessione scaduta: ricarica la pagina', 403); }
function need_login(bool $logged): void { if (!$logged) fail('Sessione scaduta: rientra', 401); need_csrf(); }

function locked(string $LOCK): int { $l = read_private($LOCK) ?: []; $ip = $_SERVER['REMOTE_ADDR'] ?? '?'; $e = $l[$ip] ?? null; if ($e && $e['n'] >= 5 && $e['t'] > time() - 600) return 600 - (time() - $e['t']); return 0; }
function note_fail(string $LOCK): void { $l = read_private($LOCK) ?: []; $ip = $_SERVER['REMOTE_ADDR'] ?? '?'; $e = $l[$ip] ?? ['n' => 0, 't' => time()]; if ($e['t'] < time() - 600) $e = ['n' => 0, 't' => time()]; $e['n']++; $e['t'] = time(); $l[$ip] = $e; foreach ($l as $k => $v) if ($v['t'] < time() - 3600) unset($l[$k]); write_private($LOCK, $l); }
function clear_fail(string $LOCK): void { $l = read_private($LOCK) ?: []; unset($l[$_SERVER['REMOTE_ADDR'] ?? '?']); write_private($LOCK, $l); }

function validate_content($c): array {
  if (!is_array($c)) fail('Il contenuto non è un JSON valido');
  foreach (['sections', 'mons', 'text', 'lists', 'profile', 'contacts'] as $k) if (!isset($c[$k]) || !is_array($c[$k])) fail('Nel contenuto manca "' . $k . '"');
  if (count($c['sections']) < 1) fail('Serve almeno un capitolo');
  if (count($c['sections']) > 30) fail('Troppi capitoli (max 30)');
  foreach ($c['sections'] as $i => $s) { if (!is_array($s) || !isset($s['id']) || !preg_match('/^[a-z0-9_-]{1,40}$/', (string) $s['id'])) fail('Section ' . ($i + 1) . ' ha un id non valido'); if (isset($s['items']) && !is_array($s['items'])) fail('Section ' . $s['id'] . ': items must be a list'); }
  $c['version'] = (int) ($c['version'] ?? 1);
  $c['savedAt'] = gmdate('c');
  return $c;
}
function backup_now(string $CONTENT, string $BACKUPS, string $why): void {
  if (!is_file($CONTENT)) return;
  $name = 'content-' . gmdate('Ymd-His') . '-' . $why . '-' . bin2hex(random_bytes(2)) . '.json.php';
  @file_put_contents($BACKUPS . '/' . $name, "<?php exit; ?>\n" . file_get_contents($CONTENT));
  $all = glob($BACKUPS . '/content-*.json.php') ?: [];
  rsort($all);
  foreach (array_slice($all, MAX_BACKUPS) as $old) @unlink($old);
}
function save_content(array $c, string $CONTENT, string $BACKUPS, string $why): void {
  $c = validate_content($c);
  $json = json_encode($c, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
  if ($json === false || strlen($json) > MAX_JSON) fail('Contenuto troppo grande');
  ensure_dir(dirname($CONTENT));
  backup_now($CONTENT, $BACKUPS, $why);
  atomic_write($CONTENT, $json);
}
function media_dir(string $MEDIA): void {
  ensure_dir($MEDIA);
  if (!is_file($MEDIA . '/.htaccess')) @file_put_contents($MEDIA . '/.htaccess', "# uploaded media: never execute anything here\nOptions -ExecCGI -Indexes\nRemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar .pl .py .cgi .sh\nRemoveType .php .phtml .php3 .php4 .php5 .php7 .php8 .phar\n<FilesMatch \"\\.(?i:php\\d?|phtml|phar|pl|py|cgi|sh|html?|svg|js)$\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n  </IfModule>\n</FilesMatch>\n");
  if (!is_file($MEDIA . '/index.html')) @file_put_contents($MEDIA . '/index.html', '');
}
function safe_media_name(string $n): ?string { $n = basename($n); return preg_match('/^[a-z0-9][a-z0-9_-]{0,80}\.(jpg|png|gif|webp|mp4|webm)$/', $n) ? $n : null; }
function store_upload(string $tmp, string $orig, string $MEDIA): array {
  $fi = new finfo(FILEINFO_MIME_TYPE);
  $mime = (string) $fi->file($tmp);
  $map = array_flip(IMG_EXT + VID_EXT);
  if (!isset($map[$mime])) fail('Tipo di file non ammesso (' . $mime . '). Usa JPG, PNG, GIF, WEBP, MP4 o WEBM.');
  $ext = $map[$mime];
  if (isset(IMG_EXT[$ext]) && @getimagesize($tmp) === false) fail('Questa immagine sembra rotta');
  $base = strtolower(pathinfo($orig, PATHINFO_FILENAME));
  $base = trim(preg_replace('/[^a-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base) ?: $base), '-');
  $base = substr($base !== '' ? $base : 'file', 0, 40);
  $name = $base . '-' . bin2hex(random_bytes(3)) . '.' . $ext;
  media_dir($MEDIA);
  if (!@move_uploaded_file($tmp, $MEDIA . '/' . $name) && !@rename($tmp, $MEDIA . '/' . $name)) fail('Non riesco a salvare il file (controlla i permessi delle cartelle)', 500);
  @chmod($MEDIA . '/' . $name, 0644);
  return ['name' => $name, 'src' => 'media/' . $name, 'type' => isset(VID_EXT[$ext]) ? 'video' : 'image', 'size' => filesize($MEDIA . '/' . $name)];
}

switch ($action) {
  /* ---------------- auth ---------------- */
  case 'status':
    $max = min(ini_bytes('upload_max_filesize') ?: PHP_INT_MAX, ini_bytes('post_max_size') ?: PHP_INT_MAX);
    out(['ok' => true, 'setup' => $auth === null, 'logged' => $logged, 'csrf' => $_SESSION['csrf'], 'maxUpload' => $max === PHP_INT_MAX ? 0 : $max, 'zip' => class_exists('ZipArchive'), 'php' => PHP_VERSION]);

  case 'setup':
    need_post(); need_csrf();
    if ($auth !== null) fail('La password esiste già', 403);
    $p = (string) (body_json()['password'] ?? '');
    if (strlen($p) < 8) fail('La password deve avere almeno 8 caratteri');
    write_private($AUTH, ['hash' => password_hash($p, PASSWORD_DEFAULT), 'created' => gmdate('c')]);
    session_regenerate_id(true); $_SESSION['gud_admin'] = true; $_SESSION['exp'] = time() + 60 * 60 * 8;
    out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

  case 'login':
    need_post(); need_csrf();
    if ($auth === null) fail('Prima crea una password', 403);
    if ($w = locked($LOCK)) fail('Troppi tentativi. Riprova tra ' . ceil($w / 60) . ' min', 429);
    $p = (string) (body_json()['password'] ?? '');
    if (!password_verify($p, $auth['hash'])) { note_fail($LOCK); usleep(400000); fail('Password sbagliata', 401); }
    clear_fail($LOCK);
    if (password_needs_rehash($auth['hash'], PASSWORD_DEFAULT)) { $auth['hash'] = password_hash($p, PASSWORD_DEFAULT); write_private($AUTH, $auth); }
    session_regenerate_id(true); $_SESSION['gud_admin'] = true; $_SESSION['exp'] = time() + 60 * 60 * 8;
    out(['ok' => true, 'csrf' => $_SESSION['csrf']]);

  case 'logout':
    need_post(); need_csrf();
    $_SESSION = []; session_destroy();
    out(['ok' => true]);

  case 'password':
    need_post(); need_login($logged);
    $b = body_json();
    if (!password_verify((string) ($b['old'] ?? ''), $auth['hash'])) fail('La password attuale è sbagliata', 401);
    $n = (string) ($b['new'] ?? '');
    if (strlen($n) < 8) fail('La nuova password deve avere almeno 8 caratteri');
    $auth['hash'] = password_hash($n, PASSWORD_DEFAULT); $auth['changed'] = gmdate('c');
    write_private($AUTH, $auth);
    out(['ok' => true]);

  /* ---------------- content ---------------- */
  case 'save':
    need_post(); need_login($logged);
    $b = body_json();
    save_content($b['content'] ?? null, $CONTENT, $BACKUPS, 'save');
    out(['ok' => true, 'savedAt' => gmdate('c')]);

  case 'backups':
    need_login($logged);
    $list = [];
    foreach (glob($BACKUPS . '/content-*.json.php') ?: [] as $f) $list[] = ['name' => basename($f, '.json.php'), 'size' => filesize($f), 'time' => filemtime($f)];
    usort($list, fn($a, $b) => $b['time'] <=> $a['time']);
    out(['ok' => true, 'backups' => $list]);

  case 'backup':
    need_login($logged);
    $n = basename((string) ($_GET['name'] ?? ''));
    if (!preg_match('/^content-[\w-]+$/', $n) || !is_file($BACKUPS . '/' . $n . '.json.php')) fail('Backup non trovato', 404);
    out(['ok' => true, 'content' => read_private($BACKUPS . '/' . $n . '.json.php')]);

  /* ---------------- media ---------------- */
  case 'upload':
    need_post(); need_login($logged);
    if (empty($_FILES['file'])) fail('Nessun file ricevuto. Forse supera il limite del server (' . ini_get('upload_max_filesize') . ').', 413);
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK) fail($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE ? 'File troppo grande per questo server (limite ' . ini_get('upload_max_filesize') . ')' : 'Errore di caricamento ' . $f['error'], 413);
    out(['ok' => true] + store_upload($f['tmp_name'], (string) $f['name'], $MEDIA));

  case 'media':
    need_login($logged);
    media_dir($MEDIA);
    $list = [];
    foreach (scandir($MEDIA) ?: [] as $n) { if (!safe_media_name($n)) continue; $p = $MEDIA . '/' . $n; $ext = pathinfo($n, PATHINFO_EXTENSION); $list[] = ['name' => $n, 'src' => 'media/' . $n, 'type' => isset(VID_EXT[$ext]) ? 'video' : 'image', 'size' => filesize($p), 'time' => filemtime($p)]; }
    usort($list, fn($a, $b) => $b['time'] <=> $a['time']);
    out(['ok' => true, 'media' => $list]);

  case 'media_delete':
    need_post(); need_login($logged);
    $n = safe_media_name((string) (body_json()['name'] ?? ''));
    if (!$n || !is_file($MEDIA . '/' . $n)) fail('File non trovato', 404);
    @unlink($MEDIA . '/' . $n);
    out(['ok' => true]);

  /* ---------------- move house: export / import ---------------- */
  case 'export':
    if (!$logged) fail('Sessione scaduta: rientra', 401);
    if (!hash_equals($_SESSION['csrf'], (string) ($_GET['csrf'] ?? ''))) fail('Sessione scaduta', 403);
    if (!class_exists('ZipArchive')) { header('Content-Type: application/json'); header('Content-Disposition: attachment; filename="gud-content-' . gmdate('Ymd') . '.json"'); readfile($CONTENT); exit; }
    $tmp = tempnam(sys_get_temp_dir(), 'gud');
    $z = new ZipArchive(); $z->open($tmp, ZipArchive::OVERWRITE);
    $z->addFile($CONTENT, 'content.json');
    media_dir($MEDIA);
    foreach (scandir($MEDIA) ?: [] as $n) if (safe_media_name($n)) $z->addFile($MEDIA . '/' . $n, 'media/' . $n);
    $z->addFromString('LEGGIMI.txt', "GUD WORLD — export del " . gmdate('Y-m-d H:i') . " UTC\nPer ripristinare: pannello admin > BACKUP > IMPORTA, scegli questo zip.\nOppure copia content.json e la cartella media/ dentro /content/ del sito.\n");
    $z->close();
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="gud-content-' . gmdate('Ymd-His') . '.zip"');
    header('Content-Length: ' . filesize($tmp));
    readfile($tmp); @unlink($tmp); exit;

  case 'import':
    need_post(); need_login($logged);
    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) fail('Nessun file ricevuto (limite ' . ini_get('upload_max_filesize') . ')', 413);
    $tmp = $_FILES['file']['tmp_name'];
    $head = (string) file_get_contents($tmp, false, null, 0, 4);
    $added = 0;
    if ($head === "PK\x03\x04") {
      if (!class_exists('ZipArchive')) fail('Questo server non legge gli zip: importa content.json.');
      $z = new ZipArchive(); if ($z->open($tmp) !== true) fail('Non riesco ad aprire lo zip');
      $json = $z->getFromName('content.json');
      if ($json === false) fail('Nello zip non c\'è content.json');
      $c = json_decode($json, true);
      validate_content($c);
      media_dir($MEDIA);
      for ($i = 0; $i < $z->numFiles; $i++) {
        $entry = $z->getNameIndex($i);
        if (strpos($entry, 'media/') !== 0) continue;
        $n = safe_media_name(substr($entry, 6));
        if (!$n || $z->statIndex($i)['size'] > 512 * 1024 * 1024) continue;
        $t = tempnam(sys_get_temp_dir(), 'gudm');
        file_put_contents($t, $z->getFromIndex($i));
        $fi = new finfo(FILEINFO_MIME_TYPE); $mime = $fi->file($t); $ext = pathinfo($n, PATHINFO_EXTENSION);
        if ((IMG_EXT + VID_EXT)[$ext] === $mime || ($ext === 'mp4' && $mime === 'video/quicktime')) { if (@rename($t, $MEDIA . '/' . $n)) { @chmod($MEDIA . '/' . $n, 0644); $added++; continue; } }
        @unlink($t);
      }
      $z->close();
    } else {
      $c = json_decode((string) file_get_contents($tmp), true);
    }
    save_content($c, $CONTENT, $BACKUPS, 'import');
    out(['ok' => true, 'media' => $added]);

  default:
    fail('Unknown action', 404);
}
