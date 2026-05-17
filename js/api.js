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