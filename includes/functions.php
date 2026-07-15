<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

function e(?string $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function redirect(string $url): never { header('Location: ' . $url); exit; }
function json_path(string $name): string { return DATA_PATH . DIRECTORY_SEPARATOR . $name . '.json'; }

/** Read a JSON array safely. */
function read_json(string $name): array {
    $path = json_path($name);
    if (!file_exists($path)) { file_put_contents($path, '[]', LOCK_EX); }
    $handle = fopen($path, 'r');
    if (!$handle) { return []; }
    flock($handle, LOCK_SH);
    $content = stream_get_contents($handle);
    flock($handle, LOCK_UN); fclose($handle);
    $data = json_decode($content ?: '[]', true);
    return is_array($data) ? $data : [];
}

/** Atomically update a JSON array while holding an exclusive lock. */
function update_json(string $name, callable $callback): mixed {
    $path = json_path($name);
    $handle = fopen($path, 'c+');
    if (!$handle) { throw new RuntimeException('Unable to open data store.'); }
    flock($handle, LOCK_EX);
    rewind($handle);
    $data = json_decode(stream_get_contents($handle) ?: '[]', true);
    $data = is_array($data) ? $data : [];
    $result = $callback($data);
    rewind($handle); ftruncate($handle, 0);
    fwrite($handle, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($handle); flock($handle, LOCK_UN); fclose($handle);
    return $result;
}

function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) { $_SESSION['csrf_token'] = bin2hex(random_bytes(32)); }
    return $_SESSION['csrf_token'];
}
function csrf_input(): string { return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">'; }
function verify_csrf(): void {
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $_POST['csrf_token'] ?? '')) {
        http_response_code(403); exit('Invalid request token. Please try again.');
    }
}
function flash(string $type, string $message): void { $_SESSION['flash'] = ['type' => $type, 'message' => $message]; }
function show_flash(): string {
    $f = $_SESSION['flash'] ?? null; unset($_SESSION['flash']);
    return $f ? '<div class="alert ' . e($f['type']) . '">' . e($f['message']) . '</div>' : '';
}
function current_user(): ?array { return $_SESSION['user'] ?? null; }
function logged_in(): bool { return current_user() !== null; }
function is_admin(): bool { return (current_user()['role'] ?? '') === 'admin'; }
function require_login(): void { if (!logged_in()) { flash('error', 'Please sign in first.'); redirect('login.php'); } }
function require_admin(): void { require_login(); if (!is_admin()) { flash('error', 'Administrator access is required.'); redirect('dashboard.php'); } }
function login_user(array $user): void { session_regenerate_id(true); $_SESSION['user'] = ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']]; }
function valid_date(string $date): bool { $d = DateTime::createFromFormat('Y-m-d', $date); return $d && $d->format('Y-m-d') === $date; }
function money(float $amount): string { return number_format($amount, 2); }
function transaction_input(string $kind): array {
    $date = trim($_POST['date'] ?? ''); $party = trim($_POST['party'] ?? '');
    $amount = trim($_POST['amount'] ?? ''); $currency = strtoupper(trim($_POST['currency'] ?? ''));
    $reason = trim($_POST['reason'] ?? '');
    if (!valid_date($date) || $party === '' || !is_numeric($amount) || (float)$amount <= 0 || !preg_match('/^[A-Z]{3,10}$/', $currency) || $reason === '') {
        throw new InvalidArgumentException('Enter a valid date, name, positive amount, currency code, and description.');
    }
    return ['date' => $date, 'party' => mb_substr($party, 0, 120), 'amount' => round((float)$amount, 2), 'currency' => $currency, 'reason' => mb_substr($reason, 0, 500), 'kind' => $kind];
}
function totals(): array {
    $income = read_json('income'); $expenses = read_json('expenses');
    $i = array_sum(array_column($income, 'amount')); $x = array_sum(array_column($expenses, 'amount'));
    return ['income' => $i, 'expenses' => $x, 'balance' => $i - $x, 'transactions' => count($income) + count($expenses)];
}
