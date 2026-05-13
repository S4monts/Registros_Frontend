// Variable para controlar si estamos en modo selección
let enModoSeleccion = false;

// Ocultar/mostrar checkboxes
function ocultarCheckboxes() {
  document.querySelectorAll('.hidden-checkbox').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelectorAll('.equipo-checkbox').forEach(cb => {
    cb.parentElement.style.display = 'none';
  });
}

function mostrarCheckboxes() {
  document.querySelectorAll('.hidden-checkbox').forEach(el => {
    el.style.display = 'table-cell';
  });
  document.querySelectorAll('.equipo-checkbox').forEach(cb => {
    cb.parentElement.style.display = 'table-cell';
  });
}

// Inicializar equipos de ejemplo si no existen
function initializeEquipos() {
  if (!localStorage.getItem('equipos')) {
    const equipos = [
      {
        equipo_id: 1,
        modelo: "Split 12000 BTU",
        marca: "LG",
        ubicacion: "Recepción",
        piso: "Piso 1",
        ultimo_servicio: "2026-04-01",
        estado: "al-día"
      },
      {
        equipo_id: 2,
        modelo: "Cassette 24000 BTU",
        marca: "Daikin",
        ubicacion: "Sala de juntas",
        piso: "Piso 2",
        ultimo_servicio: "2026-03-15",
        estado: "próximo"
      },
      {
        equipo_id: 3,
        modelo: "Piso-techo 36000 BTU",
        marca: "Carrier",
        ubicacion: "Almacén",
        piso: "Piso 1",
        ultimo_servicio: "2026-02-20",
        estado: "vencido"
      }
    ];
    localStorage.setItem('equipos', JSON.stringify(equipos));
  }
}

// Obtener el siguiente ID de equipo
function getNextEquipoId() {
  const equipos = JSON.parse(localStorage.getItem('equipos')) || [];
  return equipos.length > 0 ? Math.max(...equipos.map(e => e.equipo_id)) + 1 : 1;
}

// Renderizar tabla
function renderEquipos() {
  const equipos = JSON.parse(localStorage.getItem('equipos')) || [];
  const tbody = document.getElementById('equiposTable');
  tbody.innerHTML = '';

  equipos.forEach(equipo => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition equipo-row';
    tr.dataset.equipoId = equipo.equipo_id;
    
    const estadoColor = 
      equipo.estado === 'al-día' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20' :
      equipo.estado === 'próximo' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20' :
      'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20';
    
    tr.innerHTML = `
      <td class="px-6 py-4 w-12">
        <input type="checkbox" class="equipo-checkbox rounded border-slate-300" data-equipo-id="${equipo.equipo_id}">
      </td>
      <td class="px-6 py-4 font-medium">${equipo.equipo_id}</td>
      <td class="px-6 py-4">${equipo.modelo}</td>
      <td class="px-6 py-4">${equipo.marca}</td>
      <td class="px-6 py-4">${equipo.ubicacion}</td>
      <td class="px-6 py-4">${equipo.piso}</td>
      <td class="px-6 py-4">${equipo.ultimo_servicio}</td>
      <td class="px-6 py-4">
        <span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ${estadoColor}">
          ${equipo.estado.charAt(0).toUpperCase() + equipo.estado.slice(1)}
        </span>
      </td>
    `;
    tbody.appendChild(tr);

    tr.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = tr.querySelector('.equipo-checkbox');
        checkbox.checked = !checkbox.checked;
        updateSelectionUI();
      }
    });
  });

  // Ocultar checkboxes inicialmente
  ocultarCheckboxes();
}

// Actualizar UI de selección
function updateSelectionUI() {
  const checkboxes = document.querySelectorAll('.equipo-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const confirmarBtn = document.getElementById('confirmarBtn');
  const eliminarBtn = document.getElementById('eliminarBtn');

  if (selectedCount === 1) {
    confirmarBtn.classList.remove('hidden');
    eliminarBtn.classList.remove('hidden');
  } else {
    confirmarBtn.classList.add('hidden');
    eliminarBtn.classList.add('hidden');
  }
}

// Obtener equipo seleccionado
function getSelectedEquipo() {
  const checkbox = document.querySelector('.equipo-checkbox:checked');
  if (!checkbox) return null;
  const equipos = JSON.parse(localStorage.getItem('equipos')) || [];
  return equipos.find(e => e.equipo_id == checkbox.dataset.equipoId);
}

// Abrir modal para crear
document.getElementById('crearBtn').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Crear Equipo';
  document.getElementById('equipoForm').reset();
  document.getElementById('equipoForm').dataset.mode = 'create';
  document.getElementById('modalEquipo').classList.remove('hidden');
});

