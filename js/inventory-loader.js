// ========================================
// Cargador Dinámico del Inventario de Equipos
// ========================================

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

let paginaActual = 1;
const registrosPorPagina = 10;
let equiposCargadosGlobal = [];
let modoEdicionEquipo = false;
let equipoEnEdicionId = null;

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
    fetch(`${API_BASE_URL}/espacios/?limit=100`)
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
    fetch(`${API_BASE_URL}/equipos/?limit=100`)
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }
            return respuesta.json();
        })
        .then(data => {
            const equipos = Array.isArray(data) ? data : (data.items || []);

            if (!Array.isArray(equipos)) {
                throw new Error("La respuesta del servidor no es un array válido");
            }

            equiposCargadosGlobal = equipos;
            paginaActual = 1;
            renderizarTablaPaginada();

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
    const tipoEquipo = obtenerNombreTipoEquipo(equipo);

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
 * Extrae el nombre del tipo de equipo desde la respuesta de la API
 * @param {Object} equipo
 * @returns {string}
 */
function obtenerNombreTipoEquipo(equipo) {
    if (equipo.tipo && typeof equipo.tipo === "object" && equipo.tipo.nombre) {
        return equipo.tipo.nombre;
    }
    if (equipo.tipo_equipo && typeof equipo.tipo_equipo === "object" && equipo.tipo_equipo.nombre) {
        return equipo.tipo_equipo.nombre;
    }
    if (typeof equipo.tipo === "string") return equipo.tipo;
    if (typeof equipo.tipo_equipo === "string") return equipo.tipo_equipo;
    return "No especificado";
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
 * Renderiza la tabla principal con paginación local (10 registros por página)
 */
function renderizarTablaPaginada() {
    const tablaBody = document.getElementById("tablaEquiposBody");
    if (!tablaBody) return;

    const total = equiposCargadosGlobal.length;
    const totalPaginas = Math.max(1, Math.ceil(total / registrosPorPagina));

    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const equiposPagina = equiposCargadosGlobal.slice(inicio, fin);

    tablaBody.innerHTML = "";

    if (total === 0) {
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
        actualizarTextoPaginacion(0, 0, 0);
        actualizarBotonesPaginacion(0);
        return;
    }

    equiposPagina.forEach(equipo => {
        tablaBody.appendChild(crearFilaEquipo(equipo));
    });

    actualizarTextoPaginacion(inicio, fin, total);
    actualizarBotonesPaginacion(totalPaginas);
    filtrarTabla();
}

/**
 * Actualiza el texto inferior de paginación
 */
function actualizarTextoPaginacion(inicio, fin, total) {
    const paginacion = document.getElementById("texto-paginacion-equipos")
        || document.querySelector("p.text-xs.text-slate-600.font-medium");

    if (!paginacion) return;

    if (total === 0) {
        paginacion.innerHTML = "No hay equipos para mostrar";
        return;
    }

    paginacion.innerHTML = `Mostrando <strong>${inicio + 1}</strong> a <strong>${Math.min(fin, total)}</strong> de <strong>${total}</strong> resultados`;
}

/**
 * Habilita o deshabilita los botones Anterior / Siguiente
 */
function actualizarBotonesPaginacion(totalPaginas) {
    const btnAnterior = document.getElementById("btn-pagina-anterior");
    const btnSiguiente = document.getElementById("btn-pagina-siguiente");
    const indicador = document.getElementById("indicador-pagina-actual");

    const enPrimera = paginaActual <= 1 || totalPaginas === 0;
    const enUltima = paginaActual >= totalPaginas || totalPaginas === 0;

    if (btnAnterior) btnAnterior.disabled = enPrimera;
    if (btnSiguiente) btnSiguiente.disabled = enUltima;

    if (indicador) {
        indicador.textContent = totalPaginas === 0
            ? "—"
            : `Página ${paginaActual} de ${totalPaginas}`;
    }
}

function irPaginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        renderizarTablaPaginada();
    }
}

function irPaginaSiguiente() {
    const totalPaginas = Math.ceil(equiposCargadosGlobal.length / registrosPorPagina) || 1;
    if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarTablaPaginada();
    }
}

