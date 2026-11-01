"""
Generates Xeon Net brand illustrations (SVG) into static/img/art/.
Run:  python tools/make_art.py
Colors come from the Xeon Net logo (amber -> orange -> ember on black).
"""
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "img", "art")
os.makedirs(OUT, exist_ok=True)

W, H = 640, 440
INK, PANEL, PANEL2, LINE, GRAY, WHITE = "#0e0e0e", "#171717", "#1f1f1f", "#2f2f2f", "#6f6a62", "#f4f1ec"
G = "url(#g)"

DEFS = f"""
<defs>
  <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#f0a21f"/><stop offset=".55" stop-color="#e5701a"/><stop offset="1" stop-color="#d6400f"/>
  </linearGradient>
  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e5701a" stop-opacity=".9"/><stop offset="1" stop-color="#d6400f" stop-opacity=".15"/>
  </linearGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5">
    <stop offset="0" stop-color="#e5701a" stop-opacity=".38"/><stop offset="1" stop-color="#e5701a" stop-opacity="0"/>
  </radialGradient>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<ellipse cx="330" cy="230" rx="300" ry="200" fill="url(#glow)"/>
<g stroke="{LINE}" stroke-width="1" opacity=".5">
  <path d="M0 80h640M0 160h640M0 240h640M0 320h640M0 400h640"/><path d="M80 0v440M200 0v440M320 0v440M440 0v440M560 0v440"/>
</g>
"""


def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" fill="none" '
            f'role="img" aria-hidden="true">{DEFS}{body}</svg>')


def r(x, y, w, h, rx=8, fill=PANEL, stroke=None, op=None, sw=1.5):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + "/>"


def c(x, y, rad, fill=PANEL, stroke=None, sw=1.5, op=None):
    s = f'<circle cx="{x}" cy="{y}" r="{rad}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + "/>"


def p(d, stroke=G, sw=3, fill="none", cap="round", op=None):
    s = f'<path d="{d}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}" stroke-linecap="{cap}" stroke-linejoin="round"'
    if op is not None:
        s += f' opacity="{op}"'
    return s + "/>"


def line(x, y, w, h=8, fill=LINE, rx=4):
    return r(x, y, w, h, rx, fill)


def browser(x, y, w, h, inner=""):
    return (f'<g filter="url(#sh)">{r(x, y, w, h, 14, PANEL, LINE)}'
            f'{r(x, y, w, 30, 14, PANEL2)}{r(x, y + 16, w, 14, 0, PANEL2)}'
            f'{c(x + 18, y + 15, 4.5, "#d6400f")}{c(x + 34, y + 15, 4.5, "#e5701a")}{c(x + 50, y + 15, 4.5, "#f0a21f")}'
            f'{r(x + 72, y + 8, w - 100, 14, 7, INK)}</g>{inner}')


def phone(x, y, w=150, h=290, inner=""):
    return (f'<g filter="url(#sh)">{r(x, y, w, h, 26, INK, LINE, sw=2)}{r(x + 8, y + 8, w - 16, h - 16, 20, PANEL)}'
            f'{r(x + w / 2 - 22, y + 12, 44, 8, 4, INK)}</g>{inner}')


# ---------------------------------------------------------------- scenes
def s_web():
    return svg(
        browser(70, 60, 500, 320,
                r(92, 108, 300, 22, 6, G) + line(92, 142, 230, 10) + line(92, 160, 190, 10)
                + r(92, 186, 110, 32, 16, G) + r(212, 186, 90, 32, 16, PANEL2, LINE)
                + r(414, 100, 134, 118, 12, PANEL2, LINE) + p("M430 190 l26-34 20 22 18-26 38 38", sw=3)
                + c(528, 126, 8, G)
                + "".join(r(92 + i * 152, 250, 140, 100, 10, PANEL2, LINE) + r(104 + i * 152, 262, 36, 36, 8, G, op=.9)
                          + line(104 + i * 152, 308, 100) + line(104 + i * 152, 324, 70) for i in range(3)))
        + p("M520 300 l10 40 10-12 14 8 z", stroke=WHITE, sw=2, fill=WHITE))


def s_mobile():
    def ui(x, y):
        return (r(x + 20, y + 40, 110, 70, 12, G) + line(x + 20, y + 124, 80) + line(x + 20, y + 140, 55)
                + "".join(r(x + 20, y + 164 + i * 40, 110, 32, 10, PANEL2, LINE) + c(x + 38, y + 180 + i * 40, 8, G)
                          + line(x + 54, y + 177 + i * 40, 60, 6) for i in range(3)))
    return svg(
        phone(120, 80, 170, 310, ui(130, 80)) + phone(330, 40, 170, 310, ui(340, 40))
        + r(520, 120, 70, 70, 18, PANEL2, LINE) + p("M540 160 l10 10 20-24", sw=4)
        + c(110, 90, 6, G) + c(560, 330, 9, G, op=.7))


