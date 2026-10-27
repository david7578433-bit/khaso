/* Kasho Simcha Invitations — fully client-side.
   Cards are drawn on a <canvas> (the live preview, the PNG, the PDF and the print copy are the same drawing).
   A shared invitation lives entirely in the link (#i=...): nothing is stored on any server. */
(function () {
  'use strict';

  const W = 1500, H = 2100;                 // 5 × 7 in at 300 dpi
  // Read before site.js stores its default, so a first-time guest sees a Yiddish invitation page in Yiddish.
  let SAVED_LANG = null; try { SAVED_LANG = localStorage.getItem('siteLanguage'); } catch (_) {}
  const HE = /[\u0590-\u05FF]/;

  // ---------------------------------------------------------------- simcha types
  const TYPES = {
    chasuna: {
      label: { en: 'Chasuna', yi: 'חתונה' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שמחת הנישואין', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בשמחת נישואי צאצאינו היקרים', p: 'החתן', c: 'עב״ג', s: 'הכלה', hosts: 'המזמינים' },
      en: { open: 'With gratitude to Hashem', title: 'Wedding', invite: 'We joyfully invite you and your family to share in the simcha of the marriage of our dear children', p: 'The Chosson', c: '&', s: 'The Kallah', hosts: 'With joy, the families' },
      two: true, hosts2: true, fields: { p: { en: 'Chosson’s name', yi: 'נאמען פונעם חתן' }, s: { en: 'Kallah’s name', yi: 'נאמען פון דער כלה' }, h1: { en: 'Chosson’s parents', yi: 'עלטערן פונעם חתן' }, h2: { en: 'Kallah’s parents', yi: 'עלטערן פון דער כלה' } },
      hours: 5
    },
    vort: {
      label: { en: 'Vort · Tenoyim', yi: 'ווארט · תנאים' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שמחת התנאים', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בשמחתנו לרגל התקשרות צאצאינו היקרים', p: 'החתן', c: 'עב״ג', s: 'הכלה', hosts: 'המזמינים' },
      en: { open: 'With gratitude to Hashem', title: 'Vort', invite: 'We are delighted to invite you to celebrate the engagement of our dear children', p: 'The Chosson', c: '&', s: 'The Kallah', hosts: 'With joy, the families' },
      two: true, hosts2: true, fields: { p: { en: 'Chosson’s name', yi: 'נאמען פונעם חתן' }, s: { en: 'Kallah’s name', yi: 'נאמען פון דער כלה' }, h1: { en: 'Chosson’s parents', yi: 'עלטערן פונעם חתן' }, h2: { en: 'Kallah’s parents', yi: 'עלטערן פון דער כלה' } },
      hours: 3
    },
    barmitzvah: {
      label: { en: 'Bar Mitzvah', yi: 'בר מצוה' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שמחת בר מצוה', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו לסעודת מצוה לרגל הכנס בננו היקר לעול המצוות', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Bar Mitzvah', invite: 'We are honored to invite you and your family to the seudas mitzvah as our dear son enters the age of mitzvos', p: '', hosts: 'With joy, his parents' },
      fields: { p: { en: 'Bar mitzvah bochur’s name', yi: 'נאמען פונעם בר מצוה בחור' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 4
    },
    bris: {
      label: { en: 'Bris', yi: 'ברית' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'ברית מילה', invite: 'הננו מתכבדים להזמין את כבודו להשתתף בסעודת ברית מילה של בננו היקר שיכנס אי״ה בבריתו של אברהם אבינו', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Bris Milah', invite: 'We invite you to join us at the bris milah of our dear son', p: '', hosts: 'With joy, the parents' },
      fields: { p: { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 2
    },
    kiddush: {
      label: { en: 'Kiddush', yi: 'קידוש' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'קידוש', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו לקידוש לכבוד הולדת בתנו תחי׳', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Kiddush', invite: 'Please join us for a kiddush in honor of the birth of our daughter', p: '', hosts: 'With joy, the parents' },
      fields: { p: { en: 'Baby’s name (optional)', yi: 'נאמען פונעם מיידעלע (אויב מ׳וויל)' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 2
    },
    upsherin: {
      label: { en: 'Upsherin', yi: 'חלאקה' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שמחת חלאקה', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בשמחת חלאקה של בננו היקר', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Upsherin', invite: 'Please join us at the upsherin of our dear son', p: '', hosts: 'With joy, his parents' },
      fields: { p: { en: 'Child’s name', yi: 'נאמען פונעם קינד' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 2
    },
    shevabrachos: {
      label: { en: 'Sheva Brachos', yi: 'שבע ברכות' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שבע ברכות', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו לסעודת שבע ברכות לכבוד החתן והכלה', p: 'החתן', c: 'עב״ג', s: 'הכלה', hosts: 'המכבדים' },
      en: { open: 'With gratitude to Hashem', title: 'Sheva Brachos', invite: 'You are warmly invited to a sheva brachos seudah in honor of the chosson and kallah', p: 'The Chosson', c: '&', s: 'The Kallah', hosts: 'Hosted by' },
      two: true, fields: { p: { en: 'Chosson’s name', yi: 'נאמען פונעם חתן' }, s: { en: 'Kallah’s name', yi: 'נאמען פון דער כלה' }, h1: { en: 'Hosts', yi: 'די מכבדים' } },
      hours: 3
    },
    siyum: {
      label: { en: 'Siyum', yi: 'סיום' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'סיום מסכת', invite: 'הננו מתכבדים להזמין את כבודו להשתתף בסעודת מצוה לרגל סיום המסכת', p: 'המסיים', hosts: 'המזמינים' },
      en: { open: 'With gratitude to Hashem', title: 'Siyum', invite: 'We invite you to a seudas mitzvah celebrating the siyum of the masechta', p: 'The Mesayem', hosts: 'Hosted by' },
      masechta: true, fields: { p: { en: 'Mesayem (who is making the siyum)', yi: 'דער מסיים' }, h1: { en: 'Hosts', yi: 'המזמינים' } },
      hours: 3
    },
    chanukashabayis: {
      label: { en: 'Chanukas Habayis', yi: 'חנוכת הבית' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'חנוכת הבית', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בשמחתנו לרגל חנוכת הבית של דירתנו החדשה', p: '', hosts: 'המזמינים' },
      en: { open: 'With gratitude to Hashem', title: 'Chanukas Habayis', invite: 'Please join us as we celebrate the chanukas habayis of our new home', p: '', hosts: 'With joy' },
      fields: { p: { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)' }, h1: { en: 'Hosts', yi: 'המזמינים' } },
      hours: 3
    },
    general: {
      label: { en: 'Other simcha', yi: 'אנדערע שמחה' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'הזמנה', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בשמחתנו', p: '', hosts: 'המזמינים' },
      en: { open: 'With gratitude to Hashem', title: 'You’re Invited', invite: 'Please join us for our simcha', p: '', hosts: 'With joy' },
      fields: { p: { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)' }, h1: { en: 'Hosts', yi: 'המזמינים' } },
      hours: 3
    }
  };

  // ---------------------------------------------------------------- designs
  // Each design: palette + background + frame painter. Fonts: display (titles/names) and body, per card language.
  const DESIGNS = [
    { id: 'royal', type: 'chasuna', name: { en: 'Royal Navy & Gold', yi: 'קעניגליך בלוי מיט גאלד' },
      bg: ['#13233a', '#1d3352'], ink: '#efe2c4', title: '#d8b878', nm: '#f6e9c9', muted: '#c8b48c', line: '#c9a868',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'royal' },
    { id: 'ivory', type: 'vort', name: { en: 'Ivory Filigree', yi: 'עלפנביין פיליגראן' },
      bg: ['#fbf6ea', '#f3eadb'], ink: '#2b2a33', title: '#8a6a3f', nm: '#1f2d3a', muted: '#7d6d55', line: '#a88457',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cormorant Garamond', 700], by: ['David Libre', 400], be: ['Cormorant Garamond', 500], frame: 'filigree' },
    { id: 'arch', type: 'barmitzvah', name: { en: 'Jerusalem Arch', yi: 'ירושלים בויגן' },
      bg: ['#eef2ee', '#e2e9e4'], ink: '#233532', title: '#156a5d', nm: '#1b2d3e', muted: '#5b6f69', line: '#a8875a',
      fy: ['Suez One', 400], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'arch' },
    { id: 'sky', type: 'bris', name: { en: 'Silver Sky', yi: 'זילבערנער הימל' },
      bg: ['#f3f7fb', '#dfe9f3'], ink: '#22344a', title: '#2d5b86', nm: '#1b2d3e', muted: '#5d7088', line: '#8aa3bd',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cormorant Garamond', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'sky' },
    { id: 'pearl', type: 'kiddush', name: { en: 'Pearl & Rose Gold', yi: 'פערל מיט ראזע גאלד' },
      bg: ['#fffaf6', '#f8ece6'], ink: '#3a2f33', title: '#a5675a', nm: '#3a2730', muted: '#8e7570', line: '#c49283',
      fy: ['Bellefair', 400], fe: ['Cormorant Garamond', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'floral' },
    { id: 'garden', type: 'upsherin', name: { en: 'Olive Branch', yi: 'אליוו צווייג' },
      bg: ['#fbfcf7', '#eef2e3'], ink: '#2c3826', title: '#4e6b34', nm: '#26331f', muted: '#6b7a5c', line: '#7f9a5e',
      fy: ['Suez One', 400], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'vine' },
    { id: 'wine', type: 'shevabrachos', name: { en: 'Burgundy Ornate', yi: 'בורגונדי מיט גאלד' },
      bg: ['#4a1624', '#64202f'], ink: '#f3e3cf', title: '#e1bf83', nm: '#fbefd9', muted: '#d9b9a0', line: '#d2ad6c',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'ornate' },
    { id: 'scroll', type: 'siyum', name: { en: 'Parchment Scroll', yi: 'קלף מגילה' },
      bg: ['#f4e8cc', '#e9d7ae'], ink: '#3b2a17', title: '#6b3f1d', nm: '#2e2010', muted: '#77603e', line: '#8a6a3f',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cinzel', 700], by: ['David Libre', 400], be: ['Cormorant Garamond', 500], frame: 'scroll' },
    { id: 'classic', type: 'general', name: { en: 'Classic Black & Gold', yi: 'קלאסיש שווארץ מיט גאלד' },
      bg: ['#ffffff', '#f7f5f0'], ink: '#1d1d1f', title: '#1d1d1f', nm: '#111111', muted: '#6a655c', line: '#b08d57',
      fy: ['Frank Ruhl Libre', 900], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], frame: 'classic' }
  ];
  const designById = (id) => DESIGNS.find((d) => d.id === id) || DESIGNS[0];

  // ---------------------------------------------------------------- design system (added Oct 2026)
  // New designs = a frame family × a colour palette (× a font pairing). Every new design gets a NEW stable id
  // ("family-palette"); the nine original designs above keep their ids and drawings, so old links render as before.
  const PALETTES = {
    navygold:       { name: { en: 'Navy & Gold', yi: 'בלוי מיט גאלד' }, color: 'navy', dark: true,
      bg: ['#0f1c33', '#1d3354'], ink: '#ece2c8', title: '#dcbc78', nm: '#f7ebcd', muted: '#bfae88', line: '#cfae67' },
    blackgold:      { name: { en: 'Black & Gold', yi: 'שווארץ מיט גאלד' }, color: 'black', dark: true,
      bg: ['#111111', '#201e1b'], ink: '#eee4cf', title: '#d9b46a', nm: '#f6ecd6', muted: '#bfae8c', line: '#cfa95e' },
    burgundygold:   { name: { en: 'Burgundy & Gold', yi: 'בורגונדי מיט גאלד' }, color: 'burgundy', dark: true,
      bg: ['#3a0c1b', '#64192f'], ink: '#f4e4d0', title: '#e6c47f', nm: '#fcf0da', muted: '#d6b79c', line: '#d8b56c' },
    emeraldgold:    { name: { en: 'Emerald & Gold', yi: 'גרין מיט גאלד' }, color: 'green', dark: true,
      bg: ['#0c3a2d', '#155a45'], ink: '#efe6cc', title: '#dcbd77', nm: '#f8efd5', muted: '#c3b48c', line: '#d2b068' },
    purplegold:     { name: { en: 'Royal Purple & Gold', yi: 'לילא מיט גאלד' }, color: 'purple', dark: true,
      bg: ['#24123a', '#3d2160'], ink: '#efe5ee', title: '#e2c47c', nm: '#f9efdc', muted: '#c9b5c6', line: '#d6b26a' },
    charcoalcopper: { name: { en: 'Charcoal & Copper', yi: 'גרוי מיט קופער' }, color: 'black', dark: true,
      bg: ['#23252a', '#34373d'], ink: '#ece4da', title: '#d9996a', nm: '#f6ede4', muted: '#b8a597', line: '#c98a5a' },
    ivorygold:      { name: { en: 'Ivory & Gold', yi: 'עלפנביין מיט גאלד' }, color: 'cream',
      bg: ['#fdf9ef', '#f3ead6'], ink: '#2b2a33', title: '#8a6a3f', nm: '#1f2d3a', muted: '#7d6d55', line: '#b08d57' },
    creamburgundy:  { name: { en: 'Cream & Burgundy', yi: 'קרעם מיט בורגונדי' }, color: 'burgundy',
      bg: ['#fbf5ea', '#f1e4d0'], ink: '#3a1f26', title: '#7a1f33', nm: '#4a1422', muted: '#80606a', line: '#953548',
      petals: ['170,52,72', '214,128,128', '236,190,170'] },
    blushsilver:    { name: { en: 'Blush & Silver', yi: 'ראזע מיט זילבער' }, color: 'pink', prefer: 'kiddush',
      bg: ['#fdf6f4', '#f5e2de'], ink: '#463a3e', title: '#9b6672', nm: '#40323a', muted: '#8c7a7e', line: '#a3a6b2',
      petals: ['232,160,152', '242,190,160', '205,128,138'] },
    skywhite:       { name: { en: 'Sky Blue & White', yi: 'הימל בלוי מיט ווייס' }, color: 'blue', prefer: 'bris',
      bg: ['#f6f9fc', '#dde8f3'], ink: '#22344a', title: '#2d5b86', nm: '#1b2d3e', muted: '#5d7088', line: '#7f9cbc',
      petals: ['150,180,215', '190,210,232', '120,150,190'] },
    ivorysage:      { name: { en: 'Ivory & Sage', yi: 'עלפנביין מיט סאלוויי גרין' }, color: 'green',
      bg: ['#fbfaf3', '#edf0e1'], ink: '#2f3a2b', title: '#55704a', nm: '#26331f', muted: '#6f7c62', line: '#8aa07a',
      petals: ['240,226,200', '226,200,170', '200,214,180'] },
    whitesilver:    { name: { en: 'White & Silver', yi: 'ווייס מיט זילבער' }, color: 'white',
      bg: ['#ffffff', '#eff1f4'], ink: '#2a2d34', title: '#4f5563', nm: '#1f2229', muted: '#7c818c', line: '#9da2ae',
      petals: ['220,222,230', '200,204,214', '236,232,236'] },
    tealsand:       { name: { en: 'Teal & Sand', yi: 'טערקיז מיט זאמד' }, color: 'teal',
      bg: ['#f8f5ec', '#ece5d3'], ink: '#1f3a3a', title: '#1e6f6a', nm: '#163030', muted: '#5e706c', line: '#2a7d77',
      petals: ['90,160,150', '220,200,160', '140,190,180'] },
    navywhite:      { name: { en: 'Navy & White', yi: 'בלוי מיט ווייס' }, color: 'blue',
      bg: ['#ffffff', '#f1f4f8'], ink: '#1b2d3e', title: '#1b2d3e', nm: '#122233', muted: '#5b6b7c', line: '#2d4a6b',
      petals: ['70,100,140', '160,180,205', '120,145,180'] }
  };
  const COLORS = { navy: { en: 'Navy', yi: 'בלוי' }, black: { en: 'Black', yi: 'שווארץ' }, burgundy: { en: 'Burgundy', yi: 'בורגונדי' }, green: { en: 'Green', yi: 'גרין' },
    pink: { en: 'Blush', yi: 'ראזע' }, blue: { en: 'Light blue', yi: 'הימל בלוי' }, white: { en: 'White', yi: 'ווייס' }, cream: { en: 'Cream', yi: 'קרעם' },
    purple: { en: 'Purple', yi: 'לילא' }, teal: { en: 'Teal', yi: 'טערקיז' } };
  const FONTSETS = {
    classic: { fy: ['Frank Ruhl Libre', 900], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500] },
    soft:    { fy: ['Bellefair', 400], fe: ['Cormorant Garamond', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500] },
    bold:    { fy: ['Suez One', 400], fe: ['Cinzel', 700], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500] },
    modern:  { fy: ['Secular One', 400], fe: ['Heebo', 700], by: ['Heebo', 400], be: ['Heebo', 400] },
    scribe:  { fy: ['Frank Ruhl Libre', 900], fe: ['Cormorant Garamond', 700], by: ['David Libre', 400], be: ['Cormorant Garamond', 500] }
  };
  // Families: the frame painter, its name, the simchas it suits (first = default wording), font pairings, the palettes that look right on it.
  const FAMILIES = [
    { frame: 'starlight', name: { en: 'Starlit', yi: 'שטערן' }, tags: ['bris', 'barmitzvah', 'general'], fonts: ['classic', 'scribe'], palettes: ['navygold', 'blackgold', 'purplegold', 'emeraldgold', 'skywhite', 'navywhite', 'whitesilver'] },
    { frame: 'yerushalayim', name: { en: 'Yerushalayim Skyline', yi: 'ירושלים' }, tags: ['chasuna', 'vort', 'shevabrachos', 'siyum', 'chanukashabayis'], fonts: ['scribe', 'classic'], palettes: ['ivorygold', 'creamburgundy', 'navygold', 'skywhite', 'tealsand', 'blackgold', 'ivorysage'] },
    { frame: 'bloom', name: { en: 'Watercolor Blossoms', yi: 'בלומען' }, tags: ['kiddush', 'vort', 'shevabrachos'], fonts: ['soft'], palettes: ['blushsilver', 'ivorygold', 'ivorysage', 'creamburgundy', 'skywhite', 'whitesilver'] },
    { frame: 'deco', name: { en: 'Art Deco', yi: 'ארט דעקא' }, tags: ['barmitzvah', 'chasuna', 'general'], fonts: ['modern', 'classic'], palettes: ['blackgold', 'navygold', 'emeraldgold', 'charcoalcopper', 'purplegold', 'ivorygold', 'whitesilver'] },
    { frame: 'blush', name: { en: 'Pearl Frame', yi: 'פערל ראם' }, tags: ['vort', 'kiddush', 'chasuna'], fonts: ['soft'], palettes: ['blushsilver', 'whitesilver', 'ivorygold', 'skywhite', 'ivorysage'] },
    { frame: 'emerald', name: { en: 'Chassidish Frame', yi: 'חסידישע ראם' }, tags: ['shevabrachos', 'chasuna', 'barmitzvah', 'siyum'], fonts: ['scribe', 'classic'], palettes: ['emeraldgold', 'navygold', 'burgundygold', 'purplegold', 'blackgold', 'ivorygold', 'creamburgundy'] },
    { frame: 'kosel', name: { en: 'Kosel Stones', yi: 'כותל שטיינער' }, tags: ['chanukashabayis', 'siyum', 'barmitzvah', 'general'], fonts: ['bold', 'classic'], palettes: ['ivorygold', 'creamburgundy', 'navygold', 'ivorysage', 'tealsand', 'whitesilver'] },
    { frame: 'papercut', name: { en: 'Papercut', yi: 'פאפיר שניט' }, tags: ['upsherin', 'bris', 'kiddush', 'vort', 'general'], fonts: ['classic', 'bold'], palettes: ['tealsand', 'creamburgundy', 'navywhite', 'ivorysage', 'navygold', 'emeraldgold', 'burgundygold', 'blushsilver'] },
    { frame: 'minimal', name: { en: 'Modern Minimal', yi: 'מאדערן' }, tags: ['general', 'chanukashabayis', 'bris', 'barmitzvah'], fonts: ['modern'], palettes: ['tealsand', 'navywhite', 'whitesilver', 'creamburgundy', 'ivorysage', 'blushsilver', 'charcoalcopper'] },
    { frame: 'velvet', name: { en: 'Velvet & Crown', yi: 'סאמעט מיט א כתר' }, tags: ['siyum', 'chasuna', 'barmitzvah', 'shevabrachos'], fonts: ['classic'], palettes: ['burgundygold', 'purplegold', 'navygold', 'emeraldgold', 'blackgold'] },
    { frame: 'ribbon', name: { en: 'Ribbon Banner', yi: 'באנד' }, tags: ['upsherin', 'bris', 'kiddush', 'general'], fonts: ['bold', 'soft'], palettes: ['navywhite', 'creamburgundy', 'skywhite', 'blushsilver', 'ivorysage', 'navygold', 'burgundygold'] },
    { frame: 'wreath', name: { en: 'Olive Wreath', yi: 'אליוו קראנץ' }, tags: ['upsherin', 'siyum', 'chanukashabayis', 'vort', 'general'], fonts: ['classic', 'soft'], palettes: ['ivorysage', 'ivorygold', 'whitesilver', 'emeraldgold', 'navygold', 'tealsand', 'skywhite'] },
    { frame: 'damask', name: { en: 'Damask', yi: 'דאמאסק' }, tags: ['chasuna', 'vort', 'shevabrachos'], fonts: ['classic', 'soft'], palettes: ['ivorygold', 'blushsilver', 'navygold', 'burgundygold', 'emeraldgold', 'purplegold', 'whitesilver'] },
    { frame: 'marble', name: { en: 'Marble', yi: 'מארמאר' }, tags: ['barmitzvah', 'chasuna', 'general'], fonts: ['modern', 'classic'], palettes: ['whitesilver', 'ivorygold', 'blackgold', 'charcoalcopper', 'navygold', 'blushsilver'] },
    { frame: 'wash', name: { en: 'Watercolor Wash', yi: 'וואסערפארב' }, tags: ['kiddush', 'bris', 'vort'], fonts: ['soft', 'modern'], palettes: ['blushsilver', 'skywhite', 'ivorysage', 'tealsand', 'creamburgundy', 'ivorygold'] },
    { frame: 'crest', name: { en: 'Monogram Crest', yi: 'מאנאגראם' }, tags: ['chasuna', 'vort', 'barmitzvah', 'shevabrachos'], fonts: ['classic', 'scribe'], palettes: ['navygold', 'ivorygold', 'emeraldgold', 'burgundygold', 'navywhite', 'whitesilver', 'blackgold'] },
    { frame: 'foil', name: { en: 'Gold Foil Corners', yi: 'גאלדענע ווינקלען' }, tags: ['chasuna', 'barmitzvah', 'general'], fonts: ['modern', 'classic'], palettes: ['whitesilver', 'blackgold', 'navygold', 'ivorygold', 'blushsilver', 'emeraldgold', 'charcoalcopper'] },
    // the original painters, in new colours (the original nine designs themselves are untouched)
    { frame: 'royal', name: { en: 'Royal Crown', yi: 'קעניגליך' }, tags: ['chasuna', 'vort', 'barmitzvah', 'shevabrachos', 'general'], fonts: ['classic'], palettes: ['blackgold', 'emeraldgold', 'purplegold', 'burgundygold', 'charcoalcopper'] },
    { frame: 'filigree', name: { en: 'Filigree', yi: 'פיליגראן' }, tags: ['vort', 'chasuna', 'kiddush', 'shevabrachos'], fonts: ['scribe'], palettes: ['creamburgundy', 'blushsilver', 'skywhite', 'ivorysage', 'whitesilver', 'tealsand', 'navywhite'] },
    { frame: 'arch', name: { en: 'Jerusalem Arch', yi: 'ירושלים בויגן' }, tags: ['barmitzvah', 'chasuna', 'siyum', 'chanukashabayis'], fonts: ['bold'], palettes: ['ivorygold', 'creamburgundy', 'skywhite', 'blushsilver', 'navywhite', 'whitesilver'] },
    { frame: 'sky', name: { en: 'Sparkle', yi: 'פינקלען' }, tags: ['bris', 'kiddush', 'upsherin', 'general'], fonts: ['classic'], palettes: ['whitesilver', 'blushsilver', 'ivorygold', 'navywhite'] },
    { frame: 'floral', name: { en: 'Floral Sprigs', yi: 'בלומען צווייגן' }, tags: ['kiddush', 'vort', 'shevabrachos'], fonts: ['soft'], palettes: ['ivorysage', 'creamburgundy', 'skywhite', 'ivorygold', 'whitesilver'] },
    { frame: 'vine', name: { en: 'Leafy Vine', yi: 'בלעטער'}, tags: ['upsherin', 'chanukashabayis', 'kiddush', 'general'], fonts: ['bold'], palettes: ['ivorygold', 'tealsand', 'creamburgundy', 'skywhite'] },
    { frame: 'ornate', name: { en: 'Ornate Border', yi: 'באצירטע ראם' }, tags: ['shevabrachos', 'chasuna', 'siyum'], fonts: ['classic'], palettes: ['navygold', 'emeraldgold', 'blackgold', 'purplegold', 'charcoalcopper'] },
    { frame: 'classic', name: { en: 'Classic Corners', yi: 'קלאסיש' }, tags: ['general', 'barmitzvah', 'bris', 'siyum'], fonts: ['classic'], palettes: ['ivorygold', 'creamburgundy', 'blushsilver', 'whitesilver', 'tealsand'] }
  ];
  // A little more reach for the original nine in the gallery filters (their drawings are unchanged).
  const ORIGINAL_EXTRA = { royal: { color: 'navy', also: ['barmitzvah', 'vort', 'general'] }, ivory: { color: 'cream', also: ['chasuna', 'kiddush'] }, arch: { color: 'green', also: ['siyum', 'chanukashabayis'] },
    sky: { color: 'blue', also: ['upsherin', 'kiddush'] }, pearl: { color: 'pink', also: ['vort', 'shevabrachos'] }, garden: { color: 'green', also: ['chanukashabayis', 'kiddush'] },
    wine: { color: 'burgundy', also: ['chasuna', 'siyum'] }, scroll: { color: 'cream', also: ['barmitzvah', 'chanukashabayis'] }, classic: { color: 'white', also: ['barmitzvah', 'bris'] } };
  DESIGNS.forEach((d) => { const x = ORIGINAL_EXTRA[d.id]; if (x) { d.color = x.color; d.also = x.also; d.family = d.frame; } });
  (function buildDesigns() {
    const made = [];
    FAMILIES.forEach((f) => f.palettes.forEach((pk, i) => {
      const p = PALETTES[pk];
      const fs = FONTSETS[f.fonts[i % f.fonts.length]];
      const type = (p.prefer && f.tags.includes(p.prefer)) ? p.prefer : f.tags[0];
      made.push({ round: i, d: Object.assign({
        id: f.frame + '-' + pk, type, also: f.tags.filter((t) => t !== type), isNew: true, family: f.frame, palette: pk, color: p.color, dark: !!p.dark,
        name: { en: f.name.en + ' · ' + p.name.en, yi: f.name.yi + ' · ' + p.name.yi },
        bg: p.bg, ink: p.ink, title: p.title, nm: p.nm, muted: p.muted, line: p.line, petals: p.petals, frame: f.frame
      }, fs) });
    }));
    // interleave families so the first screen of the gallery shows variety
    made.sort((a, b) => a.round - b.round);
    made.forEach((m) => DESIGNS.push(m.d));
  })();
  const FAMILY_NAMES = {}; FAMILIES.forEach((f) => { FAMILY_NAMES[f.frame] = f.name; });

  // ---------------------------------------------------------------- Hebrew calendar (offline, via Intl)
  const HMONTH = { Tishri: ['תשרי', 'Tishrei'], Heshvan: ['מרחשון', 'Cheshvan'], Kislev: ['כסלו', 'Kislev'], Tevet: ['טבת', 'Teves'], Shevat: ['שבט', 'Shevat'],
    Adar: ['אדר', 'Adar'], 'Adar I': ['אדר א׳', 'Adar I'], 'Adar II': ['אדר ב׳', 'Adar II'], Nisan: ['ניסן', 'Nissan'], Iyar: ['אייר', 'Iyar'], Sivan: ['סיון', 'Sivan'],
    Tamuz: ['תמוז', 'Tammuz'], Av: ['מנחם אב', 'Av'], Elul: ['אלול', 'Elul'] };
  const YI_WEEKDAY = ['יום א׳', 'יום ב׳', 'יום ג׳', 'יום ד׳', 'יום ה׳', 'יום ו׳', 'מוצאי שבת קודש'];
  const EN_WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Motzei Shabbos'];

  function gematria(n) {
    const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
    const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
    const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    n = n % 1000;
    let s = hundreds[Math.floor(n / 100)];
    let rest = n % 100;
    if (rest === 15) s += 'טו';
    else if (rest === 16) s += 'טז';
    else s += tens[Math.floor(rest / 10)] + ones[rest % 10];
    return s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  }

  function parseISO(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }

  function hebrewParts(iso) {
    const g = parseISO(iso);
    if (!g) return null;
    try {
      const parts = {};
      new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .formatToParts(new Date(Date.UTC(g.y, g.m - 1, g.d, 12))).forEach((p) => { parts[p.type] = p.value; });
      const month = HMONTH[parts.month] || [parts.month, parts.month];
      const day = parseInt(parts.day, 10), year = parseInt(parts.year, 10);
      return { yi: gematria(day) + ' ' + month[0] + ' ' + gematria(year), en: day + ' ' + month[1] + ' ' + year };
    } catch (_) { return null; }
  }

  function weekday(iso) {
    const g = parseISO(iso);
    return g ? new Date(Date.UTC(g.y, g.m - 1, g.d)).getUTCDay() : -1;
  }

  function civilLong(iso, lang) {
    const g = parseISO(iso);
    if (!g) return '';
    const date = new Date(Date.UTC(g.y, g.m - 1, g.d, 12));
    if (lang === 'yi') {
      const months = ['יאנואר', 'פעברואר', 'מערץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אויגוסט', 'סעפטעמבער', 'אקטאבער', 'נאוועמבער', 'דעצעמבער'];
      return g.d + ' ' + months[g.m - 1] + ' ' + g.y;
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  function timeLabel(hhmm, lang) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return '';
    let h = +m[1];
    const min = m[2];
    if (lang === 'yi') return 'בשעה ' + (h % 12 || 12) + ':' + min;
    const ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ':' + min + ' ' + ap;
  }

  // Parsha of the week, from Hebcal's free API (only used while making a card; the result is stored in the link).
  const parshaCache = {};
  async function fetchParsha(iso) {
    const g = parseISO(iso);
    if (!g) return null;
    if (iso in parshaCache) return parshaCache[iso];
    try {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl && setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch('https://www.hebcal.com/shabbat?cfg=json&zip=11211&M=on&gy=' + g.y + '&gm=' + g.m + '&gd=' + g.d, ctrl ? { signal: ctrl.signal } : {});
      if (timer) clearTimeout(timer);
      const json = res.ok ? await res.json() : null;
      const item = json && (json.items || []).find((i) => i.category === 'parashat');
      parshaCache[iso] = item ? { yi: (item.hebrew || '').replace(/^פרשת\s*/, ''), en: item.title.replace(/^Parashat\s+/, '') } : null;
    } catch (_) { parshaCache[iso] = null; }
    return parshaCache[iso];
  }

  function dayLine(data, lang) {
    const wd = weekday(data.dt);
    if (wd < 0) return '';
    const pr = data.pr && data.pr[lang === 'yi' ? 0 : 1];
    // Saturday: a morning kiddush is on Shabbos itself; anything from late afternoon on is motzei Shabbos.
    const hour = /^(\d{1,2}):/.test(data.tm || '') ? parseInt(data.tm, 10) : -1;
    const motzei = wd === 6 && hour >= 16;
    if (lang === 'yi') {
      if (wd === 6) return (motzei ? 'מוצאי שבת קודש' : 'שבת קודש') + (pr ? ' פרשת ' + pr : '');
      return YI_WEEKDAY[wd] + (pr ? ' לסדר ' + pr : '');
    }
    if (wd === 6) return (motzei ? 'Motzei Shabbos' : 'Shabbos') + (pr ? ', Parshas ' + pr : '');
    return EN_WEEKDAY[wd] + (pr ? ', Parshas ' + pr : '');
  }

  // ---------------------------------------------------------------- fonts
  const fontReady = {};
  function ensureFonts(design) {
    const key = design.id;
    if (fontReady[key]) return fontReady[key];
    const specs = [design.fy, design.fe, design.by, design.be];
    const loads = specs.map(([fam, wt]) => (document.fonts && document.fonts.load)
      ? document.fonts.load(wt + ' 40px "' + fam + '"', 'אבג Abc').catch(() => null) : Promise.resolve());
    if (document.fonts && document.fonts.load) {
      loads.push(document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Abc').catch(() => null));
    }
    const timeout = new Promise((r) => setTimeout(r, 4000));
    fontReady[key] = Promise.race([Promise.all(loads), timeout]);
    return fontReady[key];
  }

  // ---------------------------------------------------------------- drawing helpers
  function font(ctx, spec, size, italic) {
    ctx.font = (italic ? 'italic ' : '') + spec[1] + ' ' + Math.round(size) + 'px "' + spec[0] + '", "Frank Ruhl Libre", "Times New Roman", serif';
  }
  function dirOf(text) { return HE.test(text) ? 'rtl' : 'ltr'; }

  function wrapLines(ctx, text, maxW) {
    const out = [];
    String(text).split(/\n/).forEach((para) => {
      const words = para.trim().split(/\s+/).filter(Boolean);
      let line = '';
      words.forEach((w) => {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width <= maxW || !line) line = test;
        else { out.push(line); line = w; }
      });
      if (line) out.push(line);
    });
    return out;
  }

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function grain(ctx, color, alpha, count, seed) {
    const r = rng(seed);
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) { ctx.fillRect(r() * W, r() * H, 1.6 + r() * 2.2, 1.6 + r() * 2.2); }
    ctx.restore();
  }

  function rectStroke(ctx, inset, width, color, radius) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width;
    const x = inset, y = inset, w = W - inset * 2, h = H - inset * 2;
    ctx.beginPath();
    if (radius) roundRectPath(ctx, x, y, w, h, radius); else ctx.rect(x, y, w, h);
    ctx.stroke(); ctx.restore();
  }
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  function spiral(ctx, cx, cy, r, turns, start, dir) {
    ctx.moveTo(cx + Math.cos(start) * r, cy + Math.sin(start) * r);
    const steps = 40 * turns;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const a = start + dir * t * turns * Math.PI * 2;
      const rr = r * (1 - t * 0.82);
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
  }

  // An ornamental corner, drawn in a local frame where the corner is (0,0) and the arms run +x / +y.
  function cornerScroll(ctx, x, y, sx, sy, s, color, lw) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, s); ctx.bezierCurveTo(0, s * 0.42, s * 0.42, 0, s, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.16, s * 0.78); ctx.bezierCurveTo(s * 0.16, s * 0.34, s * 0.34, s * 0.16, s * 0.78, s * 0.16); ctx.stroke();
    ctx.beginPath(); spiral(ctx, s * 1.08, s * 0.1, s * 0.1, 1.1, Math.PI, 1); ctx.stroke();
    ctx.beginPath(); spiral(ctx, s * 0.1, s * 1.08, s * 0.1, 1.1, -Math.PI / 2, -1); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(s * 0.3, s * 0.3, s * 0.11, s * 0.05, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.47, s * 0.47, s * 0.025, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.08, s * 0.08, s * 0.035, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function rosette(ctx, cx, cy, r, petals, color, fill) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1.5, r * 0.07);
    for (let i = 0; i < petals; i++) {
      ctx.save(); ctx.rotate((i / petals) * Math.PI * 2);
      ctx.beginPath(); ctx.ellipse(0, -r * 0.55, r * 0.2, r * 0.45, 0, 0, Math.PI * 2);
      if (fill) ctx.fill(); else ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function sparkle(ctx, cx, cy, r, color) {
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.14, cy - r * 0.14, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.14, cy + r * 0.14, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.14, cy + r * 0.14, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.14, cy - r * 0.14, cx, cy - r);
    ctx.fill(); ctx.restore();
  }

  function leaf(ctx, x, y, len, angle, color, filled) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.4, len * 0.05);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
    if (filled === false) ctx.stroke(); else ctx.fill();
    ctx.restore();
  }

  function sprig(ctx, x, y, angle, len, color, berry) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.strokeStyle = color; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -len * 0.16, len, 0); ctx.stroke();
    for (let i = 1; i <= 6; i++) {
      const t = i / 7; const px = len * t; const py = -len * 0.16 * 4 * t * (1 - t) * 0.5;
      const size = len * (0.2 - t * 0.09);
      leaf(ctx, px, py, size, -0.9 + (i % 2) * 0.05, color);
      leaf(ctx, px, py, size * 0.92, 0.9, color);
    }
    leaf(ctx, len, 0, len * 0.12, 0, color);
    if (berry) {
      ctx.fillStyle = berry;
      [[0.3, -0.12], [0.55, 0.11], [0.75, -0.1]].forEach(([t, o]) => { ctx.beginPath(); ctx.arc(len * t, len * o, len * 0.025, 0, Math.PI * 2); ctx.fill(); });
    }
    ctx.restore();
  }

  function divider(ctx, style, cx, cy, w, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    const half = w / 2;
    const line = (a, b) => { ctx.beginPath(); ctx.moveTo(a, cy); ctx.lineTo(b, cy); ctx.stroke(); };
    if (style === 'sparkle') {
      line(cx - half, cx - 40); line(cx + 40, cx + half);
      sparkle(ctx, cx, cy, 24, color); sparkle(ctx, cx - 58, cy, 9, color); sparkle(ctx, cx + 58, cy, 9, color);
    } else if (style === 'leaf') {
      line(cx - half, cx - 30); line(cx + 30, cx + half);
      leaf(ctx, cx - 4, cy, 46, Math.PI + 0.35, color); leaf(ctx, cx + 4, cy, 46, -0.35, color);
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    } else if (style === 'rosette') {
      line(cx - half, cx - 36); line(cx + 36, cx + half);
      rosette(ctx, cx, cy, 26, 8, color, false);
    } else if (style === 'flourish') {
      line(cx - half + 40, cx - 44); line(cx + 44, cx + half - 40);
      ctx.beginPath(); spiral(ctx, cx - 30, cy - 2, 16, 1, 0, -1); ctx.stroke();
      ctx.beginPath(); spiral(ctx, cx + 30, cy - 2, 16, 1, Math.PI, 1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx, cy + 16); ctx.lineTo(cx - 9, cy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - half + 26, cy, 5, 0, Math.PI * 2); ctx.arc(cx + half - 26, cy, 5, 0, Math.PI * 2); ctx.fill();
    } else if (style === 'deco') {
      line(cx - half, cx - 34); line(cx + 34, cx + half);
      ctx.lineWidth = 1.4; line(cx - half * 0.7, cx - 34); ctx.save(); ctx.translate(0, 10); line(cx + 34, cx + half * 0.7); ctx.restore();
      ctx.beginPath(); ctx.moveTo(cx, cy - 18); ctx.lineTo(cx + 18, cy); ctx.lineTo(cx, cy + 18); ctx.lineTo(cx - 18, cy); ctx.closePath(); ctx.fill();
    } else if (style === 'star') {
      line(cx - half, cx - 36); line(cx + 36, cx + half);
      magen(ctx, cx, cy, 22, color, 2.4);
      [-54, 54].forEach((o) => { ctx.beginPath(); ctx.arc(cx + o, cy, 4.5, 0, Math.PI * 2); ctx.fill(); });
    } else if (style === 'dot') {
      ctx.lineWidth = 2; line(cx - half * 0.55, cx - 22); line(cx + 22, cx + half * 0.55);
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    } else { // diamond
      line(cx - half, cx - 30); line(cx + 30, cx + half);
      ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx + 15, cy); ctx.lineTo(cx, cy + 15); ctx.lineTo(cx - 15, cy); ctx.closePath(); ctx.fill();
      [-48, 48].forEach((o) => { ctx.beginPath(); ctx.moveTo(cx + o, cy - 7); ctx.lineTo(cx + o + 7, cy); ctx.lineTo(cx + o, cy + 7); ctx.lineTo(cx + o - 7, cy); ctx.closePath(); ctx.fill(); });
    }
    ctx.restore();
  }

  function bgFill(ctx, d, kind) {
    let g;
    if (kind === 'radial') { g = ctx.createRadialGradient(W / 2, H * 0.42, 80, W / 2, H / 2, H * 0.75); g.addColorStop(0, d.bg[1]); g.addColorStop(1, d.bg[0]); }
    else { g = ctx.createLinearGradient(0, 0, W * 0.3, H); g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }


  // ---- helpers for the designs added Oct 2026

  function hexRgb(hex) { const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hexA(hex, a) { return 'rgba(' + hexRgb(hex).join(',') + ',' + a + ')'; }
  function mix(hex, hex2, t) { const a = hexRgb(hex), b = hexRgb(hex2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  // A metallic (foil) gradient from one colour.
  function metal(ctx, color, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, mix(color, '#000000', 0.22)); g.addColorStop(0.3, mix(color, '#ffffff', 0.45)); g.addColorStop(0.55, color);
    g.addColorStop(0.8, mix(color, '#ffffff', 0.55)); g.addColorStop(1, mix(color, '#000000', 0.28));
    return g;
  }
  function petalsOf(d) { return d.petals || [hexRgb(d.title).join(','), hexRgb(mix(d.title, '#ffffff', 0.45)).join(','), hexRgb(d.line).join(',')]; }
  // Initials for the monogram crest: first letter of the name(s), without honorifics.
  function initials(data) {
    const one = (n) => { const w = String(n || '').trim().replace(/^(ר׳|ר'|רב|הרב|הבחור|Reb|Rabbi|Mr\.?|R\.)\s+/i, '').trim(); return w ? w[0].toUpperCase() : ''; };
    const t = TYPES[data.t] || TYPES.general;
    const a = one(data.p), b = t.two ? one(data.s) : '';
    return [a, b].filter(Boolean);
  }
  function magenPath(ctx, cx, cy, r) {
    for (let k = 0; k < 2; k++) {
      const off = k ? Math.PI / 2 : -Math.PI / 2;
      ctx.moveTo(cx + Math.cos(off) * r, cy + Math.sin(off) * r);
      for (let i = 1; i < 3; i++) { const a = off + i * (Math.PI * 2 / 3); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      ctx.closePath();
    }
  }
  function magen(ctx, cx, cy, r, color, lw) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw || 2; ctx.lineJoin = 'miter'; ctx.beginPath(); magenPath(ctx, cx, cy, r); ctx.stroke(); ctx.restore();
  }
  function magenFill(ctx, cx, cy, r) { ctx.beginPath(); magenPath(ctx, cx, cy, r); ctx.fill('nonzero'); }

  // A crown (keser), base centred at (cx, by), cw wide. `color` may be a gradient.
  function keser(ctx, cx, by, cw, color) {
    ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, cw * 0.025); ctx.lineJoin = 'round';
    const h = cw * 0.55, hw = cw / 2;
    ctx.beginPath(); ctx.moveTo(cx - hw, by);
    ctx.lineTo(cx - hw - cw * 0.06, by - h * 0.82); ctx.quadraticCurveTo(cx - hw * 0.62, by - h * 0.38, cx - hw * 0.45, by - h * 0.62);
    ctx.lineTo(cx - hw * 0.22, by - h * 0.42); ctx.lineTo(cx, by - h); ctx.lineTo(cx + hw * 0.22, by - h * 0.42);
    ctx.lineTo(cx + hw * 0.45, by - h * 0.62); ctx.quadraticCurveTo(cx + hw * 0.62, by - h * 0.38, cx + hw + cw * 0.06, by - h * 0.82);
    ctx.lineTo(cx + hw, by); ctx.closePath(); ctx.globalAlpha = 0.22; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    ctx.fillRect(cx - hw - 4, by + 4, cw + 8, cw * 0.1);
    [[cx - hw - cw * 0.06, by - h * 0.82], [cx - hw * 0.45, by - h * 0.62], [cx, by - h], [cx + hw * 0.45, by - h * 0.62], [cx + hw + cw * 0.06, by - h * 0.82]].forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y - cw * 0.05, cw * (i === 2 ? 0.05 : 0.038), 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    // jewels on the band
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)';
    [-0.3, 0, 0.3].forEach((o) => { const x = cx + o * cw, y = by + 4 + cw * 0.05, s = cw * 0.03; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }

  function pearl2(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ece7ea'); g.addColorStop(1, '#b0aab3');
    ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Line-art of the Old City of Jerusalem: walls, towers, a gate, domed stone houses. Buildings only.
  function skyline(ctx, d, yb, hgt) {
    const lw = 2.6, ink = d.line, paper = hexA(d.bg[0], 0.94);
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // distant hills
    ctx.fillStyle = hexA(d.line, 0.10); ctx.beginPath(); ctx.moveTo(80, yb);
    for (let x = 80; x <= W - 80; x += 20) ctx.lineTo(x, yb - hgt * 0.82 + Math.sin(x / 170) * 26 + Math.sin(x / 63) * 9);
    ctx.lineTo(W - 80, yb); ctx.closePath(); ctx.fill();
    const box = (x, y, w, h) => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fillStyle = paper; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke(); };
    const archWin = (x, y, w, h, fill) => { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w / 2); ctx.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.7; ctx.stroke(); };
    const dome = (cx, y, r) => { ctx.beginPath(); ctx.moveTo(cx - r, y); ctx.bezierCurveTo(cx - r, y - r * 1.25, cx + r, y - r * 1.25, cx + r, y); ctx.closePath(); ctx.fillStyle = paper; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.stroke(); };
    const merlons = (x0, x1, y, mw, gap, mh) => { for (let x = x0; x + mw <= x1 + 0.5; x += mw + gap) box(x, y - mh, mw, mh); };
    const wallTop = yb - hgt * 0.36;
    // houses behind the wall
    const r = rng(211);
    [[110, 0.58], [260, 0.66], [420, 0.52], [880, 0.6], [1010, 0.7], [1150, 0.55], [1290, 0.62]].forEach(([x, k]) => {
      const w = 120 + r() * 30, top = yb - hgt * k; box(x, top, w, yb - top);
      archWin(x + 22, top + 26, 22, 40); archWin(x + w - 44, top + 26, 22, 40);
      if (r() > 0.4) dome(x + w / 2, top, 26 + r() * 8);
    });
    // a tall stone building with a row of arched windows
    const hx = 560, drumTop = yb - hgt * 0.84;
    box(hx - 110, drumTop + 70, 220, yb - drumTop - 70);
    box(hx - 80, drumTop, 160, 70);
    for (let i = 0; i < 4; i++) archWin(hx - 66 + i * 36, drumTop + 14, 22, 44);
    merlons(hx - 84, hx + 84, drumTop, 20, 14, 18);
    // cypress trees
    [[350, 0.62], [790, 0.66], [1235, 0.6]].forEach(([x, k]) => { ctx.beginPath(); ctx.ellipse(x, yb - hgt * k / 2 - 10, 16, hgt * k / 2, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(122,140,84,0.35)'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = lw * 0.8; ctx.stroke(); });
    // the wall itself
    box(80, wallTop, W - 160, yb - wallTop);
    ctx.save(); ctx.strokeStyle = ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2;
    for (let y = wallTop + 22, k = 0; y < yb - 6; y += 22, k++) { ctx.beginPath(); ctx.moveTo(84, y); ctx.lineTo(W - 84, y); ctx.stroke(); for (let x = 84 + (k % 2) * 28; x < W - 84; x += 56) { ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x, y); ctx.stroke(); } }
    ctx.restore();
    merlons(84, W - 84, wallTop, 26, 18, 22);
    // towers
    const tower = (x, w, k) => { const top = yb - hgt * k; box(x, top, w, yb - top); merlons(x - 6, x + w + 6, top, 22, 14, 24); archWin(x + w / 2 - 12, top + 40, 24, 56, hexA(d.line, 0.25)); ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, top + 8); ctx.lineTo(x + w, top + 8); ctx.stroke(); ctx.restore(); };
    tower(180, 110, 0.66); tower(W - 300, 130, 0.78);
    // the gate in the middle
    const gw = 230, gx = W / 2 - gw / 2, gt = yb - hgt * 0.6; box(gx, gt, gw, yb - gt); merlons(gx - 8, gx + gw + 8, gt, 24, 16, 26);
    archWin(W / 2 - 52, gt + 60, 104, yb - gt - 60, hexA(d.line, 0.3));
    ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(W / 2, gt + 60 + 52, 70, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.restore();
    // ground line
    ctx.strokeStyle = ink; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(70, yb); ctx.lineTo(W - 70, yb); ctx.stroke();
    ctx.restore();
  }

  // Watercolour-style flowers and leaves in a corner; (x, y) is the corner, (sx, sy) the direction it grows.
  function bouquet(ctx, x, y, sx, sy, scale, seed, pc) {
    const r = rng(seed);
    ctx.save(); ctx.translate(x, y); ctx.scale(sx * scale, sy * scale);
    const wash = ctx.createRadialGradient(170, 170, 20, 170, 170, 420); wash.addColorStop(0, 'rgba(' + pc[0] + ',0.2)'); wash.addColorStop(1, 'rgba(' + pc[0] + ',0)');
    ctx.fillStyle = wash; ctx.fillRect(-100, -100, 640, 640);
    const leafW = (lx, ly, len, a, col) => {
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, col.replace('A', '0.55')); g.addColorStop(1, col.replace('A', '0.22'));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.45, -len * 0.36, len, 0); ctx.quadraticCurveTo(len * 0.5, len * 0.3, 0, 0); ctx.fill();
      ctx.strokeStyle = col.replace('A', '0.35'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke();
      ctx.restore();
    };
    const greens = ['rgba(122,150,112,A)', 'rgba(146,168,128,A)', 'rgba(104,132,108,A)'];
    // leaves fanning out along both edges
    for (let i = 0; i < 9; i++) { const t = i / 8; leafW(140 + t * 460, 40 + t * 40 + r() * 20, 80 + r() * 50, -0.5 + r() * 1.0, greens[i % 3]); leafW(40 + t * 40 + r() * 20, 140 + t * 460, 80 + r() * 50, Math.PI / 2 - 0.5 + r() * 1.0, greens[(i + 1) % 3]); }
    for (let i = 0; i < 6; i++) leafW(150 + r() * 120, 150 + r() * 120, 90 + r() * 40, r() * Math.PI * 2, greens[i % 3]);
    const flower = (fx, fy, fr, rgb, petals) => {
      for (let layer = 0; layer < 2; layer++) {
        const n = petals + layer, rr = fr * (layer ? 0.62 : 1), rot = r() * Math.PI;
        for (let i = 0; i < n; i++) {
          const a = rot + (i / n) * Math.PI * 2, px = fx + Math.cos(a) * rr * 0.5, py = fy + Math.sin(a) * rr * 0.5;
          const g = ctx.createRadialGradient(fx, fy, rr * 0.1, px, py, rr * 0.62);
          g.addColorStop(0, 'rgba(' + rgb + ',' + (layer ? 0.7 : 0.55) + ')'); g.addColorStop(0.7, 'rgba(' + rgb + ',0.32)'); g.addColorStop(1, 'rgba(' + rgb + ',0.12)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, rr * 0.55, rr * 0.4, a, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(196,150,80,0.85)';
      for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, dd = r() * fr * 0.16; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * dd, fy + Math.sin(a) * dd, fr * 0.035, 0, Math.PI * 2); ctx.fill(); }
    };
    const blush = pc[0], peach = pc[1], rose = pc[2], cream = '246,226,210';
    flower(165, 160, 105, blush, 6); flower(345, 92, 72, peach, 5); flower(92, 345, 72, rose, 5);
    flower(290, 270, 52, cream, 5); flower(500, 64, 40, rose, 5); flower(64, 500, 40, peach, 5);
    [[600, 54], [54, 600], [420, 170], [170, 420]].forEach(([bx, by], i) => { ctx.fillStyle = 'rgba(' + (i % 2 ? rose : blush) + ',0.55)'; ctx.beginPath(); ctx.ellipse(bx, by, 16, 11, Math.atan2(by, bx), 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // ---------------------------------------------------------------- frames
  // Each painter draws background + frame and returns the content box and the בס״ד position.
  const FRAMES = {
    royal(ctx, d) {
      bgFill(ctx, d, 'radial');
      grain(ctx, '#ffffff', 0.035, 2600, 7);
      rectStroke(ctx, 52, 4, d.line); rectStroke(ctx, 74, 1.5, d.line);
      const s = 170;
      cornerScroll(ctx, 92, 92, 1, 1, s, d.line, 3.2); cornerScroll(ctx, W - 92, 92, -1, 1, s, d.line, 3.2);
      cornerScroll(ctx, 92, H - 92, 1, -1, s, d.line, 3.2); cornerScroll(ctx, W - 92, H - 92, -1, -1, s, d.line, 3.2);
      // crown
      ctx.save(); ctx.fillStyle = d.line; ctx.strokeStyle = d.line; ctx.lineWidth = 3;
      const cx = W / 2, by = 236, cw = 150;
      ctx.beginPath(); ctx.moveTo(cx - cw / 2, by); ctx.lineTo(cx - cw / 2 - 8, by - 62); ctx.lineTo(cx - cw / 4, by - 30); ctx.lineTo(cx, by - 80);
      ctx.lineTo(cx + cw / 4, by - 30); ctx.lineTo(cx + cw / 2 + 8, by - 62); ctx.lineTo(cx + cw / 2, by); ctx.closePath(); ctx.stroke();
      ctx.fillRect(cx - cw / 2, by + 6, cw, 9);
      [[cx - cw / 2 - 8, by - 62], [cx, by - 80], [cx + cw / 2 + 8, by - 62]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y - 10, 8, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      return { x: 230, y: 300, w: W - 460, h: H - 300 - 230, bsd: [W - 145, 335], div: 'flourish' };
    },
    filigree(ctx, d) {
      bgFill(ctx, d);
      grain(ctx, '#8a6a3f', 0.05, 3800, 11);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2.4;
      const inset = 70, step = 42, r = 13;
      for (let x = inset + step / 2; x < W - inset; x += step) { ctx.beginPath(); ctx.arc(x, inset, r, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(x, H - inset, r, 0, Math.PI); ctx.stroke(); }
      for (let y = inset + step / 2; y < H - inset; y += step) { ctx.beginPath(); ctx.arc(inset, y, r, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(W - inset, y, r, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
      ctx.restore();
      rectStroke(ctx, inset, 2.4, d.line); rectStroke(ctx, 104, 1.4, d.line);
      [[104, 104], [W - 104, 104], [104, H - 104], [W - 104, H - 104]].forEach(([x, y]) => {
        ctx.save(); ctx.fillStyle = d.bg[0]; ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        rosette(ctx, x, y, 34, 8, d.line, false);
      });
      // top fleuron
      ctx.save(); const cx = W / 2, cy = 200;
      leaf(ctx, cx, cy, 70, -Math.PI / 2, d.line); leaf(ctx, cx, cy, 62, -Math.PI / 2 - 0.75, d.line); leaf(ctx, cx, cy, 62, -Math.PI / 2 + 0.75, d.line);
      ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(cx, cy + 6, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = d.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 200, cy + 22); ctx.lineTo(cx + 200, cy + 22); ctx.stroke(); ctx.restore();
      return { x: 210, y: 280, w: W - 420, h: H - 280 - 210, bsd: [W - 170, 175], div: 'rosette' };
    },
    arch(ctx, d) {
      bgFill(ctx, d);
      grain(ctx, '#234', 0.03, 2400, 3);
      const L = 170, R = W - 170, spring = 760, rad = (R - L) / 2, cx = W / 2, base = H - 130;
      const archPath = (inset) => {
        ctx.beginPath(); ctx.moveTo(L + inset, base - inset); ctx.lineTo(L + inset, spring);
        ctx.arc(cx, spring, rad - inset, Math.PI, 0); ctx.lineTo(R - inset, base - inset); ctx.closePath();
      };
      ctx.save(); archPath(0); ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 5; archPath(0); ctx.stroke(); ctx.lineWidth = 1.8; archPath(22); ctx.stroke(); ctx.restore();
      // keystone + capitals + plinth
      ctx.save(); ctx.fillStyle = d.line;
      ctx.beginPath(); ctx.moveTo(cx - 26, spring - rad - 18); ctx.lineTo(cx + 26, spring - rad - 18); ctx.lineTo(cx + 18, spring - rad + 40); ctx.lineTo(cx - 18, spring - rad + 40); ctx.closePath(); ctx.fill();
      [L, R].forEach((x) => { ctx.fillRect(x - 26, spring - 8, 52, 14); ctx.fillRect(x - 20, spring + 10, 40, 6); ctx.fillRect(x - 30, base - 8, 60, 16); });
      ctx.fillRect(L - 50, base + 14, R - L + 100, 4);
      ctx.restore();
      rosette(ctx, 110, 110, 34, 8, d.line, false); rosette(ctx, W - 110, 110, 34, 8, d.line, false);
      return { x: 270, y: 420, w: W - 540, h: base - 420 - 90, bsd: [W - 110, 220], div: 'diamond' };
    },
    sky(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); const g = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, H * 0.7); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      rectStroke(ctx, 58, 3, d.line, 46); rectStroke(ctx, 80, 1.4, d.line, 34);
      const r = rng(5);
      [[W / 2, 190, 34], [W / 2 - 90, 220, 14], [W / 2 + 90, 220, 14], [W / 2 - 160, 175, 9], [W / 2 + 160, 175, 9]].forEach(([x, y, s]) => sparkle(ctx, x, y, s, d.line));
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1; const x = W / 2 + side * (520 + r() * 120); const y = 150 + r() * (H - 300);
        if (r() > 0.45) sparkle(ctx, x, y, 6 + r() * 12, d.line); else { ctx.save(); ctx.fillStyle = d.line; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x, y, 3 + r() * 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      }
      return { x: 220, y: 290, w: W - 440, h: H - 290 - 200, bsd: [W - 150, 160], div: 'sparkle' };
    },
    floral(ctx, d) {
      bgFill(ctx, d);
      grain(ctx, '#a5675a', 0.03, 2400, 17);
      rectStroke(ctx, 72, 2.2, d.line);
      rectStroke(ctx, 90, 1, d.line);
      sprig(ctx, 110, 260, -0.55, 330, d.line, d.title); sprig(ctx, 250, 110, 0.15, 300, d.line, d.title);
      sprig(ctx, W - 110, H - 260, Math.PI - 0.55, 330, d.line, d.title); sprig(ctx, W - 250, H - 110, Math.PI + 0.15, 300, d.line, d.title);
      return { x: 220, y: 300, w: W - 440, h: H - 300 - 260, bsd: [W - 160, 170], div: 'leaf' };
    },
    vine(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const inset = 92, amp = 14, period = 120;
      const edge = (x0, y0, x1, y1, seed) => {
        const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux;
        ctx.beginPath();
        for (let t = 0; t <= len; t += 4) { const o = amp * Math.sin((t / period) * Math.PI * 2); const px = x0 + ux * t + nx * o, py = y0 + uy * t + ny * o; t ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
        for (let t = period / 4, k = 0; t < len - 20; t += period / 2, k++) {
          const side = k % 2 ? 1 : -1; const px = x0 + ux * t + nx * amp * side, py = y0 + uy * t + ny * amp * side;
          const base = Math.atan2(uy, ux); leaf(ctx, px, py, 40, base + side * (k % 3 ? 1.0 : 1.25), d.line);
        }
      };
      edge(inset + 40, inset, W - inset - 40, inset); edge(W - inset, inset + 40, W - inset, H - inset - 40);
      edge(W - inset - 40, H - inset, inset + 40, H - inset); edge(inset, H - inset - 40, inset, inset + 40);
      ctx.restore();
      [[inset, inset], [W - inset, inset], [inset, H - inset], [W - inset, H - inset]].forEach(([x, y]) => rosette(ctx, x, y, 30, 6, d.title, true));
      ctx.save(); [W / 2 - 60, W / 2, W / 2 + 60].forEach((x, i) => leaf(ctx, x, 220, i === 1 ? 64 : 48, -Math.PI / 2 + (i - 1) * 0.5, d.title)); ctx.restore();
      return { x: 220, y: 290, w: W - 440, h: H - 290 - 210, bsd: [W - 175, 175], div: 'leaf' };
    },
    ornate(ctx, d) {
      bgFill(ctx, d, 'radial');
      grain(ctx, '#ffffff', 0.03, 2400, 23);
      rectStroke(ctx, 50, 3, d.line); rectStroke(ctx, 104, 3, d.line);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2; const mid = 77, step = 40, s = 14;
      const diamond = (x, y) => { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.stroke(); };
      for (let x = mid + step; x < W - mid - 20; x += step) { diamond(x, mid); diamond(x, H - mid); }
      for (let y = mid + step; y < H - mid - 20; y += step) { diamond(mid, y); diamond(W - mid, y); }
      ctx.restore();
      [[mid, mid], [W - mid, mid], [mid, H - mid], [W - mid, H - mid]].forEach(([x, y]) => {
        ctx.save(); ctx.fillStyle = d.bg[0]; ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 44, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        rosette(ctx, x, y, 34, 8, d.line, true);
      });
      cornerScroll(ctx, 128, 128, 1, 1, 120, d.line, 2.4); cornerScroll(ctx, W - 128, 128, -1, 1, 120, d.line, 2.4);
      cornerScroll(ctx, 128, H - 128, 1, -1, 120, d.line, 2.4); cornerScroll(ctx, W - 128, H - 128, -1, -1, 120, d.line, 2.4);
      rosette(ctx, W / 2, 205, 40, 12, d.line, false);
      return { x: 240, y: 300, w: W - 480, h: H - 300 - 240, bsd: [W - 175, 310], div: 'diamond' };
    },
    scroll(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72); v.addColorStop(0, 'rgba(255,248,230,0)'); v.addColorStop(1, 'rgba(120,80,30,0.28)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore();
      grain(ctx, '#6b3f1d', 0.06, 5200, 31);
      const roller = (y) => {
        const g = ctx.createLinearGradient(0, y - 38, 0, y + 38); g.addColorStop(0, '#4a2c14'); g.addColorStop(0.35, '#a0713f'); g.addColorStop(0.55, '#c9985c'); g.addColorStop(1, '#3b220e');
        ctx.save(); ctx.fillStyle = g; ctx.fillRect(60, y - 34, W - 120, 68);
        [[38, y], [W - 38, y]].forEach(([x, yy]) => { const k = ctx.createRadialGradient(x - 8, yy - 10, 4, x, yy, 46); k.addColorStop(0, '#d9ab6c'); k.addColorStop(1, '#4a2c14'); ctx.fillStyle = k; ctx.beginPath(); ctx.arc(x, yy, 44, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
        ctx.save(); const sh = ctx.createLinearGradient(0, y, 0, y + (y < H / 2 ? 60 : -60)); sh.addColorStop(0, 'rgba(70,40,10,0.35)'); sh.addColorStop(1, 'rgba(70,40,10,0)'); ctx.fillStyle = sh; ctx.fillRect(60, y < H / 2 ? y + 34 : y - 94, W - 120, 60); ctx.restore();
      };
      roller(78); roller(H - 78);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2.6; ctx.strokeRect(140, 190, W - 280, H - 380); ctx.lineWidth = 1.2; ctx.strokeRect(158, 208, W - 316, H - 416); ctx.restore();
      [[158, 208], [W - 158, 208], [158, H - 208], [W - 158, H - 208]].forEach(([x, y]) => { ctx.save(); ctx.fillStyle = d.line; ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-10, -10, 20, 20); ctx.restore(); });
      return { x: 240, y: 300, w: W - 480, h: H - 300 - 290, bsd: [W - 210, 260], div: 'diamond' };
    },
    classic(ctx, d) {
      bgFill(ctx, d);
      rectStroke(ctx, 66, 3, '#1d1d1f'); rectStroke(ctx, 84, 1.2, '#1d1d1f');
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3;
      const c = (x, y, sx, sy) => { for (let i = 0; i < 3; i++) { const o = 108 + i * 16, l = 120 - i * 30; ctx.beginPath(); ctx.moveTo(x + sx * o, y + sy * (o + l)); ctx.lineTo(x + sx * o, y + sy * o); ctx.lineTo(x + sx * (o + l), y + sy * o); ctx.stroke(); } };
      c(0, 0, 1, 1); c(W, 0, -1, 1); c(0, H, 1, -1); c(W, H, -1, -1);
      ctx.restore();
      divider(ctx, 'deco', W / 2, 190, 360, d.line); divider(ctx, 'deco', W / 2, H - 190, 360, d.line);
      return { x: 230, y: 280, w: W - 460, h: H - 280 - 270, bsd: [W - 160, 290], div: 'deco' };
    },
    // ---- designs added Oct 2026 (new ids only; the painters above are unchanged so old links render exactly as before)
    starlight(ctx, d) {
      bgFill(ctx, d, 'radial');
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2400, 41);
      const r = rng(43);
      // faint star field in the margins only
      for (let i = 0; i < 70; i++) {
        const side = i % 2 ? 1 : -1; const x = W / 2 + side * (560 + r() * 120); const y = 160 + r() * (H - 320);
        ctx.save(); ctx.globalAlpha = 0.35 + r() * 0.5; ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(x, y, 1.6 + r() * 2.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      rectStroke(ctx, 46, 3, d.line); rectStroke(ctx, 120, 1.6, d.line);
      // band of six-pointed stars between the two lines
      const mid = 83, step = 62;
      for (let x = mid + step; x < W - mid - 30; x += step) { magen(ctx, x, mid, 15, d.line, 1.8); magen(ctx, x, H - mid, 15, d.line, 1.8); }
      for (let y = mid + step; y < H - mid - 30; y += step) { magen(ctx, mid, y, 15, d.line, 1.8); magen(ctx, W - mid, y, 15, d.line, 1.8); }
      [[mid, mid], [W - mid, mid], [mid, H - mid], [W - mid, H - mid]].forEach(([x, y]) => {
        ctx.save(); ctx.fillStyle = d.bg[0]; ctx.strokeStyle = d.line; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(x, y, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        sparkle(ctx, x, y, 20, d.line);
      });
      // crest: a large Magen David with a glow
      ctx.save(); const g = ctx.createRadialGradient(W / 2, 230, 10, W / 2, 230, 170); g.addColorStop(0, hexA(d.line, d.dark ? 0.28 : 0.18)); g.addColorStop(1, hexA(d.line, 0)); ctx.fillStyle = g; ctx.fillRect(W / 2 - 200, 40, 400, 380); ctx.restore();
      magen(ctx, W / 2, 232, 62, d.line, 4); magen(ctx, W / 2, 232, 46, d.line, 1.6);
      [[-120, 238, 10], [120, 238, 10], [-190, 222, 6], [190, 222, 6]].forEach(([o, y, s]) => sparkle(ctx, W / 2 + o, y, s, d.line));
      return { x: 230, y: 340, w: W - 460, h: H - 340 - 220, bsd: [W - 190, 200], div: 'star' };
    },
    yerushalayim(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); const v = ctx.createRadialGradient(W / 2, H * 0.42, H * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, d.dark ? 'rgba(0,0,0,0.3)' : hexA(d.line, 0.16)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore();
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.04, 4200, 47);
      rectStroke(ctx, 56, 2.6, d.line); rectStroke(ctx, 74, 1.1, d.line);
      // the walls of the Old City — buildings only
      skyline(ctx, d, H - 92, 280);
      divider(ctx, 'flourish', W / 2, 172, 420, d.line);
      return { x: 220, y: 270, w: W - 440, h: H - 270 - 480, bsd: [W - 150, 140], div: 'flourish' };
    },
    bloom(ctx, d) {
      bgFill(ctx, d);
      grain(ctx, d.line, 0.025, 2600, 53);
      ctx.save(); ctx.strokeStyle = d.line; ctx.globalAlpha = 0.75; ctx.lineWidth = 2; ctx.strokeRect(96, 96, W - 192, H - 192); ctx.restore();
      // watercolour clusters (flowers and leaves only)
      const pc = petalsOf(d); bouquet(ctx, 70, 60, 1, 1, 1.15, 61, pc); bouquet(ctx, W - 70, H - 60, -1, -1, 1.15, 67, pc);
      bouquet(ctx, W - 40, 30, -1, 1, 0.55, 71, pc); bouquet(ctx, 40, H - 30, 1, -1, 0.55, 73, pc);
      return { x: 230, y: 330, w: W - 460, h: H - 330 - 330, bsd: [W / 2, 150], div: 'leaf' };
    },
    deco(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineCap = 'square';
      // stepped double frame
      const stepped = (o, lw) => {
        const k = 46; ctx.lineWidth = lw; ctx.beginPath();
        ctx.moveTo(o + k, o); ctx.lineTo(W - o - k, o); ctx.lineTo(W - o - k, o + k * 0.5); ctx.lineTo(W - o - k * 0.5, o + k * 0.5); ctx.lineTo(W - o - k * 0.5, o + k); ctx.lineTo(W - o, o + k);
        ctx.lineTo(W - o, H - o - k); ctx.lineTo(W - o - k * 0.5, H - o - k); ctx.lineTo(W - o - k * 0.5, H - o - k * 0.5); ctx.lineTo(W - o - k, H - o - k * 0.5); ctx.lineTo(W - o - k, H - o);
        ctx.lineTo(o + k, H - o); ctx.lineTo(o + k, H - o - k * 0.5); ctx.lineTo(o + k * 0.5, H - o - k * 0.5); ctx.lineTo(o + k * 0.5, H - o - k); ctx.lineTo(o, H - o - k);
        ctx.lineTo(o, o + k); ctx.lineTo(o + k * 0.5, o + k); ctx.lineTo(o + k * 0.5, o + k * 0.5); ctx.lineTo(o + k, o + k * 0.5); ctx.closePath(); ctx.stroke();
      };
      stepped(54, 4); stepped(80, 1.5);
      // side pinstripes
      ctx.lineWidth = 1.5;
      [128, 140, 152].forEach((x, i) => { const top = 420 + i * 40, bot = H - 420 - i * 40; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.moveTo(W - x, top); ctx.lineTo(W - x, bot); ctx.stroke(); });
      // sunburst fan, top and (smaller) bottom
      const fan = (cx, cy, R, dir) => {
        const a0 = dir > 0 ? Math.PI : 0;
        ctx.lineWidth = 2;
        for (let i = 0; i <= 16; i++) { const a = a0 + (i / 16) * Math.PI; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + Math.PI); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R + 16, a0, a0 + Math.PI); ctx.stroke();
        ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(cx, cy, R * 0.24, a0, a0 + Math.PI); ctx.closePath(); ctx.fill();
      };
      fan(W / 2, 262, 150, 1); fan(W / 2, H - 150, 70, -1);
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(220, 262); ctx.lineTo(W / 2 - 180, 262); ctx.moveTo(W / 2 + 180, 262); ctx.lineTo(W - 220, 262); ctx.stroke();
      [[220, 262], [W - 220, 262]].forEach(([x, y]) => { ctx.fillStyle = d.line; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill(); });
      ctx.restore();
      return { x: 230, y: 320, w: W - 460, h: H - 320 - 280, bsd: [W - 175, 175], div: 'deco' };
    },
    blush(ctx, d) {
      bgFill(ctx, d, 'radial');
      grain(ctx, d.title, 0.022, 2400, 79);
      const silver = (y0, y1) => metal(ctx, d.line, 0, y0, W, y1);
      ctx.save(); ctx.strokeStyle = silver(0, H); ctx.lineWidth = 5; ctx.beginPath(); roundRectPath(ctx, 64, 64, W - 128, H - 128, 60); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); roundRectPath(ctx, 90, 90, W - 180, H - 180, 44); ctx.stroke(); ctx.restore();
      // pearls along the inner line
      ctx.save();
      const pearl = (x, y, r) => { const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#ece7ea'); g.addColorStop(1, '#b9b3bb'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
      for (let x = 170; x <= W - 170; x += 44) { pearl(x, 90, 6.5); pearl(x, H - 90, 6.5); }
      for (let y = 170; y <= H - 170; y += 44) { pearl(90, y, 6.5); pearl(W - 90, y, 6.5); }
      ctx.restore();
      // silver eucalyptus at the top and bottom centre
      const euc = (cx, cy, dir) => {
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, dir); ctx.strokeStyle = silver(-200, 200); ctx.fillStyle = hexA(d.line, 0.18); ctx.lineWidth = 2.4;
        [-1, 1].forEach((sx) => {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sx * 150, -40, sx * 300, 10); ctx.stroke();
          for (let i = 1; i <= 7; i++) { const t = i / 8, x = sx * 300 * t, y = -40 * 4 * t * (1 - t) * 0.5 + 10 * t * t; const rr = 24 - i * 1.6;
            [-1, 1].forEach((up) => { ctx.beginPath(); ctx.ellipse(x, y + up * rr * 0.9, rr, rr * 0.72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }); }
        });
        ctx.restore();
        pearl2(ctx, cx, cy, 13);
      };
      euc(W / 2, 196, 1); euc(W / 2, H - 196, -1);
      return { x: 230, y: 300, w: W - 460, h: H - 300 - 300, bsd: [W - 170, 170], div: 'sparkle' };
    },
    emerald(ctx, d) {
      bgFill(ctx, d, 'radial');
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.028, 2400, 83);
      rectStroke(ctx, 44, 4, d.line); rectStroke(ctx, 64, 1.4, d.line); rectStroke(ctx, 124, 1.4, d.line); rectStroke(ctx, 140, 3, d.line);
      // interlaced guilloche band between the lines
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 1.8;
      const band = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy, ny = ux, A = 18, P = 70;
        [0, Math.PI].forEach((ph) => { ctx.beginPath(); for (let t = 0; t <= len; t += 4) { const o = A * Math.sin((t / P) * Math.PI * 2 + ph); const px = x0 + ux * t + nx * o, py = y0 + uy * t + ny * o; t ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); });
        for (let t = P / 2; t < len; t += P / 2) { ctx.save(); ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(x0 + ux * t, y0 + uy * t, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      };
      const m = 94; band(m + 50, m, W - m - 50, m); band(m + 50, H - m, W - m - 50, H - m); band(m, m + 50, m, H - m - 50); band(W - m, m + 50, W - m, H - m - 50);
      ctx.restore();
      [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => {
        ctx.save(); ctx.fillStyle = d.bg[0]; ctx.strokeStyle = d.line; ctx.lineWidth = 2.6; ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-36, -36, 72, 72); ctx.strokeRect(-36, -36, 72, 72); ctx.restore();
        rosette(ctx, x, y, 30, 8, d.line, true);
      });
      cornerScroll(ctx, 160, 160, 1, 1, 110, d.line, 2.4); cornerScroll(ctx, W - 160, 160, -1, 1, 110, d.line, 2.4);
      cornerScroll(ctx, 160, H - 160, 1, -1, 110, d.line, 2.4); cornerScroll(ctx, W - 160, H - 160, -1, -1, 110, d.line, 2.4);
      // top cartouche with a crown
      ctx.save(); ctx.strokeStyle = d.line; ctx.fillStyle = d.bg[1]; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W / 2 - 170, 140); ctx.bezierCurveTo(W / 2 - 150, 210, W / 2 - 80, 250, W / 2, 262); ctx.bezierCurveTo(W / 2 + 80, 250, W / 2 + 150, 210, W / 2 + 170, 140); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      keser(ctx, W / 2, 222, 92, d.line);
      return { x: 250, y: 330, w: W - 500, h: H - 330 - 250, bsd: [W - 215, 215], div: 'rosette' };
    },
    kosel(ctx, d) {
      // whole card: courses of large drafted-margin stones
      ctx.fillStyle = '#d8c69c'; ctx.fillRect(0, 0, W, H);
      const r = rng(89); const tones = ['#e2d3ab', '#d6c296', '#cdb88b', '#e7dab6', '#d1bd90', '#c9b183'];
      let y = 0; let row = 0;
      while (y < H) {
        const rh = 118 + Math.floor(r() * 46); let x = -(row % 2 ? 60 + r() * 120 : r() * 60);
        while (x < W) {
          const sw = 230 + r() * 210;
          ctx.fillStyle = tones[Math.floor(r() * tones.length)]; ctx.fillRect(x + 3, y + 3, sw - 6, rh - 6);
          // drafted margin: a smooth band around a slightly raised boss
          ctx.fillStyle = 'rgba(255,248,225,0.22)'; ctx.fillRect(x + 20, y + 18, sw - 40, rh - 36);
          ctx.fillStyle = 'rgba(90,70,40,0.10)'; ctx.fillRect(x + 20, y + rh - 22, sw - 40, 4); ctx.fillRect(x + sw - 24, y + 18, 4, rh - 36);
          for (let k = 0; k < 26; k++) { ctx.fillStyle = r() > 0.5 ? 'rgba(110,85,50,0.10)' : 'rgba(255,250,235,0.16)'; ctx.beginPath(); ctx.arc(x + 24 + r() * (sw - 48), y + 22 + r() * (rh - 44), 1 + r() * 4, 0, Math.PI * 2); ctx.fill(); }
          x += sw;
        }
        ctx.fillStyle = 'rgba(80,60,35,0.35)'; ctx.fillRect(0, y, W, 3);
        y += rh; row++;
      }
      // a few tufts of green between the stones
      [[150, 520], [W - 210, 1130], [260, 1720], [W - 140, 330]].forEach(([tx, ty], i) => { for (let k = 0; k < 7; k++) leaf(ctx, tx, ty, 26 + k * 3, -Math.PI / 2 + (k - 3) * 0.32 + (i % 2 ? 0.2 : -0.2), k % 2 ? '#7b8f55' : '#5f7744'); });
      // parchment panel for the words
      const px = 150, py = 170, pw = W - 300, ph = H - 340;
      ctx.save(); ctx.shadowColor = 'rgba(60,40,15,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
      const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]); ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.strokeRect(px + 24, py + 24, pw - 48, ph - 48); ctx.lineWidth = 1.2; ctx.strokeRect(px + 38, py + 38, pw - 76, ph - 76); ctx.restore();
      [[px + 24, py + 24], [px + pw - 24, py + 24], [px + 24, py + ph - 24], [px + pw - 24, py + ph - 24]].forEach(([x, yy]) => { ctx.save(); ctx.fillStyle = d.line; ctx.translate(x, yy); ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.restore(); });
      return { x: 250, y: 300, w: W - 500, h: H - 300 - 300, bsd: [W - 230, 245], div: 'diamond' };
    },
    papercut(ctx, d) {
      bgFill(ctx, d);
      grain(ctx, d.line, 0.02, 2000, 97);
      const C = d.line, P = d.bg[0];
      // solid border band, then "cut" it with paper-coloured shapes
      ctx.save(); ctx.fillStyle = C;
      ctx.beginPath(); ctx.rect(40, 40, W - 80, H - 80); ctx.rect(170, 170, W - 340, H - 340); ctx.fill('evenodd'); ctx.restore();
      ctx.save(); ctx.fillStyle = P;
      // scalloped inner edge
      for (let x = 170 + 20; x < W - 170; x += 40) { ctx.beginPath(); ctx.arc(x, 170, 20, Math.PI, 0); ctx.arc(x, 170, 20, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(x, H - 170, 20, 0, Math.PI * 2); ctx.fill(); }
      for (let y = 170 + 20; y < H - 170; y += 40) { ctx.beginPath(); ctx.arc(170, y, 20, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(W - 170, y, 20, 0, Math.PI * 2); ctx.fill(); }
      // teardrops and diamonds along the band
      const drop = (x, y, a, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * 0.7, -s * 0.2, s * 0.55, s * 0.7, 0, s * 0.7); ctx.bezierCurveTo(-s * 0.55, s * 0.7, -s * 0.7, -s * 0.2, 0, -s); ctx.fill(); ctx.restore(); };
      const dia = (x, y, s) => { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.6, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.6, y); ctx.closePath(); ctx.fill(); };
      const mid = 105;
      for (let x = 230, k = 0; x < W - 220; x += 58, k++) { if (k % 2) { dia(x, mid, 16); dia(x, H - mid, 16); } else { drop(x, mid - 2, 0, 20); drop(x, H - mid + 2, Math.PI, 20); } }
      for (let y = 240, k = 0; y < H - 230; y += 58, k++) { if (k % 2) { dia(mid, y, 16); dia(W - mid, y, 16); } else { drop(mid - 2, y, -Math.PI / 2, 20); drop(W - mid + 2, y, Math.PI / 2, 20); } }
      // corner rosettes cut out
      [[mid, mid], [W - mid, mid], [mid, H - mid], [W - mid, H - mid]].forEach(([x, y]) => { for (let i = 0; i < 8; i++) drop(x + Math.cos(i * Math.PI / 4) * 26, y + Math.sin(i * Math.PI / 4) * 26, i * Math.PI / 4 + Math.PI / 2, 16); ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      // crown piece: a papercut arch with a Magen David and symmetric scrolls
      ctx.save(); ctx.fillStyle = C; const cx = W / 2, cy = 170;
      ctx.beginPath(); ctx.moveTo(cx - 260, cy); ctx.bezierCurveTo(cx - 230, cy + 120, cx - 110, cy + 170, cx, cy + 176); ctx.bezierCurveTo(cx + 110, cy + 170, cx + 230, cy + 120, cx + 260, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P; magenFill(ctx, cx, cy + 82, 54);
      ctx.fillStyle = C; magenFill(ctx, cx, cy + 82, 30);
      ctx.fillStyle = P; [-1, 1].forEach((s) => { drop(cx + s * 120, cy + 60, s * 1.2, 22); drop(cx + s * 175, cy + 34, s * 1.4, 15); ctx.beginPath(); ctx.arc(cx + s * 88, cy + 128, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + s * 210, cy + 18, 6, 0, Math.PI * 2); ctx.fill(); });
      ctx.restore();
      // matching piece at the bottom
      ctx.save(); ctx.fillStyle = C; const by = H - 170;
      ctx.beginPath(); ctx.moveTo(cx - 170, by); ctx.bezierCurveTo(cx - 150, by - 70, cx - 70, by - 100, cx, by - 104); ctx.bezierCurveTo(cx + 70, by - 100, cx + 150, by - 70, cx + 170, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = P; [-1, 0, 1].forEach((s) => drop(cx + s * 60, by - 46 + Math.abs(s) * 12, Math.PI + s * 0.5, s ? 16 : 22));
      ctx.restore();
      return { x: 250, y: 380, w: W - 500, h: H - 380 - 310, bsd: [W - 245, 245], div: 'star' };
    },
    minimal(ctx, d) {
      bgFill(ctx, d);
      ctx.fillStyle = d.line; ctx.fillRect(0, 0, W, 14); ctx.fillRect(0, H - 14, W, 14);
      ctx.save(); ctx.strokeStyle = d.muted; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6; ctx.strokeRect(90, 90, W - 180, H - 180); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 5; ctx.lineCap = 'butt';
      [[90, 90, 1, 1], [W - 90, 90, -1, 1], [90, H - 90, 1, -1], [W - 90, H - 90, -1, -1]].forEach(([x, y, sx, sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * 90); ctx.lineTo(x, y); ctx.lineTo(x + sx * 90, y); ctx.stroke(); });
      ctx.restore();
      // a single accent mark
      ctx.save(); ctx.fillStyle = d.line; ctx.fillRect(W / 2 - 70, 214, 140, 6); ctx.beginPath(); ctx.arc(W / 2, 217, 14, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = d.bg[0]; ctx.beginPath(); ctx.arc(W / 2, 217, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      return { x: 230, y: 310, w: W - 460, h: H - 310 - 250, bsd: [W - 170, 170], div: 'dot' };
    },
    velvet(ctx, d) {
      bgFill(ctx, d, 'radial');
      // velvet nap: soft vertical sheen + fine grain
      ctx.save(); for (let i = 0; i < 9; i++) { const x = (i / 8) * W; const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,220,230,0.035)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 90, 0, 180, H); } ctx.restore();
      grain(ctx, '#000000', 0.10, 2600, 101); grain(ctx, '#ffffff', 0.03, 1200, 103);
      ctx.save(); const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H); ctx.restore();
      // gold arch-topped frame with beading
      const gold = metal(ctx, d.line, 0, 0, W, H);
      const L = 110, R = W - 110, T = 110, B = H - 110, rad = (R - L) / 2, spring = T + rad * 0.55;
      const path = (i) => { ctx.beginPath(); ctx.moveTo(L + i, B - i); ctx.lineTo(L + i, spring); ctx.ellipse(W / 2, spring, rad - i, rad * 0.55 - i, 0, Math.PI, 0); ctx.lineTo(R - i, B - i); ctx.closePath(); };
      ctx.save(); ctx.strokeStyle = gold; ctx.lineWidth = 6; path(0); ctx.stroke(); ctx.lineWidth = 1.6; path(26); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = gold;
      for (let y = spring; y < B - 30; y += 34) { ctx.beginPath(); ctx.arc(L + 13, y, 3.6, 0, Math.PI * 2); ctx.arc(R - 13, y, 3.6, 0, Math.PI * 2); ctx.fill(); }
      for (let x = L + 40; x < R - 30; x += 34) { ctx.beginPath(); ctx.arc(x, B - 13, 3.6, 0, Math.PI * 2); ctx.fill(); }
      for (let a = Math.PI + 0.06; a < 2 * Math.PI - 0.04; a += 0.055) { ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * (rad - 13), spring + Math.sin(a) * (rad * 0.55 - 13), 3.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // crown with laurel
      keser(ctx, W / 2, 300, 112, gold);
      [-1, 1].forEach((s) => sprig(ctx, W / 2 + s * 92, 312, s > 0 ? -0.35 : Math.PI + 0.35, 190, d.line));
      [[L + 60, B - 60], [R - 60, B - 60]].forEach(([x, y]) => rosette(ctx, x, y, 26, 8, d.line, true));
      return { x: 240, y: 430, w: W - 480, h: H - 430 - 230, bsd: [W - 190, spring + 40], div: 'flourish' };
    },
    ribbon(ctx, d) {
      bgFill(ctx, d, d.dark ? 'radial' : undefined);
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.025, 2200, 107);
      rectStroke(ctx, 66, 2.6, d.line); rectStroke(ctx, 86, 1.1, d.line);
      const cx = W / 2, y = 222, hw = 400, bh = 96, lift = 26;
      const dark1 = mix(d.line, '#000000', 0.25), dark2 = mix(d.line, '#000000', 0.45);
      // tails behind the band
      [-1, 1].forEach((s) => {
        const x0 = cx + s * (hw - 70), x1 = cx + s * (hw + 120);
        ctx.save(); ctx.fillStyle = dark1; ctx.beginPath();
        ctx.moveTo(x0, y + 34); ctx.lineTo(x1, y + 34); ctx.lineTo(x1 - s * 44, y + 34 + bh / 2); ctx.lineTo(x1, y + 34 + bh); ctx.lineTo(x0, y + 34 + bh); ctx.closePath(); ctx.fill();
        ctx.fillStyle = dark2; ctx.beginPath(); ctx.moveTo(cx + s * hw, y + bh - lift * 0.2); ctx.lineTo(x0, y + 34 + bh); ctx.lineTo(cx + s * hw, y + 34 + bh); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      // the band, gently arched
      const g = metal(ctx, d.line, cx - hw, 0, cx + hw, 0);
      ctx.save(); ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(cx - hw, y); ctx.quadraticCurveTo(cx, y - lift * 2, cx + hw, y); ctx.lineTo(cx + hw, y + bh); ctx.quadraticCurveTo(cx, y + bh - lift * 2, cx - hw, y + bh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = hexA(d.bg[0], 0.75); ctx.lineWidth = 2; ctx.setLineDash([10, 9]);
      ctx.beginPath(); ctx.moveTo(cx - hw + 18, y + 14); ctx.quadraticCurveTo(cx, y - lift * 2 + 14, cx + hw - 18, y + 14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - hw + 18, y + bh - 14); ctx.quadraticCurveTo(cx, y + bh - lift * 2 - 14, cx + hw - 18, y + bh - 14); ctx.stroke();
      ctx.restore();
      magen(ctx, cx, y + bh / 2 - lift + 2, 26, d.bg[0], 3);
      [[-hw - 60, 150, 12], [hw + 60, 150, 12], [-hw + 40, 120, 7], [hw - 40, 120, 7]].forEach(([o, yy, r]) => sparkle(ctx, cx + o, yy, r, d.line));
      divider(ctx, 'diamond', cx, H - 170, 520, d.line);
      return { x: 230, y: 360, w: W - 460, h: H - 360 - 250, bsd: [W - 160, 140], div: 'sparkle' };
    },
    wreath(ctx, d) {
      bgFill(ctx, d, d.dark ? 'radial' : undefined);
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.025, 2200, 109);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.beginPath(); roundRectPath(ctx, 70, 70, W - 140, H - 140, 40); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); roundRectPath(ctx, 92, 92, W - 184, H - 184, 26); ctx.stroke(); ctx.restore();
      const cx = W / 2, cy = 262, R = 128;
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.lineCap = 'round';
      [-1, 1].forEach((s) => {
        ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI / 2 + s * 0.22, Math.PI / 2 + s * 2.75, s < 0); ctx.stroke();
        for (let i = 0; i < 11; i++) {
          const a = Math.PI / 2 + s * (0.32 + i * 0.235), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
          const tang = a + s * Math.PI / 2;
          leaf(ctx, px, py, 46 - i * 1.4, tang - s * 0.55, d.line); leaf(ctx, px, py, 40 - i * 1.4, tang + s * 0.75, hexA(d.line, 0.75));
        }
      });
      ctx.restore();
      ctx.save(); ctx.fillStyle = d.title; [[-1, 1.0], [1, 1.0], [-1, 1.9], [1, 1.9]].forEach(([s, k]) => { const a = Math.PI / 2 + s * k; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16), 7, 0, Math.PI * 2); ctx.fill(); }); ctx.restore();
      magen(ctx, cx, cy, 52, d.line, 3.4);
      sprig(ctx, W / 2 - 14, H - 176, Math.PI - 0.12, 220, d.line); sprig(ctx, W / 2 + 14, H - 176, 0.12, 220, d.line);
      ctx.save(); ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(W / 2, H - 176, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      return { x: 230, y: 430, w: W - 460, h: H - 430 - 270, bsd: [W - 165, 165], div: 'leaf' };
    },
    damask(ctx, d) {
      bgFill(ctx, d, d.dark ? 'radial' : undefined);
      // all-over damask motif, tiled in staggered rows
      ctx.save(); ctx.strokeStyle = hexA(d.line, d.dark ? 0.24 : 0.2); ctx.fillStyle = hexA(d.line, d.dark ? 0.12 : 0.09); ctx.lineWidth = 2.2;
      const motif = (x, y) => {
        ctx.save(); ctx.translate(x, y);
        ctx.beginPath(); ctx.moveTo(0, -120); ctx.bezierCurveTo(70, -80, 80, -20, 0, 120); ctx.bezierCurveTo(-80, -20, -70, -80, 0, -120); ctx.fill(); ctx.stroke();
        [-1, 1].forEach((s) => { ctx.beginPath(); spiral(ctx, s * 52, -40, 26, 1.1, s > 0 ? Math.PI : 0, s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(s * 60, 70, s * 70, 30); ctx.stroke(); });
        ctx.beginPath(); ctx.arc(0, -10, 14, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -10, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };
      for (let row = 0, y = 60; y < H + 140; y += 280, row++) for (let x = (row % 2) * 150 - 40; x < W + 140; x += 300) motif(x, y);
      ctx.restore();
      // the panel the words sit on
      const px = 150, py = 150, pw = W - 300, ph = H - 300;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
      const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, d.bg[0]); g.addColorStop(1, mix(d.bg[0], d.bg[1], 0.5)); ctx.fillStyle = g; ctx.beginPath(); roundRectPath(ctx, px, py, pw, ph, 18); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3.2; ctx.beginPath(); roundRectPath(ctx, px + 22, py + 22, pw - 44, ph - 44, 10); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); roundRectPath(ctx, px + 36, py + 36, pw - 72, ph - 72, 6); ctx.stroke(); ctx.restore();
      rosette(ctx, W / 2, py + 22, 24, 8, d.line, true); rosette(ctx, W / 2, py + ph - 22, 24, 8, d.line, true);
      return { x: 250, y: 290, w: W - 500, h: H - 290 - 270, bsd: [W - 230, 230], div: 'flourish' };
    },
    marble(ctx, d) {
      bgFill(ctx, d, 'radial');
      const r = rng(113);
      // soft clouds
      for (let i = 0; i < 14; i++) { const x = r() * W, y = r() * H, rr = 200 + r() * 380; const g = ctx.createRadialGradient(x, y, 10, x, y, rr); const c = d.dark ? 'rgba(255,255,255,' : 'rgba(120,120,135,'; g.addColorStop(0, c + (d.dark ? 0.05 : 0.06) + ')'); g.addColorStop(1, c + '0)'); ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      // veins
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let v = 0; v < 16; v++) {
        let x = r() * W * 1.2 - W * 0.1, y = r() < 0.5 ? -20 : r() * H, a = 0.6 + r() * 0.9; const pts = [[x, y]];
        for (let k = 0; k < 70; k++) { a += (r() - 0.5) * 0.5; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); if (y > H + 40 || x > W + 40 || x < -40) break; }
        const gold = v % 4 === 0; const col = gold ? d.line : (d.dark ? '#ffffff' : '#6f7180');
        [[gold ? 5 : 7, gold ? 0.18 : (d.dark ? 0.04 : 0.06)], [gold ? 1.8 : 1.4, gold ? 0.55 : (d.dark ? 0.14 : 0.22)]].forEach(([w, al]) => { ctx.strokeStyle = hexA(col, al); ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); });
      }
      ctx.restore();
      ctx.save(); ctx.fillStyle = hexA(d.bg[0], d.dark ? 0.5 : 0.62); ctx.beginPath(); roundRectPath(ctx, 140, 150, W - 280, H - 300, 14); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = metal(ctx, d.line, 0, 0, W, H); ctx.lineWidth = 5; ctx.strokeRect(70, 70, W - 140, H - 140); ctx.lineWidth = 1.6; ctx.strokeRect(92, 92, W - 184, H - 184); ctx.restore();
      [[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]].forEach(([x, y]) => { ctx.save(); ctx.fillStyle = metal(ctx, d.line, x - 20, y - 20, x + 20, y + 20); ctx.fillRect(x - 18, y - 18, 36, 36); ctx.restore(); });
      divider(ctx, 'deco', W / 2, 232, 380, d.line);
      return { x: 240, y: 320, w: W - 480, h: H - 320 - 260, bsd: [W - 200, 200], div: 'deco' };
    },
    wash(ctx, d) {
      bgFill(ctx, d);
      const r = rng(127), pc = petalsOf(d);
      const blot = (x, y, rr, rgb, al) => { const g = ctx.createRadialGradient(x, y, rr * 0.1, x, y, rr); g.addColorStop(0, 'rgba(' + rgb + ',' + al + ')'); g.addColorStop(0.6, 'rgba(' + rgb + ',' + al * 0.55 + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); };
      for (let i = 0; i < 16; i++) { const top = i % 2 === 0; const x = r() * W, y = top ? r() * 170 - 40 : H - r() * 170 + 40; blot(x, y, 170 + r() * 230, pc[i % pc.length], 0.28 + r() * 0.2); }
      for (let i = 0; i < 26; i++) { const top = i % 2 === 0; blot(r() * W, top ? 220 + r() * 120 : H - 220 - r() * 120, 8 + r() * 26, pc[(i + 1) % pc.length], 0.28); }
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 1.8; ctx.strokeRect(84, 84, W - 168, H - 168); ctx.restore();
      [[W / 2, 92, 16], [W / 2 - 44, 92, 7], [W / 2 + 44, 92, 7]].forEach(([x, y, s]) => sparkle(ctx, x, y, s, d.line));
      return { x: 230, y: 400, w: W - 460, h: H - 400 - 400, bsd: [W - 160, 150], div: 'sparkle' };
    },
    crest(ctx, d, data) {
      bgFill(ctx, d, d.dark ? 'radial' : undefined);
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.025, 2200, 131);
      rectStroke(ctx, 60, 3, d.line); rectStroke(ctx, 80, 1.2, d.line);
      [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]].forEach(([x, y]) => { ctx.save(); ctx.fillStyle = d.line; ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-11, -11, 22, 22); ctx.restore(); });
      const cx = W / 2, cy = 300, rx = 118, ry = 138;
      [-1, 1].forEach((s) => sprig(ctx, cx + s * 40, cy + ry - 6, s > 0 ? -1.05 : Math.PI + 1.05, 250, d.line));
      ctx.save(); ctx.fillStyle = d.dark ? mix(d.bg[1], '#000000', 0.1) : d.bg[0]; ctx.strokeStyle = metal(ctx, d.line, cx - rx, cy - ry, cx + rx, cy + ry); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 16, ry - 16, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      keser(ctx, cx, cy - ry - 8, 84, metal(ctx, d.line, cx - 50, 0, cx + 50, 0));
      const ini = initials(data || {});
      if (ini.length) {
        const yi = (data && data.l) !== 'en';
        // letters placed one by one: in Hebrew the first name's letter sits on the right
        const rtl = HE.test(ini.join(''));
        font(ctx, HE.test(ini.join('')) || yi ? d.fy : d.fe, ini.length > 1 ? 92 : 136);
        ctx.save(); ctx.fillStyle = d.title; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        if (ini.length > 1) {
          const [first, second] = ini, gap = 58;
          ctx.fillText(first, rtl ? cx + gap : cx - gap, cy + 6); ctx.fillText(second, rtl ? cx - gap : cx + gap, cy + 6);
          ctx.beginPath(); ctx.arc(cx, cy + 6, 6, 0, Math.PI * 2); ctx.fill();
        } else ctx.fillText(ini[0], cx, cy + 6);
        ctx.restore();
      } else magen(ctx, cx, cy, 58, d.title, 3.4);
      return { x: 230, y: 500, w: W - 460, h: H - 500 - 220, bsd: [W - 160, 150], div: 'diamond' };
    },
    foil(ctx, d) {
      bgFill(ctx, d, d.dark ? 'radial' : undefined);
      grain(ctx, d.dark ? '#ffffff' : d.line, 0.02, 2000, 137);
      rectStroke(ctx, 60, 1.6, d.line);
      const shard = (sx, sy) => {
        ctx.save(); ctx.translate(sx ? W : 0, sy ? H : 0); ctx.scale(sx ? -1 : 1, sy ? -1 : 1);
        ctx.fillStyle = hexA(d.line, 0.16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(560, 0); ctx.lineTo(0, 700); ctx.closePath(); ctx.fill();
        ctx.fillStyle = metal(ctx, d.line, 0, 0, 380, 460); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(380, 0); ctx.lineTo(0, 460); ctx.closePath(); ctx.fill();
        ctx.fillStyle = hexA(d.bg[0], 0.35); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(150, 0); ctx.lineTo(0, 260); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = d.line; ctx.lineWidth = 2; [620, 680].forEach((k) => { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(0, k * 1.25); ctx.stroke(); });
        ctx.restore();
      };
      shard(false, false); shard(true, true);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W - 260, 110); ctx.lineTo(W - 110, 110); ctx.lineTo(W - 110, 260); ctx.moveTo(260, H - 110); ctx.lineTo(110, H - 110); ctx.lineTo(110, H - 260); ctx.stroke(); ctx.restore();
      return { x: 230, y: 360, w: W - 460, h: H - 360 - 360, bsd: [W - 170, 170], div: 'diamond' };
    }
  };

  // ---------------------------------------------------------------- card content
  function words(data) {
    const type = TYPES[data.t] || TYPES.general;
    const lang = data.l === 'en' ? 'en' : 'yi';
    return { type, lang, w: type[lang] };
  }

  function titleText(data) {
    const { type, w } = words(data);
    if (data.ti) return data.ti;
    if (type.masechta && data.m) return (data.l === 'en' ? 'Siyum Maseches ' : 'סיום מסכת ') + data.m;
    return w.title;
  }

  function buildBlocks(data, d, box) {
    const { type, lang, w } = words(data);
    const yi = lang === 'yi';
    const disp = yi ? d.fy : d.fe, body = yi ? d.by : d.be;
    const maxW = box.w;
    const B = [];
    const t = (text, spec, size, color, gap, opts) => { if (text && String(text).trim()) B.push(Object.assign({ kind: 'text', text: String(text).trim(), spec, size, color, gap, maxW }, opts || {})); };
    t(w.open, body, 40, d.muted, 26, { italic: !yi });
    t(titleText(data), disp, yi ? 132 : 104, d.title, 18, { lh: 1.12, track: yi ? 0 : 6 });
    B.push({ kind: 'div', h: 56, gap: 22 });
    t(data.w || w.invite, body, 46, d.ink, 44, { maxW: Math.min(maxW, 1000), lh: 1.42 });
    if (data.p) {
      t(w.p, body, 36, d.muted, 4, { italic: !yi });
      t(data.p, disp, yi ? 110 : 92, d.nm, type.two ? 14 : 40, { lh: 1.12 });
    }
    if (type.two && data.s) {
      if (data.p) t(w.c, body, yi ? 44 : 56, d.title, 14, { italic: !yi });
      t(w.s, body, 36, d.muted, 4, { italic: !yi });
      t(data.s, disp, yi ? 110 : 92, d.nm, 40, { lh: 1.12 });
    }
    B.push({ kind: 'div', h: 56, gap: 30 });
    const hd = data.hd || (hebrewParts(data.dt) || {})[lang];
    t(dayLine(data, lang), body, 44, d.ink, 10);
    t(hd, disp, yi ? 72 : 62, d.title, 8, { track: 0 });
    if (data.dt) t(civilLong(data.dt, yi ? 'yi' : 'en'), body, 36, d.muted, 18);
    t(timeLabel(data.tm, lang), body, 46, d.ink, 30, { weight: 700 });
    t(data.v, disp, yi ? 64 : 56, d.nm, 8, { lh: 1.15 });
    t(data.a, body, 38, d.muted, 26);
    t(data.n, body, 38, d.ink, 30, { italic: !yi && !HE.test(data.n || ''), lh: 1.38, maxW: Math.min(maxW, 980) });
    if (data.h1 || data.h2) {
      B.push({ kind: 'div', h: 40, gap: 26, small: true });
      t(w.hosts, body, 34, d.muted, 10, { italic: !yi });
      if (type.hosts2 && data.h1 && data.h2) B.push({ kind: 'cols', a: data.h1, b: data.h2, spec: disp, size: yi ? 52 : 44, color: d.nm, gap: 0, maxW });
      else t(data.h1 || data.h2, disp, yi ? 52 : 44, d.nm, 0, { lh: 1.2 });
    }
    return B;
  }

  function measure(ctx, B, s) {
    let total = 0;
    B.forEach((b, i) => {
      const last = i === B.length - 1;
      if (b.kind === 'div') { b._h = b.h * s; }
      else if (b.kind === 'cols') {
        font(ctx, b.spec, b.size * s);
        const colW = b.maxW / 2 - 30 * s;
        b._a = wrapLines(ctx, b.a, colW); b._b = wrapLines(ctx, b.b, colW);
        b._lh = b.size * s * 1.2; b._h = Math.max(b._a.length, b._b.length) * b._lh;
      } else {
        font(ctx, b.weight ? [b.spec[0], Math.max(b.spec[1], b.weight)] : b.spec, b.size * s, b.italic);
        b._lines = wrapLines(ctx, b.text, b.maxW);
        // a single word wider than the line (long name) shrinks itself
        b._fs = b.size * s;
        const widest = Math.max.apply(null, b._lines.map((l) => ctx.measureText(l).width));
        if (widest > b.maxW) b._fs = b._fs * b.maxW / widest;
        b._lh = b._fs * (b.lh || 1.3); b._h = b._lines.length * b._lh;
      }
      total += b._h + (last ? 0 : b.gap * s);
    });
    return total;
  }

  function drawBlocks(ctx, B, d, box, divStyle) {
    let s = 1, total = measure(ctx, B, s);
    if (total < box.h * 0.8) { s = Math.min(1.2, (box.h * 0.86) / total); total = measure(ctx, B, s); }
    for (let i = 0; i < 12 && total > box.h; i++) { s *= Math.max(0.8, (box.h / total) * 0.99); total = measure(ctx, B, s); }
    let y = box.y + Math.max(0, (box.h - total) / 2);
    const cx = box.x + box.w / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    B.forEach((b) => {
      if (b.kind === 'div') {
        divider(ctx, divStyle, cx, y + b._h / 2, (b.small ? 220 : 420) * s, d.line);
      } else if (b.kind === 'cols') {
        font(ctx, b.spec, b.size * s); ctx.fillStyle = b.color;
        const rtl = HE.test(b.a + b.b);
        const qx = b.maxW / 4;
        const ax = rtl ? cx + qx : cx - qx, bx = rtl ? cx - qx : cx + qx;
        b._a.forEach((l, i) => { ctx.direction = dirOf(l); ctx.fillText(l, ax, y + b._lh * (i + 0.5)); });
        b._b.forEach((l, i) => { ctx.direction = dirOf(l); ctx.fillText(l, bx, y + b._lh * (i + 0.5)); });
        ctx.save(); ctx.strokeStyle = d.line; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y + b._h - 6); ctx.stroke(); ctx.restore();
      } else {
        font(ctx, b.weight ? [b.spec[0], Math.max(b.spec[1], b.weight)] : b.spec, b._fs, b.italic);
        ctx.fillStyle = b.color;
        if ('letterSpacing' in ctx) ctx.letterSpacing = b.track ? Math.round(b.track * s) + 'px' : '0px';
        b._lines.forEach((l, i) => { ctx.direction = dirOf(l); ctx.fillText(l, cx, y + b._lh * (i + 0.5)); });
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }
      y += b._h + b.gap * s;
    });
  }

  function paint(ctx, data) {
    const d = designById(data.d);
    ctx.save();
    const box = FRAMES[d.frame](ctx, d, data);
    ctx.restore();
    // בס״ד
    ctx.save(); font(ctx, d.by, 34); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillText('בס״ד', box.bsd[0], box.bsd[1]); ctx.restore();
    ctx.save();
    drawBlocks(ctx, buildBlocks(data, d, box), d, box, box.div);
    ctx.restore();
  }

  // Renders the card into `canvas` at `scale` (1 = 1500×2100). Resolves when drawn.
  async function render(canvas, data, scale) {
    const d = designById(data.d);
    await ensureFonts(d);
    scale = scale || 1;
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    paint(ctx, data);
    return canvas;
  }

  // ---------------------------------------------------------------- link encoding
  const KEYS = ['t', 'd', 'l', 'p', 's', 'm', 'h1', 'h2', 'dt', 'hd', 'pr', 'tm', 'v', 'a', 'n', 'r', 'w', 'ti'];
  function clean(data) {
    const out = {};
    KEYS.forEach((k) => { const v = data[k]; if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.join(''))) return; out[k] = typeof v === 'string' ? v.slice(0, 600) : v; });
    return out;
  }
  function b64url(bytes) {
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out;
  }
  async function streamBytes(bytes, Stream, fmt) {
    const res = new Response(new Blob([bytes]).stream().pipeThrough(new Stream(fmt)));
    return new Uint8Array(await res.arrayBuffer());
  }
  async function encode(data) {
    const json = new TextEncoder().encode(JSON.stringify(clean(data)));
    if (typeof CompressionStream !== 'undefined') {
      try { return 'z' + b64url(await streamBytes(json, CompressionStream, 'deflate-raw')); } catch (_) {}
    }
    return 'u' + b64url(json);
  }
  async function decode(token) {
    if (!token) return null;
    const kind = token[0], body = token.slice(1);
    let bytes = unb64url(body);
    if (kind === 'z') bytes = await streamBytes(bytes, DecompressionStream, 'deflate-raw');
    else if (kind !== 'u') return null;
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    return obj && typeof obj === 'object' ? clean(obj) : null;
  }
  function viewUrl(token) { return new URL('invite.html#i=' + token, location.href).href; }

  // ---------------------------------------------------------------- exports
  function canvasBlob(canvas, type, q) { return new Promise((res) => canvas.toBlob(res, type, q)); }

  function fileBase(data) {
    const label = (TYPES[data.t] || TYPES.general).label.en.replace(/[^A-Za-z0-9]+/g, '-');
    const names = [data.p, data.s].filter(Boolean).join(' ').replace(/[^A-Za-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    return ['Kasho-Invitation', label, names].filter(Boolean).join('-').replace(/-+/g, '-').replace(/-$/, '');
  }

  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function fullCanvas(data) { return render(document.createElement('canvas'), data, 1); }

  async function pngBlob(data) { return canvasBlob(await fullCanvas(data), 'image/png'); }

  // A one-page 5×7 in PDF holding the card as a JPEG — written by hand, no library needed.
  async function pdfBlob(data) {
    const canvas = await fullCanvas(data);
    const jpg = new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', 0.95)).arrayBuffer());
    const enc = new TextEncoder();
    const parts = []; const offsets = []; let len = 0;
    const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offsets[n] = len; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
    const content = 'q 360 0 0 504 0 0 cm /Im0 Do Q';
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 360 504] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'));
    obj(4, () => { push('<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpg.length + ' >>\nstream\n'); push(jpg); push('\nendstream'); });
    obj(5, () => push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'));
    const xref = len;
    let x = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }

  async function printCard(data) {
    const canvas = await fullCanvas(data);
    let holder = document.getElementById('invitePrint');
    if (!holder) { holder = document.createElement('div'); holder.id = 'invitePrint'; holder.className = 'invite-print'; document.body.appendChild(holder); }
    holder.innerHTML = '';
    const img = new Image(); img.alt = ''; img.src = canvas.toDataURL('image/png');
    holder.appendChild(img);
    await (img.decode ? img.decode().catch(() => null) : null);
    document.body.classList.add('printing-invite');
    const done = () => { document.body.classList.remove('printing-invite'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }

  // ---- calendar
  function nyOffset(ms) {
    const p = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
      .formatToParts(new Date(ms)).forEach((x) => { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - ms;
  }
  function eventTimes(data) {
    const g = parseISO(data.dt); if (!g) return null;
    const t = /^(\d{1,2}):(\d{2})$/.exec(data.tm || '');
    if (!t) return { allDay: true, g };
    const wall = Date.UTC(g.y, g.m - 1, g.d, +t[1], +t[2]);
    let utc = wall - nyOffset(wall); utc = wall - nyOffset(utc);
    const hours = (TYPES[data.t] || TYPES.general).hours || 3;
    return { allDay: false, start: new Date(utc), end: new Date(utc + hours * 3600000), g };
  }
  const icsStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ymd = (g, add) => { const d = new Date(Date.UTC(g.y, g.m - 1, g.d + (add || 0))); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
  function summary(data) {
    const names = [data.p, words(data).type.two ? data.s : ''].filter(Boolean).join(data.l === 'en' ? ' & ' : ' ו');
    return titleText(data) + (names ? ' · ' + names : '');
  }
  function place(data) { return [data.v, data.a].filter(Boolean).join(', '); }
  function icsEscape(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
  function icsFold(line) {
    const out = []; let cur = ''; let bytes = 0; const enc = new TextEncoder();
    for (const ch of line) { const b = enc.encode(ch).length; if (bytes + b > 73) { out.push(cur); cur = ' '; bytes = 1; } cur += ch; bytes += b; }
    out.push(cur); return out.join('\r\n');
  }
  function icsText(data, link) {
    const t = eventTimes(data); if (!t) return null;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kasho Community//Simcha Invitations//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '@kasho-invitations', 'DTSTAMP:' + icsStamp(new Date())];
    if (t.allDay) { lines.push('DTSTART;VALUE=DATE:' + ymd(t.g), 'DTEND;VALUE=DATE:' + ymd(t.g, 1)); }
    else { lines.push('DTSTART:' + icsStamp(t.start), 'DTEND:' + icsStamp(t.end)); }
    lines.push('SUMMARY:' + icsEscape(summary(data)));
    if (place(data)) lines.push('LOCATION:' + icsEscape(place(data)));
    const desc = [data.hd || (hebrewParts(data.dt) || {})[data.l === 'en' ? 'en' : 'yi'], data.n, link].filter(Boolean).join('\n');
    if (desc) lines.push('DESCRIPTION:' + icsEscape(desc));
    if (link) lines.push('URL:' + link);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(icsFold).join('\r\n') + '\r\n';
  }
  function googleCalUrl(data, link) {
    const t = eventTimes(data); if (!t) return '';
    const dates = t.allDay ? ymd(t.g) + '/' + ymd(t.g, 1) : icsStamp(t.start) + '/' + icsStamp(t.end);
    const q = new URLSearchParams({ action: 'TEMPLATE', text: summary(data), dates, details: [data.n, link].filter(Boolean).join('\n'), location: place(data) });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }
  function mapsUrl(data) { const q = place(data); return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : ''; }
  function wazeUrl(data) { const q = data.a || data.v; return q ? 'https://waze.com/ul?navigate=yes&q=' + encodeURIComponent(q) : ''; }
  function phoneDigits(p) { let d = String(p || '').replace(/\D/g, ''); if (d.length === 10) d = '1' + d; return d.length >= 11 ? d : ''; }
  function shareText(data, link) {
    const yi = data.l !== 'en';
    const when = [dayLine(data, data.l === 'en' ? 'en' : 'yi'), data.hd || (hebrewParts(data.dt) || {})[yi ? 'yi' : 'en'], timeLabel(data.tm, yi ? 'yi' : 'en')].filter(Boolean).join(' · ');
    const head = yi ? 'איר זענט הערצליך איינגעלאדן! ' : 'You’re invited! ';
    return head + summary(data) + (when ? '\n' + when : '') + (place(data) ? '\n' + place(data) : '') + '\n\n' + (yi ? 'די הזמנה: ' : 'Invitation: ') + link;
  }
  // RSVP goes straight to the host's phone: a call (tel:) or a text message (sms:).
  // `r` is the host phone field; older invite links carried the same number there, so they keep working.
  function rsvpMessage(data) {
    const yi = data.l !== 'en';
    return (yi ? 'מזל טוב! איך בין מקבל די הזמנה צו ' : 'Mazel tov! Replying to your invitation for ') + summary(data) + (yi ? ' — אי״ה וועלן מיר קומען.' : ' — we hope to be there, b’ezras Hashem.');
  }
  function rsvpLinks(data) {
    const digits = phoneDigits(data.r); if (!digits) return null;
    return { call: 'tel:+' + digits, text: 'sms:+' + digits + '?&body=' + encodeURIComponent(rsvpMessage(data)) };
  }

  // ---------------------------------------------------------------- shared UI bits
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const siteLang = () => (document.documentElement.lang === 'yi' ? 'yi' : 'en');
  function both(el, en, yi) {
    if (!el) return;
    el.innerHTML = '';
    const a = document.createElement('span'); a.dataset.lang = 'en'; a.textContent = en;
    const b = document.createElement('span'); b.dataset.lang = 'yi'; b.textContent = yi;
    a.hidden = siteLang() !== 'en'; b.hidden = siteLang() !== 'yi';
    el.append(a, b);
  }
  function flash(el, en, yi) {
    if (!el) return;
    both(el, en, yi); el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove(); return ok;
  }
  function todayISO(addDays, weekdayWanted) {
    const d = new Date(); d.setDate(d.getDate() + (addDays || 0));
    if (weekdayWanted !== undefined) while (d.getDay() !== weekdayWanted) d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Sample wording for the gallery thumbnails only (placeholders, not real people).
  function sample(design, lang) {
    const yi = lang === 'yi';
    const base = { d: design.id, t: design.type, l: lang, dt: todayISO(21, 2), tm: '19:30',
      v: yi ? 'אולם השמחות' : 'The Simcha Hall', a: yi ? 'שם האולם און אדרעס' : 'Hall address' };
    const S = {
      chasuna: { p: yi ? 'שמואל יוסף' : 'Shmuel Yosef', s: yi ? 'חיה מרים' : 'Chaya Miriam', h1: yi ? 'ר׳ יעקב כהן' : 'Mr. & Mrs. Yaakov Cohen', h2: yi ? 'ר׳ דוד לוי' : 'Mr. & Mrs. Dovid Levy' },
      vort: { p: yi ? 'משה אהרן' : 'Moshe Aharon', s: yi ? 'רחל לאה' : 'Rochel Leah', h1: yi ? 'ר׳ יצחק גרין' : 'Mr. & Mrs. Yitzchok Green', h2: yi ? 'ר׳ שלמה ווייס' : 'Mr. & Mrs. Shlomo Weiss' },
      barmitzvah: { p: yi ? 'מנחם מענדל' : 'Menachem Mendel', h1: yi ? 'ר׳ אברהם שווארץ' : 'Mr. & Mrs. Avrohom Schwartz' },
      bris: { h1: yi ? 'ר׳ יוסף קליין' : 'Mr. & Mrs. Yosef Klein', tm: '08:30' },
      kiddush: { h1: yi ? 'ר׳ חיים בערגער' : 'Mr. & Mrs. Chaim Berger', tm: '11:30' },
      upsherin: { p: yi ? 'יואל' : 'Yoel', h1: yi ? 'ר׳ משה פריעד' : 'Mr. & Mrs. Moshe Fried', tm: '17:00' },
      shevabrachos: { p: yi ? 'שמואל יוסף' : 'Shmuel Yosef', s: yi ? 'חיה מרים' : 'Chaya Miriam', h1: yi ? 'משפחת רוזנבערג' : 'The Rosenberg Family' },
      siyum: { m: yi ? 'ברכות' : 'Brachos', p: yi ? 'ר׳ נפתלי הערץ' : 'Reb Naftali Hertz', h1: yi ? 'משפחת דייטש' : 'The Deutsch Family', tm: '20:00' },
      chanukashabayis: { h1: yi ? 'משפחת גאלדבערגער' : 'The Goldberger Family', tm: '20:00' },
      general: { h1: yi ? 'משפחת פרידמאן' : 'The Friedman Family' }
    };
    return Object.assign(base, S[design.type] || {});
  }

  // ---------------------------------------------------------------- editor page
  const DRAFT = 'kasho-invite-draft-v1';
  function initEditor() {
    const root = $('#invEditor'); if (!root) return;
    const canvas = $('#invCanvas'); const status = $('#invStatus');
    let state = null;
    try { state = JSON.parse(localStorage.getItem(DRAFT) || 'null'); } catch (_) {}
    const fromSample = (d, t, l) => Object.assign(sample({ id: d, type: t }, l), { ps: 1, sm: 1 });
    if (!state || typeof state !== 'object') state = fromSample('royal', 'chasuna', 'yi');
    if (state.ps === undefined) state.ps = 1;
    // While the form still holds the sample wording, switching design/simcha/language swaps in matching samples.
    const reSample = () => { if (state.sm) state = fromSample(state.d, state.t, state.l === 'en' ? 'en' : 'yi'); };

    const m = /^#make=([a-z][a-z-]*)(?:&t=([a-z]+))?/.exec(location.hash);
    if (m) { const d = designById(m[1]); state.d = d.id; state.t = (m[2] && TYPES[m[2]]) ? m[2] : d.type; reSample(); }

    // gallery — ~160 designs: filter by simcha / colour / search, rendered lazily as tiles scroll into view, "show more" pages
    const gallery = $('#invGallery'); let sampleLang = 'yi';
    const PAGE = 24;
    const gf = { type: 'all', color: 'all', q: '', limit: PAGE };
    const tiles = [];
    const drawQueue = []; let gDrawing = false;
    async function pump() {
      if (gDrawing) return; gDrawing = true;
      while (drawQueue.length) {
        const t = drawQueue.shift();
        if (t.drawn === sampleLang || t.el.hidden) continue;
        const lang = sampleLang;
        try { await render(t.cv, sample(t.d, lang), 0.24); t.drawn = lang; } catch (_) {}
        await new Promise((r) => setTimeout(r, 0));
      }
      gDrawing = false;
    }
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { const t = tiles[+e.target.dataset.idx]; if (t && t.drawn !== sampleLang && !drawQueue.includes(t)) drawQueue.push(t); } });
      pump();
    }, { rootMargin: '400px 0px' }) : null;
    function queueVisible() {
      tiles.forEach((t) => { if (!t.el.hidden && t.drawn !== sampleLang) { if (io) { io.unobserve(t.el); io.observe(t.el); } else if (!drawQueue.includes(t)) drawQueue.push(t); } });
      pump();
    }
    const norm = (x) => String(x || '').toLowerCase().replace(/[\u0591-\u05C7]/g, '');
    function applyFilter() {
      const q = norm(gf.q.trim());
      let match = 0, shown = 0;
      tiles.forEach((t) => {
        const d = t.d;
        const ok = (gf.type === 'all' || t.types.includes(gf.type)) && (gf.color === 'all' || d.color === gf.color) && (!q || t.text.includes(q));
        if (ok) match++;
        t.el.hidden = !(ok && shown < gf.limit);
        if (ok && shown < gf.limit) shown++;
      });
      const cnt = $('#invCount');
      if (cnt) both(cnt, match ? 'Showing ' + shown + ' of ' + match + ' designs' : 'No designs match — try another filter.', match ? shown + ' פון ' + match + ' דיזיינס' : 'קיין דיזיין פאסט נישט — פרובירט אן אנדער אויסוואל.');
      const more = $('#invMore'); if (more) more.hidden = shown >= match;
      queueVisible();
    }
    if (gallery) {
      gallery.innerHTML = '';
      // order: one of each new family first, then the originals, then the rest
      const fresh = DESIGNS.filter((d) => d.isNew), orig = DESIGNS.filter((d) => !d.isNew);
      const firstRound = []; const seen = {};
      fresh.forEach((d) => { if (!seen[d.family]) { seen[d.family] = 1; firstRound.push(d); } });
      const order = firstRound.concat(orig, fresh.filter((d) => firstRound.indexOf(d) < 0));
      order.forEach((d, idx) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-tile'; b.dataset.design = d.id; b.dataset.type = d.type; b.dataset.idx = String(idx);
        const types = [d.type].concat(d.also || []); b.dataset.types = types.join(' ');
        const cv = document.createElement('canvas'); cv.dataset.design = d.id; cv.width = 360; cv.height = 504; cv.setAttribute('aria-hidden', 'true'); cv.style.background = d.bg[0];
        const cap = document.createElement('span'); cap.className = 'inv-tile-cap';
        const ty = document.createElement('span'); ty.className = 'inv-tile-type'; both(ty, TYPES[d.type].label.en, TYPES[d.type].label.yi);
        const nm = document.createElement('span'); nm.className = 'inv-tile-name'; both(nm, d.name.en, d.name.yi);
        const go = document.createElement('span'); go.className = 'inv-tile-go'; both(go, 'Use this design →', 'נעמט די דיזיין ←');
        cap.append(ty, nm, go); b.append(cv, cap);
        if (d.isNew) { const nb = document.createElement('span'); nb.className = 'inv-tile-new'; both(nb, 'New', 'נייע'); b.appendChild(nb); }
        b.addEventListener('click', () => {
          state.d = d.id; state.t = d.type; if (state.sm) { state.l = sampleLang; reSample(); } syncForm(); update(); parsha();
          history.replaceState(null, '', '#make=' + d.id);
          $('#invEditorTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => { const f = $('#fP'); if (f && !f.closest('[hidden]')) f.focus({ preventScroll: true }); }, 500);
        });
        const fam = FAMILY_NAMES[d.family] || { en: '', yi: '' }; const col = COLORS[d.color] || { en: '', yi: '' };
        const text = norm([d.id, d.name.en, d.name.yi, fam.en, fam.yi, col.en, col.yi].concat(types.map((k) => TYPES[k].label.en + ' ' + TYPES[k].label.yi)).join(' '));
        tiles.push({ el: b, cv, d, types, text, drawn: null });
        gallery.appendChild(b);
        if (io) io.observe(b);
      });
      applyFilter();
      $$('[data-sample-lang]').forEach((btn) => btn.addEventListener('click', () => {
        sampleLang = btn.dataset.sampleLang;
        $$('[data-sample-lang]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
        queueVisible();
      }));
      $$('[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
        gf.type = chip.dataset.filter; gf.limit = PAGE;
        $$('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === chip)));
        applyFilter();
      }));
      $$('[data-color]').forEach((chip) => chip.addEventListener('click', () => {
        gf.color = chip.dataset.color; gf.limit = PAGE;
        $$('[data-color]').forEach((x) => x.setAttribute('aria-pressed', String(x === chip)));
        applyFilter();
      }));
      const search = $('#invSearch'); let st = null;
      if (search) search.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { gf.q = search.value; gf.limit = PAGE; applyFilter(); }, 150); });
      const more = $('#invMore'); if (more) more.addEventListener('click', () => { gf.limit += PAGE; applyFilter(); });
    }

    // colour variants of the chosen design (same frame, other palettes) + type select
    const sw = $('#invSwatches');
    function drawSwatches() {
      const cur = designById(state.d); const fam = cur.family || cur.frame;
      const list = DESIGNS.filter((d) => (d.family || d.frame) === fam);
      sw.innerHTML = '';
      list.forEach((d) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-swatch'; b.dataset.design = d.id;
        b.style.setProperty('--sw-a', d.bg[0]); b.style.setProperty('--sw-b', d.line);
        b.setAttribute('aria-label', d.name.en); b.title = d.name.en;
        b.setAttribute('aria-pressed', String(d.id === state.d));
        b.addEventListener('click', () => { state.d = d.id; syncForm(); update(); });
        sw.appendChild(b);
      });
      const all = document.createElement('a'); all.className = 'inv-swatch-all'; all.href = '#galleryHeading'; both(all, 'All designs ↑', 'אלע דיזיינס ↑');
      sw.appendChild(all);
    }
    const typeSel = $('#fType');
    Object.keys(TYPES).forEach((k) => {
      const o = document.createElement('option'); o.value = k; o.textContent = TYPES[k].label.en + ' · ' + TYPES[k].label.yi; typeSel.appendChild(o);
    });

    const FIELDS = { fP: 'p', fS: 's', fM: 'm', fH1: 'h1', fH2: 'h2', fDate: 'dt', fHd: 'hd', fTime: 'tm', fVenue: 'v', fAddr: 'a', fNote: 'n', fRsvp: 'r', fTitle: 'ti', fWording: 'w' };

    function syncForm() {
      const type = TYPES[state.t] || TYPES.general; const { w } = words(state);
      typeSel.value = state.t;
      drawSwatches();
      const dn = designById(state.d).name; both($('#invDesignName'), dn.en, dn.yi);
      $$('[name="cardLang"]').forEach((r) => { r.checked = r.value === state.l; });
      Object.keys(FIELDS).forEach((id) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = state[FIELDS[id]] || ''; });
      $('#fParsha').checked = !!state.ps;
      const lab = (id, f) => { const l = $('label[for="' + id + '"] .lbl'); if (l && f) both(l, f.en, f.yi); };
      lab('fP', type.fields.p); lab('fS', type.fields.s); lab('fH1', type.fields.h1); lab('fH2', type.fields.h2);
      $('#rowS').hidden = !type.two; $('#rowH2').hidden = !type.hosts2; $('#rowM').hidden = !type.masechta;
      $('#fTitle').placeholder = w.title; $('#fWording').placeholder = w.invite;
      const isYi = state.l !== 'en';
      ['fP', 'fS', 'fM', 'fH1', 'fH2', 'fVenue', 'fNote', 'fTitle', 'fWording', 'fHd'].forEach((id) => { const el = document.getElementById(id); if (el) el.dir = 'auto'; });
      root.dataset.cardLang = isYi ? 'yi' : 'en';
      $('#invSampleNote').hidden = !state.sm;
      hebHint();
    }

    function hebHint() {
      const hp = hebrewParts(state.dt);
      const hint = $('#hdAuto');
      if (hp) { both(hint, 'Hebrew date: ' + hp.en + ' · ' + hp.yi, 'עברי׳שע דאטום: ' + hp.yi); $('#fHd').placeholder = state.l === 'en' ? hp.en : hp.yi; }
      else { both(hint, 'Pick the date and the Hebrew date fills in by itself.', 'קלויבט א דאטום, דער אידישער דאטום ווערט אויסגעפילט אליין.'); $('#fHd').placeholder = ''; }
    }

    let timer = null, drawing = false, again = false;
    async function draw() {
      if (drawing) { again = true; return; }
      drawing = true;
      try { await render(canvas, state, 0.5); } finally { drawing = false; }
      if (again) { again = false; draw(); }
    }
    let lastToken = '';
    async function refreshLink() {
      lastToken = await encode(state);
      const link = viewUrl(lastToken);
      $('#invLink').value = link;
      $('#btnOpen').href = link;
      return link;
    }
    function save() { try { localStorage.setItem(DRAFT, JSON.stringify(state)); } catch (_) {} }
    function update() {
      clearTimeout(timer);
      timer = setTimeout(() => { draw(); refreshLink(); save(); }, 90);
    }
    async function parsha() {
      if (!state.ps || !state.dt) { if (state.pr) { delete state.pr; update(); } return; }
      const want = state.dt; const p = await fetchParsha(want);
      if (state.dt !== want) return;
      if (p) state.pr = [p.yi, p.en]; else delete state.pr;
      update();
    }

    root.addEventListener('input', (e) => {
      const id = e.target.id;
      if (FIELDS[id]) { state[FIELDS[id]] = e.target.value; if (state.sm) { state.sm = 0; syncForm(); } if (id === 'fDate') { hebHint(); parsha(); } update(); }
    });
    root.addEventListener('change', (e) => {
      if (e.target.id === 'fType') { state.t = e.target.value; reSample(); syncForm(); update(); parsha(); }
      if (e.target.name === 'cardLang') { state.l = e.target.value; reSample(); syncForm(); update(); parsha(); }
      if (e.target.id === 'fParsha') { state.ps = e.target.checked ? 1 : 0; parsha(); }
      if (e.target.id === 'fDate') { hebHint(); parsha(); }
    });
    $('#btnResetWording').addEventListener('click', () => { state.w = ''; state.ti = ''; syncForm(); update(); });
    $('#btnClear').addEventListener('click', () => {
      const keep = { d: state.d, t: state.t, l: state.l, ps: state.ps, sm: 0 };
      state = keep; syncForm(); update();
      flash(status, 'Cleared — start fresh.', 'אויסגעמעקט.');
    });

    const busy = async (btn, fn) => { btn.disabled = true; try { await fn(); } catch (err) { console.warn(err); flash(status, 'Something went wrong — please try again.', 'עפעס האט נישט געארבעט, פרובירט נאכאמאל.'); } finally { btn.disabled = false; } };
    $('#btnPng').addEventListener('click', (e) => busy(e.currentTarget, async () => { saveBlob(await pngBlob(state), fileBase(state) + '.png'); flash(status, 'Image downloaded.', 'די בילד איז אראפגעלאדן.'); }));
    $('#btnPdf').addEventListener('click', (e) => busy(e.currentTarget, async () => { saveBlob(await pdfBlob(state), fileBase(state) + '.pdf'); flash(status, 'PDF downloaded.', 'דער PDF איז אראפגעלאדן.'); }));
    $('#btnPrint').addEventListener('click', (e) => busy(e.currentTarget, () => printCard(state)));
    $('#btnCopy').addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const link = await refreshLink();
      const ok = await copyText(link);
      if (ok) flash(status, 'Link copied — paste it anywhere.', 'דער לינק איז קאפירט.'); else { $('#invLink').select(); flash(status, 'Select the link and copy it.', 'קאפירט דעם לינק.'); }
    }));
    $('#btnShare').addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const link = await refreshLink();
      const text = shareText(state, link);
      if (navigator.share) {
        try { await navigator.share({ title: summary(state), text }); return; }
        catch (err) { if (err && err.name === 'AbortError') return; }
      }
      const ok = await copyText(text);
      if (ok) flash(status, 'Invitation text and link copied — paste it in any message.', 'די הזמנה מיטן לינק איז קאפירט — לייגט עס אריין אין סיי וועלכע מעסעדזש.');
      else { $('#invLink').select(); flash(status, 'Select the link and copy it.', 'קאפירט דעם לינק.'); }
    }));
    const shareBtn = $('#btnShareImg');
    if (navigator.canShare && navigator.share) {
      try { if (navigator.canShare({ files: [new File([new Blob(['x'])], 'x.png', { type: 'image/png' })] })) shareBtn.hidden = false; } catch (_) {}
    }
    shareBtn.addEventListener('click', (e) => busy(e.currentTarget, async () => {
      const link = await refreshLink();
      const file = new File([await pngBlob(state)], fileBase(state) + '.png', { type: 'image/png' });
      try { await navigator.share({ files: [file], text: shareText(state, link) }); } catch (err) { if (err && err.name !== 'AbortError') throw err; }
    }));
    $('#invLink').addEventListener('focus', (e) => e.target.select());

    // Phone: a floating "preview & share" button while the form is on screen and the card is not.
    const jump = $('#invJump');
    if (jump && 'IntersectionObserver' in window) {
      let formIn = false, prevIn = false;
      const set = () => { jump.hidden = !(formIn && !prevIn); };
      new IntersectionObserver((es) => { es.forEach((e) => { if (e.target.id === 'invPreview') prevIn = e.isIntersecting; else formIn = e.isIntersecting; }); set(); }, { threshold: 0.05 })
        .observe($('.inv-form')) ;
      new IntersectionObserver((es) => { prevIn = es[0].isIntersecting; set(); }, { threshold: 0.15 }).observe($('#invPreview'));
    }

    if (!state.dt) state.dt = '';
    syncForm(); draw(); refreshLink(); if (state.dt && state.ps && !state.pr) parsha();
    document.addEventListener('site-language-change', () => { syncForm(); });
    window.addEventListener('hashchange', () => {
      const mm = /^#make=([a-z][a-z-]*)/.exec(location.hash);
      if (mm) { const d = designById(mm[1]); state.d = d.id; state.t = d.type; reSample(); syncForm(); update(); }
    });
  }

  // ---------------------------------------------------------------- shared invitation view
  async function initView() {
    const root = $('#invView'); if (!root) return;
    const m = /[#&]i=([A-Za-z0-9_-]+)/.exec(location.hash);
    let data = null;
    try { data = m ? await decode(m[1]) : null; } catch (_) { data = null; }
    if (!data || !data.d) { $('#viewEmpty').hidden = false; $('#viewLoading').hidden = true; return; }
    if (!TYPES[data.t]) data.t = 'general';
    if (!SAVED_LANG && data.l !== 'en' && siteLang() !== 'yi' && window.toggleLang) window.toggleLang();

    const canvas = $('#viewCanvas');
    await render(canvas, data, 0.6);
    $('#viewLoading').hidden = true; $('#viewMain').hidden = false;
    requestAnimationFrame(() => root.classList.add('is-ready'));
    canvas.setAttribute('aria-label', summary(data));
    const link = location.href.split('#')[0] + '#i=' + m[1];
    document.title = summary(data) + ' | Kasho';

    const yiCard = data.l !== 'en';
    $('#vTitle').textContent = summary(data); $('#vTitle').dir = 'auto';
    const hp = hebrewParts(data.dt) || {};
    const dateLine = [dayLine(data, yiCard ? 'yi' : 'en'), data.hd || hp[yiCard ? 'yi' : 'en']].filter(Boolean).join(' · ');
    const setRow = (id, text, sub) => {
      const row = document.getElementById(id); if (!row) return;
      if (!text) { row.hidden = true; return; }
      row.querySelector('.v-main').textContent = text; row.querySelector('.v-main').dir = 'auto';
      const s = row.querySelector('.v-sub'); if (s) { s.textContent = sub || ''; s.dir = 'auto'; }
    };
    setRow('vDate', dateLine, data.dt ? civilLong(data.dt, yiCard ? 'yi' : 'en') : '');
    setRow('vTime', timeLabel(data.tm, 'en'), '');
    setRow('vPlace', data.v || data.a, data.v ? data.a : '');
    setRow('vNote', data.n, '');

    const t = eventTimes(data);
    const cal = $('#vCal'), gcal = $('#vGcal');
    if (t) {
      gcal.href = googleCalUrl(data, link);
      cal.addEventListener('click', () => { const ics = icsText(data, link); saveBlob(new Blob([ics], { type: 'text/calendar;charset=utf-8' }), fileBase(data) + '.ics'); });
    } else { cal.hidden = true; gcal.hidden = true; }
    const maps = mapsUrl(data), waze = wazeUrl(data);
    if (maps) $('#vMaps').href = maps; else $('#vMaps').hidden = true;
    if (waze) $('#vWaze').href = waze; else $('#vWaze').hidden = true;
    const rs = rsvpLinks(data);
    if (rs) {
      $('#vRsvpCall').href = rs.call; $('#vRsvpCall').hidden = false;
      $('#vRsvpText').href = rs.text; $('#vRsvpText').hidden = false;
    }
    $('#vPng').addEventListener('click', async (e) => { const btn = e.currentTarget; btn.disabled = true; try { saveBlob(await pngBlob(data), fileBase(data) + '.png'); } finally { btn.disabled = false; } });
    const vStatus = $('#vStatus');
    $('#vShare').addEventListener('click', async () => {
      const text = shareText(data, link);
      if (navigator.share) {
        try { await navigator.share({ title: summary(data), text }); return; }
        catch (err) { if (err && err.name === 'AbortError') return; }
      }
      const ok = await copyText(text);
      flash(vStatus, ok ? 'Invitation text and link copied — paste it in any message.' : 'Could not copy — please copy the page address.', ok ? 'די הזמנה מיטן לינק איז קאפירט.' : 'עס האט נישט געקענט קאפירן.');
    });
    $('#vCopy').addEventListener('click', async () => {
      const ok = await copyText(link);
      flash(vStatus, ok ? 'Link copied — paste it anywhere.' : 'Could not copy — please copy the page address.', ok ? 'דער לינק איז קאפירט.' : 'עס האט נישט געקענט קאפירן.');
    });
    $('#vMake').href = 'invitations.html#make=' + designById(data.d).id + '&t=' + data.t;
  }

  window.KashoInvites = { TYPES, DESIGNS, render, encode, decode, hebrewParts, gematria, icsText, googleCalUrl, pdfBlob, pngBlob, sample, designById, viewUrl };

  function start() { initEditor(); initView(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
