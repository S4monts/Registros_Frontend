// js/auth_guard.js

// =========================================================================
// 🔒 BLOQUEO INMEDIATO: validación de JWT y rutas permitidas
// =========================================================================
(function comprobarAccesoInmediato() {
    const token = localStorage.getItem("token");
    const rolUsuario = localStorage.getItem("rol") || localStorage.getItem("userRole");
    const rutaActual = globalThis.location.pathname.toLowerCase();

    const nivelesRoles = {
        tecnico: 1,
        "auxiliar de infraestructura": 2,
        "auxiliar infraestructura": 2,
        "jefe de infraestructura": 3,
        admin: 3,
        administrador: 3
    };

    const reglasRutas = [
        { nivel: 1, fragmentos: ["reporte-tecnico", "service_report_form"] },
        { nivel: 1, fragmentos: ["inventario", "asset_inventory"] },
        { nivel: 2, fragmentos: ["programacion", "maintenance_scheduler"] },
        { nivel: 2, fragmentos: ["gestion-usuarios", "admin_access_control"] },
        { nivel: 3, fragmentos: ["dashboard", "analytics_dashboard"] },
        { nivel: 3, fragmentos: ["exportar-datos", "data_export_center"] },
        { nivel: 3, fragmentos: ["auditoria-sistema", "maintenance_audit_logs"] }
    ];

    function normalizarRol(rol) {
        if (!rol) return "";
        return rol.normalize("NFD").replaceAll(/\p{Diacritic}/gu, "").trim().toLowerCase();
    }

    function obtenerNivelUsuario(rol) {
        return nivelesRoles[normalizarRol(rol)] || 0;
    }

    function obtenerNivelRequerido(ruta) {
        const regla = reglasRutas.find((item) => item.fragmentos.some((fragmento) => ruta.includes(fragmento)));
        return regla ? regla.nivel : 0;
    }

    function redirigirPorNivel(nivelUsuario) {
        globalThis.location.href = nivelUsuario === 1 ? "service_report_form.html" : "analytics_dashboard.html";
    }

    const nivelUsuario = obtenerNivelUsuario(rolUsuario);
    const nivelRequerido = obtenerNivelRequerido(rutaActual);
    const estaEnEntradaPublica = rutaActual === "" || rutaActual === "/" || rutaActual.endsWith("auth_login.html");

    console.debug("[auth_guard] rol:", rolUsuario, "-> nivel:", nivelUsuario, "-> ruta:", rutaActual);

    if (token) {
        if (estaEnEntradaPublica || (nivelRequerido > 0 && nivelUsuario < nivelRequerido)) {
            redirigirPorNivel(nivelUsuario);
        }
        return;
    }

    if (!estaEnEntradaPublica) {
        globalThis.location.href = "auth_login.html";
    }
})();