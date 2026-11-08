"""Draw the deck's charts from real data (slides/data/model.json and the publish log).

Run: python charts.py <slides dir>
"""
import json
import math
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.colors import LinearSegmentedColormap

ROOT = Path(sys.argv[1])
OUT = ROOT / "assets" / "charts"
OUT.mkdir(parents=True, exist_ok=True)
model = json.loads((ROOT / "data" / "model.json").read_text(encoding="utf-8"))

font_manager.fontManager.addfont("/System/Library/Fonts/Supplemental/AppleGothic.ttf")
plt.rcParams.update({
    "font.family": "AppleGothic",
    "svg.fonttype": "path",
    "axes.unicode_minus": False,
    "text.color": "#4A3324",
    "axes.labelcolor": "#4A3324",
    "xtick.color": "#6E5440",
    "ytick.color": "#6E5440",
    "axes.edgecolor": "#CDB79A",
    "font.size": 15,
})
INK, MUTED, WOOD, ROSE, LEAF, GOLD, LINE = "#4A3324", "#6E5440", "#8B5E3C", "#A9473F", "#66784A", "#D9A55B", "#E3D3BA"
AXES_LABEL = {"s": ("이야기", "지식"), "d": ("몰입", "탐험"), "e": ("감성", "논리"), "c": ("고전", "신간")}


def save(fig, name):
    fig.savefig(OUT / name, transparent=True, bbox_inches="tight", pad_inches=0.15)
    plt.close(fig)
    print("wrote", name)


def clean(ax):
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)


# 1. Heatmap: how each chosen field pushes the four axes
chips = model["chips"]
mat = [[c["w"][k] for k in "sdec"] for c in chips]
cmap = LinearSegmentedColormap.from_list("attic", ["#5E7FA0", "#FBF4E8", ROSE])
fig, ax = plt.subplots(figsize=(8.6, 9.6))
im = ax.imshow(mat, cmap=cmap, vmin=-2, vmax=2, aspect="auto")
ax.set_yticks(range(len(chips)), [c["label"] for c in chips], fontsize=17)
ax.set_xticks(range(4), [f"{AXES_LABEL[k][0]} ＋\n{AXES_LABEL[k][1]} -" for k in "sdec"], fontsize=17)
ax.xaxis.tick_top()
for i, row in enumerate(mat):
    for j, v in enumerate(row):
        if v:
            ax.text(j, i, f"{v:+d}", ha="center", va="center", fontsize=17, color="#FFFDF8" if abs(v) == 2 else INK)
for s in ax.spines.values():
    s.set_visible(False)
ax.set_xticks([x - .5 for x in range(1, 4)], minor=True)
ax.set_yticks([y - .5 for y in range(1, len(chips))], minor=True)
ax.grid(which="minor", color="#FAF6EE", linewidth=3)
ax.tick_params(which="both", length=0)
save(fig, "heatmap.svg")

# 2. tanh curve: raw score -> percentage shown on the result bar
ex = model["example"]
fig, ax = plt.subplots(figsize=(8.4, 5.2))
xs = [x / 10 for x in range(-150, 151)]
ax.plot(xs, [50 + 45 * math.tanh(x / 6) for x in xs], color=WOOD, linewidth=4)
ax.axhline(50, color=LINE, linewidth=1.5, zorder=0)
ax.axvline(0, color=LINE, linewidth=1.5, zorder=0)
marks = {"s": "이야기", "d": "몰입", "e": "감성", "c": "고전"}
groups = {}
for k, name in marks.items():
    groups.setdefault(ex["sc"][k], []).append(name)
place = [(-7.2, 8), (1.0, -10), (-7.8, -2), (1.0, -20)]
for gi, (v, ns) in enumerate(sorted(groups.items())):
    p = 50 + 45 * math.tanh(v / 6)
    ax.scatter([v], [p], s=150, color=ROSE, zorder=3, edgecolor="#FFFDF8", linewidth=2)
    dx, dy = place[gi % len(place)]
    ax.annotate("·".join(ns) + f" {round(p)}%", (v, p), xytext=(v + dx, p + dy), fontsize=16, color=ROSE,
                arrowprops=dict(arrowstyle="-", color=ROSE, lw=1))
ax.set_xlim(-15, 15)
ax.set_ylim(0, 100)
ax.set_xlabel("축 점수 (분야 + 책 + 질문)", fontsize=16)
ax.set_ylabel("결과에 보이는 퍼센트", fontsize=16)
ax.set_yticks([5, 50, 95])
clean(ax)
save(fig, "tanh.svg")

# 3. Year score: first-publication year -> classic/new axis
fig, ax = plt.subplots(figsize=(8.4, 4.2))
steps = [(1900, 1990, 2), (1990, 2010, 1), (2010, 2018, -1), (2018, 2027, -2)]
for a, b, v in steps:
    ax.fill_between([a, b], 0, v, step="pre", color=ROSE if v > 0 else "#5E7FA0", alpha=.75, linewidth=0)
    ax.text((a + b) / 2, v + (0.25 if v > 0 else -0.45), f"{v:+d}", ha="center", fontsize=17, color=INK)
ax.axhline(0, color=MUTED, linewidth=1.2)
ax.set_xlim(1900, 2027)
ax.set_ylim(-2.8, 2.8)
ax.set_yticks([-2, 0, 2], ["신간 쪽", "0", "고전 쪽"])
ax.set_xticks([1900, 1950, 1990, 2010, 2018], ["1900", "1950", "1990", "2010", "  '18"])
ax.set_xlabel("책의 최초 출간연도", fontsize=16)
clean(ax)
save(fig, "yearscore.svg")

