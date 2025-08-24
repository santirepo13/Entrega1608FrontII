// ===== Crear/Editar Cliente (Fixed Version) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const d = document;

// Form elements
const nombreInput = d.querySelector('#nombre-cliente');
const apellidoInput = d.querySelector('#apellido-cliente');
const emailInput = d.querySelector('#email-cliente');
const celularInput = d.querySelector('#celular-cliente');
const direccionInput = d.querySelector('#direccion-cliente');
const direccion2Input = d.querySelector('#direccion2-cliente');
const descripcionInput = d.querySelector('#descripcion-cliente');
const btnCreate = d.querySelector('.btn-create');
const btnUpdate = d.querySelector('.btn-update');

let clienteUpdate = null;

// Load notifications if not already loaded
if (!window.notifications) {
    const script = document.createElement('script');
    script.src = './js/notifications.js';
    document.head.appendChild(script);
}

// Event listeners for create button
btnCreate?.addEventListener('click', async (e) => {
    e.preventDefault();
    const payload = getDataCliente();
    if (!payload) return;
    
    const loadingEl = uiFeedback.loading('Creando cliente...');
    try {
        const result = await resources.clientes.create(payload);
        
        if (window.notifications) {
            notifications.success(result.message || "Cliente creado exitosamente");
        } else {
            uiFeedback.success(result.message || "Cliente creado exitosamente");
        }
        
        setTimeout(() => {
            location.href = "listado-clientes.html";
        }, 1500);
        
    } catch (error) {
        console.error("Error creating client:", error);
        
        if (window.notifications) {
            notifications.error(error.message || "No se pudo crear el cliente");
        } else {
            uiFeedback.error(`Error al crear cliente: ${error.message}`);
        }
    } finally {
        uiFeedback.hideLoading();
    }
});

// DOMContentLoaded event
d.addEventListener("DOMContentLoaded", () => {
    // Check authentication
    if (!initAuthGuard({ requireAuth: true })) {
        return;
    }
    
    // Check URL parameters first to determine if we're in create mode
    const urlParams = new URLSearchParams(window.location.search);
    const isCreateMode = !urlParams.has('edit') && !urlParams.has('id');
    
    if (isCreateMode) {
        // Clear any existing edit data to ensure clean create mode
        localStorage.removeItem("clienteEdit");
        clienteUpdate = null;
        
        // Ensure create mode UI
        const pageTitle = d.querySelector(".h3.text-gray-800");
        if (pageTitle) {
            pageTitle.textContent = "Crear Cliente";
        }
        
        if (btnCreate) btnCreate.classList.remove("d-none");
        if (btnUpdate) btnUpdate.classList.add("d-none");
        
        console.log("Initialized in CREATE mode");
    } else {
        // Check if we have a client to edit
        clienteUpdate = JSON.parse(localStorage.getItem("clienteEdit"));
        console.log("Client to edit on load:", clienteUpdate);
        
        if (clienteUpdate != null && (clienteUpdate.id_cliente || clienteUpdate.id)) {
            // Change page title to indicate edit mode
            const pageTitle = d.querySelector(".h3.text-gray-800");
            if (pageTitle) {
                pageTitle.textContent = "Editar Cliente";
            }
            updateDataCliente();
            console.log("Initialized in EDIT mode");
        } else {
            console.warn("Edit mode requested but no client data found, defaulting to create mode");
            // Fallback to create mode
            const pageTitle = d.querySelector(".h3.text-gray-800");
            if (pageTitle) {
                pageTitle.textContent = "Crear Cliente";
            }
        }
    }
});

// Function to get form data
function getDataCliente() {
    const nombre = nombreInput?.value?.trim() || "";
    const apellido = apellidoInput?.value?.trim() || "";
    const email = emailInput?.value?.trim() || "";
    const celular = celularInput?.value?.trim() || "";
    const direccion = direccionInput?.value?.trim() || "";
    const direccion2 = direccion2Input?.value?.trim() || "";
    const descripcion = descripcionInput?.value?.trim() || "";
    
    // Validation
    if (!nombre || !apellido || !email) {
        if (window.notifications) {
            notifications.error("Nombre, apellido y email son obligatorios");
        } else {
            uiFeedback.warning("Nombre, apellido y email son obligatorios");
        }
        return null;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (window.notifications) {
            notifications.error("El email no es válido");
        } else {
            uiFeedback.warning("El email no es válido");
        }
        return null;
    }
    
    return {
        nombre,
        apellido,
        email,
        celular,
        direccion,
        direccion2,
        descripcion
    };
}

// Function to populate form for editing
function updateDataCliente() {
    if (!clienteUpdate) {
        console.error("No client data to edit");
        return;
    }
    
    // Populate form fields
    if (nombreInput) nombreInput.value = clienteUpdate.nombre || "";
    if (apellidoInput) apellidoInput.value = clienteUpdate.apellido || "";
    if (emailInput) emailInput.value = clienteUpdate.email || "";
    if (celularInput) celularInput.value = clienteUpdate.celular || "";
    if (direccionInput) direccionInput.value = clienteUpdate.direccion || "";
    if (direccion2Input) direccion2Input.value = clienteUpdate.direccion2 || "";
    if (descripcionInput) descripcionInput.value = clienteUpdate.descripcion || "";
    
    // Toggle buttons
    if (btnCreate) btnCreate.classList.add("d-none");
    if (btnUpdate) btnUpdate.classList.remove("d-none");
    
    // Add event listener for update button
    btnUpdate?.addEventListener("click", async (e) => {
        e.preventDefault();
        
        const payload = getDataCliente();
        if (!payload) return;
        
        // Add the client ID for update
        payload.id_cliente = clienteUpdate.id_cliente || clienteUpdate.id;
        
        console.log("Client to update:", payload);
        
        const loadingEl = uiFeedback.loading('Actualizando cliente...');
        try {
            const result = await resources.clientes.update(payload);
            
            // Clear stored edit data
            localStorage.removeItem("clienteEdit");
            
            if (window.notifications) {
                notifications.success(result.message || "Cliente actualizado exitosamente");
            } else {
                uiFeedback.success(result.message || "Cliente actualizado exitosamente");
            }
            
            setTimeout(() => {
                location.href = "listado-clientes.html";
            }, 1500);
            
        } catch (error) {
            console.error("Error updating client:", error);
            
            if (window.notifications) {
                notifications.error(error.message || "No se pudo actualizar el cliente");
            } else {
                uiFeedback.error(`Error al actualizar cliente: ${error.message}`);
            }
        } finally {
            uiFeedback.hideLoading();
        }
    });
}

// Clear form function
function clearForm() {
    if (nombreInput) nombreInput.value = "";
    if (apellidoInput) apellidoInput.value = "";
    if (emailInput) emailInput.value = "";
    if (celularInput) celularInput.value = "";
    if (direccionInput) direccionInput.value = "";
    if (direccion2Input) direccion2Input.value = "";
    if (descripcionInput) descripcionInput.value = "";
}

// Export functions for external use if needed
window.getDataCliente = getDataCliente;
window.updateDataCliente = updateDataCliente;
window.clearFormCliente = clearForm;
