// js/auth_guard.js

// =========================================================================
// 🔒 BLOQUEO INMEDIATO: Se ejecuta antes de que el navegador dibuje el HTML
// =========================================================================
(function comprobarAccesoInmediato() {
    const token = localStorage.getItem("token");
    const rolUsuario = localStorage.getItem("rol") || localStorage.getItem("userRole");
    const rutaActual = window.location.pathname.toLowerCase();

    // Homologación exacta con los Enums reales de la base de datos de Python
    const nivelesRoles = {
        'Tecnico': 1,
        'Auxiliar de Infraestructura': 2,
        'Jefe de Infraestructura': 3
    };
    const nivelUsuario = nivelesRoles[rolUsuario] || 0;

    // 1. CONTROL DE SEGURIDAD PARA COMPONENTES MODALES
    if (rutaActual.includes("asset_technical_sheet") || rutaActual.includes("user_profile_settings")) {
        if (window.self === window.top) {
            window.location.href = "/";
            return;
        }
    }

    // 2. DETERMINAR EL NIVEL REQUERIDO DE LA RUTA ACTUAL
    let nivelRequerido = 0;
    if (rutaActual.includes("dashboard") || rutaActual.includes("analytics_dashboard")) {
        nivelRequerido = 3;
    } else if (rutaActual.includes("exportar-datos") || rutaActual.includes("data_export_center")) {
        nivelRequerido = 3;
    } else if (rutaActual.includes("auditoria-sistema") || rutaActual.includes("maintenance_audit_logs")) {
        nivelRequerido = 3;
    } else if (rutaActual.includes("inventario") || rutaActual.includes("asset_inventory")) {
        nivelRequerido = 2;
    } else if (rutaActual.includes("programacion") || rutaActual.includes("maintenance_scheduler")) {
        nivelRequerido = 2;
    } else if (rutaActual.includes("gestion-usuarios") || rutaActual.includes("admin_access_control")) {
        nivelRequerido = 2;
    } else if (rutaActual.includes("reporte-tecnico") || rutaActual.includes("service_report_form")) {
        nivelRequerido = 1;
    }

    // 3. APLICAR LOS MUROS DE SEGURIDAD FULMINANTES
    if (nivelRequerido > 0) {
        if (!token || !rolUsuario) {
            window.location.href = "/";
            return;
        }

        if (nivelUsuario < nivelRequerido) {
            if (nivelUsuario === 1) window.location.href = "/reporte-tecnico";
            else if (nivelUsuario === 2) window.location.href = "/programacion";
            else window.location.href = "/";
            return;
        }
    }
})();

// =========================================================================
// 📊 RESTRECCIONES VISUALES: Ocultar botones del Sidebar Dinámicamente
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const rolUsuario = localStorage.getItem("rol") || localStorage.getItem("userRole");

    const nivelesRoles = {
        'Tecnico': 1,
        'Auxiliar de Infraestructura': 2,
        'Jefe de Infraestructura': 3
    };
    const nivelUsuario = nivelesRoles[rolUsuario] || 0;

    if (token && rolUsuario) {

        // Buscador ultra-seguro: Encuentra todos los enlaces que apunten al archivo y los oculta
        const ocultarEnlaces = (palabraClave) => {
            const enlaces = document.querySelectorAll(`a[href*='${palabraClave}']`);
            enlaces.forEach(enlace => enlace.classList.add("hidden"));
        };

        // Si es Técnico (Nivel 1) o Auxiliar (Nivel 2), ocultamos los módulos del Jefe
        if (nivelUsuario < 3) {
            ocultarEnlaces("analytics_dashboard");
            ocultarEnlaces("data_export_center");
            ocultarEnlaces("maintenance_audit_logs");
            ocultarEnlaces("dashboard");
            ocultarEnlaces("exportar-datos");
            ocultarEnlaces("auditoria-sistema");
        }

        // Si es Técnico (Nivel 1), ocultamos también los módulos del Auxiliar
        if (nivelUsuario < 2) {
            ocultarEnlaces("asset_inventory");
            ocultarEnlaces("maintenance_scheduler");
            ocultarEnlaces("admin_access_control");
            ocultarEnlaces("inventario");
            ocultarEnlaces("programacion");
            ocultarEnlaces("gestion-usuarios");
        }
    }
});

// =========================================================================
// 🧭 CONTROL GLOBAL DEL SIDEBAR (botón hamburguesa y cierre)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const btnMenuToggle = document.getElementById("btn-menu-toggle");
    const btnCloseSidebar = document.getElementById("btn-close-sidebar");
    const sidebar = document.getElementById("main-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    function toggleSidebar() {
        if (sidebar) sidebar.classList.toggle("-translate-x-full");
        if (overlay) overlay.classList.toggle("hidden");
    }

    if (btnMenuToggle) btnMenuToggle.addEventListener("click", toggleSidebar);
    if (btnCloseSidebar) btnCloseSidebar.addEventListener("click", toggleSidebar);
    if (overlay) overlay.addEventListener("click", toggleSidebar);
});

// =========================================================================
// 📱 SIDEBAR RESPONSIVO: Control de Apertura y Cierre en Móviles
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const mainSidebar = document.getElementById("main-sidebar");
    const btnMenuMobile = document.getElementById("btn-menu-mobile");

    if (btnMenuMobile && mainSidebar && sidebarOverlay) {
        // Toggle del menú hamburguesa
        btnMenuMobile.addEventListener("click", () => {
            mainSidebar.classList.toggle("-translate-x-full");
            sidebarOverlay.classList.toggle("hidden");
        });

        // Cerrar sidebar al hacer click en el overlay
        sidebarOverlay.addEventListener("click", () => {
            mainSidebar.classList.toggle("-translate-x-full");
            sidebarOverlay.classList.toggle("hidden");
        });

        // Cerrar sidebar al hacer click en cualquier enlace del sidebar
        const sidebarLinks = mainSidebar.querySelectorAll("a");
        sidebarLinks.forEach(link => {
            link.addEventListener("click", () => {
                mainSidebar.classList.add("-translate-x-full");
                sidebarOverlay.classList.add("hidden");
            });
        });
    }
});