# 4. Simulation: 10,000 random answer sets
names = {t["code"]: t["name"] for t in model["types"]}
order = [t["code"] for t in model["types"]]
dist = model["simulation"]["dist"]
n = model["simulation"]["n"]
fig, ax = plt.subplots(figsize=(15.5, 5.6))
vals = [dist[c] for c in order]
bars = ax.bar(range(16), vals, color=[WOOD if c[0] == "S" else LEAF for c in order], width=.72)
ax.axhline(n / 16, color=ROSE, linewidth=2, linestyle=(0, (6, 4)))
ax.text(-0.5, max(vals) * 1.09, f"- - 고르게 나뉠 때 한 유형당 {n // 16}명", color=ROSE, fontsize=16, ha="left")
for i, v in enumerate(vals):
    ax.text(i, v + 12, f"{v}", ha="center", fontsize=15, color=INK)
ax.set_xticks(range(16), [f"{names[c].split(' ')[-1]}\n{c}" for c in order], fontsize=14)
ax.set_ylabel("1만 명 중 인원", fontsize=16)
ax.set_ylim(0, max(vals) * 1.15)
clean(ax)
save(fig, "simulation.svg")

# 5. Questions only: all 128 combinations of the 7 habit questions
q = model["questionsOnly"]
fig, ax = plt.subplots(figsize=(7.6, 4.6))
qv = [q[c] for c in order]
ax.bar(range(16), qv, color=[GOLD if v == max(qv) else "#CDB79A" for v in qv], width=.72)
for i, v in enumerate(qv):
    ax.text(i, v + .6, str(v), ha="center", fontsize=13, color=INK)
ax.set_xticks(range(16), order, rotation=90, fontsize=12)
ax.set_ylabel("128가지 응답 중", fontsize=15)
clean(ax)
save(fig, "questions-only.svg")

# 6. Timeline: real publish times of the site (KST)
kst = timezone(timedelta(hours=9))
start = datetime(2026, 11, 8, 13, 47, 52, tzinfo=kst)
log = [
    (1794114011, "첫 공개", "KDC 분야 선택 · 동물 16종 · 내장 도서"),
    (1794114630, "Claude 사서", "어떤 책이든 분석 · 맞춤 추천"),
    (1794115218, "어두운 다락방", "그려 넣은 다락방 장면"),
    (1794115348, "제목 확정", "다락방 서재에 놀러 온 동물들"),
    (1794116870, "동물 일러스트", "Google Flow 16장"),
    (1794117072, "수채화 배경", "밝은 수채 톤으로 전환"),
    (1794117147, "이미지 내장", "그림이 안 보이는 문제 해결"),
    (1794117336, "행운의 독서템", "3,200가지 조합"),
    (1794117571, "입력 칸 분리", "도서명 · 저자"),
    (1794117811, "쉬운 분야 이름", "분류번호 대신 10개 분야"),
]
mins = [(datetime.fromtimestamp(t, kst) - start).total_seconds() / 60 for t, _, _ in log]
fig, ax = plt.subplots(figsize=(17, 5.6))
ax.plot([0, mins[-1] + 3], [0, 0], color="#CDB79A", linewidth=3, zorder=1)
ax.scatter([0], [0], s=120, color=MUTED, zorder=3)
ax.text(0, 0.35, "시작 13:48", ha="center", va="bottom", fontsize=14, color=MUTED)
for i, (m, (t, title, sub)) in enumerate(zip(mins, log)):
    tier = i % 4
    up = tier in (0, 2)
    y = (0.75 if tier < 2 else 1.75) * (1 if up else -1)
    ax.plot([m, m], [0, y * .9], color="#CDB79A", linewidth=1.5, zorder=1)
    ax.scatter([m], [0], s=170, color=ROSE if i in (1, 4, 5) else WOOD, zorder=3, edgecolor="#FFFDF8", linewidth=2)
    clock = datetime.fromtimestamp(t, kst).strftime("%H:%M")
    ax.text(m, y, f"v{i + 1} · {clock}\n{title}", ha="center", va="bottom" if up else "top", fontsize=14.5, color=INK, linespacing=1.4)
ax.set_xlim(-4, mins[-1] + 5)
ax.set_ylim(-3.0, 3.0)
ax.axis("off")
save(fig, "timeline.svg")

# 7. Built-in catalog by type
cat = model["catalog"]["byType"]
fig, ax = plt.subplots(figsize=(7.6, 4.2))
cv = [cat[c] for c in order]
ax.bar(range(16), cv, color=[WOOD if c[0] == "S" else LEAF for c in order], width=.72)
for i, v in enumerate(cv):
    ax.text(i, v + .1, str(v), ha="center", fontsize=13, color=INK)
ax.set_xticks(range(16), order, rotation=90, fontsize=12)
ax.set_ylabel("권", fontsize=15)
ax.set_title(f"내장 도서 {model['catalog']['total']}권의 유형 분포", fontsize=16, color=INK, loc="left")
clean(ax)
save(fig, "catalog.svg")

json.dump({"start": start.isoformat(), "minutes": mins, "total_minutes": mins[-1]},
          open(ROOT / "data" / "timeline.json", "w"), ensure_ascii=False)
