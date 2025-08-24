<?php
// Check order status directly from database
include("conexion.php");

try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check order 18 specifically
    $stmt = $db->prepare("SELECT id, estado, metodo_pago, fecha, total FROM pedido WHERE id = ?");
    $stmt->execute([18]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<h2>Database Status Check for Order 18</h2>";
    
    if ($order) {
        echo "<table border='1' style='border-collapse: collapse; padding: 10px;'>";
        echo "<tr><th>Field</th><th>Value</th></tr>";
        foreach ($order as $field => $value) {
            echo "<tr><td><strong>$field</strong></td><td>$value</td></tr>";
        }
        echo "</table>";
        
        echo "<h3>Current Status in Database: " . $order['estado'] . "</h3>";
        
        // Also check what the API returns
        echo "<hr>";
        echo "<h3>What API Returns:</h3>";
        
        // Call getAllPedidos to see what the API returns
        $stmt = $db->query("
            SELECT p.*, c.nombre, c.apellido, c.email,
                   COALESCE((
                       SELECT SUM(dp.precio * dp.cantidad) 
                       FROM detalle_pedido dp 
                       WHERE dp.id_pedido = p.id
                   ), 0) as subtotal
            FROM pedido p 
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
            WHERE p.id = 18
            ORDER BY p.id DESC
        ");
        $apiResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($apiResult) {
            echo "<pre>";
            print_r($apiResult);
            echo "</pre>";
        }
        
    } else {
        echo "<p style='color: red;'>Order 18 not found in database.</p>";
    }
    
    // Check all orders to see their statuses
    echo "<hr>";
    echo "<h3>All Orders with Status:</h3>";
    $stmt = $db->query("SELECT id, estado, metodo_pago, fecha FROM pedido ORDER BY id DESC LIMIT 10");
    $allOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>ID</th><th>Estado</th><th>Metodo Pago</th><th>Fecha</th></tr>";
    foreach ($allOrders as $ord) {
        $highlight = ($ord['id'] == 18) ? "style='background-color: yellow;'" : "";
        echo "<tr $highlight>";
        echo "<td>" . $ord['id'] . "</td>";
        echo "<td>" . $ord['estado'] . "</td>";
        echo "<td>" . $ord['metodo_pago'] . "</td>";
        echo "<td>" . $ord['fecha'] . "</td>";
        echo "</tr>";
    }
    echo "</table>";
    
} catch(PDOException $e) {
    echo "<p style='color: red;'>Database Error: " . $e->getMessage() . "</p>";
}
?>
