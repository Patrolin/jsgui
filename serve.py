import urllib.parse
import http.server
from pathlib import Path
from threading import Thread

HOST = ('localhost', 8000)
http.server.SimpleHTTPRequestHandler.extensions_map = {
  **http.server.SimpleHTTPRequestHandler.extensions_map,
  ".js": "application/javascript",
  ".ts": "application/javascript",
}
class Handler(http.server.SimpleHTTPRequestHandler):
  def do_GET(self):
    url_parts = urllib.parse.urlparse(self.path)
    request_file_path = Path(url_parts.path.strip("/"))

    ext = request_file_path.suffix
    if not request_file_path.is_file() and (ext == ".html" or not ext):
      self.path = '404.html'

    return http.server.SimpleHTTPRequestHandler.do_GET(self)

httpd = http.server.HTTPServer(HOST, Handler, True)
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
