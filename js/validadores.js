import { showNotification } from "./alertas.js";

const API_VALIDADORES_URL = "http://127.0.0.1:8002/validadores/";

// ======================== FUNCIONES PARA VALIDADORES ========================

// Función para cargar validadores
function loadValidadores() {
    fetch(`${API_VALIDADORES_URL}validadores/`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector(".table-section table tbody");
            tableBody.innerHTML = ""; // Limpiar la tabla

            data.forEach(validador => {
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
        })
        .catch(error => console.error("Error al cargar validadores:", error));
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
            // Transformar datos para Excel
            const rows = data.map(validador => ({
                AMID: validador.amid_val,
                "Fecha Último Movimiento": validador.fecha_creacion,
                Estado: validador.id_estado_validador?.nombre_estado || "N/A",
                Ubicación: validador.id_ubicacion?.nombre_ubicacion || "N/A"
            }));

            // Crear hoja de Excel
            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Validadores");

            // Exportar como archivo Excel
            XLSX.writeFile(workbook, "validadores_reporte.xlsx");
        })
        .catch(error => console.error("Error al generar reporte Excel:", error));
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
        const requiredHeaders = ["serie", "amid", "modelo", "fecha_ingreso", "observacion"];
        const headers = Object.keys(validadores[0]);
        if (!requiredHeaders.every(header => headers.includes(header))) {
            showToast("El archivo Excel debe contener los encabezados: serie, amid, modelo, fecha_ingreso, observacion.", "error");
            return;
        }

        // Preparar los datos para enviarlos al backend
        const processedValidadores = validadores.map(row => ({
            serie_val: row.serie,
            amid_val: row.amid,
            modelo: row.modelo,
            fecha_creacion: row.fecha_ingreso,
            observacion: row.observacion,
            id_ubicacion: 1, // Ubicación por defecto
            id_estado_validador: 1, // Estado por defecto
            id_usuario: 1 // Usuario por defecto
        }));

        // Enviar datos al backend
        fetch(`${API_VALIDADORES_URL}validadores/bulk_create/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processedValidadores)
        })
            .then(response => response.json())
            .then(() => {
                showToast("Carga masiva realizada con éxito.");
                loadValidadores(); // Refrescar tabla
            })
            .catch(error => console.error("Error en la carga masiva desde Excel:", error));
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
