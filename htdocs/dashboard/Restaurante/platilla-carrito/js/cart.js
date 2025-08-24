// ==================== IMAGE PATH RESOLVER ====================
/**
 * Comprehensive image path resolver that checks multiple possible image locations
 * @param {string} imagePath - Original image path from product data
 * @param {string} productName - Product name for fallback image mapping
 * @returns {string} - Resolved image path
 */
function resolveImagePath(imagePath, productName) {
    // If no image path provided, use default
    if (!imagePath) {
        return getPlaceholderImage();
    }
    
    // Special handling for frontend-apicrud2 paths - convert them to relative paths
    if (imagePath && imagePath.includes('frontend-apicrud2/images/')) {
        const filename = extractFilename(imagePath);
        const correctedPath = `../../frontend-apicrud2/images/${filename}`;
        return correctedPath;
    }
    
    // Array of possible image locations to check
    const imagePossibilities = [
        // Original path (might work as-is)
        imagePath,
        
        // Frontend-apicrud2 images folder (admin images)
        `../../frontend-apicrud2/images/${extractFilename(imagePath)}`,
        `../frontend-apicrud2/images/${extractFilename(imagePath)}`,
        `/dashboard/frontend-apicrud2/images/${extractFilename(imagePath)}`,
        
        // Restaurant template images folder
        `./images/${extractFilename(imagePath)}`,
        `images/${extractFilename(imagePath)}`,
        `/dashboard/Restaurante/platilla-carrito/images/${extractFilename(imagePath)}`,
        
        // Common product image names based on product name
        ...generateProductImageNames(productName),
        
        // Fallback placeholder
        getPlaceholderImage()
    ];
    
    // Return the first possibility (we'll rely on onerror for fallbacks)
    const resolvedPath = imagePossibilities[0];
    return resolvedPath;
}

/**
 * Extract filename from a path
 * @param {string} path - File path
 * @returns {string} - Just the filename
 */
function extractFilename(path) {
    if (!path) return '';
    return path.split('/').pop().split('\\').pop();
}

/**
 * Generate possible image names based on product name
 * @param {string} productName - Product name
 * @returns {Array} - Array of possible image paths
 */
function generateProductImageNames(productName) {
    if (!productName) return [];
    
    const baseName = productName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    const imageFolders = [
        '../../frontend-apicrud2/images/',
        './images/',
        'images/'
    ];
    
    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    const possibilities = [];
    
    imageFolders.forEach(folder => {
        extensions.forEach(ext => {
            possibilities.push(`${folder}${baseName}.${ext}`);
            possibilities.push(`${folder}${baseName}-burger.${ext}`);
            possibilities.push(`${folder}burger-${baseName}.${ext}`);
        });
    });
    
    return possibilities;
}

/**
 * Get placeholder image path
 * @returns {string} - Placeholder image path
 */
function getPlaceholderImage() {
    // Try multiple placeholder locations
    const placeholders = [
        '../../frontend-apicrud2/images/placeholder.png',
        './images/placeholder.png',
        'images/placeholder.png',
        '../../frontend-apicrud2/images/burger.png',
        './images/logo.png',
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik05MyA4M0g4M1Y5M0g5M1Y4M1oiIGZpbGw9IiNhZGI1YmQiLz4KPHBhdGggZD0iTTEwNyA4M0g5N1Y5M0gxMDdWODNaIiBmaWxsPSIjYWRiNWJkIi8+CjxwYXRoIGQ9Ik0xMTcgODNIMTA3VjkzSDExN1Y4M1oiIGZpbGw9IiNhZGI1YmQiLz4KPC9zdmc+' // Base64 placeholder
    ];
    
    return placeholders[0]; // Return first placeholder, let onerror handle the rest
}

// Variables globales
let iconCart = document.querySelector(".carrito");
let iconCount = document.querySelector(".contar-pro");
let btnProducts = document.querySelectorAll(".btn-product");
let contentProducts = document.querySelector(".content-pro");
let tablePro = document.querySelector(".list-cart tbody");
let carritoContainer = document.querySelector(".list-cart"); // Contenedor del carrito
let btnCart = document.querySelector(".btn-cart");
let con = 1;

// Inicializar carrito como oculto
if (carritoContainer) {
    carritoContainer.classList.add("oculto");
}

// Evento inicial
document.addEventListener("DOMContentLoaded", () => {
    getProductData();
    renderCarrito();
    renderCartPage(); // Cargar productos en cart.html si estamos en esa página
    setupOrderButtons(); // Configurar botones de pedido
});

