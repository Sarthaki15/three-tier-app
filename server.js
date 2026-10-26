// ============================================================
// TIER 2: APPLICATION TIER (business logic + API)
// Sits between the presentation tier (public/) and the data
// tier (db.js). Validates input, applies rules, and shapes
// responses — the presentation tier never touches the database
// directly, and the data tier never knows about HTTP.
// ============================================================

const express = require("express");
const path = require("path");
const data = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the presentation tier as static files
app.use(express.static(path.join(__dirname, "public")));

// ---- API routes ----

// GET /api/tasks -> list all tasks
app.get("/api/tasks", async (req, res, next) => {
  try {
    const tasks = await data.getAllTasks();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks -> create a task { title }
app.post("/api/tasks", async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();

    // Business rule: no empty or overly long titles
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (title.length > 140) {
      return res.status(400).json({ error: "Title must be under 140 characters." });
    }

    const task = await data.createTask(title);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id -> toggle done state
app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid task id." });
    }
    const task = await data.toggleTask(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id -> remove a task
app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid task id." });
    }
    const removed = await data.deleteTask(id);
    if (!removed) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /health -> for ALB / Elastic Beanstalk health checks
app.get("/health", (req, res) => res.status(200).send("OK"));

// Basic error handler so a DB failure doesn't crash the process
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

// Make sure the tasks table exists, then start listening
data.initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Task tracker running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database schema:", err);
    process.exit(1);
  });