// ========================================
// FUNCIONES DE MODAL (CREAR ACTIVO)
// ========================================

/**
 * Abre el modal para crear un nuevo activo/equipo
 */
function actualizarTituloModalActivo() {
    const titulo = document.getElementById("titulo-modal-activo");
    const textoBtn = document.getElementById("texto-btn-submit-activo");
    if (titulo) {
        titulo.textContent = modoEdicionEquipo ? "Editar Equipo" : "Registrar Nuevo Equipo";
    }
    if (textoBtn) {
        textoBtn.textContent = modoEdicionEquipo ? "Guardar Cambios" : "Registrar Activo";
    }
}

function resetearModoFormularioActivo() {
    modoEdicionEquipo = false;
    equipoEnEdicionId = null;
    actualizarTituloModalActivo();
}

function openCrearActivoModal() {
    const modal = document.getElementById("modal-crear-activo");
    if (modal) {
        if (!modoEdicionEquipo) {
            resetearModoFormularioActivo();
        }
        actualizarTituloModalActivo();
        modal.classList.remove("hidden");
        console.log("✅ Modal de activo abierto");
    }
}

/**
 * Cierra el modal para crear un nuevo activo/equipo
 */
function closeCrearActivoModal() {
    const modal = document.getElementById("modal-crear-activo");
    if (modal) {
        modal.classList.add("hidden");
        const form = modal.querySelector("form");
        if (form) form.reset();
        resetearModoFormularioActivo();
    }
}

/**
 * Pre-llena el formulario de activo con datos de un equipo existente
 * @param {Object} equipo
 * @param {number} intento
 */
