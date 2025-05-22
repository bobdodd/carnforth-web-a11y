#!/usr/bin/env python3
"""
Simple HTTP server for testing Carnforth Web A11y fixtures
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import quote

# Configure the server
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

# Start the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    print(f"Server directory: {DIRECTORY}")
    
    # Print URLs for the test fixtures
    fixtures_dir = os.path.join(DIRECTORY, "fixtures")
    if os.path.exists(fixtures_dir):
        print("\nAvailable test fixtures:")
        for fixture in sorted(os.listdir(fixtures_dir)):
            if fixture.endswith(".html"):
                fixture_url = f"http://localhost:{PORT}/fixtures/{quote(fixture)}"
                print(f"- {fixture}: {fixture_url}")
                
                # Open the maps test in the browser
                if fixture == "maps_test.html":
                    print(f"\nOpening maps_test.html in your default browser...")
                    webbrowser.open(fixture_url)
    
    # Run the server
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")