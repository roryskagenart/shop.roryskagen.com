#!/usr/bin/env bash
# Pull the FULL Fourthwall template catalog (path-paginated list) + per-template detail.
# Read-only. Writes gitignored JSON to .workbuddy-ai/tmp/.
set -a
. "$(dirname "$0")/../../.env.local"
set +a

PLAT="https://api.fourthwall.com/open-api/v1.0"
OUT="$(dirname "$0")"
PY="C:/Users/jaden.black/.workbuddy-ai/binaries/python/versions/3.13.12/python.exe"
A="-u $FOURTHWALL_API_USERNAME:$FOURTHWALL_API_PASSWORD"

# 1) Page through the LIST (25/page, path-based). total ~605 -> 25 pages.
"$PY" - "$OUT" "$PLAT" "$A" <<'PYEOF'
import json, subprocess, sys, urllib.request
out_dir, plat, auth = sys.argv[1], sys.argv[2], sys.argv[3]
# auth is "-u user:pass"; rebuild header-based instead to avoid shell quoting
import os
user, pw = os.environ["FOURTHWALL_API_USERNAME"], os.environ["FOURTHWALL_API_PASSWORD"]
import base64
token = base64.b64encode(f"{user}:{pw}".encode()).decode()
hdr = {"Authorization": "Basic "+token, "Accept-Encoding": "gzip"}
def get(url):
    req = urllib.request.Request(url, headers=hdr)
    import gzip, io
    raw = urllib.request.urlopen(req, timeout=30).read()
    return json.loads(gzip.decompress(raw) if raw[:2]==b"\x1f\x8b" else raw)

summaries = []
page = 1
while True:
    d = get(f"{plat}/product-templates/page/{page}")
    res = d.get("results", [])
    summaries += res
    total = d.get("total", 0)
    if len(summaries) >= total or not res:
        break
    page += 1
    if page > 60:
        break
with open(f"{out_dir}/catalog_list.json","w") as f:
    json.dump(summaries, f, indent=1)
print("LIST pages scanned:", page, "| summaries:", len(summaries), "| total:", total)

# 2) Per-template DETAIL (colors, print regions, min orders, priceFrom/To).
ids = [r["productId"] for r in summaries]
details = {}
failed = []
for i, pid in enumerate(ids):
    try:
        d = get(f"{plat}/product-templates/{pid}")
        details[pid] = d
    except Exception as e:
        failed.append((pid, str(e)[:80]))
    if (i+1) % 50 == 0:
        print("  detail", i+1, "/", len(ids))
with open(f"{out_dir}/catalog_details.json","w") as f:
    json.dump(details, f, indent=1)
print("DETAILS fetched:", len(details), "| failed:", len(failed), failed[:5])
PYEOF
echo "done"