function rellenarFormularioEquipo(equipo, intento = 0) {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal("inputCodigoActivo", equipo.codigo_activo ?? "");
    setVal("input-modelo", equipo.modelo ?? "");
    setVal("inputNumeroSerie", equipo.numero_serie ?? "");
    setVal("inputVoltaje", equipo.voltaje ?? "");
    setVal("selectRefrigerante", equipo.refrigerante ?? "");
    setVal("inputFechaInstalacion", equipo.fecha_instalacion ?? "");

    if (equipo.marca_id) setVal("select-marca", equipo.marca_id);
    if (equipo.espacio_id) setVal("select-espacio-equipo", equipo.espacio_id);
    if (equipo.tipo_equipo_id) setVal("select-tipo-equipo", equipo.tipo_equipo_id);
    if (equipo.capacidad_btu) setVal("selectCapacidad", String(equipo.capacidad_btu));

    const selectMarca = document.getElementById("select-marca");
    const pendienteOpciones = selectMarca && selectMarca.options.length <= 1 && intento < 4;
    if (pendienteOpciones) {
        setTimeout(() => rellenarFormularioEquipo(equipo, intento + 1), 250);
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

        if (!codigoEspacio || !nombre || piso === "" || !bloqueId) {
            mostrarNotificacion("error", "Por favor completa todos los campos del formulario");
            return;
        }

        const payload = {
            codigo_espacio: codigoEspacio,
            nombre: nombre,
            piso: piso,
            bloque_id: parseInt(bloqueId),
            tipo_espacio_id: 1
        };

        console.log("🚀 Enviando espacio:", payload);

        const response = await fetch(`${API_BASE_URL}/espacios/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(extraerMensajeError(errorData));
        }

        const resultado = await response.json();
        console.log("✅ Espacio creado exitosamente:", resultado);

        mostrarNotificacion("exito", "Espacio creado correctamente");
        closeCrearEspacioModal();
        cargarSelectoresFormularios();

    } catch (error) {
        console.error("❌ Error al crear espacio:", error);
        mostrarNotificacion("error", error.message);
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
        const codigoActivoInput = document.getElementById("inputCodigoActivo").value.trim();
        const marcaId = parseInt(document.getElementById("select-marca").value);
        const espacioId = parseInt(document.getElementById("select-espacio-equipo").value);
        const tipoEquipoId = parseInt(document.getElementById("select-tipo-equipo").value);
        const capacidadBtu = parseInt(document.getElementById("selectCapacidad").value);
        const numeroSerie = document.getElementById("inputNumeroSerie").value.trim();
        const modeloValue = document.getElementById("input-modelo").value.trim();
        const voltajeInput = document.getElementById("inputVoltaje").value.trim();
        const voltaje = parseInt(voltajeInput, 10);
        const refrigerante = document.getElementById("selectRefrigerante").value;
        const fechaCompra = document.getElementById("inputFechaCompra").value;
        const fechaInstalacion = document.getElementById("inputFechaInstalacion").value;

        // Validación básica
        if (!codigoActivoInput || isNaN(marcaId) || isNaN(espacioId) || isNaN(capacidadBtu) || !numeroSerie || !modeloValue || isNaN(voltaje) || !refrigerante) {
            mostrarNotificacion("error", "Por favor completa todos los campos del formulario");
            return;
        }

        const payload = {
             codigo_activo: String(codigoActivoInput),
             marca_id: marcaId,              // Lectura real desde selector
             espacio_id: espacioId,          // Lectura real desde selector
             tipo_equipo_id: tipoEquipoId,   // Lectura real desde selector
             capacidad_btu: capacidadBtu,
             modelo: modeloValue,
             numero_serie: numeroSerie,
             voltaje: voltaje,
             refrigerante: refrigerante,
             estado: "Operativo",
             tonelaje: capacidadATonelaje[capacidadBtu.toString()] || null,
             fecha_compra: fechaCompra || null,
             fecha_instalacion: fechaInstalacion || null
         };

        const esEdicion = modoEdicionEquipo && equipoEnEdicionId;
        const url = esEdicion
            ? `${API_BASE_URL}/equipos/${equipoEnEdicionId}/`
            : `${API_BASE_URL}/equipos/`;
        const method = esEdicion ? "PUT" : "POST";

        const bodyPayload = esEdicion
            ? {
                codigo_activo: String(codigoActivoInput),
                modelo: modeloValue,
                capacidad_btu: capacidadBtu,
                tonelaje: capacidadATonelaje[capacidadBtu.toString()] || null,
                numero_serie: numeroSerie,
                voltaje: voltaje,
                refrigerante: refrigerante,
                marca_id: marcaId,
                tipo_equipo_id: tipoEquipoId,
                espacio_id: espacioId,
                fecha_instalacion: fechaInstalacion || null
            }
            : payload;

        console.log(`🚀 Enviando equipo (${method}):`, bodyPayload);

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const mensaje = extraerMensajeError(errorData) || "Error en el formulario";
            mostrarNotificacion("error", mensaje);
            return;
        }

        await response.json();

        mostrarNotificacion(
            "exito",
            esEdicion ? "Equipo actualizado correctamente" : "Equipo registrado exitosamente en la base de datos"
        );
        closeCrearActivoModal();
        cargarInventarioCompleto();

    } catch (error) {
        console.error("❌ Error al crear equipo:", error);
        mostrarNotificacion("error", error.message || "Error inesperado al crear el equipo");
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
        
        // Guardar código de activo para la función de activación
        window.currentEquipoCodigoActivo = equipo.codigo_activo;

        // Rellenar campos del modal con los datos obtenidos
        const campos = {
            technicalSheetId: equipo.codigo_activo || "N/A",
            technicalSheetBrand: equipo.marca 
                ? (typeof equipo.marca === 'object' ? equipo.marca.nombre : equipo.marca)
                : "No especificada",
            technicalSheetModel: equipo.modelo || "No especificado",
            technicalSheetType: obtenerNombreTipoEquipo(equipo),
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
        
        // Control dinámico de botones
        const btnActivar = document.getElementById("btn-activar-equipo");
        const btnDarBaja = document.querySelector("#modal-hoja-vida button[onclick='decommissionTechnicalSheet()']");
        
        if (btnActivar && btnDarBaja) {
            const estado = equipo.estado;
            if (estado === "Inactivo" || estado === "inactivo" || estado === "Dado de baja" || estado === "dado de baja") {
                // Equipo inactivo/dado de baja: mostrar activar, ocultar dar de baja
                btnActivar.classList.remove("hidden");
                btnDarBaja.classList.add("hidden");
            } else {
                // Equipo activo: mostrar dar de baja, ocultar activar
                btnActivar.classList.add("hidden");
                btnDarBaja.classList.remove("hidden");
            }
        }

        await cargarHistorialIntervenciones(equipoId);

        console.log("✅ Modal de Hoja de Vida Técnica rellenado exitosamente");

    } catch (error) {
        console.error("❌ Error al cargar detalles técnicos:", error);
        mostrarNotificacion("error", `Error al cargar los detalles del equipo: ${error.message}`);
        cargarHistorialIntervenciones(equipoId, true);
    }
}

/**
 * Carga el historial de mantenimientos en la tabla de la hoja de vida
 * @param {number} equipoId
 * @param {boolean} forzarVacio - Si true, muestra mensaje vacío sin fetch
 */
async function cargarHistorialIntervenciones(equipoId, forzarVacio = false) {
    const tbody = document.getElementById("technicalSheetHistory");
    if (!tbody) return;

    const filaVacia = `
        <tr>
            <td colspan="4" class="px-6 py-8 text-center text-slate-500 italic">
                No hay intervenciones registradas aún para este equipo.
            </td>
        </tr>
    `;

    if (forzarVacio) {
        tbody.innerHTML = filaVacia;
        return;
    }

    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="px-6 py-6 text-center text-slate-400 text-sm">
                <i class="fas fa-spinner fa-spin mr-2"></i>Cargando historial...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/equipos/${equipoId}/mantenimientos`);

        if (!response.ok) {
            tbody.innerHTML = filaVacia;
            return;
        }

        const data = await response.json();
        const intervenciones = Array.isArray(data) ? data : (data.items || []);

        if (!intervenciones.length) {
            tbody.innerHTML = filaVacia;
            return;
        }

        tbody.innerHTML = "";
        intervenciones.forEach(item => {
            const fila = document.createElement("tr");
            const fecha = item.fecha_mantenimiento
                ? new Date(item.fecha_mantenimiento + "T00:00:00").toLocaleDateString("es-CO")
                : "—";
            fila.innerHTML = `
                <td class="px-6 py-3 text-slate-700 font-medium">${fecha}</td>
                <td class="px-6 py-3 text-slate-600">${item.tecnico_nombre || "—"}</td>
                <td class="px-6 py-3">
                    <span class="bg-cyan-50 text-uccLight px-2 py-1 rounded-md text-xs font-bold">${item.tipo_nombre || "—"}</span>
                </td>
                <td class="px-6 py-3 text-slate-600 text-sm">${item.detalle_mantenimiento || "Sin observaciones"}</td>
            `;
            tbody.appendChild(fila);
        });
    } catch {
        tbody.innerHTML = filaVacia;
    }
}

