import { showNotification } from "./alertas.js";

const API_VALIDADORES_URL = "http://127.0.0.1:8002/validadores/";

// ======================== FUNCIONES PARA VALIDADORES ========================

// Función para cargar validadores
let currentPage = 1; // Página actual
const rowsPerPage = 14; // Cantidad de filas por página

function loadValidadores(page = 1) {
    fetch(`${API_VALIDADORES_URL}validadores/`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector(".table-section table tbody");
            tableBody.innerHTML = ""; // Limpiar la tabla

            // Ordenar los validadores por fecha (descendente)
            data.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));

            // Calcular el rango de datos a mostrar
            const startIndex = (page - 1) * rowsPerPage;
            const endIndex = startIndex + rowsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);

            // Crear las filas para la tabla
            paginatedData.forEach(validador => {
                const estado = validador.estado_validador_nombre || "No asignado";
                const ubicacion = validador.ubicacion_nombre || "No asignada";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${validador.amid_val}</td>
                    <td>${validador.fecha_creacion}</td>
                    <td>${estado}</td>
                    <td>${ubicacion}</td>
                `;
                tableBody.appendChild(row);
            });

            // Actualizar botones de paginación
            updatePaginationControls(page, data.length);
        })
        .catch(error => console.error("Error al cargar validadores:", error));
}

function updatePaginationControls(currentPage, totalRows) {
    const paginationControls = document.querySelector(".pagination-controls");
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    paginationControls.innerHTML = ""; // Limpiar los controles previos

    // Botón de página anterior
    const prevButton = document.createElement("button");
    prevButton.textContent = "Anterior";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadValidadores(currentPage);
        }
    });
    paginationControls.appendChild(prevButton);

    // Botón de página siguiente
    const nextButton = document.createElement("button");
    nextButton.textContent = "Siguiente";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadValidadores(currentPage);
        }
    });
    paginationControls.appendChild(nextButton);

    // Mostrar información de página
    const pageInfo = document.createElement("span");
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    paginationControls.appendChild(pageInfo);
}


// Función para cambiar el estado de un validador
function changeEstadoValidador() {
    const amidVal = document.getElementById("change-amid").value;
    const nuevoEstado = parseInt(document.getElementById("new-status").value, 10);

    fetch(`${API_VALIDADORES_URL}validadores/search_by_amid/?amid=${amidVal}`)
        .then(response => {
            if (!response.ok) throw new Error("No se encontró el validador con el AMID especificado.");
            return response.json();
        })
        .then(data => {
            const idValidador = data.id;

            return fetch(`${API_VALIDADORES_URL}validadores/${idValidador}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_estado_validador: nuevoEstado })
            });
        })
        .then(response => {
            if (!response.ok) throw new Error("Error al actualizar el estado del validador.");
            showNotification("Estado del validador actualizado con éxito.", "success");
            loadValidadores();
        })
        .catch(error => {
            console.error("Error al cambiar el estado del validador:", error);
            showNotification("Error al cambiar el estado del validador.", "error");
        });
}

