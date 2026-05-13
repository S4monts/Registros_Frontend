const userMenuButton = document.getElementById("userMenuButton");
const userMenu = document.getElementById("userMenu");

if (userMenuButton && userMenu) {
  userMenuButton.addEventListener("click", () => {
    const isExpanded = userMenuButton.getAttribute("aria-expanded") === "true";
    userMenuButton.setAttribute("aria-expanded", String(!isExpanded));
    userMenu.classList.toggle("hidden");
  });

  // Manejar click en enlace de "Cerrar sesion"
  userMenu.addEventListener("click", (e) => {
    if (e.target.tagName === "A" && e.target.textContent.trim() === "Cerrar sesion") {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      sessionStorage.removeItem("currentTech");
      window.location.href = "base.html";
      return;
    }
    userMenu.classList.add("hidden");
    userMenuButton.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    const clickedInsideMenu = userMenu.contains(target);
    const clickedButton = userMenuButton.contains(target);

    if (!clickedInsideMenu && !clickedButton) {
      userMenu.classList.add("hidden");
      userMenuButton.setAttribute("aria-expanded", "false");
    }
  });
}
