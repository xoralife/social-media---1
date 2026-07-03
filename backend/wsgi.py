import sys
import os

path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.append(path)

os.environ.setdefault("DATABASE_URL", "sqlite:///./backend/instagram.db")

from main import app

# For PythonAnywhere ASGI mode, they need access to the ASGI app
# Configure in Web tab: ASGI app = "wsgi:app"

