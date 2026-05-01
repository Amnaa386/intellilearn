import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path
from uuid import uuid4

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import connect_to_database, get_database
from app.core.config import settings
from app.core.security import get_password_hash


def _required_env(name: str) -> str:
    fallback = getattr(settings, name, "")
    value = (os.getenv(name) or fallback or "").strip()
    if not value:
        raise ValueError(f"Missing required env var: {name}")
    return value


async def seed_admin_user() -> None:
    await connect_to_database()
    db = get_database()
    if db is None:
        raise RuntimeError("Database connection is not available")

    admin_email = _required_env("ADMIN_EMAIL").lower()
    admin_password = _required_env("ADMIN_PASSWORD")
    admin_name = (os.getenv("ADMIN_NAME") or "Platform Administrator").strip()

    users_ref = db.collection("users")
    existing_docs = list(users_ref.where("email", "==", admin_email).limit(1).stream())
    now = datetime.utcnow()

    if existing_docs:
        doc = existing_docs[0]
        updates = {
            "name": admin_name,
            "role": "admin",
            "status": "active",
            "password_hash": get_password_hash(admin_password),
            "updatedAt": now,
        }
        doc.reference.update(updates)
        print(f"Updated existing admin user: {admin_email}")
        return

    user_id = str(uuid4())
    users_ref.document(user_id).set(
        {
            "id": user_id,
            "name": admin_name,
            "email": admin_email,
            "password_hash": get_password_hash(admin_password),
            "role": "admin",
            "status": "active",
            "createdAt": now,
            "lastActive": None,
            "profile": {},
        }
    )
    print(f"Created new admin user: {admin_email}")


if __name__ == "__main__":
    try:
        asyncio.run(seed_admin_user())
    except Exception as exc:  # pragma: no cover
        print(f"Failed to seed admin user: {exc}")
        sys.exit(1)
