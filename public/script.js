const taskContainer = document.getElementById("taskContainer");
const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskDate = document.getElementById("taskDate");
const filterCompletion = document.getElementById("filterCompletion");
const importTasksInput = document.getElementById("importTasksInput");
const importTasksBtn = document.getElementById("importTasksBtn");
const exportTasksBtn = document.getElementById("exportTasksBtn");

// Load tasks from server
async function loadTasks() {
  try {
    let res = await fetch("/tasks");
    let tasks = await res.json();

    // Apply filter
    if (filterCompletion.value === "completed") tasks = tasks.filter(t => t.completed);
    else if (filterCompletion.value === "notCompleted") tasks = tasks.filter(t => !t.completed);

    taskContainer.innerHTML = "";
    tasks.forEach(renderTask);
  } catch (err) {
    console.error(err);
    alert("Failed to load tasks from server.");
  }
}

function renderTask(task) {
  const card = document.createElement("div");
  card.className = "task-card bg-white rounded-2xl shadow p-4 border-l-4 border-blue-400";

  card.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-xl font-semibold">
          ${task.title} 
          <span class="completed-text text-green-500 font-semibold" style="display: ${task.completed ? 'inline' : 'none'}">(completed)</span>
          <span class="not-completed-text text-red-500 font-semibold" style="display: ${task.completed ? 'none' : 'inline'}">(not completed)</span>
        </h2>
        <p class="text-gray-500 text-sm">Due: ${task.date}</p>
      </div>

      <label class="custom-checkbox relative w-6 h-6">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
        <span class="checkmark absolute inset-0 flex items-center justify-center border-2 border-gray-300 rounded"></span>
      </label>
    </div>

    <textarea
      placeholder="Comments..."
      class="mt-3 w-full border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
    >${task.comments}</textarea>

    <button class="mt-3 text-red-500 hover:text-red-700 text-sm delete-btn">Delete</button>
  `;

  const checkbox = card.querySelector(".task-checkbox");
  const completedText = card.querySelector(".completed-text");
  const notCompletedText = card.querySelector(".not-completed-text");
  const textarea = card.querySelector("textarea");
  const deleteBtn = card.querySelector(".delete-btn");

  // Checkbox toggle
  checkbox.addEventListener("change", () => {
    task.completed = checkbox.checked;
    completedText.style.display = checkbox.checked ? "inline" : "none";
    notCompletedText.style.display = checkbox.checked ? "none" : "inline";
    saveTask(task);
  });

  // Save comments on blur
  textarea.addEventListener("blur", () => {
    task.comments = textarea.value;
    saveTask(task);
  });

  // Delete button
  deleteBtn.addEventListener("click", () => {
    deleteTask(task);
  });

  taskContainer.appendChild(card);
}



// Save or update task on server
async function saveTask(task) {
  try {
    await fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    loadTasks();
  } catch (err) {
    console.error(err);
    alert("Failed to save task to server.");
  }
}

// Delete task on server
async function deleteTask(task) {
  try {
    await fetch("/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: task.title, date: task.date }),
    });
    loadTasks();
  } catch (err) {
    console.error(err);
    alert("Failed to delete task on server.");
  }
}

// Add new task
taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newTask = { title: taskTitle.value, date: taskDate.value, completed: false, comments: "" };
  await saveTask(newTask);
  taskForm.reset();
});

// Filter listener
filterCompletion.addEventListener("change", loadTasks);

// Export tasks
exportTasksBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/tasks");
    const tasks = await res.json();

    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Failed to export tasks.");
  }
});

// Import tasks
importTasksBtn.addEventListener("click", () => importTasksInput.click());
importTasksInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const importedTasks = JSON.parse(event.target.result);
      if (!Array.isArray(importedTasks)) throw new Error("JSON must be an array of tasks.");

      // Replace server tasks
      await fetch("/tasks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importedTasks),
      });

      loadTasks();
      alert("Tasks imported successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to import tasks: " + err.message);
    }
  };
  reader.readAsText(file);

  importTasksInput.value = "";
});

// Initial load
loadTasks();
