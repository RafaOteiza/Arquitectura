import { showNotification } from "./alertas.js";

const API_SIMS_URL = "http://127.0.0.1:8001/sims/";

// ============================ FUNCIONES PARA SIMS ============================

// Función para buscar SIMs por MSISDN o ICCID
function searchSIMs() {
    const msisdnInput = document.getElementById("search-msisdn").value.trim();
    const iccidInput = document.getElementById("search-iccid").value.trim();

    if (!msisdnInput && !iccidInput) {
        showNotification("Por favor, ingresa un MSISDN o ICCID para buscar.", "error");
        return;
    }

    fetch(`${API_SIMS_URL}sim-msisdn/`)
        .then(response => response.json())
        .then(simData => {
            let filteredData = simData;

            if (msisdnInput) {
                filteredData = filteredData.filter(sim => sim.id_msisdn?.msisdn === msisdnInput);
            } else if (iccidInput) {
                filteredData = filteredData.filter(sim => sim.iccid === iccidInput);
            }

            updateSIMTable(filteredData);
        })
        .catch(error => {
            console.error("Error al buscar SIMs:", error);
            showNotification("Error al buscar SIMs.", "error");
        });
}

// Función para cargar todas las SIMs al inicio
function loadAllSIMs() {
    fetch(`${API_SIMS_URL}sim-msisdn/`)
        .then(response => response.json())
        .then(data => updateSIMTable(data))
        .catch(error => {
            console.error("Error al cargar las SIMs:", error);
            showNotification("Error al cargar las SIMs.", "error");
        });
}

// Función para actualizar la tabla de SIMs
function updateSIMTable(data) {
    const tableBody = document.querySelector(".data-table tbody");
    tableBody.innerHTML = "";

    if (data.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6">No se encontraron resultados</td>`;
        tableBody.appendChild(row);
        return;
    }

    data.forEach(sim => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${sim.iccid}</td>
            <td>${sim.id_msisdn?.msisdn || "N/A"}</td> <!-- Mostrar "N/A" si no hay MSISDN -->
            <td>${sim.fecha_creacion}</td>
            <td>${sim.id_msisdn?.nodo_concert_ip || "N/A"}</td>
            <td>${sim.id_msisdn?.nodo_condor_ip || "N/A"}</td>
            <td>${sim.id_estado?.nombre_estado || "N/A"}</td>
        `;
        tableBody.appendChild(row);
    });
}


// Función para agregar una nueva SIM
function addSIM() {
    const iccid = document.getElementById("new-iccid").value.trim();
    const fechaIngreso = document.getElementById("entry-date").value;

    if (!iccid || !fechaIngreso) {
        showNotification("Por favor, completa todos los campos para agregar una SIM.", "error");
        return;
    }

    const newSIM = {
        iccid,
        id_estado: 1, // "En espera de asignación"
        fecha_creacion: fechaIngreso,
        id_ubicacion: 1 // ID de "LAB DEV"
    };

    fetch(`${API_SIMS_URL}sim-msisdn/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newSIM)
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al agregar la SIM.");
            return response.json();
        })
        .then(() => {
            showNotification("SIM agregada con éxito.", "success");
            loadAllSIMs();
        })
        .catch(error => {
            console.error("Error al agregar la SIM:", error);
            showNotification("Error al agregar la SIM.", "error");
        });
}

// Función para asociar un MSISDN
function associateMSISDN() {
    const iccid = document.getElementById("sim-iccid").value.trim();
    const msisdn = document.getElementById("msisdn").value.trim();

    if (!iccid || !msisdn) {
        showNotification("Por favor, completa todos los campos para asociar un MSISDN.", "error");
        return;
    }

    fetch(`${API_SIMS_URL}sim-msisdn/?iccid=${iccid}`)
        .then(response => response.json())
        .then(simData => {
            if (simData.length === 0) throw new Error("SIM no encontrada.");
            const simId = simData[0].id_sim_msisdn;

            return fetch(`${API_SIMS_URL}msisdn/?msisdn=${msisdn}`)
                .then(response => response.json())
                .then(msisdnData => {
                    if (msisdnData.length === 0) throw new Error("MSISDN no encontrado.");
                    const msisdnId = msisdnData[0].id_msisdn;

                    return fetch(`${API_SIMS_URL}sim-msisdn/${simId}/`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ id_msisdn: msisdnId })
                    });
                });
        })
        .then(() => {
            showNotification("MSISDN asociado con éxito.", "success");
            loadAllSIMs();
        })
        .catch(error => {
            console.error("Error al asociar el MSISDN:", error);
            showNotification("Error al asociar el MSISDN.", "error");
        });
}

// Función para disociar un MSISDN
function disassociateMSISDN() {
    const iccid = document.getElementById("sim-iccid").value.trim();

    if (!iccid) {
        showNotification("Por favor, ingresa el ICCID de la SIM.", "error");
        return;
    }

    // Buscar la SIM por ICCID
    fetch(`${API_SIMS_URL}sim-msisdn/?iccid=${iccid}`)
        .then((response) => {
            if (!response.ok) throw new Error("Error al buscar la SIM.");
            return response.json();
        })
        .then((simData) => {
            if (simData.length === 0) {
                throw new Error("SIM no encontrada.");
            }

            const simId = simData[0].id_sim_msisdn; // Obtener el ID de la SIM
            const updatedSIM = { id_msisdn: null }; // Actualizar el MSISDN a null

            // Actualizar la SIM con el ID obtenido
            return fetch(`${API_SIMS_URL}sim-msisdn/${simId}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedSIM),
            });
        })
        .then((response) => {
            if (!response.ok) throw new Error("Error al disociar el MSISDN.");
            return response.json();
        })
        .then(() => {
            showNotification("MSISDN disociado con éxito.", "success");
            loadAllSIMs(); // Recargar la tabla
        })
        .catch((error) => {
            console.error("Error al disociar el MSISDN:", error);
            showNotification("Error al disociar el MSISDN.", "error");
        });
}



// ============================ EVENTOS DEL DOM ============================
document.addEventListener("DOMContentLoaded", () => {
    loadAllSIMs();
    document.querySelector(".search-sim-btn").addEventListener("click", searchSIMs);
    document.querySelector(".add-sim-btn").addEventListener("click", addSIM);
    document.querySelector(".associate-btn").addEventListener("click", associateMSISDN);
    document.querySelector(".disassociate-btn").addEventListener("click", disassociateMSISDN);
});
