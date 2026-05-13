// auth.js — manejo de autenticación demo (reemplazar por llamadas a backend real)
(function(){
  const SAMPLE = [
    { id: 'tech1', password: 'pass123', name: null, lastname: null, phone: null, email: null, profileCompleted: 0 },
    { id: 'tech2', password: 'clave456', name: null, lastname: null, phone: null, email: null, profileCompleted: 0 },
    { id: 'admin', password: 'admin123', name: null, lastname: null, phone: null, email: null, profileCompleted: 0 }
  ];

  function loadTechs(){
    const raw = localStorage.getItem('technicians');
    if(!raw){
      localStorage.setItem('technicians', JSON.stringify(SAMPLE));
      return SAMPLE;
    }
    try{
      const stored = JSON.parse(raw);
      if(!Array.isArray(stored)){
        localStorage.setItem('technicians', JSON.stringify(SAMPLE));
        return SAMPLE;
      }

      const merged = SAMPLE.map(defaultTech => {
        const savedTech = stored.find(item => String(item.id) === String(defaultTech.id));
        return savedTech ? {
          ...defaultTech,
          ...savedTech,
          profileCompleted: Number(savedTech.profileCompleted ?? defaultTech.profileCompleted ?? 0)
        } : defaultTech;
      });

      stored.forEach(savedTech => {
        const exists = merged.some(item => String(item.id) === String(savedTech.id));
        if(!exists){
          merged.push({
            id: savedTech.id,
            password: savedTech.password,
            name: savedTech.name ?? null,
            lastname: savedTech.lastname ?? null,
            phone: savedTech.phone ?? null,
            email: savedTech.email ?? null,
            profileCompleted: Number(savedTech.profileCompleted ?? 0)
          });
        }
      });

      localStorage.setItem('technicians', JSON.stringify(merged));
      return merged;
    }catch(e){
      localStorage.setItem('technicians', JSON.stringify(SAMPLE));
      return SAMPLE;
    }
  }

  function saveTechs(list){ localStorage.setItem('technicians', JSON.stringify(list)); }

  function findTechById(id){
    const list = loadTechs();
    return list.find(t => String(t.id) === String(id));
  }

  function verifyCredentials(id, password){
    const tech = findTechById(id);
    if(!tech) return null;
    return tech.password === password ? tech : null;
  }

  function upsertTechRecord(updatedTech){
    const list = loadTechs();
    const index = list.findIndex(item => String(item.id) === String(updatedTech.id));
    if(index === -1){
      list.push(updatedTech);
    } else {
      list[index] = updatedTech;
    }
    saveTechs(list);
  }

  // Login form handler
  document.addEventListener('DOMContentLoaded', ()=>{
    const loginForm = document.getElementById('loginForm');
    if(loginForm){
      loginForm.addEventListener('submit', e =>{
        e.preventDefault();
        const id = document.getElementById('techId').value.trim();
        const password = document.getElementById('password').value;
        const tech = verifyCredentials(id, password);
        if(!tech){
          alert('ID o contraseña incorrectos. Asegúrate de tener una cuenta de técnicos.');
          return;
        }
        // guardar sesión mínima
        sessionStorage.setItem('currentTech', JSON.stringify(tech));
        // guardar currentUser en localStorage
        localStorage.setItem('currentUser', id);
        // si no tiene perfil completo, redirigir a adpan
        if(Number(tech.profileCompleted) === 0){
          window.location.href = 'adpan.html';
        } else {
          // redirigir a mantes
          window.location.href = 'mantes.html';
        }
      });
    }

    // profile form handler (adpan)
    const profileForm = document.getElementById('profileForm');
    if(profileForm){
      // asegurar que exista currentTech
      const stored = sessionStorage.getItem('currentTech');
      if(!stored){ window.location.href = 'base.html'; return }
      const cur = JSON.parse(stored);

      // prefill email si existe
      const emailEl = document.getElementById('pf_email');
      if(emailEl && cur.email) emailEl.value = cur.email;

      profileForm.addEventListener('submit', e =>{
        e.preventDefault();
        const nombre = document.getElementById('pf_name').value.trim();
        const apellido = document.getElementById('pf_lastname').value.trim();
        const telefono = document.getElementById('pf_phone').value.trim();
        const email = document.getElementById('pf_email').value.trim();

        if(!nombre || !apellido || !telefono || !email){
          alert('Todos los campos son obligatorios.');
          return;
        }
        // validar que no empiece por +57
        if(telefono.startsWith('+57')){
          alert('Por favor ingresa el número SIN el prefijo +57.');
          return;
        }
        // validar que telefono tenga solo dígitos y longitud razonable
        const digits = telefono.replace(/\s|-/g,'');
        if(!/^\d{7,15}$/.test(digits)){
          alert('Número de teléfono inválido. Ingresa solo dígitos (sin +57).');
          return;
        }
        const updatedTech = {
          id: cur.id,
          password: cur.password,
          name: nombre,
          lastname: apellido,
          phone: digits,
          email: email,
          profileCompleted: 1
        };
        upsertTechRecord(updatedTech);
        sessionStorage.setItem('currentTech', JSON.stringify(updatedTech));
        // limpiar session y redirigir
        sessionStorage.removeItem('currentTech');
        alert('Perfil completado. Bienvenido.');
        window.location.href = 'mantes.html';
      });
    }
  });
})();
