// ========================================
// Cargador Dinámico del Inventario de Equipos
// ========================================

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// ========================================
// FUNCIONES DE LECTURA Y CARGA
// ========================================

/**
 * Carga todas las tablas maestras necesarias para poblar selectores en formularios
 * Realiza peticiones concurrentes a: marcas, bloques, espacios y tipos de equipo
 */
function cargarSelectoresFormularios() {
    console.log("📋 Cargando datos maestros para selectores...");

    // Cargar Marcas en selector de equipo
    fetch(`${API_BASE_URL}/marcas/`)
        .then(r => r.json())
        .then(marcas => {
            const select = document.getElementById("select-marca");
            if (select) {
                select.innerHTML = '<option value="">Selecciona una marca</option>';
                marcas.forEach(marca => {
                    const option = document.createElement("option");
                    option.value = marca.id;
                    option.textContent = marca.nombre;
                    select.appendChild(option);
                });
                console.log(`✅ Cargadas ${marcas.length} marcas`);
            }
        })
        .catch(err => {
            console.error("❌ Error al cargar marcas:", err);
            const select = document.getElementById("select-marca");
            if (select) select.innerHTML = '<option value="">Error al cargar marcas</option>';
        });

    // Cargar Espacios en selector de equipo
    fetch(`${API_BASE_URL}/espacios/`)
        .then(r => r.json())
        .then(data => {
            const espacios = Array.isArray(data) ? data : (data.items || []);
            const select = document.getElementById("select-espacio-equipo");
            if (select) {
                select.innerHTML = '<option value="">Selecciona un espacio</option>';
                espacios.forEach(espacio => {
                    const option = document.createElement("option");
                    option.value = espacio.id;
                    option.textContent = `${espacio.nombre} (Piso ${espacio.piso})`;
                    select.appendChild(option);
                });
                console.log(`✅ Cargados ${espacios.length} espacios para equipo`);
            }
        })
        .catch(err => {
            console.error("❌ Error al cargar espacios:", err);
            const select = document.getElementById("select-espacio-equipo");
            if (select) select.innerHTML = '<option value="">Error al cargar espacios</option>';
        });

    // Cargar Bloques en selector de espacio
    fetch(`${API_BASE_URL}/bloques/`)
        .then(r => r.json())
        .then(data => {
            const bloques = Array.isArray(data) ? data : (data.items || []);
            const select = document.getElementById("select-bloque-espacio");
            if (select) {
                select.innerHTML = '<option value="">Selecciona un bloque</option>';
                bloques.forEach(bloque => {
                    const option = document.createElement("option");
                    option.value = bloque.id;
                    option.textContent = bloque.nombre_bloque;
                    select.appendChild(option);
                });
                console.log(`✅ Cargados ${bloques.length} bloques`);
            }
        })
        .catch(err => {
            console.error("❌ Error al cargar bloques:", err);
            const select = document.getElementById("select-bloque-espacio");
            if (select) select.innerHTML = '<option value="">Error al cargar bloques</option>';
        });

    // Cargar Tipos de Equipo en selector
    fetch(`${API_BASE_URL}/tipos-equipo/`)
        .then(r => r.json())
        .then(data => {
            const tiposEquipo = Array.isArray(data) ? data : (data.items || []);
            const select = document.getElementById("select-tipo-equipo");
            if (select) {
                select.innerHTML = '<option value="">Selecciona tipo de equipo</option>';
                tiposEquipo.forEach(tipo => {
                    const option = document.createElement("option");
                    option.value = tipo.id;
                    option.textContent = tipo.nombre;
                    select.appendChild(option);
                });
                console.log(`✅ Cargados ${tiposEquipo.length} tipos de equipo`);
            }
        })
        .catch(err => {
            console.error("❌ Error al cargar tipos de equipo:", err);
            const select = document.getElementById("select-tipo-equipo");
            if (select) select.innerHTML = '<option value="">Error al cargar tipos</option>';
        });
}

/**
 * Carga toda la lista de equipos desde el backend
 * y renderiza dinámicamente la tabla del inventario
 */
