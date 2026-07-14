<?php
require_once __DIR__ . '/includes/functions.php';
if (logged_in()) redirect(is_admin() ? 'admin.php' : 'dashboard.php');
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf(); $name = trim($_POST['name'] ?? ''); $email = strtolower(trim($_POST['email'] ?? '')); $password = $_POST['password'] ?? '';
    if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) $error = 'Use a name, valid email, and password of at least 8 characters.';
    else {
        try {
            $role = update_json('users', function (&$users) use ($name, $email, $password) {
                foreach ($users as $u) if (strcasecmp($u['email'], $email) === 0) throw new InvalidArgumentException('An account already uses that email.');
                $role = count($users) === 0 ? 'admin' : 'user';
                $users[] = ['id' => bin2hex(random_bytes(12)), 'name' => mb_substr($name, 0, 80), 'email' => $email, 'password' => password_hash($password, PASSWORD_DEFAULT), 'role' => $role, 'created_at' => date('c')];
                return $role;
            });
            flash('success', $role === 'admin' ? 'Administrator account created. Please sign in.' : 'Account created. Please sign in.'); redirect('login.php');
        } catch (InvalidArgumentException $e) { $error = $e->getMessage(); }
    }
}
$pageTitle = 'Create account'; require __DIR__ . '/includes/header.php';
?>
<div class="auth-page"><form class="auth-card" method="post"><a class="brand auth-brand" href="index.php">Ledger<span>ly</span></a><h1>Create account</h1><p>The first account is the administrator. Further accounts are read-only.</p><?php if($error): ?><div class="alert error"><?= e($error) ?></div><?php endif; ?><?= csrf_input() ?><label>Full name<input type="text" name="name" required maxlength="80" value="<?= e($_POST['name'] ?? '') ?>"></label><label>Email<input type="email" name="email" required value="<?= e($_POST['email'] ?? '') ?>"></label><label>Password<input type="password" name="password" required minlength="8" autocomplete="new-password"></label><button class="primary" type="submit">Create account</button><p class="auth-link">Already registered? <a href="login.php">Sign in</a></p></form></div>
<?php require __DIR__ . '/includes/footer.php'; ?>
