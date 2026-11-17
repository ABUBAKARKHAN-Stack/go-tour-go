"""Seed the 1,525 landmarks directly into Supabase via REST API.

Requires the Supabase service_role key (which bypasses RLS on landmark_import).

Usage:
    python scripts/seed_landmarks.py --service-key <YOUR_SERVICE_ROLE_KEY>
    or set SUPABASE_SERVICE_ROLE_KEY in your environment or .env file.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_CSV = "docs/landmarks-import/landmarks-1500-final.csv"
BATCH_SIZE = 50

def load_env_file(filepath: str = ".env") -> dict[str, str]:
    env = {}
    if os.path.exists(filepath):
        with open(filepath, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def main():
    parser = argparse.ArgumentParser(description="Seed 1,525 landmarks into Supabase.")
    parser.add_argument("--csv", default=DEFAULT_CSV, help="Path to final landmarks CSV")
    parser.add_argument("--url", help="Supabase project URL")
    parser.add_argument("--service-key", help="Supabase service_role secret key")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help="Batch size for inserts")
    args = parser.parse_args()

    env = load_env_file(".env")
    supabase_url = args.url or os.environ.get("SUPABASE_URL") or env.get("EXPO_PUBLIC_SUPABASE_URL")
    service_key = args.service_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url:
        print("ERROR: Supabase URL not found. Set EXPO_PUBLIC_SUPABASE_URL in .env or pass --url.")
        sys.exit(1)

    if not service_key:
        print("\n" + "=" * 70)
        print(" SUPABASE SERVICE_ROLE KEY REQUIRED FOR DIRECT SCRIPT SEEDING")
        print("=" * 70)
        print("The landmark_import table is protected by Row Level Security (RLS).")
        print("The public anon key in .env cannot insert into it.\n")
        print("To seed directly using this script:")
        print("  1. Copy your 'service_role' secret key from:")
        print("     Supabase Dashboard -> Project Settings -> API -> Project API keys -> 'service_role'")
        print("  2. Run:")
        print(f"     python scripts/seed_landmarks.py --service-key <YOUR_SERVICE_ROLE_KEY>\n")
        print("OR ALTERNATIVELY, use the 2-minute Supabase Dashboard CSV Import:")
        print("  1. Go to Supabase Dashboard -> Table Editor -> 'landmark_import'")
        print(f"  2. Click 'Insert' -> 'Import data from CSV'")
        print(f"  3. Select: {os.path.abspath(args.csv)}")
        print("  4. Click 'Import'. The database trigger will automatically populate destinations!")
        print("=" * 70 + "\n")
        sys.exit(1)

    if not os.path.exists(args.csv):
        print(f"ERROR: CSV file not found at: {args.csv}")
        sys.exit(1)

    with open(args.csv, encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    print(f"Loaded {total} landmarks from {args.csv}")
    print(f"Target URL: {supabase_url}/rest/v1/landmark_import")
    print(f"Batch size: {args.batch_size} rows per request\n")

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/landmark_import"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    inserted = 0
    total_batches = (total + args.batch_size - 1) // args.batch_size

    for b_idx in range(total_batches):
        batch = rows[b_idx * args.batch_size : (b_idx + 1) * args.batch_size]
        payload = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(endpoint, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req) as resp:
                if resp.status in (200, 201):
                    inserted += len(batch)
                    pct = (inserted / total) * 100
                    print(f"[{b_idx + 1:3d}/{total_batches}] Inserted {inserted:4d}/{total} ({pct:5.1f}%)")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            print(f"\nERROR in batch {b_idx + 1} (HTTP {e.code}): {err_body}")
            print(f"Failed starting at row slug: {batch[0].get('slug')}")
            sys.exit(1)
        except Exception as e:
            print(f"\nNetwork error in batch {b_idx + 1}: {e}")
            sys.exit(1)

    print("\n" + "=" * 60)
    print(f" SUCCESS: All {inserted} landmarks seeded into landmark_import!")
    print(" The apply_landmark_import database trigger has updated:")
    print("   1. public.destinations (English)")
    print("   2. public.destination_translations (Urdu)")
    print("=" * 60)

if __name__ == "__main__":
    main()
