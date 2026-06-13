const editor = document.getElementById('editor');
const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loadBtn = document.getElementById('loadBtn');
const filenameDisplay = document.getElementById('filename');
const statusDisplay = document.getElementById('status');

let currentFilename = null;
let lastSavedContent = '';

// New button - clear editor
newBtn.addEventListener('click', () => {
    if (editor.value.trim() && editor.value !== lastSavedContent) {
        if (!confirm('You have unsaved changes. Create a new file anyway?')) {
            return;
        }
    }
    editor.value = '';
    currentFilename = null;
    filenameDisplay.textContent = '';
    updateStatus('New file created');
});

// Save button - save to localStorage
saveBtn.addEventListener('click', () => {
    if (!currentFilename) {
        currentFilename = prompt('Enter filename (without extension):');
        if (!currentFilename) {
            updateStatus('Save cancelled');
            return;
        }
    }
    
    const content = editor.value;
    localStorage.setItem(currentFilename, content);
    lastSavedContent = content;
    filenameDisplay.textContent = `${currentFilename}.yaml`;
    updateStatus(`Saved to localStorage: ${currentFilename}`);
});

// Download button - download as YAML file
downloadBtn.addEventListener('click', () => {
    const content = editor.value;
    if (!content.trim()) {
        updateStatus('Cannot download empty file');
        return;
    }
    
    const filename = currentFilename ? `${currentFilename}.yaml` : 'document.yaml';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    updateStatus(`Downloaded: ${filename}`);
});

// Load button - open file dialog
document.querySelector('.file-input-wrapper button').addEventListener('click', () => {
    loadBtn.click();
});

// Load button - load YAML file
loadBtn.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (editor.value.trim() && editor.value !== lastSavedContent) {
        if (!confirm('You have unsaved changes. Load file anyway?')) {
            loadBtn.value = '';
            return;
        }
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            editor.value = event.target.result;
            currentFilename = file.name.replace(/\.(yaml|yml)$/, '');
            lastSavedContent = editor.value;
            filenameDisplay.textContent = file.name;
            updateStatus(`Loaded: ${file.name}`);
        } catch (error) {
            updateStatus(`Error loading file: ${error.message}`);
        }
    };
    reader.readAsText(file);
    loadBtn.value = '';
});

// Load from localStorage on startup
window.addEventListener('load', () => {
    const savedFiles = Object.keys(localStorage);
    if (savedFiles.length > 0) {
        const filename = savedFiles[0];
        const content = localStorage.getItem(filename);
        editor.value = content;
        currentFilename = filename;
        lastSavedContent = content;
        filenameDisplay.textContent = `${filename}.yaml`;
        updateStatus(`Loaded from localStorage: ${filename}`);
    } else {
        updateStatus('Ready');
    }
    editor.focus();
});

function updateStatus(message) {
    statusDisplay.textContent = message;
}
