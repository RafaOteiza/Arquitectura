export function showNotification(message, type = "success") {
    const notificationContainer = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerText = message;

    notificationContainer.appendChild(notification);

    notification.style.display = "block";
    setTimeout(() => {
        notification.style.opacity = "1";
    }, 10);

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}


