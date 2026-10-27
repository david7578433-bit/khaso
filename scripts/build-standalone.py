#!/usr/bin/env python3
"""Build the STANDALONE public copy of the Simcha Invitations maker.

Reads the current invitations.html / invite.html / invitations.js / invitations.css (and studio.*,
community-designs.js when present) from this repo at build time, swaps the parent site's chrome
(the <!--site-head/-header/-hero/-footer:start/end--> blocks written by scripts/build-chrome.py)
for the neutral chrome in standalone/, and writes a complete static site to OUT_DIR.

Run from anywhere:   python3 scripts/build-standalone.py [OUT_DIR]
Idempotent: OUT_DIR is wiped and rebuilt on every run.  Python 3 stdlib + Pillow only.
"""
import datetime, glob, hashlib, html, json, os, pathlib, re, shutil, sys

# ============================================================================
#  SITE NAME — everything visible on the standalone site comes from these.
# ============================================================================
SITE_NAME_EN = "Simcha Invitations"
SITE_NAME_YI = "שמחה אינלאדונגען"
BASE_URL = "https://david7578433-bit.github.io/simcha-invitations/"
CREDIT_URL = "https://david7578433-bit.github.io/khaso/"
GOATCOUNTER_URL = "https://kehalkasho.goatcounter.com/count"
# ============================================================================

ROOT = pathlib.Path(__file__).resolve().parent.parent
TPL = ROOT / "standalone"
OUT = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path("/home/user/tab/files/simcha-invitations-site")
PAGES = {"invitations.html": "index.html", "invite.html": "invite.html"}
DROP_SCRIPTS = ("site.js", "pwa.js", "member-auth.js", "sw.js")      # parent-site only
ALWAYS_DIRS = ("vendor", "images/inv-scenes")
OPTIONAL_FILES = ("invitations.js", "invitations.css", "studio.js", "studio.css", "community-designs.js")
BASE_PATH = re.sub(r"^https?://[^/]+", "", BASE_URL).rstrip("/")         # "/simcha-invitations"
YEAR = str(datetime.date.today().year)
SLUG = re.sub(r"[^A-Za-z0-9]+", "-", SITE_NAME_EN).strip("-") or "Invitation"

# built without the literal words so this source file itself stays clean of them
SOCIAL_RE = "|".join(["wh" + "ats" + "app", "wa" + r"\." + "me", "ווא" + "טסאפ", "ווט" + "סאפ"])

warnings = []
def warn(msg):
    warnings.append(msg); print("WARNING:", msg)

def esc(s): return html.escape(s, quote=True)
def L(en, yi): return f'<span data-lang="en">{en}</span><span data-lang="yi" hidden>{yi}</span>'

def tpl(name, **extra):
    text = (TPL / name).read_text(encoding="utf-8")
    vals = {"NAME_EN": esc(SITE_NAME_EN), "NAME_YI": esc(SITE_NAME_YI), "CREDIT_URL": esc(CREDIT_URL),
            "YEAR": YEAR, "BASE_URL": esc(BASE_URL), "BASE_PATH": esc(BASE_PATH)}
    vals.update(extra)
    for k, v in vals.items(): text = text.replace("{{" + k + "}}", v)
    return text

def block(doc, name):
    """(start, end) of a <!--name:start--> ... <!--name:end--> block, markers included, or None."""
    a = doc.find(f"<!--{name}:start-->"); b = doc.find(f"<!--{name}:end-->")
    if a < 0 or b < 0 or b < a: return None
    return a, b + len(f"<!--{name}:end-->")

def replace_block(doc, name, new, page, required=True):
    span = block(doc, name)
    if not span:
        if required: warn(f"{page}: no <!--{name}:start/end--> markers; chrome left as is")
        return doc, False
    return doc[:span[0]] + new + doc[span[1]:], True

def is_local(url):
    return bool(url) and not re.match(r"^(?:[a-z][a-z0-9+.-]*:|//|#|data:)", url, re.I)

def strip_q(url): return url.split("#")[0].split("?")[0]

