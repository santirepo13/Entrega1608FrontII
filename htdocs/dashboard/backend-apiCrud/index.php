<?php
ob_start(); // Iniciar el buffer de salida

// Establecer un manejador de errores personalizado
set_error_handler(function($severity, $message, $file, $line) {
    ob_clean(); // Limpiar cualquier salida anterior
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Error interno del servidor',
        'details' => [
            'severity' => $severity,
            'message' => $message,
            'file' => $file,
            'line' => $line
        ]
    ]);
    exit;
});

error_reporting(0);
ini_set('display_errors', 0);

// Security headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Allow: GET, POST, OPTIONS, PUT, DELETE');

// Cache control headers
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
$method = $_SERVER['REQUEST_METHOD'];
if($method == "OPTIONS") {
    die();
}

require("operaciones.php");
$ruta = $_GET['url'] ?? '';
$id = $_GET['id'] ?? null;

// ==================== RUTAS DE AUTENTICACIÓN ====================
if ($ruta === 'login') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(array("message" => "Invalid JSON data"));
            exit;
        }
        
        if (!isset($data['usuario'])) {
            http_response_code(400);
            echo json_encode(array("message" => "usuario field is required"));
            exit;
        }
        
        $usuario = $data['usuario'];
        $contrasena = $data['password'] ?? $data['contrasena'] ?? null;
        
        if ($contrasena === null) {
            http_response_code(400);
            echo json_encode(array("message" => "password field is required"));
            exit;
        }

        $userData = login($usuario, $contrasena);
if ($userData) {
            http_response_code(200);
            $userData['message'] = 'inicio correcto';
            echo json_encode($userData);
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Credenciales incorrectas o error en el servidor"));
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
            // Show only active products by default, unless specifically requesting inactive ones
            $showInactive = isset($_GET['show_inactive']) && $_GET['show_inactive'] == '1';
            if ($showInactive) {
                $stmt = $db->query("SELECT * FROM productos ORDER BY id DESC");
            } else {
                $stmt = $db->query("SELECT * FROM productos WHERE activo = 1 ORDER BY id DESC");
            }
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($productos);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(array("message" => "Invalid JSON data for product creation"));
            exit;
        }
        
        // Check required fields
        $required_fields = ['nombre', 'descripcion', 'precio', 'stock', 'imagen'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                http_response_code(400);
                echo json_encode(array("message" => "Field '{$field}' is required"));
                exit;
            }
        }
        
        $nombre = $data['nombre'];
        $descripcion = $data['descripcion'];
        $precio = $data['precio'];
        $stock = $data['stock'];
        $imagen = $data['imagen'];
        createProduct($nombre, $descripcion, $precio, $stock, $imagen);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        $id = $data['id'];
        $nombre = $data['nombre'];
        $descripcion = $data['descripcion'];
        $precio = $data['precio'];
        $stock = $data['stock'];
        $imagen = $data['imagen'];
        updateProducts($id, $nombre, $descripcion, $precio, $stock, $imagen);
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Handle case where JSON decode fails or data is null
        if ($data === null) {
            http_response_code(400);
            echo json_encode(array("message" => "Invalid JSON data for DELETE request"));
            exit;
        }
        
        // Check if ID is provided
        if (!isset($data['id']) || empty($data['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "Product ID is required for deletion"));
            exit;
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
        $data = json_decode(file_get_contents("php://input"), true);
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
        $data = json_decode(file_get_contents("php://input"), true);
        updateCliente(
             $data['id_cliente'],
            $data['nombre'],
            $data['apellido'],
            $data['email'],
            $data['celular'],
            $data['direccion'],
            $data['direccion2'],
            $data['descripcion']
        );
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
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
        $raw_input = file_get_contents("php://input");
        $data = json_decode($raw_input, true);
        
        // Debug logging
        error_log("[DEBUG] Raw input: " . $raw_input);
        error_log("[DEBUG] Parsed data: " . print_r($data, true));
        error_log("[DEBUG] id_cliente isset: " . (isset($data['id_cliente']) ? 'YES' : 'NO'));
        error_log("[DEBUG] productos isset: " . (isset($data['productos']) ? 'YES' : 'NO'));
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(array("message" => "JSON inválido: " . json_last_error_msg()));
        } elseif (!isset($data['id_cliente']) || !isset($data['productos'])) {
            http_response_code(400);
            echo json_encode(array(
                "message" => "id_cliente y productos son requeridos",
                "received_keys" => array_keys($data ?: []),
                "id_cliente_value" => $data['id_cliente'] ?? 'NOT_SET',
                "productos_value" => $data['productos'] ?? 'NOT_SET'
            ));
        } else {
            // Use new createPedidoWithTracking function for orders with tracking tokens
            createPedidoWithTracking(
                $data['id_cliente'],
                $data['descuento'] ?? 0,
                $data['metodo_pago'] ?? 'efectivo',
                $data['aumento'] ?? 0,
                $data['productos']
            );
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del pedido es requerido"));
        } else {
            updatePedido(
                $data['id'],
                $data['id_cliente'],
                $data['descuento'] ?? 0,
                $data['metodo_pago'] ?? 'efectivo',
                $data['aumento'] ?? 0
            );
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del pedido es requerido"));
        } else {
            deletePedido($data['id']);
        }
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE USUARIOS/ROLES ====================
else if ($ruta === 'usuarios') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ($id) {
            getUserById($id);
        } else {
            getAllUsuarios();
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['rol']) || !isset($data['usuario']) || !isset($data['contrasena'])) {
            http_response_code(400);
            echo json_encode(array("message" => "rol, usuario y contrasena son requeridos"));
        } else {
            // Hash password for security
            $hashedPassword = password_hash($data['contrasena'], PASSWORD_DEFAULT);
            createUser($data['rol'], $data['usuario'], $hashedPassword);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del usuario es requerido"));
        } else {
            $hashedPassword = null;
            if (isset($data['contrasena']) && !empty($data['contrasena'])) {
                $hashedPassword = password_hash($data['contrasena'], PASSWORD_DEFAULT);
            }
            updateUser(
                $data['id'],
                $data['rol'],
                $data['usuario'],
                $hashedPassword
            );
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del usuario es requerido"));
        } else {
            deleteUser($data['id']);
        }
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido"));
    }
}

