# YAML Editor

A simple web app for creating, editing, and managing YAML files.

## Features

- **New** - Create a new YAML file
- **Save** - Save file to browser localStorage
- **Download** - Download file as .yaml
- **Load** - Load .yaml or .yml files from disk

## Usage

1. Open `index.html` in a web browser
2. Edit YAML content in the text area
3. Click "New" to create a new file
4. Click "Save" to save to localStorage (enter filename)
5. Click "Download" to download as a YAML file
6. Click "Load" to open a YAML file from your computer

## Storage

- Files are automatically saved to browser localStorage
- Last opened file loads automatically on refresh
- Downloaded files maintain your current filename

## Browser Requirements

- Modern browser with HTML5 File API support
- localStorage support

## No Extra Features

- Plain text editor with monospace font
- Basic file operations only
- No syntax highlighting or validation
