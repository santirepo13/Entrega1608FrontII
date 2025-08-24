// ===== Login (corregido) =====
const d = document;
const userInput = d.querySelector("#usuarioForm");
const passInput = d.querySelector("#contraForm");
const btnLogin  = d.querySelector(".btnLogin");

btnLogin?.addEventListener("click", (e) => {
  e.preventDefault();
  const data = getData();
  if (!data.usuario || !data.contrasena) {
    alert("Ingresa usuario y contraseña");
    return;
  }
  sendData(data);
});

function getData(){
  return {
    usuario: (userInput?.value || "").trim(),
    contrasena: (passInput?.value || "").trim()
  };
}

async function sendData(data){
  try {
    // Import API module dynamically to avoid module loading issues
    const { resources } = await import('./api-config.js');
    
    // Use the centralized API configuration
    const response = await resources.auth.login(data.usuario, data.contrasena);
    
    // Check for successful login response
    if (!response.usuario && !response.message) {
      throw new Error('Invalid response format');
    }
    
    let userLogin;
    if (response.message === 'inicio correcto' || response.usuario) {
      userLogin = response;
    } else {
      throw new Error(response.message || 'Login failed');
    }
    
    const displayName = userLogin.usuario || userLogin.nombre_usuario || userLogin.nombre || "usuario";
    alert(`Bienvenido: ${displayName}`);

    // seguridad básica: no guardes contraseñas
    delete userLogin.contrasena;
    localStorage.setItem("userLogin", JSON.stringify(userLogin));

    // Check for redirect after login
    const redirectUrl = localStorage.getItem("redirectAfterLogin");
    if (redirectUrl) {
      localStorage.removeItem("redirectAfterLogin");
      location.href = redirectUrl;
    } else {
      location.href = "index.html";
    }
    
  } catch (error) {
    console.error(error);
    
    // Handle specific error cases
    if (error.message && error.message.includes('401')) {
      alert("El usuario y/o la contraseña es incorrecto");
    } else if (error.message && error.message.includes('API request failed')) {
      alert("No se pudo conectar con el servidor. Verifica que XAMPP esté ejecutándose.");
    } else {
      alert(`Error de conexión: ${error.message}`);
    }
  }
}
