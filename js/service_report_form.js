// ════════════════════════════════════════════════════════════════════════════
// FORMULARIO DE MANTENIMIENTO Y REPORTE DE SERVICIO - LÓGICA UNIFICADA
// ════════════════════════════════════════════════════════════════════════════
// Este archivo contiene toda la lógica de carga dinámica para:
// - Selector de espacios
// - Checkboxes de componentes
// - Cálculo automático de subtotales
// ════════════════════════════════════════════════════════════════════════════

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE CARGA DE ESPACIOS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Carga la lista de espacios (salones) desde el backend
 * y llena el selector desplegable dinámicamente
 */
function cargarSelectorEspacios() {
    const selectEspacio = document.getElementById("select-espacio");

    if (!selectEspacio) {
        console.warn("⚠️ Elemento select-espacio no encontrado. Saltando carga de espacios.");
        return;
    }

    // Fetch a la API de espacios
    fetch(`${API_BASE_URL}/espacios/`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}`);
            }
            return respuesta.json();
        })
        .then(espacios => {
            if (!Array.isArray(espacios)) {
                throw new Error("La respuesta no es un array válido");
            }

            // Limpiar opciones previas (mantener la opción por defecto)
            while (selectEspacio.options.length > 1) {
                selectEspacio.remove(1);
            }

            if (espacios.length === 0) {
                const opcion = document.createElement("option");
                opcion.value = "";
                opcion.textContent = "No hay espacios disponibles";
                opcion.disabled = true;
                selectEspacio.appendChild(opcion);
                return;
            }

            // Agregar cada espacio como opción
            espacios.forEach(espacio => {
                const opcion = document.createElement("option");
                opcion.value = espacio.id;

                // Construir label descriptivo
                let etiqueta = espacio.nombre || "";
                if (espacio.bloque) {
                    etiqueta += ` - ${espacio.bloque}`;
                }
                if (espacio.piso) {
                    etiqueta += ` (Piso ${espacio.piso})`;
                }

                opcion.textContent = etiqueta;
                opcion.setAttribute("data-codigo", espacio.codigo_espacio || "");
                selectEspacio.appendChild(opcion);
            });

            console.log(`✅ Cargados ${espacios.length} espacios exitosamente`);
        })
        .catch(error => {
            console.error("❌ Error al cargar espacios:", error);

            // Mostrar opción de error
            while (selectEspacio.options.length > 1) {
                selectEspacio.remove(1);
            }
            const opcion = document.createElement("option");
            opcion.value = "";
            opcion.textContent = "❌ Error al cargar espacios";
            opcion.disabled = true;
            selectEspacio.appendChild(opcion);
        });
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE CARGA DE COMPONENTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Carga la lista de componentes (repuestos) desde el backend
 * y crea checkboxes interactivos con campos de cantidad y precio
 */
function cargarCheckboxesComponentes() {
    const contenedor = document.getElementById("contenedor-componentes");

    if (!contenedor) {
        console.warn("⚠️ Elemento contenedor-componentes no encontrado. Saltando carga de componentes.");
        return;
    }

    // Mostrar indicador de carga
    contenedor.innerHTML = `
        <div class="text-center text-slate-400 py-4">
            <i class="fas fa-spinner text-2xl animate-spin"></i>
            <p class="text-sm mt-2">Cargando componentes disponibles...</p>
        </div>
    `;

    // Fetch a la API de componentes
    fetch(`${API_BASE_URL}/tipo_componentes/`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}`);
            }
            return respuesta.json();
        })
        .then(componentes => {
            if (!Array.isArray(componentes)) {
                throw new Error("La respuesta no es un array válido");
            }

            // Limpiar contenedor
            contenedor.innerHTML = "";

            if (componentes.length === 0) {
                contenedor.innerHTML = `
                    <p class="text-center text-slate-400 py-4 text-sm">
                        <i class="fas fa-inbox text-lg"></i><br>
                        No hay componentes disponibles en la base de datos
                    </p>
                `;
                return;
            }

            // Renderizar cada componente con checkbox
            componentes.forEach(comp => {
                const elemento = crearElementoComponente(comp);
                contenedor.appendChild(elemento);
            });

            // Agregar event listeners a todos los checkboxes
            configurarEventListenersComponentes();

            console.log(`✅ Cargados ${componentes.length} componentes exitosamente`);
        })
        .catch(error => {
            console.error("❌ Error al cargar componentes:", error);
            contenedor.innerHTML = `
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-xs font-bold text-red-600">
                        <i class="fas fa-exclamation-circle mr-2"></i>Error al conectar con el servidor
                    </p>
                    <p class="text-xs text-red-500 mt-2">
                        ${error.message || "No se pudo cargar la lista de componentes"}
                    </p>
                    <p class="text-xs text-red-400 mt-2">
                        Verifica que el servidor esté corriendo en ${API_BASE_URL}
                    </p>
                </div>
            `;
        });
}

/**
 * Crea el elemento HTML para un checkbox de componente
 * con campos dinámicos de cantidad y precio
 * @param {Object} comp - Objeto componente con propiedades id y nombre
 * @returns {HTMLElement} Elemento div con el checkbox y sus campos
 */
