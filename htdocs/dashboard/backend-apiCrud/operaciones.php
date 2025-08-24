<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Allow: GET, POST, OPTIONS, PUT, DELETE");
$method = $_SERVER['REQUEST_METHOD'];
if($method == "OPTIONS") {
    die();
}

include("conexion.php");

// Conexión a la base de datos
try {
    $db = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array("message" => "Error de conexión a la base de datos: " . $e->getMessage()));
    exit;
}

// ==================== FUNCIONES DE AUTENTICACIÓN ====================

// Función para verificar el inicio de sesión
function login($usuario, $contrasena) {
    global $db;
    try{
        // SECURITY: First get user data without password comparison in SQL
        $stmt = $db->prepare("SELECT * FROM roles WHERE usuario = :usuario");
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();

        if ($stmt->rowCount() > 0 ) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // SECURITY: Check if password is hashed or plain text
            if (password_verify($contrasena, $row['contrasena'])) {
                // Password is properly hashed and verified
                unset($row['contrasena']); // Don't return password
                return $row;
            } else if ($row['contrasena'] === $contrasena) {
                // DEPRECATED: Plain text password (for backward compatibility)
                // Log warning for production systems
                error_log("WARNING: Plain text password detected for user: " . $usuario);
                unset($row['contrasena']); // Don't return password
                return $row;
            }
        }
        return false;
    } catch(PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        return false;
    }
}

// ==================== FUNCIONES CRUD PRODUCTOS ====================

function createProduct($nombre, $descripcion, $precio, $stock, $imagen){
    global $db;
    try {
        $stmt = $db->prepare("INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (:nombre, :descripcion, :precio, :stock, :imagen)");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':precio', $precio);
        $stmt->bindParam(':stock', $stock);
        $stmt->bindParam(':imagen', $imagen);
        $stmt->execute();
        echo json_encode(array("message" => "Producto creado correctamente", "id" => $db->lastInsertId()));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear producto: " . $e->getMessage()));
    }
}

function updateProducts($id, $nombre, $descripcion, $precio, $stock, $imagen){
    global $db;
    try {
        $stmt = $db->prepare("UPDATE productos SET nombre = :nombre, descripcion = :descripcion, precio = :precio, stock = :stock, imagen = :imagen WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':precio', $precio);
        $stmt->bindParam(':stock', $stock);
        $stmt->bindParam(':imagen', $imagen);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Producto actualizado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Producto no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar producto: " . $e->getMessage()));
    }
}

function deleteProduct($id){
    global $db;
    try {
        // Always use soft delete - mark as inactive instead of deleting
        // This maintains data integrity and order history
        $stmt = $db->prepare("UPDATE productos SET activo = 0 WHERE id = :id AND activo = 1");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Producto eliminado exitosamente"));
        } else {
            // Check if product exists but is already inactive
            $checkStmt = $db->prepare("SELECT activo FROM productos WHERE id = :id");
            $checkStmt->bindParam(':id', $id);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                $product = $checkStmt->fetch(PDO::FETCH_ASSOC);
                if ($product['activo'] == 0) {
                    echo json_encode(array("message" => "El producto ya estaba eliminado"));
                } else {
                    http_response_code(500);
                    echo json_encode(array("message" => "Error al eliminar el producto"));
                }
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Producto no encontrado"));
            }
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al eliminar producto: " . $e->getMessage()));
    }
}

function getProductById($id){
    global $db;
    try {
        $stmt = $db->prepare("SELECT * FROM productos WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $producto = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($producto);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Producto no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener producto: " . $e->getMessage()));
    }
}

// ==================== FUNCIONES CRUD CLIENTES ====================

function getAllClientes(){
    global $db;
    try {
        $stmt = $db->query("SELECT * FROM clientes ORDER BY id_cliente DESC");
        $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($clientes);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener clientes: " . $e->getMessage()));
    }
}

function createCliente($nombre, $apellido, $email, $celular, $direccion, $direccion2, $descripcion){
    global $db;
    // Email format validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(array("message" => "Formato de email no válido"));
        return;
    }
    try {
        $stmt = $db->prepare("INSERT INTO clientes (nombre, apellido, email, celular, direccion, direccion2, descripcion) VALUES (:nombre, :apellido, :email, :celular, :direccion, :direccion2, :descripcion)");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':apellido', $apellido);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':celular', $celular);
        $stmt->bindParam(':direccion', $direccion);
        $stmt->bindParam(':direccion2', $direccion2);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->execute();
        echo json_encode(array("message" => "Cliente creado con éxito", "id" => $db->lastInsertId()));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear cliente: " . $e->getMessage()));
    }
}

