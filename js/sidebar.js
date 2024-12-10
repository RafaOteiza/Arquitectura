document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("#accordian ul li a");
    const currentPage = window.location.pathname.split("/").pop(); // Obtiene el nombre de la página actual

    links.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active"); // Aplica la clase activa
        } else {
            link.classList.remove("active");
        }
    });
});
