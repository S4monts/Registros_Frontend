/**
 * AiresFlow - Controlador Centralizado del Menú Lateral (Sidebar)
 * Gestiona de manera responsiva la visibilidad en móviles y pantallas de escritorio.
 */
(function () {
    function inicializarSidebar() {
        const sidebar = document.getElementById("sidebar") || document.getElementById("main-sidebar");
        const overlay = document.getElementById("sidebar-overlay");

        // Buscar botones de apertura (hamburguesa) o cierre dinámicamente
        const botonesMenu = document.querySelectorAll('[id*="btn-menu"], .toggle-sidebar, .fa-bars');
        const botonCerrar = document.getElementById("btn-close-sidebar");

        if (!sidebar || !overlay) {
            console.warn("⚠️ Advertencia Sidebar: Elementos estructurales no encontrados en esta vista.");
            return;
        }

        // Función nativa para alternar visibilidad (Toggle)
        function toggleSidebar() {
            sidebar.classList.toggle("-translate-x-full");
            overlay.classList.toggle("hidden");
        }

        // Función explícita para cerrar el menú lateral
        function cerrarSidebar() {
            sidebar.classList.add("-translate-x-full");
            overlay.classList.add("hidden");
        }

        function abrirSidebar() {
            sidebar.classList.remove("-translate-x-full");
            overlay.classList.remove("hidden");
        }

        function sincronizarResponsive() {
            if (window.innerWidth >= 768) {
                overlay.classList.add("hidden");
            } else {
                overlay.classList.add("hidden");
            }
        }

        // Asignar listeners a todos los botones detectados que abren el menú
        botonesMenu.forEach((boton) => {
            const elementoClickable = boton.tagName === "I" || boton.classList.contains("fa-bars")
                ? (boton.parentElement || boton)
                : boton;

            elementoClickable.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.innerWidth < 768) {
                    toggleSidebar();
                } else {
                    abrirSidebar();
                }
            });
        });

        if (botonCerrar) {
            botonCerrar.addEventListener("click", cerrarSidebar);
        }

        // Fallback global: si algún trigger cambia de estructura, cualquier clic sobre el icono o su contenedor abre el sidebar.
        document.addEventListener("click", (e) => {
            const trigger = e.target.closest('[id*="btn-menu"], .toggle-sidebar, .fa-bars');
            if (!trigger) return;
            if (trigger.id === "btn-close-sidebar") return;

            e.preventDefault();
            e.stopPropagation();
            if (window.innerWidth < 768) {
                toggleSidebar();
            } else {
                abrirSidebar();
            }
        }, true);

        // Cerrar al hacer clic en el fondo oscuro (overlay)
        overlay.addEventListener("click", cerrarSidebar);

        // Cerrar de forma inteligente si se hace clic en un enlace de navegación móvil
        const enlacesNavegacion = sidebar.querySelectorAll("nav a");
        enlacesNavegacion.forEach((enlace) => {
            enlace.addEventListener("click", () => {
                if (window.innerWidth < 768) { // Solo en dispositivos móviles (Breakpoint md de Tailwind)
                    cerrarSidebar();
                }
            });
        });

        window.addEventListener("resize", sincronizarResponsive);
        cerrarSidebar();
        sincronizarResponsive();

        console.log("✅ Controlador centralizado del Sidebar cargado con éxito.");
    }

    // Ejecutar la inicialización dependiendo del estado de carga del árbol de elementos
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarSidebar);
    } else {
        inicializarSidebar();
    }
})();