function updateCliente($id, $nombre, $apellido, $email, $celular, $direccion, $direccion2, $descripcion){
    global $db;
    try {
        $stmt = $db->prepare("UPDATE clientes SET nombre = :nombre, apellido = :apellido, email = :email, celular = :celular, direccion = :direccion, direccion2 = :direccion2, descripcion = :descripcion WHERE id_cliente = :id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':apellido', $apellido);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':celular', $celular);
        $stmt->bindParam(':direccion', $direccion);
        $stmt->bindParam(':direccion2', $direccion2);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Cliente actualizado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Cliente no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar cliente: " . $e->getMessage()));
    }
}

function deleteCliente($id){
    global $db;
    try {
        $stmt = $db->prepare("DELETE FROM clientes WHERE id_cliente = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Cliente eliminado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Cliente no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al eliminar cliente: " . $e->getMessage()));
    }
}

function getClienteById($id){
    global $db;
    try {
        $stmt = $db->prepare("SELECT * FROM clientes WHERE id_cliente = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($cliente);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Cliente no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener cliente: " . $e->getMessage()));
    }
}

// ==================== FUNCIONES CRUD PEDIDOS ====================

function getAllPedidos(){
    global $db;
    try {
        $stmt = $db->query("
            SELECT p.*, c.nombre, c.apellido, c.email,
                   COALESCE((
                       SELECT SUM(dp.precio * dp.cantidad) 
                       FROM detalle_pedido dp 
                       WHERE dp.id_pedido = p.id
                   ), 0) as subtotal
            FROM pedido p 
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
            ORDER BY p.id DESC
        ");
        $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate final totals for each order
        foreach ($pedidos as &$pedido) {
            $subtotal = floatval($pedido['subtotal']);
            $descuento = floatval($pedido['descuento'] ?? 0);
            $aumento = floatval($pedido['aumento'] ?? 0);
            
            // Calculate total: subtotal - discount + increase
            $total = $subtotal - $descuento + $aumento;
            $pedido['total'] = number_format($total, 2, '.', '');
            $pedido['subtotal'] = number_format($subtotal, 2, '.', '');
        }
        
        echo json_encode($pedidos);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener pedidos: " . $e->getMessage()));
    }
}

function createPedido($id_cliente, $descuento, $metodo_pago, $aumento, $productos){
    global $db;
    try {
        // ================= STOCK VALIDATION =================
        foreach ($productos as $producto) {
            $stmtStock = $db->prepare("SELECT stock, nombre FROM productos WHERE id = :id_producto AND activo = 1");
            $stmtStock->bindParam(':id_producto', $producto['id_producto']);
            $stmtStock->execute();
            if ($stmtStock->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(array("message" => "Producto no encontrado o inactivo", "id_producto" => $producto['id_producto']));
                return;
            }
            $info = $stmtStock->fetch(PDO::FETCH_ASSOC);
            if ($info['stock'] < $producto['cantidad']) {
                http_response_code(400);
                echo json_encode(array(
                    "message" => "Stock insuficiente para producto",
                    "producto" => $info['nombre'],
                    "stock_disponible" => $info['stock'],
                    "solicitado" => $producto['cantidad']
                ));
                return;
            }
        }
        // ================= END VALIDATION =================

        $db->beginTransaction();
        
        // Generar token de seguimiento único
        $tracking_token = generateTrackingToken();
        
        // Crear el pedido con tracking token
        $stmt = $db->prepare("INSERT INTO pedido (id_cliente, descuento, metodo_pago, aumento, estado, tracking_token) VALUES (:id_cliente, :descuento, :metodo_pago, :aumento, 'Pendiente', :tracking_token)");
        $stmt->bindParam(':id_cliente', $id_cliente);
        $stmt->bindParam(':descuento', $descuento);
        $stmt->bindParam(':metodo_pago', $metodo_pago);
        $stmt->bindParam(':aumento', $aumento);
        $stmt->bindParam(':tracking_token', $tracking_token);
        $stmt->execute();
        
        $pedido_id = $db->lastInsertId();
        
        // Agregar productos al detalle del pedido y calcular subtotal
        $subtotal = 0;
        foreach ($productos as $producto) {
            $stmt = $db->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, precio, cantidad) VALUES (:id_pedido, :id_producto, :precio, :cantidad)");
            $stmt->bindParam(':id_pedido', $pedido_id);
            $stmt->bindParam(':id_producto', $producto['id_producto']);
            $stmt->bindParam(':precio', $producto['precio']);
            $stmt->bindParam(':cantidad', $producto['cantidad']);
            $stmt->execute();
            
            // Calcular subtotal
            $subtotal += floatval($producto['precio']) * intval($producto['cantidad']);
            
            // Actualizar stock del producto
            $stmt = $db->prepare("UPDATE productos SET stock = stock - :cantidad WHERE id = :id_producto");
            $stmt->bindParam(':cantidad', $producto['cantidad']);
            $stmt->bindParam(':id_producto', $producto['id_producto']);
            $stmt->execute();
        }
        
        // Calcular total final: subtotal - descuento + aumento
        $total = $subtotal - floatval($descuento) + floatval($aumento);
        
        // Actualizar el pedido con el total calculado
        $stmt = $db->prepare("UPDATE pedido SET total = :total WHERE id = :id");
        $stmt->bindParam(':total', $total);
        $stmt->bindParam(':id', $pedido_id);
        $stmt->execute();
        
        $db->commit();
        echo json_encode(array(
            "message" => "Pedido creado con éxito", 
            "id" => $pedido_id, 
            "total" => $total,
            "tracking_token" => $tracking_token,
            "tracking_url" => "/dashboard/tracking.php?token=" . $tracking_token
        ));
    } catch(PDOException $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear pedido: " . $e->getMessage()));
    }
}