def s_ecom():
    return svg(
        browser(60, 70, 420, 290,
                "".join(r(84 + i * 132, 118, 120, 150, 12, PANEL2, LINE) + r(94 + i * 132, 128, 100, 70, 8, G, op=[.95, .7, .5][i])
                        + line(94 + i * 132, 210, 80) + line(94 + i * 132, 226, 50, 6) + r(94 + i * 132, 242, 60, 18, 9, PANEL, LINE)
                        for i in range(3)) + r(84, 290, 372, 50, 12, PANEL2, LINE) + line(100, 311, 120) + r(370, 300, 76, 30, 15, G))
        + f'<g filter="url(#sh)">{r(480, 200, 110, 100, 14, PANEL2, LINE)}</g>'
        + p("M500 220 h12 l10 38 h38 l8-28 h-52", stroke=WHITE, sw=3) + c(528, 276, 5, WHITE) + c(558, 276, 5, WHITE)
        + c(560, 160, 18, G) + p("M552 160 l6 6 11-12", stroke=INK, sw=3))


def s_software():
    bars = "".join(r(214 + i * 34, 350 - h, 22, h, 5, G, op=.55 + i * .07) for i, h in enumerate([40, 75, 58, 100, 84, 128]))
    return svg(
        browser(50, 60, 540, 330,
                r(70, 104, 110, 266, 10, PANEL2, LINE)
                + "".join(r(82, 120 + i * 36, 86, 22, 8, G if i == 0 else PANEL, None if i == 0 else LINE) for i in range(5))
                + r(196, 104, 370, 70, 12, PANEL2, LINE) + line(212, 122, 90) + r(212, 140, 140, 18, 6, G)
                + r(376, 118, 70, 42, 8, PANEL, LINE) + r(458, 118, 90, 42, 8, PANEL, LINE)
                + r(196, 188, 230, 182, 12, PANEL2, LINE) + bars
                + r(440, 188, 126, 182, 12, PANEL2, LINE) + c(503, 266, 40, "none", LINE, 14)
                + p("M503 226 a40 40 0 1 1 -38 52", sw=14) + line(456, 330, 90, 6) + line(456, 344, 60, 6)))


def s_marketing():
    return svg(
        r(90, 120, 300, 230, 16, PANEL, LINE) + p("M120 300 l60-50 50 30 70-90 60 40", sw=5)
        + c(180, 250, 7, WHITE) + c(230, 280, 7, WHITE) + c(300, 190, 7, WHITE) + c(360, 230, 7, WHITE)
        + p("M330 140 h40 v40", sw=5, stroke=G) + line(120, 150, 110, 10) + line(120, 170, 70, 8)
        + f'<g filter="url(#sh)">{r(380, 70, 190, 130, 18, PANEL2, LINE)}</g>'
        + p("M410 150 l50-34 v68 z", stroke=G, sw=4, fill="none") + p("M474 128 q20 22 0 44", sw=4) + p("M490 118 q32 32 0 64", sw=4, op=.6)
        + "".join(c(420 + i * 44, 250, 22, PANEL2, LINE) + c(420 + i * 44, 250, 9, G) for i in range(3))
        + r(400, 300, 170, 56, 14, G) + line(420, 322, 90, 8, INK))


def s_network():
    nodes = [(130, 110), (510, 110), (110, 330), (530, 330), (320, 60)]
    links = "".join(p(f"M320 220 L{x} {y}", stroke=LINE, sw=2.5) for x, y in nodes)
    return svg(
        links + p("M320 220 L130 110", sw=3, op=.9) + p("M320 220 L530 330", sw=3, op=.9)
        + "".join(r(x - 34, y - 24, 68, 48, 10, PANEL2, LINE) + line(x - 22, y - 8, 44, 6) + line(x - 22, y + 6, 28, 6) for x, y in nodes[:4])
        + f'<g filter="url(#sh)">{r(260, 190, 120, 60, 12, PANEL, G, sw=2.5)}</g>'
        + "".join(c(284 + i * 24, 220, 5, G) for i in range(4)) + p("M300 190 v-26 M340 190 v-26", stroke=GRAY, sw=3)
        + p("M290 150 q30-30 60 0", sw=3) + p("M275 134 q45-45 90 0", sw=3, op=.6)
        + r(300, 36, 40, 28, 8, PANEL2, LINE) + c(320, 50, 8, G))


