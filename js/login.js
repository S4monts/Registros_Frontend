// js/login.js
document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.querySelector("form");
    if (!formulario) return;

    formulario.addEventListener("submit", async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            // Petición al endpoint de FastAPI
            const respuesta = await fetch(`${CONFIG.API_BASE_URL}/auth/login/access-token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    username: email,
                    password: password
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.detail || "Credenciales incorrectas o usuario inactivo");
            }

            console.log("1. Respuesta cruda de FastAPI:", datos);

            //  FUNCIÓN SÉNIOR: Decodificar el JWT manualmente para extraer las claims (sub, rol, exp)
            const token = datos.access_token;
            const base64Url = token.split('.')[1]; // Obtener la parte del payload
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            // Parsear el payload a un objeto JavaScript
            const payload = JSON.parse(jsonPayload);
            console.log("2. Datos extraídos de adentro del JWT:", payload);

            // Extraer el rol y definir un nombre provisional basado en el correo
            const rolUsuario = payload.rol || payload.role;
            const nombreUsuario = payload.nombre || payload.sub.split('@')[0]; // Ejemplo: diana.perez.tec

            if (!rolUsuario) {
                throw new Error("El token JWT no contiene un rol válido.");
            }

            // Guardar de forma segura en el LocalStorage para el uso del Guardián (auth_guard.js)
            localStorage.setItem("token", token);
            localStorage.setItem("rol", rolUsuario);
            localStorage.setItem("usuario_nombre", nombreUsuario);

            // Redirección inteligente basada en la jerarquía del rol
            if (rolUsuario === "Tecnico") {
                window.location.href = "service_report_form.html";
            } else if (rolUsuario === "Auxiliar") {
                window.location.href = "maintenance_scheduler.html";
            } else if (rolUsuario === "Admin") {
                window.location.href = "analytics_dashboard.html";
            } else {
                alert(`Rol '${rolUsuario}' no tiene una pantalla de redirección configurada.`);
            }

        } catch (error) {
            console.error("Error en autenticación:", error);
            alert(` Error de acceso: ${error.message}`);
        }
    });
});