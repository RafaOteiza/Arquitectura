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

// URL base del backend para la API de SIMs
const API_BASE_URL = "http://127.0.0.1:8001/sims";

// Función para consultar SIMs por MSISDN o ICCID
function searchSIMs() {
    const msisdn = document.getElementById("search-msisdn").value;
    const iccid = document.getElementById("search-iccid").value;

    let url = `${API_BASE_URL}/sim-msisdn/?search=`;
    if (msisdn && !iccid) {
        url += msisdn;
    } else if (iccid && !msisdn) {
        url += iccid;
    } else if (msisdn && iccid) {
        alert("Por favor, busca por MSISDN o ICCID, no ambos.");
        return;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se encontraron datos');
            }
            return response.json();
        })
        .then(data => {
            const tableBody = document.querySelector(".data-table tbody");
            tableBody.innerHTML = ""; // Limpiar el contenido actual

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(sim => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${sim.id || "N/A"}</td>
                        <td>${sim.iccid || "N/A"}</td>
                        <td>${sim.fecha_creacion || "N/A"}</td>
                        <td>${sim.id_estado?.nombre_estado || "N/A"}</td>
                        <td>${sim.ubicacion || "LAB DEV"}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="5">No se encontraron resultados</td>`;
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error al consultar SIMs:', error);
            const tableBody = document.querySelector(".data-table tbody");
            tableBody.innerHTML = `<tr><td colspan="5">Error al cargar datos</td></tr>`;
        });
}


// Función para agregar una nueva SIM
function addSIM() {
    const iccid = document.getElementById("new-iccid").value;
    const fecha_ingreso = document.getElementById("entry-date").value;
    const estado = 1; // Suponiendo que el ID para 'En espera de asignación' es 1 en `EstadoSim`
    const ubicacion = "LAB DEV";

    const simData = { iccid, fecha_ingreso, id_estado: estado, ubicacion };

    fetch(`${API_BASE_URL}/sim-msisdn/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simData)
    })
    .then(response => response.json())
    .then(data => {
        alert("SIM agregada con éxito");
        searchSIMs(); // Actualizar lista de SIMs
    })
    .catch(error => console.error('Error al agregar SIM:', error));
}

// Función para asociar un MSISDN a una SIM
function associateMSISDN() {
    const iccid = document.getElementById("sim-iccid").value;
    const msisdn = document.getElementById("msisdn").value;

    const associationData = { iccid, msisdn };

    fetch(`${API_BASE_URL}/sim-msisdn/associate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(associationData)
    })
    .then(response => response.json())
    .then(data => {
        alert("MSISDN asociado con éxito");
    })
    .catch(error => console.error('Error al asociar MSISDN:', error));
}

// Función para disociar un MSISDN de una SIM
function disassociateMSISDN() {
    const iccid = document.getElementById("sim-iccid").value;
    const msisdn = document.getElementById("msisdn").value;

    fetch(`${API_BASE_URL}/sim-msisdn/disassociate/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iccid, msisdn })
    })
    .then(response => response.json())
    .then(data => {
        alert("MSISDN disociado con éxito");
    })
    .catch(error => console.error('Error al disociar MSISDN:', error));
}

// Eventos de botones
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".search-sim-btn").addEventListener("click", searchSIMs);
    document.querySelector(".add-sim-btn").addEventListener("click", addSIM);
    document.querySelector(".associate-btn").addEventListener("click", associateMSISDN);
    document.querySelector(".disassociate-btn").addEventListener("click", disassociateMSISDN);
});

// Evento para ejecutar funciones al cargar la página
document.addEventListener("DOMContentLoaded", function() {
    // Cargar datos de estado de SIM automáticamente
    fetchEstadoSim();

    // Agregar evento para el botón "Extraer Reporte" para los filtros de fecha y SIM
    const reportButton = document.querySelector(".extract-report-btn");
    if (reportButton) {
        reportButton.addEventListener("click", fetchFilteredReport);
    }

    // Gestión de enlaces de la barra lateral
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
