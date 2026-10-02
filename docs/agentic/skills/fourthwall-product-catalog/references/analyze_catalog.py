import json, csv
from collections import Counter, defaultdict

L = json.load(open(".workbuddy-ai/tmp/catalog_list.json"))      # 605 summaries
D = json.load(open(".workbuddy-ai/tmp/catalog_details.json"))    # 605 details keyed by productId

# index details by productId
by_id = {d["productId"]: d for d in D.values()} if isinstance(D, dict) else {x["productId"]: x for x in D}

# sanity
print("list:", len(L), "| details:", len(by_id), "| matched:", sum(1 for r in L if r["productId"] in by_id))

# ---- facet extraction ----
top_cat = Counter()
sub_cat = Counter()
methods = Counter()
brands = Counter()
colors_per_tpl = []
all_colors = Counter()
region_ids = Counter()
placements_all = Counter()
min_orders = Counter()
base_prices = []
price_from_to = []

rows = []
for r in L:
    pid = r["productId"]
    d = by_id.get(pid, {})
    cat = r.get("category", "")
    top = cat.split("/")[0] if cat else "(none)"
    sub = cat.split("/",1)[1] if "/" in cat else ""
    top_cat[top]+=1
    if sub: sub_cat[sub]+=1
    methods[r.get("productionMethod","?")]+=1
    brands[r.get("brand","?")]+=1
    bp = r.get("basePrice",{}).get("amount")
    if bp is not None: base_prices.append(bp)
    # colors (from detail colorVariants)
    cv = d.get("colorVariants",[]) or []
    col_names = []
    for c in cv:
        nm = (c.get("color") or {}).get("name")
        if nm:
            col_names.append(nm); all_colors[nm]+=1
    colors_per_tpl.append(len(col_names))
    # regions / placements
    regs = d.get("customizableAreas",[]) or []
    rids = [a.get("regionId") for a in regs if a.get("regionId")]
    for rid in rids: region_ids[rid]+=1
    pls = []
    for a in regs:
        for p in (a.get("placements") or []):
            pid_ = p.get("id")
            if pid_: pls.append(pid_); placements_all[pid_]+=1
    # min orders
    mo = d.get("minimumOrdersNumber")
    min_orders[mo if mo is not None else "unspecified"]+=1
    pf = (d.get("priceFrom") or {}).get("amount")
    pt = (d.get("priceTo") or {}).get("amount")
    price_from_to.append((pf,pt))
    rows.append({
        "name": r.get("name"), "productId": pid, "top_category": top, "sub_category": sub,
        "brand": r.get("brand"), "productionMethod": r.get("productionMethod"),
        "basePrice": bp, "priceFrom": pf, "priceTo": pt,
        "numColors": len(col_names), "colors": "|".join(col_names),
        "regions": "|".join(rids), "placements": "|".join(pls),
        "minOrders": mo, "supportsBackendRendering": r.get("supportsBackendRendering")
    })

# ---- write CSV ----
with open(".workbuddy-ai/tmp/catalog_full.csv","w",newline="",encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)

# ---- summary ----
print("\n=== TOP CATEGORIES ===")
for k,v in top_cat.most_common(): print(f"  {k}: {v}")
print("\n=== SUBCATEGORIES ===")
for k,v in sub_cat.most_common(): print(f"  {k}: {v}")
print("\n=== PRODUCTION METHODS ===")
for k,v in methods.most_common(): print(f"  {k}: {v}")
print("\n=== BRANDS ===")
for k,v in brands.most_common(): print(f"  {k}: {v}")
print("\n=== BASE PRICE ===")
if base_prices:
    print(f"  min {min(base_prices):.2f}  max {max(base_prices):.2f}  avg {sum(base_prices)/len(base_prices):.2f}")
print("\n=== COLORS (distinct) ===", len(all_colors))
for k,v in all_colors.most_common(30): print(f"  {k}: {v}")
print("  templates with >1 color:", sum(1 for c in colors_per_tpl if c>1), "/", len(colors_per_tpl))
print("\n=== REGION IDs (print regions) ===")
for k,v in region_ids.most_common(): print(f"  {k}: {v}")
print("\n=== PLACEMENTS ===")
for k,v in placements_all.most_common(): print(f"  {k}: {v}")
print("\n=== MIN ORDERS ===")
for k,v in min_orders.most_common(): print(f"  {k}: {v}")

# save summary
summary = {
  "total": len(L),
  "top_categories": dict(top_cat), "subcategories": dict(sub_cat),
  "production_methods": dict(methods), "brands": dict(brands),
  "base_price": {"min":min(base_prices),"max":max(base_prices),"avg":round(sum(base_prices)/len(base_prices),2)} if base_prices else {},
  "distinct_colors": len(all_colors), "color_counts": dict(all_colors),
  "region_ids": dict(region_ids), "placements": dict(placements_all),
  "min_orders": dict(min_orders)
}
json.dump(summary, open(".workbuddy-ai/tmp/catalog_summary.json","w"), indent=1)
print("\nwrote catalog_full.csv + catalog_summary.json")
