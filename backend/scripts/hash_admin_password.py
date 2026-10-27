#!/usr/bin/env python3
"""
CLI helper to generate a PBKDF2 password hash using the application's security settings.
Password is read securely via hidden prompt and never logged or written to disk.
"""

import getpass
import sys
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.security import hash_password


def main() -> None:
    try:
        pw1 = getpass.getpass("Enter new admin password: ")
        if not pw1 or len(pw1.strip()) < 8:
            print("Error: Password must be at least 8 characters.", file=sys.stderr)
            sys.exit(1)

        pw2 = getpass.getpass("Confirm new admin password: ")
        if pw1 != pw2:
            print("Error: Passwords do not match.", file=sys.stderr)
            sys.exit(1)

        hashed = hash_password(pw1)
        print("\nGenerated PBKDF2 Hash:")
        print(hashed)
    except (KeyboardInterrupt, EOFError):
        print("\nAborted.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
