//variables globales del formulario
import obtenerUsuario from "./local.js";
import { initAuthGuard } from "./auth-guard.js";
import uiFeedback from "./ui-feedback.js";

const d = document;
let nameInput = d.querySelector('#productos-select');
let priceInput = d.querySelector('#precio-pro');
let stockInput = d.querySelector('#stock-pro');
let descripcionInput = d.querySelector('#des-pro');
let imagen = d.querySelector('#imagen-pro');
let btnCreate = d.querySelector('.btn-create');
let productUpdate;
let nameUser = d.querySelector("#nombre-usuario");
let btnLogout = d.querySelector("#btnLogout");

// //funcion para poner el nombre del usuario
// let getUser = () => {
//     let user = JSON.parse(localStorage.getItem("userLogin"));
//     nameUser.textContent = user.nombre;
// };

// //evento para el boton del logout
// btnLogout.addEventListener("click", () =>{
//     localStorage.removeItem("userLogin");
//     location.href = "login.html";
// });

//evento al boton del formulario
btnCreate.addEventListener('click', () =>{
    //alert("producto :"+ nameInput.value );
    let dataProduct = getDataProduct();
    sendDataProduct(dataProduct)
});

//evento al navegador para comprobar si recargo la pagina
d.addEventListener("DOMContentLoaded", ()=>{
    // FIXED: Add authentication guard
    if (!initAuthGuard({ requireAuth: true })) {
        return; // Stop execution if not authenticated
    }
    
    obtenerUsuario();
    
    // Check if we have a product to edit
    productUpdate = JSON.parse(localStorage.getItem("productEdit"));
    console.log("Product to edit on load:", productUpdate);
    
    if(productUpdate != null && productUpdate.id){
        // Change page title to indicate edit mode
        const pageTitle = d.querySelector(".h3.text-gray-800");
        if(pageTitle) {
            pageTitle.textContent = "Editar Producto";
        }
        updateDataProduct();
    }
});

//funcion para validar el formulario y
//obtener los datos del formulario
let getDataProduct = () => {
    //validar formulario
    let product;   
    if (nameInput.value && priceInput.value && stockInput.value && descripcionInput.value && imagen.src) {
        product = {
            nombre: nameInput.value,
            descripcion: descripcionInput.value,
            precio: priceInput.value,  // FIXED: Use correct variable name
            stock: stockInput.value,
            imagen: imagen.src
        }
        // FIXED: Clear form fields with correct variable names
        nameInput.value = "";
        priceInput.value = "";
        stockInput.value = "";
        descripcionInput.value = "";
        imagen.src = "https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg";
        console.log(product);
    }else{
        uiFeedback.warning("Todos los campos son obligatorios");
    }

    return product;
};


//funcion para recibir los datos y
//realizar la peticion al servidor
let sendDataProduct = async (data)=>{
    if (!data) {
        return;
    }
    
    const loadingEl = uiFeedback.loading('Creando producto...');
    try {
        // Import API configuration dynamically
        const { resources } = await import('./api-config.js');
        
        const result = await resources.productos.create(data);
        uiFeedback.success(result.message || "Producto creado exitosamente");
        
        // Redirect to listing page after a short delay
        setTimeout(() => {
            location.href = "listado-pro.html";
        }, 1500);
        
    } catch (error) {
        console.error("Error creating product:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('406')) {
            uiFeedback.error("Los datos enviados no son válidos");
        } else if (error.message && error.message.includes('API request failed')) {
            uiFeedback.error("No se pudo conectar con el servidor. Verifica que XAMPP esté ejecutándose.");
        } else {
            uiFeedback.error(`Error al crear producto: ${error.message}`);
        }
    } finally {
        uiFeedback.hideLoading();
    }
};

//funcion para editar el producto
let updateDataProduct = ()=>{
    if(!productUpdate) {
        console.error("No product data to edit");
        return;
    }
    
    //agregar datos a editar en los campos del formulario
    nameInput.value = productUpdate.nombre || "";
    priceInput.value = productUpdate.precio || "";  
    stockInput.value = productUpdate.stock || "";
    descripcionInput.value = productUpdate.descripcion || "";
    imagen.src = productUpdate.imagen || "https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg";
    
    //alternar el boton de crear y editar
    let btnEdit = d.querySelector(".btn-update");
    if(btnCreate) btnCreate.classList.add("d-none");
    if(btnEdit) btnEdit.classList.remove("d-none");
    
    //agregar evento al boton editar
    btnEdit.addEventListener("click", (e)=>{
        e.preventDefault();
        
        // Validate form
        if (!nameInput.value || !priceInput.value || !stockInput.value || !descripcionInput.value) {
            uiFeedback.warning("Todos los campos son obligatorios");
            return;
        }
        
        let product = {
            id: productUpdate.id,
            nombre: nameInput.value,
            descripcion: descripcionInput.value,
            precio: priceInput.value,
            stock: stockInput.value,
            imagen: imagen.src
        }
        
        console.log("Product to update:", product);
        
        //borrar info de localStorage
        localStorage.removeItem("productEdit");
        //pasar los datos del producto a la funcion
        sendUpdateProduct(product);
    });
};

//funcion para realizar la peticion al servidor
let sendUpdateProduct = async ( pro )=>{
    if (!pro || !pro.id) {
        uiFeedback.error("Datos de producto inválidos");
        return;
    }
    
    const loadingEl = uiFeedback.loading('Actualizando producto...');
    try {
        // Import API configuration dynamically
        const { resources } = await import('./api-config.js');
        
        const result = await resources.productos.update(pro);
        uiFeedback.success(result.message || "Producto actualizado exitosamente");
        
        setTimeout(() => {
            location.href = "listado-pro.html";
        }, 1500);
        
    } catch (error) {
        console.error("Error updating product:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes('404')) {
            uiFeedback.error("Producto no encontrado");
        } else if (error.message && error.message.includes('406')) {
            uiFeedback.error("Los datos enviados no son válidos");
        } else if (error.message && error.message.includes('API request failed')) {
            uiFeedback.error("No se pudo conectar con el servidor. Verifica que XAMPP esté ejecutándose.");
        } else {
            uiFeedback.error(`Error al actualizar producto: ${error.message}`);
        }
    } finally {
        uiFeedback.hideLoading();
    }
}