// Mostrar/Ocultar carrito
if (iconCart && carritoContainer) {
    iconCart.addEventListener("click", () => {
        console.log("🛒 Toggling cart visibility");
        carritoContainer.classList.toggle("oculto");
        console.log("Cart is now:", carritoContainer.classList.contains("oculto") ? "hidden" : "visible");
    });
}

// Función para obtener info de producto y agregar al carrito
let getInfoProduc = (id) => {
    let products = JSON.parse(localStorage.getItem("productos")) || [];
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    let producto = products[id];
    console.log("Agregando producto:", producto); // Debug
    
    if (producto) {
        // Verificar si el producto ya existe en el carrito
        let existeProducto = carrito.find(item => item.id === producto.id);
        
        if (existeProducto) {
            // Si ya existe, incrementar la cantidad
            existeProducto.cantidad = (existeProducto.cantidad || 1) + 1;
            console.log("Producto ya existe, nueva cantidad:", existeProducto.cantidad); // Debug
        } else {
            // Si no existe, agregarlo con cantidad 1
            producto.cantidad = 1;
            carrito.push(producto);
            console.log("Nuevo producto agregado:", producto); // Debug
        }
        
        localStorage.setItem("carrito", JSON.stringify(carrito));
        console.log("Carrito actualizado:", carrito); // Debug
        renderCarrito();
    }
};

