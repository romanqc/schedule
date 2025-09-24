const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const TASKS_FILE = path.join(__dirname, "backend", "tasks.json");

// Middleware
app.use(express.json());

// Serve static files (index.html, style.css, script.js) from root
app.use(express.static(__dirname));

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Helper: read tasks.json
function readTasks() {
  if (!fs.existsSync(TASKS_FILE)) return [];
  const data = fs.readFileSync(TASKS_FILE, "utf8");
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper: write tasks.json
function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// GET /tasks - return all tasks
app.get("/tasks", (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
});

// POST /tasks - add or update a task
app.post("/tasks", (req, res) => {
  const newTask = req.body;
  if (!newTask.title || !newTask.date) {
    return res.status(400).json({ error: "Task must have title and date" });
  }

  const tasks = readTasks();
  const index = tasks.findIndex(
    t => t.title === newTask.title && t.date === newTask.date
  );
  if (index > -1) tasks[index] = newTask;
  else tasks.push(newTask);

  writeTasks(tasks);
  res.json({ success: true });
});

// DELETE /tasks - delete a task
app.delete("/tasks", (req, res) => {
  const { title, date } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: "Task must have title and date" });
  }

  let tasks = readTasks();
  tasks = tasks.filter(t => !(t.title === title && t.date === date));

  writeTasks(tasks);
  res.json({ success: true });
});

// POST /tasks/import - overwrite tasks.json
app.post("/tasks/import", (req, res) => {
  const importedTasks = req.body;
  if (!Array.isArray(importedTasks)) {
    return res.status(400).json({ error: "Imported data must be an array of tasks" });
  }

  writeTasks(importedTasks);
  res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
