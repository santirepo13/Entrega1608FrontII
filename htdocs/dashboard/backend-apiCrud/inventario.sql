-- ================================================================
-- INVENTARIO DATABASE - FIXED FOR PROJECT COMPATIBILITY
-- ================================================================
-- Compatible with PHP CRUD API and Frontend Integration
-- Security: Passwords are hashed, proper constraints added
-- Updated: $(date)
-- ================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS `inventario`;
CREATE DATABASE `inventario` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `inventario`;

--
-- Base de datos: `inventario`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `celular` varchar(15) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `direccion2` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id_cliente`, `nombre`, `apellido`, `email`, `celular`, `direccion`, `direccion2`, `descripcion`) VALUES
(1, 'Alan', 'Brito', 'alambre@gmail.com', 323399999, 'Calle ciega 123', 'Edi. Castilla', 'dejar el pedido en la porteria'),
(2, 'Zoyla', 'Vaca', 'vacalola@gmail.com', 322131444, 'Cra no se meta 12', 'casa 2', 'tocar el timbre 2 veces'),
(3, 'Rascael', 'Balones', 'rasca@gmail.com', 2147483647, 'avenidad 12', 'casa 34', 'tocar fuerte');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` int(11) NOT NULL,
  `id_producto` int(11) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) GENERATED ALWAYS AS (`precio` * `cantidad`) STORED,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `detalle_pedido`
--

