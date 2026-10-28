"""Parça geometrilerini üretir: data/pieces.json + assets/pieces/*.svg
Tüm parçalar aynı ölçekte: ana yıldızın dış yarıçapı = 1 birim.
"""
import math, os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C45 = math.cos(math.pi/4); C225 = math.cos(math.pi/8); S225 = math.sin(math.pi/8)

def deg(a): return math.radians(a)

def star(n, R, r, rot=-90):
    pts = []
    for k in range(n):
        a = deg(rot + 360*k/n); pts.append((R*math.cos(a), R*math.sin(a)))
        b = deg(rot + 360*(k+.5)/n); pts.append((r*math.cos(b), r*math.sin(b)))
    return pts

def regular(n, R, rot=-90):
    return [(R*math.cos(deg(rot+360*k/n)), R*math.sin(deg(rot+360*k/n))) for k in range(n)]

def star_inner_radius(n, tip_angle_deg, R=1.0):
    half_tip = tip_angle_deg/2; half_center = 180/n
    inner = 180 - half_tip - half_center
    return R*math.sin(deg(half_tip))/math.sin(deg(inner))

def clip_below(pts, ymax):
    out = []; n = len(pts)
    for i in range(n):
        p, q = pts[i], pts[(i+1) % n]
        pin, qin = p[1] <= ymax, q[1] <= ymax
        if pin: out.append(p)
        if pin != qin:
            t = (ymax-p[1])/(q[1]-p[1]); out.append((p[0]+t*(q[0]-p[0]), ymax))
    return out

