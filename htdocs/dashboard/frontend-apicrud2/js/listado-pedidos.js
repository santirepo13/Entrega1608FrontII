// ===== Listado de Pedidos (Fixed) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const d = document;
const tablePedidos = d.querySelector("#table-pedidos tbody");
const searchInput = d.querySelector("#search-input");

// Real-time update variables
let lastOrderCount = 0;
let refreshInterval = null;
let currentOrders = [];

// Initialize page
d.addEventListener("DOMContentLoaded", () => {
    if (!initAuthGuard({ requireAuth: true })) return;
    loadPedidos();
    startRealTimeUpdates();
});

// Start real-time updates
function startRealTimeUpdates() {
    // Refresh orders every 30 seconds
    refreshInterval = setInterval(async () => {
        try {
            await checkForNewOrders();
        } catch (error) {
            console.error('Error checking for new orders:', error);
            updateStatusIndicator('error', 'Error en actualizaciones');
        }
    }, 30000); // 30 seconds
    
    updateStatusIndicator('active', 'Actualizaciones en tiempo real activas');
    console.log('✅ Real-time order updates started (30s interval)');
}

// Check for new orders
async function checkForNewOrders() {
    try {
        const pedidos = await resources.pedidos.getAll();
        
        // Check if there are new orders
        if (pedidos.length > lastOrderCount) {
            const newOrdersCount = pedidos.length - lastOrderCount;
            console.log(`🔔 ${newOrdersCount} new order(s) detected`);
            
            // Show notification for new orders
            showNewOrderNotification(newOrdersCount, pedidos[0]);
            
            // Update the display
            localStorage.setItem("pedidosData", JSON.stringify(pedidos));
            renderPedidos(pedidos);
            
            // Highlight new orders
            highlightNewOrders(pedidos.slice(0, newOrdersCount));
        }
        
        lastOrderCount = pedidos.length;
        currentOrders = pedidos;
        
    } catch (error) {
        console.error('Error checking for new orders:', error);
    }
}

// Show notification for new orders
function showNewOrderNotification(count, latestOrder) {
    // Remove existing notification
    const existingNotif = d.querySelector('.new-order-notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    // Create notification
    const notification = d.createElement('div');
    notification.className = 'alert alert-success alert-dismissible fade show new-order-notification';
    notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    
    const customerName = `${latestOrder.nombre} ${latestOrder.apellido}`.trim();
    const total = parseFloat(latestOrder.total || 0);
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-bell text-warning me-2" style="font-size: 1.2em;"></i>
            <div>
                <strong>¡${count} Nuevo${count > 1 ? 's' : ''} Pedido${count > 1 ? 's' : ''}!</strong><br>
                <small>
                    ${count > 1 ? `Último: ` : ''}${customerName} - $${total.toLocaleString()}<br>
                    <span class="text-muted">Pedido #${latestOrder.id}</span>
                </small>
            </div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    d.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
    
    // Play notification sound (optional)
    playNotificationSound();
}

// Highlight new orders in the table
function highlightNewOrders(newOrders) {
    newOrders.forEach(order => {
        // Find the row for this order
        const rows = tablePedidos.querySelectorAll('tr');
        rows.forEach(row => {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent.trim() === order.id.toString()) {
                // Add highlight animation
                row.style.backgroundColor = '#d4edda';
                row.style.transition = 'background-color 0.3s ease';
                
                // Add new order badge
                const badge = d.createElement('span');
                badge.className = 'badge badge-warning ms-2';
                badge.textContent = 'NUEVO';
                badge.style.fontSize = '0.7em';
                firstCell.appendChild(badge);
                
                // Remove highlight after 30 seconds
                setTimeout(() => {
                    row.style.backgroundColor = '';
                    if (badge.parentNode) {
                        badge.remove();
                    }
                }, 30000);
            }
        });
    });
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a simple notification beep
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Update status indicator
function updateStatusIndicator(status, text) {
    const statusIcon = d.querySelector('#realtime-status-icon');
    const statusText = d.querySelector('#realtime-status-text');
    
    if (statusIcon && statusText) {
        switch (status) {
            case 'active':
                statusIcon.className = 'fas fa-circle text-success';
                statusIcon.style.fontSize = '0.5em';
                statusText.textContent = text || 'Actualizaciones en tiempo real activas';
                break;
            case 'paused':
                statusIcon.className = 'fas fa-pause-circle text-warning';
                statusIcon.style.fontSize = '0.7em';
                statusText.textContent = text || 'Actualizaciones pausadas';
                break;
            case 'error':
                statusIcon.className = 'fas fa-exclamation-circle text-danger';
                statusIcon.style.fontSize = '0.7em';
                statusText.textContent = text || 'Error en actualizaciones';
                break;
            case 'stopped':
                statusIcon.className = 'fas fa-stop-circle text-secondary';
                statusIcon.style.fontSize = '0.7em';
                statusText.textContent = text || 'Actualizaciones detenidas';
                break;
        }
    }
}

// Stop real-time updates (cleanup)
function stopRealTimeUpdates() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        updateStatusIndicator('paused', 'Actualizaciones pausadas');
        console.log('❌ Real-time order updates stopped');
    }
}

