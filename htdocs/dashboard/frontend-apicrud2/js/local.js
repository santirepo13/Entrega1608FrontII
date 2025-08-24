// Set global API base so non-module scripts can also read it
window.__API_BASE__ = "http://localhost/dashboard";

// Provide a small helper to display the logged-in user name in the UI
export default function obtenerUsuario() {
  try {
    const raw = localStorage.getItem("userLogin");
    if (!raw) return;
    const u = JSON.parse(raw);
    const name = u.usuario || u.nombre_usuario || u.nombre || "Invitado";
    const el = document.querySelector("#nombre-usuario, .user-name");
    if (el) el.textContent = name;
  } catch (e) {
    // no-op
  }
}
