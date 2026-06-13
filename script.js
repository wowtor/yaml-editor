const editor = document.getElementById('editor');
const newBtn = document.getElementById('newBtn');
const saveBtn = document.getElementById('saveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const loadBtn = document.getElementById('loadBtn');
const filenameDisplay = document.getElementById('filename');
const statusDisplay = document.getElementById('status');
const loadModal = new bootstrap.Modal(document.getElementById('loadModal'));
const fileList = document.getElementById('fileList');

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

// Save button - save to server
saveBtn.addEventListener('click', () => {
    if (!currentFilename) {
        currentFilename = prompt('Enter filename (without extension):');
        if (!currentFilename) {
            updateStatus('Save cancelled');
            return;
        }
    }
    
    const content = editor.value;
    const filename = `${currentFilename}.yaml`;
    
    fetch(`/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            filename: filename,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            lastSavedContent = content;
            filenameDisplay.textContent = filename;
            updateStatus(`Saved: ${filename}`);
        } else {
            updateStatus(`Error saving: ${data.error}`);
        }
    })
    .catch(error => {
        updateStatus(`Error: ${error.message}`);
    });
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

// Load button - show file browser
loadBtn.addEventListener('click', () => {
    loadFileList();
    loadModal.show();
});

// Load file list from server
function loadFileList() {
    fileList.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>';
    
    fetch('/files')
        .then(response => response.json())
        .then(data => {
            if (data.files && data.files.length > 0) {
                fileList.innerHTML = '';
                data.files.forEach(file => {
                    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'list-group-item list-group-item-action';
                        btn.textContent = file;
                        btn.addEventListener('click', () => openFile(file));
                        fileList.appendChild(btn);
                    }
                });
                if (fileList.children.length === 0) {
                    fileList.innerHTML = '<div class="alert alert-info mb-0">No YAML files found</div>';
                }
            } else {
                fileList.innerHTML = '<div class="alert alert-info mb-0">No files found</div>';
            }
        })
        .catch(error => {
            fileList.innerHTML = `<div class="alert alert-danger mb-0">Error loading files: ${error.message}</div>`;
        });
}

// Open file from server
function openFile(filename) {
    if (editor.value.trim() && editor.value !== lastSavedContent) {
        if (!confirm('You have unsaved changes. Open file anyway?')) {
            return;
        }
    }
    
    fetch(`/load?file=${encodeURIComponent(filename)}`)
        .then(response => response.text())
        .then(content => {
            editor.value = content;
            currentFilename = filename.replace(/\.(yaml|yml)$/, '');
            lastSavedContent = content;
            filenameDisplay.textContent = filename;
            updateStatus(`Loaded: ${filename}`);
            loadModal.hide();
        })
        .catch(error => {
            updateStatus(`Error loading file: ${error.message}`);
        });
}

// Load first file on startup
window.addEventListener('load', () => {
    fetch('/files')
        .then(response => response.json())
        .then(data => {
            if (data.files && data.files.length > 0) {
                const yamlFiles = data.files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
                if (yamlFiles.length > 0) {
                    openFile(yamlFiles[0]);
                } else {
                    updateStatus('Ready');
                }
            } else {
                updateStatus('Ready');
            }
        })
        .catch(() => {
            updateStatus('Ready');
        });
    editor.focus();
});

function updateStatus(message) {
    statusDisplay.textContent = message;
}
