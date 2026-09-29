#!/usr/bin/env python3
"""Check that the Restaurant Aid services respond. Exit 0 if all are up, 1 otherwise."""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request


def check(url, expect_status=None, timeout=5):
    """Return (ok, message) for one URL."""
    start = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            body = resp.read().decode()
            ms = (time.monotonic() - start) * 1000
            if resp.status != 200:
                return False, f"HTTP {resp.status}"
            if expect_status is not None:
                if json.loads(body).get("status") != expect_status:
                    return False, f"unexpected response: {body[:80]}"
            return True, f"OK ({ms:.0f} ms)"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        return False, f"{type(e).__name__}: {e}"


def main():
    parser = argparse.ArgumentParser(description="Restaurant Aid health check")
    parser.add_argument("--backend", default="http://localhost:8000")
    parser.add_argument("--frontend", default="http://localhost:8080")
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--delay", type=float, default=2.0)
    args = parser.parse_args()

    targets = [
        ("backend", args.backend.rstrip("/") + "/health", "ok"),
        ("frontend", args.frontend.rstrip("/") + "/", None),
    ]

    all_ok = True
    for name, url, expect in targets:
        for attempt in range(1, args.retries + 1):
            ok, msg = check(url, expect)
            if ok or attempt == args.retries:
                break
            time.sleep(args.delay)
        print(f"{'PASS' if ok else 'FAIL'}: {name:<9} {url}  {msg}")
        all_ok = all_ok and ok

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())