// Función para agregar un nuevo validador
function addValidador() {
    const serie = document.getElementById("new-series").value;
    const amid = document.getElementById("new-amid").value;
    const modelo = document.getElementById("new-model").value;
    const fecha = document.getElementById("entry-date").value;
    const observacion = document.getElementById("observation").value;

    if (!serie || !amid || !modelo || !fecha || !observacion) {
        showNotification("Completa todos los campos.", "error");
        return;
    }

    const validadorData = {
        serie_val: serie,
        amid_val: amid,
        modelo: modelo,
        fecha_creacion: fecha,
        observacion,
        id_ubicacion: 1,
        id_estado_validador: 1,
        id_usuario: 1,
    };

    fetch(`${API_VALIDADORES_URL}validadores/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validadorData),
    })
        .then(response => {
            if (!response.ok) throw new Error("Error al agregar el validador.");
            return response.json();
        })
        .then(() => {
            showNotification("Validador agregado con éxito.", "success");
            loadValidadores();
        })
        .catch(error => {
            console.error("Error al agregar validador:", error);
            showNotification("Error al agregar validador.", "error");
        });
}

// Función para cargar los estados
function loadEstadosValidador() {
    fetch(`${API_VALIDADORES_URL}estados-validador/`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById("new-status");
            data.forEach(estado => {
                const option = document.createElement("option");
                option.value = estado.id;
                option.textContent = estado.nombre_estado;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Error al cargar estados:", error);
            showNotification("Error al cargar estados.", "error");
        });
}

// Función para Extraer Reporte en Formato Excel
function extractReportExcel() {
    fetch(`${API_VALIDADORES_URL}validadores/`)
        .then(response => response.json())
        .then(data => {
            // Transformar datos para Excel con todos los campos disponibles
            const rows = data.map(validador => ({
                ID: validador.id,
                Serie: validador.serie_val, // No convertir explícitamente a número aquí
                AMID: validador.amid_val,
                Modelo: validador.modelo,
                "Fecha Último Movimiento": validador.fecha_creacion,
                Estado: validador.estado_validador_nombre || "N/A",
                Ubicación: validador.ubicacion_nombre || "N/A",
                "Usuario ID": validador.id_usuario,
                "Usuario Nombre": validador.usuario_nombre || "N/A",
                "Usuario Apellido": validador.usuario_apellido || "N/A",
                "Usuario Correo": validador.usuario_correo || "N/A"
            }));

            // Crear hoja de Excel
            const worksheet = XLSX.utils.json_to_sheet(rows);

            // Ajustar el formato de la columna Serie como numérico
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
                const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: 1 }); // Columna Serie es índice 1
                const cell = worksheet[cellAddress];
                if (cell && !isNaN(cell.v)) {
                    cell.z = '0'; // Configurar formato como número simple
                    cell.t = 'n'; // Establecer tipo de celda como numérico
                }
            }

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Validadores");

            // Obtener la fecha actual en formato YYYY-MM-DD
            const today = new Date().toISOString().split("T")[0];

            // Exportar como archivo Excel con el nombre incluyendo la fecha
            XLSX.writeFile(workbook, `reporte_validadores_${today}.xlsx`);
        })
        .catch(error => {
            console.error("Error al generar reporte Excel:", error);
            showNotification("Error al generar el reporte.", "error");
        });
}



// Función para manejar la Carga Masiva desde un archivo Excel
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Leer la primera hoja del archivo Excel
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir la hoja a JSON
        const validadores = XLSX.utils.sheet_to_json(worksheet);

        // Validar encabezados requeridos
        const requiredHeaders = ["serie_val", "amid_val", "modelo"];
        const headers = Object.keys(validadores[0]);
        if (!requiredHeaders.every(header => headers.includes(header))) {
            showNotification("El archivo Excel debe contener los encabezados: serie_val, amid_val, modelo.", "error");
            return;
        }

        const errores = [];
        let procesados = 0;

        validadores.forEach((row, index) => {
            const validadorData = {
                serie_val: row.serie_val,
                amid_val: row.amid_val,
                modelo: row.modelo,
                fecha_creacion: new Date().toISOString().split("T")[0], // Fecha actual
                id_ubicacion: 6, // LAB-DEV
                id_estado_validador: 2, // DISPONIBLE
                id_usuario: 5 // Ajusta esto según el usuario logueado
            };

            // Reutilizamos la lógica de `addValidador`
            fetch(`${API_VALIDADORES_URL}validadores/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validadorData)
            })
                .then(response => {
                    if (!response.ok) {
                        errores.push(`Fila ${index + 2}: Error al cargar el validador ${row.serie_val}`);
                    }
                })
                .catch(() => {
                    errores.push(`Fila ${index + 2}: Error de red al cargar el validador ${row.serie_val}`);
                })
                .finally(() => {
                    procesados++;
                    if (procesados === validadores.length) {
                        // Mostrar resultados al completar todas las solicitudes
                        if (errores.length) {
                            showNotification(`Errores durante la carga:\n${errores.join("\n")}`, "error");
                        } else {
                            showNotification("Carga masiva realizada con éxito.", "success");
                            loadValidadores(); // Refrescar tabla
                        }
                    }
                });
        });
    };

    reader.readAsArrayBuffer(file);
}

// ============================ EVENTOS DEL DOM ============================

document.addEventListener("DOMContentLoaded", function () {
    loadValidadores();
    loadEstadosValidador();

    document.querySelector(".change-status-btn").addEventListener("click", changeEstadoValidador);
    document.querySelector(".add-validador-btn").addEventListener("click", addValidador);
    document.querySelector(".report-button").addEventListener("click", extractReportExcel);
    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = ".xlsx";
    uploadInput.style.display = "none";
    uploadInput.addEventListener("change", handleExcelUpload);

    document.querySelector(".upload-button").addEventListener("click", () => uploadInput.click());
});