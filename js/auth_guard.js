// js/auth_guard.js
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const rolUsuario = localStorage.getItem("rol");
    const paginaActual = window.location.pathname.split("/").pop();

    if (!token || !rolUsuario) {
        if (paginaActual !== "auth_login.html") {
            window.location.href = "auth_login.html";
            return;
        }
    }

    const nivelUsuario = CONFIG.NIVELES_ROLES[rolUsuario] || 0;

    const mapaPermisos = {
        "analytics_dashboard.html": 3,
        "data_export_center.html": 3,
        "maintenance_audit_logs.html": 3,
        "asset_inventory.html": 2,
        "asset_technical_sheet.html": 2,
        "maintenance_scheduler.html": 2,
        "admin_access_control.html": 2, // Ambos entran, la lógica interna filtra
        "service_report_form.html": 1,
        "user_profile_settings.html": 1
    };

    const nivelRequerido = mapaPermisos[paginaActual];

    if (nivelRequerido && nivelUsuario < nivelRequerido) {
        if (nivelUsuario === 1) window.location.href = "service_report_form.html";
        else if (nivelUsuario === 2) window.location.href = "maintenance_scheduler.html";
        else window.location.href = "auth_login.html";
        return;
    }

    aplicarRestriccionesVisuales(rolUsuario, nivelUsuario);
});

function aplicarRestriccionesVisuales(rol, nivel) {
    if (nivel < 3) {
        document.getElementById("nav-dashboard")?.classList.add("hidden");
        document.getElementById("nav-exportar")?.classList.add("hidden");
        document.getElementById("nav-auditoria")?.classList.add("hidden");
    }
    if (nivel < 2) {
        document.getElementById("nav-inventario")?.classList.add("hidden");
        document.getElementById("nav-programador")?.classList.add("hidden");
        document.getElementById("nav-control-accesos")?.classList.add("hidden");
    }
}