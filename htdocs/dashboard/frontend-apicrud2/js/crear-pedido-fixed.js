// ===== Crear/Editar Pedido (Fixed) =====
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

// Initialize page
d.addEventListener("DOMContentLoaded", async () => {
    if (!initAuthGuard({ requireAuth: true })) return;

    const urlParams = new URLSearchParams(window.location.search);
    editPedidoId = urlParams.get('id');
    editMode = !!editPedidoId;

    await loadInitialData();

    if (editMode) {
        d.querySelector(".h3.mb-0.text-gray-800").textContent = "Editar Pedido";
        btnCreate.classList.add("d-none");
        btnUpdate.classList.remove("d-none");
        loadPedidoForEdit(editPedidoId);
    }
});

// Load clients and products
async function loadInitialData() {
    uiFeedback.loading("Cargando datos...");
    try {
        const [clientes, productos] = await Promise.all([
            resources.clientes.getAll(),
            resources.productos.getAll()
        ]);

        populateSelect(clienteSelect, clientes, c => `${c.nombre} ${c.apellido}`, "id_cliente");
        populateSelect(productoSelect, productos, p => `${p.nombre} - $${p.precio}`, "id", { precio: "precio" });

    } catch (error) {
        uiFeedback.error("No se pudieron cargar los clientes o productos.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Populate select options
function populateSelect(selectEl, data, textFormatter, valueField, dataAttributes = {}) {
    if (!selectEl) return;
    data.forEach(item => {
        const option = d.createElement("option");
        option.value = item[valueField];
        option.textContent = textFormatter(item);
        Object.entries(dataAttributes).forEach(([key, value]) => {
            option.dataset[key] = item[value];
        });
        selectEl.appendChild(option);
    });
}

// Load existing order for editing
async function loadPedidoForEdit(id) {
    uiFeedback.loading("Cargando pedido...");
    try {
        const pedido = await resources.pedidos.getById(id);
        clienteSelect.value = pedido.id_cliente;
        metodoPagoSelect.value = pedido.metodo_pago;
        descuentoInput.value = pedido.descuento;
        aumentoInput.value = pedido.aumento;
        pedido.detalles.forEach(d => {
            const producto = { id: d.id_producto, nombre: d.producto_nombre, precio: d.precio };
            addProductoToTable(producto, d.cantidad);
        });
        updateTotal();
    } catch (error) {
        uiFeedback.error("No se pudo cargar el pedido para editar.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Add product to table
btnAgregarProducto?.addEventListener("click", () => {
    const selectedOption = productoSelect.options[productoSelect.selectedIndex];
    if (!selectedOption.value) return;

    const producto = {
        id: selectedOption.value,
        nombre: selectedOption.text.split(' - ')[0],
        precio: parseFloat(selectedOption.dataset.precio)
    };
    const cantidad = parseInt(cantidadInput.value, 10);

    addProductoToTable(producto, cantidad);
    updateTotal();
});

function addProductoToTable(producto, cantidad) {
    const existingItem = pedidoItems.find(item => item.id_producto === producto.id);
    if (existingItem) {
        existingItem.cantidad += cantidad;
    } else {
        pedidoItems.push({ 
            id_producto: producto.id, 
            nombre: producto.nombre, 
            precio: producto.precio, 
            cantidad: cantidad 
        });
    }
    renderPedidoItems();
}

// Render items in the table
function renderPedidoItems() {
    productosPedidoBody.innerHTML = "";
    pedidoItems.forEach((item, index) => {
        const row = d.createElement("tr");
        row.innerHTML = `
            <td>${item.nombre}</td>
            <td>$${item.precio.toLocaleString()}</td>
            <td>${item.cantidad}</td>
            <td>$${(item.precio * item.cantidad).toLocaleString()}</td>
            <td><button type="button" class="btn btn-danger btn-sm" onclick="removePedidoItem(${index})">X</button></td>
        `;
        productosPedidoBody.appendChild(row);
    });
}

// Remove item from table
window.removePedidoItem = (index) => {
    pedidoItems.splice(index, 1);
    renderPedidoItems();
    updateTotal();
};

// Update total amount
function updateTotal() {
    const subtotal = pedidoItems.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const descuento = parseFloat(descuentoInput.value) || 0;
    const aumento = parseFloat(aumentoInput.value) || 0;
    const total = subtotal - descuento + aumento;
    totalPedidoSpan.textContent = total.toLocaleString();
}

// Event listeners for discount/increase
descuentoInput?.addEventListener('input', updateTotal);
aumentoInput?.addEventListener('input', updateTotal);

// Submit order
async function submitPedido(event) {
    event.preventDefault();

    if (!clienteSelect.value) {
        uiFeedback.error("Debe seleccionar un cliente.");
        return;
    }

    const pedidoData = {
        id_cliente: clienteSelect.value,
        metodo_pago: metodoPagoSelect.value,
        descuento: descuentoInput.value,
        aumento: aumentoInput.value,
        productos: pedidoItems.map(item => ({ id_producto: item.id_producto, precio: item.precio, cantidad: item.cantidad }))
    };

    if (editMode) {
        pedidoData.id = editPedidoId;
    }

    uiFeedback.loading(editMode ? "Actualizando pedido..." : "Creando pedido...");
    try {
        const action = editMode ? resources.pedidos.update : resources.pedidos.create;
        const result = await action(pedidoData);
        uiFeedback.success(result.message);
        setTimeout(() => location.href = "listado-pedidos.html", 1500);
    } catch (error) {
        uiFeedback.error(`No se pudo guardar el pedido: ${error.message}`);
    } finally {
        uiFeedback.hideLoading();
    }
}

btnCreate?.addEventListener("click", submitPedido);
btnUpdate?.addEventListener("click", submitPedido);