/**
 * Edita el equipo actualmente abierto
 */
async function editTechnicalSheet() {
    if (!window.currentEquipoId) {
        mostrarNotificacion("error", "No hay equipo seleccionado");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/equipos/${window.currentEquipoId}/`);
        if (!response.ok) {
            throw new Error("No se pudo cargar el equipo para editar");
        }

        const equipo = await response.json();
        closeTechnicalSheetModal();

        modoEdicionEquipo = true;
        equipoEnEdicionId = equipo.id;
        window.currentEquipoId = equipo.id;

        cargarSelectoresFormularios();
        openCrearActivoModal();
        rellenarFormularioEquipo(equipo);
    } catch (error) {
        console.error("❌ Error al abrir edición:", error);
        mostrarNotificacion("error", error.message);
    }
}

/**
 * Cambia el estado del equipo a "Inactivo" (dar de baja)
 */
async function decommissionTechnicalSheet() {
    if (!window.currentEquipoId) {
        mostrarNotificacion("error", "No hay equipo seleccionado");
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
        
        mostrarNotificacion("exito", "Equipo desactivado correctamente");
        closeTechnicalSheetModal();
        cargarInventarioCompleto();

    } catch (error) {
        console.error("❌ Error al desactivar equipo:", error);
        mostrarNotificacion("error", error.message);
    }
}

/**
 * Activa el equipo cambiando su estado a "Operativo"
 */
async function activateTechnicalSheet() {
    if (!window.currentEquipoId) {
        mostrarNotificacion("error", "No hay equipo seleccionado");
        return;
    }
    
    const confirmar = confirm("⚠️  ¿Deseas activar este equipo? Se marcará como Operativo en el sistema.");
    if (!confirmar) return;
    
    try {
        console.log("🔄 Activando equipo ID:", window.currentEquipoId);
        
        const response = await fetch(`${API_BASE_URL}/equipos/${window.currentEquipoId}/estado/Operativo`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Error al activar el equipo");
        }
        
        const resultado = await response.json();
        console.log("✅ Equipo activado exitosamente:", resultado);
        
        mostrarNotificacion("exito", "Equipo activado correctamente");
        closeTechnicalSheetModal();
        cargarInventarioCompleto();

    } catch (error) {
        console.error("❌ Error al activar equipo:", error);
        mostrarNotificacion("error", error.message);
    }
}

/**
 * Función de filtrado de tabla en tiempo real
 */
function filtrarTabla() {
    const inputBusqueda = document.getElementById("input-busqueda");
    const selectEstado = document.getElementById("assetStateFilter");
    const selectBloque = document.getElementById("assetBlockFilter");
    const tablaBody = document.getElementById("tablaEquiposBody");
    const filas = tablaBody.querySelectorAll("tr");
    
    const terminoBusqueda = inputBusqueda.value.toLowerCase().trim();
    const valorEstado = selectEstado.value;
    const valorBloque = selectBloque.value;

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        if (celdas.length > 0) {
            const codigoActivo = celdas[0].textContent.toLowerCase();
            const ubicacion = celdas[3].textContent.toLowerCase();
            const estado = celdas[5].textContent.trim();

            // Verificar cada condición
            const coincideTexto = terminoBusqueda === "" || 
                codigoActivo.includes(terminoBusqueda) || 
                ubicacion.includes(terminoBusqueda);
            
            const coincideEstado = valorEstado === "Todos" || 
                estado.includes(valorEstado);
            
            const coincideBloque = valorBloque === "Todos" || 
                ubicacion.includes(valorBloque.toLowerCase());

            // Todas las condiciones deben cumplirse (AND lógico)
            if (coincideTexto && coincideEstado && coincideBloque) {
                fila.style.display = "";
            } else {
                fila.style.display = "none";
            }
        }
    });
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
        window.currentEquipoCodigoActivo = null;
        console.log("✅ Modal de Hoja de Vida Técnica cerrado");
    }
}

// ========================================
// NOTIFICACIONES Y UTILIDADES API
// ========================================

/**
 * Muestra una notificación toast al administrador
 * @param {'exito'|'error'} tipo - Tipo de notificación
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacion(tipo, mensaje) {
    let container = document.getElementById("notificaciones-toast");
    if (!container) {
        container = document.createElement("div");
        container.id = "notificaciones-toast";
        container.className = "fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const esExito = tipo === "exito";
    toast.className = `px-5 py-4 rounded-xl shadow-2xl border text-sm font-semibold flex items-start gap-3 animate-pulse ${
        esExito
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-red-50 border-red-200 text-red-800"
    }`;
    toast.innerHTML = `
        <i class="fas ${esExito ? "fa-check-circle" : "fa-exclamation-circle"} mt-0.5"></i>
        <span>${mensaje}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("opacity-0", "transition-opacity", "duration-500");
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/**
 * Extrae el mensaje de error de una respuesta FastAPI
 * @param {object} errorData - JSON de error
 * @returns {string}
 */
function extraerMensajeError(errorData) {
    if (!errorData || !errorData.detail) return "Error en la operación";
    if (typeof errorData.detail === "string") return errorData.detail;
    if (Array.isArray(errorData.detail)) {
        return errorData.detail.map(e => e.msg || JSON.stringify(e)).join(". ");
    }
    return JSON.stringify(errorData.detail);
}

// ========================================
// GESTIÓN DE MARCAS (CRUD)
// ========================================

const CLASE_FILA_GESTION = "bg-slate-50 rounded-xl px-4 py-2.5 mb-2 flex justify-between items-center text-sm hover:bg-slate-100/90 transition-colors duration-200";
const CLASE_BTN_EDITAR_GESTION = "p-2 rounded-lg text-slate-400 hover:text-uccLight transition-colors";
const CLASE_BTN_ELIMINAR_GESTION = "p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors";
const CLASE_INPUT_INLINE_GESTION = "flex-1 border border-slate-200 hover:border-slate-300 focus:border-uccLight focus:ring-2 focus:ring-cyan-100 transition-all rounded-xl px-4 py-2.5 text-slate-800 bg-white text-sm font-medium";

function openGestionMarcasModal() {
    const modal = document.getElementById("modal-gestion-marcas");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    renderizarListaMarcas();
}

function closeGestionMarcasModal() {
    const modal = document.getElementById("modal-gestion-marcas");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    const input = document.getElementById("input-nueva-marca");
    if (input) input.value = "";
}

async function renderizarListaMarcas() {
    const lista = document.getElementById("lista-marcas-gestion");
    if (!lista) return;

    lista.innerHTML = '<p class="text-xs text-slate-400 text-center py-6"><i class="fas fa-spinner fa-spin mr-1"></i> Cargando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/marcas/?limit=500`);
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));
        const marcas = await response.json();

        if (!marcas.length) {
            lista.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">No hay marcas registradas</p>';
            return;
        }

        lista.innerHTML = "";
        marcas.forEach(marca => {
            const fila = document.createElement("div");
            fila.id = `marca-row-${marca.id}`;
            fila.className = CLASE_FILA_GESTION;
            fila.innerHTML = `
                <span class="font-semibold text-slate-800 truncate marca-nombre-display flex-1 min-w-0 pr-2">${marca.nombre}</span>
                <div class="flex items-center gap-0.5 shrink-0">
                    <button type="button" onclick="activarEdicionMarca(${marca.id})" class="${CLASE_BTN_EDITAR_GESTION}" title="Editar">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button type="button" onclick="eliminarMarca(${marca.id})" class="${CLASE_BTN_ELIMINAR_GESTION}" title="Eliminar">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `;
            lista.appendChild(fila);
        });
    } catch (error) {
        lista.innerHTML = `<p class="text-xs text-red-500 text-center py-6">${error.message}</p>`;
        mostrarNotificacion("error", error.message);
    }
}

