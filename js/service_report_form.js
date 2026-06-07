/**
 * AiresFlow — service_report_form.js
 * Formulario técnico: materiales, POST mantenimientos y cierre de programación.
 */

let equiposMaestros = [];
let equipoSeleccionadoId = null;
let usuarioActualId = null;

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function extraerMensajeError(error) {
    return error?.message || String(error) || 'Error desconocido';
}

function mostrarToast(tipo, mensaje) {
    let contenedor = document.getElementById('toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toast-container';
        contenedor.className = 'fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none';
        document.body.appendChild(contenedor);
    }

    const esExito = tipo === 'exito';
    const clases = esExito
        ? 'bg-uccLight text-slate-900 border border-cyan-300/50'
        : 'bg-red-500 text-white border border-red-400/40';
    const icono = esExito ? 'fa-circle-check' : 'fa-circle-exclamation';

    const toast = document.createElement('div');
    toast.className = `${clases} pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold max-w-sm`;
    toast.innerHTML = `<i class="fas ${icono}"></i><span>${escaparHtml(mensaje)}</span>`;
    contenedor.appendChild(toast);
    setTimeout(() => toast.remove(), 4200);
}

function nombreUbicacionEquipo(equipo) {
    const espacio = equipo.espacio || equipo.espacio_fisico;
    if (!espacio) return 'Ubicación no disponible';
    const piso = espacio.piso != null ? ` · Piso ${espacio.piso}` : '';
    return `${espacio.nombre || 'Espacio'}${piso}`;
}

async function resolverUsuarioActualId() {
    const email = localStorage.getItem('userEmail');
    if (!email) return null;

    try {
        const respuesta = await API.get('/usuarios/?limit=100');
        const lista = respuesta?.items || respuesta || [];
        const usuario = lista.find((u) => u.correo_institucional === email);
        if (usuario?.id) {
            localStorage.setItem('userId', String(usuario.id));
            return usuario.id;
        }
    } catch (error) {
        console.error('No se pudo resolver el ID del técnico:', error);
    }
    return Number(localStorage.getItem('userId')) || null;
}

async function cargarEquiposParaModal() {
    try {
        const respuesta = await API.get('/equipos/?limit=100');
        equiposMaestros = respuesta?.items || respuesta || [];
    } catch (error) {
        console.error('Error cargando equipos:', error);
        equiposMaestros = [];
    }
}

function cargarSelectorEspacios() {
    const selectEspacio = document.getElementById('select-espacio');
    if (!selectEspacio) return;

    API.get('/espacios/')
        .then((espacios) => {
            const lista = Array.isArray(espacios) ? espacios : [];
            selectEspacio.innerHTML = '<option value="" disabled selected>Seleccione espacio...</option>';

            lista.forEach((espacio) => {
                const opcion = document.createElement('option');
                opcion.value = espacio.id;
                let etiqueta = espacio.nombre || '';
                if (espacio.bloque) etiqueta += ` - ${espacio.bloque}`;
                if (espacio.piso) etiqueta += ` (Piso ${espacio.piso})`;
                opcion.textContent = etiqueta;
                selectEspacio.appendChild(opcion);
            });
        })
        .catch(() => {
            selectEspacio.innerHTML = '<option value="" disabled selected>Error al cargar espacios</option>';
        });
}

