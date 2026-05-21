/**
 * ============================================================================
 * LOGIN.JS - Autenticación y Gestión de Sesión (VERSIÓN 2.0 ROBUSTA)
 * ============================================================================
 *
 * Responsabilidades críticas:
 * - INTERCEPTAR el evento submit del formulario ANTES de enviarse
 * - Realizar fetch POST a /api/v1/auth/login/access-token
 * - Decodificar el JWT y extraer datos del usuario
 * - Guardar token en localStorage
 * - Redirigir según el rol
 */

console.log(" Script login.js iniciando...");

// ============================================================================
// ESTRATEGIA DE CARGA: Intentar cargar en múltiples eventos
// ============================================================================

function initializeLoginForm() {
    console.log("✅ Inicializando formulario de login...");

    // Obtener referencias a elementos del DOM
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = document.getElementById("btnText");
    const btnIcon = document.getElementById("btnIcon");
    const errorContainer = document.getElementById("errorContainer");
    const errorMessage = document.getElementById("errorMessage");

    // Validar que el formulario existe
    if (!loginForm) {
        console.error("❌ CRÍTICO: No se encontró #loginForm en el DOM");
        return false;
    }

    console.log("✅ Elementos del DOM localizados correctamente");

    // ========================================================================
    // AGREGAR LISTENER AL FORMULARIO (INTERCEPTAR BEFORE ENVÍO)
    // ========================================================================

    // Usar "submit" event que se dispara ANTES de que el navegador envíe
    loginForm.addEventListener("submit", function handleLoginSubmit(event) {
        console.log(" Evento submit capturado");

        //  DETENER COMPLETAMENTE: Impedir que el navegador envíe el formulario
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;

        console.log(" Enviador por defecto bloqueado");

        // Limpiar errores previos
        errorContainer?.classList.add("hidden");
        errorMessage && (errorMessage.textContent = "");

        // Desactivar botón durante procesamiento
        const oldBtnText = btnText?.textContent || "Entrar al Sistema";
        submitBtn && (submitBtn.disabled = true);
        btnText && (btnText.textContent = "Autenticando...");
        btnIcon && (btnIcon.className = "fas fa-spinner fa-spin");

        (async () => {
            try {
                console.log(" Procesando autenticación...");

                // Obtener valores
                const email = emailInput?.value?.trim() || "";
                const password = passwordInput?.value || "";

                // Validar
                if (!email || !password) {
                    throw new Error("Por favor completa email y contraseña");
                }

                if (!email.includes("@")) {
                    throw new Error("Por favor ingresa un email válido");
                }

                console.log(` Enviando a /api/v1/auth/login/access-token...`);

                // ============================================================
                // FETCH POST (seguro: credenciales en body, NO en URL)
                // ============================================================
                const formData = new URLSearchParams();
                formData.append("username", emailInput.value); // FastAPI busca 'username'
                formData.append("password", passwordInput.value);

                const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login/access-token`, {
                    method: "POST",
                    headers: {
                        // IMPORTANTE: Este header le dice a FastAPI que lea los datos como formulario
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: formData.toString() // Convertimos los datos a "username=...&password=..."
                });

                const responseData = await response.json();

                if (!response.ok) {
                    const errorMsg = responseData?.detail || "Error en la autenticación";
                    throw new Error(errorMsg);
                }

                // ============================================================
                // OBTENER Y VALIDAR TOKEN
                // ============================================================
                const accessToken = responseData?.access_token;

                if (!accessToken) {
                    throw new Error("El servidor no retornó un token");
                }

                console.log("✅ Token recibido");

                // ============================================================
                // DECODIFICAR JWT
                // ============================================================
                const decodedUser = decodeJWT(accessToken);

                if (!decodedUser) {
                    throw new Error("No se pudo decodificar el token JWT");
                }

                const userEmail = decodedUser.sub;
                const userRole = decodedUser.rol;

                console.log(`✅ Usuario: ${userEmail} | Rol: ${userRole}`);

                // ============================================================
                // GUARDAR EN LOCALSTORAGE
                // ============================================================
                try {
                    localStorage.setItem("token", accessToken);
                    localStorage.setItem("userEmail", userEmail);
                    localStorage.setItem("userRole", userRole);
                    // Guardar también con clave "rol" para compatibilidad con auth_guard.js
                    localStorage.setItem("rol", userRole);
                    const userName = userEmail.split("@")[0];
                    localStorage.setItem("userName", userName);
                    console.log(" Sesión guardada en localStorage");
                } catch (e) {
                    console.warn("⚠️ No se pudo guardar en localStorage:", e);
                }

                // ============================================================
                // REDIRIGIR SEGÚN ROL
                // ============================================================
                const redirectUrl = getRedirectUrlByRole(userRole);

                if (!redirectUrl) {
                    throw new Error(`Rol no reconocido: "${userRole}". Contacta al administrador.`);
                }

                console.log(` Redirigiendo a: ${redirectUrl}`);

                // Esperar un poco para asegurar que se guardó todo
                await new Promise(r => setTimeout(r, 100));

                window.location.href = redirectUrl;

            } catch (error) {
                console.error("❌ Error:", error.message);

                // Mostrar error al usuario
                errorMessage && (errorMessage.textContent = error.message);
                errorContainer?.classList.remove("hidden");

                // Limpiar contraseña por seguridad
                passwordInput && (passwordInput.value = "");

                // Reactivar botón
                submitBtn && (submitBtn.disabled = false);
                btnText && (btnText.textContent = oldBtnText);
                btnIcon && (btnIcon.className = "fas fa-arrow-right");
            }
        })();

        // Return false por si acaso
        return false;
    }, false);  // Usar false para bubbling (no captura)

    console.log("✅ Event listener de submit registrado");
    return true;
}

/**
 * Decodifica un JWT y retorna su payload
 */
function decodeJWT(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            throw new Error("JWT inválido");
        }

        let payload = parts[1];

        // Ajustar padding de base64url
        payload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padding = (4 - (payload.length % 4)) % 4;
        if (padding) {
            payload += "=".repeat(padding);
        }

        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (error) {
        console.error("❌ Error decodificando JWT:", error.message);
        return null;
    }
}

/**
 * Obtiene la URL de redirección según el rol del usuario
 */
function getRedirectUrlByRole(role) {
    const roleRoutes = {
        "Jefe de Infraestructura": "/dashboard",
        "Auxiliar de Infraestructura": "/programacion",
        "Tecnico": "/reporte-tecnico"
    };

    return roleRoutes[role] || null;
}

// ============================================================================
// PUNTO DE ENTRADA: Inicializar cuando el DOM esté listo
// ============================================================================

if (document.readyState === "loading") {
    // DOM aún cargando, esperar evento
    console.log("⏳ DOM cargando... esperando DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", initializeLoginForm);
} else {
    // DOM ya está listo (script cargó después)
    console.log("⏳ DOM ya está listo, inicializando ahora");
    initializeLoginForm();
}

// ============================================================================
// DEBUG
// ============================================================================
console.log(" login.js cargado correctamente");
console.log(" Estado:", {
    hasToken: !!localStorage.getItem("token"),
    userEmail: localStorage.getItem("userEmail") || "ninguno",
    userRole: localStorage.getItem("userRole") || "ninguno"
});