async function submitCrearMarca() {
    const input = document.getElementById("input-nueva-marca");
    const nombre = input?.value.trim();
    if (!nombre) {
        mostrarNotificacion("error", "Ingresa el nombre de la marca");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/marcas/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
        });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        input.value = "";
        mostrarNotificacion("exito", `Marca "${nombre}" registrada correctamente`);
        await renderizarListaMarcas();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
    }
}

function activarEdicionMarca(id) {
    const fila = document.getElementById(`marca-row-${id}`);
    if (!fila) return;

    const nombreActual = fila.querySelector(".marca-nombre-display")?.textContent?.trim() || "";

    fila.className = `${CLASE_FILA_GESTION} bg-white ring-2 ring-cyan-100 border border-uccLight/30`;
    fila.innerHTML = `
        <input type="text" id="edit-marca-${id}" value="${nombreActual.replace(/"/g, "&quot;")}" maxlength="20"
            class="${CLASE_INPUT_INLINE_GESTION}">
        <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="guardarEdicionMarca(${id})" class="p-2.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors duration-200" title="Guardar">
                <i class="fas fa-check"></i>
            </button>
            <button type="button" onclick="renderizarListaMarcas()" class="p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors duration-200" title="Cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.getElementById(`edit-marca-${id}`)?.focus();
}

async function guardarEdicionMarca(id) {
    const input = document.getElementById(`edit-marca-${id}`);
    const nombre = input?.value.trim();
    if (!nombre) {
        mostrarNotificacion("error", "El nombre no puede estar vacío");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/marcas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
        });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        mostrarNotificacion("exito", "Marca actualizada correctamente");
        await renderizarListaMarcas();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
    }
}

async function eliminarMarca(id) {
    if (!confirm("¿Eliminar esta marca del catálogo?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/marcas/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        mostrarNotificacion("exito", "Marca eliminada correctamente");
        await renderizarListaMarcas();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
    }
}

// ========================================
// GESTIÓN DE ESPACIOS (CRUD)
// ========================================

async function cargarBloquesGestionEspacios() {
    const select = document.getElementById("select-gestion-espacio-bloque");
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE_URL}/bloques/?limit=100`);
        if (!response.ok) return;
        const data = await response.json();
        const bloques = Array.isArray(data) ? data : (data.items || []);
        select.innerHTML = '<option value="">Selecciona bloque</option>';
        bloques.forEach(bloque => {
            const option = document.createElement("option");
            option.value = bloque.id;
            option.textContent = bloque.nombre_bloque || bloque.codigo_bloque;
            select.appendChild(option);
        });
        if (bloques.length > 0) select.value = bloques[0].id;
    } catch (err) {
        console.error("Error al cargar bloques para gestión:", err);
    }
}

