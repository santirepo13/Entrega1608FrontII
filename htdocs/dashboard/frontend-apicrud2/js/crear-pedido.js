// ===== Crear/Editar Pedido (FULLY FIXED) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const d = document;

// Form elements
const clienteSelect = d.querySelector("#cliente-select");
const metodoPagoSelect = d.querySelector("#metodo-pago");
const descuentoInput = d.querySelector("#descuento");
const aumentoInput = d.querySelector("#aumento");
const productoSelect = d.querySelector("#producto-select");
const cantidadInput = d.querySelector("#cantidad");
const btnAgregarProducto = d.querySelector("#btn-agregar-producto");
const productosPedidoBody = d.querySelector("#productos-pedido");
const totalPedidoSpan = d.querySelector("#total-pedido");
const btnCreate = d.querySelector(".btn-create");
const btnUpdate = d.querySelector(".btn-update");

let pedidoItems = [];
let editMode = false;
let editPedidoId = null;
let allProducts = []; // Store all products for validation

// Initialize page
d.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing order creation page...");
    
    if (!initAuthGuard({ requireAuth: true })) {
        console.error("Authentication failed");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    editPedidoId = urlParams.get('id');
    editMode = !!editPedidoId;

    console.log("Edit mode:", editMode, "ID:", editPedidoId);

    await loadInitialData();

    if (editMode) {
        const pageTitle = d.querySelector(".h3.mb-0.text-gray-800");
        if (pageTitle) pageTitle.textContent = "Editar Pedido";
        btnCreate?.classList.add("d-none");
        btnUpdate?.classList.remove("d-none");
        loadPedidoForEdit(editPedidoId);
    }
    
    console.log("Initialization complete");
});

// Load clients and products
async function loadInitialData() {
    console.log("Loading initial data...");
    uiFeedback.loading("Cargando clientes y productos...");
    
    try {
        const [clientes, productos] = await Promise.all([
            resources.clientes.getAll(),
            resources.productos.getAll()
        ]);

        console.log("Loaded clients:", clientes.length);
        console.log("Loaded products:", productos.length);

        allProducts = productos; // Store for validation

        // Clear existing options first
        if (clienteSelect) {
            clienteSelect.innerHTML = '<option value="">Seleccionar Cliente</option>';
            clientes.forEach(cliente => {
                const option = d.createElement("option");
                option.value = cliente.id_cliente;
                option.textContent = `${cliente.nombre} ${cliente.apellido}`;
                clienteSelect.appendChild(option);
            });
        }

        if (productoSelect) {
            productoSelect.innerHTML = '<option value="">Seleccionar Producto</option>';
            productos.forEach(producto => {
                const option = d.createElement("option");
                option.value = producto.id;
                option.dataset.precio = producto.precio;
                option.dataset.stock = producto.stock;
                option.dataset.nombre = producto.nombre;
                option.textContent = `${producto.nombre} - $${parseFloat(producto.precio).toLocaleString()} (Stock: ${producto.stock})`;
                productoSelect.appendChild(option);
            });
        }

        uiFeedback.success(`${clientes.length} clientes y ${productos.length} productos cargados`);

    } catch (error) {
        console.error("Error loading data:", error);
        uiFeedback.error(`No se pudieron cargar los datos: ${error.message}`);
    } finally {
        uiFeedback.hideLoading();
    }
}

