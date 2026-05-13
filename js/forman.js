document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('maintenanceForm');
  if(!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const date = document.getElementById('m_date').value;
    const floor = document.getElementById('m_floor').value;
    const space = document.getElementById('m_space').value;
    const model = document.getElementById('m_model').value;
    const brand = document.getElementById('m_brand').value;

    if(!date || !floor || !space || !model || !brand){
      alert('Por favor completa todos los campos.');
      return;
    }

    const item = { date, floor, space, model, brand, createdAt: Date.now() };

    const raw = localStorage.getItem('maintenances');
    const list = raw ? JSON.parse(raw) : [];
    list.push(item);
    localStorage.setItem('maintenances', JSON.stringify(list));

    alert('Mantenimiento registrado correctamente.');
    window.location.href = 'mantes.html';
  });
});
