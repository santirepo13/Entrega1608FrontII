<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Allow: GET, POST, OPTIONS, PUT, DELETE");
$method = $_SERVER['REQUEST_METHOD'];
if($method == "OPTIONS") {
    die();
}

require("backend-apiCrud/operaciones.php");
$ruta = $_GET['url'] ?? '';
$id = $_GET['id'] ?? null;

// Helper: parse JSON or form body into an associative array
function parse_body() {
    $raw = file_get_contents("php://input");
    $data = null;
    if ($raw !== false && strlen($raw)) {
        $decoded = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $data = $decoded;
        }
    }
    if (!is_array($data)) {
        // Fallback to application/x-www-form-urlencoded
        $data = $_POST ?: [];
    }
    return $data;
}

// ==================== RUTAS DE AUTENTICACIÓN ====================
if ($ruta === 'login') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['usuario']) || !isset($data['contrasena'])) {
            http_response_code(400);
            echo json_encode(array("message" => "Datos de login incompletos"));
            return;
        }
        $usuario = $data['usuario'];
        $contrasena = $data['contrasena'];

        $userData = login($usuario, $contrasena);
        if ($userData) {
            http_response_code(200);
            $userData['message'] = 'inicio correcto';
            echo json_encode($userData);
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Credenciales incorrectas"));
        }
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE PRODUCTOS ====================
else if ($ruta === 'productos') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($id) {
            getProductById($id);
        } else {
            $stmt = $db->query("SELECT * FROM productos ORDER BY id DESC");
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($productos);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = parse_body();
        // Validate required fields
        if (!isset($data['nombre'], $data['descripcion'], $data['precio'], $data['stock'], $data['imagen'])) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan campos requeridos: nombre, descripcion, precio, stock, imagen"]);
            return;
        }
        $nombre = $data['nombre'];
        $descripcion = $data['descripcion'];
        $precio = $data['precio'];
        $stock = $data['stock'];
        $imagen = $data['imagen'];
        createProduct($nombre, $descripcion, $precio, $stock, $imagen);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = parse_body();
        if (!isset($data['id'], $data['nombre'], $data['descripcion'], $data['precio'], $data['stock'], $data['imagen'])) {
            http_response_code(400);
            echo json_encode(["message" => "Faltan campos requeridos para actualizar: id, nombre, descripcion, precio, stock, imagen"]);
            return;
        }
        $id = $data['id'];
        $nombre = $data['nombre'];
        $descripcion = $data['descripcion'];
        $precio = $data['precio'];
        $stock = $data['stock'];
        $imagen = $data['imagen'];
        updateProducts($id, $nombre, $descripcion, $precio, $stock, $imagen);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = parse_body();
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["message" => "Falta el campo requerido: id"]);
            return;
        }
        $id = $data['id'];
        deleteProduct($id);
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE CLIENTES ====================
else if ($ruta === 'clientes') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($id) {
            getClienteById($id);
        } else {
            getAllClientes();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = parse_body();
        $required = ['nombre','apellido','email','celular','direccion','direccion2','descripcion'];
        foreach ($required as $k) { if (!isset($data[$k])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: $k"]); return; } }
        createCliente(
            $data['nombre'],
            $data['apellido'],
            $data['email'],
            $data['celular'],
            $data['direccion'],
            $data['direccion2'],
            $data['descripcion']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = parse_body();
        $required = ['id_cliente','nombre','apellido','email','celular','direccion','direccion2','descripcion'];
        foreach ($required as $k) { if (!isset($data[$k])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: $k"]); return; } }
        updateCliente(
             $data['id_cliente'], // ✅ corregido
            $data['nombre'],
            $data['apellido'],
            $data['email'],
            $data['celular'],
            $data['direccion'],
            $data['direccion2'],
            $data['descripcion']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = parse_body();
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: id"]); return; }
        deleteCliente($data['id']);
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE PEDIDOS ====================
else if ($ruta === 'pedidos') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($id) {
            getPedidoById($id);
        } else {
            getAllPedidos();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = parse_body();
        $required = ['id_cliente','descuento','metodo_pago','aumento','productos'];
        foreach ($required as $k) { if (!isset($data[$k])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: $k"]); return; } }
        createPedido(
            $data['id_cliente'],
            $data['descuento'],
            $data['metodo_pago'],
            $data['aumento'],
            $data['productos']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = parse_body();
        $required = ['id','id_cliente','descuento','metodo_pago','aumento'];
        foreach ($required as $k) { if (!isset($data[$k])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: $k"]); return; } }
        updatePedido(
            $data['id'],
            $data['id_cliente'],
            $data['descuento'],
            $data['metodo_pago'],
            $data['aumento']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = parse_body();
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: id"]); return; }
        deletePedido($data['id']);
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE USUARIOS ====================
else if ($ruta === 'usuarios') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($id) {
            getUserById($id);
        } else {
            getAllUsuarios();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = parse_body();
        if (!isset($data['rol'], $data['usuario'], $data['contrasena'])) { http_response_code(400); echo json_encode(["message"=>"Faltan campos requeridos: rol, usuario, contrasena"]); return; }
        createUser($data['rol'], $data['usuario'], $data['contrasena']);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = parse_body();
        if (!isset($data['id'], $data['rol'], $data['usuario'])) { http_response_code(400); echo json_encode(["message"=>"Faltan campos requeridos: id, rol, usuario"]); return; }
        updateUser(
            $data['id'],
            $data['rol'],
            $data['usuario'],
            $data['contrasena'] ?? null
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = parse_body();
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: id"]); return; }
        deleteUser($data['id']);
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE DETALLE PEDIDO ====================
else if ($ruta === 'detalle-pedido') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $id_pedido = $_GET['id_pedido'] ?? null;
        if ($id_pedido) {
            getDetallesByPedido($id_pedido);
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "ID de pedido requerido"));
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = parse_body();
        $required = ['id_pedido','id_producto','precio','cantidad'];
        foreach ($required as $k) { if (!isset($data[$k])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: $k"]); return; } }
        createDetallePedido(
            $data['id_pedido'],
            $data['id_producto'],
            $data['precio'],
            $data['cantidad']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = parse_body();
        if (!isset($data['id'], $data['precio'], $data['cantidad'])) { http_response_code(400); echo json_encode(["message"=>"Faltan campos requeridos: id, precio, cantidad"]); return; }
        updateDetallePedido($data['id'], $data['precio'], $data['cantidad']);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = parse_body();
        if (!isset($data['id'])) { http_response_code(400); echo json_encode(["message"=>"Falta el campo requerido: id"]); return; }
        deleteDetallePedido($data['id']);
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTA NO ENCONTRADA ====================
else {
    http_response_code(404);
    echo json_encode(array("message" => "Ruta no encontrada"));
}
?>
