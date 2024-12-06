import { showNotification } from "./alertas.js";

const API_SIMS_URL = "http://127.0.0.1:8001/sims/";

// Variable global para guardar los estados de SIM
let simStates = [];

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

function loadSIMStates() {
    return fetch(`${API_SIMS_URL}estado-sim/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la respuesta: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            simStates = data; // Guardar los estados de SIM en la variable global
            console.log("Estados de SIM cargados:", simStates);
        })
        .catch(error => {
            console.error("Error al cargar los estados de SIM:", error);
            showNotification("Error al cargar los estados de SIM.", "error");
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
        // Buscar el estado correspondiente al id_estado
        const estado = simStates.find(state => state.id === sim.id_estado) || { nombre_estado: "N/A" };

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${sim.iccid}</td>
            <td>${sim.id_msisdn?.msisdn || "Sin Asignar"}</td>
            <td>${sim.fecha_creacion}</td>
            <td>${sim.id_msisdn?.nodo_concert_ip || "N/A"}</td>
            <td>${sim.id_msisdn?.nodo_condor_ip || "N/A"}</td>
            <td>${estado.nombre_estado}</td>
        `;
        tableBody.appendChild(row);
    });
}



// Función para agregar una nueva SIM
function addSIM() {
    const iccidInput = document.getElementById("new-iccid").value.trim();
    const entryDate = document.getElementById("entry-date").value;

    // Validar campos vacíos
    if (!iccidInput || !entryDate) {
        showNotification("Por favor, completa todos los campos para agregar una SIM.", "error");
        return;
    }

    // Datos a enviar
    const newSimData = {
        iccid: iccidInput,
        inicio_relacion: entryDate,
        id_estado: 1, // ID del estado (por defecto: Disponible)
        id_usuario: 5, // Cambiar según usuario autenticado
        fecha_creacion: entryDate,
    };

    console.log("Datos enviados al backend:", newSimData);

    // Enviar datos al backend
    fetch(`${API_SIMS_URL}sim-msisdn/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newSimData),
    })
        .then(response => {
            if (response.ok) {
                showNotification("SIM agregada correctamente.", "success");
                loadAllSIMs(); // Actualizar la tabla
            } else {
                return response.json().then(data => {
                    console.error("Error del backend al agregar SIM:", data);
                    const errorMessage = data.detail || JSON.stringify(data);
                    showNotification(`Error al agregar SIM: ${errorMessage}`, "error");
                });
            }
        })
        .catch(error => {
            console.error("Error de red al agregar SIM:", error);
            showNotification("Error de red al agregar SIM.", "error");
        });
}

// Asociar el evento al botón
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".add-sim-btn").addEventListener("click", addSIM);
});

// Funcion Asociar ICCID con MSISDN
function associateMSISDN() {
    const iccidInput = document.getElementById("sim-iccid").value.trim();
    const msisdnInput = document.getElementById("msisdn").value.trim();

    if (!iccidInput || !msisdnInput) {
        showNotification("Por favor, completa los campos ICCID y MSISDN para asociar.", "error");
        return;
    }

    // Verificar si el MSISDN existe
    fetch(`${API_SIMS_URL}msisdn/`)
        .then(response => response.json())
        .then(msisdnList => {
            const existingMSISDN = msisdnList.find(msisdn => msisdn.msisdn === msisdnInput);

            if (existingMSISDN) {
                // Si el MSISDN existe, asociar directamente
                updateSIMWithMSISDN(iccidInput, msisdnInput);
            } else {
                // Si no existe, preguntar al usuario si desea crearlo
                if (confirm(`El MSISDN ${msisdnInput} no existe. ¿Deseas crearlo?`)) {
                    const nodoConcert = prompt("Ingresa el Nodo Concert IP:");
                    const nodoCondor = prompt("Ingresa el Nodo Condor IP:");

                    if (!nodoConcert || !nodoCondor) {
                        showNotification("Operación cancelada. Debes ingresar todos los datos para crear el MSISDN.", "error");
                        return;
                    }

                    const newMSISDNData = {
                        msisdn: msisdnInput,
                        nodo_concert_ip: nodoConcert,
                        nodo_condor_ip: nodoCondor,
                        id_usuario: 5, // Cambiar según el usuario autenticado
                        fecha_creacion: new Date().toISOString().split("T")[0], // Fecha actual
                    };

                    createMSISDN(newMSISDNData, iccidInput, msisdnInput);
                }
            }
        })
        .catch(error => {
            console.error("Error al verificar el MSISDN:", error);
            showNotification("Error al verificar el MSISDN.", "error");
        });
}

//funcion para crear MSISDN
function createMSISDN(data, iccid, msisdn) {
    fetch(`${API_SIMS_URL}msisdn/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (response.ok) {
                showNotification("MSISDN creado correctamente.", "success");
                updateSIMWithMSISDN(iccid, msisdn); // Asociar después de crearlo
            } else {
                response.json().then(errorData => {
                    console.error("Error al crear el MSISDN:", errorData);
                    showNotification(`Error al crear el MSISDN: ${errorData.error || "Error desconocido"}`, "error");
                });
            }
        })
        .catch(error => {
            console.error("Error de red al crear el MSISDN:", error);
            showNotification("Error de red al crear el MSISDN.", "error");
        });
}