function cargarInventarioCompleto() {
    const tablaBody = document.getElementById("tablaEquiposBody");

    if (!tablaBody) {
        console.error("❌ No se encontró el elemento con id='tablaEquiposBody'");
        return;
    }

    // Mostrar indicador de carga
    tablaBody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-12 text-slate-400">
                <i class="fas fa-spinner text-2xl animate-spin mb-3 block"></i>
                <p class="text-sm">Cargando equipos desde la base de datos...</p>
            </td>
        </tr>
    `;

    // Realizar petición GET al backend
    fetch(`${API_BASE_URL}/equipos/`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }
            return respuesta.json();
        })
        .then(data => {
            // Extraer el array de equipos, soportando tanto array directo como objeto paginado
            const equipos = Array.isArray(data) ? data : (data.items || []);

            if (!Array.isArray(equipos)) {
                throw new Error("La respuesta del servidor no es un array válido");
            }

            // Limpiar tabla
            tablaBody.innerHTML = "";

            if (equipos.length === 0) {
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-12">
                            <p class="text-slate-400 text-sm">
                                <i class="fas fa-inbox text-2xl block mb-2"></i>
                                No hay equipos registrados en la base de datos
                            </p>
                        </td>
                    </tr>
                `;
                return;
            }

            // Renderizar cada equipo
            equipos.forEach(equipo => {
                const fila = crearFilaEquipo(equipo);
                tablaBody.appendChild(fila);
            });

            // Actualizar contador de equipos
            actualizarContadorEquipos(equipos.length);

            console.log(`✅ Cargados ${equipos.length} equipos exitosamente`);
        })
        .catch(error => {
            console.error("❌ Error al cargar equipos:", error);
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-8 py-8">
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p class="text-sm font-bold text-red-600">
                                <i class="fas fa-exclamation-circle mr-2"></i>Error al conectar con el servidor
                            </p>
                            <p class="text-xs text-red-500 mt-2">
                                ${error.message}
                            </p>
                            <p class="text-xs text-red-400 mt-2">
                                Verifica que el backend esté corriendo en ${API_BASE_URL}
                            </p>
                            <button type="button" onclick="cargarInventarioCompleto()" class="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition">
                                <i class="fas fa-redo mr-1"></i>Reintentar
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
}

/**
 * Crea una fila de tabla (<tr>) con los datos de un equipo
 * @param {Object} equipo - Objeto con datos del equipo desde la API
 * @returns {HTMLElement} Elemento <tr> con los datos formateados
 */
function crearFilaEquipo(equipo) {
    const fila = document.createElement("tr");
    fila.className = "hover:bg-slate-50/50 transition cursor-pointer";
    fila.setAttribute("data-equipo-id", equipo.id);
    fila.setAttribute("data-codigo-activo", equipo.codigo_activo);

    // Determinar el badge de estado con colores
    const estadoBadge = obtenerBadgeEstado(equipo.estado);

    // Construir la ubicación (combinar espacio, bloque, piso)
    const ubicacion = construirUbicacion(equipo);

    // Obtener tipo de equipo
    const tipoEquipo = equipo.tipo_equipo
        ? (typeof equipo.tipo_equipo === 'object' ? equipo.tipo_equipo.nombre : equipo.tipo_equipo)
        : "No especificado";

    // Número de serie (con valor por defecto si no existe)
    const numeroSerie = equipo.numero_serie || "N/A";

    // Marca y modelo (intentar extraer información)
    const marcaModelo = equipo.marca
        ? (typeof equipo.marca === 'object' ? equipo.marca.nombre : equipo.marca)
        : "No especificada";

    fila.innerHTML = `
        <td class="px-8 py-5 font-black text-uccDark">
            ${equipo.codigo_activo}
        </td>
        <td class="px-8 py-5 font-bold text-slate-700">
            ${marcaModelo}
        </td>
        <td class="px-8 py-5 font-bold text-slate-600">
            <span class="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold">
                ${tipoEquipo}
            </span>
        </td>
        <td class="px-8 py-5 font-semibold text-slate-600 col-ubicacion">
            <span class="text-xs block">${ubicacion.nombre}</span>
            <span class="text-xs text-slate-400 block">${ubicacion.piso}</span>
        </td>
        <td class="px-8 py-5 text-slate-600 text-xs">
            ${numeroSerie}
        </td>
        <td class="px-8 py-5">
            ${estadoBadge}
        </td>
        <td class="px-8 py-5 text-center">
            <button onclick="openTechnicalSheet(${equipo.id})" class="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition" title="Ver detalles técnicos">
                <i class="fas fa-eye text-[#00acc9]"></i>
                <span class="ml-2">Ver Detalles</span>
            </button>
        </td>
    `;

    return fila;
}

/**
 * Obtiene el badge HTML de estado coloreado según el estado del equipo
 * @param {string} estado - Estado del equipo
 * @returns {string} HTML del badge
 */
function obtenerBadgeEstado(estado) {
    const estadosConfig = {
        "Operativo": {
            clase: "bg-green-100 text-green-700",
            icono: "fas fa-check",
            texto: "Operativo"
        },
        "En Reparación": {
            clase: "bg-amber-100 text-amber-700",
            icono: "fas fa-tools",
            texto: "En Reparación"
        },
        "En reparacion": {
            clase: "bg-amber-100 text-amber-700",
            icono: "fas fa-tools",
            texto: "En Reparación"
        },
        "Inactivo": {
            clase: "bg-slate-100 text-slate-700",
            icono: "fas fa-pause",
            texto: "Inactivo"
        },
        "Dado de baja": {
            clase: "bg-red-100 text-red-700",
            icono: "fas fa-ban",
            texto: "Dado de baja"
        }
    };

    const config = estadosConfig[estado] || {
        clase: "bg-slate-100 text-slate-700",
        icono: "fas fa-question",
        texto: estado || "Desconocido"
    };

    return `
        <span class="inline-flex items-center gap-1 ${config.clase} px-3 py-1 rounded-full text-xs font-bold">
            <i class="${config.icono} w-3"></i> ${config.texto}
        </span>
    `;
}

/**
 * Construye la información de ubicación del equipo
 * @param {Object} equipo - Objeto equipo
 * @returns {Object} Objeto con propiedades nombre y piso
 */
function construirUbicacion(equipo) {
    let ubicacion = "No especificada";
    let piso = "";

    if (equipo.espacio) {
        if (typeof equipo.espacio === 'object') {
            const espacioNombre = equipo.espacio.nombre || "No especificado";
            const bloqueNombre = equipo.espacio.bloque ?
                (typeof equipo.espacio.bloque === 'object' ? equipo.espacio.bloque.nombre_bloque : equipo.espacio.bloque)
                : null;

            ubicacion = bloqueNombre
                ? `${espacioNombre} - ${bloqueNombre}`
                : espacioNombre;
            piso = equipo.espacio.piso ? `Piso ${equipo.espacio.piso}` : "";
        } else {
            ubicacion = equipo.espacio;
        }
    }

    return { nombre: ubicacion, piso };
}

/**
 * Actualiza el contador de equipos mostrados
 * @param {number} total - Total de equipos
 */
function actualizarContadorEquipos(total) {
    const paginacion = document.querySelector("p.text-xs.text-slate-600.font-medium");
    if (paginacion) {
        paginacion.innerHTML = `Mostrando <strong>${total}</strong> de <strong>${total}</strong> equipos`;
    }
}

// ========================================
// FUNCIONES DE MODAL (CREAR ACTIVO)
// ========================================

/**
 * Abre el modal para crear un nuevo activo/equipo
 */
function openCrearActivoModal() {
    const modal = document.getElementById("modal-crear-activo");
    if (modal) {
        modal.classList.remove("hidden");
        console.log("✅ Modal de crear activo abierto");
    }
}

/**
 * Cierra el modal para crear un nuevo activo/equipo
 */
function closeCrearActivoModal() {
    const modal = document.getElementById("modal-crear-activo");
    if (modal) {
        modal.classList.add("hidden");
        // Resetear formulario
        const form = modal.querySelector("form");
        if (form) form.reset();
    }
}

// ========================================
// FUNCIONES DE MODAL (CREAR ESPACIO)
// ========================================

/**
 * Abre el modal para crear un nuevo espacio/aula
 */
function openCrearEspacioModal() {
    const modal = document.getElementById("modal-crear-espacio");
    if (modal) {
        modal.classList.remove("hidden");
        console.log("✅ Modal de crear espacio abierto");
    }
}

/**
 * Cierra el modal para crear un nuevo espacio/aula
 */
function closeCrearEspacioModal() {
    const modal = document.getElementById("modal-crear-espacio");
    if (modal) {
        modal.classList.add("hidden");
        // Resetear formulario
        const form = document.getElementById("formCrearEspacio");
        if (form) form.reset();
    }
}

/**
 * Envía el formulario de crear nuevo espacio al backend
 * @param {Event} event - Evento del submit del formulario
 */
async function submitCrearEspacio(event) {
    event.preventDefault();

    try {
        const codigoEspacio = document.getElementById("inputCodigoEspacio").value;
        const nombre = document.getElementById("inputNombreEspacio").value;
        const piso = parseInt(document.getElementById("inputPisoEspacio").value);
        const bloqueId = document.getElementById("select-bloque-espacio").value;

        // Validación básica
        if (!codigoEspacio || !nombre || piso === "" || !bloqueId) {
            alert("❌ Por favor completa todos los campos del formulario");
            return;
        }

        // Construir payload
        const payload = {
            codigo_espacio: codigoEspacio,
            nombre: nombre,
            piso: piso,
            bloque_id: parseInt(bloqueId),
            tipo_espacio_id: 1  // Valor por defecto
        };

        console.log("🚀 Enviando espacio:", payload);

        // Realizar petición POST
        const response = await fetch(`${API_BASE_URL}/espacios/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const mensajeError = errorData.detail || "Error al crear el espacio";
            
            // Mostrar mensaje de error de forma elegante
            const errorElement = document.getElementById("error-crear-espacio") || document.createElement("div");
            errorElement.id = "error-crear-espacio";
            errorElement.className = "p-4 bg-red-50 border border-red-200 rounded-lg mt-4";
            errorElement.innerHTML = `
                <p class="text-sm font-bold text-red-600">
                    <i class="fas fa-exclamation-circle mr-2"></i>${mensajeError}
                </p>
            `;
            
            const form = document.getElementById("formCrearEspacio");
            if (form && !document.getElementById("error-crear-espacio")) {
                form.appendChild(errorElement);
            }
            
            console.error("❌ Error al crear espacio:", mensajeError);
            return;
        }

        const resultado = await response.json();
        console.log("✅ Espacio creado exitosamente:", resultado);

        alert("✅ Espacio registrado exitosamente en la base de datos");

        // Limpiar mensaje de error si existe
        const errorElement = document.getElementById("error-crear-espacio");
        if (errorElement) {
            errorElement.remove();
        }

        // Cerrar modal
        closeCrearEspacioModal();

        // Recargar selectores para que le nuevo espacio aparezca
        cargarSelectoresFormularios();

    } catch (error) {
        console.error("❌ Error inesperado al crear espacio:", error);
        
        const errorElement = document.getElementById("error-crear-espacio") || document.createElement("div");
        errorElement.id = "error-crear-espacio";
        errorElement.className = "p-4 bg-red-50 border border-red-200 rounded-lg mt-4";
        errorElement.innerHTML = `
            <p class="text-sm font-bold text-red-600">
                <i class="fas fa-exclamation-circle mr-2"></i>Error inesperado: ${error.message}
            </p>
        `;
        
        const form = document.getElementById("formCrearEspacio");
        if (form && !document.getElementById("error-crear-espacio")) {
            form.appendChild(errorElement);
        }
    }
}

// ========================================
// MAPEO DE CAPACIDAD A TONELAJE
// ========================================

const capacidadATonelaje = {
    '12000': 1.00,
    '18000': 1.50,
    '24000': 2.00,
    '30000': 2.50,
    '43000': 3.58,
    '60000': 5.00
};

// ========================================
// FUNCIONES ADICIONALES DE MODAL (EQUIPO)
// ========================================


/**
 * Maneja el envío del formulario de crear equipo DESDE EL EVENT LISTENER
 * Lee directamente de los selectores dinámicos y hace el POST correcto
 * @param {Event} event - Evento del submit del formulario
 */
async function submitCrearActivoFormulario(event) {
    event.preventDefault();

    try {
        // Leer valores de los selectores dinámicos
        const codigoActivo = document.getElementById("inputCodigoActivo").value.trim();
        const marcaId = parseInt(document.getElementById("select-marca").value);
        const espacioId = parseInt(document.getElementById("select-espacio-equipo").value);
        const tipoEquipoId = parseInt(document.getElementById("select-tipo-equipo").value);
        const capacidadBtu = parseInt(document.getElementById("selectCapacidad").value);
        const numeroSerie = document.getElementById("inputNumeroSerie").value.trim();
        const voltaje = document.getElementById("inputVoltaje").value.trim();
        const refrigerante = document.getElementById("selectRefrigerante").value;
        const fechaCompra = document.getElementById("inputFechaCompra").value;
        const fechaInstalacion = document.getElementById("inputFechaInstalacion").value;

        // Validación básica
        if (!codigoActivo || isNaN(marcaId) || isNaN(espacioId) || isNaN(capacidadBtu) || !numeroSerie || !voltaje || !refrigerante) {
            alert("❌ Por favor completa todos los campos del formulario");
            return;
        }

        // Construir payload con los datos correctos
         const payload = {
             codigo_activo: codigoActivo,
             marca_id: marcaId,              // Lectura real desde selector
             espacio_id: espacioId,          // Lectura real desde selector
             tipo_equipo_id: tipoEquipoId,   // Lectura real desde selector
             capacidad_btu: capacidadBtu,
             numero_serie: numeroSerie,
             voltaje: voltaje,
             refrigerante: refrigerante,
             estado: "Operativo",
             tonelaje: capacidadATonelaje[capacidadBtu.toString()] || null,
             fecha_compra: fechaCompra || null,
             fecha_instalacion: fechaInstalacion || null
         };

        console.log("🚀 Enviando equipo con datos válidos:", payload);

        // Realizar petición POST
        const response = await fetch(`${API_BASE_URL}/equipos/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Error al crear el equipo");
        }

        const resultado = await response.json();
        console.log("✅ Equipo creado exitosamente:", resultado);

        alert("✅ Equipo registrado exitosamente en la base de datos");
        
        // Cerrar modal y resetear
        closeCrearActivoModal();
        
        // Recargar tabla
        cargarInventarioCompleto();

    } catch (error) {
        console.error("❌ Error al crear equipo:", error);
        alert(`❌ Error: ${error.message}`);
    }
}

// ========================================
// FUNCIONES DE MODAL (HOJA DE VIDA TÉCNICA)
// ========================================

/**
 * Abre el modal de Hoja de Vida Técnica y carga los datos del equipo
 * @param {number} equipoId - ID del equipo a mostrar
 */
async function openTechnicalSheet(equipoId) {
    const modal = document.getElementById("modal-hoja-vida");
    
    if (!modal) {
        console.error("❌ Modal con id='modal-hoja-vida' no encontrado");
        return;
    }

    try {
        // Guardar ID del equipo actualmente abierto
        window.currentEquipoId = equipoId;
        
        // Mostrar modal con estado de carga
        modal.classList.remove("hidden");
        modal.style.display = 'flex';
        document.body.classList.add('overflow-hidden');
        
        console.log("📋 Cargando datos del equipo ID:", equipoId);
        
        // Realizar petición GET para obtener datos del equipo
        const response = await fetch(`${API_BASE_URL}/equipos/${equipoId}/`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        const equipo = await response.json();
        console.log("✅ Datos del equipo cargados:", equipo);

        // Rellenar campos del modal con los datos obtenidos
        const campos = {
            technicalSheetId: equipo.codigo_activo || "N/A",
            technicalSheetBrand: equipo.marca 
                ? (typeof equipo.marca === 'object' ? equipo.marca.nombre : equipo.marca)
                : "No especificada",
            technicalSheetModel: equipo.modelo || "No especificado",
            technicalSheetType: equipo.tipo 
                ? (typeof equipo.tipo === 'object' ? equipo.tipo.nombre : equipo.tipo)
                : "No especificado",
            technicalSheetBtu: equipo.capacidad_btu 
                ? `${equipo.capacidad_btu.toLocaleString("es-CO")} BTU/h`
                : "No especificada",
            technicalSheetTr: equipo.tonelaje 
                ? `${parseFloat(equipo.tonelaje).toFixed(2)} TR`
                : "No especificado",
            technicalSheetBlock: equipo.espacio && equipo.espacio.codigo_espacio
                ? equipo.espacio.codigo_espacio
                : "No especificado",
            technicalSheetSpace: equipo.espacio && equipo.espacio.nombre
                ? equipo.espacio.nombre
                : "No especificado",
            technicalSheetFloor: equipo.espacio && equipo.espacio.piso
                ? `Piso ${equipo.espacio.piso}`
                : "No especificado",
            technicalSheetInstallDate: equipo.fecha_instalacion
                ? new Date(equipo.fecha_instalacion).toLocaleDateString("es-CO")
                : "No especificada",
            technicalSheetLastService: equipo.ultima_fecha
                ? new Date(equipo.ultima_fecha).toLocaleDateString("es-CO")
                : "No registrada",
            technicalSheetWarranty: "Vigente",
            technicalSheetNextMaintenance: equipo.proxima_fecha
                ? new Date(equipo.proxima_fecha).toLocaleDateString("es-CO")
                : "No programado",
            technicalSheetCountdown: "Información disponible",
            technicalSheetStatusPill: obtenerBadgeEstado(equipo.estado),
            technicalSheetSubtitle: equipo.numero_serie || "Sin serie",
            technicalSheetSerialNumber: equipo.numero_serie || "No especificado",
            technicalSheetVoltage: equipo.voltaje || "No especificado",
            technicalSheetRefrigerant: equipo.refrigerante || "No especificado"
        };

        // Actualizar campos de texto sin reemplazar el HTML
        Object.keys(campos).forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                if (id === "technicalSheetStatusPill") {
                    elemento.innerHTML = campos[id];
                } else {
                    elemento.textContent = campos[id];
                }
            } else {
                console.warn(`⚠️  Campo no encontrado: ${id}`);
            }
        });

        console.log("✅ Modal de Hoja de Vida Técnica rellenado exitosamente");

    } catch (error) {
        console.error("❌ Error al cargar detalles técnicos:", error);
        alert(`Error al cargar los detalles del equipo: ${error.message}`);
    }
}