function crearElementoComponente(comp) {
    const divComponente = document.createElement('div');
    divComponente.className = 'p-4 bg-white border border-slate-200 rounded-lg hover:border-uccLight/50 transition componente-item';

    const checkboxId = `checkbox_${comp.id}`;
    const cantidadId = `cant_${comp.id}`;
    const precioId = `precio_${comp.id}`;
    const detallesId = `detalles_${comp.id}`;

    divComponente.innerHTML = `
        <div class="flex items-start gap-3 mb-0">
            <input type="checkbox" id="${checkboxId}"
                class="checkbox-componente w-5 h-5 rounded border-slate-300 text-uccLight cursor-pointer focus:ring-2 focus:ring-uccLight mt-0.5"
                data-componente-id="${comp.id}" data-detalles-id="${detallesId}">
            <label for="${checkboxId}" class="flex-1 text-sm font-bold text-slate-700 cursor-pointer">
                ${escaparHtml(comp.nombre)}
            </label>
        </div>
        <div id="${detallesId}" class="mt-4 pt-4 border-t border-slate-100 space-y-3 hidden">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label for="${cantidadId}" class="block text-xs font-bold uppercase text-slate-600 mb-1">Cantidad</label>
                    <input type="number" id="${cantidadId}" class="input-cantidad w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-uccLight focus:outline-none" placeholder="Ej: 2" step="0.1" min="0">
                </div>
                <div>
                    <label for="${precioId}" class="block text-xs font-bold uppercase text-slate-600 mb-1">Valor unitario ($)</label>
                    <input type="number" id="${precioId}" class="input-precio w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-uccLight focus:outline-none" placeholder="Ej: 15000" step="100" min="0">
                </div>
            </div>
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p class="text-xs text-slate-600">
                    <span class="font-bold">Subtotal: $</span>
                    <span class="subtotal-componente text-sm font-black text-uccLight">0</span>
                </p>
            </div>
        </div>`;

    return divComponente;
}

function actualizarSubtotalComponente(detallesId) {
    const detallesDiv = document.getElementById(detallesId);
    if (!detallesDiv) return;

    const cantidad = parseFloat(detallesDiv.querySelector('.input-cantidad')?.value || 0);
    const precio = parseFloat(detallesDiv.querySelector('.input-precio')?.value || 0);
    const subtotalSpan = detallesDiv.querySelector('.subtotal-componente');
    if (subtotalSpan) {
        subtotalSpan.textContent = (cantidad * precio).toLocaleString('es-CO');
    }
    actualizarTotalMateriales();
}

function actualizarTotalMateriales() {
    let total = 0;
    document.querySelectorAll('.checkbox-componente:checked').forEach((checkbox) => {
        const detallesId = checkbox.getAttribute('data-detalles-id');
        const detallesDiv = document.getElementById(detallesId);
        if (!detallesDiv) return;
        const cantidad = parseFloat(detallesDiv.querySelector('.input-cantidad')?.value || 0);
        const precio = parseFloat(detallesDiv.querySelector('.input-precio')?.value || 0);
        total += cantidad * precio;
    });

    const totalEl = document.getElementById('total-materiales');
    if (totalEl) totalEl.textContent = total.toLocaleString('es-CO');
    return total;
}

function configurarEventListenersComponentes() {
    document.querySelectorAll('.checkbox-componente').forEach((checkbox) => {
        const detallesId = checkbox.getAttribute('data-detalles-id');
        const componenteId = checkbox.getAttribute('data-componente-id');
        const detallesDiv = document.getElementById(detallesId);
        const cantidadInput = document.getElementById(`cant_${componenteId}`);
        const precioInput = document.getElementById(`precio_${componenteId}`);

        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                detallesDiv.classList.remove('hidden');
            } else {
                detallesDiv.classList.add('hidden');
                if (cantidadInput) cantidadInput.value = '';
                if (precioInput) precioInput.value = '';
                const subtotalSpan = detallesDiv.querySelector('.subtotal-componente');
                if (subtotalSpan) subtotalSpan.textContent = '0';
            }
            actualizarTotalMateriales();
        });

        [cantidadInput, precioInput].forEach((input) => {
            input?.addEventListener('input', () => actualizarSubtotalComponente(detallesId));
        });
    });
}

