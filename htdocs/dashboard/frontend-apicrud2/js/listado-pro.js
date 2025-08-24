//variables globales
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

// Función para normalizar rutas de imágenes y evitar duplicación
const normalizeImagePath = (imagePath) => {
    if (!imagePath) return '';
    
    // Si la ruta ya incluye 'frontend-apicrud2', la convertimos a ruta relativa
    if (imagePath.includes('frontend-apicrud2/images/')) {
        // Extraer solo la parte después de 'frontend-apicrud2/'
        return imagePath.replace(/.*frontend-apicrud2\//, '');
    }
    
    // Si la ruta ya empieza con 'images/', la devolvemos tal como está
    if (imagePath.startsWith('images/')) {
        return imagePath;
    }
    
    // Si es solo el nombre del archivo, agregamos 'images/'
    if (!imagePath.includes('/')) {
        return `images/${imagePath}`;
    }
    
    // En caso contrario, devolver tal como está
    return imagePath;
};

let tablePro = document.querySelector("#table-pro > tbody");
let searchInput = document.querySelector("#search-input");
let nameUser = document.querySelector("#nombre-usuario");
let btnLogout = document.querySelector("#btnLogout");

//funcion para poner el nombre del usuario
let getUser = () => {
    let user = JSON.parse(localStorage.getItem("userLogin"));
    nameUser.textContent = (user.usuario || user.nombre_usuario || user.nombre || "Invitado");
};

//evento para el boton del logout
btnLogout.addEventListener("click", () =>{
    localStorage.removeItem("userLogin");
    location.href = "login.html";
});

//evento para probar el campo de buscar
searchInput.addEventListener("input", ()=>{
    //console.log(searchInput.value);
    searchProductTable();
});

//evento para el navegador
document.addEventListener("DOMContentLoaded", ()=>{
    // Add authentication guard
    if (!initAuthGuard({ requireAuth: true })) {
        return; // Stop execution if not authenticated
    }
    
    // Clear any existing loading indicators first
    uiFeedback.clearAll();
    
    // Clear cache to ensure fresh data
    const cacheKeys = ['datosTabla', 'productos', 'productData', 'tableData', 'productosCache'];
    cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    
    getTableData();
    getUser();
    
    // Handle highlight parameter from search results
    handleHighlightParameter();
});

//funcion para traer los datos de la BD a la tabla
let getTableData = async ()=>{
    // Clear any existing loading indicators first
    uiFeedback.hideLoading();
    
    const loadingEl = uiFeedback.loading('Cargando productos...');
    try {
        // Clear any cached data first
        localStorage.removeItem("datosTabla");
        
        // Use centralized API configuration with cache-busting
        const tableData = await resources.productos.getAll();
        
        if (!Array.isArray(tableData)) {
            throw new Error('Los datos recibidos no son un array válido');
        }
        
        // Filter out inactive products before displaying
        const activeProducts = tableData.filter(p => p.activo == 1 || p.activo === '1' || p.activo === true);
        
        //agregar los datos de la tabla a localStorage (solo productos activos)
        localStorage.setItem("datosTabla", JSON.stringify(activeProducts));
        
        //limpiar tabla existente
        tablePro.innerHTML = "";
        
        if (activeProducts.length === 0) {
            tablePro.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos activos disponibles</td></tr>';
            uiFeedback.info('No se encontraron productos activos');
        } else {
            //agregar los datos a la tabla (solo productos activos)
            activeProducts.forEach((dato, i)=>{
                let row = document.createElement("tr");
                row.innerHTML = `
                    <td> ${i+1} </td>
                    <td> ${dato.nombre || 'N/A'} </td>
                    <td> ${dato.descripcion || 'N/A'} </td>
                    <td> ${dato.precio || '0'} </td>
                    <td> ${dato.stock || '0'} </td>
                    <td>  <img src="${normalizeImagePath(dato.imagen)}" width="100" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5JbWFnZW48L3RleHQ+PC9zdmc+'"> </td>
                    <td>
                        <button  id="btn-edit" onclick="editDataTable(${i})" type="button" class="btn btn-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                                <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                            </svg>
                        </button> - 
                        ${  (JSON.parse(localStorage.getItem("userLogin")||"{}").rol || "").toLowerCase() === "vendedor" ? "" :  
                        `<button  id="btn-delete" onclick="deleteDataTable(${i})" type="button" class="btn btn-danger">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                            </svg>
                        </button>`}
                    </td>
                `;
                tablePro.appendChild(row);
            });
            uiFeedback.success(`${activeProducts.length} productos activos cargados exitosamente`);
        }
        
    } catch (error) {
        console.error("Error loading products:", error);
        
        // Clear table and show empty state
        tablePro.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar productos</td></tr>';
        
        // Show appropriate error message
        if (error.message && error.message.includes('network')) {
            uiFeedback.error('Error de conexión. Verifica que XAMPP esté ejecutándose y el servidor backend esté disponible.');
        } else if (error.message && error.message.includes('fetch')) {
            uiFeedback.error('No se pudo conectar al servidor. Asegúrate de que el backend esté ejecutándose.');
        } else {
            uiFeedback.error(`Error al cargar productos: ${error.message}`);
        }
    } finally {
        // Ensure loading is always hidden
        setTimeout(() => {
            uiFeedback.hideLoading();
        }, 100);
    }
};


//funcion para editar algun producto de la tabla
let editDataTable = ( pos )=>{
    let products = [];
    let productsSave = JSON.parse(localStorage.getItem("datosTabla"));
    if (productsSave != null) {
        products = productsSave;
    }
    let singleProduct = products[pos];
    
    // Make sure the product exists
    if (!singleProduct) {
        uiFeedback.error('Producto no encontrado');
        return;
    }
    
    // Store the product data for editing
    localStorage.setItem("productEdit", JSON.stringify(singleProduct));
    
    // Don't remove datosTabla as it might be needed
    // localStorage.removeItem("datosTabla");
    
    uiFeedback.info('Redirigiendo al formulario de edición...');
    setTimeout(() => {
        location.href = "crear-pro.html";
    }, 500);
}


//funcion para eliminar algun dato de la tabla
let deleteDataTable = ( pos )=>{
    // Check user login data and permissions
    const userLogin = localStorage.getItem("userLogin");
    let user = null;
    try {
        user = JSON.parse(userLogin || "{}");
    } catch (error) {
        console.error("Error parsing user login:", error);
        uiFeedback.error("Error de autenticación");
        return;
    }
    
    // Check if user is vendedor (seller) - they cannot delete
    const isVendedor = (user?.rol || "").toLowerCase() === "vendedor";
    if (isVendedor) {
        uiFeedback.error("Los vendedores no pueden eliminar productos");
        return;
    }
    
    let products = [];
    let productsSave = JSON.parse(localStorage.getItem("datosTabla"));
    if (productsSave != null) {
        products = productsSave;
    }
    
    let singleProduct = products[pos];
    if (!singleProduct) {
        uiFeedback.error("Producto no encontrado");
        return;
    }
    
    let IDProduct = {
        id: singleProduct.id
    };
    
    let confirmar = confirm(`¿Deseas eliminar ${singleProduct.nombre}?\n\nNota: El producto será desactivado y ya no aparecerá en la lista, pero se mantendrá en el historial de pedidos.`);
    
    if (confirmar) {
        sendDeleteProduct( IDProduct );
    }
}

// Make functions globally accessible for onclick handlers
window.editDataTable = editDataTable;
window.deleteDataTable = deleteDataTable;

//funcion para realizar la peticion de eliminar un producto
let sendDeleteProduct = async ( idObject )=>{
    const loadingEl = uiFeedback.loading('Eliminando producto...');
    try {
        const result = await resources.productos.delete(idObject.id);
        
        // Clear the cached data to force fresh load
        localStorage.removeItem("datosTabla");
        
        uiFeedback.success(result.message || "Producto eliminado exitosamente");
        
        // Force hard reload to clear all cache
        setTimeout(() => {
            window.location.reload(true);
        }, 1500);
        
    } catch (error) {
        console.error("Error deleting product:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('404')) {
            uiFeedback.error("Producto no encontrado");
        } else if (error.message && error.message.includes('406')) {
            uiFeedback.error("El ID enviado no fue admitido");
        } else if (error.message && error.message.includes('API request failed')) {
            uiFeedback.error("No se pudo conectar con el servidor. Verifica que XAMPP esté ejecutándose.");
        } else {
            uiFeedback.error(`Error al eliminar producto: ${error.message}`);
        }
    } finally {
        uiFeedback.hideLoading();
    }
}

//funcion para quitar productos de la tabla
let clearDataTable = ()=>{
    let rowTable = document.querySelectorAll("#table-pro > tbody > tr");
    //console.log(rowTable);
    rowTable.forEach((row)=>{
        row.remove();
    });
};

//funcion para buscar un product de la tabla
let searchProductTable = ()=>{
    let products = [];
    let productsSave = JSON.parse(localStorage.getItem("datosTabla"));
    if (productsSave != null) {
        products = productsSave;
    }

    //console.log(products);
    //obtener lo escrito en campo de texto
    let textSearch = searchInput.value.toLowerCase();
    //console.log(textSearch);
    clearDataTable();
    
    let filteredProducts = []; // Store filtered products with their original indices
    products.forEach((pro, originalIndex) => {
        if (pro.nombre.toLowerCase().indexOf(textSearch) != -1) {
            filteredProducts.push({...pro, originalIndex});
        }
    });
    
    // Display filtered products with correct indices
    filteredProducts.forEach((pro, displayIndex) => {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td> ${displayIndex + 1} </td>
            <td> ${pro.nombre} </td>
            <td> ${pro.descripcion} </td>
            <td> ${pro.precio} </td>
            <td> ${pro.stock} </td>
            <td>  <img src="${normalizeImagePath(pro.imagen)}" width="100" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5JbWFnZW48L3RleHQ+PC9zdmc+'"> </td>
            <td>
                <button  id="btn-edit" onclick="editDataTable(${pro.originalIndex})" type="button" class="btn btn-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                </button> - 
                ${  (JSON.parse(localStorage.getItem("userLogin")||"{}").rol || "").toLowerCase() === "vendedor" ? "" :  
                `<button  id="btn-delete" onclick="deleteDataTable(${pro.originalIndex})" type="button" class="btn btn-danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg>
                </button>`}
            </td>
        `;
        tablePro.appendChild(row);
    });
};

// Handle highlight parameter for search result direct links
function handleHighlightParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    
    if (highlightId) {
        // Wait a bit for the table to load, then highlight
        setTimeout(() => {
            highlightProduct(highlightId);
        }, 1000);
    }
}

// Highlight a specific product in the table
function highlightProduct(productId) {
    const products = JSON.parse(localStorage.getItem("datosTabla")) || [];
    const productIndex = products.findIndex(p => p.id == productId);
    
    if (productIndex !== -1) {
        const rows = document.querySelectorAll('#table-pro tbody tr');
        if (rows[productIndex]) {
            // Add highlight styling
            rows[productIndex].style.backgroundColor = '#fff3cd';
            rows[productIndex].style.border = '2px solid #ffeaa7';
            
            // Scroll to the highlighted row
            rows[productIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Show a notification
            uiFeedback.info(`Producto "${products[productIndex].nombre}" encontrado desde la búsqueda`);
            
            // Remove highlight after 5 seconds
            setTimeout(() => {
                rows[productIndex].style.backgroundColor = '';
                rows[productIndex].style.border = '';
            }, 5000);
        }
    } else {
        uiFeedback.warning('Producto no encontrado en la lista actual');
    }
}
