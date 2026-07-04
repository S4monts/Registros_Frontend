// js/config.js
const CONFIG = {
    API_BASE_URL: "http://127.0.0.1:8000/api/v1",
    NIVELES_ROLES: {
        'Tecnico': 1,
        'Auxiliar': 2,
        'Admin': 3
    }
};

function cerrarSesionGlobal() {
    try {
        localStorage.clear();
        window.location.href = "/";
    } catch (err) {
        console.error("Error durante logout:", err);
    }
}

window.logout = cerrarSesionGlobal;