function cargarCheckboxesComponentes() {
    const contenedor = document.getElementById('contenedor-componentes');
    if (!contenedor) return;

    API.get('/tipo_componentes/')
        .then((componentes) => {
            const lista = Array.isArray(componentes) ? componentes : [];
            contenedor.innerHTML = '';

            if (!lista.length) {
                contenedor.innerHTML = '<p class="text-center text-slate-400 py-4 text-sm">No hay componentes disponibles.</p>';
                return;
            }

            lista.forEach((comp) => contenedor.appendChild(crearElementoComponente(comp)));
            configurarEventListenersComponentes();
            actualizarTotalMateriales();
        })
        .catch((error) => {
            contenedor.innerHTML = `<p class="text-red-600 text-sm p-4">${escaparHtml(extraerMensajeError(error))}</p>`;
        });
}

function openBuscarActivoModal() {
    document.getElementById('modal-buscar-activo')?.classList.remove('hidden');
    renderizarActivosList(equiposMaestros);
}

function closeBuscarActivoModal() {
    document.getElementById('modal-buscar-activo')?.classList.add('hidden');
}

function renderizarActivosList(lista) {
    const contenedor = document.getElementById('listaActivos');
    if (!contenedor) return;

    if (!lista.length) {
        contenedor.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No se encontraron activos.</p>';
        return;
    }

    contenedor.innerHTML = lista.map((activo) => {
        const codigo = escaparHtml(activo.codigo_activo || `EQ-${activo.id}`);
        const ubicacion = escaparHtml(nombreUbicacionEquipo(activo));
        return `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-uccLight transition">
                <div>
                    <p class="text-sm font-black text-uccDark">${codigo}</p>
                    <p class="text-xs text-slate-500 mt-0.5 font-medium"><i class="fas fa-map-marker-alt text-uccLight mr-1"></i>${ubicacion}</p>
                </div>
                <button type="button" data-equipo-id="${activo.id}" class="btn-seleccionar-equipo bg-uccLight hover:bg-opacity-90 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition">
                    Seleccionar
                </button>
            </div>`;
    }).join('');

    contenedor.querySelectorAll('.btn-seleccionar-equipo').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = Number(btn.getAttribute('data-equipo-id'));
            const equipo = equiposMaestros.find((e) => e.id === id);
            if (equipo) seleccionarEquipo(equipo);
        });
    });
}

function seleccionarEquipo(equipo) {
    equipoSeleccionadoId = equipo.id;
    document.getElementById('equipoId').value = equipo.id;
    document.getElementById('codigoActivo').value = equipo.codigo_activo || `EQ-${equipo.id}`;
    document.getElementById('ubicacion').value = nombreUbicacionEquipo(equipo);

    const selectEspacio = document.getElementById('select-espacio');
    const espacioId = equipo.espacio_id || equipo.espacio?.id;
    if (selectEspacio && espacioId) selectEspacio.value = String(espacioId);

    closeBuscarActivoModal();
}

function construirDetalleMantenimiento() {
    const descripcion = document.getElementById('descripcionTrabajo')?.value?.trim() || '';
    const problemas = document.getElementById('problemas_encontrados')?.value?.trim() || '';
    const acciones = document.getElementById('acciones_recomendadas')?.value?.trim() || '';
    const estado = document.querySelector('input[name="estado"]:checked')?.value || '';

    return [
        descripcion && `TRABAJO REALIZADO:\n${descripcion}`,
        problemas && `HALLAZGOS TÉCNICOS:\n${problemas}`,
        acciones && `RECOMENDACIONES:\n${acciones}`,
        estado && `ESTADO FINAL DEL EQUIPO: ${estado}`
    ].filter(Boolean).join('\n\n');
}

async function completarProgramacionVinculada(equipoId, mantenimientoId, tipoMantenimientoId) {
    const respuesta = await API.get(`/programaciones/?equipo_id=${equipoId}&estado=Pendiente&size=100`);
    const items = respuesta?.items || [];

    const candidata = items.find((p) => p.tipo_mantenimiento_id === tipoMantenimientoId) || items[0];
    if (!candidata?.id) return;

    await API.put(`/programaciones/${candidata.id}/completar?mantenimiento_id=${mantenimientoId}`);
}

