// Mostrar notificaciones
function showNotification(message, type) {
    const loginError = document.getElementById("loginError");
    if (loginError) {
        loginError.textContent = message;
        loginError.style.color = type === "error" ? "red" : "green";
    }
}

// Función para iniciar sesión
async function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showNotification("Por favor, completa todos los campos.", "error");
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:8000/usuarios/usuarios/?correo=${username}&contraseña=${password}`);
        if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
                localStorage.setItem("user", JSON.stringify(data[0]));
                window.location.href = "dashboard.html";
            } else {
                showNotification("Credenciales incorrectas.", "error");
            }
        } else {
            showNotification("Error en el servidor. Inténtalo más tarde.", "error");
        }
    } catch (error) {
        console.error("Error:", error);
        showNotification("Error de conexión. Inténtalo más tarde.", "error");
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem("user");
    window.location.href = "index.html";
}

// Función para cargar el usuario desde el backend
document.addEventListener("DOMContentLoaded", async () => {
    const userNameElement = document.getElementById("user-name");
    const userIconElement = document.getElementById("user-icon");

    try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || !storedUser.id) {
            userNameElement.textContent = "No autenticado";
            return;
        }

        const response = await fetch(`http://127.0.0.1:8000/usuarios/usuarios/?id=${storedUser.id}`);
        if (!response.ok) throw new Error("Error al obtener el usuario");

        const userData = await response.json();
        if (userData.length > 0) {
            const user = userData[0];
            userNameElement.textContent = `${user.nombre} ${user.apellido}`;
            userIconElement.title = `${user.nombre} ${user.apellido}`;
        } else {
            userNameElement.textContent = "Usuario desconocido";
        }
    } catch (error) {
        console.error("Error al cargar usuario:", error);
        userNameElement.textContent = "Error al cargar";
    }
});