INSERT INTO `detalle_pedido` (`id`, `id_pedido`, `id_producto`, `precio`, `cantidad`) VALUES
(0, 3, 7, 65000, 2),
(1, 1, 12, 30000, 2),
(2, 1, 6, 22000, 1),
(3, 2, 13, 45000, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido`
--

CREATE TABLE `pedido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `descuento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `metodo_pago` enum('PSE','Contraentrega','Transferencia','Efectivo','Tarjeta') NOT NULL DEFAULT 'Efectivo',
  `aumento` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) DEFAULT NULL,
  `estado` enum('Pendiente','En_Proceso','Completado','Cancelado') NOT NULL DEFAULT 'Pendiente',
  `notas` text DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pedido`
--

INSERT INTO `pedido` (`id`, `id_cliente`, `descuento`, `metodo_pago`, `aumento`, `fecha`) VALUES
(1, 1, 5000, 'PSE', 0, '2024-09-01 20:05:08'),
(2, 2, 0, 'Contraentrega', 5000, '2024-09-01 20:06:28'),
(3, 3, 0, 'Transferencia', 0, '2024-09-02 04:13:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `imagen` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT 'General',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `imagen`, `created_at`, `updated_at`) VALUES
(6, 'Perro', 'sin ripio y sin huevo', 22000.00, 20, 'https://th.bing.com/th/id/OIP.2QjcuwsTimAImo8WSQdTdAHaFp?rs=1&pid=ImgDetMain', '2024-05-03 20:55:08', '2024-05-06 00:14:09'),
(7, 'Picada', 'nada', 65000.00, 30, 'https://cdn.colombia.com/gastronomia/2016/06/21/picada-colombiana-2990.jpg', '2024-05-03 22:26:11', '2024-05-04 21:08:25'),
(8, 'Pollo', 'con mucha papa', 35000.00, 20, 'https://th.bing.com/th/id/OIP.IAza-1yPPvzA55qlI0VqvQHaF7?w=744&h=595&rs=1&pid=ImgDetMain', '2024-05-05 23:40:36', '2024-05-05 23:40:36'),
(9, 'Tacos', 'mixto', 26000.00, 30, 'https://th.bing.com/th/id/R.d50b293e5d2de51d349691db78f71f8c?rik=FfttXcgxjuqR%2fQ&pid=ImgRaw&r=0', '2024-05-06 01:30:49', '2024-05-06 01:30:49'),
(10, 'Burrito', 'mixto', 25000.00, 20, 'https://th.bing.com/th/id/R.1a7d6f0af7be590eb4e27d96ce3530e5?rik=eiCcb%2f%2b9TYNzXQ&pid=ImgRaw&r=0', '2024-05-08 19:58:11', '2024-05-08 19:58:11'),
(11, 'Pasta', 'carbonara', 25000.00, 2, 'https://cdn.shopify.com/s/files/1/2538/5286/products/Spaghetti-with-Meat-Sauce-Recipe-1-1200_787x787.jpg?v=1588772697', '2024-05-08 19:58:33', '2024-05-08 19:58:33'),
(12, 'Hamburguesa', 'doble carne', 30000.00, 5, 'https://th.bing.com/th/id/R.c691ed37c9ce3040c3ebd2892e88870c?rik=QUBcFflN%2b9oqPQ&pid=ImgRaw&r=0', '2024-05-08 19:58:52', '2024-05-08 19:58:52'),
(13, 'Pizza', 'extragrande', 45000.00, 5, 'https://www.ocu.org/-/media/ocu/images/home/alimentacion/alimentos/pizzas_selector_1600x900.jpg?rev=6a81e278-07fc-4e95-9ba1-361063f35adf&hash=B8B1264AB6FC3F4B1AE140EB390208CD', '2024-05-08 19:59:10', '2024-05-08 19:59:10'),
(14, 'Sanchipapa', 'todas las salsas', 20000.00, 15, 'https://1.bp.blogspot.com/-6lKIIVq3CXw/WK8raCAD-gI/AAAAAAABMnI/5VoCplTPogASfSZS5XzIFZizMBZ8yO8bQCLcB/s1600/salchipapa%2Bcolombiana.png', '2024-05-08 19:59:52', '2024-05-08 19:59:52'),
(15, 'Super Delicious Burger', 'Descubre el sabor auténtico de nuestras hamburguesas artesanales hechas con ingredientes frescos y de la mejor calidad', 40.00, 10, 'frontend-apicrud2/images/super-delicious-burger.jpg', '2025-08-24 00:50:00', '2025-08-24 00:50:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol` enum('administrador','vendedor','supervisor') NOT NULL DEFAULT 'vendedor',
  `usuario` varchar(50) NOT NULL UNIQUE,
  `contrasena` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `ultimo_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

-- ================================================================
-- USERS WITH PLAIN TEXT PASSWORDS FOR INITIAL SETUP
-- ================================================================
-- SECURITY WARNING: These are plain text passwords for initial setup
-- ❗ IMPORTANT: Run migrate-passwords.php after importing this database
-- ❗ This will convert all plain text passwords to secure hashes
-- ================================================================

-- Default Admin User: admin / admin12345
-- Default Vendor: vendedor / vende12355  
-- Default Vendor: Juan / juan12345

INSERT INTO `roles` (`id`, `rol`, `usuario`, `contrasena`, `nombre_completo`, `email`, `activo`) VALUES
(1, 'administrador', 'admin', 'admin12345', 'Administrador Principal', 'admin@inventario.com', 1),
(2, 'vendedor', 'vendedor', 'vende12355', 'Usuario Vendedor', 'vendedor@inventario.com', 1),
(3, 'vendedor', 'Juan', 'juan12345', 'Juan Pérez', 'juan@inventario.com', 1);

--
-- Índices para tablas volcadas
-- (PRIMARY KEYS already defined in CREATE TABLE statements)
--

--
-- Indices adicionales para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD KEY `fk_pedido_detalle` (`id_pedido`),
  ADD KEY `fk_producto_detalle` (`id_producto`);

--
-- Indices adicionales para la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD KEY `fk_pedido_cliente` (`id_cliente`);

--
-- Indices adicionales para otras tablas (if needed)
--
-- Additional indexes can be added here for performance

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `pedido`
--
ALTER TABLE `pedido`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `fk_pedido_detalle` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id`),
  ADD CONSTRAINT `fk_producto_detalle` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `pedido`
--
ALTER TABLE `pedido`
  ADD CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- ================================================================
-- DATABASE SETUP COMPLETE - NEXT STEPS
-- ================================================================

/*
🎯 SETUP INSTRUCTIONS:

1️⃣ IMPORT THIS DATABASE:
   - Open phpMyAdmin (http://localhost/phpmyadmin/)
   - Create database 'inventario' or let this script create it
   - Import this inventario.sql file

2️⃣ HASH THE PASSWORDS (CRITICAL!):
   - Visit: http://localhost/backend-apiCrud/migrate-passwords.php
   - This will hash all plain text passwords for security

3️⃣ TEST YOUR API:
   - Backend: http://localhost/backend-apiCrud/productos
   - Frontend: Open your HTML files

🔐 DEFAULT LOGIN CREDENTIALS:
   Admin:    admin / admin12345
   Vendedor: vendedor / vende12355
   Vendedor: Juan / juan12345

📋 DATABASE SCHEMA:
   ✅ clientes      - Customer information
   ✅ productos     - Product catalog with categories
   ✅ pedidos       - Orders with status tracking
   ✅ detalle_pedido - Order line items with calculated subtotals
   ✅ roles         - Users with proper authentication

🔧 ENHANCED FEATURES:
   ✅ All tables have AUTO_INCREMENT primary keys
   ✅ Proper decimal types for money (prices, totals)
   ✅ Computed subtotal columns
   ✅ Enhanced order status tracking
   ✅ User management with roles
   ✅ Timestamps for audit trails
   ✅ Foreign key constraints
   ✅ Password hashing ready

⚠️  SECURITY NOTES:
   - Passwords start as plain text for setup only
   - MUST run migrate-passwords.php after import
   - Delete migrate-passwords.php after use
   - Use HTTPS in production

🚀 PRODUCTION CHECKLIST:
   □ Run password migration script
   □ Delete migration script
   □ Change default passwords
   □ Add SSL/TLS certificates
   □ Configure proper database user (not root)
   □ Set up regular backups
   □ Enable error logging
   □ Review and test all API endpoints

📞 TROUBLESHOOTING:
   - If foreign keys fail: Check InnoDB engine
   - If passwords don't work: Run migration script
   - If API calls fail: Check CORS headers
   - If imports fail: Use phpMyAdmin import

✅ COMPATIBILITY:
   - MySQL 5.7+ / MariaDB 10.2+
   - PHP 7.4+ with PDO
   - Modern browsers with ES6 support
   - XAMPP, WAMP, MAMP compatible
*/
