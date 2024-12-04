// Configuración de enlaces del menú lateral (sidebar)
const sidebarLinks = document.querySelectorAll("#accordian ul li a");
const currentPage = window.location.pathname.split("/").pop();

// Recuperar el enlace activo guardado en localStorage o usar la página actual
const activeLink = localStorage.getItem("activeLink") || currentPage;

sidebarLinks.forEach(link => {
    // Aplicar la clase 'active' al enlace correspondiente
    if (link.getAttribute("href") === activeLink) {
        link.classList.add("active");
    }

    // Evento para guardar el enlace activo en localStorage al hacer clic
    link.addEventListener("click", function () {
        sidebarLinks.forEach(item => item.classList.remove("active"));
        link.classList.add("active");
        localStorage.setItem("activeLink", link.getAttribute("href"));
    });
});

// Mostrar notificaciones (útil para errores o mensajes de éxito)
function showNotification(message, type) {
    const loginError = document.getElementById("loginError");

    if (loginError) {
        // Aplicar el mensaje y el estilo
        loginError.textContent = message;
        loginError.style.color = type === "error" ? "red" : "green"; // Cambiar el color según el tipo
    } else {
        console.warn("No se encontró el elemento para mostrar notificaciones.");
    }
}

async function login(event) {
    event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showNotification("Por favor, completa todos los campos.", "error");
        return;
    }

    try {
        // Realizar la solicitud al backend con los parámetros de correo y contraseña
        const response = await fetch(`http://127.0.0.1:8000/usuarios/usuarios/?correo=${username}&contraseña=${password}`);
        if (response.ok) {
            const data = await response.json();

            if (data.length > 0) {
                // Guardar los datos del usuario correcto en localStorage
                console.log("Usuario logueado:", data[0]); // Depuración
                localStorage.setItem("user", JSON.stringify(data[0]));

                // Redirigir al usuario a la página principal
                window.location.href = "dashboard.html";
            } else {
                showNotification("Credenciales incorrectas. Por favor, inténtalo nuevamente.", "error");
            }
        } else {
            showNotification("Error en el servidor. Inténtalo más tarde.", "error");
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        showNotification("No se pudo conectar con el servidor. Por favor, inténtalo más tarde.", "error");
    }
}




// Función para cerrar sesión
function logout() {
    // Eliminar los datos del usuario almacenados en localStorage
    localStorage.removeItem("user");

    // Redirigir al usuario a la página de inicio de sesión
    window.location.href = "index.html";
}

// Función para cargar el nombre o correo del usuario en el navbar
document.addEventListener("DOMContentLoaded", async () => {
    const userNameElement = document.getElementById("user-name");
    const user = JSON.parse(localStorage.getItem("user")); // Obtener usuario desde localStorage

    if (userNameElement) {
        if (user && user.id) {
            try {
                // Obtener datos completos del usuario desde el backend
                const response = await fetch(`http://127.0.0.1:8000/usuarios/usuarios/${user.id}/`);
                if (response.ok) {
                    const userData = await response.json();

                    // Mostrar el nombre completo o el correo
                    userNameElement.textContent = userData.nombre
                        ? `${userData.nombre} ${userData.apellido}`
                        : userData.correo || "Usuario desconocido";
                } else {
                    console.error("No se pudo obtener los datos del usuario desde el backend.");
                    userNameElement.textContent = "Error al cargar usuario";
                }
            } catch (error) {
                console.error("Error al conectar con el backend:", error);
                userNameElement.textContent = "Error de conexión";
            }
        } else {
            userNameElement.textContent = "No autenticado";
        }
    }
});
