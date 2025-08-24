<?php
// Fix product image paths
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Fixing Product Image Paths</h2>";

// Database connection
$servidor = "localhost";
$usuario = "root";
$contraseña = "";
$baseDatos = "inventario";

try {
    $pdo = new PDO("mysql:host=$servidor;dbname=$baseDatos;charset=utf8", $usuario, $contraseña);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connected to database<br><br>";
    
    // Get all products with broken image paths
    $stmt = $pdo->query("SELECT id, nombre, imagen FROM productos WHERE imagen LIKE './images/%'");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($products)) {
        echo "ℹ️ No products found with broken image paths<br>";
    } else {
        echo "<h3>Products to fix:</h3>";
        foreach ($products as $product) {
            echo "ID {$product['id']}: {$product['nombre']} - {$product['imagen']}<br>";
        }
        echo "<br>";
        
        // Fix each product's image path
        $updateStmt = $pdo->prepare("UPDATE productos SET imagen = ? WHERE id = ?");
        
        foreach ($products as $product) {
            $oldPath = $product['imagen'];
            
            // Convert ./images/filename.jpg to frontend-apicrud2/images/filename.jpg
            $newPath = str_replace('./images/', 'frontend-apicrud2/images/', $oldPath);
            
            // Update the product
            $updateStmt->execute([$newPath, $product['id']]);
            
            echo "✅ Updated ID {$product['id']} ({$product['nombre']}): <br>";
            echo "&nbsp;&nbsp;&nbsp;From: <code>{$oldPath}</code><br>";
            echo "&nbsp;&nbsp;&nbsp;To: <code>{$newPath}</code><br><br>";
        }
        
        echo "<h3>✅ All product images have been fixed!</h3>";
    }
    
    // Show current status
    echo "<h3>Current product images:</h3>";
    $stmt = $pdo->query("SELECT id, nombre, imagen FROM productos WHERE activo = 1 ORDER BY id");
    $allProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($allProducts as $product) {
        $imageStatus = "❌ Broken";
        
        // Check if image exists
        $imagePath = "C:\\xampp\\htdocs\\dashboard\\" . str_replace('/', '\\', $product['imagen']);
        if (file_exists($imagePath) || filter_var($product['imagen'], FILTER_VALIDATE_URL)) {
            $imageStatus = "✅ OK";
        }
        
        echo "ID {$product['id']}: {$product['nombre']} - {$imageStatus}<br>";
        echo "&nbsp;&nbsp;&nbsp;Path: <code>{$product['imagen']}</code><br><br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage();
}
?>