// ==================== RUTAS DE ESTADO DE PEDIDO ====================
else if ($ruta === 'pedidos/status') {
    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['id']) || !isset($data['estado'])) {
            http_response_code(400);
            echo json_encode(array("message" => "ID del pedido y estado son requeridos"));
        } else {
            updatePedidoStatus($data['id'], $data['estado']);
        }
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido. Use PUT para actualizar estado."));
    }
}

// ==================== RUTAS DE TRACKING ====================
else if ($ruta === 'tracking') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $token = $_GET['token'] ?? null;
        if (!$token) {
            http_response_code(400);
            echo json_encode(array("message" => "Token de seguimiento es requerido"));
        } else {
            getPedidoByTrackingToken($token);
        }
    } else {
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido. Use GET para consultar tracking."));
    }
}

// ==================== DEFAULT: API INFO ====================
else {
    header('Content-Type: application/json');
    $apiInfo = [
        'name' => 'Backend API CRUD',
        'version' => '1.0.0',
        'status' => 'active',
        'base_url' => 'http://localhost/dashboard/backend-apiCrud/',
        'endpoints' => [
            'GET /productos' => 'Get all products',
            'POST /productos' => 'Create new product',
            'PUT /productos' => 'Update product',
            'DELETE /productos' => 'Delete product',
            'GET /clientes' => 'Get all clients',
            'POST /clientes' => 'Create new client',
            'PUT /clientes' => 'Update client',
            'DELETE /clientes' => 'Delete client',
            'GET /pedidos' => 'Get all orders',
            'POST /pedidos' => 'Create new order',
            'PUT /pedidos' => 'Update order',
            'DELETE /pedidos' => 'Delete order',
            'GET /usuarios' => 'Get all users',
            'POST /usuarios' => 'Create new user',
            'PUT /usuarios' => 'Update user',
            'DELETE /usuarios' => 'Delete user',
            'POST /login' => 'User authentication'
        ],
        'message' => 'Welcome to the Backend API. Use the endpoints above.'
    ];
ob_end_clean();
    echo json_encode($apiInfo, JSON_PRETTY_PRINT);
}
?>
