#!/bin/bash
# Verify loop: run the deck's ?check mode and screenshot every slide.
# usage: build/verify.sh <slides dir> <out dir> [base url] [WxH]
DIR="$1"; OUT="$2"; BASE="${3:-file://$DIR/index.html}"; WS="${4:-1920,1080}"
[ -z "$3" ] && BASE="file://$DIR/index.html"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
"$C" --headless=new --disable-gpu --hide-scrollbars --autoplay-policy=no-user-gesture-required --window-size=$WS --virtual-time-budget=20000 --dump-dom "$BASE?check" 2>/dev/null \
 | python3 -c "
import sys,re,json,html
d=sys.stdin.read(); m=re.search(r'<pre id=\"report\">(.*?)</pre>', d, re.S)
if not m: print('NO REPORT'); sys.exit(1)
r=json.loads(html.unescape(m.group(1))); tot=0
for s in r['slides']:
    if s['issues']:
        print(f\"slide {s['n']:>2} {s['anim']}:\")
        for i in s['issues'][:8]: print('   ', json.dumps(i, ensure_ascii=False))
        tot+=len(s['issues'])
print('viewport', r.get('viewport'), 'deck', r.get('deck'), 'FIT', r.get('fit')); print('errors:', r['errors']); print('TOTAL ISSUES', tot)
"
N=$(grep -c 'class="slide' "$DIR/index.html")
for i in $(seq 1 $N); do
  "$C" --headless=new --disable-gpu --hide-scrollbars --window-size=$WS --virtual-time-budget=6000 --screenshot="$OUT/s$i.png" "$BASE?static#$i" >/dev/null 2>&1
done
echo "screens: $(ls $OUT/*.png | wc -l)"