function crearElementoComponente(comp) {
    const divComponente = document.createElement("div");
    divComponente.className = "p-4 bg-white border border-slate-200 rounded-lg hover:border-uccLight/50 transition componente-item";

    const checkboxId = `checkbox_${comp.id}`;
    const cantidadId = `cant_${comp.id}`;
    const precioId = `precio_${comp.id}`;
    const detallesId = `detalles_${comp.id}`;

    divComponente.innerHTML = `
        <!-- Fila del Checkbox -->
        <div class="flex items-start gap-3 mb-0">
            <input 
                type="checkbox" 
                id="${checkboxId}"
                class="checkbox-componente w-5 h-5 rounded border-slate-300 text-uccLight cursor-pointer focus:ring-2 focus:ring-uccLight mt-0.5"
                data-componente-id="${comp.id}"
                data-detalles-id="${detallesId}"
            >
            <label for="${checkboxId}" class="flex-1 text-sm font-bold text-slate-700 cursor-pointer">
                ${comp.nombre}
                <span class="block text-xs text-slate-400 mt-0.5">ID: ${comp.id}</span>
            </label>
        </div>

        <!-- Bloque de Detalles (Cantidad y Precio) - Inicialmente Oculto -->
        <div id="${detallesId}" class="mt-4 pt-4 border-t border-slate-100 space-y-3 hidden">
            <div class="grid grid-cols-2 gap-3">
                <!-- Campo de Cantidad -->
                <div>
                    <label for="${cantidadId}" class="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Cantidad
                    </label>
                    <input 
                        type="number" 
                        id="${cantidadId}"
                        class="input-cantidad w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-uccLight focus:outline-none transition"
                        placeholder="Ej: 2"
                        step="0.1"
                        min="0"
                    >
                </div>

                <!-- Campo de Precio Unitario -->
                <div>
                    <label for="${precioId}" class="block text-xs font-bold uppercase text-slate-600 mb-1">
                        Precio Unit. ($)
                    </label>
                    <input 
                        type="number" 
                        id="${precioId}"
                        class="input-precio w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-uccLight focus:outline-none transition"
                        placeholder="Ej: 15000"
                        step="100"
                        min="0"
                    >
                </div>
            </div>

            <!-- Cálculo de Subtotal -->
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p class="text-xs text-slate-600">
                    <span class="font-bold">Subtotal: $</span>
                    <span class="subtotal-componente text-sm font-black text-uccLight">0</span>
                </p>
            </div>
        </div>
    `;

    return divComponente;
}

/**
 * Configura los event listeners para todos los checkboxes de componentes
 * - Mostrar/ocultar campos dinámicos
 * - Calcular subtotal en tiempo real
 * - Limpiar valores al desmarcar
 */
function configurarEventListenersComponentes() {
    const checkboxes = document.querySelectorAll(".checkbox-componente");

    checkboxes.forEach(checkbox => {
        const detallesId = checkbox.getAttribute("data-detalles-id");
        const componenteId = checkbox.getAttribute("data-componente-id");
        const detallesDiv = document.getElementById(detallesId);
        const cantidadInput = document.getElementById(`cant_${componenteId}`);
        const precioInput = document.getElementById(`precio_${componenteId}`);

        // Event listener para marcar/desmarcar el checkbox
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                // ✅ Mostrar: remover clase 'hidden'
                detallesDiv.classList.remove("hidden");
                detallesDiv.classList.remove("d-none");
            } else {
                // ❌ Ocultar: agregar clase 'hidden'
                detallesDiv.classList.add("hidden");

                // Limpiar campos
                if (cantidadInput) cantidadInput.value = "";
                if (precioInput) precioInput.value = "";

                // Resetear subtotal
                const subtotalSpan = detallesDiv.querySelector(".subtotal-componente");
                if (subtotalSpan) subtotalSpan.textContent = "0";
            }
        });

        // Event listeners para calcular subtotal en tiempo real
        if (cantidadInput && precioInput) {
            [cantidadInput, precioInput].forEach(input => {
                input.addEventListener("input", () => {
                    actualizarSubtotalComponente(detallesId);
                });
            });
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// FUNCIÓN UNIVERSAL DE CÁLCULO DE SUBTOTAL
// ════════════════════════════════════════════════════════════════════════════

/**
 * Actualiza el cálculo de subtotal (cantidad * precio) - FUNCIÓN ÚNICA Y UNIVERSAL
 * @param {string} detallesId - ID del contenedor de detalles
 */
function actualizarSubtotalComponente(detallesId) {
    const detallesDiv = document.getElementById(detallesId);
    if (!detallesDiv) return;

    const cantidadInput = detallesDiv.querySelector(".input-cantidad");
    const precioInput = detallesDiv.querySelector(".input-precio");
    const subtotalSpan = detallesDiv.querySelector(".subtotal-componente");

    const cantidad = parseFloat(cantidadInput?.value || 0);
    const precio = parseFloat(precioInput?.value || 0);
    const subtotal = cantidad * precio;

    if (subtotalSpan) {
        subtotalSpan.textContent = subtotal.toLocaleString("es-CO");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN - EVENTO ÚNICO DE DOMCONTENTLOADED
// ════════════════════════════════════════════════════════════════════════════

/**
 * Se ejecuta cuando el DOM está completamente cargado
 * Inicia la carga de espacios y componentes - EVENTO ÚNICO
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("📋 Inicializando formulario de mantenimiento (unificado)...");
    cargarSelectorEspacios();
    cargarCheckboxesComponentes();
});

