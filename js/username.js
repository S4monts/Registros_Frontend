document.addEventListener('DOMContentLoaded', function () {
  const userEl = document.getElementById('username');
  if (!userEl) return;

  // Obtener el nombre del usuario desde localStorage
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.user_id === currentUser);

  if (user) {
    userEl.textContent = user.name;
  }
});
