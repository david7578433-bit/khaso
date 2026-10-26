#!/usr/bin/env python3
"""Rebuild the shared site chrome (header, page title band, footer) on every page.

Safe to rerun: each block sits between <!--site-...:start--> / <!--site-...:end--> markers.
Run from the repo root:  python3 scripts/build-chrome.py
admin.html is skipped on purpose (it has its own layout and does not load site.js).
"""
import html, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSET_VERSION = "20261026-2"
SKIP = {"admin.html"}
FLOATING = {"ages.html"}          # full-screen chat app: menu button only, no page band/footer

def L(en, yi):
    return f'<span data-lang="en">{en}</span><span data-lang="yi" hidden>{yi}</span>'

NAV = [
    ("about.html", "About", "וועגן אונדז", None),
    (None, "News &amp; Simchas", "נייעס און שמחות", [
        ("news.html", "News", "נייעס"),
        ("simchas.html", "Simchas", "שמחות"),
        ("editorial.html", "Send something in", "שיקט עפעס אריין"),
    ]),
    (None, "Botei Medrash", "בתי מדרשים", [
        ("botei-medrash.html", "All botei medrash", "אלע בתי מדרשים"),
        ("beis-medrash-williamsburg.html", "Williamsburg", "וויליאמסבורג"),
        ("beis-medrash-monsey.html", "Monsey", "מאנסי"),
        ("beis-medrash-kiryas-joel.html", "Kiryas Joel", "קרית יואל"),
    ]),
    ("yeshiva.html", "Yeshiva", "ישיבה", None),
    ("zmanim.html", "Zmanim", "זמנים", None),
    ("pictures.html", "Pictures", "בילדער", None),
    (None, "More", "מער", [
        ("recordings.html", "Recordings", "רעקארדירונגען"),
        ("business.html", "Business directory", "געשעפטן"),
        ("ages-hub.html", "Ages (members)", "יארגאנג (מעמבערס)"),
        ("ages.html", "Kasho Chat", "קאשוי שמועס"),
    ]),
    (None, "Contact", "קאנטאקט", [
        ("contact.html", "Contact us", "קאנטאקט"),
        ("contact-monsey.html", "Monsey", "מאנסי"),
        ("contact-kiryas-joel.html", "Kiryas Joel", "קרית יואל"),
    ]),
]

# Breadcrumb parents and the short line under each page title.
PARENT = {
    "beis-medrash-williamsburg.html": ("botei-medrash.html", "Botei Medrash", "בתי מדרשים"),
    "beis-medrash-monsey.html": ("botei-medrash.html", "Botei Medrash", "בתי מדרשים"),
    "beis-medrash-kiryas-joel.html": ("botei-medrash.html", "Botei Medrash", "בתי מדרשים"),
    "contact-monsey.html": ("contact.html", "Contact", "קאנטאקט"),
    "contact-kiryas-joel.html": ("contact.html", "Contact", "קאנטאקט"),
    "age-photos.html": ("ages-hub.html", "Ages", "יארגאנג"),
    "phone-book.html": ("ages-hub.html", "Ages", "יארגאנג"),
    "gallery.html": ("pictures.html", "Pictures", "בילדער"),
    "thread.html": ("ages.html", "Kasho Chat", "קאשוי שמועס"),
}
SUBTITLE = {
    "about.html": ("From Kassa to Williamsburg, Kiryas Kashau and Monsey", "פון קאשוי ביז וויליאמסבורג, קרית קאשוי און מאנסי"),
    "news.html": ("Community news and Kasho coverage", "נייעס פון דער קהילה"),
    "simchas.html": ("Mazel tov announcements from our community", "מזל טוב מודעות פון אונדזער קהילה"),
    "editorial.html": ("Send in news or a simcha for the site", "שיקט אריין נייעס אדער א שמחה"),
    "contact.html": ("Reach the Monsey and Kiryas Joel botei medrash", "קאנטאקט מיט די בתי מדרשים אין מאנסי און קרית יואל"),
    "contact-monsey.html": ("Beis medrash · 48 Suzanne Dr, Spring Valley, NY", "בית מדרש · 48 Suzanne Dr, Spring Valley, NY"),
    "contact-kiryas-joel.html": ("Beis medrash · 2 Shinev Ct, Kiryas Joel, NY", "בית מדרש · 2 Shinev Ct, Kiryas Joel, NY"),
    "botei-medrash.html": ("Williamsburg · Monsey · Kiryas Joel", "וויליאמסבורג · מאנסי · קרית יואל"),
    "yeshiva.html": ("Yeshiva Ktana, Yeshiva Gedola and camp", "ישיבה קטנה, ישיבה גדולה און קעמפ"),
    "zmanim.html": ("Daily halachic times for our communities", "טעגליכע זמנים פאר אונדזערע קהילות"),
    "pictures.html": ("Photo albums from the community", "בילדער פון דער קהילה"),
    "recordings.html": ("Divrei Kodesh and recordings", "דברות קודש און רעקארדירונגען"),
    "business.html": ("Businesses in our community", "געשעפטן פון אונדזער קהילה"),
    "ages-hub.html": ("Members area for each year", "מעמבערס טייל פאר יעדן יארגאנג"),
    "login.html": ("Sign in to member features", "לאגט אריין פאר מעמבער פונקציעס"),
}