/**
 * Edita el equipo actualmente abierto
 */
async function editTechnicalSheet() {
    if (!window.currentEquipoId) {
        alert("❌ No hay equipo seleccionado");
        return;
    }
    
    // TODO: Implementar modal de edición
    console.log("📝 Editar equipo ID:", window.currentEquipoId);
    alert("⚠️  Función de edición en desarrollo");
}

/**
 * Cambia el estado del equipo a "Inactivo" (dar de baja)
 */
async function decommissionTechnicalSheet() {
    if (!window.currentEquipoId) {
        alert("❌ No hay equipo seleccionado");
        return;
    }
    
    const confirmar = confirm("⚠️  ¿Deseas desactivar este equipo? Se marcará como Inactivo en el sistema.");
    if (!confirmar) return;
    
    try {
        console.log("🔄 Desactivando equipo ID:", window.currentEquipoId);
        
        const response = await fetch(`${API_BASE_URL}/equipos/${window.currentEquipoId}/estado/Inactivo`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Error al desactivar el equipo");
        }
        
        const resultado = await response.json();
        console.log("✅ Equipo desactivado exitosamente:", resultado);
        
        alert("✅ Equipo desactivado correctamente");
        closeTechnicalSheetModal();
        cargarInventarioCompleto();
        
    } catch (error) {
        console.error("❌ Error al desactivar equipo:", error);
        alert(`Error: ${error.message}`);
    }
}

/**
 * Cierra el modal de Hoja de Vida Técnica
 */
function closeTechnicalSheetModal() {
    const modal = document.getElementById("modal-hoja-vida");
    if (modal) {
        modal.classList.add("hidden");
        modal.style.display = 'none';
        document.body.classList.remove('overflow-hidden');
        window.currentEquipoId = null;
        console.log("✅ Modal de Hoja de Vida Técnica cerrado");
    }
}

/**
 * Se ejecuta cuando el DOM está completamente cargado
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("📋 Inicializando cargador de inventario...");
    cargarSelectoresFormularios();
    cargarInventarioCompleto();

    // Agregar event listener al formulario de crear equipo
    const formCrearActivo = document.getElementById("form-crear-activo");
    if (formCrearActivo) {
        formCrearActivo.addEventListener("submit", submitCrearActivoFormulario);
    }
});

