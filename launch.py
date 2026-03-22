r"""
launch.py — Start everything at once: MongoDB, Backend, Frontend, ngrok.

Usage (from HooHacks root):
  HooVenv\Scripts\python launch.py

Ctrl+C stops all processes.
"""
import os
import sys
import subprocess
import atexit
import time
from pathlib import Path

ROOT     = Path(__file__).parent
ENV_FILE = ROOT / ".env"
BACKEND  = ROOT / "HHP" / "backend" / "app"
FRONTEND = ROOT / "HHP" / "frontend"

STATIC_DOMAIN = "demersal-nonhabitably-chaya.ngrok-free.dev"

# ── Load root .env ────────────────────────────────────────────────────────────
for line in ENV_FILE.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, val = line.partition("=")
    key = key.strip()
    val = val.strip().strip('"').strip("'")
    if key and key not in os.environ:
        os.environ[key] = val

os.environ.setdefault("SECRET_KEY",               "dev-secret-changethis")
os.environ.setdefault("TOTP_SECRET_KEY",          "dev-totp-changethis")
os.environ.setdefault("FIRST_SUPERUSER",          "admin@wildwestfinance.com")
os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "changethis")
os.environ.setdefault("BACKEND_CORS_ORIGINS",
    '["http://localhost:3000","http://localhost:8000","http://localhost",'
    f'"https://{STATIC_DOMAIN}"]')

procs: list[subprocess.Popen] = []

def stop_all():
    for p in procs:
        try:
            p.terminate()
        except Exception:
            pass

atexit.register(stop_all)

# ── 1. MongoDB ────────────────────────────────────────────────────────────────
MONGOD     = Path(r"C:\Users\sgama\mongodb\bin\mongod.exe")
MONGO_DATA = Path(r"C:\Users\sgama\mongodb\data\db")
MONGO_DATA.mkdir(parents=True, exist_ok=True)

mongo_proc = subprocess.Popen(
    [str(MONGOD), "--dbpath", str(MONGO_DATA)],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
procs.append(mongo_proc)
time.sleep(2)
print(f"[OK] MongoDB     pid {mongo_proc.pid}")

# ── 2. Backend (uvicorn) ──────────────────────────────────────────────────────
backend_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app",
     "--host", "0.0.0.0", "--port", "8000", "--reload"],
    cwd=BACKEND,
)
procs.append(backend_proc)
time.sleep(2)
print(f"[OK] Backend     pid {backend_proc.pid}  →  http://localhost:8000")

# ── 3. Frontend (npm run dev) ─────────────────────────────────────────────────
frontend_proc = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=FRONTEND,
    shell=True,
)
procs.append(frontend_proc)
time.sleep(4)
print(f"[OK] Frontend    pid {frontend_proc.pid}  →  http://localhost:3000")

# ── 4. ngrok ──────────────────────────────────────────────────────────────────
ngrok_proc = subprocess.Popen(
    f"ngrok http --domain={STATIC_DOMAIN} 3000",
    shell=True,
)
procs.append(ngrok_proc)
time.sleep(2)
print(f"[OK] ngrok       pid {ngrok_proc.pid}   →  https://{STATIC_DOMAIN}")

print()
print("=" * 60)
print("  Frontier Finance is LIVE")
print(f"  https://{STATIC_DOMAIN}")
print("=" * 60)
print("  Ctrl+C to stop everything.\n")

try:
    # Keep running until Ctrl+C or any process dies
    while True:
        for p in procs:
            if p.poll() is not None:
                print(f"[WARN] Process {p.pid} exited unexpectedly.")
        time.sleep(5)
except KeyboardInterrupt:
    print("\n[launch] Shutting down all processes...")
    stop_all()
