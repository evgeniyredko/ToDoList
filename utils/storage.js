export function saveTasks(data) {
  localStorage.setItem("tasksByCategory", JSON.stringify(data));
}

export function loadTasks() {
  const raw = localStorage.getItem("tasksByCategory");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Ошибка парсинга tasksByCategory:", raw, e);
    return {};
  }
}
