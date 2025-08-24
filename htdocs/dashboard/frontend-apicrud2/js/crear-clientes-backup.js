// ===== Crear/Editar Cliente (Fixed) =====
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

const d = document;

// Form elements
let nombreInput = d.querySelector('#nombre-cliente');
let apellidoInput = d.querySelector('#apellido-cliente');
let emailInput = d.querySelector('#email-cliente');
let celularInput = d.querySelector('#celular-cliente');
let direccionInput = d.querySelector('#direccion-cliente');
let direccion2Input = d.querySelector('#direccion2-cliente');
let descripcionInput = d.querySelector('#descripcion-cliente');
let btnCreate = d.querySelector('.btn-create');
let btnUpdate = d.querySelector('.btn-update');
let clienteUpdate = null;

  const params = new URLSearchParams(location.search);
  const editId = params.get('id');
  const isEdit = !!editId;

  // --- Endpoints (igual que listado) ---
  const API_BASES = [
  ...(MANUAL_API ? [MANUAL_API] : []),
    `${location.origin}/dashboard`,
    `${location.origin}/dashboard/backend-apiCrud`,
    "http://localhost/dashboard",
    "http://localhost/dashboard/backend-apiCrud",
  "http://127.0.0.1/dashboard",
  "http://127.0.0.1/dashboard/backend-apiCrud"
  ];
  const CLIENTS_ENDPOINTS = API_BASES.flatMap(b => [
    `${b}/clientes`,
    `${b}/index.php?url=clientes`
  ]);

  const normalize = (raw) => {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.clientes)) return raw.clientes;
    if (raw?.cliente) return raw.cliente;
    return raw;
  };

  const ensureButton = (btn, label, klass) => {
    if (!btn) return;
    btn.type = 'submit';
    btn.textContent = label;
    btn.classList.remove('d-none', 'btn-primary', 'btn-warning');
    btn.classList.add(klass);
  };

  const buildUrl = (base, id = null) => {
    if (id == null) return base;
    const sep = base.includes('?') ? '&' : '?';
    // mandamos ambos por compatibilidad: ?id=123&id_cliente=123
    return `${base}${sep}id=${encodeURIComponent(id)}&id_cliente=${encodeURIComponent(id)}`;
  };

  async function apiGET(id = null) {
    let lastErr;
    for (const base of CLIENTS_ENDPOINTS) {
      const url = buildUrl(base, id);
      try {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) { lastErr = `${res.status} ${res.statusText}`; continue; }
        return res;
      } catch (e) { lastErr = e?.message || 'network'; }
    }
    throw new Error(lastErr || 'No reachable endpoint (GET)');
  }

  // Intenta varias formas de guardar (PUT, override, JSON, urlencoded, FormData)
  async function apiSAVE(method, payload, id = null) {
    let lastErr;
    for (const base of CLIENTS_ENDPOINTS) {
      const url = buildUrl(base, id);

      // 1) Método nativo (PUT/POST) con JSON
      try {
        const r1 = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (r1.ok) return r1;
        lastErr = `${r1.status} ${r1.statusText}`;
      } catch (e) { lastErr = e?.message || 'network'; }

      // 2) POST + X-HTTP-Method-Override con JSON
      try {
        const r2 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-HTTP-Method-Override': method },
          body: JSON.stringify(payload)
        });
        if (r2.ok) return r2;
        lastErr = `${r2.status} ${r2.statusText}`;
      } catch (e) { lastErr = e?.message || 'network'; }

      // 3) POST urlencoded + override
      try {
        const params = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => v != null && params.append(k, v));
        const r3 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-HTTP-Method-Override': method },
          body: params.toString()
        });
        if (r3.ok) return r3;
        lastErr = `${r3.status} ${r3.statusText}`;
      } catch (e) { lastErr = e?.message || 'network'; }

      // 4) POST FormData + override (algunos PHP viejos)
      try {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => v != null && fd.append(k, v));
        const r4 = await fetch(url, {
          method: 'POST',
          headers: { 'X-HTTP-Method-Override': method },
          body: fd
        });
        if (r4.ok) return r4;
        lastErr = `${r4.status} ${r4.statusText}`;
      } catch (e) { lastErr = e?.message || 'network'; }
    }
    throw new Error(lastErr || 'No reachable endpoint (SAVE)');
  }

  async function loadClient(id) {
    try {
      const res = await apiGET(id);
      const raw = await res.json();
      const data = normalize(raw);
      const c = Array.isArray(data) ? data.find(x => String(x.id_cliente) === String(id)) : data;
      if (!c) return;
      setVal('nombre',      c.nombre);
      setVal('apellido',    c.apellido);
      setVal('email',       c.email);
      setVal('celular',     c.celular);
      setVal('direccion',   c.direccion);
      setVal('direccion2',  c.direccion2);
      setVal('descripcion', c.descripcion);
    } catch (e) {
      console.error('No se pudo cargar el cliente:', e);
    }
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    const payload = {
      // muchos backends aceptan cualquiera de los dos
      id:         isEdit ? Number(editId) : undefined,
      id_cliente: isEdit ? Number(editId) : undefined,
      nombre:      getVal('nombre'),
      apellido:    getVal('apellido'),
      email:       getVal('email'),
      celular:     getVal('celular'),
      direccion:   getVal('direccion'),
      direccion2:  getVal('direccion2'),
      descripcion: getVal('descripcion')
    };
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

    try {
      const method = isEdit ? 'PUT' : 'POST';
      await apiSAVE(method, payload, isEdit ? editId : null);
      alert(isEdit ? 'Cliente actualizado.' : 'Cliente creado.');
      location.href = 'listado-clientes.html';
    } catch (e) {
      alert('No se pudo guardar: ' + (e?.message || e));
    }
  }

  async function init() {
    if (!form) return;

    if (isEdit) {
      if (titleEl) titleEl.textContent = 'Editar Cliente';
      ensureButton(btnSubmit, 'Actualizar Cliente', 'btn-warning');
      await loadClient(editId);
    } else {
      if (titleEl) titleEl.textContent = 'Crear Cliente';
      ensureButton(btnSubmit, 'Crear Cliente', 'btn-primary');
    }

    form.addEventListener('submit', onSubmit);
  }

  // 👉 Ejecuta init aunque el DOM ya esté cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
