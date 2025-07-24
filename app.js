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
    if (action === "delete") {
      tasksByCategory[currentCategory].splice(index, 1);
    }

    if (action === "toggle") {
      tasksByCategory[currentCategory][index].done =
        !tasksByCategory[currentCategory][index].done;
    }

    saveTasks(tasksByCategory);
    renderTasks();
    return; // 🔹 если это действие — не идём дальше
  }

  // --- 🔽 Выделение задачи по клику (если это не кнопка)
  const li = e.target.closest("li");
  if (!li) return;

  li.classList.add("selected");
  selectedTaskIndex = parseInt(li.dataset.index);
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
    el.dataset.index = i;
    list.appendChild(el);
  });
}

let draggedIndex = null;

// начало перетаскивания
list.addEventListener("dragstart", (e) => {
  draggedIndex = e.target.dataset.index;
  e.dataTransfer.effectAllowed = "move";
  e.target.classList.add("dragging"); // 🔹 добавляет визуальный стиль
});

// разрешаем перетаскивание
list.addEventListener("dragover", (e) => {
  e.preventDefault();
});

list.addEventListener("dragend", (e) => {
  e.target.classList.remove("dragging"); // 🔹 возвращает стиль
});

// на какой элемент перетащили
list.addEventListener("drop", (e) => {
  e.preventDefault();
  const targetIndex = e.target.closest("li")?.dataset.index;

  if (
    draggedIndex !== null &&
    targetIndex !== undefined &&
    draggedIndex !== targetIndex
  ) {
    const tasks = tasksByCategory[currentCategory];
    const movedItem = tasks.splice(draggedIndex, 1)[0];
    tasks.splice(targetIndex, 0, movedItem);

    saveTasks(tasksByCategory);
    renderTasks();
  }

  draggedIndex = null;
});

function renderCategories() {
  categoryList.innerHTML = "";

  Object.keys(tasksByCategory).forEach((category, index) => {
    const li = document.createElement("li");
    li.textContent = category;
    li.dataset.category = category;
    li.dataset.index = index;
    li.setAttribute("draggable", "true");
    li.className = category === currentCategory ? "active" : "";
    categoryList.appendChild(li);
  });
}

categoryList.addEventListener("click", (e) => {
  const selected = e.target.dataset.category;
  if (selected) {
    currentCategory = selected;
    renderTasks();
    renderCategories();
  }
});

let draggedCategoryIndex = null;

// dragstart
categoryList.addEventListener("dragstart", (e) => {
  draggedCategoryIndex = e.target.dataset.index;
  e.target.classList.add("dragging");
});

// dragend
categoryList.addEventListener("dragend", (e) => {
  e.target.classList.remove("dragging");
});

// dragover
categoryList.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// drop
categoryList.addEventListener("drop", (e) => {
  e.preventDefault();
  const target = e.target.closest("li");
  const targetIndex = target?.dataset.index;

  if (
    draggedCategoryIndex !== null &&
    targetIndex !== undefined &&
    draggedCategoryIndex !== targetIndex
  ) {
    const keys = Object.keys(tasksByCategory);
    const draggedKey = keys[draggedCategoryIndex];

    // перемещаем ключ в массиве
    keys.splice(draggedCategoryIndex, 1);
    keys.splice(targetIndex, 0, draggedKey);

    // создаём новый объект с обновлённым порядком
    const newTasksByCategory = {};
    keys.forEach((key) => {
      newTasksByCategory[key] = tasksByCategory[key];
    });

    tasksByCategory = newTasksByCategory;
    saveTasks(tasksByCategory);
    renderCategories();
  }

  draggedCategoryIndex = null;
});

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

document.getElementById("move-up").addEventListener("click", () => {
  if (selectedTaskIndex !== null) {
    moveTask("up");
  } else {
    moveCategory("up");
  }
});

document.getElementById("move-down").addEventListener("click", () => {
  if (selectedTaskIndex !== null) {
    moveTask("down");
  } else {
    moveCategory("down");
  }
});

let selectedTaskIndex = null;

function moveTask(direction) {
  const tasks = tasksByCategory[currentCategory];
  const i = selectedTaskIndex;

  if (i === null || i < 0 || i >= tasks.length) return;

  if (direction === "up" && i > 0) {
    [tasks[i - 1], tasks[i]] = [tasks[i], tasks[i - 1]];
    selectedTaskIndex--;
  } else if (direction === "down" && i < tasks.length - 1) {
    [tasks[i], tasks[i + 1]] = [tasks[i + 1], tasks[i]];
    selectedTaskIndex++;
  } else {
    return;
  }

  saveTasks(tasksByCategory);
  renderTasks();

  // повторно выделяем
  const newLi = list.querySelector(`li[data-index="${selectedTaskIndex}"]`);
  if (newLi) newLi.classList.add("selected");
}

function moveCategory(direction) {
  const keys = Object.keys(tasksByCategory);
  const index = keys.indexOf(currentCategory);

  if (direction === "up" && index > 0) {
    [keys[index - 1], keys[index]] = [keys[index], keys[index - 1]];
  } else if (direction === "down" && index < keys.length - 1) {
    [keys[index], keys[index + 1]] = [keys[index + 1], keys[index]];
  } else {
    return;
  }

  const newTasksByCategory = {};
  keys.forEach((key) => {
    newTasksByCategory[key] = tasksByCategory[key];
  });

  tasksByCategory = newTasksByCategory;
  saveTasks(tasksByCategory);
  renderCategories();
}

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

document.addEventListener("click", (e) => {
  const clickedInsideTask = e.target.closest("#task-list");
  const preventDeselect = e.target.closest("[data-no-deselect]");

  if (!clickedInsideTask && !preventDeselect) {
    list
      .querySelectorAll("li")
      .forEach((el) => el.classList.remove("selected"));
    selectedTaskIndex = null;
  }
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("custom-checkbox")) {
    const li = e.target.closest("li");
    const index = li?.dataset.index;

    if (index !== undefined && currentCategory) {
      tasksByCategory[currentCategory][index].done =
        !tasksByCategory[currentCategory][index].done;

      saveTasks(tasksByCategory);
      renderTasks();
    }
  }
});

const toggleBtn = document.getElementById("toggle-controls");
const controls = document.querySelector(".category-controls");

let controlsVisible = false;

toggleBtn.addEventListener("click", () => {
  controlsVisible = !controlsVisible;

  controls.classList.toggle("hidden", !controlsVisible);
  toggleBtn.textContent = controlsVisible ? "❌ Скрыть" : "✏️ Редактировать";
});
