<?php
// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seguimiento de Pedido - Burger</title>
  <link rel="shortcut icon" type="image" href="Restaurante/platilla-carrito/images/logo.png">
  <link rel="stylesheet" href="Restaurante/platilla-carrito/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
  <!-- bootstrap links -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <!-- fonts links -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
  <style>
        body {
            /* Match restaurant theme */
            background-color: #f8f9fa;
            min-height: 100vh;
        }
        
        .tracking-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .tracking-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
        }
        
        .tracking-header {
            background-color: #ffc800;
            color: #222;
            padding: 30px;
            text-align: center;
        }
        
        .tracking-header h1 {
            font-weight: bold;
            font-size: 28px;
        }
        
        .status-timeline {
            position: relative;
            padding: 40px 20px;
        }
        
        .timeline-item {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            position: relative;
        }
        
        .timeline-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20px;
            z-index: 2;
        }
        
        .timeline-content {
            flex: 1;
        }
        
        .timeline-item:not(:last-child)::before {
            content: '';
            position: absolute;
            left: 25px;
            top: 50px;
            width: 2px;
            height: 30px;
            background: #e9ecef;
        }
        
        .timeline-item.completed .timeline-icon {
            background: #28a745;
            color: white;
        }
        
        .timeline-item.current .timeline-icon {
            background: #ffc107;
            color: black;
            animation: pulse 2s infinite;
        }
        
        .timeline-item.pending .timeline-icon {
            background: #e9ecef;
            color: #6c757d;
        }
        
        .timeline-item.completed::before {
            background: #28a745;
        }
        
        .timeline-item.current::before {
            background: linear-gradient(to bottom, #28a745, #e9ecef);
        }
        
        .order-details {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .product-item {
            border-bottom: 1px solid #dee2e6;
            padding: 10px 0;
        }
        
        .product-item:last-child {
            border-bottom: none;
        }
        
        .error-message {
            text-align: center;
            padding: 40px;
            color: #dc3545;
        }
        
        .loading {
            text-align: center;
            padding: 60px;
        }
        
        .spinner-border {
            width: 3rem;
            height: 3rem;
        }
    </style>
</head>
<body>
  <!-- nav section -->
    <nav class="navbar navbar-expand-lg" id="navbar">
      <div class="container-fluid">
        <a class="navbar-brand" href="Restaurante/platilla-carrito/index.html" id="logo"><img src="Restaurante/platilla-carrito/images/logo.png" alt="" width="30px">BUR<span>GER</span></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span><i class="fa-solid fa-bars"></i></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" href="Restaurante/platilla-carrito/index.html">Inicio</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="Restaurante/platilla-carrito/index.html#menu">Menú</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Categorías
              </a>
              <ul class="dropdown-menu" aria-labelledby="navbarDropdown" style="background-color: #ffc800;">
                <li><a class="dropdown-item" href="Restaurante/platilla-carrito/index.html#menu">Hamburguesas</a></li>
                <li><a class="dropdown-item" href="Restaurante/platilla-carrito/index.html#menu">Pizza</a></li>
                <li><a class="dropdown-item" href="Restaurante/platilla-carrito/index.html#menu">Pollo Frito</a></li>
                <li><a class="dropdown-item" href="Restaurante/platilla-carrito/index.html#menu">Acompañamientos y Papas</a></li>
              </ul>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="Restaurante/platilla-carrito/about.html">Acerca de Nosotros</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="Restaurante/platilla-carrito/contact.html">Contáctanos</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="Restaurante/platilla-carrito/services.html">Servicios</a>
            </li>
          </ul>
          
          <form class="d-flex">
            <div class="icons">
              <i class="fa-regular fa-user"></i>
              <div class="carrito">
                <a href="Restaurante/platilla-carrito/cart.html" style="color: inherit; text-decoration: none;">
                  <i class="fa-solid fa-cart-shopping"></i>
                  <span class="contar-pro">0</span>
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </nav>
    <!-- nav section -->
     <!-- tracking section -->
     <h2 class="page-title text-center my-5 py-3" style="background-color: #ffc800;">SEGUIMIENTO DE PEDIDO</h2>
     <div class="page-content">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 col-md-10">
                    <!-- Success Message -->
                    <div class="text-center mb-5">
                        <div class="success-icon mb-4">
                            <i class="fa-solid fa-route" style="font-size: 72px; color: #ffc800;"></i>
                        </div>
                        <h2 class="mb-3" style="color: #ffc800;">Seguimiento de Pedido</h2>
                        <p class="lead mb-4">Consulta el estado de tu pedido en tiempo real.</p>
                    </div>
                    
                    <div id="trackingContent">
                        <div class="loading text-center">
                            <div class="spinner-border" style="color: #ffc800;" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                            <p class="mt-3">Consultando estado del pedido...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
     </div>
     <!-- tracking section -->
   <!-- footer -->
    <footer id="footer" style="margin-top: 50px;">
     <div class="footer-top">
       <div class="container">
         <div class="row">
           <div class="col-lg-3 col-md-6 footer-contact">
             <a class="navbar-brand" href="Restaurante/platilla-carrito/index.html" id="logo2"><img src="Restaurante/platilla-carrito/images/logo.png" alt="" width="30px">Burger</a>
             <p>Tu destino favorito de hamburguesas con comida de calidad y servicio excepcional.</p><br>
             <p>
               Calle del Restaurante 123 <br><br>
               Distrito Gastronómico <br><br>
               Ciudad, Estado 12345 <br><br>
             </p>
             <strong><i class="fa-solid fa-phone"></i> Teléfono: <strong>+1-234-567-8900</strong></strong><br>
             <strong><i class="fa-solid fa-envelope"></i> Email: <strong>info@restauranteburger.com</strong></strong>
           </div>
           <div class="col-lg-3 col-md-6 footer-links">
             <h4>Enlaces Útiles</h4>
             <ul>
               <li><a href="Restaurante/platilla-carrito/index.html">Inicio</a></li>
               <li><a href="Restaurante/platilla-carrito/about.html">Acerca de</a></li>
               <li><a href="Restaurante/platilla-carrito/contact.html">Contacto</a></li>
               <li><a href="Restaurante/platilla-carrito/services.html">Servicios</a></li>
               <li><a href="#">Política de Privacidad</a></li>
             </ul>
           </div>
           
           <div class="col-lg-3 col-md-6 footer-links">
             <h4>Nuestros Servicios</h4>
             <p>Ofrecemos una variedad de opciones deliciosas para todos los gustos.</p>
             <ul>
               <li><a href="Restaurante/platilla-carrito/index.html#menu">Hamburguesas</a></li>
               <li><a href="Restaurante/platilla-carrito/index.html#menu">Pizza</a></li>
               <li><a href="Restaurante/platilla-carrito/index.html#menu">Pollo Frito</a></li>
               <li><a href="Restaurante/platilla-carrito/index.html#menu">Acompañamientos y Papas</a></li>
             </ul>
           </div>
           
           <div class="col-lg-3 col-md-6 footer-links">
             <h4>Síguenos</h4>
             <p>Manténte conectado con nosotros en redes sociales para actualizaciones y ofertas especiales.</p>
             <div class="socail-links mt-3">
               <a href="#"><i class="fa-brands fa-twitter"></i></a>
               <a href="#"><i class="fa-brands fa-facebook"></i></a>
               <a href="#"><i class="fa-brands fa-google-plus"></i></a>
               <a href="#"><i class="fa-brands fa-instagram"></i></a>
               <a href="#"><i class="fa-brands fa-linkedin-in"></i></a>
             </div>
           </div>
 
         </div>
       </div>
     </div>
   
   <hr>
   <div class="container py-4">
     <div class="copyright">
       &copy; Copyright <strong>Burger</strong>. Todos los derechos reservados
     </div>
     <div class="credits">
       Diseñado por <a href="#">SA coding</a>
     </div>
   </div>
    </footer>
 
   <!-- footer -->
   <a href="#" class="arrow"><i class="fa-solid fa-arrow-up"></i></a>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        let currentToken = null;
        let autoRefreshInterval = null;
        
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            if (!token) {
                showError('Token de seguimiento no proporcionado');
                return;
            }
            
            currentToken = token;
            trackOrder(token);
            startAutoRefresh();
        });
        
        function startAutoRefresh() {
            // Auto-refresh every 30 seconds
            autoRefreshInterval = setInterval(() => {
                if (currentToken) {
                    trackOrder(currentToken, true); // silent refresh
                }
            }, 30000);
        }
        
        function stopAutoRefresh() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }
        
        function refreshTracking() {
            const btn = document.getElementById('refresh-btn');
            const originalContent = btn.innerHTML;
            
            // Show loading state
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Actualizando...';
            
            trackOrder(currentToken).then(() => {
                // Restore button
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }, 1000);
            }).catch(() => {
                // Restore button on error
                btn.disabled = false;
                btn.innerHTML = originalContent;
            });
        }
        
        async function trackOrder(token) {
            try {
                const response = await fetch(`backend-apiCrud/index.php?url=tracking&token=${token}`);
                const data = await response.json();
                
                if (response.ok) {
                    displayOrderTracking(data);
                } else {
                    showError(data.message || 'Pedido no encontrado');
                }
            } catch (error) {
                console.error('Error:', error);
                showError('Error al consultar el seguimiento del pedido');
            }
        }
        
        function displayOrderTracking(order) {
            const currentStatus = order.estado || 'Pendiente';
            const statuses = [
                { key: 'Pendiente', label: 'Pedido Recibido', icon: 'fas fa-clipboard-check', description: 'Tu pedido ha sido recibido y está siendo procesado' },
                { key: 'Confirmado', label: 'Pedido Confirmado', icon: 'fas fa-check-circle', description: 'Tu pedido ha sido confirmado y aceptado' },
                { key: 'En Preparación', label: 'En Preparación', icon: 'fas fa-utensils', description: 'Los chefs están preparando tu deliciosa comida' },
                { key: 'En Camino', label: 'En Camino', icon: 'fas fa-motorcycle', description: 'Tu pedido está en camino a tu dirección' },
                { key: 'Entregado', label: 'Entregado', icon: 'fas fa-home', description: 'Tu pedido ha sido entregado ¡Disfrútalo!' }
            ];
            
            let timeline = '';
            let currentIndex = statuses.findIndex(s => s.key === currentStatus);
            
            statuses.forEach((status, index) => {
                let itemClass = 'pending';
                if (index < currentIndex) {
                    itemClass = 'completed';
                } else if (index === currentIndex) {
                    itemClass = 'current';
                }
                
                timeline += `
                    <div class="timeline-item ${itemClass}">
                        <div class="timeline-icon">
                            <i class="${status.icon}"></i>
                        </div>
                        <div class="timeline-content">
                            <h6 class="mb-1">${status.label}</h6>
                            <p class="text-muted mb-0">${status.description}</p>
                        </div>
                    </div>
                `;
            });
            
            // Build products list
            let productsList = '';
            if (order.detalles && order.detalles.length > 0) {
                order.detalles.forEach(product => {
                    productsList += `
                        <div class="product-item d-flex justify-content-between">
                            <span>${product.producto_nombre} x${product.cantidad}</span>
                            <span class="fw-bold">$${parseFloat(product.precio * product.cantidad).toLocaleString()}</span>
                        </div>
                    `;
                });
            }
            
            const content = `
                <!-- Order Details -->
                <div class="card shadow-sm mb-4" id="order-details">
                    <div class="card-header" style="background-color: #ffc800;">
                        <h5 class="mb-0"><i class="fa-solid fa-receipt me-2"></i>Detalles del Pedido</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Número de Pedido:</strong> <span>#${order.id}</span></p>
                                <p><strong>Cliente:</strong> <span>${order.nombre} ${order.apellido}</span></p>
                                <p><strong>Email:</strong> <span>${order.email || 'N/A'}</span></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Teléfono:</strong> <span>${order.celular}</span></p>
                                <p><strong>Dirección:</strong> <span>${order.direccion}</span></p>
                                <p><strong>Método de Pago:</strong> <span>${order.metodo_pago}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Products Ordered -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header" style="background-color: #ffc800;">
                        <h5 class="mb-0"><i class="fa-solid fa-shopping-bag me-2"></i>Productos Ordenados</h5>
                    </div>
                    <div class="card-body">
                        <div class="products-list">
                            ${productsList}
                        </div>
                    </div>
                </div>
                
                <!-- Order Total -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header" style="background-color: #ffc800;">
                        <h5 class="mb-0"><i class="fa-solid fa-calculator me-2"></i>Resumen de Pago</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6"><strong>Subtotal:</strong></div>
                            <div class="col-6 text-end"><span>$${parseFloat(order.subtotal || 0).toFixed(2)}</span></div>
                        </div>
                        <div class="row">
                            <div class="col-6">Valor Domicilio:</div>
                            <div class="col-6 text-end"><span>$${parseFloat(order.aumento || 0).toFixed(2)}</span></div>
                        </div>
                        <div class="row">
                            <div class="col-6">Descuento:</div>
                            <div class="col-6 text-end text-success"><span>-$${parseFloat(order.descuento || 0).toFixed(2)}</span></div>
                        </div>
                        <hr>
                        <div class="row">
                            <div class="col-6"><h5>Total:</h5></div>
                            <div class="col-6 text-end"><h5 style="color: #ffc800;">$${parseFloat(order.total).toFixed(2)}</h5></div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-12">
                                <small class="text-muted">Fecha: ${new Date(order.fecha).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Order Timeline -->
                <div class="card shadow-sm mb-4">
                    <div class="card-header" style="background-color: #ffc800;">
                        <h5 class="mb-0"><i class="fa-solid fa-route me-2"></i>Estado del Pedido</h5>
                    </div>
                    <div class="card-body">
                        <div class="status-timeline">
                            ${timeline}
                        </div>
                    </div>
                </div>
                
                <!-- Auto Refresh Info -->
                <div class="alert alert-info text-center mb-4">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <i class="fas fa-sync-alt me-2"></i>
                            <span>Actualización automática cada 30 segundos</span>
                            <small class="d-block text-muted">Última actualización: <span id="last-update"></span></small>
                        </div>
                        <div class="col-md-4">
                            <button onclick="refreshTracking()" class="btn btn-outline-primary btn-sm" id="refresh-btn">
                                <i class="fas fa-sync-alt me-1"></i>Actualizar Ahora
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="text-center">
                    <a href="Restaurante/platilla-carrito/index.html" class="cus-btn dark me-3">
                        <span class="icon-wrapper">
                            <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M16.2522 11.9789C14.4658 10.1925 13.7513 6.14339 15.6567 4.23792M15.6567 4.23792C14.565 5.3296 11.4885 7.21521 7.91576 3.64246M15.6567 4.23792L4.34301 15.5516" stroke="#FCFDFD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </span>
                        Realizar Otra Compra
                    </a>
                    <button onclick="window.print()" class="cus-btn primary">
                        <span class="icon-wrapper">
                            <i class="fa-solid fa-print"></i>
                        </span>
                        Imprimir Seguimiento
                    </button>
                </div>
            `;
            
            document.getElementById('trackingContent').innerHTML = content;
            
            // Update last refresh time
            setTimeout(() => {
                const lastUpdateElement = document.getElementById('last-update');
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = new Date().toLocaleTimeString();
                }
            }, 100);
        }
        
        function showError(message) {
            const content = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4>Oops!</h4>
                    <p>${message}</p>
                    <button onclick="window.location.href='Restaurante/platilla-carrito/index.html'" class="btn btn-primary">
                        <i class="fas fa-home"></i> Volver al Inicio
                    </button>
                </div>
            `;
            document.getElementById('trackingContent').innerHTML = content;
        }
    </script>
</body>
</html>