// Add page visibility API to pause/resume updates
d.addEventListener('visibilitychange', () => {
    if (d.hidden) {
        stopRealTimeUpdates();
    } else {
        startRealTimeUpdates();
    }
});

// Load orders from API
async function loadPedidos() {
    const loadingEl = uiFeedback.loading("Cargando pedidos...");
    try {
        const pedidos = await resources.pedidos.getAll();
        localStorage.setItem("pedidosData", JSON.stringify(pedidos));
        renderPedidos(pedidos);
        
        // Initialize order count for real-time updates
        lastOrderCount = pedidos.length;
        currentOrders = pedidos;
        
        uiFeedback.success(`${pedidos.length} pedidos cargados.`);
        console.log(`📋 Initialized with ${pedidos.length} existing orders`);
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
        tablePedidos.innerHTML = `<tr><td colspan="9" class="text-center">No hay pedidos registrados.</td></tr>`;
        return;
    }

    pedidos.forEach((pedido, index) => {
        const row = d.createElement("tr");
        const clienteNombre = `${pedido.nombre || ''} ${pedido.apellido || ''}`.trim() || 'N/A';

        // Format total with proper styling
        const total = parseFloat(pedido.total || 0);
        const totalFormatted = total > 0 ? `<strong class="text-success">$${total.toLocaleString()}</strong>` : '<span class="text-muted">$0.00</span>';
        
        // Format payment method with appropriate styling
        const metodoPago = pedido.metodo_pago || 'N/A';
        let metodoPagoBadge = '';
        switch (metodoPago) {
            case 'Contraentrega':
                metodoPagoBadge = `<span class="badge badge-warning">${metodoPago}</span>`;
                break;
            case 'PSE':
                metodoPagoBadge = `<span class="badge badge-primary">${metodoPago}</span>`;
                break;
            case 'Transferencia':
                metodoPagoBadge = `<span class="badge badge-info">${metodoPago}</span>`;
                break;
            case 'Tarjeta':
                metodoPagoBadge = `<span class="badge badge-success">${metodoPago}</span>`;
                break;
            default:
                metodoPagoBadge = `<span class="badge badge-secondary">${metodoPago}</span>`;
        }
        
        // Format status with appropriate styling and dropdown
        const estado = pedido.estado || 'Pendiente';
        let estadoBadge = '';
        let statusClass = '';
        switch (estado) {
            case 'Pendiente':
                statusClass = 'badge-warning';
                break;
            case 'Confirmado':
                statusClass = 'badge-info';
                break;
            case 'En Preparación':
                statusClass = 'badge-primary';
                break;
            case 'En Camino':
                statusClass = 'badge-secondary';
                break;
            case 'Entregado':
                statusClass = 'badge-success';
                break;
            case 'Cancelado':
                statusClass = 'badge-danger';
                break;
            default:
                statusClass = 'badge-secondary';
        }
        
        estadoBadge = `
            <div class="status-container">
                <span class="badge ${statusClass}" id="status-${pedido.id}">${estado}</span>
                <div class="dropdown d-inline ml-1">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="statusDropdown${pedido.id}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-edit"></i>
                    </button>
                    <div class="dropdown-menu" aria-labelledby="statusDropdown${pedido.id}">
                        <button class="dropdown-item status-change" data-id="${pedido.id}" data-status="Pendiente">Pendiente</button>
                        <button class="dropdown-item status-change" data-id="${pedido.id}" data-status="Confirmado">Confirmado</button>
                        <button class="dropdown-item status-change" data-id="${pedido.id}" data-status="En Preparación">En Preparación</button>
                        <button class="dropdown-item status-change" data-id="${pedido.id}" data-status="En Camino">En Camino</button>
                        <button class="dropdown-item status-change" data-id="${pedido.id}" data-status="Entregado">Entregado</button>
                        <button class="dropdown-item status-change text-danger" data-id="${pedido.id}" data-status="Cancelado">Cancelado</button>
                    </div>
                </div>
            </div>
        `;
        
        // Generate tracking link if available
        let trackingInfo = '';
        if (pedido.tracking_token) {
            trackingInfo = `<br><small><a href="http://localhost/dashboard/tracking.php?token=${pedido.tracking_token}" target="_blank" class="text-info"><i class="fas fa-external-link-alt"></i> Ver seguimiento</a></small>`;
        }
        
        row.innerHTML = `
            <td>${pedido.id}${trackingInfo}</td>
            <td>${clienteNombre}</td>
            <td>${metodoPagoBadge}</td>
            <td>$${parseFloat(pedido.descuento || 0).toLocaleString()}</td>
            <td>$${parseFloat(pedido.aumento || 0).toLocaleString()}</td>
            <td>${totalFormatted}</td>
            <td>${new Date(pedido.fecha).toLocaleDateString()}</td>
            <td>${estadoBadge}</td>
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
    } else if (btn.classList.contains("status-change")) {
        const newStatus = btn.dataset.status;
        changeOrderStatus(id, newStatus);
    }
});

// Change order status
async function changeOrderStatus(orderId, newStatus) {
    if (!confirm(`¿Está seguro de cambiar el estado a "${newStatus}"?`)) return;
    
    console.log(`🔄 Changing status for order ${orderId} to: ${newStatus}`);
    uiFeedback.loading("Actualizando estado...");
    try {
        const requestData = {
            id: orderId,
            estado: newStatus
        };
        
        console.log('📤 Request data:', requestData);
        
        const response = await fetch(`../backend-apiCrud/index.php?url=pedidos/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 Response status:', response.status, response.statusText);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (response.ok) {
            // Update the status badge in the UI immediately
            const statusBadge = d.querySelector(`#status-${orderId}`);
            if (statusBadge) {
                let statusClass = '';
                switch (newStatus) {
                    case 'Pendiente':
                        statusClass = 'badge-warning';
                        break;
                    case 'Confirmado':
                        statusClass = 'badge-info';
                        break;
                    case 'En Preparación':
                        statusClass = 'badge-primary';
                        break;
                    case 'En Camino':
                        statusClass = 'badge-secondary';
                        break;
                    case 'Entregado':
                        statusClass = 'badge-success';
                        break;
                    case 'Cancelado':
                        statusClass = 'badge-danger';
                        break;
                    default:
                        statusClass = 'badge-secondary';
                }
                statusBadge.className = `badge ${statusClass}`;
                statusBadge.textContent = newStatus;
            }
            
            // Update cached data to reflect the status change
            const cachedOrders = JSON.parse(localStorage.getItem("pedidosData") || "[]");
            const orderIndex = cachedOrders.findIndex(order => order.id == orderId);
            if (orderIndex !== -1) {
                cachedOrders[orderIndex].estado = newStatus;
                localStorage.setItem("pedidosData", JSON.stringify(cachedOrders));
                console.log(`📋 Updated cached status for order ${orderId} to: ${newStatus}`);
            }
            
            // Also refresh the data from server to ensure consistency
            setTimeout(async () => {
                try {
                    const pedidos = await resources.pedidos.getAll();
                    localStorage.setItem("pedidosData", JSON.stringify(pedidos));
                    console.log(`🔄 Refreshed order data from server after status update`);
                } catch (error) {
                    console.error('Error refreshing order data:', error);
                }
            }, 1000);
            
            uiFeedback.success(`Estado actualizado a "${newStatus}" exitosamente.`);
        } else {
            throw new Error(result.message || 'Error al actualizar estado');
        }
    } catch (error) {
        console.error('Error changing status:', error);
        uiFeedback.error(`Error al actualizar estado: ${error.message}`);
    } finally {
        uiFeedback.hideLoading();
    }
}

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
