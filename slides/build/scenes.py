"""Manim clips for the deck.

Render: manim -r 1920,1080 --fps 30 --format mp4 scenes.py AxisTree ScorePipeline
"""
import json
from pathlib import Path

from manim import (
    DOWN, LEFT, RIGHT, UP, Create, FadeIn, GrowFromEdge, Line, Rectangle,
    RoundedRectangle, Scene, Text, VGroup, Write, config, LaggedStart, Transform,
    ReplacementTransform, Dot, Arrow, ORIGIN,
)

config.background_color = "#FAF6EE"
FONT = "Apple SD Gothic Neo"
INK, MUTED, WOOD, ROSE, LEAF, GOLD, LINE = "#4A3324", "#6E5440", "#8B5E3C", "#A9473F", "#66784A", "#D9A55B", "#CDB79A"
MODEL = json.loads((Path(__file__).resolve().parent.parent / "data" / "model.json").read_text(encoding="utf-8"))
NAMES = {t["code"]: t["name"].split(" ")[-1] for t in MODEL["types"]}


def T(s, size=28, color=INK, weight="NORMAL"):
    return Text(s, font=FONT, font_size=size, color=color, weight=weight)


class AxisTree(Scene):
    """One reader splits four times: 이야기/지식 → 몰입/탐험 → 감성/논리 → 고전/신간 = 16 animals."""

    def construct(self):
        levels = [("S", "K", "이야기", "지식"), ("D", "W", "몰입", "탐험"), ("E", "L", "감성", "논리"), ("C", "N", "고전", "신간")]
        width = 13.2
        ys = [3.0, 1.55, 0.25, -1.0, -2.3]
        root = VGroup(RoundedRectangle(corner_radius=.18, width=1.9, height=.7, color=WOOD, fill_color=WOOD, fill_opacity=1),
                      T("나", 30, "#FFF8EC", "BOLD"))
        root.move_to([0, ys[0], 0])
        self.play(FadeIn(root, shift=DOWN * .3), run_time=.6)
        nodes = [("", 0.0)]
        for depth, (a, b, an, bn) in enumerate(levels):
            new_nodes, edges, labels = [], VGroup(), VGroup()
            span = width / (2 ** (depth + 1))
            for prefix, x in nodes:
                for letter, name, dx in ((a, an, -span / 2), (b, bn, span / 2)):
                    nx = x + dx
                    start = [x, ys[depth] - .38, 0]
                    end = [nx, ys[depth + 1] + .3, 0]
                    edges.add(Line(start, end, color=LINE, stroke_width=3))
                    if depth < 3:
                        lab = T(name, 26 - depth * 3, ROSE if letter == a else LEAF)
                    else:
                        lab = T(prefix + letter, 20, INK, "BOLD")
                    lab.move_to([nx, ys[depth + 1], 0])
                    labels.add(lab)
                    new_nodes.append((prefix + letter, nx))
            self.play(LaggedStart(*[Create(e) for e in edges], lag_ratio=.04), run_time=.7)
            self.play(LaggedStart(*[FadeIn(l, shift=DOWN * .15) for l in labels], lag_ratio=.05), run_time=.7)
            nodes = new_nodes
        names = VGroup()
        for code, x in nodes:
            nm = T(NAMES[code], 19, MUTED)
            nm.move_to([x, ys[4] - .62, 0])
            names.add(nm)
        self.play(LaggedStart(*[FadeIn(n, shift=UP * .15) for n in names], lag_ratio=.06), run_time=1.4)
        total = T("2 × 2 × 2 × 2 = 16마리", 40, WOOD, "BOLD").move_to([0, -3.55, 0])
        self.play(Write(total), run_time=1.0)
        self.wait(1.6)


class ScorePipeline(Scene):
    """Example reader: inputs flow into four axis bars, the bars settle, letters form SDEC."""

    def construct(self):
        ex = MODEL["example"]
        inputs = [
            ("좋아하는 분야", " · ".join(ex["input"]["chips"])),
            ("읽은 책", " · ".join(b[0] for b in ex["input"]["books"])),
            ("읽는 습관", "질문 7개"),
        ]
        cards = VGroup()
        for i, (h, body) in enumerate(inputs):
            box = RoundedRectangle(corner_radius=.15, width=4.6, height=1.25, color=LINE, fill_color="#FFFDF8", fill_opacity=1, stroke_width=2)
            head = T(h, 24, ROSE, "BOLD")
            txt = T(body, 21, INK)
            grp = VGroup(head, txt).arrange(DOWN, buff=.14)
            card = VGroup(box, grp)
            card.move_to([-4.6, 2.0 - i * 1.75, 0])
            cards.add(card)
        self.play(LaggedStart(*[FadeIn(c, shift=RIGHT * .4) for c in cards], lag_ratio=.25), run_time=1.4)

        axes = [("s", "이야기", "지식", "S", "K"), ("d", "몰입", "탐험", "D", "W"), ("e", "감성", "논리", "E", "L"), ("c", "고전", "신간", "C", "N")]
        bar_w = 4.6
        rows = []
        for i, (k, a, b, la, lb) in enumerate(axes):
            y = 2.25 - i * 1.25
            track = RoundedRectangle(corner_radius=.12, width=bar_w, height=.32, color=LINE, fill_color="#F2E7D5", fill_opacity=1, stroke_width=1.5)
            track.move_to([2.0, y, 0])
            la_t = T(a, 22, INK).next_to(track, LEFT, buff=.25)
            lb_t = T(b, 22, MUTED).next_to(track, RIGHT, buff=.25)
            rows.append((k, track, la_t, lb_t, la, lb, y))
            self.add(track, la_t, lb_t)
        arrows = VGroup(*[Arrow(c.get_right(), [-1.55, 0.375, 0], color=LINE, stroke_width=3, buff=.15, max_tip_length_to_length_ratio=.08)
                          for c in cards])
        self.play(LaggedStart(*[Create(a) for a in arrows], lag_ratio=.2), run_time=.9)

        fills = []
        for k, track, la_t, lb_t, la, lb, y in rows:
            pct = ex["pct"][k] / 100
            fill = Rectangle(width=bar_w * pct, height=.3, color=GOLD, fill_color=GOLD, fill_opacity=1, stroke_width=0)
            fill.align_to(track, LEFT).move_to([track.get_left()[0] + bar_w * pct / 2, y, 0])
            pt = T(f"{ex['pct'][k]}%", 22, WOOD, "BOLD").move_to([track.get_left()[0] + bar_w * pct - .45, y + .38, 0])
            fills.append((fill, pt))
        self.play(*[GrowFromEdge(f, LEFT) for f, _ in fills], run_time=1.6)
        self.play(*[FadeIn(p, shift=UP * .1) for _, p in fills], run_time=.5)

        letters = VGroup()
        for i, ch in enumerate(ex["code"]):
            l = T(ch, 64, ROSE, "BOLD").move_to([0.6 + i * .95, -2.6, 0])
            letters.add(l)
        self.play(LaggedStart(*[FadeIn(l, shift=UP * .4) for l in letters], lag_ratio=.25), run_time=1.2)
        result = T("깊은 바다의 고래", 36, INK, "BOLD").next_to(letters, DOWN, buff=.3)
        self.play(Write(result), run_time=1.0)
        self.wait(1.8)