FOOTER_LINKS = [
    ("index.html", "Home", "היים"), ("about.html", "About", "וועגן אונדז"),
    ("news.html", "News", "נייעס"), ("simchas.html", "Simchas", "שמחות"),
    ("editorial.html", "Submit news", "שיקט אריין"), ("yeshiva.html", "Yeshiva", "ישיבה"),
    ("zmanim.html", "Zmanim", "זמנים"), ("pictures.html", "Pictures", "בילדער"),
    ("recordings.html", "Recordings", "רעקארדירונגען"), ("business.html", "Business", "געשעפטן"),
    ("ages-hub.html", "Ages", "יארגאנג"), ("contact.html", "Contact", "קאנטאקט"),
]

CHEVRON = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def cur(href, page):
    return ' aria-current="page"' if href == page else ""

def nav_html(page):
    items = [f'<li class="nav-home"><a href="index.html"{cur("index.html", page)}>{L("Home", "היים")}</a></li>']
    for i, (href, en, yi, sub) in enumerate(NAV):
        if not sub:
            items.append(f'<li><a href="{href}"{cur(href, page)}>{L(en, yi)}</a></li>')
            continue
        active = any(h == page for h, _, _ in sub)
        links = "".join(f'<li><a href="{h}"{cur(h, page)}>{L(e, y)}</a></li>' for h, e, y in sub)
        items.append(
            f'<li class="has-sub{" is-current" if active else ""}">'
            f'<button type="button" class="nav-parent" aria-expanded="false" aria-controls="sub-{i}">{L(en, yi)}{CHEVRON}</button>'
            f'<ul class="sub-menu" id="sub-{i}">{links}</ul></li>')
    return "\n        ".join(items)

def account_html(page):
    if page == "index.html":
        # The home page script swaps Log In for an Account menu when a member is signed in.
        return ('<div class="account-menu" id="accountMenu">'
                f'<a class="header-login" href="login.html" id="loginLink">{L("Log In", "לאגין")}</a>'
                '<button type="button" class="header-login account-toggle" id="accountToggle" hidden>Account ▾</button>'
                '<div class="dropdown-menu" id="dropdownMenu" hidden>'
                '<a href="login.html">My Profile</a>'
                '<a href="admin.html" id="adminMenuLink" hidden>Admin Dashboard</a>'
                '<button type="button" id="signOutBtn">Sign Out</button></div></div>')
    return f'<a class="header-login" href="login.html"{cur("login.html", page)}>{L("Log In", "לאגין")}</a>'

def header_html(page):
    floating = page in FLOATING
    cls = "site-header site-header--floating" if floating else "site-header"
    return f"""<!--site-header:start-->
<a class="skip-link" href="#main">{L("Skip to content", "שפרינגט צום אינהאלט")}</a>
<header class="{cls}">
  <div class="topstrip">
    <div class="wrap topstrip-inner">
      <p class="today-line"><span class="today-heb" data-hebrew-date></span><span class="today-greg" data-greg-date></span><span class="today-parsha" data-parsha></span></p>
      <div class="topstrip-actions">
        <a class="topstrip-link" href="zmanim.html">{L("Zmanim", "זמנים")}</a>
        <button class="lang-button" type="button" onclick="toggleLang()">אידיש</button>
      </div>
    </div>
  </div>
  <div class="mainbar">
    <div class="wrap mainbar-inner">
      <a class="brand" href="index.html">
        <img class="brand-mark" src="logo-mark.png" width="48" height="55" alt="">
        <span class="brand-text"><span class="brand-name" lang="he">ברכת שמים קאשוי</span><span class="brand-sub">{L("Kasho Community", "התאחדות אברכים קאשוי")}</span></span>
      </a>
      <nav class="primary-nav" id="primaryNav" aria-label="Main">
        <ul class="nav-list">
        {nav_html(page)}
        </ul>
        <div class="drawer-extra">
          <button class="lang-button drawer-lang" type="button" onclick="toggleLang()">אידיש</button>
        </div>
      </nav>
      <div class="header-actions">
        {account_html(page)}
        <button type="button" class="menu-toggle" aria-controls="primaryNav" aria-expanded="false"><span class="menu-icon" aria-hidden="true"></span><span class="visually-hidden">Menu</span></button>
      </div>
    </div>
  </div>
</header>
<div class="nav-overlay" hidden></div>
<!--site-header:end-->"""

