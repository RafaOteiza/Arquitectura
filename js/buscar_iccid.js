function buscarICCIDPorAMID(amid) {
    // Primer fetch: obtener los ICCID desde el microservicio en el puerto 8002
    fetch(`http://127.0.0.1:8002/validadores/sim-validador/`)
        .then(response => response.json())
        .then(data => {
            const iccids = data.filter(item => item.amid_val === parseInt(amid)); // Filtrar por AMID
            if (iccids.length === 0) {
                mostrarError("No se encontraron ICCID para el AMID proporcionado.");
                return;
            }

            // Segundo fetch para cada ICCID: obtener detalles desde el microservicio en el puerto 8001
            const tabla = document.getElementById("tabla-iccid");
            tabla.innerHTML = ""; // Limpiar tabla

            iccids.forEach(iccidData => {
                fetch(`http://127.0.0.1:8001/sims/sim-msisdn/?iccid=${iccidData.iccid}`)
                    .then(response => response.json())
                    .then(msisdnData => {
                        const simData = msisdnData[0]; // Obtenemos el primer resultado
                        const fila = document.createElement("tr");
                        fila.innerHTML = `
                            <td>${iccidData.iccid}</td>
                            <td>${iccidData.inicio_relacion}</td>
                            <td>${iccidData.usuario_nombre || "N/A"} ${iccidData.usuario_apellido || ""}</td>
                            <td>${simData?.id_msisdn?.msisdn || "N/A"}</td>
                            <td>${simData?.id_estado?.nombre_estado || "N/A"}</td>
                        `;
                        tabla.appendChild(fila);
                    })
                    .catch(error => console.error("Error al obtener detalles de MSISDN:", error));
            });
        })
        .catch(error => {
            console.error("Error al buscar ICCID:", error);
            mostrarError("Error al realizar la búsqueda.");
        });
}

function mostrarError(mensaje) {
    const tabla = document.getElementById("tabla-iccid");
    tabla.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; color: red;">${mensaje}</td>
        </tr>
    `;
}



function mostrarNotificacion(mensaje, tipo) {
    const container = document.getElementById("notification-container");
    const notificacion = document.createElement("div");
    notificacion.className = `notification ${tipo}`;
    notificacion.innerText = mensaje;

    container.appendChild(notificacion);
    setTimeout(() => {
        notificacion.style.opacity = "1";
        notificacion.style.transform = "translateY(0)";
    }, 10);

    setTimeout(() => {
        notificacion.style.opacity = "0";
        notificacion.style.transform = "translateY(-20px)";
        setTimeout(() => notificacion.remove(), 300);
    }, 5000);
}
