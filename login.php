<?php
require_once __DIR__ . '/includes/functions.php';
if (logged_in()) redirect(is_admin() ? 'admin.php' : 'dashboard.php');
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf(); $email = strtolower(trim($_POST['email'] ?? '')); $password = $_POST['password'] ?? '';
    foreach (read_json('users') as $user) {
        if (hash_equals($user['email'], $email) && password_verify($password, $user['password'])) { login_user($user); redirect($user['role'] === 'admin' ? 'admin.php' : 'dashboard.php'); }
    }
    $error = 'Invalid email address or password.';
}
$pageTitle = 'Sign in'; require __DIR__ . '/includes/header.php';
?>
<div class="auth-page"><form class="auth-card" method="post"><a class="brand auth-brand" href="index.php">Ledger<span>ly</span></a><h1>Welcome back</h1><p>Sign in to view your accounting records.</p><?= show_flash() ?><?php if($error): ?><div class="alert error"><?= e($error) ?></div><?php endif; ?><?= csrf_input() ?><label>Email<input type="email" name="email" required autocomplete="email"></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="primary" type="submit">Sign in</button><p class="auth-link">Need an account? <a href="register.php">Register here</a></p></form></div>
<?php require __DIR__ . '/includes/footer.php'; ?>
