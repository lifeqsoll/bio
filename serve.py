#!/usr/bin/env python3
"""Static server that slices big files into small responses.

Some local clients drop HTTP bodies once they pass about 16KB, which leaves
the page blank. Small files are sent whole. JS and CSS are fetched in slices.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent / "docs"
CHUNK = 12_000
HOST = "127.0.0.1"
PORT = 4173


def asset_names():
    html = (ROOT / "index.html").read_text()
    js = css = None
    for part in html.split('"'):
        name = part.lstrip("./")
        if name.startswith("assets/") and name.endswith(".js"):
            js = name
        if name.startswith("assets/") and name.endswith(".css"):
            css = name
    if not js or not css:
        raise SystemExit("docs/index.html is missing built assets. Run npm run build.")
    return js, css


JS_PATH, CSS_PATH = asset_names()

PAGE = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#061018" />
    <title>lifeqsoll</title>
    <style>html,body{{margin:0;background:#061018;color:#e7eef8}}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      const FILES = {{ js: "{JS_PATH}", css: "{CSS_PATH}" }};
      async function slices(path) {{
        const parts = [];
        for (let i = 0; i < 80; i++) {{
          const r = await fetch("/slice?p=" + encodeURIComponent(path) + "&i=" + i);
          if (r.status === 204) break;
          if (!r.ok) throw new Error("slice " + r.status);
          parts.push(new Uint8Array(await r.arrayBuffer()));
          if (r.headers.get("X-Last") === "1") break;
        }}
        let len = 0;
        for (const p of parts) len += p.length;
        const all = new Uint8Array(len);
        let offset = 0;
        for (const p of parts) {{ all.set(p, offset); offset += p.length; }}
        return all;
      }}
      (async () => {{
        const css = new TextDecoder().decode(await slices(FILES.css));
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
        const blob = new Blob([await slices(FILES.js)], {{ type: "text/javascript" }});
        await import(URL.createObjectURL(blob));
      }})().catch((err) => {{
        document.body.insertAdjacentHTML("beforeend", "<p style=\\"font:16px sans-serif;padding:24px\\">" + err + "</p>");
      }});
    </script>
  </body>
</html>
"""


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            body = PAGE.encode()
            self._send(200, "text/html; charset=utf-8", body)
            return
        if parsed.path == "/slice":
            self._slice(parse_qs(parsed.query))
            return
        rel = unquote(parsed.path).lstrip("/")
        full = (ROOT / rel).resolve()
        if not str(full).startswith(str(ROOT.resolve())) or not full.is_file():
            self.send_error(404)
            return
        data = full.read_bytes()
        if len(data) > 16_000:
            self.send_error(404)
            return
        kind = "application/octet-stream"
        if full.suffix == ".svg":
            kind = "image/svg+xml"
        self._send(200, kind, data)

    def _slice(self, qs):
        try:
            rel = qs["p"][0]
            index = int(qs["i"][0])
        except (KeyError, ValueError):
            self.send_error(400)
            return
        if rel not in {JS_PATH, CSS_PATH} or index < 0:
            self.send_error(404)
            return
        data = (ROOT / rel).read_bytes()
        start = index * CHUNK
        if start >= len(data):
            self.send_response(204)
            self.end_headers()
            return
        chunk = data[start : start + CHUNK]
        last = b"1" if start + CHUNK >= len(data) else b"0"
        self.send_response(200)
        self.send_header("Content-Type", "application/octet-stream")
        self.send_header("Content-Length", str(len(chunk)))
        self.send_header("X-Last", last.decode())
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(chunk)

    def _send(self, code, kind, body):
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)


if __name__ == "__main__":
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"http://{HOST}:{PORT}/", flush=True)
    server.serve_forever()
