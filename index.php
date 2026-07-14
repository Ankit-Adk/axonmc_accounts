<?php require_once __DIR__ . '/includes/functions.php'; redirect(logged_in() ? 'dashboard.php' : 'login.php');
