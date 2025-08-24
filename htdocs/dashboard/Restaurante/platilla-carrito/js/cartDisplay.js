/**
 * Archivo dedicado para mostrar los productos del carrito en cart.html
 * Muestra productos guardados en localStorage con funcionalidad completa
 */

// Función principal para mostrar productos en cart.html
function mostrarProductosCarrito() {
    console.log("=== INICIANDO mostrarProductosCarrito ===");
    
    // Obtener carrito desde localStorage
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let cartTableBody = document.querySelector(".cart-table tbody");
    
    console.log("Productos en carrito:", carrito.length);
    console.log("Tabla encontrada:", !!cartTableBody);
    
    // Verificar si estamos en cart.html
    if (!cartTableBody) {
        console.log("No se encontró la tabla del carrito - no estamos en cart.html");
        return;
    }
    
    // Limpiar tabla existente
    cartTableBody.innerHTML = "";
    
    // Si el carrito está vacío
    if (carrito.length === 0) {
        mostrarCarritoVacio(cartTableBody);
        actualizarResumenCarrito(0);
        return;
    }
    
    // Variables para cálculos
    let subtotalGeneral = 0;
    
    // Mostrar cada producto en la tabla
    carrito.forEach((producto, index) => {
        let cantidad = producto.cantidad || 1;
        let precioUnitario = parseFloat(producto.precio) || 0;
        let subtotalProducto = precioUnitario * cantidad;
        subtotalGeneral += subtotalProducto;
        
        console.log(`Producto ${index + 1}: ${producto.nombre} - Cantidad: ${cantidad} - Subtotal: $${subtotalProducto.toFixed(2)}`);
        
        // Crear fila para el producto
        let filaProducto = crearFilaProducto(producto, index, cantidad, precioUnitario, subtotalProducto);
        cartTableBody.appendChild(filaProducto);
    });
    
    console.log(`Subtotal general: $${subtotalGeneral.toFixed(2)}`);
    
    // Actualizar resumen de la orden
    actualizarResumenCarrito(subtotalGeneral);
    
    console.log("=== FINALIZANDO mostrarProductosCarrito ===");
}

// Función para crear una fila de producto en la tabla
function crearFilaProducto(producto, index, cantidad, precioUnitario, subtotalProducto) {
    let fila = document.createElement("tr");
    fila.setAttribute("data-index", index);
    
    fila.innerHTML = `
        <td class="product-block">
            <a href="#" class="remove-from-cart-btn" onclick="eliminarProductoDelCarrito(${index})" 
               style="color: red; margin-right: 10px; font-size: 18px; text-decoration: none;">
                <i class="fa-solid fa-x"></i>
            </a>
            <img src="${producto.imagen}" alt="${producto.nombre}" style="width: 80px; height: 80px; object-fit: cover; margin-right: 15px;">
            <a href="#" class="h6" style="text-decoration: none; color: #333;">
                ${producto.nombre}
                <br><small class="text-muted">${producto.descripcion || ''}</small>
            </a>
        </td>
        <td>
            <p class="lead color-black">$${precioUnitario.toFixed(2)}</p>
        </td>
        <td style="vertical-align: middle;">
            <div class="quantity quantity-wrap d-flex align-items-center">
                <button class="btn btn-outline-secondary btn-sm" onclick="decrementarCantidadProducto(${index})" style="margin-right: 10px;">
                    <i class="fa-solid fa-minus"></i>
                </button>
                <input type="text" value="${cantidad}" maxlength="2" size="2" class="form-control text-center" 
                       style="width: 60px; margin: 0 5px;" readonly>
                <button class="btn btn-outline-secondary btn-sm" onclick="incrementarCantidadProducto(${index})" style="margin-left: 10px;">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </td>
        <td>
            <h6 class="color-primary">$${subtotalProducto.toFixed(2)}</h6>
        </td>
    `;
    
    return fila;
}

