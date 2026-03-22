"""
launch_ngrok.py — Expose Frontier Finance via ngrok static domain.

Prerequisites:
  1. Install ngrok: https://ngrok.com/download  (or: winget install ngrok)
  2. Authenticate:  ngrok config add-authtoken <YOUR_TOKEN>
     Get token at:  https://dashboard.ngrok.com/get-started/your-authtoken
  3. Both servers must already be running:
       - Backend:  python launch_backend.py       (port 8000)
       - Frontend: cd HHP/frontend && npm run dev (port 3000)

Usage:
  python launch_ngrok.py
"""
import subprocess
import sys

STATIC_DOMAIN = "demersal-nonhabitably-chaya.ngrok-free.dev"
FRONTEND_PORT = 3000


def main():
    print("=" * 60)
    print("  Frontier Finance — ngrok launcher")
    print("=" * 60)
    print(f"  URL : https://{STATIC_DOMAIN}")
    print(f"  Port: {FRONTEND_PORT} (Next.js proxies /api/v1/* to :8000)")
    print()
    print("  Press Ctrl+C to stop.")
    print("=" * 60)

    try:
        subprocess.run(
            f"ngrok http --domain={STATIC_DOMAIN} {FRONTEND_PORT}",
            check=True,
            shell=True,
        )
    except KeyboardInterrupt:
        print("\n[ngrok] Tunnel closed.")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] ngrok exited with code {e.returncode}")
        print("        Check authtoken: ngrok config add-authtoken <TOKEN>")
        sys.exit(1)


if __name__ == "__main__":
    main()