def s_hosting():
    unit = lambda y, on: (r(120, y, 250, 56, 10, PANEL, LINE) + c(146, y + 28, 6, G if on else LINE)
                          + c(166, y + 28, 6, "#2f9e5b" if on else LINE) + line(190, y + 22, 120, 6) + line(190, y + 34, 70, 6)
                          + r(330, y + 18, 24, 20, 4, PANEL2, LINE))
    return svg(
        f'<g filter="url(#sh)">{unit(80, True)}{unit(150, True)}{unit(220, False)}{unit(290, True)}</g>'
        + c(500, 200, 84, PANEL, LINE, 2) + p("M416 200 h168 M500 116 v168", stroke=LINE, sw=1.5)
        + f'<ellipse cx="500" cy="200" rx="34" ry="84" stroke="{LINE}" stroke-width="1.5" fill="none"/>'
        + p("M430 150 q70 22 140 0 M430 250 q70-22 140 0", stroke=LINE, sw=1.5)
        + p("M370 150 q70-20 76 10", sw=3) + p("M370 318 q90 20 120-34", sw=3, op=.7) + c(500, 200, 8, G))


def s_cloud():
    return svg(
        f'<g filter="url(#sh)">' + p("M190 300 a64 64 0 0 1 8-126 a96 96 0 0 1 184-16 a78 78 0 0 1 40 142 z", stroke=LINE, sw=2.5, fill=PANEL2) + "</g>"
        + p("M190 300 a64 64 0 0 1 8-126 a96 96 0 0 1 184-16 a78 78 0 0 1 40 142 z", sw=3)
        + r(250, 230, 56, 40, 8, G, op=.9) + r(318, 230, 56, 40, 8, PANEL, G) + line(262, 244, 30, 6, INK) + line(330, 244, 30, 6, G)
        + p("M290 330 v40 m-14-14 l14 14 14-14", sw=4) + p("M350 370 v-40 m-14 14 l14-14 14 14", sw=4, stroke=WHITE)
        + r(100, 340, 120, 50, 10, PANEL, LINE) + line(116, 360, 70, 6) + r(420, 340, 120, 50, 10, PANEL, LINE) + line(436, 360, 70, 6)
        + c(90, 130, 8, G, op=.8) + c(560, 110, 6, G, op=.6))


def s_security():
    return svg(
        f'<g filter="url(#sh)">' + p("M320 60 l120 44 v100 c0 80-52 130-120 160 c-68-30-120-80-120-160 v-100 z", stroke=G, sw=4, fill=PANEL) + "</g>"
        + p("M320 92 l92 34 v78 c0 62-40 102-92 126 c-52-24-92-64-92-126 v-78 z", stroke=LINE, sw=2, fill=PANEL2)
        + p("M274 212 l34 34 66-72", sw=10, stroke=G)
        + r(80, 150, 90, 56, 10, PANEL2, LINE) + r(100, 130, 50, 36, 14, "none", GRAY, sw=4) + c(125, 180, 6, G)
        + p("M170 180 h26 M444 150 h50 v-40 h60 M444 250 h70 v50", stroke=LINE, sw=2) + c(554, 110, 7, G) + c(514, 300, 7, G)
        + r(500, 160, 90, 56, 10, PANEL2, LINE) + line(514, 176, 60, 6) + line(514, 190, 40, 6))


def s_ai():
    nodes = [(150, 120), (150, 220), (150, 320), (320, 90), (320, 190), (320, 290), (320, 370)]
    conns = "".join(p(f"M{a[0]} {a[1]} L490 {b}", stroke=LINE, sw=1.5) for a in nodes[3:] for b in (220,)) \
        + "".join(p(f"M{a[0]} {a[1]} L{b[0]} {b[1]}", stroke=LINE, sw=1.5) for a in nodes[:3] for b in nodes[3:])
    return svg(
        conns + "".join(c(x, y, 14, PANEL2, G if i % 2 == 0 else LINE, 2.5) for i, (x, y) in enumerate(nodes))
        + f'<g filter="url(#sh)">{r(440, 170, 100, 100, 18, PANEL, G, sw=3)}</g>'
        + "".join(r(458 + i * 24, 188 + j * 24, 14, 14, 3, G, op=.35 + ((i + j) % 3) * .3) for i in range(3) for j in range(3))
        + p("M470 170 v-20 M510 170 v-20 M470 270 v20 M510 270 v20 M440 200 h-20 M440 240 h-20 M540 200 h20 M540 240 h20", stroke=GRAY, sw=3)
        + r(380, 36, 200, 46, 14, PANEL2, LINE) + c(402, 59, 8, G) + line(420, 52, 120, 6) + line(420, 64, 70, 6)
        + r(60, 380, 150, 40, 14, G) + line(78, 397, 100, 6, INK))