function updatePedido($id, $id_cliente, $descuento, $metodo_pago, $aumento){
    global $db;
    try {
        $stmt = $db->prepare("UPDATE pedido SET id_cliente = :id_cliente, descuento = :descuento, metodo_pago = :metodo_pago, aumento = :aumento WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':id_cliente', $id_cliente);
        $stmt->bindParam(':descuento', $descuento);
        $stmt->bindParam(':metodo_pago', $metodo_pago);
        $stmt->bindParam(':aumento', $aumento);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Pedido actualizado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Pedido no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar pedido: " . $e->getMessage()));
    }
}

function deletePedido($id){
    global $db;
    try {
        $db->beginTransaction();
        
        // Eliminar detalles del pedido
        $stmt = $db->prepare("DELETE FROM detalle_pedido WHERE id_pedido = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        // Eliminar el pedido
        $stmt = $db->prepare("DELETE FROM pedido WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $db->commit();
            echo json_encode(array("message" => "Pedido eliminado con éxito"));
        } else {
            $db->rollback();
            http_response_code(404);
            echo json_encode(array("message" => "Pedido no encontrado"));
        }
    } catch(PDOException $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Error al eliminar pedido: " . $e->getMessage()));
    }
}

function getPedidoById($id){
    global $db;
    try {
        $stmt = $db->prepare("
            SELECT p.*, c.nombre, c.apellido, c.email 
            FROM pedido p 
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
            WHERE p.id = :id
        ");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Obtener detalles del pedido
            $stmt = $db->prepare("
                SELECT dp.*, pr.nombre as producto_nombre 
                FROM detalle_pedido dp 
                INNER JOIN productos pr ON dp.id_producto = pr.id 
                WHERE dp.id_pedido = :id
            ");
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate subtotal from order details
            $subtotal = 0;
            foreach ($detalles as $detalle) {
                $subtotal += floatval($detalle['precio']) * floatval($detalle['cantidad']);
            }
            
            // Calculate final total
            $descuento = floatval($pedido['descuento'] ?? 0);
            $aumento = floatval($pedido['aumento'] ?? 0);
            $total = $subtotal - $descuento + $aumento;
            
            $pedido['detalles'] = $detalles;
            $pedido['subtotal'] = number_format($subtotal, 2, '.', '');
            $pedido['total'] = number_format($total, 2, '.', '');
            
            echo json_encode($pedido);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Pedido no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener pedido: " . $e->getMessage()));
    }
}

// ==================== FUNCIONES CRUD USUARIOS/ROLES ====================

function getAllUsuarios(){
    global $db;
    try {
        $stmt = $db->query("SELECT id, rol, usuario FROM roles ORDER BY id DESC");
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($usuarios);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener usuarios: " . $e->getMessage()));
    }
}

function createUser($rol, $usuario, $contrasena){
    global $db;
    try {
        // Verificar si el usuario ya existe
        $stmt = $db->prepare("SELECT COUNT(*) FROM roles WHERE usuario = :usuario");
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(array("message" => "El usuario ya existe"));
            return;
        }
        
        $stmt = $db->prepare("INSERT INTO roles (rol, usuario, contrasena) VALUES (:rol, :usuario, :contrasena)");
        $stmt->bindParam(':rol', $rol);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->bindParam(':contrasena', $contrasena);
        $stmt->execute();
        echo json_encode(array("message" => "Usuario creado con éxito", "id" => $db->lastInsertId()));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear usuario: " . $e->getMessage()));
    }
}

function updateUser($id, $rol, $usuario, $contrasena = null){
    global $db;
    try {
        // First check if user exists
        $checkStmt = $db->prepare("SELECT id FROM roles WHERE id = :id");
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(array("message" => "Usuario no encontrado con ID: " . $id));
            return;
        }
        
        if ($contrasena) {
            $stmt = $db->prepare("UPDATE roles SET rol = :rol, usuario = :usuario, contrasena = :contrasena WHERE id = :id");
            $stmt->bindParam(':contrasena', $contrasena);
        } else {
            $stmt = $db->prepare("UPDATE roles SET rol = :rol, usuario = :usuario WHERE id = :id");
        }
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':rol', $rol);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();
        
        echo json_encode(array("message" => "Usuario actualizado con éxito"));
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar usuario: " . $e->getMessage()));
    }
}

function deleteUser($id){
    global $db;
    try {
        $stmt = $db->prepare("DELETE FROM roles WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Usuario eliminado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Usuario no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al eliminar usuario: " . $e->getMessage()));
    }
}