function openGestionEspaciosModal() {
    const modal = document.getElementById("modal-gestion-espacios");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    cargarBloquesGestionEspacios();
    renderizarListaEspacios();
}

function closeGestionEspaciosModal() {
    const modal = document.getElementById("modal-gestion-espacios");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    const inputCodigo = document.getElementById("input-nuevo-espacio-codigo");
    const inputNombre = document.getElementById("input-nuevo-espacio-nombre");
    if (inputCodigo) inputCodigo.value = "";
    if (inputNombre) inputNombre.value = "";
}

async function renderizarListaEspacios() {
    const lista = document.getElementById("lista-espacios-gestion");
    if (!lista) return;

    lista.innerHTML = '<p class="text-xs text-slate-400 text-center py-6"><i class="fas fa-spinner fa-spin mr-1"></i> Cargando...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/espacios/?limit=100`);
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));
        const data = await response.json();
        const espacios = Array.isArray(data) ? data : (data.items || []);

        if (!espacios.length) {
            lista.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">No hay espacios registrados</p>';
            return;
        }

        lista.innerHTML = "";
        espacios.forEach(espacio => {
            const pisoLabel = espacio.piso != null ? ` · Piso ${espacio.piso}` : "";
            const fila = document.createElement("div");
            fila.id = `espacio-row-${espacio.id}`;
            fila.className = CLASE_FILA_GESTION;
            fila.innerHTML = `
                <div class="min-w-0 flex-1 pr-2">
                    <span class="espacio-codigo-display text-uccLight font-bold text-xs uppercase tracking-wide">${espacio.codigo_espacio}</span>
                    <span class="text-slate-400 text-xs">${pisoLabel}</span>
                    <p class="espacio-nombre-display font-semibold text-slate-800 truncate">${espacio.nombre}</p>
                </div>
                <div class="flex items-center gap-0.5 shrink-0">
                    <button type="button" onclick="activarEdicionEspacio(${espacio.id})" class="${CLASE_BTN_EDITAR_GESTION}" title="Editar">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button type="button" onclick="eliminarEspacio(${espacio.id})" class="${CLASE_BTN_ELIMINAR_GESTION}" title="Eliminar">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `;
            lista.appendChild(fila);
        });
    } catch (error) {
        lista.innerHTML = `<p class="text-xs text-red-500 text-center py-6">${error.message}</p>`;
        mostrarNotificacion("error", error.message);
    }
}

