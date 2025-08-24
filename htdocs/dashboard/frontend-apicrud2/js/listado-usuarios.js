// ===== Listado de Usuarios (corregido) =====
const tableUsuarios = document.querySelector("#table-usuarios > tbody") || document.querySelector("#dataTable > tbody") || document.querySelector(".table-responsive table tbody") || document.querySelector("table tbody") || document.querySelector(".table-responsive table tbody") || document.querySelector("table tbody");
const searchInput   = document.querySelector("#search-input");

const API_BASES = [
  `${location.origin}/dashboard`,
  `${location.origin}/dashboard/backend-apiCrud`,
  "http://localhost/dashboard",
  "http://localhost/dashboard/backend-apiCrud"
];
const USUARIOS_ENDPOINTS = API_BASES.flatMap(b => [
  `${b}/usuarios`,
  `${b}/index.php?url=usuarios`
]);

document.addEventListener("DOMContentLoaded", () => {
  // Check role permissions
  const currentUser = JSON.parse(localStorage.getItem("userLogin") || "{}");
  const isAdmin = (currentUser.rol || "").toLowerCase() === "administrador";
  
  // Hide/show admin-only elements
  const createButton = document.getElementById("btn-crear-usuario");
  if (createButton && !isAdmin) {
    createButton.style.display = "none";
  }
  
  // Hide user management navigation for non-admins
  const usuariosNavItem = document.querySelector(".nav-item:has(.nav-link[data-target='#collapseUsuarios'])");
  if (!isAdmin && usuariosNavItem) {
    usuariosNavItem.style.display = "none";
  }
  
  getTableData();
});

searchInput?.addEventListener("input", () => {
  const term = (searchInput.value || "").toLowerCase();
  for (const tr of tableUsuarios.querySelectorAll("tr")) {
    const txt = tr.textContent.toLowerCase();
    tr.style.display = txt.includes(term) ? "" : "none";
  }
});

function postLike(url, method, body){
  return fetch(url, {
    method: "POST",
    headers: {"Content-Type":"application/json","X-HTTP-Method-Override": method},
    body: body
  });
}
async function apiFetch(options = {}, withId){
  let lastErr;
  for (const url of USUARIOS_ENDPOINTS){
    try {
      let res = await fetch(url, options);
      if (!res.ok && options && options.method && options.method !== "GET") { 
        try { res = await postLike(url, options.method, options.body);} catch {}
      }
      if (!res.ok) { lastErr = `${res.status} ${res.statusText}`; continue; }
      return res;
    } catch(e){ lastErr = e?.message || "red"; continue; }
  }
  throw new Error(lastErr || "No reachable endpoint");
}

async function getTableData(){
  try{
    const res = await apiFetch({ method: "GET" });
    const data = await res.json();
    renderRows(Array.isArray(data) ? data : []);
  }catch(e){
    console.error("Usuarios GET error:", e);
  }
}

function renderRows(rows){
  tableUsuarios.innerHTML = "";
  const currentUser = JSON.parse(localStorage.getItem("userLogin") || "{}");
  const isAdmin = (currentUser.rol || "").toLowerCase() === "administrador";
  
  rows.forEach((u, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${u.rol ?? ""}</td>
      <td>${u.usuario ?? ""}</td>
      <td class="text-nowrap">
        <button class="btn btn-info btn-sm js-view" data-id="${u.id}"><i class="fas fa-eye"></i></button>
        ${isAdmin ? `
        <button class="btn btn-warning btn-sm js-edit" data-id="${u.id}"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-sm js-delete" data-id="${u.id}"><i class="fas fa-trash"></i></button>
        ` : ''}
      </td>
    `;
    tableUsuarios.appendChild(tr);
  });
}

// Delegación de eventos para los botones
tableUsuarios?.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains("js-edit")){
    // navega a crear-usuario.html con id para editar
    location.href = `./crear-usuario.html?id=${id}`;  // FIXED: Use backticks for template literal
    return;
  }

  if (btn.classList.contains("js-view")){
    try{
      const res = await apiFetch({ method: "GET" });
      const all = await res.json();
      const u = (all || []).find(x => String(x.id) === String(id));
      alert(`ID: ${id}\nRol: ${u?.rol ?? ""}\nUsuario: ${u?.usuario ?? ""}`);
    }catch(e){ alert("No se pudo consultar el usuario"); }
    return;
  }

  if (btn.classList.contains("js-delete")){
    if (!confirm("¿Eliminar este usuario?")) return;
    try{
      const res = await apiFetch({
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id) })
      });
      await getTableData();
    }catch(e){
      alert("No se pudo eliminar");
    }
  }
});
