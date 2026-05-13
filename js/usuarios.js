// Variable para controlar si estamos en modo selección
let enModoSeleccion = false;

// Ocultar/mostrar checkboxes
function ocultarCheckboxes() {
  document.querySelectorAll('.hidden-checkbox').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.parentElement.style.display = 'none';
  });
}

function mostrarCheckboxes() {
  document.querySelectorAll('.hidden-checkbox').forEach(el => {
    el.style.display = 'table-cell';
  });
  document.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.parentElement.style.display = 'table-cell';
  });
}

// Inicializar usuarios de ejemplo si no existen
function initializeUsers() {
  if (!localStorage.getItem('users')) {
    const usuarios = [
      {
        registro_id: 1,
        user_id: "admin",
        password: "admin123",
        permission: "administrador",
        name: "Administrador",
        lastname: "Sistema",
        phone: "3001234567",
        email: "admin@sistema.com"
      },
      {
        registro_id: 2,
        user_id: "tecnico1",
        password: "tecnico123",
        permission: "profesional",
        name: "Carlos",
        lastname: "García",
        phone: "3102345678",
        email: "carlos@sistema.com"
      },
      {
        registro_id: 3,
        user_id: "invitado1",
        password: "invitado123",
        permission: "invitado",
        name: "Pedro",
        lastname: "Rodríguez",
        phone: "3203456789",
        email: "pedro@sistema.com"
      }
    ];
    localStorage.setItem('users', JSON.stringify(usuarios));
  }
}

// Obtener el siguiente ID de registro
function getNextRegistroId() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users.length > 0 ? Math.max(...users.map(u => u.registro_id)) + 1 : 1;
}

// Renderizar tabla
function renderUsuarios() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const tbody = document.getElementById('usuariosTable');
  tbody.innerHTML = '';

  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition user-row';
    tr.dataset.userId = user.user_id;
    tr.innerHTML = `
      <td class="px-6 py-4 w-12">
        <input type="checkbox" class="user-checkbox rounded border-slate-300" data-user-id="${user.user_id}">
      </td>
      <td class="px-6 py-4 font-medium">${user.registro_id}</td>
      <td class="px-6 py-4">${user.user_id}</td>
      <td class="px-6 py-4">
        <span class="inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          user.permission === 'administrador' ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20' :
          user.permission === 'profesional' ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20' :
          'bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/20'
        }">
          ${user.permission.charAt(0).toUpperCase() + user.permission.slice(1)}
        </span>
      </td>
      <td class="px-6 py-4">${user.name}</td>
      <td class="px-6 py-4">${user.lastname}</td>
      <td class="px-6 py-4">${user.phone}</td>
      <td class="px-6 py-4">${user.email}</td>
    `;
    tbody.appendChild(tr);

    tr.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = tr.querySelector('.user-checkbox');
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
  const checkboxes = document.querySelectorAll('.user-checkbox');
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

// Obtener usuario seleccionado
function getSelectedUser() {
  const checkbox = document.querySelector('.user-checkbox:checked');
  if (!checkbox) return null;
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users.find(u => u.user_id === checkbox.dataset.userId);
}

// Abrir modal para crear
document.getElementById('crearBtn').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = 'Crear Usuario';
  document.getElementById('usuarioForm').reset();
  document.getElementById('form_user_id').disabled = false;
  document.getElementById('usuarioForm').dataset.mode = 'create';
  document.getElementById('modalUsuario').classList.remove('hidden');
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
  document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
});

// Confirmar modificación
document.getElementById('confirmarBtn').addEventListener('click', () => {
  const user = getSelectedUser();
  if (!user) return;

  document.getElementById('modalTitle').textContent = 'Modificar Usuario';
  document.getElementById('form_user_id').value = user.user_id;
  document.getElementById('form_password').value = user.password;
  document.getElementById('form_name').value = user.name;
  document.getElementById('form_lastname').value = user.lastname;
  document.getElementById('form_phone').value = user.phone;
  document.getElementById('form_email').value = user.email;
  document.getElementById('form_permission').value = user.permission;
  document.getElementById('form_user_id').disabled = true;
  document.getElementById('usuarioForm').dataset.mode = 'edit';
  document.getElementById('usuarioForm').dataset.originalUserId = user.user_id;
  document.getElementById('modalUsuario').classList.remove('hidden');

  // Limpiar modo selección
  enModoSeleccion = false;
  ocultarCheckboxes();
  document.getElementById('modificarBtn').classList.remove('hidden');
  document.getElementById('cancelarSeleccionBtn').classList.add('hidden');
  document.getElementById('confirmarBtn').classList.add('hidden');
  document.getElementById('eliminarBtn').classList.add('hidden');
  document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
});

// Eliminar usuario
document.getElementById('eliminarBtn').addEventListener('click', () => {
  const user = getSelectedUser();
  if (!user) return;

  if (confirm(`¿Estás seguro de que deseas eliminar a ${user.name} ${user.lastname}?`)) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.user_id !== user.user_id);
    localStorage.setItem('users', JSON.stringify(users));
    renderUsuarios();
    updateSelectionUI();
    document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
  }
});

// Cerrar modal
document.getElementById('cancelarBtn').addEventListener('click', () => {
  document.getElementById('modalUsuario').classList.add('hidden');
  document.getElementById('usuarioForm').reset();
});

// Guardar usuario
document.getElementById('usuarioForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const mode = document.getElementById('usuarioForm').dataset.mode;
  const userId = document.getElementById('form_user_id').value;
  const newUser = {
    user_id: userId,
    password: document.getElementById('form_password').value,
    name: document.getElementById('form_name').value,
    lastname: document.getElementById('form_lastname').value,
    phone: document.getElementById('form_phone').value,
    email: document.getElementById('form_email').value,
    permission: document.getElementById('form_permission').value
  };

  let users = JSON.parse(localStorage.getItem('users')) || [];

  if (mode === 'create') {
    newUser.registro_id = getNextRegistroId();
    users.push(newUser);
  } else {
    const originalUserId = document.getElementById('usuarioForm').dataset.originalUserId;
    const index = users.findIndex(u => u.user_id === originalUserId);
    if (index > -1) {
      newUser.registro_id = users[index].registro_id;
      users[index] = newUser;
    }
  }

  localStorage.setItem('users', JSON.stringify(users));
  document.getElementById('modalUsuario').classList.add('hidden');
  document.getElementById('usuarioForm').reset();
  renderUsuarios();
  document.querySelectorAll('.user-checkbox').forEach(cb => cb.checked = false);
  updateSelectionUI();
});

// Seleccionar todos
document.addEventListener('change', (e) => {
  if (e.target.id === 'selectAll') {
    document.querySelectorAll('.user-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
    updateSelectionUI();
  } else if (e.target.classList.contains('user-checkbox')) {
    updateSelectionUI();
  }
});

// Inicializar
initializeUsers();
renderUsuarios();

