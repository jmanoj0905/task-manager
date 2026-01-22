export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Serve static files
        if (path === '/' || path === '/index.html') {
            return new Response(HTML, { headers: { 'Content-Type': 'text/html' } });
        }
        if (path === '/style.css') {
            return new Response(CSS, { headers: { 'Content-Type': 'text/css' } });
        }
        if (path === '/app.js') {
            return new Response(JS, { headers: { 'Content-Type': 'application/javascript' } });
        }

        // API routes
        if (path === '/tasks') {
            if (request.method === 'GET') return getTasks(env);
            if (request.method === 'POST') return createTask(request, env);
        }

        const match = path.match(/^\/tasks\/(.+)$/);
        if (match) {
            const id = match[1];
            if (request.method === 'PUT') return updateTask(id, request, env);
            if (request.method === 'DELETE') return deleteTask(id, env);
        }

        return new Response('Not Found', { status: 404 });
    }
};

// CRUD operations
async function getTasks(env) {
    const data = await env.TASKS.get('tasks');
    const tasks = data ? JSON.parse(data) : [];
    return Response.json(tasks);
}

async function createTask(request, env) {
    const body = await request.json();
    const data = await env.TASKS.get('tasks');
    const tasks = data ? JSON.parse(data) : [];

    const newTask = {
        id: Date.now().toString(),
        title: body.title,
        description: body.description || '',
        status: body.status || 'pending'
    };

    tasks.push(newTask);
    await env.TASKS.put('tasks', JSON.stringify(tasks));
    return Response.json(newTask);
}

async function updateTask(id, request, env) {
    const body = await request.json();
    const data = await env.TASKS.get('tasks');
    const tasks = data ? JSON.parse(data) : [];

    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return Response.json({ error: 'Not found' }, { status: 404 });

    tasks[index] = { id, title: body.title, description: body.description || '', status: body.status };
    await env.TASKS.put('tasks', JSON.stringify(tasks));
    return Response.json(tasks[index]);
}

async function deleteTask(id, env) {
    const data = await env.TASKS.get('tasks');
    let tasks = data ? JSON.parse(data) : [];
    tasks = tasks.filter(t => t.id !== id);
    await env.TASKS.put('tasks', JSON.stringify(tasks));
    return Response.json({ success: true });
}

// Embedded static files
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Manager</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Task Manager</h1>
        <form id="task-form">
            <input type="hidden" id="task-id">
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" required placeholder="Enter task title">
            </div>
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" rows="3" placeholder="Enter task description"></textarea>
            </div>
            <div class="form-group">
                <label for="status">Status</label>
                <select id="status">
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" id="submit-btn">Add Task</button>
                <button type="button" id="cancel-btn" class="hidden">Cancel</button>
            </div>
        </form>
        <div class="tasks-section">
            <h2>Tasks</h2>
            <div id="tasks-list"></div>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>`;

const CSS = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
    padding: 20px;
}
.container { max-width: 600px; margin: 0 auto; }
h1 { text-align: center; color: #333; margin-bottom: 30px; }
h2 { color: #333; margin-bottom: 15px; }
form {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 30px;
}
.form-group { margin-bottom: 15px; }
label { display: block; margin-bottom: 5px; font-weight: 500; color: #555; }
input[type="text"], textarea, select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}
input[type="text"]:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #007bff;
}
.form-actions { display: flex; gap: 10px; }
button {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
}
#submit-btn { background: #007bff; color: #fff; }
#submit-btn:hover { background: #0056b3; }
#cancel-btn { background: #6c757d; color: #fff; }
#cancel-btn:hover { background: #545b62; }
.hidden { display: none; }
.tasks-section {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.task-card {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 10px;
    background: #fafafa;
}
.task-card:last-child { margin-bottom: 0; }
.task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
}
.task-title { font-weight: 600; color: #333; font-size: 16px; }
.task-status {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}
.status-pending { background: #fff3cd; color: #856404; }
.status-in-progress { background: #cce5ff; color: #004085; }
.status-completed { background: #d4edda; color: #155724; }
.task-description { color: #666; font-size: 14px; margin-bottom: 12px; line-height: 1.4; }
.task-actions { display: flex; gap: 8px; }
.task-actions button { padding: 6px 12px; font-size: 12px; }
.btn-edit { background: #28a745; color: #fff; }
.btn-edit:hover { background: #1e7e34; }
.btn-delete { background: #dc3545; color: #fff; }
.btn-delete:hover { background: #c82333; }
.empty-state { text-align: center; color: #999; padding: 30px; }`;

const JS = `const form = document.getElementById('task-form');
const taskIdField = document.getElementById('task-id');
const titleField = document.getElementById('title');
const descriptionField = document.getElementById('description');
const statusField = document.getElementById('status');
const submitButton = document.getElementById('submit-btn');
const cancelButton = document.getElementById('cancel-btn');
const tasksList = document.getElementById('tasks-list');

loadTasks();

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

function displayTasks(tasks) {
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state">No tasks yet. Add one above!</div>';
        return;
    }
    tasksList.innerHTML = '';
    for (const task of tasks) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = \`
            <div class="task-header">
                <span class="task-title">\${escapeHTML(task.title)}</span>
                <span class="task-status status-\${task.status}">\${formatStatus(task.status)}</span>
            </div>
            \${task.description ? \`<p class="task-description">\${escapeHTML(task.description)}</p>\` : ''}
            <div class="task-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
        \`;
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

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatStatus(status) {
    return status.replace('-', ' ').replace(/\\b\\w/g, c => c.toUpperCase());
}`;
