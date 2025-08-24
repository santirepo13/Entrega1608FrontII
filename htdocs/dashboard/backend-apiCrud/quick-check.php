<?php
include("conexion.php");

echo "<h2>Database Status Check</h2>";

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check order 18 specifically
    echo "<h3>Order 18 Details:</h3>";
    $stmt = $db->prepare("SELECT * FROM pedido WHERE id = 18");
    $stmt->execute();
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($order) {
        echo "<table border='1' style='border-collapse: collapse; padding: 10px;'>";
        echo "<tr><th>Field</th><th>Value</th></tr>";
        foreach ($order as $field => $value) {
            $highlight = ($field == 'estado') ? "style='background-color: yellow;'" : "";
            echo "<tr $highlight><td><strong>$field</strong></td><td>" . ($value === null ? "NULL" : $value) . "</td></tr>";
        }
        echo "</table>";
        
        // Check if estado is empty/null
        if ($order['estado'] === null || $order['estado'] === '') {
            echo "<p style='color: red; font-size: 18px;'><strong>WARNING: Estado is NULL or empty!</strong></p>";
            
            // Let's restore it to Confirmado
            echo "<h4>Restoring status to 'Confirmado'...</h4>";
            $updateStmt = $db->prepare("UPDATE pedido SET estado = 'Confirmado' WHERE id = 18");
            $updateStmt->execute();
            
            // Verify the update
            $stmt->execute();
            $updatedOrder = $stmt->fetch(PDO::FETCH_ASSOC);
            echo "<p style='color: green;'>Status restored to: <strong>" . $updatedOrder['estado'] . "</strong></p>";
        } else {
            echo "<p style='color: green; font-size: 16px;'>Current status: <strong>" . $order['estado'] . "</strong></p>";
        }
        
    } else {
        echo "<p style='color: red;'>Order 18 not found in database!</p>";
    }
    
    // Show database schema for pedido table
    echo "<hr>";
    echo "<h3>Pedido Table Structure:</h3>";
    $stmt = $db->query("DESCRIBE pedido");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    foreach ($columns as $col) {
        $highlight = ($col['Field'] == 'estado') ? "style='background-color: yellow;'" : "";
        echo "<tr $highlight>";
        echo "<td>" . $col['Field'] . "</td>";
        echo "<td>" . $col['Type'] . "</td>";
        echo "<td>" . $col['Null'] . "</td>";
        echo "<td>" . $col['Key'] . "</td>";
        echo "<td>" . $col['Default'] . "</td>";
        echo "<td>" . $col['Extra'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // Show all recent orders with their statuses
    echo "<hr>";
    echo "<h3>Recent Orders Status:</h3>";
    $stmt = $db->query("SELECT id, estado, metodo_pago, fecha FROM pedido ORDER BY id DESC LIMIT 10");
    $allOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Estado</th><th>Metodo Pago</th><th>Fecha</th></tr>";
    foreach ($allOrders as $ord) {
        $highlight = ($ord['id'] == 18) ? "style='background-color: yellow;'" : "";
        echo "<tr $highlight>";
        echo "<td>" . $ord['id'] . "</td>";
        echo "<td>" . ($ord['estado'] === null || $ord['estado'] === '' ? '<span style="color:red;">NULL/EMPTY</span>' : $ord['estado']) . "</td>";
        echo "<td>" . $ord['metodo_pago'] . "</td>";
        echo "<td>" . $ord['fecha'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch(PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . $e->getMessage() . "</p>";
}
?>
