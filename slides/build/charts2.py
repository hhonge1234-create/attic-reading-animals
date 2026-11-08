"""Charts for the question-based scoring (revision 2). Real numbers only.

- axis_dist.svg: one axis has 5 questions worth +1/-1. Exact chance of each axis score for evenly
  split answers (binomial, n=5), with the percentage the result bar shows (50 + 9 x score).
- balance.svg: before vs after. Before = the old algorithm's 10,000-answer simulation (data/model.json).
  After = every one of the 2^20 answer combinations of the 20 questions, counted exactly.

Run: python charts2.py <slides dir>
"""
import json
import sys
from itertools import product
from math import comb
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

ROOT = Path(sys.argv[1])
OUT = ROOT / "assets" / "charts"
model = json.loads((ROOT / "data" / "model.json").read_text(encoding="utf-8"))
font_manager.fontManager.addfont("/System/Library/Fonts/Supplemental/AppleGothic.ttf")
plt.rcParams.update({"font.family": "AppleGothic", "svg.fonttype": "path", "axes.unicode_minus": False,
                     "text.color": "#4A3324", "axes.labelcolor": "#4A3324", "xtick.color": "#6E5440",
                     "ytick.color": "#6E5440", "axes.edgecolor": "#CDB79A", "font.size": 15})
INK, WOOD, ROSE, LEAF, BLUE, LINE = "#4A3324", "#8B5E3C", "#A9473F", "#66784A", "#5E7FA0", "#CDB79A"


def clean(ax):
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)


# 1. one axis: 5 questions, score in {-5,-3,-1,1,3,5}
scores = [-5, -3, -1, 1, 3, 5]
probs = [comb(5, (s + 5) // 2) / 32 * 100 for s in scores]
fig, ax = plt.subplots(figsize=(9, 5))
colors = [BLUE if s < 0 else ROSE for s in scores]
ax.bar(range(6), probs, color=colors, width=.68)
for i, (s, p) in enumerate(zip(scores, probs)):
    pct = 50 + 9 * s
    ax.text(i, p + 1.2, f"{p:.1f}%", ha="center", fontsize=15, color=INK)
    side = "왼쪽" if s > 0 else "오른쪽"
    ax.text(i, -6.5, f"{s:+d}점\n막대 {max(pct, 100 - pct)}%", ha="center", va="top", fontsize=14, color=INK, linespacing=1.4)
ax.set_xticks([])
ax.set_ylim(0, 46)
ax.set_yticks([])
for sp in ("left",): ax.spines[sp].set_visible(False)
ax.axvline(2.5, color=LINE, linewidth=1.5, linestyle=(0, (5, 4)))
ax.text(2.5, 43, "동점 없음", ha="center", fontsize=14, color=ROSE, bbox=dict(boxstyle="round,pad=.3", fc="#FAF6EE", ec="none"))
ax.text(-0.3, 39, "← 지식·탐험·논리·신간", fontsize=14, color=BLUE)
ax.text(5.3, 39, "이야기·몰입·감성·고전 →", fontsize=14, color=ROSE, ha="right")
clean(ax)
fig.savefig(OUT / "axis_dist.svg", transparent=True, bbox_inches="tight", pad_inches=.15)
plt.close(fig)
print("wrote axis_dist.svg")

# 2. before vs after
order = [t["code"] for t in model["types"]]
short = {t["code"]: t["name"].split(" ")[-1] for t in model["types"]}
old = model["simulation"]["dist"]
n_old = model["simulation"]["n"]
before = [old[c] / n_old * 100 for c in order]

counts = {c: 0 for c in order}
axes = "sdec"
for bits in product((1, -1), repeat=20):
    sc = {k: 0 for k in axes}
    for i, b in enumerate(bits):
        sc[axes[i % 4]] += b
    code = ("S" if sc["s"] > 0 else "K") + ("D" if sc["d"] > 0 else "W") + ("E" if sc["e"] > 0 else "L") + ("C" if sc["c"] > 0 else "N")
    counts[code] += 1
total = sum(counts.values())
after = [counts[c] / total * 100 for c in order]
json.dump({"combinations": total, "per_type": counts}, open(ROOT / "data" / "balance.json", "w"), ensure_ascii=False)

fig, axs = plt.subplots(1, 2, figsize=(17, 5.4), sharey=True)
for ax, vals, title, col in ((axs[0], before, "예전 · 질문 7개 + 분야·책 가중치 (무작위 1만 명)", "#B9A48C"),
                             (axs[1], after, f"지금 · 질문 20개 (가능한 답 {total:,}가지 전부)", WOOD)):
    ax.bar(range(16), vals, color=col, width=.7)
    ax.axhline(100 / 16, color=ROSE, linewidth=2, linestyle=(0, (6, 4)))
    ax.set_title(title, fontsize=17, color=INK, loc="left", pad=12)
    ax.set_xticks(range(16), [short[c] for c in order], rotation=90, fontsize=13)
    ax.set_ylim(0, 10.5)
    clean(ax)
axs[0].set_ylabel("전체 중 비율 (%)", fontsize=14)
lo, hi = min(before), max(before)
axs[0].text(15.4, 10.0, f"가장 많은 유형 {hi:.1f}% · 가장 적은 유형 {lo:.1f}%", ha="right", fontsize=14, color=ROSE)
axs[1].text(15.4, 10.0, "16마리 모두 정확히 6.25%", ha="right", fontsize=14, color=ROSE)
fig.tight_layout()
fig.savefig(OUT / "balance.svg", transparent=True, bbox_inches="tight", pad_inches=.15)
plt.close(fig)
print("wrote balance.svg", total, set(counts.values()))