def hero_html(page, h1s):
    crumbs = [f'<a href="index.html">{L("Home", "היים")}</a>']
    if page in PARENT:
        h, e, y = PARENT[page]
        crumbs.append(f'<a href="{h}">{L(e, y)}</a>')
    crumb_html = '<span class="crumb-sep" aria-hidden="true">/</span>'.join(crumbs)
    sub = ""
    if page in SUBTITLE:
        e, y = SUBTITLE[page]
        sub = f'\n    <p class="page-sub">{L(e, y)}</p>'
    return f"""<!--site-hero:start-->
<section class="page-hero">
  <div class="wrap">
    <nav class="breadcrumb" aria-label="Breadcrumb">{crumb_html}</nav>
    {h1s}{sub}
  </div>
</section>
<!--site-hero:end-->"""

def footer_html(page):
    links = "".join(f'<li><a href="{h}"{cur(h, page)}>{L(e, y)}</a></li>' for h, e, y in FOOTER_LINKS)
    return f"""<!--site-footer:start-->
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img class="footer-mark" src="logo-light.png" width="64" height="73" alt="">
      <p class="footer-name" lang="he">התאחדות אברכים ברכת שמים קאשוי</p>
      <p data-lang="en">The community of the Kashau (Kasho) Rebbe shlit״a, with botei medrash in Williamsburg, Monsey and Kiryas Joel.</p>
      <p data-lang="yi" hidden>די קהילה פון כ״ק מרן אדמו״ר מקאשוי שליט״א, מיט בתי מדרשים אין וויליאמסבורג, מאנסי און קרית יואל.</p>
    </div>
    <nav class="footer-col" aria-label="Footer">
      <h2>{L("Explore", "זייטלעך")}</h2>
      <ul class="footer-links">{links}</ul>
    </nav>
    <div class="footer-col">
      <h2>{L("Botei Medrash", "בתי מדרשים")}</h2>
      <ul class="footer-places">
        <li><a href="beis-medrash-williamsburg.html"><strong>{L("Williamsburg", "וויליאמסבורג")}</strong></a><span dir="ltr">Williamsburg, Brooklyn</span></li>
        <li><a href="beis-medrash-monsey.html"><strong>{L("Monsey", "מאנסי")}</strong></a><span dir="ltr">48 Suzanne Dr, Spring Valley, NY 10977</span></li>
        <li><a href="beis-medrash-kiryas-joel.html"><strong>{L("Kiryas Joel", "קרית יואל")}</strong></a><span dir="ltr">2 Shinev Ct, Kiryas Joel, NY 10950</span></li>
      </ul>
    </div>
    <div class="footer-col">
      <h2>{L("Contact", "קאנטאקט")}</h2>
      <ul class="footer-contact">
        <li><strong>{L("Monsey", "מאנסי")}</strong>
          <a href="tel:+13476932536" dir="ltr">347-693-2536</a>
          <a href="mailto:kashomonseyny@gmail.com" dir="ltr">kashomonseyny@gmail.com</a></li>
        <li><strong>{L("Kiryas Joel", "קרית יואל")}</strong>
          <a href="tel:+18456370960" dir="ltr">845-637-0960</a>
          <a href="mailto:kashomonroeny@gmail.com" dir="ltr">kashomonroeny@gmail.com</a></li>
      </ul>
      <a class="button button-gold footer-donate" href="https://donate.donorfuse.com/cc4029" target="_blank" rel="noopener">{L("Donate online", "נדבה אנליין")}</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="wrap footer-bottom-inner">
      <p>© <span data-year>2026</span> {L("Hisachdus Avreichim Birchas Shamayim Kashau", "התאחדות אברכים ברכת שמים קאשוי")}</p>
      <p class="footer-bottom-links">
        <a href="login.html">{L("Members log in", "מעמבערס לאגין")}</a>
        <a href="admin.html" data-admin-menu hidden>{L("Admin Dashboard", "אדמין צענטער")}</a>
        <button class="lang-button" type="button" onclick="toggleLang()">אידיש</button>
        <a href="#top" class="to-top">{L("Back to top ↑", "ארויף ↑")}</a>
      </p>
    </div>
  </div>
</footer>
<!--site-footer:end-->"""

