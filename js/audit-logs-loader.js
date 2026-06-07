/**
 * AiresFlow — audit-logs-loader.js
 * Bitácora de auditoría conectada a GET /auditoria/
 */

let registrosAuditoriaGlobal = [];

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function extraerMensajeError(error) {
    return error?.message || String(error) || 'Error desconocido';
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncarTexto(texto, max = 48) {
    const valor = String(texto ?? '—');
    return valor.length > max ? `${valor.slice(0, max)}…` : valor;
}

function construirResumenHumano(registro) {
    const campo = registro.campo || 'campo';
    const tabla = registro.tabla_afectada || 'tabla';
    const registroId = registro.registro_id ?? '—';
    const operario = registro.encargado_id ?? '—';
    const anterior = registro.valor_anterior ?? '(vacío)';
    const nuevo = registro.valor_nuevo ?? '(vacío)';
    const fecha = formatearFecha(registro.fecha_cambio);

    return `El campo ${campo} de la fila #${registroId} en la tabla ${tabla} fue actualizado por el usuario #${operario}. Cambió de "${anterior}" a "${nuevo}" el día ${fecha}.`;
}

function obtenerRegistrosFiltrados() {
    const tablaFiltro = document.getElementById('filterTabla')?.value?.trim().toLowerCase() || '';
    const desde = document.getElementById('filterDesde')?.value || '';
    const hasta = document.getElementById('filterHasta')?.value || '';
    const operarioFiltro = document.getElementById('filterOperario')?.value?.trim() || '';

    return registrosAuditoriaGlobal.filter((item) => {
        const coincideTabla = !tablaFiltro
            || String(item.tabla_afectada || '').toLowerCase().includes(tablaFiltro);

        const coincideOperario = !operarioFiltro
            || String(item.encargado_id || '') === operarioFiltro;

        const fechaItem = item.fecha_cambio ? new Date(item.fecha_cambio) : null;
        let coincideFecha = true;

        if (desde && fechaItem) {
            const d = new Date(`${desde}T00:00:00`);
            if (fechaItem < d) coincideFecha = false;
        }
        if (hasta && fechaItem) {
            const h = new Date(`${hasta}T23:59:59`);
            if (fechaItem > h) coincideFecha = false;
        }

        return coincideTabla && coincideOperario && coincideFecha;
    });
}

function renderizarTablaAuditoria() {
    const tbody = document.getElementById('tabla-auditoria-body');
    if (!tbody) return;

    const filtrados = obtenerRegistrosFiltrados();
    tbody.innerHTML = '';

    if (!filtrados.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-8 py-12 text-center text-slate-500">
                    <i class="fas fa-inbox text-3xl mb-3 text-slate-300"></i>
                    <p class="font-medium">No hay registros de auditoría para mostrar.</p>
                </td>
            </tr>`;
        return;
    }

    filtrados.forEach((registro) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/50 transition text-xs';
        tr.innerHTML = `
            <td class="px-6 py-4 font-bold text-uccDark">${escaparHtml(registro.id)}</td>
            <td class="px-6 py-4 text-slate-700">${escaparHtml(registro.tabla_afectada)}</td>
            <td class="px-6 py-4 font-semibold text-slate-700">${escaparHtml(registro.registro_id)}</td>
            <td class="px-6 py-4 text-slate-600">${escaparHtml(registro.campo)}</td>
            <td class="px-6 py-4 text-slate-500">${escaparHtml(truncarTexto(registro.valor_anterior))}</td>
            <td class="px-6 py-4 text-slate-700">${escaparHtml(truncarTexto(registro.valor_nuevo))}</td>
            <td class="px-6 py-4 font-semibold text-slate-700">${escaparHtml(registro.encargado_id ?? '—')}</td>
            <td class="px-6 py-4 font-bold text-slate-800">${escaparHtml(formatearFecha(registro.fecha_cambio))}</td>
            <td class="px-6 py-4 text-center">
                <button type="button" data-log-id="${registro.id}" class="btn-ver-traza inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition" title="Ver detalle">
                    <i class="fas fa-eye text-[#00acc9]"></i>
                    <span class="ml-2">Ver Traza</span>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-ver-traza').forEach((btn) => {
        btn.addEventListener('click', () => {
            openDetalleLogModal(btn.getAttribute('data-log-id'));
        });
    });

    const resumen = document.getElementById('auditoria-resumen');
    if (resumen) {
        resumen.textContent = `${filtrados.length} registro(s) visibles de ${registrosAuditoriaGlobal.length} en total`;
    }
}

async function cargarAuditoria() {
    const tbody = document.getElementById('tabla-auditoria-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-8 py-12 text-center text-slate-500">
                    <i class="fas fa-spinner fa-spin text-uccLight text-2xl mb-3"></i>
                    <p class="font-medium">Cargando bitácora desde el servidor…</p>
                </td>
            </tr>`;
    }

    try {
        const respuesta = await API.get('/auditoria/?limit=200');
        registrosAuditoriaGlobal = respuesta?.items || respuesta || [];
        renderizarTablaAuditoria();
    } catch (error) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-8 py-12 text-center text-red-600">
                        <i class="fas fa-exclamation-circle text-2xl mb-3"></i>
                        <p class="font-semibold">No se pudo cargar la auditoría.</p>
                        <p class="text-sm mt-1 text-slate-500">${escaparHtml(extraerMensajeError(error))}</p>
                    </td>
                </tr>`;
        }
    }
}

function openDetalleLogModal(logId) {
    const registro = registrosAuditoriaGlobal.find((r) => String(r.id) === String(logId));
    if (!registro) return;

    document.getElementById('logId').textContent = registro.id;
    document.getElementById('logTabla').textContent = registro.tabla_afectada || '—';
    document.getElementById('logRegistroId').textContent = registro.registro_id ?? '—';
    document.getElementById('logCampo').textContent = registro.campo || '—';
    document.getElementById('logValorAnterior').textContent = registro.valor_anterior ?? '(vacío)';
    document.getElementById('logValorNuevo').textContent = registro.valor_nuevo ?? '(vacío)';
    document.getElementById('logOperario').textContent = registro.encargado_id ?? '—';
    document.getElementById('logFecha').textContent = formatearFecha(registro.fecha_cambio);
    document.getElementById('logResumenHumano').textContent = construirResumenHumano(registro);

    document.getElementById('modal-detalle-log')?.classList.remove('hidden');
}

function closeDetalleLogModal() {
    document.getElementById('modal-detalle-log')?.classList.add('hidden');
}

function inicializarEventosAuditoria() {
    ['filterTabla', 'filterDesde', 'filterHasta', 'filterOperario'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', renderizarTablaAuditoria);
        document.getElementById(id)?.addEventListener('change', renderizarTablaAuditoria);
    });

    document.getElementById('modal-detalle-log')?.addEventListener('click', (event) => {
        if (event.target.id === 'modal-detalle-log') closeDetalleLogModal();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosAuditoria();
    cargarAuditoria();
});

window.openDetalleLogModal = openDetalleLogModal;
window.closeDetalleLogModal = closeDetalleLogModal;
