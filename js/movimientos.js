const API_HISTORIAL = "http://127.0.0.1:8002/validadores/historial-ubicaciones/";
const API_VALIDADORES = "http://127.0.0.1:8002/validadores/validadores/";

// Función para cargar movimientos
async function cargarMovimientos() {
    try {
        // Obtener datos de validadores
        const validadoresResponse = await fetch(API_VALIDADORES);
        const validadoresData = validadoresResponse.ok ? await validadoresResponse.json() : [];
        const validadoresMap = validadoresData.reduce((map, validador) => {
            map[validador.id] = validador.amid_val;
            return map;
        }, {});

        // Obtener datos de historial de movimientos
        const movimientosResponse = await fetch(API_HISTORIAL);
        if (movimientosResponse.ok) {
            const movimientos = await movimientosResponse.json();
            const tableBody = document.getElementById("movements-table").querySelector("tbody");
            tableBody.innerHTML = ""; // Limpiar tabla

            movimientos.forEach(mov => {
                const amidVal = validadoresMap[mov.id_validador] || "Desconocido";
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>Validador #${amidVal}</td>
                    <td>${mov.id_movimiento}</td>
                    <td>${mov.fecha_movimiento}</td>
                    <td>${mov.observacion}</td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error("Error al obtener datos de movimientos.");
        }
    } catch (error) {
        console.error("Error de conexión al cargar movimientos:", error);
    }
}

// Funciones de exportación
function exportToCSV() {
    const table = document.getElementById("movements-table");
    let csvContent = "";
    for (let row of table.rows) {
        let rowData = [];
        for (let cell of row.cells) {
            rowData.push(cell.innerText);
        }
        csvContent += rowData.join(",") + "\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "reporte_movimientos.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToExcel() {
    const table = document.getElementById("movements-table");
    const worksheet = XLSX.utils.table_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos");
    XLSX.writeFile(workbook, "reporte_movimientos.xlsx");
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Reporte de Movimientos", 10, 10);
    doc.autoTable({
        html: "#movements-table",
        startY: 20,
    });

    doc.save("reporte_movimientos.pdf");
}

// Evento para exportar
document.getElementById("extract-report-btn").addEventListener("click", function () {
    const format = document.getElementById("report-format").value;

    if (format === "csv") {
        exportToCSV();
    } else if (format === "excel") {
        exportToExcel();
    } else if (format === "pdf") {
        exportToPDF();
    }
});

// Cargar movimientos al iniciar
document.addEventListener("DOMContentLoaded", cargarMovimientos);