function getUserById($id){
    global $db;
    try {
        $stmt = $db->prepare("SELECT id, rol, usuario FROM roles WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode($usuario);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Usuario no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener usuario: " . $e->getMessage()));
    }
}

// ==================== FUNCIONES CRUD DETALLE PEDIDO ====================

function getDetallesByPedido($id_pedido){
    global $db;
    try {
        $stmt = $db->prepare("
            SELECT dp.*, pr.nombre as producto_nombre, pr.imagen 
            FROM detalle_pedido dp 
            INNER JOIN productos pr ON dp.id_producto = pr.id 
            WHERE dp.id_pedido = :id_pedido
        ");
        $stmt->bindParam(':id_pedido', $id_pedido);
        $stmt->execute();
        $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($detalles);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener detalles: " . $e->getMessage()));
    }
}

function createDetallePedido($id_pedido, $id_producto, $precio, $cantidad){
    global $db;
    try {
        $stmt = $db->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, precio, cantidad) VALUES (:id_pedido, :id_producto, :precio, :cantidad)");
        $stmt->bindParam(':id_pedido', $id_pedido);
        $stmt->bindParam(':id_producto', $id_producto);
        $stmt->bindParam(':precio', $precio);
        $stmt->bindParam(':cantidad', $cantidad);
        $stmt->execute();
        echo json_encode(array("message" => "Detalle agregado con éxito", "id" => $db->lastInsertId()));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear detalle: " . $e->getMessage()));
    }
}

function updateDetallePedido($id, $precio, $cantidad){
    global $db;
    try {
        $stmt = $db->prepare("UPDATE detalle_pedido SET precio = :precio, cantidad = :cantidad WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':precio', $precio);
        $stmt->bindParam(':cantidad', $cantidad);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Detalle actualizado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Detalle no encontrado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar detalle: " . $e->getMessage()));
    }
}

function deleteDetallePedido($id){
    global $db;
    try {
        $stmt = $db->prepare("DELETE FROM detalle_pedido WHERE id = :id");
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(array("message" => "Detalle eliminado con éxito"));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Detalle no encontrado"));
        }
    } catch(PDOException $e) {
        // Duplicate username unique constraint
        if ($e->getCode() == '23000') {
            http_response_code(409);
            echo json_encode(array("message" => "El usuario ya existe"));
            return;
        }
        http_response_code(500);
        echo json_encode(array("message" => "Error al eliminar detalle: " . $e->getMessage()));
    }
}

