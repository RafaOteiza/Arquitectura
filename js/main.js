// Función de Login
function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (username === "admin" && password === "1234") {
        window.location.href = "dashboard.html";
    } else {
        document.getElementById("loginError").innerText = "Credenciales incorrectas";
    }
}

// Función de Recuperación de Contraseña
function recoverPassword(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;

    if (email) {
        alert("Se ha enviado un enlace de recuperación a " + email);
        window.location.href = "index.html";
    } else {
        alert("Por favor, ingresa un correo electrónico válido.");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const sidebarLinks = document.querySelectorAll("#accordian ul li a");
    const currentPage = window.location.pathname.split("/").pop();

    // Recupera el enlace activo guardado en localStorage o usa la página actual
    const activeLink = localStorage.getItem("activeLink") || currentPage;

    sidebarLinks.forEach(link => {
        // Aplica la clase 'active' al enlace correspondiente
        if (link.getAttribute("href") === activeLink) {
            link.classList.add("active");
        }

        // Evento para guardar el enlace activo en localStorage al hacer clic
        link.addEventListener("click", function() {
            sidebarLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");
            localStorage.setItem("activeLink", link.getAttribute("href"));
        });
    });
});
