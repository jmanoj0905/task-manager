// DOM elements
const form = document.getElementById('task-form');
const taskIdField = document.getElementById('task-id');
const titleField = document.getElementById('title');
const descriptionField = document.getElementById('description');
const statusField = document.getElementById('status');
const submitButton = document.getElementById('submit-btn');
const cancelButton = document.getElementById('cancel-btn');
const tasksList = document.getElementById('tasks-list');

// Init
loadTasks();

// Event handlers
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const task = {
        title: titleField.value.trim(),
        description: descriptionField.value.trim(),
        status: statusField.value
    };

    if (taskIdField.value) {
        await updateTask(taskIdField.value, task);
    } else {
        await createTask(task);
    }

    resetForm();
    loadTasks();
});

cancelButton.addEventListener('click', resetForm);

// CRUD operations
async function loadTasks() {
    const response = await fetch('/tasks');
    const tasks = await response.json();
    displayTasks(tasks);
}

async function createTask(task) {
    await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
}

async function updateTask(id, task) {
    await fetch('/tasks/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await fetch('/tasks/' + id, { method: 'DELETE' });
    loadTasks();
}

// UI functions
function displayTasks(tasks) {
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
        return;
    }

    tasksList.innerHTML = '';

    for (const task of tasks) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-header">
                <span class="task-title">${escapeHTML(task.title)}</span>
                <span class="task-status status-${task.status}">${formatStatus(task.status)}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
            <div class="task-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
        `;

        card.querySelector('.btn-edit').addEventListener('click', () => editTask(task));
        card.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id));

        tasksList.appendChild(card);
    }
}

function editTask(task) {
    taskIdField.value = task.id;
    titleField.value = task.title;
    descriptionField.value = task.description;
    statusField.value = task.status;
    submitButton.textContent = 'Update Task';
    cancelButton.classList.remove('hidden');
    titleField.focus();
}

function resetForm() {
    form.reset();
    taskIdField.value = '';
    submitButton.textContent = 'Add Task';
    cancelButton.classList.add('hidden');
}

// Helpers
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatStatus(status) {
    return status.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
}