// Load existing order for editing
async function loadPedidoForEdit(id) {
    uiFeedback.loading("Cargando pedido...");
    try {
        const pedido = await resources.pedidos.getById(id);
        console.log("Order data for edit:", pedido);
        
        if (clienteSelect) clienteSelect.value = pedido.id_cliente;
        if (metodoPagoSelect) metodoPagoSelect.value = pedido.metodo_pago;
        if (descuentoInput) descuentoInput.value = pedido.descuento || 0;
        if (aumentoInput) aumentoInput.value = pedido.aumento || 0;
        
        if (pedido.detalles) {
            pedido.detalles.forEach(detalle => {
                addProductoToTable({
                    id: detalle.id_producto,
                    nombre: detalle.producto_nombre,
                    precio: parseFloat(detalle.precio)
                }, parseInt(detalle.cantidad));
            });
        }
        
        updateTotal();
    } catch (error) {
        console.error("Error loading order:", error);
        uiFeedback.error("No se pudo cargar el pedido para editar.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Add product to table
btnAgregarProducto?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Add product button clicked");
    
    if (!productoSelect || !productoSelect.value) {
        uiFeedback.warning("Por favor selecciona un producto.");
        return;
    }

    const selectedOption = productoSelect.options[productoSelect.selectedIndex];
    const cantidad = parseInt(cantidadInput?.value || 1, 10);
    
    if (cantidad <= 0) {
        uiFeedback.warning("La cantidad debe ser mayor a 0.");
        return;
    }

    // Check stock
    const stockDisponible = parseInt(selectedOption.dataset.stock, 10);
    if (cantidad > stockDisponible) {
        uiFeedback.error(`Stock insuficiente. Disponible: ${stockDisponible}`);
        return;
    }

    const producto = {
        id: selectedOption.value,
        nombre: selectedOption.dataset.nombre,
        precio: parseFloat(selectedOption.dataset.precio)
    };

    console.log("Adding product:", producto, "quantity:", cantidad);
    
    addProductoToTable(producto, cantidad);
    updateTotal();
    
    // Reset form
    if (productoSelect) productoSelect.value = "";
    if (cantidadInput) cantidadInput.value = "1";
    
    uiFeedback.success("Producto agregado al pedido");
});

function addProductoToTable(producto, cantidad) {
    const existingItemIndex = pedidoItems.findIndex(item => item.id_producto === producto.id);
    
    if (existingItemIndex !== -1) {
        // Update existing item
        pedidoItems[existingItemIndex].cantidad += cantidad;
    } else {
        // Add new item
        pedidoItems.push({ 
            id_producto: producto.id, 
            nombre: producto.nombre, 
            precio: producto.precio, 
            cantidad: cantidad 
        });
    }
    
    console.log("Current order items:", pedidoItems);
    renderPedidoItems();
}

// Render items in the table
function renderPedidoItems() {
    if (!productosPedidoBody) return;
    
    productosPedidoBody.innerHTML = "";
    
    if (pedidoItems.length === 0) {
        productosPedidoBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay productos agregados</td></tr>';
        return;
    }
    
    pedidoItems.forEach((item, index) => {
        const row = d.createElement("tr");
        const subtotal = item.precio * item.cantidad;
        
        row.innerHTML = `
            <td>${item.nombre}</td>
            <td>$${parseFloat(item.precio).toLocaleString()}</td>
            <td>${item.cantidad}</td>
            <td>$${subtotal.toLocaleString()}</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm" onclick="removePedidoItem(${index})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        productosPedidoBody.appendChild(row);
    });
}

// Remove item from table
window.removePedidoItem = (index) => {
    console.log("Removing item at index:", index);
    pedidoItems.splice(index, 1);
    renderPedidoItems();
    updateTotal();
    uiFeedback.success("Producto eliminado del pedido");
};

// Update total amount
function updateTotal() {
    const subtotal = pedidoItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const descuento = parseFloat(descuentoInput?.value || 0);
    const aumento = parseFloat(aumentoInput?.value || 0);
    const total = Math.max(0, subtotal - descuento + aumento);
    
    if (totalPedidoSpan) {
        totalPedidoSpan.textContent = total.toLocaleString();
    }
    
    console.log("Total updated:", { subtotal, descuento, aumento, total });
}

// Event listeners for discount/increase
descuentoInput?.addEventListener('input', updateTotal);
aumentoInput?.addEventListener('input', updateTotal);

// Submit order
async function submitPedido(event) {
    event.preventDefault();
    console.log("Submitting order...");

    // Validation
    if (!clienteSelect?.value) {
        uiFeedback.error("Debe seleccionar un cliente.");
        return;
    }
    
    if (!metodoPagoSelect?.value) {
        uiFeedback.error("Debe seleccionar un método de pago.");
        return;
    }

    if (pedidoItems.length === 0) {
        uiFeedback.error("Debe agregar al menos un producto al pedido.");
        return;
    }

    const pedidoData = {
        id_cliente: parseInt(clienteSelect.value),
        metodo_pago: metodoPagoSelect.value,
        descuento: parseFloat(descuentoInput?.value || 0),
        aumento: parseFloat(aumentoInput?.value || 0),
        productos: pedidoItems.map(item => ({
            id_producto: parseInt(item.id_producto),
            precio: parseFloat(item.precio),
            cantidad: parseInt(item.cantidad)
        }))
    };

    if (editMode) {
        pedidoData.id = editPedidoId;
    }

    console.log("Order data to submit:", pedidoData);

    uiFeedback.loading(editMode ? "Actualizando pedido..." : "Creando pedido...");
    
    try {
        const result = editMode 
            ? await resources.pedidos.update(pedidoData)
            : await resources.pedidos.create(pedidoData);
        
        console.log("Order submit result:", result);
        
        uiFeedback.success(result.message || "Pedido guardado exitosamente");
        
        setTimeout(() => {
            location.href = "listado-pedidos.html";
        }, 2000);
        
    } catch (error) {
        console.error("Error submitting order:", error);
        uiFeedback.error(`No se pudo guardar el pedido: ${error.message}`);
    } finally {
        uiFeedback.hideLoading();
    }
}

// Event listeners for buttons
btnCreate?.addEventListener("click", submitPedido);
btnUpdate?.addEventListener("click", submitPedido);

console.log("Order module loaded successfully");
