// ===== Crear/Editar Usuario (educacional/final) =====
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";
const form = document.querySelector("form");
const rolInput = document.querySelector("#rol-usuario");
const userInput = document.querySelector("#nombre-usuario-input");
const passInput = document.querySelector("#contrasena-usuario");
const pass2Input= document.querySelector("#confirmar-contrasena");
const btnCreate = document.querySelector(".btn-create");
const btnUpdate = document.querySelector(".btn-update");

// Load notifications if not already loaded


// Helper: gets query param from URL
function qid(name){
  const m = location.search.match(new RegExp(`[?&]${name}=([^&]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function validar(){
  // Get values
  const rol = (rolInput?.value||"").trim();
  const usuario = (userInput?.value||"").trim();
  const pass = (passInput?.value||"").trim();
  const pass2 = (pass2Input?.value||"").trim();
  
  // Validate required
  if(!rol || !usuario){ 
    uiFeedback.warning("Rol y usuario son obligatorios");
    return null; 
  }
  if(!qid("id") && !pass){ 
    uiFeedback.warning("Contraseña obligatoria para crear usuario");
    return null;
  }
  if(pass && pass !== pass2){ 
    uiFeedback.error("Las contraseñas no coinciden");
    return null;
  }
  const payload = { rol, usuario };
  if (pass) payload.contrasena = pass;
  return payload;
}

async function precargar(){
  // If we are editing (id in URL), load and fill user data
  const id = qid("id");
  if(!id) return;
  try{
    const data = await resources.usuarios.getAll();
    const u = (data||[]).find(x => String(x.id) === String(id));
    if (u){
      rolInput.value = u.rol || "";
      userInput.value = u.usuario || "";
    }
    btnCreate?.classList.add("d-none");
    btnUpdate?.classList.remove("d-none");
  }catch(e){
    uiFeedback.error("No se pudo precargar usuario: " + (e.message||e));
  }
}

btnCreate?.addEventListener("click", async (e)=>{
  e.preventDefault();
  const payload = validar(); 
  if(!payload) return;
  
  const loadingEl = uiFeedback.loading('Creando usuario...');
  try{
    const result = await resources.usuarios.create(payload);
    uiFeedback.success(result.message || "Usuario creado exitosamente");
    setTimeout(() => {
      location.href = "./listado-usuarios.html";
    }, 1000);
  }catch(e){
    console.error("Error creating user:", e);
    uiFeedback.error(e.message || "No se pudo crear el usuario");
  }finally{
    uiFeedback.hideLoading();
  }
});

btnUpdate?.addEventListener("click", async (e)=>{
  e.preventDefault();
  const id = qid("id");
  if(!id){
    uiFeedback.error("ID no encontrado");
    return;
  }
  const payload = validar();
  if(!payload) return;
  const loadingEl = uiFeedback.loading('Actualizando usuario...');
  try{
    const result = await resources.usuarios.update({ id: Number(id), ...payload });
    uiFeedback.success(result.message || "Usuario actualizado exitosamente");
    setTimeout(() => {
      location.href = "./listado-usuarios.html";
    }, 1000);
  }catch(e){
    console.error("Error updating user:", e);
    uiFeedback.error(e.message || "No se pudo actualizar el usuario");
  }finally{
    uiFeedback.hideLoading();
  }
});

document.addEventListener("DOMContentLoaded", precargar);