async function submitCrearEspacioGestion() {
    const codigo = document.getElementById("input-nuevo-espacio-codigo")?.value.trim();
    const nombre = document.getElementById("input-nuevo-espacio-nombre")?.value.trim();
    const piso = parseInt(document.getElementById("input-nuevo-espacio-piso")?.value, 10) || 1;
    const bloqueId = parseInt(document.getElementById("select-gestion-espacio-bloque")?.value, 10);

    if (!codigo || !nombre || isNaN(bloqueId)) {
        mostrarNotificacion("error", "Completa código, nombre y bloque del espacio");
        return;
    }

    const payload = {
        codigo_espacio: codigo,
        nombre,
        piso,
        bloque_id: bloqueId,
        tipo_espacio_id: 1
    };

    try {
        const response = await fetch(`${API_BASE_URL}/espacios/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        document.getElementById("input-nuevo-espacio-codigo").value = "";
        document.getElementById("input-nuevo-espacio-nombre").value = "";
        mostrarNotificacion("exito", `Espacio "${nombre}" registrado correctamente`);
        await renderizarListaEspacios();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
    }
}

function activarEdicionEspacio(id) {
    const fila = document.getElementById(`espacio-row-${id}`);
    if (!fila) return;

    const codigoActual = fila.querySelector(".espacio-codigo-display")?.textContent?.trim() || "";
    const nombreActual = fila.querySelector(".espacio-nombre-display")?.textContent?.trim() || "";

    fila.className = `${CLASE_FILA_GESTION} flex-col sm:flex-row sm:items-center bg-white ring-2 ring-cyan-100 border border-uccLight/30 gap-3`;
    fila.innerHTML = `
        <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            <input type="text" id="edit-espacio-codigo-${id}" value="${codigoActual.replace(/"/g, "&quot;")}" maxlength="20"
                placeholder="Código" class="${CLASE_INPUT_INLINE_GESTION} text-xs font-bold">
            <input type="text" id="edit-espacio-nombre-${id}" value="${nombreActual.replace(/"/g, "&quot;")}" maxlength="65"
                placeholder="Nombre" class="${CLASE_INPUT_INLINE_GESTION}">
        </div>
        <div class="flex items-center gap-1 shrink-0 self-end sm:self-center">
            <button type="button" onclick="guardarEdicionEspacio(${id})" class="p-2.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors duration-200" title="Guardar">
                <i class="fas fa-check"></i>
            </button>
            <button type="button" onclick="renderizarListaEspacios()" class="p-2.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors duration-200" title="Cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

