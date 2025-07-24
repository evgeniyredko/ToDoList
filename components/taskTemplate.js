export function createTaskElement(task, index) {
  const li = document.createElement("li");
  li.className = task.done ? "done" : "";
  li.setAttribute("draggable", "true");
  li.dataset.index = index;

  li.innerHTML = `
    <div class="checkbox-wrapper">
      <input 
        type="checkbox" 
        ${task.done ? "checked" : ""} 
        data-index="${index}" 
        data-action="toggle" 
      />
      <span class="custom-checkbox"></span>
      <span class="task-text">${task.text}</span>
    </div>
    <button data-action="delete" data-index="${index}">✖</button>
  `;

  return li;
}