def recenter(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    cx = (min(xs)+max(xs))/2; cy = (min(ys)+max(ys))/2
    return [(x-cx, y-cy) for x, y in pts]

def interior_angles(pts):
    n = len(pts); out = []
    for i in range(n):
        p0, p1, p2 = pts[i-1], pts[i], pts[(i+1) % n]
        a1 = math.atan2(p0[1]-p1[1], p0[0]-p1[0]); a2 = math.atan2(p2[1]-p1[1], p2[0]-p1[0])
        ang = math.degrees((a1-a2) % (2*math.pi))
        out.append(round(ang, 1))
    # polygon winding: ensure angles are interior (sum = (n-2)*180)
    if abs(sum(out) - (n-2)*180) > 1:
        out = [round(360-a, 1) for a in out]
    return out

def cross(c=2*(1-C45), L=2*C45-1, tip=1-C45):
    """Yıldız-haç döşemesinin haçı. Varsayılanlar 8 köşeli yıldızla (R=1) birebir örtüşür:
    bütün kenarlar yıldız kenarına (√2−1) eşittir; haç merkezleri yıldız merkezinden (±1, ±1) uzaktadır."""
    h = c/2; e = h+L
    arm = [(-h, -e), (0, -e-tip), (h, -e), (h, -h)]
    pts = []
    for k in range(4):
        a = deg(90*k)
        for (x, y) in arm:
            pts.append((x*math.cos(a)-y*math.sin(a), x*math.sin(a)+y*math.cos(a)))
    return pts

ap = 0.5*math.tan(deg(54))
r10 = star_inner_radius(10, 72)
star10 = star(10, 1.0, r10)
S10 = math.dist(star10[0], star10[1])
star12 = star(12, 1.0, star_inner_radius(12, 60))
S12 = math.dist(star12[0], star12[1])   # {12/4} yıldızının kenarı   # {10/3} yıldızının kenarı; 10'lu dolgular bu kenarla birebir örtüşür
# düzgün beşgen, kenar = yıldız kenarı (yıldızın 108° çentiğine tam oturur, on tanesi yıldızı çevreler), tepe yukarıda
pent = recenter(regular(5, S10/(2*math.sin(deg(36))), rot=-90))

PIECES = [
  # ---- 8'li sistem ----
  dict(id="sekiz-kose-yildiz", name="Sekiz köşeli yıldız", family=8, role="merkez", color="#1f2a7a",
       pts=star(8, 1.0, C45/C225), note="İki karenin 45° döndürülmüş birleşimi"),
  dict(id="hac", name="Sivri uçlu haç", family=8, role="dolgu", color="#ece9e2",
       pts=cross(), note="Yıldız-haç döşemesinde dört yıldızın arasını doldurur; merkezi yıldızdan (1,1) uzakta"),
  dict(id="kare-kucuk", name="Kare (küçük)", family=8, role="dolgu", color="#6aa6c8",
       pts=[(-.5, -.5), (.5, -.5), (.5, .5), (-.5, .5)], note=""),
  dict(id="kare-buyuk", name="Kare (büyük)", family=8, role="dolgu", color="#6aa6c8",
       pts=[(-.65, -.65), (.65, -.65), (.65, .65), (-.65, .65)], note=""),
  dict(id="dikdortgen-baklava", name="Dikdörtgen + baklava", family=8, role="köprü", color="#4b5bb5",
       pts=[(-1.8, -.65), (-.75, -.65), (0, -1.4), (.75, -.65), (1.8, -.65), (1.8, .65), (.75, .65), (0, 1.4), (-.75, .65), (-1.8, .65)],
       note="İki yıldız arası köprü (fotoğraftan oranlandı)"),
  dict(id="ucurtma", name="Uçurtma (deltoid)", family=8, role="dilim", color="#ece9e2",
       pts=recenter([(0, -0.65), (S225, -0.65+C225), (0, -0.65+C225+S225), (-S225, -0.65+C225)]),
       note="Sekiz köşeli yıldızın 1/8 dilimi"),
  # ---- 10'lu sistem ----
  dict(id="on-kose-yildiz", name="On köşeli yıldız", family=10, role="merkez", color="#6aa6c8",
       pts=star10, note="{10/3} yıldızı, uç 72°"),
  dict(id="bes-kose-yildiz", name="Beş köşeli yıldız", family=10, role="merkez", color="#4f7f93",
       pts=star(5, 1.0, 0.381966), note="Pentagram"),
  dict(id="yarim-yildiz", name="Yarım on köşeli yıldız", family=10, role="sınır", color="#4f7f93",
       pts=recenter(clip_below(star(10, 1.0, r10), 0.45)), note="Desenin kenarını bitiren parça"),
  dict(id="besgen", name="Beşgen", family=10, role="dolgu", color="#b8392e", pts=pent, note="Düzgün beşgen, 108°; kenar = 10'lu yıldız kenarı"),
  dict(id="besgen-uzun", name="Uzun beşgen", family=10, role="dolgu", color="#b8392e",
       pts=recenter([(-.5, 0), (-.5, -0.75), (0, -0.75-ap), (.5, -0.75), (.5, 0)]), note="Beşgen çatı + uzun duvar"),
  # papyon ve dörtgen: build/hankin.mjs kesin deseninden (girih ongen + papyon döşemesi, 54°); ağırlık merkezi orijinde
  dict(id="papyon", name="Papyon", family=10, role="köprü", color="#e2a92b",
       pts=[(0.224514, 0.309017), (0.000000, 0.236068), (-0.224514, 0.309017), (-0.449028, 0.000000), (-0.224514, -0.309017), (0.000000, -0.236068), (0.224514, -0.309017), (0.449028, 0.000000)],
       note="Kesin desenden; açılar 108° ve iki içbükey 216°. Fiziksel setteki papyondan küçük"),
  dict(id="dortgen-10", name="Dörtgen (10'lu)", family=10, role="dolgu", color="#ece9e2",
       pts=[(0.000000, 0.250000), (-0.224514, -0.059017), (0.000000, -0.131966), (0.224514, -0.059017)],
       note="Kesin desenden; 144° köşesi papyonun 216° çentiğine oturur. Fiziksel sette yok"),
  dict(id="centikli-altigen", name="Çentikli uzun altıgen", family=10, role="köprü", color="#ece9e2",
       pts=[(-0.75, 0), (-0.5, -1.0), (0, -0.72), (0.5, -1.0), (0.75, 0), (0.5, 1.0), (0, 0.72), (-0.5, 1.0)], note="Fotoğraftan oranlandı"),
  dict(id="cift-ev", name="Çift ev", family=10, role="dolgu", color="#ece9e2",
       pts=recenter([(-1, 0), (-1, -0.6), (-0.5, -1.0), (0, -0.6), (0.5, -1.0), (1, -0.6), (1, 0), (0, 0.8)]), note="Fotoğraftan oranlandı"),
  dict(id="ok-ucu", name="Ok ucu", family=10, role="dolgu", color="#1f2a7a",
       pts=recenter([(-1.1, -0.05), (-0.3, -0.3), (0, -1.0), (0.25, -0.3), (1.1, -0.3), (0.15, 0.55)]), note="Yıldız kolları arası içbükey dolgu"),
  dict(id="kalkan-kucuk", name="Taçlı kalkan (küçük)", family=10, role="dolgu", color="#e2a92b",
       pts=recenter([(-0.9, -0.6), (-0.45, -0.25), (0, -0.8), (0.45, -0.25), (0.9, -0.6), (0.6, 0.7), (0, 1.1), (-0.6, 0.7)]), note="Fotoğraftan oranlandı"),
  dict(id="kalkan-uzun", name="Taçlı kalkan (uzun)", family=10, role="dolgu", color="#6aa6c8",
       pts=recenter([(-0.7, -1.1), (-0.35, -0.75), (0, -1.3), (0.35, -0.75), (0.7, -1.1), (0.7, 0.3), (0, 1.3), (-0.7, 0.3)]), note="Fotoğraftan oranlandı"),
  # ---- 6'lı sistem ----
  dict(id="alti-kose-yildiz", name="Altı köşeli yıldız", family=6, role="merkez", color="#2e7d6b",
       pts=star(6, 1.0, 1/math.sqrt(3)), note="İki eşkenar üçgen (hexagram)"),
  dict(id="altigen", name="Düzgün altıgen", family=6, role="dolgu", color="#d9c46a",
       pts=regular(6, 1/math.sqrt(3), rot=-60), note="Kenar = yıldız kolu, 120°; düz tepeli: 6'lı desendeki altıgenler 0° dönmeyle oturur (R 60° adımla döndürür)"),
  dict(id="eskenar-ucgen", name="Eşkenar üçgen", family=6, role="dolgu", color="#ece9e2",
       pts=recenter(regular(3, 1/math.sqrt(3), rot=-90)), note="60°"),
  dict(id="eskenar-dortgen", name="Eşkenar dörtgen (60°)", family=6, role="dolgu", color="#c96a3b",
       pts=[(0, -0.866), (0.5, 0), (0, 0.866), (-0.5, 0)], note="Açılar 60° / 120°"),
  dict(id="sevron", name="Şevron (ok)", family=6, role="dolgu", color="#2e7d6b",
       pts=recenter([(0, -1.0), (0.866, 0.5), (0.433, 0.75), (0, 0.0), (-0.433, 0.75), (-0.866, 0.5)]), note="Yıldız kolları arası dolgu"),
  # ---- 12'li sistem ----
  # kare, üçgen, altıgen: kenar = 12'li yıldızın kenarı (S12); kare yıldızın 90° çentiğine tam oturur
  dict(id="oniki-kose-yildiz", name="On iki köşeli yıldız", family=12, role="merkez", color="#7a3b8f",
       pts=star(12, 1.0, star_inner_radius(12, 60)), note="{12/4} yıldızı, uç 60°"),
  dict(id="altigen-12", name="Altıgen (12'li)", family=12, role="dolgu", color="#d9c46a",
       pts=regular(6, S12, rot=0), note="3.4.6.4 döşemesinin altıgeni; kenar = 12'li yıldız kenarı"),
  dict(id="kare-12", name="Kare (12'li)", family=12, role="dolgu", color="#6aa6c8",
       pts=regular(4, S12/math.sqrt(2), rot=45), note="Kenar = 12'li yıldız kenarı; yıldızın 90° çentiğine oturur"),
  dict(id="ucgen-12", name="Üçgen (12'li)", family=12, role="dolgu", color="#ece9e2",
       pts=recenter(regular(3, S12/math.sqrt(3), rot=-90)), note="Kenar = 12'li yıldız kenarı"),
  dict(id="kalkan-12", name="Kalkan (12'li)", family=12, role="dolgu", color="#7a3b8f",
       pts=recenter([(-0.5, -0.5), (-0.25, -0.2), (0, -0.55), (0.25, -0.2), (0.5, -0.5), (0.5, 0.3), (0, 0.75), (-0.5, 0.3)]), note="Yıldız kolları arası dolgu"),
]

def svg(p, standalone):
    pts = p["pts"]; xs = [a for a, b in pts]; ys = [b for a, b in pts]; pad = .12
    minx, maxx, miny, maxy = min(xs)-pad, max(xs)+pad, min(ys)-pad, max(ys)+pad
    w, h = maxx-minx, maxy-miny
    d = "M"+" L".join(f"{x:.4f},{y:.4f}" for x, y in pts)+" Z"
    body = f'<path d="{d}" fill="{p["color"]}" stroke="#2b2a26" stroke-width="0.03" stroke-linejoin="round"/>'
    vb = f'viewBox="{minx:.3f} {miny:.3f} {w:.3f} {h:.3f}"'
    if standalone:
        return f'<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" {vb} width="{w*100:.0f}" height="{h*100:.0f}"><title>{p["name"]}</title>{body}</svg>\n'
    return f'<svg {vb}>{body}</svg>'

os.makedirs(f"{ROOT}/assets/pieces", exist_ok=True)
os.makedirs(f"{ROOT}/data", exist_ok=True)
out = []
for p in PIECES:
    pts = [(round(x, 4), round(y, 4)) for x, y in p["pts"]]
    open(f"{ROOT}/assets/pieces/{p['id']}.svg", "w", encoding="utf-8").write(svg(p, True))
    out.append(dict(id=p["id"], name=p["name"], family=p["family"], role=p["role"], color=p["color"],
                    points=pts, angles=interior_angles(pts), note=p["note"], svg=f"assets/pieces/{p['id']}.svg"))
json.dump(dict(unit="ana yıldız dış yarıçapı = 1", pieces=out), open(f"{ROOT}/data/pieces.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "parça yazıldı")
for p in out: print(f"{p['id']:22} f{p['family']:>2}  {p['angles']}")
