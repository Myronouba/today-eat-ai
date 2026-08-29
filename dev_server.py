"""
今天吃啥 AI 版 · 开发服务器
正规缓存控制：开发环境下所有资源 no-store，浏览器不存储任何副本，每次拿最新。
用法：python dev_server.py [端口]  默认 8765
"""
import sys
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
BIND = "0.0.0.0"  # 允许局域网设备（手机）访问


class DevHandler(SimpleHTTPRequestHandler):
    """开发环境：no-store 禁用缓存，确保每次拿到最新资源。"""

    def end_headers(self):
        # no-store = 禁止存储任何副本（内存/磁盘都不存），浏览器每次请求最新
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = ThreadingHTTPServer((BIND, PORT), DevHandler)
    print(f"今天吃啥 AI 版 · 开发服务器已启动")
    print(f"  本机访问: http://127.0.0.1:{PORT}/index.html")
    print(f"  局域网访问: http://<本机IP>:{PORT}/index.html  (手机同WiFi可用)")
    print(f"  缓存策略: no-store (每次拿最新)")
    print(f"  按 Ctrl+C 停止\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        server.server_close()


if __name__ == "__main__":
    main()