function updateSIMWithMSISDN(iccid, msisdn) {
    const requestData = {
        iccid: iccid,
        msisdn: msisdn,
    };

    fetch(`${API_SIMS_URL}sim-msisdn/update-by-iccid/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
    })
        .then(response => {
            if (response.ok) {
                showNotification("MSISDN asociado correctamente a la SIM.", "success");
                loadAllSIMs(); // Actualizar la tabla
            } else {
                response.json().then(errorData => {
                    console.error("Error al asociar el MSISDN:", errorData);
                    showNotification(`Error al asociar el MSISDN: ${errorData.error || "Error desconocido"}`, "error");
                });
            }
        })
        .catch(error => {
            console.error("Error de red al asociar el MSISDN:", error);
            showNotification("Error de red al asociar el MSISDN.", "error");
        });
}


// Funcion disociar MSISDN
function disassociateMSISDN() {
    const iccidInput = document.getElementById("sim-iccid").value.trim();

    // Validar que el campo ICCID esté completo
    if (!iccidInput) {
        showNotification("Por favor, ingresa un ICCID para disociar el MSISDN.", "error");
        return;
    }

    const requestData = {
        iccid: iccidInput,
        msisdn: null, // Enviar null para disociar
    };

    console.log("Datos enviados para disociar:", requestData);

    fetch(`${API_SIMS_URL}sim-msisdn/update-by-iccid/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
    })
        .then(response => {
            if (response.ok) {
                showNotification("MSISDN disociado correctamente de la SIM.", "success");
                loadAllSIMs(); // Actualizar la tabla
            } else {
                return response.json().then(data => {
                    console.error("Error del backend al disociar MSISDN:", data);
                    showNotification(`Error al disociar MSISDN: ${data.error || "Error desconocido"}`, "error");
                });
            }
        })
        .catch(error => {
            console.error("Error de red al disociar MSISDN:", error);
            showNotification("Error de red al disociar MSISDN.", "error");
        });
}



// ============================ EVENTOS DEL DOM ============================
document.addEventListener("DOMContentLoaded", () => {
    console.log("Cargando estados de SIM...");
    loadSIMStates().then(() => {
        console.log("Cargando SIMs...");
        loadAllSIMs();
    });
    document.querySelector(".search-sim-btn").addEventListener("click", searchSIMs);
    document.querySelector(".add-sim-btn").addEventListener("click", addSIM);
    document.querySelector(".associate-btn").addEventListener("click", associateMSISDN);
    document.querySelector(".disassociate-btn").addEventListener("click", disassociateMSISDN);
});
