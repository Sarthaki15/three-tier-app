// ============================================================
// TIER 1: PRESENTATION TIER
// Renders the UI and talks to Tier 2 ONLY through fetch() calls
// to the /api/tasks endpoints. It never touches the database.
// ============================================================

const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const errorMsg = document.getElementById("error-msg");
const emptyState = document.getElementById("empty-state");

const tiers = {
  1: document.getElementById("tier-1"),
  2: document.getElementById("tier-2"),
  3: document.getElementById("tier-3"),
};
const wires = {
  12: document.getElementById("wire-12"),
  23: document.getElementById("wire-23"),
};

// Lights up the architecture diagram in sequence so the request
// flow (browser -> server -> database) is visible, not just implied.
function animateRequestFlow() {
  const steps = [
    () => tiers[1].classList.add("active"),
    () => wires[12].classList.add("active"),
    () => tiers[2].classList.add("active"),
    () => wires[23].classList.add("active"),
    () => tiers[3].classList.add("active"),
  ];
  steps.forEach((step, i) => setTimeout(step, i * 120));

  setTimeout(() => {
    Object.values(tiers).forEach((t) => t.classList.remove("active"));
    Object.values(wires).forEach((w) => w.classList.remove("active"));
  }, steps.length * 120 + 500);
}

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.hidden = false;
}

function clearError() {
  errorMsg.hidden = true;
  errorMsg.textContent = "";
}

function renderTasks(tasks) {
  list.innerHTML = "";
  emptyState.hidden = tasks.length > 0;

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark '${escapeHtml(task.title)}' as done" />
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button class="task-delete" type="button">Delete</button>
    `;

    li.querySelector("input").addEventListener("change", () => toggleTask(task.id));
    li.querySelector(".task-delete").addEventListener("click", () => deleteTask(task.id));

    list.appendChild(li);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadTasks() {
  animateRequestFlow();
  const res = await fetch("/api/tasks");
  const tasks = await res.json();
  renderTasks(tasks);
}

async function addTask(title) {
  animateRequestFlow();
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Could not add task.");
  }
  return res.json();
}

async function toggleTask(id) {
  animateRequestFlow();
  await fetch(`/api/tasks/${id}`, { method: "PATCH" });
  loadTasks();
}

async function deleteTask(id) {
  animateRequestFlow();
  await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  loadTasks();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const title = input.value.trim();
  if (!title) return;

  try {
    await addTask(title);
    input.value = "";
    loadTasks();
  } catch (err) {
    showError(err.message);
  }
});

loadTasks();
