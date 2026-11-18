"""Tile slide screenshots s<N>.png into one image. usage: contact_sheet.py <dir> <out> 1,2,3"""
import sys
from PIL import Image, ImageDraw
d, out, ids = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
w, h, cols = 640, 360, 3
rows = (len(ids) + cols - 1) // cols
s = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * (h + 8)), 'black')
dr = ImageDraw.Draw(s)
for k, i in enumerate(ids):
    im = Image.open(f'{d}/s{i}.png').convert('RGB').resize((w, h))
    x, y = (k % cols) * (w + 8), (k // cols) * (h + 8)
    s.paste(im, (x, y)); dr.rectangle((x, y, x + 34, y + 22), fill='black'); dr.text((x + 6, y + 5), str(i), fill='white')
s.save(out, quality=80)
