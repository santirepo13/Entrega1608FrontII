/**
 * Checkout Module for Restaurant
 * Handles order submission to backend API
 */

// Process checkout when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the cart/checkout page
    const checkoutBtn = document.getElementById('procesar-pago');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', procesarPedido);
    }
    
    // Update cart counter
    actualizarContadorCarrito();
});

/**
 * Update cart counter in navbar
 */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contador = document.querySelector('.contar-pro');
    if (contador) {
        const totalCantidad = carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
        contador.textContent = totalCantidad;
    }
}

/**
 * Validate form fields
 */
function validarFormulario() {
    const campos = {
        nombre: document.getElementById('nombre'),
        apellido: document.getElementById('apellido'),
        email: document.getElementById('email'),
        celular: document.getElementById('celular'),
        direccion: document.getElementById('direccion'),
        metodo_pago: document.getElementById('metodo_pago')
    };
    
    let esValido = true;
    let errores = [];
    
    // Validate required fields
    for (const [campo, elemento] of Object.entries(campos)) {
        if (!elemento || !elemento.value.trim()) {
            esValido = false;
            errores.push(`El campo ${campo.replace('_', ' ')} es requerido`);
            if (elemento) {
                elemento.classList.add('is-invalid');
            }
        } else {
            if (elemento) {
                elemento.classList.remove('is-invalid');
            }
        }
    }
    
    // Validate email format
    if (campos.email && campos.email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(campos.email.value)) {
            esValido = false;
            errores.push('El email no es válido');
            campos.email.classList.add('is-invalid');
        }
    }
    
    // Validate phone number (basic validation)
    if (campos.celular && campos.celular.value) {
        const phoneRegex = /^[0-9]{7,15}$/;
        if (!phoneRegex.test(campos.celular.value.replace(/\s/g, ''))) {
            esValido = false;
            errores.push('El número de celular no es válido');
            campos.celular.classList.add('is-invalid');
        }
    }
    
    if (!esValido) {
        mostrarMensaje('error', errores.join('<br>'));
    }
    
    return esValido;
}

/**
 * Process the order
 */
