import { saveTasks, loadTasks } from "./utils/storage.js";
import { createTaskElement } from "./components/taskTemplate.js";
import { showToast } from "./utils/notifications.js";

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const categoryList = document.getElementById("category-list"); // добавим это в HTML

let tasksByCategory = loadTasks();
let currentCategory = Object.keys(tasksByCategory)[0] || "Сегодня";

// Если нет категорий, создаём дефолтную
if (!tasksByCategory[currentCategory]) {
  tasksByCategory[currentCategory] = [];
  saveTasks(tasksByCategory);
}

renderCategories();
renderTasks();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text && currentCategory) {
    tasksByCategory[currentCategory].push({ text, done: false });
    saveTasks(tasksByCategory);
    renderTasks();
    input.value = "";
  }
});

list.addEventListener("click", (e) => {
  const index = e.target.dataset.index;
  const action = e.target.dataset.action;
  if (index !== undefined && action && currentCategory) {
    if (action === "delete") tasksByCategory[currentCategory].splice(index, 1);
    if (action === "toggle") {
      tasksByCategory[currentCategory][index].done =
        !tasksByCategory[currentCategory][index].done;
    }
    saveTasks(tasksByCategory);
    renderTasks();
  }
});

// Выбор категории
categoryList.addEventListener("click", (e) => {
  const selected = e.target.dataset.category;
  if (selected) {
    currentCategory = selected;
    renderTasks();
    renderCategories();
  }
});

function renderTasks() {
  const title = document.getElementById("current-title");
  title.innerHTML = currentCategory;

  list.innerHTML = "";
  const tasks = tasksByCategory[currentCategory] || [];
  tasks.forEach((task, i) => {
    const el = createTaskElement(task, i);
    list.appendChild(el);
  });
}

function renderCategories() {
  categoryList.innerHTML = "";
  for (const category in tasksByCategory) {
    const li = document.createElement("li");
    li.textContent = category;
    li.dataset.category = category;
    li.className = category === currentCategory ? "active" : "";
    categoryList.appendChild(li);
  }
}

// --- Модальное создание новой категории ---
const modalCreate = document.getElementById("modal-create");
const confirmCreateBtn = document.getElementById("confirm-create");
const cancelCreateBtn = document.getElementById("cancel-create");
const newCategoryInput = document.getElementById("new-category-name");

newCategoryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    confirmCreateBtn.click();
  }
});

document.getElementById("add-category").addEventListener("click", () => {
  newCategoryInput.value = "";
  modalCreate.classList.remove("hidden");
  newCategoryInput.focus();
});

confirmCreateBtn.addEventListener("click", () => {
  const name = newCategoryInput.value.trim();
  if (!name) {
    showToast("Название не может быть пустым.", "error");
    return;
  }

  if (tasksByCategory[name]) {
    showToast("Такая категория уже существует.", "error");
    return;
  }

  tasksByCategory[name] = [];
  currentCategory = name;
  saveTasks(tasksByCategory);
  renderCategories();
  renderTasks();
  modalCreate.classList.add("hidden");

  // Добавляем успешное уведомление
  showToast(`Категория "${name}" создана`, "success");
});

cancelCreateBtn.addEventListener("click", () => {
  modalCreate.classList.add("hidden");
});

// Закрытие по клику на фон (создание)
modalCreate.addEventListener("click", (e) => {
  if (e.target === modalCreate) {
    modalCreate.classList.add("hidden");
  }
});

// --- Модальное подтверждение удаления категории ---
const modal = document.getElementById("modal");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");
const modalText = document.getElementById("modal-text");
let categoryToDelete = null;

document.getElementById("delete-category").addEventListener("click", () => {
  if (Object.keys(tasksByCategory).length === 1) {
    showToast("Нельзя удалить последнюю категорию.");
    return;
  }

  categoryToDelete = currentCategory;
  modalText.textContent = `Удалить категорию "${categoryToDelete}" и все задачи в ней?`;
  modal.classList.remove("hidden");
});

confirmDeleteBtn.addEventListener("click", () => {
  if (categoryToDelete) {
    delete tasksByCategory[categoryToDelete];
    currentCategory = Object.keys(tasksByCategory)[0];
    saveTasks(tasksByCategory);
    renderCategories();
    renderTasks();

    showToast(`Категория "${categoryToDelete}" удалена`, "success"); // ✅ сюда
  }
  modal.classList.add("hidden");
  categoryToDelete = null;
});

cancelDeleteBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  categoryToDelete = null;
});

// Закрытие по клику на фон (удаление)
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

// Закрытие по клавише Esc
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.classList.add("hidden");
    modalCreate.classList.add("hidden");
  }
});

// --- Модальное переименование категории ---
const modalRename = document.getElementById("modal-rename");
const renameInput = document.getElementById("rename-category-name");
const confirmRenameBtn = document.getElementById("confirm-rename");
const cancelRenameBtn = document.getElementById("cancel-rename");

// Открытие модалки по клику на ✏️
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "rename-button" && currentCategory) {
    renameInput.value = currentCategory;
    modalRename.classList.remove("hidden");
    renameInput.focus();
  }
});

// Отмена
cancelRenameBtn.addEventListener("click", () => {
  modalRename.classList.add("hidden");
});

// Подтверждение
confirmRenameBtn.addEventListener("click", () => {
  const newName = renameInput.value.trim();

  if (!newName) {
    showToast("Название не может быть пустым.", "error");
    return;
  }

  if (newName === currentCategory) {
    modalRename.classList.add("hidden");
    return;
  }

  if (tasksByCategory[newName]) {
    showToast("Категория с таким именем уже существует.", "error");
    return;
  }

  // Переименование
  tasksByCategory[newName] = tasksByCategory[currentCategory];
  delete tasksByCategory[currentCategory];
  currentCategory = newName;

  saveTasks(tasksByCategory);
  renderCategories();
  renderTasks();
  showToast("Категория переименована", "success");
  modalRename.classList.add("hidden");
});

// Закрытие по клику на фон (переименование)
modalRename.addEventListener("click", (e) => {
  if (e.target === modalRename) {
    modalRename.classList.add("hidden");
  }
});
