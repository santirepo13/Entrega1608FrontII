// ===== Listado de Pedidos (Fixed) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const d = document;
const tablePedidos = d.querySelector("#table-pedidos tbody");
const searchInput = d.querySelector("#search-input");

// Initialize page
d.addEventListener("DOMContentLoaded", () => {
    if (!initAuthGuard({ requireAuth: true })) return;
    loadPedidos();
});

// Load orders from API
async function loadPedidos() {
    const loadingEl = uiFeedback.loading("Cargando pedidos...");
    try {
        const pedidos = await resources.pedidos.getAll();
        localStorage.setItem("pedidosData", JSON.stringify(pedidos));
        renderPedidos(pedidos);
        uiFeedback.success(`${pedidos.length} pedidos cargados.`);
    } catch (error) {
        console.error("Error loading orders:", error);
        uiFeedback.error("No se pudieron cargar los pedidos.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Render table rows
function renderPedidos(pedidos) {
    if (!tablePedidos) return;
    tablePedidos.innerHTML = "";

    if (!pedidos || pedidos.length === 0) {
        tablePedidos.innerHTML = `<tr><td colspan="8" class="text-center">No hay pedidos registrados.</td></tr>`;
        return;
    }

    pedidos.forEach((pedido, index) => {
        const row = d.createElement("tr");
        const clienteNombre = `${pedido.nombre || ''} ${pedido.apellido || ''}`.trim() || 'N/A';

        row.innerHTML = `
            <td>${pedido.id}</td>
            <td>${clienteNombre}</td>
            <td><span class="badge badge-info">${pedido.metodo_pago || 'N/A'}</span></td>
            <td>$${parseFloat(pedido.descuento || 0).toLocaleString()}</td>
            <td>$${parseFloat(pedido.aumento || 0).toLocaleString()}</td>
            <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
            <td><span class="badge badge-success">${pedido.estado || 'Completado'}</span></td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-info btn-view" data-id="${pedido.id}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-warning btn-edit" data-id="${pedido.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger btn-delete" data-id="${pedido.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tablePedidos.appendChild(row);
    });
}

// Event delegation for actions
tablePedidos?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("btn-view")) {
        viewPedido(id);
    } else if (btn.classList.contains("btn-edit")) {
        editPedido(id);
    } else if (btn.classList.contains("btn-delete")) {
        deletePedido(id);
    }
});

// View order details
async function viewPedido(id) {
    uiFeedback.loading("Cargando detalles...");
    try {
        const pedido = await resources.pedidos.getById(id);
        // Populate and show modal (logic to be added)
        alert(`Detalles del Pedido #${id}:\nCliente: ${pedido.nombre} ${pedido.apellido}\nTotal: $${(pedido.total || 0).toLocaleString()}`);
        console.log("Order details:", pedido);
    } catch (error) {
        uiFeedback.error("No se pudieron cargar los detalles del pedido.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Edit order
function editPedido(id) {
    location.href = `crear-pedido.html?id=${id}`;
}

// Delete order
async function deletePedido(id) {
    if (!confirm(`¿Está seguro de que desea eliminar el pedido #${id}?`)) return;

    uiFeedback.loading("Eliminando pedido...");
    try {
        await resources.pedidos.delete(id);
        uiFeedback.success("Pedido eliminado exitosamente.");
        loadPedidos(); // Refresh list
    } catch (error) {
        uiFeedback.error("No se pudo eliminar el pedido.");
    } finally {
        uiFeedback.hideLoading();
    }
}

// Search filter
searchInput?.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const pedidos = JSON.parse(localStorage.getItem("pedidosData") || "[]");
    const filtered = pedidos.filter(p => 
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(term) ||
        p.metodo_pago.toLowerCase().includes(term)
    );
    renderPedidos(filtered);
});

window.viewPedido = viewPedido;
window.editPedido = editPedido;
window.deletePedido = deletePedido;