async function guardarEdicionEspacio(id) {
    const codigo = document.getElementById(`edit-espacio-codigo-${id}`)?.value.trim();
    const nombre = document.getElementById(`edit-espacio-nombre-${id}`)?.value.trim();

    if (!codigo || !nombre) {
        mostrarNotificacion("error", "Código y nombre son obligatorios");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/espacios/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo_espacio: codigo, nombre })
        });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        mostrarNotificacion("exito", "Espacio actualizado correctamente");
        await renderizarListaEspacios();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
    }
}

async function eliminarEspacio(id) {
    if (!confirm("¿Eliminar este espacio del catálogo?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/espacios/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(extraerMensajeError(await response.json()));

        mostrarNotificacion("exito", "Espacio eliminado correctamente");
        await renderizarListaEspacios();
        cargarSelectoresFormularios();
    } catch (error) {
        mostrarNotificacion("error", error.message);
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

    // Agregar event listener al buscador principal
    const inputBusqueda = document.getElementById("input-busqueda");
    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", filtrarTabla);
    }

    // Agregar event listeners a los selectores de estado y bloque
    const selectEstado = document.getElementById("assetStateFilter");
    if (selectEstado) {
        selectEstado.addEventListener("change", filtrarTabla);
    }

    const selectBloque = document.getElementById("assetBlockFilter");
    if (selectBloque) {
        selectBloque.addEventListener("change", filtrarTabla);
    }
});