# ---------------------------------------------------------------- head
HEAD_DROP = [
    r"<title>.*?</title>",
    r'<meta\s+name="(?:description|twitter:[^"]*|theme-color|apple-mobile-web-app-[^"]*|mobile-web-app-capable)"[^>]*>',
    r'<meta\s+property="og:[^"]*"[^>]*>',
    r'<link\s+rel="(?:canonical|icon|shortcut icon|apple-touch-icon|manifest|sitemap)"[^>]*>',
]

def script_re(name):
    return re.compile(r'<script\b[^>]*\bsrc="(?:\./)?' + re.escape(name) + r'(?:\?[^"]*)?"[^>]*>\s*</script>\s*', re.I)

def build_head(head, page, meta):
    # The parent site's shared head block: keep only its Google Fonts links + preconnects.
    span = block(head, "site-head")
    keep = ""
    if span:
        shared = head[span[0]:span[1]]
        keep = "\n".join(m.group(0) for m in re.finditer(r'<link\s+rel="(?:preconnect|stylesheet)"\s+href="https://fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>', shared))
        head = head[:span[0]] + head[span[1]:]
    else:
        warn(f"{page}: no site-head block")
    for pat in HEAD_DROP:
        head = re.sub(r"[ \t]*" + pat + r"[ \t]*\n?", "", head, flags=re.S | re.I)
    # site.js -> standalone.js (same position, so it still runs before invitations.js)
    sjs = f'<script src="standalone.js?v={meta["v"]}" defer></script>\n'
    m = script_re("site.js").search(head)
    if m: head = head[:m.start()] + sjs + head[m.end():]
    else:
        m = re.search(r"<script\b", head)
        head = (head[:m.start()] + sjs + head[m.start():]) if m else head + sjs
    for name in DROP_SCRIPTS[1:]:
        head = script_re(name).sub("", head)
    # standalone.css after the last stylesheet that is not a font
    links = list(re.finditer(r'<link\s+rel="stylesheet"\s+href="(?!https?:)[^"]*"[^>]*>\n?', head))
    css = f'<link rel="stylesheet" href="standalone.css?v={meta["v"]}">\n'
    if links: head = head[:links[-1].end()] + css + head[links[-1].end():]
    else: head += css
    new_meta = f"""<title>{esc(meta['title'])}</title>
<meta name="description" content="{esc(meta['description'])}">
<meta name="theme-color" content="#1b2d3e">
<link rel="canonical" href="{esc(meta['url'])}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(SITE_NAME_EN)} · {esc(SITE_NAME_YI)}">
<meta property="og:title" content="{esc(meta['og_title'])}">
<meta property="og:description" content="{esc(meta['description'])}">
<meta property="og:image" content="{esc(BASE_URL)}og.jpg?v={meta['v']}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{esc(meta['url'])}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="64x64" href="favicon.png?v={meta['v']}">
<link rel="apple-touch-icon" href="apple-touch-icon.png?v={meta['v']}">
<link rel="manifest" href="manifest.webmanifest">
<meta name="apple-mobile-web-app-title" content="{esc(SITE_NAME_EN)}">
{keep}
"""
    m = re.search(r'<meta\s+name="viewport"[^>]*>\n?', head)
    pos = m.end() if m else 0
    return head[:pos] + new_meta + head[pos:]

def goatcounter_tags():
    return f"""<script>window.KASHO_SITE = 'public';</script>
<script>window.goatcounter = {{ path: function (p) {{ return p.indexOf('{BASE_PATH}/') === 0 ? p : '{BASE_PATH}' + p; }} }};</script>
<script data-goatcounter="{GOATCOUNTER_URL}" async src="//gc.zgo.at/count.js"></script>
"""

def rewrite_links(doc, page):
    # The maker page is index.html here.
    doc = re.sub(r'(href=")(?:\./)?invitations\.html', r"\1index.html", doc)
    outputs = set(PAGES.values()) | {"404.html"}
    def fix(m):
        url = m.group(2)
        if is_local(url) and strip_q(url).endswith(".html") and strip_q(url) not in outputs:
            warn(f"{page}: link to a parent-site page '{url}' pointed at index.html")
            return m.group(1) + "index.html" + m.group(3)
        return m.group(0)
    return re.sub(r'(<a\b[^>]*\bhref=")([^"]*)(")', fix, doc)