async function guardarReporte(event) {
    event.preventDefault();
    const form = document.getElementById('reporteForm');
    if (!form?.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!equipoSeleccionadoId) {
        mostrarToast('error', 'Seleccione un equipo antes de guardar.');
        return;
    }

    if (!usuarioActualId) {
        mostrarToast('error', 'No se pudo identificar al técnico autenticado.');
        return;
    }

    const costoServicio = actualizarTotalMateriales();
    const tipoId = Number(document.getElementById('tipoMantenimiento')?.value);
    const btnGuardar = form.querySelector('button[type="submit"]');
    const textoOriginal = btnGuardar?.innerHTML;

    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    }

    try {
        const payload = {
            equipo_id: equipoSeleccionadoId,
            encargado_id: usuarioActualId,
            tipo_mantenimiento_id: tipoId,
            registrado_por: usuarioActualId,
            fecha_mantenimiento: document.getElementById('fechaMantenimiento')?.value,
            detalle_mantenimiento: construirDetalleMantenimiento(),
            costo_servicio: costoServicio
        };

        const mantenimiento = await API.post('/mantenimientos/', payload);

        try {
            await completarProgramacionVinculada(equipoSeleccionadoId, mantenimiento.id, tipoId);
        } catch (progError) {
            console.warn('Reporte guardado; no se encontró programación pendiente para cerrar.', progError);
        }

        mostrarToast('exito', 'Reporte guardado y programación actualizada a Completado.');
        form.reset();
        reiniciarFormulario();
    } catch (error) {
        mostrarToast('error', extraerMensajeError(error));
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
        }
    }
}

function reiniciarFormulario() {
    equipoSeleccionadoId = null;
    document.getElementById('equipoId').value = '';

    const nombreUsuario = localStorage.getItem('usuario_nombre') || 'TÉCNICO DE INFRAESTRUCTURA';
    const inputTecnico = document.getElementById('nombreTecnico');
    if (inputTecnico) inputTecnico.value = nombreUsuario.toUpperCase();

    const inputFecha = document.getElementById('fechaMantenimiento');
    if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

    document.querySelectorAll('.checkbox-componente').forEach((checkbox) => {
        checkbox.checked = false;
        const detallesId = checkbox.getAttribute('data-detalles-id');
        const detallesDiv = document.getElementById(detallesId);
        detallesDiv?.classList.add('hidden');
    });

    actualizarTotalMateriales();
    cargarSelectorEspacios();
}

function inicializarFormularioReporte() {
    const nombreUsuario = localStorage.getItem('usuario_nombre') || 'TÉCNICO DE INFRAESTRUCTURA';
    const inputTecnico = document.getElementById('nombreTecnico');
    if (inputTecnico) inputTecnico.value = nombreUsuario.toUpperCase();

    const inputFecha = document.getElementById('fechaMantenimiento');
    if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

    document.getElementById('reporteForm')?.addEventListener('submit', guardarReporte);

    document.getElementById('btn-limpiar-formulario')?.addEventListener('click', () => {
        if (confirm('¿Está seguro de limpiar todo? Se perderán los datos ingresados.')) {
            document.getElementById('reporteForm')?.reset();
            reiniciarFormulario();
        }
    });

    document.getElementById('buscarActivoInput')?.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase().trim();
        const filtrados = equiposMaestros.filter((a) => {
            const codigo = (a.codigo_activo || '').toLowerCase();
            const ubicacion = nombreUbicacionEquipo(a).toLowerCase();
            return codigo.includes(busqueda) || ubicacion.includes(busqueda);
        });
        renderizarActivosList(filtrados);
    });

    document.getElementById('btn-cerrar-sesion')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'auth_login.html';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    usuarioActualId = await resolverUsuarioActualId();
    inicializarFormularioReporte();
    cargarSelectorEspacios();
    cargarCheckboxesComponentes();
    await cargarEquiposParaModal();
});

window.openBuscarActivoModal = openBuscarActivoModal;
window.closeBuscarActivoModal = closeBuscarActivoModal;