async function procesarPedido(event) {
    event.preventDefault();
    
    console.log('=== PROCESANDO PEDIDO ===');
    
    // Get cart items
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    if (carrito.length === 0) {
        mostrarMensaje('warning', 'El carrito está vacío');
        return;
    }
    
    // Validate form
    if (!validarFormulario()) {
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('procesar-pago');
    const btnText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
    
    try {
        // Get form data
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            email: document.getElementById('email').value.trim(),
            celular: document.getElementById('celular').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            direccion2: document.getElementById('direccion2')?.value.trim() || '',
            descripcion: document.getElementById('notas')?.value.trim() || '',
            metodo_pago: document.getElementById('metodo_pago').value,
            descuento: parseFloat(document.getElementById('descuento')?.value || 0),
            aumento: parseFloat(document.getElementById('aumento')?.value || 5) // Domicilio
        };
        
        console.log('Datos del cliente:', formData);
        
        // Step 1: Create client
        const clienteData = {
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            celular: formData.celular,
            direccion: formData.direccion,
            direccion2: formData.direccion2,
            descripcion: formData.descripcion
        };
        
        // Use API resources with fallback to mock
        let resources;
        if (typeof window.resources !== 'undefined') {
            resources = window.resources;
            console.log('✅ Using REAL API resources - stock WILL be deducted');
            console.log('🔗 API Base URL:', window.API_CONFIG?.BASE_URL);
        } else {
            console.warn('❌ API configuration not available, using MOCK mode - stock will NOT be deducted!');
            alert('⚠️ WARNING: Using MOCK API mode. Orders will appear to work but stock will NOT be deducted from inventory!');
            resources = createMockAPI();
        }
        
        console.log('Creando cliente...');
        const clienteResponse = await resources.clientes.create(clienteData);
        console.log('Cliente creado:', clienteResponse);
        
        // Handle both possible ID field names from response
        const id_cliente = clienteResponse.id || clienteResponse.id_cliente || clienteResponse.data?.id;
        
        if (!id_cliente) {
            console.error('Cliente response:', clienteResponse);
            throw new Error('No se pudo obtener el ID del cliente');
        }
        
        // Step 2: Prepare products array for order
        const productos = carrito.map(item => {
            // Handle both static product IDs (strings) and database product IDs (numbers)
            let productId = item.id;
            
            // If it's a static product ID (like 'cheese-burger'), map to database ID
            if (typeof productId === 'string') {
                // Map common static IDs to database IDs
                const idMapping = {
                    'cheese-burger': 21,
                    'hero-burger': 20,
                    'other-product': 20,
                    'p1': 13, // Pizza
                    'p2': 8,  // Pollo
                    'p3': 14, // Sanchipapa
                    'p4': 13, // Pizza slice
                };
                
                productId = idMapping[productId] || 20; // Default to Classic Burger
                console.log(`Mapped static ID '${item.id}' to database ID ${productId}`);
            }
            
            return {
                id_producto: parseInt(productId),
                cantidad: item.cantidad || 1,
                precio: parseFloat(item.precio)
            };
        });
        
        // Step 3: Create order with products
        const pedidoData = {
            id_cliente: id_cliente,
            descuento: formData.descuento,
            metodo_pago: formData.metodo_pago,
            aumento: formData.aumento,
            productos: productos
        };
        
        console.log('Creando pedido:', pedidoData);
        const pedidoResponse = await resources.pedidos.create(pedidoData);
        console.log('Pedido creado:', pedidoResponse);
        
        // Store order info for thank you page
        const orderInfo = {
            orderId: pedidoResponse.id || 'ORD-' + Date.now(),
            customerName: formData.nombre + ' ' + formData.apellido,
            email: formData.email,
            phone: formData.celular,
            address: formData.direccion,
            paymentMethod: formData.metodo_pago,
            products: carrito,
            totals: calcularTotales(),
            trackingToken: pedidoResponse.tracking_token || null,
            trackingUrl: pedidoResponse.tracking_url || null,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('lastOrder', JSON.stringify(orderInfo));
        
        // Clear cart after successful order
        localStorage.removeItem('carrito');
        
        // Show success message
        mostrarMensaje('success', '¡Pedido realizado con éxito! Redirigiendo...');
        
        // Redirect to thank you page after 2 seconds
        setTimeout(() => {
            console.log('🚀 Redirecting to thankyou.html');
            window.location.href = 'thankyou.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        mostrarMensaje('error', 'Error al procesar el pedido: ' + error.message);
        
        // Restore button state
        btn.disabled = false;
        btn.innerHTML = btnText;
    }
}

/**
 * Show message to user
 */
function mostrarMensaje(tipo, mensaje) {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-checkout');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alertClass = tipo === 'success' ? 'alert-success' : 
                       tipo === 'error' ? 'alert-danger' : 
                       'alert-warning';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-checkout alert-dismissible fade show" role="alert">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Insert alert at the top of the cart summary or page
    const cartSummary = document.querySelector('.cart-summary');
    const targetElement = cartSummary || document.querySelector('.page-content');
    
    if (targetElement) {
        targetElement.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert-checkout');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

/**
 * Create mock API for when real API is not available
 */
function createMockAPI() {
    return {
        clientes: {
            create: async (data) => {
                console.log('MOCK API: Creating client:', data);
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                return {
                    id: Date.now(), // Use timestamp as mock ID
                    ...data,
                    created_at: new Date().toISOString()
                };
            }
        },
        pedidos: {
            create: async (data) => {
                console.log('MOCK API: Creating order:', data);
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                return {
                    id: Date.now() + 1,
                    ...data,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
            }
        }
    };
}

/**
 * Calculate order totals
 */
function calcularTotales() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    let subtotal = 0;
    carrito.forEach(producto => {
        const cantidad = producto.cantidad || 1;
        const precio = parseFloat(producto.precio) || 0;
        subtotal += precio * cantidad;
    });
    
    const domicilio = 5.00;
    const descuento = 5.00;
    const total = subtotal + domicilio - descuento;
    
    return {
        subtotal: subtotal,
        domicilio: domicilio,
        descuento: descuento,
        total: total
    };
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        procesarPedido,
        validarFormulario,
        mostrarMensaje,
        calcularTotales,
        actualizarContadorCarrito
    };
}
