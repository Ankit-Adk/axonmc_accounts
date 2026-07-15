<?php
declare(strict_types=1);

define('ROOT_PATH', dirname(__DIR__));
define('DATA_PATH', ROOT_PATH . DIRECTORY_SEPARATOR . 'data');
define('APP_NAME', 'Ledgerly');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

if (!is_dir(DATA_PATH)) {
    mkdir(DATA_PATH, 0755, true);
}
