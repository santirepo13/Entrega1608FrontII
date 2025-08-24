<?php
/**
 * Password Migration Script
 * 
 * This script migrates plain text passwords to hashed passwords for security.
 * Run this script ONCE after deploying the updated authentication system.
 * 
 * Usage: 
 * 1. Access via browser: http://localhost/backend-apiCrud/migrate-passwords.php
 * 2. Or run via command line: php migrate-passwords.php
 */

include("conexion.php");

// Conexión a la base de datos
try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Error de conexión a la base de datos: " . $e->getMessage());
}

echo "<h2>🔐 Password Migration Script</h2>\n";

try {
    // Get all users with plain text passwords
    $stmt = $db->query("SELECT id, usuario, contrasena FROM roles");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $migratedCount = 0;
    $skippedCount = 0;
    
    foreach ($users as $user) {
        $id = $user['id'];
        $usuario = $user['usuario'];
        $currentPassword = $user['contrasena'];
        
        // Check if password is already hashed (PHP's password_hash creates 60+ char strings)
        if (strlen($currentPassword) > 50 && strpos($currentPassword, '$2y$') === 0) {
            echo "✅ User '$usuario' already has hashed password - skipping<br>\n";
            $skippedCount++;
            continue;
        }
        
        // Hash the plain text password
        $hashedPassword = password_hash($currentPassword, PASSWORD_DEFAULT);
        
        // Update the password in the database
        $updateStmt = $db->prepare("UPDATE roles SET contrasena = :hashed_password WHERE id = :id");
        $updateStmt->bindParam(':hashed_password', $hashedPassword);
        $updateStmt->bindParam(':id', $id);
        
        if ($updateStmt->execute()) {
            echo "🔒 User '$usuario' password migrated successfully<br>\n";
            $migratedCount++;
        } else {
            echo "❌ Failed to migrate password for user '$usuario'<br>\n";
        }
    }
    
    echo "<br><strong>Migration Summary:</strong><br>\n";
    echo "✅ Migrated: $migratedCount users<br>\n";
    echo "⏭️ Skipped: $skippedCount users (already hashed)<br>\n";
    echo "📋 Total: " . count($users) . " users processed<br>\n";
    
    if ($migratedCount > 0) {
        echo "<br>🎉 <strong>Migration completed successfully!</strong><br>\n";
        echo "⚠️ <em>For security, delete this script after migration</em><br>\n";
    } else {
        echo "<br>ℹ️ No passwords needed migration.<br>\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "<br>\n";
}

echo "<br>---<br>\n";
echo "Current users in system:<br>\n";

try {
    $stmt = $db->query("SELECT id, rol, usuario FROM roles ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' cellpadding='5' cellspacing='0'>\n";
    echo "<tr><th>ID</th><th>Role</th><th>User</th><th>Password Status</th></tr>\n";
    
    foreach ($users as $user) {
        $stmt = $db->prepare("SELECT contrasena FROM roles WHERE id = :id");
        $stmt->bindParam(':id', $user['id']);
        $stmt->execute();
        $passwordData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $isHashed = strlen($passwordData['contrasena']) > 50 ? '🔒 Hashed' : '⚠️ Plain text';
        
        echo "<tr>";
        echo "<td>{$user['id']}</td>";
        echo "<td>{$user['rol']}</td>";
        echo "<td>{$user['usuario']}</td>";
        echo "<td>$isHashed</td>";
        echo "</tr>\n";
    }
    
    echo "</table>\n";
    
} catch (PDOException $e) {
    echo "Error displaying users: " . $e->getMessage() . "<br>\n";
}

?>

<!DOCTYPE html>
<html>
<head>
    <title>Password Migration</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f0f0f0; }
        .warning { color: orange; font-weight: bold; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
    </style>
</head>
<body>

<div class="warning">
    <h3>⚠️ Security Notice</h3>
    <p>After running this migration successfully:</p>
    <ul>
        <li>Delete this file (<code>migrate-passwords.php</code>) for security</li>
        <li>All passwords are now securely hashed</li>
        <li>Existing users can continue logging in with their same passwords</li>
        <li>New passwords will be automatically hashed when created</li>
    </ul>
</div>

<div class="success">
    <h3>✅ Test Login</h3>
    <p>You can test the login with existing credentials:</p>
    <ul>
        <li><strong>Admin:</strong> username=<code>admin</code>, password=<code>admin12345</code></li>
        <li><strong>Vendor:</strong> username=<code>vendedor</code>, password=<code>vende12355</code></li>
        <li><strong>User:</strong> username=<code>Juan</code>, password=<code>juan12345</code></li>
    </ul>
</div>

</body>
</html>