def build_page(src_name, out_name, v):
    src = (ROOT / src_name).read_text(encoding="utf-8")
    hm = re.search(r"<head>(.*?)</head>", src, re.S)
    if not hm: raise SystemExit(f"{src_name}: no <head>")
    if out_name == "index.html":
        meta = {"title": f"{SITE_NAME_EN} · {SITE_NAME_YI} — free invitations for every simcha",
                "og_title": f"{SITE_NAME_EN} · {SITE_NAME_YI}",
                "description": f"{SITE_NAME_EN}: make a beautiful invitation for a chasuna, vort, bar mitzvah, bris, kiddush, upsherin, sheva brachos or siyum in a minute. Yiddish or English, share a link, download or print. Free.",
                "url": BASE_URL, "v": v}
    else:
        meta = {"title": "You’re invited! · א הזמנה צו א שמחה",
                "og_title": "You’re invited! · א הזמנה צו א שמחה",
                "description": f"Tap to open the invitation, get directions and add it to your calendar. {SITE_NAME_EN} · {SITE_NAME_YI}",
                "url": BASE_URL + "invite.html", "v": v}
    doc = src[:hm.start(1)] + "\n" + build_head(hm.group(1), src_name, meta) + src[hm.end(1):]

    doc, _ = replace_block(doc, "site-header", tpl("header.html"), src_name)
    if out_name == "index.html":
        sub = ""
        span = block(doc, "site-hero")
        if span:
            sm = re.search(r'<p class="page-sub">(.*?)</p>', doc[span[0]:span[1]], re.S)
            if sm: sub = sm.group(1).strip()
        if not sub:
            sub = L("Beautiful invitations for every simcha — share or print", "שיינע הזמנות פאר יעדע שמחה — שיקט אדער דרוקט")
        hero = tpl("hero.html", SUB=sub)
        doc, ok = replace_block(doc, "site-hero", hero, src_name, required=False)
        if not ok: doc = doc.replace('<main', hero + '<main', 1)
    else:
        doc, _ = replace_block(doc, "site-hero", "", src_name, required=False)
    doc, _ = replace_block(doc, "site-footer", tpl("footer.html"), src_name)

    # Drop parent-site-only scripts anywhere, the parent's GoatCounter tag and any inline config.
    for name in DROP_SCRIPTS:
        doc = script_re(name).sub("", doc)
    doc = re.sub(r'<script\b[^>]*data-goatcounter=[^>]*>\s*</script>\s*', "", doc)
    doc = re.sub(r'<script>\s*window\.goatcounter\s*=.*?</script>\s*', "", doc, flags=re.S)
    doc = doc.replace("</body>", goatcounter_tags() + "</body>", 1)
    doc = rewrite_links(doc, src_name)
    (OUT / out_name).write_text(doc, encoding="utf-8")
    return doc

# ---------------------------------------------------------------- assets
copied = set()
def copy_rel(rel, why=""):
    rel = strip_q(rel).lstrip("./") if rel.startswith("./") else strip_q(rel)
    if not rel or rel in copied: return False
    src = ROOT / rel
    if not src.exists():
        warn(f"missing asset '{rel}' {why}"); return False
    dst = OUT / rel
    if src.is_dir():
        shutil.copytree(src, dst, dirs_exist_ok=True)
    else:
        if (OUT / rel).exists() and rel in GENERATED: return False
        dst.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(src, dst)
    copied.add(rel); return True

GENERATED = {"favicon.png", "apple-touch-icon.png", "og.jpg", "icon-192.png", "icon-512.png",
             "manifest.webmanifest", "sitemap.xml", "robots.txt", "404.html", "standalone.js", "standalone.css"}