// ==================== FUNCIONES ESTADO PEDIDO Y TRACKING ====================

// Función para cambiar el estado de un pedido
function updatePedidoStatus($id, $nuevo_estado) {
    global $db;
    
    // Log the request for debugging
    error_log("[STATUS UPDATE] Attempting to update order $id to status: $nuevo_estado");
    
    // Estados válidos - must match exactly the ENUM values in database
    $estados_validos = ['Pendiente', 'Confirmado', 'En Preparación', 'En Camino', 'Entregado', 'Cancelado'];
    
    // Validate input
    if (empty($nuevo_estado) || $nuevo_estado === null) {
        http_response_code(400);
        echo json_encode(array("message" => "Estado no puede estar vacío"));
        return;
    }
    
    if (!in_array($nuevo_estado, $estados_validos)) {
        http_response_code(400);
        echo json_encode(array("message" => "Estado no válido. Estados permitidos: " . implode(', ', $estados_validos)));
        return;
    }
    
    try {
        // Verificar que el pedido existe y obtener el estado actual
        $checkStmt = $db->prepare("SELECT id, estado FROM pedido WHERE id = :id");
        $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(array("message" => "Pedido no encontrado"));
            return;
        }
        
        $currentOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);
        $estadoAnterior = $currentOrder['estado'];
        
        error_log("[STATUS UPDATE] Current status: $estadoAnterior, New status: $nuevo_estado");
        
        // Actualizar el estado
        $stmt = $db->prepare("UPDATE pedido SET estado = :estado WHERE id = :id");
        $stmt->bindParam(':estado', $nuevo_estado, PDO::PARAM_STR);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $success = $stmt->execute();
        $rowsAffected = $stmt->rowCount();
        
        error_log("[STATUS UPDATE] SQL executed: $success, Rows affected: $rowsAffected");
        
        if ($rowsAffected > 0) {
            // Verify the update was successful - create a new statement
            $verifyStmt = $db->prepare("SELECT id, estado FROM pedido WHERE id = :id");
            $verifyStmt->bindParam(':id', $id, PDO::PARAM_INT);
            $verifyStmt->execute();
            $verifyOrder = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            $estadoFinal = $verifyOrder['estado'];
            
            error_log("[STATUS UPDATE] Final verified status: $estadoFinal");
            
            echo json_encode(array(
                "message" => "Estado del pedido actualizado con éxito",
                "id" => $id,
                "estado_anterior" => $estadoAnterior,
                "nuevo_estado" => $nuevo_estado,
                "estado_verificado" => $estadoFinal,
                "rows_affected" => $rowsAffected
            ));
        } else {
            error_log("[STATUS UPDATE] No rows were updated for order $id");
            http_response_code(500);
            echo json_encode(array("message" => "No se pudo actualizar el estado del pedido"));
        }
        
    } catch(PDOException $e) {
        error_log("[STATUS UPDATE ERROR] " . $e->getMessage());
        http_response_code(500);
        echo json_encode(array("message" => "Error al actualizar estado del pedido: " . $e->getMessage()));
    }
}

// Función para generar token de seguimiento único
function generateTrackingToken() {
    return 'TRK-' . strtoupper(bin2hex(random_bytes(8))) . '-' . date('Ymd');
}

