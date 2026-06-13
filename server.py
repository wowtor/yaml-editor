#!/usr/bin/env python3
"""
Python web server for the YAML Editor app.
Run: python3 server.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def log_message(self, format, *args):
        """Override to add custom logging with timestamps and methods"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if len(args) >= 2:
            method = self.command
            path = args[0]
            code = args[1]
            print(f"[{timestamp}] {method} {path} -> {code}")
        else:
            print(f"[{timestamp}] {format % args}")

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # List files endpoint
        if parsed_path.path == '/files':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            files = [f for f in os.listdir(DIRECTORY) 
                    if os.path.isfile(os.path.join(DIRECTORY, f)) and 
                    (f.endswith('.yaml') or f.endswith('.yml'))]
            files.sort()
            
            response = json.dumps({'files': files})
            self.wfile.write(response.encode())
            return
        
        # Load file endpoint
        if parsed_path.path == '/load':
            query_params = parse_qs(parsed_path.query)
            filename = query_params.get('file', [None])[0]
            
            if not filename:
                self.send_response(400)
                self.end_headers()
                return
            
            filepath = DIRECTORY / filename
            
            # Security check: prevent path traversal
            try:
                filepath.resolve().relative_to(DIRECTORY.resolve())
            except ValueError:
                self.send_response(403)
                self.end_headers()
                return
            
            if filepath.exists() and (filename.endswith('.yaml') or filename.endswith('.yml')):
                self.send_response(200)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                with open(filepath, 'r') as f:
                    self.wfile.write(f.read().encode())
            else:
                self.send_response(404)
                self.end_headers()
            return
        
        # Default behavior for other GET requests
        super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        # Save file endpoint
        if parsed_path.path == '/save':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode())
                filename = data.get('filename')
                content = data.get('content', '')
                
                if not filename:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'No filename'}).encode())
                    return
                
                filepath = DIRECTORY / filename
                
                # Security check: prevent path traversal
                try:
                    filepath.resolve().relative_to(DIRECTORY.resolve())
                except ValueError:
                    self.send_response(403)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Access denied'}).encode())
                    return
                
                if filename.endswith('.yaml') or filename.endswith('.yml'):
                    with open(filepath, 'w') as f:
                        f.write(content)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': True}).encode())
                else:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'success': False, 'error': 'Only .yaml and .yml files allowed'}).encode())
            
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': 'Invalid JSON'}).encode())
            
            return
        
        self.send_response(404)
        self.end_headers()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 YAML Editor server running at http://localhost:{PORT}")
        print(f"📁 Serving files from: {DIRECTORY}")
        print("📋 Logging all requests...")
        print("Press Ctrl+C to stop the server\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✓ Server stopped")
