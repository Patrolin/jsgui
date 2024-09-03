import urllib.parse
import http.server
from threading import Thread
from os.path import isfile

HOST = ('localhost', 8000)
http.server.SimpleHTTPRequestHandler.extensions_map = {
  **http.server.SimpleHTTPRequestHandler.extensions_map,
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".ts": "application/javascript",
}
class Handler(http.server.SimpleHTTPRequestHandler):
  def do_GET(self):
    relative_path = urllib.parse.urlparse(self.path).path.strip("/")
    if isfile(relative_path):
      pass
    elif isfile(relative_path.removeprefix("jsgui/")): # simulate gh-pages behavior
      self.path = self.path.removeprefix("/jsgui")
    else:
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