// Función para agregar productos estáticos al carrito
function addStaticProduct(id, nombre, precio, imagen, descripcion) {
    console.log("🛒 Agregando producto estático:", { id, nombre, precio, imagen, descripcion });
    
    try {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        
        // Resolve image path at addition time to ensure correct path is stored
        let imagenResuelta = resolveImagePath(imagen, nombre);
        console.log(`📸 Image path resolved: ${imagen} -> ${imagenResuelta}`);
        
        // Crear objeto producto
        let producto = {
            id: id,
            nombre: nombre,
            precio: parseFloat(precio),
            imagen: imagenResuelta, // Use resolved path
            descripcion: descripcion || 'Sin descripción'
        };
        
        console.log("📦 Producto creado:", producto);
        
        // Verificar si el producto ya existe en el carrito
        let existeProducto = carrito.find(item => item.id === producto.id);
        
        if (existeProducto) {
            // Si ya existe, incrementar la cantidad
            existeProducto.cantidad = (existeProducto.cantidad || 1) + 1;
            console.log("✅ Producto ya existe, nueva cantidad:", existeProducto.cantidad);
        } else {
            // Si no existe, agregarlo con cantidad 1
            producto.cantidad = 1;
            carrito.push(producto);
            console.log("✅ Nuevo producto agregado:", producto);
        }
        
        // Guardar en localStorage
        localStorage.setItem("carrito", JSON.stringify(carrito));
        console.log("🛒 Carrito actualizado:", carrito);
        
        // Actualizar interfaz
        renderCarrito();
        
        // También mostrar en console para debugging
        console.log(`✅ ÉXITO: ${nombre} agregado al carrito`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Error al agregar producto:", error);
        return false;
    }
}


// Ir a cart.html al hacer click en "Ver carrito"
if (btnCart) {
    btnCart.addEventListener("click", () => {
        console.log("=== CLICK EN VER CARRITO ===");
        
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        console.log("Carrito al hacer click:", carrito);

        // Siempre redirigir a cart.html, incluso si está vacío
        console.log(`Redirigiendo a cart.html con ${carrito.length} productos`);
        window.location.href = "cart.html";
    });
}

// Renderizar el carrito en la tabla
let renderCarrito = () => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    if (tablePro) {
        tablePro.innerHTML = ""; // Limpiar antes de renderizar

        carrito.forEach((prod, index) => {
            let cantidad = prod.cantidad || 1;
            
        // Comprehensive image path resolver
        let imagePath = resolveImagePath(prod.imagen, prod.nombre);
        
        console.log(`🖼️ Image for ${prod.nombre}: ${prod.imagen} -> ${imagePath}`);
        
            
            tablePro.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td><img src="${imagePath}" width="50" style="object-fit: cover;" onerror="this.src='images/placeholder.png'"></td>
                    <td>
                        ${prod.nombre}
                        <br><small>Cantidad: ${cantidad}</small>
                    </td>
                    <td>$${(parseFloat(prod.precio) * cantidad).toFixed(2)}</td>
                    <td>
                        <button onclick="eliminarProducto(${index})" class="btn btn-danger btn-sm">X</button>
                    </td>
                </tr>
            `;
        });
    }

    // Actualizar contador - contar cantidad total de productos
    if (iconCount) {
        let totalCantidad = carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
        iconCount.textContent = totalCantidad;
    }
};

// Eliminar producto del carrito
let eliminarProducto = (index) => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.splice(index, 1);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    renderCarrito();
};

// Función para traer datos desde la BD usando la API correcta
let getProductData = async () => {
    try {
        // Check if we have API configuration available
        if (typeof resources === 'undefined') {
            console.log('API resources not available, skipping database products');
            return;
        }
        
        // Usar la función resources.productos.getAll() desde api-config
        let tableData = await resources.productos.getAll();
        
        if (!tableData || tableData.length === 0) {
            console.log("No hay datos en la BD");
            if (contentProducts) {
                contentProducts.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <h4>No hay productos disponibles</h4>
                    </div>
                `;
            }
            return;
        }
        
        // Guardar productos en localStorage
        localStorage.setItem("productos", JSON.stringify(tableData));
        console.log(`Productos cargados: ${tableData.length}`);

        if (contentProducts) {
            contentProducts.innerHTML = "";
            tableData.forEach((dato, i) => {
                // Asegurar que el producto tenga ID
                dato.index = i;
                
                // Fix image path for restaurant frontend
                let imagePath = dato.imagen;
                if (imagePath.startsWith('frontend-apicrud2/images/')) {
                    // Convert admin path to restaurant path
                    imagePath = imagePath.replace('frontend-apicrud2/images/', '../../frontend-apicrud2/images/');
                } else if (imagePath.startsWith('./images/')) {
                    // Convert relative path to admin path
                    imagePath = imagePath.replace('./images/', '../../frontend-apicrud2/images/');
                }
                
                contentProducts.innerHTML += `
                    <div class="col-md-3 py-3 py-md-0">
                        <div class="card">
                            <img src="${imagePath}" alt="${dato.nombre}" onerror="this.src='images/placeholder.png'">
                            <div class="card-body">
                                <h3>${dato.nombre}</h3>
                                <p>${dato.descripcion || 'Sin descripción'}</p>
                                <h5>$${parseFloat(dato.precio).toFixed(2)} 
                                    <span class="btn-product" onclick="getInfoProduc(${i})" 
                                          style="cursor: pointer; color: #ffc800;">
                                        <i class="fa-solid fa-basket-shopping"></i>
                                    </span>
                                </h5>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
        if (contentProducts) {
            contentProducts.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h4>Error al cargar productos</h4>
                    <p>${error.message}</p>
                    <button onclick="getProductData()" class="btn btn-primary">Reintentar</button>
                </div>
            `;
        }
    }
};

// Función para mostrar productos del carrito en cart.html
let renderCartPage = () => {
    console.log("=== INICIANDO renderCartPage ===");
    
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let cartTableBody = document.querySelector(".cart-table tbody");
    
    console.log("Carrito encontrado:", carrito);
    console.log("Tabla encontrada:", cartTableBody);
    
    // Si no estamos en cart.html, salir
    if (!cartTableBody) {
        console.log("No se encontró tabla de carrito - no estamos en cart.html");
        return;
    }
    
    // Limpiar tabla
    cartTableBody.innerHTML = "";
    
    // Si no hay productos en el carrito
    if (carrito.length === 0) {
        console.log("Carrito vacío - mostrando mensaje");
        cartTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <h5 class="mb-3">Tu carrito está vacío</h5>
                    <p class="lead mb-4">¡Agrega algunos deliciosos productos!</p>
                    <a href="index.html" class="btn btn-primary">Continuar Comprando</a>
                </td>
            </tr>
        `;
        updateCartSummary(0);
        return;
    }
    
    console.log(`Mostrando ${carrito.length} productos en el carrito`);
    
    let subtotal = 0;
    
    // Mostrar cada producto
    carrito.forEach((producto, index) => {
        let cantidad = producto.cantidad || 1;
        let precioUnitario = parseFloat(producto.precio);
        let subtotalProducto = precioUnitario * cantidad;
        subtotal += subtotalProducto;
        
        console.log(`Procesando producto ${index + 1}:`, {
            id: producto.id,
            nombre: producto.nombre,
            precio: precioUnitario,
            cantidad: cantidad,
            subtotal: subtotalProducto
        });
        
        // Resolve image path for cart display
        let imagePath = resolveImagePath(producto.imagen, producto.nombre);
        console.log(`🖼️ Cart image for ${producto.nombre}: ${producto.imagen} -> ${imagePath}`);
        
        let filaHTML = `
            <tr data-index="${index}">
                <td class="product-block">
                    <a href="#" class="remove-from-cart-btn" onclick="eliminarProductoCart(${index})" style="color: red; margin-right: 10px; font-size: 18px; text-decoration: none;">
                        <i class="fa-solid fa-x"></i>
                    </a>
                    <img src="${imagePath}" alt="${producto.nombre}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" 
                         onerror="handleImageError(this, '${producto.nombre}')">
                    <a href="product-detail.html" class="h6">${producto.nombre}</a>
                </td>
                <td>
                    <p class="lead color-black">$${precioUnitario.toFixed(2)}</p>
                </td>
                <td style="vertical-align: middle;">
                    <div class="quantity quantity-wrap">
                        <div class="decrement" onclick="decrementarCantidad(${index})" style="cursor: pointer;">
                            <i class="fa-solid fa-minus"></i>
                        </div>
                        <input type="text" name="quantity" value="${cantidad}" maxlength="2" size="1" class="number" readonly>
                        <div class="increment" onclick="incrementarCantidad(${index})" style="cursor: pointer;">
                            <i class="fa-solid fa-plus"></i>
                        </div>
                    </div>
                </td>
                <td>
                    <h6>$${subtotalProducto.toFixed(2)}</h6>
                </td>
            </tr>
        `;
        
        cartTableBody.innerHTML += filaHTML;
    });
    
    console.log("Subtotal calculado:", subtotal);
    console.log("=== FINALIZANDO renderCartPage ===");
    
    updateCartSummary(subtotal);
};

// Función para actualizar el resumen del carrito
let updateCartSummary = (subtotal) => {
    console.log("=== ACTUALIZANDO RESUMEN ===");
    
    // Only apply delivery if explicitly requested (default: no delivery)
    let valorDomicilio = 0.00;
    let descuentoPromo = 0.00;
    
    // Check if user has selected delivery option
    let deliverySelected = localStorage.getItem('deliverySelected') === 'true';
    if (deliverySelected) {
        valorDomicilio = 5.00;
    }
    
    // Check if user has applied discount code
    let discountCode = localStorage.getItem('discountCode');
    if (discountCode && discountCode === 'PROMO5') {
        descuentoPromo = 5.00;
    }
    
    let total = subtotal + valorDomicilio - descuentoPromo;
    
    console.log("Subtotal:", subtotal);
    console.log("Delivery selected:", deliverySelected, "- Valor domicilio:", valorDomicilio);
    console.log("Discount code:", discountCode, "- Descuento:", descuentoPromo);
    console.log("Total calculado:", total);
    
    // Buscar el contenedor del resumen
    let cartSummary = document.querySelector('.cart-summary');
    
    if (!cartSummary) {
        console.log("No se encontró .cart-summary - probablemente no estamos en cart.html");
        return;
    }
    
    console.log("Resumen de carrito encontrado:", cartSummary);
    
    try {
        // Método más directo - buscar por posición en la estructura
        let summaryItems = cartSummary.querySelectorAll('.d-flex .lead');
        let totalItems = cartSummary.querySelectorAll('.color-primary');
        
        console.log("Items de resumen encontrados:", summaryItems.length);
        console.log("Items de total encontrados:", totalItems.length);
        
        // Actualizar subtotal (normalmente el segundo elemento)
        if (summaryItems.length >= 2) {
            summaryItems[1].textContent = `$${subtotal.toFixed(2)}`;
            console.log("✅ Subtotal actualizado a:", subtotal.toFixed(2));
        }
        
        // Actualizar total (último elemento)
        if (totalItems.length >= 2) {
            totalItems[totalItems.length - 1].textContent = `$${total.toFixed(2)}`;
            console.log("✅ Total actualizado a:", total.toFixed(2));
        }
        
    } catch (error) {
        console.error("Error actualizando resumen:", error);
    }
    
    console.log("=== RESUMEN ACTUALIZADO ===");
};

// Función para incrementar cantidad
let incrementarCantidad = (index) => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito[index]) {
        carrito[index].cantidad = (carrito[index].cantidad || 1) + 1;
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCartPage();
        renderCarrito();
    }
};

// Función para decrementar cantidad
let decrementarCantidad = (index) => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    if (carrito[index] && (carrito[index].cantidad || 1) > 1) {
        carrito[index].cantidad = (carrito[index].cantidad || 1) - 1;
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCartPage();
        renderCarrito();
    }
};

// Función para eliminar producto del carrito desde cart.html
let eliminarProductoCart = (index) => {
    console.log("Intentando eliminar producto en index:", index); // Debug
    
    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        console.log("Carrito antes de eliminar:", carrito); // Debug
        
        if (carrito[index]) {
            console.log("Eliminando producto:", carrito[index]); // Debug
            carrito.splice(index, 1);
            localStorage.setItem("carrito", JSON.stringify(carrito));
            
            console.log("Carrito después de eliminar:", carrito); // Debug
            
            renderCartPage();
            renderCarrito();
        } else {
            console.error("Producto no encontrado en index:", index); // Debug
        }
    }
};

// Función para configurar botones de pedido
function setupOrderButtons() {
    console.log('🔧 Configurando botones de pedido...');
    
    const orderButtons = document.querySelectorAll('.order-btn');
    console.log(`Encontrados ${orderButtons.length} botones de pedido`);
    
    orderButtons.forEach((button, index) => {
        // Obtener información del producto desde el contexto del card
        const card = button.closest('.card');
        const cardOverlay = card.querySelector('.card-img-overlay');
        
        if (cardOverlay) {
            const nombreElement = cardOverlay.querySelector('h3');
            const descripcionElement = cardOverlay.querySelector('p');
            const imagenElement = card.querySelector('img');
            
            if (nombreElement && descripcionElement && imagenElement) {
                const nombre = nombreElement.textContent.trim();
                const descripcion = descripcionElement.textContent.trim();
                const imagen = imagenElement.src;
                
                // Instead of hardcoded mapping, use default prices for static products
                const defaultPrice = '15.99'; // Default price for static products
                const productId = `static-${index}`; // Generate unique ID
                
                console.log(`✅ Configurando botón estático para: ${nombre} con precio por defecto: $${defaultPrice}`);
                
                button.addEventListener('click', () => {
                    console.log(`🛒 Click en producto estático: ${nombre}`);
                    addStaticProduct(productId, nombre, defaultPrice, imagen, descripcion);
                });
            }
        }
    });
    
    console.log('✅ Botones de pedido configurados');
}

// Function to handle image loading errors with cascading fallback
function handleImageError(imgElement, productName) {
    console.log(`❌ Image failed to load: ${imgElement.src} for ${productName}`);
    
    // Get current failed path
    const currentSrc = imgElement.src;
    const originalOnError = imgElement.onerror;
    
    // Define fallback sequence
    const fallbackImages = [
        '../../frontend-apicrud2/images/placeholder.png',
        './images/placeholder.png', 
        'images/placeholder.png',
        '../../frontend-apicrud2/images/burger.png',
        './images/logo.png',
        // Base64 encoded placeholder as last resort
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik05MyA4M0g4M1Y5M0g5M1Y4M1oiIGZpbGw9IiNhZGI1YmQiLz4KPHBhdGggZD0iTTEwNyA4M0g5N1Y5M0gxMDdWODNaIiBmaWxsPSIjYWRiNWJkIi8+CjxwYXRoIGQ9Ik0xMTcgODNIMTA3VjkzSDExN1Y4M1oiIGZpbGw9IiNhZGI1YmQiLz4KPC9zdmc+'
    ];
    
    // Find next fallback that hasn't been tried yet
    const nextFallback = fallbackImages.find(fallback => fallback !== currentSrc);
    
    if (nextFallback) {
        console.log(`🔄 Trying fallback image: ${nextFallback}`);
        imgElement.onerror = () => handleImageError(imgElement, productName);
        imgElement.src = nextFallback;
    } else {
        console.log(`⚠️ All fallbacks exhausted for ${productName}`);
        imgElement.onerror = null; // Prevent infinite loop
        imgElement.alt = `[${productName}]`;
    }
}

// Function to update cart counter
function updateCartCounter() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    
    if (iconCount) {
        iconCount.textContent = totalItems;
        console.log(`🔢 Cart counter updated: ${totalItems} items`);
    }
    
    return totalItems;
}

// Make image error handler globally available
window.handleImageError = handleImageError;
window.resolveImagePath = resolveImagePath;
window.updateCartCounter = updateCartCounter;

// Hacer todas las funciones globales para que funcionen desde el HTML
window.addStaticProduct = addStaticProduct;
window.getInfoProduc = getInfoProduc;
window.eliminarProducto = eliminarProducto;
window.eliminarProductoCart = eliminarProductoCart;
window.incrementarCantidad = incrementarCantidad;
window.decrementarCantidad = decrementarCantidad;
window.getProductData = getProductData;
window.renderCarrito = renderCarrito;
window.setupOrderButtons = setupOrderButtons;
