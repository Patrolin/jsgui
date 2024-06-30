import urllib.parse
import http.server
import re
from pathlib import Path
from threading import Thread

HOST = ('localhost', 8000)
pattern = re.compile('.png|.jpg|.jpeg|.js|.css|.ico|.gif|.svg', re.IGNORECASE)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        request_file_path = Path(url_parts.path.strip("/"))

        ext = request_file_path.suffix
        if not request_file_path.is_file() and not pattern.match(ext):
          self.path = 'index.html'

        return http.server.SimpleHTTPRequestHandler.do_GET(self)

httpd = http.server.HTTPServer(HOST, Handler, False)
httpd.timeout = 0.5
httpd.allow_reuse_address = True
httpd.server_bind()
httpd.server_activate()
def serve_forever(httpd):
  print(f"Running on {httpd.socket.getsockname()}")
  httpd.serve_forever()
thread = Thread(target=serve_forever, args=(httpd, ), daemon=True)
thread.start()
try:
  while True:
    input()
finally:
  print("Shutting down...")
  httpd.shutdown()
