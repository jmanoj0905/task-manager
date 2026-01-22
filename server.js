const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;
const CSV_FILE = path.join(__dirname, 'tasks.csv');

app.use(express.json());
app.use(express.static(__dirname));

// CSV helpers

function initCSV() {
    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, 'id,title,description,status\n');
    }
}

function readCSV() {
    initCSV();
    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length <= 1) return [];

    return lines.slice(1).map(line => {
        const [id, title, description, status] = parseCSVLine(line);
        return { id, title, description, status };
    });
}

// Handles commas inside quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

function writeCSV(tasks) {
    const header = 'id,title,description,status\n';
    const rows = tasks.map(t => {
        const title = `"${t.title.replace(/"/g, '""')}"`;
        const desc = `"${t.description.replace(/"/g, '""')}"`;
        return `${t.id},${title},${desc},${t.status}`;
    }).join('\n');

    fs.writeFileSync(CSV_FILE, header + rows);
}

// Routes

app.get('/tasks', (req, res) => {
    res.json(readCSV());
});

app.post('/tasks', (req, res) => {
    const tasks = readCSV();
    const newTask = {
        id: Date.now().toString(),
        title: req.body.title,
        description: req.body.description || '',
        status: req.body.status || 'pending'
    };
    tasks.push(newTask);
    writeCSV(tasks);
    res.json(newTask);
});

app.put('/tasks/:id', (req, res) => {
    const tasks = readCSV();
    const index = tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Task not found' });

    tasks[index] = {
        id: req.params.id,
        title: req.body.title,
        description: req.body.description || '',
        status: req.body.status
    };
    writeCSV(tasks);
    res.json(tasks[index]);
});

app.delete('/tasks/:id', (req, res) => {
    let tasks = readCSV();
    tasks = tasks.filter(t => t.id !== req.params.id);
    writeCSV(tasks);
    res.json({ success: true });
});

app.listen(PORT, () => {
    initCSV();
    console.log(`Server running at http://localhost:${PORT}`);
});