FONT_LINKS = """<!--site-head:start-->
<meta name="theme-color" content="#1b2d3e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;800&family=Heebo:wght@400;500;600;700&display=swap">
<!--site-head:end-->"""

def replace_block(text, name, new):
    pat = re.compile(rf"<!--site-{name}:start-->.*?<!--site-{name}:end-->", re.S)
    if pat.search(text):
        return pat.sub(lambda m: new, text, count=1), True
    return text, False

def process(path):
    page = path.name
    text = path.read_text(encoding="utf-8")
    orig = text

    # <head>: fonts, theme colour, cache-busted assets, share image.
    text, ok = replace_block(text, "head", FONT_LINKS)
    if not ok:
        text = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com">', "", text)
        text = re.sub(r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>', "", text)
        text = re.sub(r'\s*<link href="https://fonts\.googleapis\.com/css2[^"]*" rel="stylesheet">', "", text)
        text = text.replace("</head>", FONT_LINKS + "\n</head>", 1)
    text = re.sub(r'href="style\.css(?:\?v=[^"]*)?"', f'href="style.css?v={ASSET_VERSION}"', text)
    text = re.sub(r'src="site\.js(?:\?v=[^"]*)?"', f'src="site.js?v={ASSET_VERSION}"', text)
    text = text.replace('content="https://david7578433-bit.github.io/khaso/logo.png"', 'content="https://david7578433-bit.github.io/khaso/og-card.png"')
    if 'property="og:image:width"' not in text and "og-card.png" in text:
        text = text.replace('og-card.png">', 'og-card.png">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">', 1)
    text = text.replace('<meta name="twitter:card" content="summary">', '<meta name="twitter:card" content="summary_large_image">')
    if 'id="top"' not in text:
        text = re.sub(r"<html\b", '<html id="top"', text, count=1)

    # Header + title band.
    text, had_header = replace_block(text, "header", header_html(page))
    if not had_header:
        m = re.search(r"<header>\s*(.*?)</header>", text, re.S)
        if m and m.start() < text.find("<main"):
            h1s = "\n    ".join(re.findall(r"<h1\b.*?</h1>", m.group(1), re.S))
            band = "" if page in FLOATING else "\n" + hero_html(page, h1s)
            text = text[:m.start()] + header_html(page) + band + text[m.end():]
        else:
            text = re.sub(r"(<body[^>]*>)", lambda mm: mm.group(1) + "\n" + header_html(page), text, count=1)
        # The old top-level menu bar is replaced by the header navigation.
        text = re.sub(r"\n<nav>\s*.*?</nav>", "", text, count=1, flags=re.S)
    else:
        m = re.search(r"<!--site-hero:start-->.*?<!--site-hero:end-->", text, re.S)
        if m:
            h1s = "\n    ".join(re.findall(r"<h1\b.*?</h1>", m.group(0), re.S))
            text = text[:m.start()] + hero_html(page, h1s) + text[m.end():]

    # Skip-link target.
    if 'id="main"' not in text:
        text = re.sub(r"<main\b", '<main id="main"', text, count=1)

    # Footer.
    text, had_footer = replace_block(text, "footer", footer_html(page))
    if not had_footer:
        text, n = re.subn(r"<footer>.*?</footer>", lambda m: footer_html(page), text, count=1, flags=re.S)
        if not n:
            text = text.replace("</body>", footer_html(page) + "\n</body>", 1)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False

def main():
    changed = []
    for path in sorted(ROOT.glob("*.html")):
        if path.name in SKIP:
            continue
        if process(path):
            changed.append(path.name)
    print(f"chrome updated on {len(changed)} page(s): {', '.join(changed) or 'none'}")

if __name__ == "__main__":
    main()