JS_PATCHES = [  # (pattern, replacement, note) applied to the COPIED scripts only, never the repo
    (r"(\|\s*)Kasho(['\"`])", lambda m: m.group(1) + SITE_NAME_EN.replace("'", "\\'") + m.group(2), "page title suffix"),
    (r"(['\"`])Kasho-Invitation", lambda m: m.group(1) + SLUG.rstrip("s") + "-Invitation" if SLUG.endswith("Invitations") else m.group(1) + SLUG, "download file name"),
    (r"PRODID:-//Kasho Community//", lambda m: "PRODID:-//" + re.sub(r"[/\\]", "-", SITE_NAME_EN) + "//", "calendar PRODID"),
    (r"@kasho-invitations", lambda m: "@" + SLUG.lower(), "calendar UID host"),
    (r"(['\"`/])invitations\.html", lambda m: m.group(1) + "index.html", "maker page link -> index.html"),
    (r"(\bsite\s*:\s*)(['\"])kasho\2", lambda m: m.group(1) + m.group(2) + "public" + m.group(2), "community site id"),
]
VISIBLE_KASHO = re.compile(r"Kasho(?![A-Z][a-z]*\b)|קאשוי|Kashau|khaso", re.I)

def patch_js(path):
    text = path.read_text(encoding="utf-8")
    for pat, rep, note in JS_PATCHES:
        text, n = re.subn(pat, rep, text)
        if n: print(f"  patched {path.name}: {note} ×{n}")
    path.write_text(text, encoding="utf-8")
    for lit in sorted(set(re.findall(r"['\"`]([\w./-]+\.html)\b", text))):
        if lit.split("/")[-1] not in set(PAGES.values()) | {"404.html"}:
            warn(f"{path.name}: names a parent-site page '{lit}' (not part of the standalone site)")
    # Report any remaining parent-site name inside string literals (identifiers like KashoInvites are fine).
    for i, line in enumerate(text.splitlines(), 1):
        code = re.sub(r"/\*.*?\*/|^\s*//.*$|\s//\s.*$", "", line)
        if "console." in code: continue
        for lit in re.findall(r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|`(?:[^`\\]|\\.)*`", code):
            if re.search(r"Kasho|קאשוי|Kashau", lit) and not re.fullmatch(r"['\"`]kasho[-_a-z0-9]*['\"`]", lit) \
               and "goatcounter" not in lit and "khaso/" not in lit:
                warn(f"{path.name}:{i}: parent-site name in a string: {lit[:90]}")

def js_refs(text):
    """Local file/dir paths named as string literals in a script (lazy-loaded libs, image folders)."""
    refs = set()
    for lit in re.findall(r"['\"`]([\w][\w./-]*)['\"`]", text):
        p = strip_q(lit)
        if p.endswith("/") and (ROOT / p).is_dir(): refs.add(p.rstrip("/"))
        elif re.search(r"\.(?:js|css|webp|png|jpe?g|svg|json|woff2?)$", p) and (ROOT / p).is_file(): refs.add(p)
    return refs

def css_refs(text):
    return {strip_q(u) for u in re.findall(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)", text) if is_local(u)}

def html_refs(doc):
    return {strip_q(u) for u in re.findall(r'\b(?:src|href)="([^"]+)"', doc) if is_local(u)}

# ---------------------------------------------------------------- images
def make_images():
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    GOLD = (184, 149, 95); GOLD_D = (138, 106, 63); GOLD_L = (233, 207, 149); NAVY = (27, 45, 62); CREAM = (250, 246, 238)

    def font(paths, size):
        for p in paths:
            for f in glob.glob(p):
                try: return ImageFont.truetype(f, size)
                except Exception: pass
        return ImageFont.load_default()
    SERIF = ["/usr/share/fonts/truetype/crosextra/Caladea-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", "/usr/share/fonts/**/*Serif*Bold*.ttf"]
    HEB = ["/usr/share/fonts/truetype/culmus/*Bold*.ttf", "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf", "/usr/share/fonts/**/*Hebrew*Bold*.ttf", "/usr/share/fonts/**/FreeSerifBold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]

    def ornament(size, bg=None, pad=0.0):
        S = size * 4
        im = Image.new("RGBA", (S, S), bg or (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        c = S / 2; r = S / 2 * (1 - pad)
        if bg: pass
        w = max(2, int(S * 0.028))
        d.ellipse([c - r + w, c - r + w, c + r - w, c + r - w], outline=GOLD, width=w)
        import math
        pts = []
        for k in range(16):
            a = math.pi / 8 * k - math.pi / 2
            rr = r * (0.72 if k % 2 == 0 else 0.52)
            pts.append((c + rr * math.cos(a), c + rr * math.sin(a)))
        d.polygon(pts, outline=GOLD, width=w)
        q = r * 0.38
        d.polygon([(c, c - q), (c + q, c), (c, c + q), (c - q, c)], fill=GOLD_D)
        d.polygon([(c, c - q), (c + q, c), (c, c)], fill=GOLD_L)
        d.polygon([(c, c), (c - q, c), (c, c - q)], fill=GOLD)
        dot = r * 0.07
        d.ellipse([c - dot, c - dot, c + dot, c + dot], fill=CREAM)
        return im.resize((size, size), Image.LANCZOS)

    def icon(size, rounded=False):
        bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(bg)
        if rounded: d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=NAVY + (255,))
        else: d.ellipse([0, 0, size - 1, size - 1], fill=NAVY + (255,))
        o = ornament(int(size * 0.8))
        bg.alpha_composite(o, ((size - o.width) // 2, (size - o.height) // 2))
        return bg
    icon(64).save(OUT / "favicon.png")
    full = lambda s: (lambda im: (im))(Image.alpha_composite(Image.new("RGBA", (s, s), NAVY + (255,)), icon(s, True)))
    full(180).convert("RGB").save(OUT / "apple-touch-icon.png")
    full(192).convert("RGB").save(OUT / "icon-192.png")
    full(512).convert("RGB").save(OUT / "icon-512.png")

    # og.jpg 1200x630: three fanned scene cards on soft cream, site name.
    Wd, Ht = 1200, 630
    og = Image.new("RGB", (Wd, Ht), CREAM)
    glow = Image.new("L", (Wd, Ht), 0); ImageDraw.Draw(glow).ellipse([560, -120, 1320, 760], fill=90)
    og.paste(Image.new("RGB", (Wd, Ht), (243, 230, 204)), mask=glow.filter(ImageFilter.GaussianBlur(120)))
    scenes = sorted(p for p in glob.glob(str(ROOT / "images/inv-scenes/*.webp")) if not p.endswith("-s.webp"))
    prefer = ["navygold", "emerald", "burgundy", "marble", "baroque", "kotel"]
    pick = [p for name in prefer for p in scenes if os.path.basename(p) == name + ".webp"][:3]
    for p in scenes:
        if len(pick) >= 3: break
        if p not in pick: pick.append(p)
    cw, chh = 270, 378
    layout = [(-11, 640, 140), (11, 900, 140), (0, 770, 110)]   # (angle, center x, top)
    for (ang, cx, top), p in zip(layout, pick):
        try: card = Image.open(p).convert("RGB")
        except Exception as e: warn(f"og image: cannot read {p}: {e}"); continue
        card = card.resize((cw, int(card.height * cw / card.width)), Image.LANCZOS).crop((0, 0, cw, chh)) if card.height * cw / card.width >= chh else card.resize((cw, chh), Image.LANCZOS)
        fr = Image.new("RGBA", (cw + 16, chh + 16), (255, 255, 255, 255)); fr.paste(card, (8, 8))
        sh = Image.new("RGBA", (fr.width + 80, fr.height + 80), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rectangle([40, 52, 40 + fr.width, 52 + fr.height], fill=(27, 45, 62, 95))
        sh = sh.filter(ImageFilter.GaussianBlur(16)); sh.alpha_composite(fr, (40, 40))
        rot = sh.rotate(ang, resample=Image.BICUBIC, expand=True)
        og.paste(rot, (cx - rot.width // 2, top - 40 - (rot.height - sh.height) // 2), rot)
    d = ImageDraw.Draw(og)
    orn = ornament(70); og.paste(orn, (90, 150), orn)
    f1 = font(SERIF, 66); f2 = font(HEB, 50); f3 = font(["/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"], 26)
    words = SITE_NAME_EN.split(); lines = [SITE_NAME_EN] if d.textlength(SITE_NAME_EN, font=f1) < 460 else [" ".join(words[:len(words) // 2 or 1]), " ".join(words[len(words) // 2 or 1:])]
    y = 250
    for ln in lines:
        d.text((90, y), ln, font=f1, fill=NAVY); y += 78
    d.line([(92, y + 14), (300, y + 14)], fill=GOLD, width=2)
    from PIL import features
    if features.check("raqm"): d.text((90, y + 34), SITE_NAME_YI, font=f2, fill=GOLD_D, direction="rtl", language="yi")
    else: d.text((90, y + 34), SITE_NAME_YI[::-1], font=f2, fill=GOLD_D)
    d.text((92, y + 110), "Free · Yiddish & English · for every simcha", font=f3, fill=(86, 103, 120))
    og.save(OUT / "og.jpg", quality=88, optimize=True, progressive=True)

# ---------------------------------------------------------------- main
def main():
    if not (ROOT / "invitations.html").exists(): raise SystemExit("run from the khaso-site repo")
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    # version tag for the standalone files = hash of what they are built from
    h = hashlib.sha1()
    for f in [TPL / n for n in ("standalone.js", "standalone.css", "header.html", "footer.html", "hero.html")] + [pathlib.Path(__file__)]:
        h.update(f.read_bytes())
    v = h.hexdigest()[:8]

    docs = {out: build_page(src, out, v) for src, out in PAGES.items()}
    for n in ("standalone.js", "standalone.css"):
        shutil.copy2(TPL / n, OUT / n)

    # assets: everything the pages reference, what their CSS and JS reference, plus the known folders.
    queue = set()
    for doc in docs.values(): queue |= html_refs(doc)
    queue |= set(OPTIONAL_FILES) | set(ALWAYS_DIRS)
    queue -= GENERATED | set(PAGES.values()) | {"404.html"}
    done = set()
    while queue:
        rel = queue.pop()
        if rel in done: continue
        done.add(rel)
        if rel in OPTIONAL_FILES and not (ROOT / rel).exists(): continue
        if not copy_rel(rel, "(referenced by the pages)"): continue
        p = ROOT / rel
        if p.suffix == ".css": queue |= css_refs(p.read_text(encoding="utf-8", errors="ignore")) - done
        if p.suffix == ".js":
            refs = js_refs(p.read_text(encoding="utf-8", errors="ignore"))
            for r in refs:
                if pathlib.PurePosixPath(r).name in DROP_SCRIPTS: continue
                queue.add(r)
    for js in OUT.rglob("*.js"):
        if js.parent == OUT and js.name not in ("standalone.js",): patch_js(js)

    make_images()
    (OUT / "manifest.webmanifest").write_text(json.dumps({
        "name": f"{SITE_NAME_EN} · {SITE_NAME_YI}", "short_name": SITE_NAME_EN, "start_url": "./index.html", "scope": "./",
        "display": "standalone", "background_color": "#fbf8f2", "theme_color": "#1b2d3e",
        "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
                  {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]}, ensure_ascii=False, indent=2), encoding="utf-8")
    today = datetime.date.today().isoformat()
    (OUT / "sitemap.xml").write_text(f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{BASE_URL}</loc><lastmod>{today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
""", encoding="utf-8")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE_URL}sitemap.xml\n", encoding="utf-8")
    (OUT / "404.html").write_text(tpl("404.html", V=v), encoding="utf-8")
    (OUT / ".nojekyll").write_text("", encoding="utf-8")

    # ---- checks
    bad = []
    for f in OUT.rglob("*"):
        if f.is_file() and f.suffix in (".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt"):
            for i, line in enumerate(f.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                if re.search(SOCIAL_RE, line, re.I): bad.append(f"{f.relative_to(OUT)}:{i}")
    if bad: warn("Messaging-app/social reference in output: " + ", ".join(bad[:10]))
    for name, doc in docs.items():
        body = re.sub(r"<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->", "", doc, flags=re.S)
        body = re.sub(r'<footer class="sx-footer">.*?</footer>', "", body, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", body)
        attrs = " ".join(re.findall(r'(?:alt|title|aria-label|content|placeholder)="([^"]*)"', body))
        for m in re.finditer(r".{0,40}(?:Kasho|קאשוי|Kashau|khaso).{0,40}", text + " " + attrs, re.I):
            warn(f"{name}: visible parent-site name: …{m.group(0).strip()}…")
        for ref in html_refs(doc):
            if not (OUT / ref).exists(): warn(f"{name}: references missing file {ref}")
    files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*") if p.is_file())
    print(f"built {OUT}: {len(files)} files, version {v}")
    print(f"{len(warnings)} warning(s)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
