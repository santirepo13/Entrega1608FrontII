// ===== Listado de Clientes (Enhanced) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const tableClientes = document.querySelector("#table-clientes tbody");
const searchInput   = document.querySelector("#search-input");
const nameUser = document.querySelector("#nombre-usuario");
const btnLogout = document.querySelector("#btnLogout");

// Get user info
const getUser = () => {
    const user = JSON.parse(localStorage.getItem("userLogin") || "{}");
    if (nameUser) {
        nameUser.textContent = user.usuario || user.nombre_usuario || user.nombre || "Invitado";
    }
};

// Logout event
if (btnLogout) {
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("userLogin");
        location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Check authentication
    if (!initAuthGuard({ requireAuth: true })) {
        return;
    }
    getUser();
    getTableData();
});

// Filtro en vivo
searchInput?.addEventListener("input", () => {
  const term = (searchInput.value || "").toLowerCase();
  for (const tr of tableClientes.querySelectorAll("tr")) {
    const txt = tr.textContent.toLowerCase();
    tr.style.display = txt.includes(term) ? "" : "none";
  }
});

async function getTableData(){
  const loadingEl = uiFeedback.loading('Cargando clientes...');
  try{
    const data = await resources.clientes.getAll();
    
    // Store in localStorage for search/filter
    localStorage.setItem("datosClientes", JSON.stringify(data));
    
    renderRows(data);
    
    if (data.length > 0) {
        uiFeedback.success(`${data.length} clientes cargados exitosamente`);
    } else {
        uiFeedback.info('No se encontraron clientes');
    }
  }catch(e){
    console.error("Clientes GET error:", e);
    uiFeedback.error(`Error cargando clientes: ${e.message || 'Servidor no disponible'}`);
    renderRows([], "Error cargando clientes");
  } finally {
    uiFeedback.hideLoading();
  }
}


function esc(v){
  if (v == null) return "";
  return String(v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

function renderRows(rows, emptyMsg = "No hay clientes."){
  if (!tableClientes) return;
  
  tableClientes.innerHTML = "";
  if (!rows || rows.length === 0){
    tableClientes.innerHTML = `<tr><td colspan="7" class="text-center">${esc(emptyMsg)}</td></tr>`;
    return;
  }
  
  rows.forEach((c, idx) => {
    const tr = document.createElement("tr");
    const userRole = (JSON.parse(localStorage.getItem("userLogin")||"{}").rol || "").toLowerCase();
    
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${esc(c.nombre)}</td>
      <td>${esc(c.apellido)}</td>
      <td>${esc(c.email)}</td>
      <td>${esc(c.celular)}</td>
      <td>${esc(c.direccion)}</td>
      <td class="text-nowrap">
        <button class="btn btn-warning btn-sm js-edit" data-id="${c.id_cliente || c.id}"><i class="fas fa-edit"></i></button>
        ${userRole !== "vendedor" ? 
          `<button class="btn btn-danger btn-sm js-delete" data-id="${c.id_cliente || c.id}"><i class="fas fa-trash"></i></button>` : ''}
        <button class="btn btn-info btn-sm js-view" data-id="${c.id_cliente || c.id}"><i class="fas fa-eye"></i></button>
      </td>
    `;
    tableClientes.appendChild(tr);
  });
}

// Event delegation for client actions
if (tableClientes) {
  tableClientes.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("js-edit")){
      // Store client data for editing
      const clients = JSON.parse(localStorage.getItem("datosClientes") || "[]");
      const client = clients.find(c => String(c.id_cliente || c.id) === String(id));
      if (client) {
        localStorage.setItem("clienteEdit", JSON.stringify(client));
        uiFeedback.info('Redirigiendo al formulario de edición...');
        setTimeout(() => {
          location.href = `crear-cliente.html`;
        }, 500);
      } else {
        uiFeedback.error('Cliente no encontrado');
      }
      return;
    }

    if (btn.classList.contains("js-view")){
      try{
        const clients = JSON.parse(localStorage.getItem("datosClientes") || "[]");
        const c = clients.find(x => String(x.id_cliente || x.id) === String(id));
        if (!c) { 
          uiFeedback.error("No se encontró el cliente."); 
          return; 
        }

        // Update modal if exists
        const $ = (sel) => document.querySelector(sel);
        if ($("#modal-nombre-completo")) {
          $("#modal-nombre-completo").textContent = `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim();
          $("#modal-email").textContent          = c.email ?? "";
          $("#modal-celular").textContent        = c.celular ?? "";
          $("#modal-direccion").textContent      = c.direccion ?? "";
          $("#modal-direccion2").textContent     = c.direccion2 ?? "";
          $("#modal-descripcion").textContent    = c.descripcion ?? "";
          window.jQuery && window.jQuery('#verClienteModal').modal('show');
        } else {
          // Show info in feedback if no modal
          uiFeedback.info(`Cliente: ${c.nombre} ${c.apellido} - ${c.email}`);
        }
      }catch(e){ 
        uiFeedback.error("No se pudo consultar el cliente"); 
      }
      return;
    }

    if (btn.classList.contains("js-delete")){
      if (!confirm("¿Eliminar este cliente?")) return;
      
      const loadingEl = uiFeedback.loading('Eliminando cliente...');
      try{
        await resources.clientes.delete(id);
        uiFeedback.success('Cliente eliminado exitosamente');
        setTimeout(() => getTableData(), 1500);
      }catch(e){ 
        uiFeedback.error(`No se pudo eliminar: ${e.message || 'Error desconocido'}`); 
      } finally {
        uiFeedback.hideLoading();
      }
    }
  });
}

// Function to go to create client mode (clearing any edit data)
function goToCreateClient() {
  localStorage.removeItem("clienteEdit");
  location.href = "crear-cliente.html";
}

// Make functions globally available if needed
window.getTableData = getTableData;
window.goToCreateClient = goToCreateClient;
