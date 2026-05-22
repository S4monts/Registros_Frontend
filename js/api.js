// js/api.js
const API = {
    async peticion(endpoint, opciones = {}) {
        const token = localStorage.getItem("token");

        const headers = {
            "Content-Type": "application/json",
            ...opciones.headers
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const configuracion = {
            ...opciones,
            headers
        };

        try {
            const respuesta = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, configuracion);

            if (respuesta.status === 401) {
                localStorage.clear();
                window.location.href = "auth_login.html";
                return null;
            }

            if (respuesta.status === 204) return true;

            const datos = await respuesta.json();
            if (!respuesta.ok) throw new Error(datos.detail || "Error en la petición");

            return datos;
        } catch (error) {
            console.error("Error API:", error.message);
            throw error;
        }
    },

    get(endpoint) { return this.peticion(endpoint, { method: "GET" }); },
    post(endpoint, body) { return this.peticion(endpoint, { method: "POST", body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.peticion(endpoint, { method: "PUT", body: JSON.stringify(body) }); },
    delete(endpoint) { return this.peticion(endpoint, { method: "DELETE" }); }
};

// Extensión: método especializado para negociar el token con backend (x-www-form-urlencoded)
API.authLogin = async function authLogin(email, password) {
    const detallesFormulario = new URLSearchParams();
    detallesFormulario.append('username', email);
    detallesFormulario.append('password', password);

    try {
        const respuesta = await fetch(`${CONFIG.API_BASE_URL}/auth/login/access-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: detallesFormulario.toString()
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.detail || 'Credenciales incorrectas');
        }

        // 1. Persistencia del Token JWT Base
        localStorage.setItem('token', datos.access_token);

        // 2. Extracción segura del Payload (segmento intermedio del JWT)
        const payloadBase64 = datos.access_token.split('.')[1];
        const payloadDecodificado = JSON.parse(atob(payloadBase64));

        localStorage.setItem('userRole', payloadDecodificado.rol);
        localStorage.setItem('userEmail', payloadDecodificado.sub);

        // 3. Normalización del Nombre (derivado desde el prefijo del correo)
        const nombrePorDefecto = String(payloadDecodificado.sub.split('@')[0] || '').replace(/\./g, ' ');
        localStorage.setItem('usuario_nombre', nombrePorDefecto);

        return {
            exito: true,
            rol: payloadDecodificado.rol,
            email: payloadDecodificado.sub
        };
    } catch (error) {
        console.error('❌ Error en la subcapa authLogin:', error.message || error);
        throw error;
    }
};

// Helper global para cierre de sesión (compatible con botones inline onclick="logout()")
API.logout = function() {
    try {
        localStorage.clear();
        // Redirigir al login
        window.location.href = "/";
    } catch (err) {
        console.error('Error durante logout:', err);
    }
};

// Exponer función global por compatibilidad con HTML existentes
window.logout = API.logout;