// Abrir modo selección para modificar
document.getElementById('modificarBtn').addEventListener('click', () => {
  enModoSeleccion = true;
  mostrarCheckboxes();
  document.getElementById('modificarBtn').classList.add('hidden');
  document.getElementById('cancelarSeleccionBtn').classList.remove('hidden');
});

// Cancelar selección
document.getElementById('cancelarSeleccionBtn').addEventListener('click', () => {
  enModoSeleccion = false;
  ocultarCheckboxes();
  document.getElementById('modificarBtn').classList.remove('hidden');
  document.getElementById('cancelarSeleccionBtn').classList.add('hidden');
  document.getElementById('confirmarBtn').classList.add('hidden');
  document.getElementById('eliminarBtn').classList.add('hidden');
  document.querySelectorAll('.equipo-checkbox').forEach(cb => cb.checked = false);
});

// Confirmar modificación
document.getElementById('confirmarBtn').addEventListener('click', () => {
  const equipo = getSelectedEquipo();
  if (!equipo) return;

  document.getElementById('modalTitle').textContent = 'Modificar Equipo';
  document.getElementById('form_modelo').value = equipo.modelo;
  document.getElementById('form_marca').value = equipo.marca;
  document.getElementById('form_ubicacion').value = equipo.ubicacion;
  document.getElementById('form_piso').value = equipo.piso;
  document.getElementById('form_ultimo_servicio').value = equipo.ultimo_servicio;
  document.getElementById('form_estado').value = equipo.estado;
  document.getElementById('equipoForm').dataset.mode = 'edit';
  document.getElementById('equipoForm').dataset.originalEquipoId = equipo.equipo_id;
  document.getElementById('modalEquipo').classList.remove('hidden');

  // Limpiar modo selección
  enModoSeleccion = false;
  ocultarCheckboxes();
  document.getElementById('modificarBtn').classList.remove('hidden');
  document.getElementById('cancelarSeleccionBtn').classList.add('hidden');
  document.getElementById('confirmarBtn').classList.add('hidden');
  document.getElementById('eliminarBtn').classList.add('hidden');
  document.querySelectorAll('.equipo-checkbox').forEach(cb => cb.checked = false);
});

// Eliminar equipo
document.getElementById('eliminarBtn').addEventListener('click', () => {
  const equipo = getSelectedEquipo();
  if (!equipo) return;

  if (confirm(`¿Estás seguro de que deseas eliminar el equipo ${equipo.modelo}?`)) {
    let equipos = JSON.parse(localStorage.getItem('equipos')) || [];
    equipos = equipos.filter(e => e.equipo_id !== equipo.equipo_id);
    localStorage.setItem('equipos', JSON.stringify(equipos));
    renderEquipos();
    updateSelectionUI();
    document.querySelectorAll('.equipo-checkbox').forEach(cb => cb.checked = false);
  }
});

// Cerrar modal
document.getElementById('cancelarBtn').addEventListener('click', () => {
  document.getElementById('modalEquipo').classList.add('hidden');
  document.getElementById('equipoForm').reset();
});

// Guardar equipo
document.getElementById('equipoForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const mode = document.getElementById('equipoForm').dataset.mode;
  const newEquipo = {
    modelo: document.getElementById('form_modelo').value,
    marca: document.getElementById('form_marca').value,
    ubicacion: document.getElementById('form_ubicacion').value,
    piso: document.getElementById('form_piso').value,
    ultimo_servicio: document.getElementById('form_ultimo_servicio').value,
    estado: document.getElementById('form_estado').value
  };

  let equipos = JSON.parse(localStorage.getItem('equipos')) || [];

  if (mode === 'create') {
    newEquipo.equipo_id = getNextEquipoId();
    equipos.push(newEquipo);
  } else {
    const originalEquipoId = parseInt(document.getElementById('equipoForm').dataset.originalEquipoId);
    const index = equipos.findIndex(e => e.equipo_id === originalEquipoId);
    if (index > -1) {
      newEquipo.equipo_id = equipos[index].equipo_id;
      equipos[index] = newEquipo;
    }
  }

  localStorage.setItem('equipos', JSON.stringify(equipos));
  document.getElementById('modalEquipo').classList.add('hidden');
  document.getElementById('equipoForm').reset();
  renderEquipos();
  document.querySelectorAll('.equipo-checkbox').forEach(cb => cb.checked = false);
  updateSelectionUI();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  initializeEquipos();
  renderEquipos();
});