// Función para mostrar mensaje cuando el carrito está vacío
function mostrarCarritoVacio(cartTableBody) {
    cartTableBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center py-5">
                <div style="padding: 40px;">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 48px; color: #ffc800; margin-bottom: 20px;"></i>
                    <h5 class="mb-3">Tu carrito está vacío</h5>
                    <p class="lead mb-4">¡Agrega algunos deliciosos productos para comenzar tu pedido!</p>
                    <a href="index.html" class="btn btn-primary" style="background-color: #ffc800; border-color: #ffc800;">
                        <i class="fa-solid fa-arrow-left"></i> Continuar Comprando
                    </a>
                </div>
            </td>
        </tr>
    `;
}

// Función para actualizar el resumen de la orden
function actualizarResumenCarrito(subtotal) {
    console.log("=== ACTUALIZANDO RESUMEN DE CARRITO ===");
    
    let valorDomicilio = 5.00;
    let descuentoPromo = 5.00;
    let total = subtotal + valorDomicilio - descuentoPromo;
    
    console.log(`Subtotal: $${subtotal.toFixed(2)}`);
    console.log(`Valor domicilio: $${valorDomicilio.toFixed(2)}`);
    console.log(`Descuento: -$${descuentoPromo.toFixed(2)}`);
    console.log(`Total: $${total.toFixed(2)}`);
    
    // Actualizar subtotal en el resumen
    let subtotalElement = document.querySelector('.cart-summary .d-flex:nth-child(1) .lead:last-child');
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        console.log("✅ Subtotal actualizado");
    }
    
    // Actualizar total en el resumen
    let totalElement = document.querySelector('.cart-summary h5.color-primary:last-child');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
        console.log("✅ Total actualizado");
    }
    
    console.log("=== RESUMEN ACTUALIZADO ===");
}

// Función para incrementar cantidad de un producto
function incrementarCantidadProducto(index) {
    console.log(`Incrementando cantidad del producto en index: ${index}`);
    
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    if (carrito[index]) {
        carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
        localStorage.setItem("carrito", JSON.stringify(carrito));
        
        console.log(`Nueva cantidad: ${carrito[index].cantidad}`);
        
        // Recargar la vista del carrito
        mostrarProductosCarrito();
        actualizarContadorCarrito();
    }
}

// Función para decrementar cantidad de un producto
function decrementarCantidadProducto(index) {
    console.log(`Decrementando cantidad del producto en index: ${index}`);
    
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    if (carrito[index] && (carrito[index].cantidad || 1) > 1) {
        carrito[index].cantidad = (carrito[index].cantidad || 1) - 1;
        localStorage.setItem("carrito", JSON.stringify(carrito));
        
        console.log(`Nueva cantidad: ${carrito[index].cantidad}`);
        
        // Recargar la vista del carrito
        mostrarProductosCarrito();
        actualizarContadorCarrito();
    }
}

// Función para eliminar un producto del carrito
function eliminarProductoDelCarrito(index) {
    console.log(`Eliminando producto en index: ${index}`);
    
    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        
        if (carrito[index]) {
            console.log(`Eliminando: ${carrito[index].nombre}`);
            carrito.splice(index, 1);
            localStorage.setItem("carrito", JSON.stringify(carrito));
            
            // Recargar la vista del carrito
            mostrarProductosCarrito();
            actualizarContadorCarrito();
            
            console.log("✅ Producto eliminado exitosamente");
        }
    }
}

// Función para actualizar el contador del carrito en la navegación
function actualizarContadorCarrito() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let iconCount = document.querySelector(".contar-pro");
    
    if (iconCount) {
        let totalCantidad = carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
        iconCount.textContent = totalCantidad;
        console.log(`Contador actualizado: ${totalCantidad} productos`);
    }
}

// Función que se ejecuta cuando se carga la página cart.html
function inicializarCarrito() {
    console.log("=== INICIALIZANDO CARRITO ===");
    
    // Verificar si estamos en cart.html
    if (document.querySelector(".cart-table")) {
        console.log("Detectada página cart.html - mostrando productos");
        mostrarProductosCarrito();
        actualizarContadorCarrito();
    } else {
        console.log("No estamos en cart.html");
    }
}

// Event listener para cuando se carga el DOM
document.addEventListener("DOMContentLoaded", inicializarCarrito);

// Función para procesar el pedido (conectar con el backend)
function procesarPedido() {
    console.log("=== PROCESANDO PEDIDO ===");
    
    // Obtener datos del formulario
    let nombre = document.getElementById('nombre').value.trim();
    let apellido = document.getElementById('apellido').value.trim();
    let email = document.getElementById('email').value.trim();
    let celular = document.getElementById('celular').value.trim();
    let direccion = document.getElementById('direccion').value.trim();
    let direccion2 = document.getElementById('direccion2').value.trim();
    let notas = document.getElementById('notas').value.trim();
    
    // Obtener método de pago seleccionado
    let metodoPago = document.querySelector('input[name="metodo_pago"]:checked').value;
    
    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !celular || !direccion) {
        alert('Por favor completa todos los campos obligatorios (Nombres, Apellidos, Email, Celular, Dirección)');
        return;
    }
    
    // Obtener carrito
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de realizar el pedido.');
        return;
    }
    
    console.log('Datos del pedido:', {
        nombre, apellido, email, celular, direccion, direccion2, notas, metodoPago, 
        productos: carrito.length
    });
    
    // Aquí puedes agregar la lógica para enviar el pedido al backend
    alert('¡Pedido procesado exitosamente! Serás redirigido a la página de confirmación.');
    
    // Limpiar carrito después del pedido
    localStorage.removeItem("carrito");
    
    // Redirigir a página de agradecimiento
    window.location.href = "thankyou.html";
}