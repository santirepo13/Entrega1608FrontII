<?php
/**
 * PROJECT CONFIGURATION FILE
 * Centralized configuration for your Inventario project
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'inventario');
define('DB_USER', 'root');
define('DB_PASS', '');

// API Configuration
define('API_BASE_URL', '/dashboard');
define('API_VERSION', '1.0');

// Frontend Configuration
define('FRONTEND_PATH', '../frontend II/frontend-apicrud2');

// Security Configuration
define('PASSWORD_HASH_ALGO', PASSWORD_DEFAULT);
define('SESSION_TIMEOUT', 3600); // 1 hour

// Application Settings
define('APP_NAME', 'Sistema de Inventario');
define('APP_VERSION', '2.0');
define('DEBUG_MODE', true);

// Path Mappings
$CONFIG = [
    'paths' => [
        'api' => '/dashboard',
        'frontend' => 'C:/Users/User/Documents/CESDE/tercer semestre/frontend II/frontend-apicrud2',
        'backend' => 'C:/xampp/htdocs/dashboard',
        'database_sql' => 'C:/xampp/htdocs/dashboard/inventario.sql',
        'migration_script' => 'C:/xampp/htdocs/dashboard/migrate-passwords.php'
    ],
    'urls' => [
        'api_base' => 'http://localhost/dashboard',
        'frontend_base' => 'file:///C:/Users/User/Documents/CESDE/tercer%20semestre/frontend%20II/frontend-apicrud2',
        'phpmyadmin' => 'http://localhost/phpmyadmin',
        'xampp_dashboard' => 'http://localhost/d2'
    ],
    'database' => [
        'host' => DB_HOST,
        'name' => DB_NAME,
        'user' => DB_USER,
        'password' => DB_PASS
    ]
];

// Export configuration
if (!function_exists('getProjectConfig')) {
    function getProjectConfig() {
        global $CONFIG;
        return $CONFIG;
    }
}

// Debug function
if (!function_exists('debugInfo')) {
    function debugInfo() {
        if (DEBUG_MODE) {
            $config = getProjectConfig();
            echo "<pre style='background:#f8f9fa;padding:15px;border-radius:5px;'>";
            echo "<h3>🔧 Project Configuration Debug</h3>";
            echo "<strong>API Base:</strong> " . $config['urls']['api_base'] . "\n";
            echo "<strong>Frontend Path:</strong> " . $config['paths']['frontend'] . "\n";
            echo "<strong>Backend Path:</strong> " . $config['paths']['backend'] . "\n";
            echo "<strong>Database:</strong> " . $config['database']['name'] . " @ " . $config['database']['host'] . "\n";
            echo "</pre>";
        }
    }
}
?>