// Función para obtener pedido por token de seguimiento
function getPedidoByTrackingToken($tracking_token) {
    global $db;
    try {
        $stmt = $db->prepare("
            SELECT p.*, c.nombre, c.apellido, c.email, c.celular, c.direccion,
                   COALESCE((
                       SELECT SUM(dp.precio * dp.cantidad) 
                       FROM detalle_pedido dp 
                       WHERE dp.id_pedido = p.id
                   ), 0) as subtotal
            FROM pedido p 
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente 
            WHERE p.tracking_token = :tracking_token
        ");
        $stmt->bindParam(':tracking_token', $tracking_token);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Obtener detalles del pedido
            $stmt = $db->prepare("
                SELECT dp.*, pr.nombre as producto_nombre 
                FROM detalle_pedido dp 
                INNER JOIN productos pr ON dp.id_producto = pr.id 
                WHERE dp.id_pedido = :id
            ");
            $stmt->bindParam(':id', $pedido['id']);
            $stmt->execute();
            $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate final total
            $subtotal = floatval($pedido['subtotal']);
            $descuento = floatval($pedido['descuento'] ?? 0);
            $aumento = floatval($pedido['aumento'] ?? 0);
            $total = $subtotal - $descuento + $aumento;
            
            $pedido['detalles'] = $detalles;
            $pedido['subtotal'] = number_format($subtotal, 2, '.', '');
            $pedido['total'] = number_format($total, 2, '.', '');
            
            // No mostrar información sensible en tracking público
            unset($pedido['id_cliente']);
            unset($pedido['descuento']);
            unset($pedido['aumento']);
            
            echo json_encode($pedido);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Pedido no encontrado con el token proporcionado"));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("message" => "Error al obtener pedido: " . $e->getMessage()));
    }
}

// Función para actualizar el createPedido para incluir tracking token
function createPedidoWithTracking($id_cliente, $descuento, $metodo_pago, $aumento, $productos){
    global $db;
    try {
        // ================= STOCK VALIDATION =================
        foreach ($productos as $producto) {
            $stmtStock = $db->prepare("SELECT stock, nombre FROM productos WHERE id = :id_producto AND activo = 1");
            $stmtStock->bindParam(':id_producto', $producto['id_producto']);
            $stmtStock->execute();
            if ($stmtStock->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(array("message" => "Producto no encontrado o inactivo", "id_producto" => $producto['id_producto']));
                return;
            }
            $info = $stmtStock->fetch(PDO::FETCH_ASSOC);
            if ($info['stock'] < $producto['cantidad']) {
                http_response_code(400);
                echo json_encode(array(
                    "message" => "Stock insuficiente para producto",
                    "producto" => $info['nombre'],
                    "stock_disponible" => $info['stock'],
                    "solicitado" => $producto['cantidad']
                ));
                return;
            }
        }
        // ================= END VALIDATION =================

        $db->beginTransaction();
        
        // Generar token de seguimiento único
        $tracking_token = generateTrackingToken();
        
        // Crear el pedido con tracking token
        $stmt = $db->prepare("INSERT INTO pedido (id_cliente, descuento, metodo_pago, aumento, estado, tracking_token) VALUES (:id_cliente, :descuento, :metodo_pago, :aumento, 'Pendiente', :tracking_token)");
        $stmt->bindParam(':id_cliente', $id_cliente);
        $stmt->bindParam(':descuento', $descuento);
        $stmt->bindParam(':metodo_pago', $metodo_pago);
        $stmt->bindParam(':aumento', $aumento);
        $stmt->bindParam(':tracking_token', $tracking_token);
        $stmt->execute();
        
        $pedido_id = $db->lastInsertId();
        
        // Agregar productos al detalle del pedido y calcular subtotal
        $subtotal = 0;
        foreach ($productos as $producto) {
            $stmt = $db->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, precio, cantidad) VALUES (:id_pedido, :id_producto, :precio, :cantidad)");
            $stmt->bindParam(':id_pedido', $pedido_id);
            $stmt->bindParam(':id_producto', $producto['id_producto']);
            $stmt->bindParam(':precio', $producto['precio']);
            $stmt->bindParam(':cantidad', $producto['cantidad']);
            $stmt->execute();
            
            // Calcular subtotal
            $subtotal += floatval($producto['precio']) * intval($producto['cantidad']);
            
            // Actualizar stock del producto
            $stmt = $db->prepare("UPDATE productos SET stock = stock - :cantidad WHERE id = :id_producto");
            $stmt->bindParam(':cantidad', $producto['cantidad']);
            $stmt->bindParam(':id_producto', $producto['id_producto']);
            $stmt->execute();
        }
        
        // Calcular total final: subtotal - descuento + aumento
        $total = $subtotal - floatval($descuento) + floatval($aumento);
        
        // Actualizar el pedido con el total calculado
        $stmt = $db->prepare("UPDATE pedido SET total = :total WHERE id = :id");
        $stmt->bindParam(':total', $total);
        $stmt->bindParam(':id', $pedido_id);
        $stmt->execute();
        
        $db->commit();
        
        echo json_encode(array(
            "message" => "Pedido creado con éxito", 
            "id" => $pedido_id, 
            "total" => $total,
            "tracking_token" => $tracking_token,
            "tracking_url" => "/dashboard/tracking.php?token=" . $tracking_token
        ));
    } catch(PDOException $e) {
        $db->rollback();
        http_response_code(500);
        echo json_encode(array("message" => "Error al crear pedido: " . $e->getMessage()));
    }
}


?>
