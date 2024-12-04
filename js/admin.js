const API_URL = "http://127.0.0.1:8000/usuarios/usuarios/";
let usuarioSeleccionado = null; // Para almacenar el ID del usuario seleccionado

// Función para cargar los usuarios en la tabla
async function cargarUsuarios() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const usuarios = await response.json();
            const tabla = document.getElementById("tablaUsuarios");
            tabla.innerHTML = ""; // Limpiar tabla

            usuarios.forEach(usuario => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre}</td>
                    <td>${usuario.apellido}</td>
                    <td>${usuario.correo}</td>
                    <td>${usuario.id_rol === 5 ? "Admin" : "Usuario"}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit" onclick="abrirModalCrearUsuario(${usuario.id})">Editar</button>
                            <button class="delete" onclick="abrirModalEliminarUsuario(${usuario.id})">Eliminar</button>
                        </div>
                    </td>
                `;
                tabla.appendChild(fila);
            });
        } else {
            console.error("Error al cargar usuarios.");
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

// Función para abrir el modal para crear o editar un usuario
function abrirModalCrearUsuario(id = null) {
    const modal = document.getElementById("modalUsuario");
    const titulo = document.getElementById("modalTitulo");
    const form = document.getElementById("formUsuario");

    if (id) {
        // Editar usuario
        fetch(`${API_URL}${id}/`)
            .then(response => response.json())
            .then(usuario => {
                titulo.textContent = "Editar Usuario";
                document.getElementById("nombre").value = usuario.nombre;
                document.getElementById("apellido").value = usuario.apellido;
                document.getElementById("correo").value = usuario.correo;
                document.getElementById("contraseña").value = usuario.contraseña;
                document.getElementById("rol").value = usuario.id_rol;
                usuarioSeleccionado = id;
            })
            .catch(error => console.error("Error al obtener usuario:", error));
    } else {
        // Crear usuario
        titulo.textContent = "Crear Usuario";
        form.reset();
        usuarioSeleccionado = null;
    }

    modal.style.display = "flex";
}

// Función para abrir el modal de confirmación para eliminar usuario
function abrirModalEliminarUsuario(id) {
    usuarioSeleccionado = id;
    const modal = document.getElementById("modalEliminar");
    modal.style.display = "flex";
}

// Función para cerrar todos los modales
function cerrarModal() {
    document.getElementById("modalUsuario").style.display = "none";
    document.getElementById("modalEliminar").style.display = "none";
    usuarioSeleccionado = null;
}

// Manejar el envío del formulario para crear o editar usuario
document.getElementById("formUsuario").addEventListener("submit", async function (event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const correo = document.getElementById("correo").value;
    const contraseña = document.getElementById("contraseña").value;
    const rol = document.getElementById("rol").value;

    const usuario = { nombre, apellido, correo, contraseña, id_rol: parseInt(rol) };

    try {
        const response = await fetch(usuarioSeleccionado ? `${API_URL}${usuarioSeleccionado}/` : API_URL, {
            method: usuarioSeleccionado ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(usuario),
        });

        if (response.ok) {
            alert(usuarioSeleccionado ? "Usuario actualizado." : "Usuario creado.");
            cerrarModal();
            cargarUsuarios();
        } else {
            alert("Error al guardar el usuario.");
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
});

// Manejar la confirmación de eliminación
document.getElementById("confirmarEliminar").addEventListener("click", async function () {
    try {
        const response = await fetch(`${API_URL}${usuarioSeleccionado}/`, {
            method: "DELETE",
        });

        if (response.ok) {
            alert("Usuario eliminado.");
            cerrarModal();
            cargarUsuarios();
        } else {
            alert("Error al eliminar el usuario.");
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
});

// Cargar usuarios al cargar la página
document.addEventListener("DOMContentLoaded", cargarUsuarios);
