export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  const icon = iconMap[type] || "🔔";

  toast.innerHTML = `
    <span style="margin-right: 8px">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "fadeOut 0.5s forwards"; // запускаем fadeOut перед удалением
    setTimeout(() => toast.remove(), 500); // удаляем после анимации
  }, 2500);
}
