function login(event) {
    event.preventDefault(); // Evita el envío del formulario

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("loginError");

    if (username === "admin" && password === "1234") {
        // Simulación de redirección al dashboard
        window.location.href = "dashboard.html";
    } else {
        loginError.innerText = "Credenciales incorrectas";
    }
}

function recoverPassword(event) {
    event.preventDefault(); // Evita el envío del formulario

    const email = document.getElementById("email").value;

    if (email) {
        alert("Se ha enviado un enlace de recuperación a " + email);
        // Aquí puedes agregar la lógica para enviar el correo de recuperación
        window.location.href = "index.html"; // Redirige de nuevo al login
    } else {
        alert("Por favor, ingresa un correo electrónico válido.");
    }
}
