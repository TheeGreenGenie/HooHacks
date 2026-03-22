r"""
Launch script for Wild West Finance backend.
Run from the HooHacks root directory:
  HooVenv\Scripts\python launch_backend.py
"""
import os
import sys
import subprocess
import atexit
import time
from pathlib import Path

ROOT = Path(__file__).parent
ENV_FILE = ROOT / ".env"
BACKEND = ROOT / "HHP" / "backend" / "app"

# Load .env into os.environ
for line in ENV_FILE.read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, _, val = line.partition("=")
    key = key.strip()
    val = val.strip().strip('"').strip("'")  # remove surrounding quotes
    if key and key not in os.environ:
        os.environ[key] = val

# Required backend defaults not in root .env
os.environ.setdefault("SECRET_KEY", "dev-secret-changethis")
os.environ.setdefault("TOTP_SECRET_KEY", "dev-totp-changethis")
os.environ.setdefault("FIRST_SUPERUSER", "admin@wildwestfinance.com")
os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "changethis")
os.environ.setdefault("BACKEND_CORS_ORIGINS",
    '["http://localhost:3000","http://localhost:8000","http://localhost"]')

MONGOD = Path(r"C:\Users\sgama\mongodb\bin\mongod.exe")
MONGO_DATA = Path(r"C:\Users\sgama\mongodb\data\db")
MONGO_DATA.mkdir(parents=True, exist_ok=True)

mongo_proc = subprocess.Popen(
    [str(MONGOD), "--dbpath", str(MONGO_DATA)],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
atexit.register(mongo_proc.terminate)
time.sleep(2)
print(f"[OK] MongoDB started (pid {mongo_proc.pid})")

print("[OK] Environment loaded")
print(f"  MongoDB : {os.environ.get('MONGO_DATABASE_URI', '')[:40]}...")
print(f"  Auth0   : {os.environ.get('AUTH0_DOMAIN', 'not set')}")
print(f"  Gemini  : {'set' if os.environ.get('GEMINI_API_KEY') else 'not set'}")
print(f"  Kroger  : {'set' if os.environ.get('KROGER_CLIENT_ID') else 'not set'}")
print(f"  ElevenLabs: {'set' if os.environ.get('ELEVENLABS_API_KEY') else 'not set'}")
print()
print("Starting backend on http://localhost:8000 ...")
print("Swagger docs -> http://localhost:8000/docs")
print()

subprocess.run(
    [
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload",
    ],
    cwd=BACKEND,
)