def s_animation():
    return svg(
        f'<g filter="url(#sh)">{r(110, 90, 420, 250, 18, PANEL, LINE)}</g>' + r(130, 110, 380, 190, 10, INK, LINE)
        + c(320, 205, 46, G) + p("M308 182 l36 23 -36 23 z", stroke=INK, sw=2, fill=INK)
        + r(130, 316, 380, 8, 4, LINE) + r(130, 316, 210, 8, 4, G) + c(340, 320, 9, WHITE)
        + p("M150 260 C200 140 260 140 300 240", stroke=WHITE, sw=2, op=.35) + c(150, 260, 5, G) + c(300, 240, 5, G)
        + "".join(r(110 + i * 70, 370, 60, 44, 6, PANEL2, LINE) + (r(110 + i * 70, 370, 60, 44, 6, G, op=.35) if i == 2 else "") for i in range(6))
        + p("M560 100 l24 -26 M580 140 h30", sw=3, op=.7))


def s_support():
    return svg(
        f'<g filter="url(#sh)">{r(150, 80, 300, 200, 16, PANEL, LINE)}</g>' + r(166, 96, 268, 168, 8, INK, LINE)
        + p("M180 230 l40-36 36 20 50-60 40 30 50-40", sw=4) + r(260, 280, 80, 28, 4, PANEL2, LINE) + r(220, 306, 160, 12, 6, PANEL2, LINE)
        + p("M470 200 a60 60 0 0 1 120 0", sw=7, stroke=G) + r(458, 196, 28, 56, 10, PANEL2, G, sw=3) + r(574, 196, 28, 56, 10, PANEL2, G, sw=3)
        + p("M588 252 q0 40-50 44", sw=3, stroke=GRAY) + r(512, 288, 40, 18, 9, G)
        + p("M110 330 l56-56 m-6-18 a22 22 0 0 1 30 30 l-16 6 -8 -8 z", stroke=WHITE, sw=3) + c(118, 346, 8, G))


def s_stack():
    def layer(y, label_w, op):
        return (f'<g filter="url(#sh)"><path d="M320 {y} l190 56 -190 56 -190 -56 z" fill="{PANEL2}" stroke="{G if op == 1 else LINE}" stroke-width="2.5"/></g>'
                + f'<path d="M130 {y + 56} v22 l190 56 190 -56 v-22" stroke="{LINE}" stroke-width="2" fill="none"/>'
                + f'<path d="M320 {y + 18} l{label_w} 38 -{label_w} 38 -{label_w} -38 z" fill="{G}" opacity="{op * .55}"/>')
    return svg(layer(250, 60, .45) + layer(180, 90, .7) + layer(110, 120, 1)
               + p("M320 100 v-44 m-12 14 l12-14 12 14", sw=4)
               + r(70, 80, 90, 34, 10, PANEL2, LINE) + line(84, 94, 60, 6) + r(480, 330, 100, 34, 10, PANEL2, LINE) + line(494, 344, 70, 6)
               + c(520, 120, 7, G) + c(110, 340, 6, G, op=.7))


def s_hero():
    """Large composite scene for the home hero: browser + phone + code + gear."""
    return svg(
        browser(40, 60, 420, 280,
                r(62, 108, 240, 20, 6, G) + line(62, 140, 190, 10) + line(62, 158, 150, 10) + r(62, 184, 96, 30, 15, G)
                + r(320, 104, 120, 110, 12, PANEL2, LINE) + p("M334 190 l24-32 18 20 16-24 34 36", sw=3)
                + "".join(r(62 + i * 132, 240, 120, 80, 10, PANEL2, LINE) + r(72 + i * 132, 250, 30, 30, 8, G, op=.9)
                          + line(72 + i * 132, 290, 80) + line(72 + i * 132, 304, 50, 6) for i in range(3)))
        + phone(430, 110, 150, 290, r(446, 152, 118, 64, 12, G) + line(446, 232, 86) + line(446, 248, 60)
                + "".join(r(446, 276 + i * 38, 118, 30, 10, PANEL2, LINE) + c(462, 291 + i * 38, 7, G) for i in range(3)))
        + f'<g filter="url(#sh)">{r(300, 300, 150, 100, 14, INK, LINE)}</g>'
        + p("M326 336 l-16 14 16 14 M424 336 l16 14 -16 14 M378 330 l-18 40", stroke=G, sw=4)
        + c(110, 390, 24, PANEL2, G, 3) + c(110, 390, 8, G) + c(584, 70, 7, G, op=.8) + c(30, 250, 5, G, op=.6))


SCENES = {
    "hero": s_hero, "web": s_web, "mobile": s_mobile, "ecommerce": s_ecom, "software": s_software,
    "marketing": s_marketing, "network": s_network, "hosting": s_hosting, "cloud": s_cloud,
    "security": s_security, "ai": s_ai, "animation": s_animation, "support": s_support, "stack": s_stack,
}

if __name__ == "__main__":
    for name, fn in SCENES.items():
        with open(os.path.join(OUT, f"{name}.svg"), "w", encoding="utf-8") as f:
            f.write(fn())
    print("wrote", len(SCENES), "illustrations to", OUT)
