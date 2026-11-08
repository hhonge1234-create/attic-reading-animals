"""Build claude/index.html: embeds the animal pictures and the attic banner into page.src.html."""
import base64, json, pathlib, re
here = pathlib.Path(__file__).resolve().parent
img = here.parent / 'img'
uri = lambda p: 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode()
data = {p.stem: uri(p) for p in sorted(img.glob('*.jpg')) if re.fullmatch(r'[SK][DW][EL][CN]', p.stem)}
src = (here / 'page.src.html').read_text(encoding='utf-8')
out = src.replace('{{IMGDATA}}', json.dumps(data)).replace('{{ATTIC}}', uri(img / 'attic-wide.jpg'))
(here / 'index.html').write_text(out, encoding='utf-8')
print('animals', len(data), 'bytes', len(out))
