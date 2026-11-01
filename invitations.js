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
    shalomzachor: {
      label: { en: 'Shalom Zachor', yi: 'שלום זכר' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'שלום זכר', invite: 'הננו מתכבדים להזמין את כבודו להשתתף בשמחת השלום זכר לרגל הולדת בננו היקר נ״י', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Shalom Zachor', invite: 'Please join us at the shalom zachor in honor of the birth of our dear son', p: '', hosts: 'With joy, the parents' },
      fields: { p: { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 2
    },
    vachnacht: {
      label: { en: 'Vach Nacht', yi: 'וואך נאכט' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'וואך נאכט', invite: 'הננו מתכבדים להזמין את כבודו להשתתף בשמחת הוואך נאכט בליל ערב הברית של בננו היקר נ״י', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Vach Nacht', invite: 'Please join us at the vach nacht, the night before the bris of our dear son', p: '', hosts: 'With joy, the parents' },
      fields: { p: { en: 'Name line (optional)', yi: 'נאמען שורה (אויב מ׳וויל)' }, h1: { en: 'Parents', yi: 'עלטערן' } },
      hours: 2
    },
    pidyonhaben: {
      label: { en: 'Pidyon Haben', yi: 'פדיון הבן' },
      yi: { open: 'בשבח והודיה להשי״ת', title: 'פדיון הבן', invite: 'הננו מתכבדים להזמין את כבודו ואת בני ביתו להשתתף בסעודת מצוה לרגל פדיון הבן של בננו הבכור נ״י', p: '', hosts: 'ההורים המאושרים' },
      en: { open: 'With gratitude to Hashem', title: 'Pidyon Haben', invite: 'We invite you and your family to the seudas mitzvah of the pidyon haben of our firstborn son', p: '', hosts: 'With joy, the parents' },
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
  // ---- extra palettes for the boy simchas (Nov 2026)
  Object.assign(PALETTES, {
    powderblue:  { name: { en: 'Powder Blue', yi: 'לייכט בלוי' }, color: 'blue',
      bg: ['#f5f9fd', '#e0ebf6'], ink: '#1f3550', title: '#335f93', nm: '#172e49', muted: '#62788f', line: '#8eaed2',
      petals: ['160,190,225', '200,218,238', '130,165,205'] },
    navysilver:  { name: { en: 'Navy & Silver', yi: 'בלוי מיט זילבער' }, color: 'navy', dark: true,
      bg: ['#0e1a2e', '#1c2f4d'], ink: '#e6ecf3', title: '#d3dbe6', nm: '#f6f8fb', muted: '#a9b6c6', line: '#b9c4d2' },
    midnight:    { name: { en: 'Midnight & Gold', yi: 'נאכט בלוי מיט גאלד' }, color: 'navy', dark: true,
      bg: ['#070d1f', '#18234a'], ink: '#efe6cf', title: '#e9c97a', nm: '#fff4da', muted: '#c4b998', line: '#d9b866' },
    slateblue:   { name: { en: 'Slate Blue', yi: 'שיפער בלוי' }, color: 'blue',
      bg: ['#f5f7f9', '#e0e6ee'], ink: '#273340', title: '#46678a', nm: '#1d2b39', muted: '#6c7a88', line: '#8299b3' },
    denimgold:   { name: { en: 'Denim & Gold', yi: 'דזשינס בלוי מיט גאלד' }, color: 'blue', dark: true,
      bg: ['#203f63', '#2f5a87'], ink: '#f1ead8', title: '#efd18c', nm: '#fff6df', muted: '#d2c6a6', line: '#e0c27a' },
    creamnavy:   { name: { en: 'Cream & Navy', yi: 'קרעם מיט בלוי' }, color: 'cream',
      bg: ['#fbf7ee', '#efe5d1'], ink: '#1d2b42', title: '#24406a', nm: '#152238', muted: '#6d6a64', line: '#b39459' },
    whiteblue:   { name: { en: 'White & Royal Blue', yi: 'ווייס מיט קעניגליך בלוי' }, color: 'white',
      bg: ['#ffffff', '#eef3f9'], ink: '#1d3048', title: '#2c5c97', nm: '#132640', muted: '#5f7186', line: '#4d7db6' },
    silvergrey:  { name: { en: 'Silver Grey', yi: 'זילבער גרוי' }, color: 'white',
      bg: ['#fafafa', '#e6e8ec'], ink: '#2b2f37', title: '#59606e', nm: '#1f232a', muted: '#7d838e', line: '#9097a4' }
  });
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
  // ---- Boy simchas (Nov 2026): Bris, Vach Nacht, Shalom Zachor, Pidyon Haben. rotate = the default wording cycles through the tags.
  const BOY = ['bris', 'vachnacht', 'shalomzachor', 'pidyonhaben'];
  [
    { frame: 'bKesuba', name: { en: 'Kesuba Arch', yi: 'כתובה בויגן' }, tags: BOY, rotate: true, fonts: ['classic', 'scribe'], palettes: ['navygold', 'ivorygold', 'creamnavy', 'denimgold', 'whitesilver'] },
    { frame: 'bLace', name: { en: 'Papercut Doves', yi: 'אויסגעשניטענע טייבעלעך' }, tags: BOY, rotate: true, fonts: ['soft', 'classic'], palettes: ['skywhite', 'navywhite', 'powderblue', 'creamnavy', 'slateblue'] },
    { frame: 'bDeco', name: { en: 'Art Deco Star', yi: 'ארט דעקא שטערן' }, tags: BOY, rotate: true, fonts: ['classic', 'bold'], palettes: ['navygold', 'blackgold', 'midnight', 'navysilver', 'ivorygold'] },
    { frame: 'bTile', name: { en: 'Lantern Window', yi: 'לאמטערן פענסטער' }, tags: BOY, rotate: true, fonts: ['classic', 'scribe'], palettes: ['tealsand', 'navygold', 'ivorygold', 'powderblue', 'denimgold'] },
    { frame: 'bDamask', name: { en: 'Damask Laurel', yi: 'דאמאסק קראנץ' }, tags: BOY, rotate: true, fonts: ['soft', 'classic'], palettes: ['navysilver', 'ivorygold', 'slateblue', 'emeraldgold', 'whiteblue'] },
    { frame: 'bModern', name: { en: 'Modern Band', yi: 'מאדערן' }, tags: BOY, rotate: true, fonts: ['modern', 'bold'], palettes: ['whiteblue', 'navywhite', 'midnight', 'slateblue', 'powderblue'] },
    { frame: 'bStars', name: { en: 'Count the Stars', yi: 'ספור הכוכבים' }, tags: ['vachnacht', 'bris', 'shalomzachor'], rotate: true, fonts: ['classic', 'soft'], palettes: ['midnight', 'navygold', 'powderblue', 'purplegold', 'skywhite'] },
    { frame: 'bJerusalem', name: { en: 'Yerushalayim Stars', yi: 'ירושלים שטערן' }, tags: BOY, rotate: true, fonts: ['bold', 'classic'], palettes: ['ivorygold', 'creamnavy', 'navygold', 'tealsand', 'silvergrey'] },
    { frame: 'bRimon', name: { en: 'Pomegranates', yi: 'רימונים' }, tags: BOY, rotate: true, fonts: ['classic', 'scribe'], palettes: ['ivorygold', 'emeraldgold', 'creamnavy', 'whitesilver', 'burgundygold'] },
    { frame: 'bClouds', name: { en: 'Soft Clouds', yi: 'ווייכע וואלקנס' }, tags: BOY, rotate: true, fonts: ['soft', 'modern'], palettes: ['powderblue', 'skywhite', 'whiteblue', 'navysilver', 'slateblue'] },
    { frame: 'brisKisei', name: { en: 'Kisei shel Eliyahu', yi: 'כסא של אליהו' }, tags: ['bris'], fonts: ['classic', 'scribe', 'bold'], palettes: ['navygold', 'ivorygold', 'denimgold', 'whiteblue', 'blackgold', 'creamnavy'] },
    { frame: 'brisKiseiArch', name: { en: 'Kisei Eliyahu Arch', yi: 'כסא אליהו בויגן' }, tags: ['bris'], fonts: ['soft', 'classic'], palettes: ['powderblue', 'ivorygold', 'navysilver', 'tealsand', 'silvergrey'] },
    { frame: 'brisTorah', name: { en: 'Torah Scroll', yi: 'ספר תורה' }, tags: ['bris', 'pidyonhaben', 'shalomzachor'], fonts: ['scribe', 'classic'], palettes: ['ivorygold', 'navygold', 'creamnavy', 'emeraldgold', 'whitesilver'] },
    { frame: 'vnCandles', name: { en: 'Vach Nacht Candles', yi: 'וואך נאכט ליכט' }, tags: ['vachnacht'], fonts: ['classic', 'bold'], palettes: ['midnight', 'navygold', 'blackgold', 'purplegold', 'denimgold', 'navysilver'] },
    { frame: 'vnShir', name: { en: 'Shir Hamaalos', yi: 'שיר המעלות' }, tags: ['vachnacht', 'bris'], fonts: ['scribe', 'classic'], palettes: ['ivorygold', 'powderblue', 'navygold', 'creamnavy', 'whiteblue'] },
    { frame: 'vnLanterns', name: { en: 'Night Lanterns', yi: 'נאכט לאמטערנס' }, tags: ['vachnacht', 'shalomzachor'], fonts: ['classic', 'soft'], palettes: ['midnight', 'navysilver', 'denimgold', 'blackgold', 'emeraldgold'] },
    { frame: 'vnSiddur', name: { en: 'Krias Shema', yi: 'קריאת שמע' }, tags: ['vachnacht'], fonts: ['scribe', 'bold'], palettes: ['ivorygold', 'navygold', 'slateblue', 'creamnavy', 'whitesilver'] },
    { frame: 'szShabbos', name: { en: 'Shabbos Licht', yi: 'שבת ליכט' }, tags: ['shalomzachor', 'kiddush'], fonts: ['classic', 'soft'], palettes: ['navygold', 'ivorygold', 'midnight', 'creamburgundy', 'whitesilver', 'blushsilver'] },
    { frame: 'szArbes', name: { en: 'Arbes', yi: 'ארבעס' }, tags: ['shalomzachor'], fonts: ['bold', 'modern'], palettes: ['creamnavy', 'ivorygold', 'powderblue', 'tealsand', 'whiteblue'] },
    { frame: 'szWindow', name: { en: 'Friday Night Window', yi: 'פרייטאג צו נאכט' }, tags: ['shalomzachor', 'vachnacht'], fonts: ['classic', 'scribe'], palettes: ['ivorygold', 'creamnavy', 'silvergrey', 'tealsand', 'slateblue'] },
    { frame: 'phCoins', name: { en: 'Five Shekalim', yi: 'חמשה סלעים' }, tags: ['pidyonhaben'], fonts: ['classic', 'scribe'], palettes: ['whitesilver', 'navysilver', 'ivorygold', 'blackgold', 'silvergrey'] },
    { frame: 'phTray', name: { en: 'Silver Tray', yi: 'זילבערנע טאץ' }, tags: ['pidyonhaben'], fonts: ['soft', 'classic'], palettes: ['navygold', 'creamnavy', 'whitesilver', 'emeraldgold', 'charcoalcopper'] },
    { frame: 'phCrown', name: { en: 'Crown & Coins', yi: 'כתר מיט מטבעות' }, tags: ['pidyonhaben'], fonts: ['bold', 'classic'], palettes: ['navysilver', 'ivorygold', 'whiteblue', 'burgundygold', 'slateblue'] }
  ].forEach((f) => { f.xf = [['Suez One', 400], ['Frank Ruhl Libre', 700], ['Frank Ruhl Libre', 500]]; FAMILIES.push(f); });
  // the starry design suits every boy simcha
  FAMILIES.forEach((f) => { if (f.frame === 'starlight') ['vachnacht', 'shalomzachor', 'pidyonhaben'].forEach((t) => { if (!f.tags.includes(t)) f.tags.push(t); }); });
  // ---- part 2 (Nov 2026): a family of new drawings for every other simcha
  const XF = [['Suez One', 400], ['Frank Ruhl Libre', 700], ['Frank Ruhl Libre', 500]];
  [
    { frame: 'upAlefBeis', name: { en: 'Aleph-Beis Blocks', yi: 'אלף בית קלעצלעך' }, tags: ['upsherin'], fonts: ['bold', 'modern'], palettes: ['powderblue', 'creamnavy', 'tealsand', 'whiteblue', 'ivorygold', 'slateblue'] },
    { frame: 'upScissors', name: { en: 'First Haircut', yi: 'ערשטע שערן' }, tags: ['upsherin'], fonts: ['bold', 'classic'], palettes: ['navygold', 'ivorygold', 'powderblue', 'denimgold', 'tealsand'] },
    { frame: 'upTzitzis', name: { en: 'First Tzitzis', yi: 'ערשטע ציצית' }, tags: ['upsherin'], fonts: ['scribe', 'bold'], palettes: ['ivorygold', 'slateblue', 'navygold', 'creamnavy', 'whitesilver'] },
    { frame: 'upHoney', name: { en: 'Honey & Letters', yi: 'האניג און אותיות' }, tags: ['upsherin'], fonts: ['modern', 'bold'], palettes: ['ivorygold', 'tealsand', 'powderblue', 'creamnavy', 'whiteblue'] },
    { frame: 'chbDoor', name: { en: 'Doorway & Mezuzah', yi: 'טיר מיט מזוזה' }, tags: ['chanukashabayis'], fonts: ['classic', 'scribe'], palettes: ['ivorygold', 'navygold', 'tealsand', 'emeraldgold', 'creamburgundy', 'slateblue'] },
    { frame: 'chbKey', name: { en: 'Golden Key', yi: 'גאלדענער שליסל' }, tags: ['chanukashabayis'], fonts: ['classic', 'bold'], palettes: ['navygold', 'blackgold', 'ivorygold', 'emeraldgold', 'burgundygold'] },
    { frame: 'chbHouse', name: { en: 'Our New Home', yi: 'אונזער נייע היים' }, tags: ['chanukashabayis'], fonts: ['bold', 'modern'], palettes: ['midnight', 'navygold', 'ivorygold', 'tealsand', 'creamnavy'] },
    { frame: 'chbMezuzah', name: { en: 'Mezuzah', yi: 'מזוזה' }, tags: ['chanukashabayis'], fonts: ['scribe', 'classic'], palettes: ['ivorysage', 'ivorygold', 'navysilver', 'whitesilver', 'charcoalcopper'] },
    { frame: 'siyStack', name: { en: 'Stack of Seforim', yi: 'ספרים' }, tags: ['siyum'], fonts: ['classic', 'scribe'], palettes: ['ivorygold', 'navygold', 'burgundygold', 'creamburgundy', 'emeraldgold', 'blackgold'] },
    { frame: 'siyGemara', name: { en: 'Open Gemara', yi: 'אפענע גמרא' }, tags: ['siyum'], fonts: ['scribe', 'classic'], palettes: ['ivorygold', 'creamnavy', 'tealsand', 'navygold', 'whitesilver'] },
    { frame: 'siyQuill', name: { en: 'Quill & Scroll', yi: 'פעדער און מגילה' }, tags: ['siyum'], fonts: ['classic', 'soft'], palettes: ['navygold', 'ivorygold', 'emeraldgold', 'creamburgundy', 'charcoalcopper'] },
    { frame: 'bmTefillin', name: { en: 'Tefillin', yi: 'תפילין' }, tags: ['barmitzvah'], fonts: ['classic', 'bold'], palettes: ['ivorygold', 'navygold', 'whitesilver', 'creamnavy', 'tealsand'] },
    { frame: 'bmKotel', name: { en: 'The Kosel', yi: 'דער כותל' }, tags: ['barmitzvah'], fonts: ['bold', 'classic'], palettes: ['ivorygold', 'creamnavy', 'skywhite', 'navygold', 'whitesilver'] },
    { frame: 'bmRimonim', name: { en: 'Keser Torah', yi: 'כתר תורה' }, tags: ['barmitzvah', 'siyum'], fonts: ['classic', 'scribe'], palettes: ['navygold', 'blackgold', 'burgundygold', 'ivorygold', 'purplegold'] },
    { frame: 'kdBlossom', name: { en: 'Blossom Branch', yi: 'בליענדיגע צווייג' }, tags: ['kiddush'], fonts: ['soft', 'classic'], palettes: ['blushsilver', 'ivorysage', 'whitesilver', 'ivorygold', 'skywhite'] },
    { frame: 'kdLace', name: { en: 'Lace & Blossoms', yi: 'שפיץ מיט בלומען' }, tags: ['kiddush'], fonts: ['soft', 'modern'], palettes: ['blushsilver', 'ivorygold', 'whitesilver', 'ivorysage', 'tealsand'] },
    { frame: 'chChuppah', name: { en: 'Chuppah', yi: 'חופה' }, tags: ['chasuna'], fonts: ['classic', 'soft'], palettes: ['ivorygold', 'navygold', 'blushsilver', 'emeraldgold', 'whitesilver', 'creamburgundy'] },
    { frame: 'vtPlate', name: { en: 'Breaking the Plate', yi: 'צעבראכענע טעלער' }, tags: ['vort'], fonts: ['bold', 'classic'], palettes: ['ivorygold', 'navygold', 'creamburgundy', 'blushsilver', 'tealsand'] },
    { frame: 'sbSeven', name: { en: 'Seven Lights', yi: 'זיבן ליכט' }, tags: ['shevabrachos'], fonts: ['classic', 'soft'], palettes: ['midnight', 'navygold', 'burgundygold', 'purplegold', 'emeraldgold'] }
  ].forEach((f) => { f.xf = XF; FAMILIES.push(f); });
  // the boy-simcha layouts without a boy-only emblem suit the other family simchas too (the default wording still rotates through the boy ones)
  ['bKesuba', 'bDeco', 'bDamask', 'bJerusalem', 'bRimon', 'bModern', 'bTile'].forEach((k) => { const f = FAMILIES.find((x) => x.frame === k); if (!f) return;
    f.rotate = f.tags.slice(); f.tags = f.tags.concat(['upsherin', 'barmitzvah', 'chanukashabayis', 'siyum', 'general']); });
  ['bClouds', 'bLace'].forEach((k) => { const f = FAMILIES.find((x) => x.frame === k); if (f) { f.rotate = f.tags.slice(); f.tags = f.tags.concat(['upsherin']); } });
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
      const rot = Array.isArray(f.rotate) ? f.rotate : (f.rotate ? f.tags : null);
      const type = (p.prefer && f.tags.includes(p.prefer)) ? p.prefer : (rot ? rot[i % rot.length] : f.tags[0]);
      made.push({ round: i, d: Object.assign({
        id: f.frame + '-' + pk, type, also: f.tags.filter((t) => t !== type), isNew: true, family: f.frame, palette: pk, color: p.color, dark: !!p.dark,
        name: { en: f.name.en + ' · ' + p.name.en, yi: f.name.yi + ' · ' + p.name.yi },
        bg: p.bg, ink: p.ink, title: p.title, nm: p.nm, muted: p.muted, line: p.line, petals: p.petals, frame: f.frame, xf: f.xf
      }, fs) });
    }));
    // interleave families so the first screen of the gallery shows variety
    made.sort((a, b) => a.round - b.round);
    made.forEach((m) => DESIGNS.push(m.d));
  })();
  const FAMILY_NAMES = {}; FAMILIES.forEach((f) => { FAMILY_NAMES[f.frame] = f.name; });

  // ---- photo scenes (Oct 2026): a styled still-life photograph with a blank card in it; the invitation text is set live on the card.
  // r = the card's text area as fractions of the 5×7 picture [x, y, w, h]; o = 1 when the text sits on an open backdrop (wall, sky, arch).
  const SCENE_PAL = {"navy":{"ink":"#22314f","title":"#9a7330","nm":"#1b2a48","muted":"#5f6474","line":"#b08d4a","bg":["#f4efe6","#e9e1d2"]},"burg":{"ink":"#3a1f24","title":"#9a7330","nm":"#5a1424","muted":"#76655d","line":"#a8843f","bg":["#f4ede4","#e8dccd"]},"green":{"ink":"#1f3a30","title":"#9a7330","nm":"#183a2c","muted":"#5c685f","line":"#a8843f","bg":["#f2efe6","#e3e0d2"]},"blue":{"ink":"#23406a","title":"#2c5288","nm":"#1d3b66","muted":"#5a6b85","line":"#7f9cc4","bg":["#eef3f9","#dde7f3"]},"rose":{"ink":"#4a2e36","title":"#a5675b","nm":"#5b2a3a","muted":"#83686d","line":"#c49a8a","bg":["#f8eeee","#efdfdf"]},"dark":{"ink":"#f1e6cf","title":"#e2c47c","nm":"#fbf1dc","muted":"#cdbd9b","line":"#d6b46a","bg":["#1d2333","#2b3247"]},"brown":{"ink":"#3b2a1a","title":"#9a7330","nm":"#4a2e14","muted":"#76695a","line":"#a8843f","bg":["#f2ebdf","#e6dac6"]},"plum":{"ink":"#3c3150","title":"#8a6a3a","nm":"#3a2a52","muted":"#6d6578","line":"#a8843f","bg":["#f2eee9","#e2dcd6"]}};
  const SCENES = [{"k":"velvet","t":"chasuna","also":["vort","shevabrachos","general"],"c":"teal","p":"navy","f":"gold","fs":"classic","en":"Teal Velvet & Pearls","yi":"טערקיז סאמעט מיט פערל","o":0,"r":[0.171,0.155,0.658,0.667]},{"k":"navygold","t":"barmitzvah","also":["chasuna","vort","general"],"c":"navy","p":"dark","f":"lightgold","fs":"classic","en":"Royal Navy · Gold Frame","yi":"בלוי מיט גאלדענע ראם","o":1,"r":[0.225,0.074,0.667,0.688]},{"k":"sky","t":"bris","also":["vachnacht","shalomzachor","upsherin","pidyonhaben"],"c":"blue","p":"blue","f":"blue","fs":"bold","en":"Balloons in the Sky","yi":"באלאנען אין הימל","o":1,"r":[0.08,0.04,0.84,0.56]},{"k":"burgundy","t":"chasuna","also":["vort","shevabrachos","barmitzvah"],"c":"burgundy","p":"burg","f":"gold","fs":"classic","en":"Burgundy Velvet & Gold","yi":"בורגונדי סאמעט מיט גאלד","o":0,"r":[0.196,0.173,0.646,0.658]},{"k":"shalomzachor","t":"shalomzachor","also":["general"],"c":"cream","p":"brown","f":"gold","fs":"bold","en":"Shalom Zachor Table","yi":"שלום זכר טיש","o":0,"r":[0.167,0.208,0.667,0.589]},{"k":"marble","t":"chasuna","also":["vort","shevabrachos","general"],"c":"white","p":"navy","f":"gold","fs":"soft","en":"White Roses on Marble","yi":"ווייסע רויזן אויף מירמל","o":0,"r":[0.163,0.202,0.679,0.637]},{"k":"baroque","t":"barmitzvah","also":["chasuna","siyum","general"],"c":"navy","p":"brown","f":"gold","fs":"classic","en":"Gold Baroque Frame","yi":"גאלדענע באראקע ראם","o":1,"r":[0.146,0.191,0.708,0.598]},{"k":"vachnacht","t":"vachnacht","also":["bris","shalomzachor","upsherin"],"c":"blue","p":"blue","f":"blue","fs":"bold","en":"Teddy & Blue Blanket","yi":"בערל מיט בלויע דעקל","o":0,"r":[0.2,0.16,0.64,0.64]},{"k":"blush","t":"kiddush","also":["vort","chasuna","shevabrachos"],"c":"pink","p":"rose","f":"rose","fs":"soft","en":"Blush Silk & Roses","yi":"ראזע זייד מיט רויזן","o":0,"r":[0.15,0.164,0.692,0.67]},{"k":"barmitzvahblack","t":"barmitzvah","also":["siyum","general"],"c":"black","p":"dark","f":"lightgold","fs":"classic","en":"Black Velvet & Gold","yi":"שווארץ סאמעט מיט גאלד","o":0,"r":[0.167,0.164,0.667,0.661]},{"k":"frosted","t":"bris","also":["kiddush","vachnacht","pidyonhaben","general"],"c":"blue","p":"blue","f":"blue","fs":"soft","en":"Frosted Glass Arch","yi":"גלאז בויגן אין די וואלקנס","o":1,"r":[0.22,0.25,0.56,0.52]},{"k":"emerald","t":"chasuna","also":["general","siyum","chanukashabayis"],"c":"green","p":"green","f":"gold","fs":"classic","en":"Emerald Velvet","yi":"שמאראגד סאמעט","o":0,"r":[0.113,0.14,0.775,0.72]},{"k":"lace","t":"kiddush","also":["vort","chasuna","general"],"c":"cream","p":"green","f":"gold","fs":"soft","en":"Lace & Silk Bow","yi":"שפיץ מיט זייד","o":0,"r":[0.183,0.173,0.65,0.631]},{"k":"maroon","t":"barmitzvah","also":["chasuna","general"],"c":"burgundy","p":"dark","f":"lightgold","fs":"classic","en":"Maroon Columns","yi":"מארון מיט זיילן","o":1,"r":[0.2,0.07,0.6,0.66]},{"k":"kotel","t":"general","also":["siyum","barmitzvah","chanukashabayis","upsherin"],"c":"cream","p":"brown","f":"gold","fs":"scribe","en":"Jerusalem Stone Plaque","yi":"ירושלים שטיין טאוול","o":1,"r":[0.117,0.131,0.779,0.676]},{"k":"nursery","t":"vachnacht","also":["bris","shalomzachor"],"c":"blue","p":"blue","f":"blue","fs":"bold","en":"Nursery Corner","yi":"קינדער צימער","o":1,"r":[0.08,0.035,0.84,0.4]},{"k":"pidyon","t":"pidyonhaben","also":["bris","general"],"c":"navy","p":"navy","f":"silver","fs":"classic","en":"Silver Coins","yi":"זילבערנע מטבעות","o":0,"r":[0.146,0.176,0.708,0.655]},{"k":"navyrose","t":"chasuna","also":["vort","barmitzvah","general"],"c":"navy","p":"dark","f":"lightgold","fs":"classic","en":"Navy Card & White Rose","yi":"בלוי קארטל מיט ווייסע רויז","o":0,"r":[0.179,0.14,0.662,0.577]},{"k":"marblearch","t":"barmitzvah","also":["chasuna","siyum","general"],"c":"cream","p":"brown","f":"gold","fs":"classic","en":"Marble Arch","yi":"מירמל בויגן","o":1,"r":[0.25,0.28,0.5,0.5]},{"k":"kiddush","t":"kiddush","also":["general","shevabrachos"],"c":"white","p":"burg","f":"gold","fs":"soft","en":"Kiddush Wine & Roses","yi":"קידוש וויין מיט רויזן","o":0,"r":[0.208,0.188,0.588,0.592]},{"k":"icyarch","t":"chasuna","also":["vort","shevabrachos","bris"],"c":"blue","p":"navy","f":"silver","fs":"soft","en":"Icy Blue Arch & Candles","yi":"בלויער בויגן מיט ליכט","o":1,"r":[0.22,0.25,0.56,0.5]},{"k":"upsherin","t":"upsherin","also":["general"],"c":"white","p":"navy","f":"blue","fs":"bold","en":"Tzitzis & Yarmulka","yi":"ציצית מיט יארמלקע","o":0,"r":[0.171,0.158,0.654,0.628]},{"k":"keys","t":"chanukashabayis","also":["general"],"c":"white","p":"green","f":"gold","fs":"classic","en":"Keys & Olive Branch","yi":"שליסלען מיט אליוו צווייג","o":0,"r":[0.17,0.2,0.66,0.6]},{"k":"siyum","t":"siyum","also":["barmitzvah","general"],"c":"green","p":"green","f":"gold","fs":"scribe","en":"Stack of Seforim","yi":"ספרים","o":0,"r":[0.167,0.196,0.667,0.625]},{"k":"peony","t":"chasuna","also":["vort","shevabrachos","kiddush"],"c":"cream","p":"rose","f":"rose","fs":"soft","en":"Champagne Peonies","yi":"שאמפאן מיט בלומען","o":0,"r":[0.133,0.152,0.717,0.684]},{"k":"vort","t":"vort","also":["chasuna","shevabrachos"],"c":"black","p":"navy","f":"gold","fs":"classic","en":"Black Marble & Orchids","yi":"שווארצער מירמל מיט ארכידעען","o":0,"r":[0.221,0.179,0.608,0.619]},{"k":"navyseal","t":"chasuna","also":["vort","barmitzvah","general"],"c":"navy","p":"navy","f":"gold","fs":"classic","en":"Navy Linen & Gold Seal","yi":"בלוי מיט גאלדענעם זיגל","o":0,"r":[0.133,0.152,0.725,0.681]},{"k":"briscream","t":"bris","also":["vachnacht","shalomzachor","pidyonhaben"],"c":"cream","p":"blue","f":"blue","fs":"soft","en":"Wicker Bassinet","yi":"וויגל","o":0,"r":[0.175,0.202,0.642,0.604]},{"k":"hydrangea","t":"bris","also":["shalomzachor","vachnacht","vort","kiddush"],"c":"blue","p":"blue","f":"blue","fs":"soft","en":"Hydrangea Blue","yi":"בלויע בלומען","o":0,"r":[0.15,0.149,0.696,0.625]},{"k":"sculpted","t":"chasuna","also":["vort","kiddush","shevabrachos"],"c":"cream","p":"brown","f":"gold","fs":"soft","en":"Cream Sculpted Roses","yi":"קרעם רויזן","o":0,"r":[0.138,0.173,0.725,0.676]},{"k":"barmitzvahwood","t":"barmitzvah","also":["siyum","general"],"c":"cream","p":"brown","f":"gold","fs":"classic","en":"Seforim & Silver Becher","yi":"ספרים מיט זילבערנעם בעכער","o":0,"r":[0.167,0.179,0.667,0.646]},{"k":"easel","t":"general","also":["chasuna","vort","kiddush"],"c":"white","p":"brown","f":"gold","fs":"soft","en":"Sunlit Easel","yi":"גאלדענע ראם אין זון","o":1,"r":[0.196,0.152,0.617,0.491]},{"k":"kosel","t":"general","also":["siyum","chanukashabayis","barmitzvah","upsherin"],"c":"cream","p":"brown","f":"gold","fs":"scribe","en":"Yerushalayim Stone","yi":"ירושלים שטיין","o":0,"r":[0.192,0.143,0.679,0.711]},{"k":"linen","t":"general","also":["chasuna","vort","kiddush"],"c":"cream","p":"brown","f":"gold","fs":"classic","en":"Linen & Gold Tassel","yi":"לייוונט מיט גאלד","o":0,"r":[0.154,0.161,0.692,0.702]},{"k":"olive","t":"general","also":["chanukashabayis","siyum","kiddush"],"c":"cream","p":"green","f":"gold","fs":"scribe","en":"Olive Branch","yi":"אליוו צווייג","o":0,"r":[0.158,0.158,0.713,0.702]},{"k":"lavender","t":"general","also":["kiddush","chanukashabayis"],"c":"purple","p":"plum","f":"gold","fs":"scribe","en":"Lavender on Slate","yi":"לאוואנדע אויף שיפער","o":0,"r":[0.15,0.15,0.7,0.69]},{"k":"studio","t":"general","also":["chanukashabayis","vort","kiddush"],"c":"cream","p":"brown","f":"gold","fs":"scribe","en":"Beige Studio & Olive","yi":"בעזש מיט אליוו","o":1,"r":[0.07,0.05,0.56,0.56]}];
  SCENES.forEach((s) => {
    const p = SCENE_PAL[s.p], fs = FONTSETS[s.fs] || FONTSETS.classic;
    DESIGNS.push({ id: 'scene-' + s.k, type: s.t, also: s.also, isNew: true, isScene: true, family: 'scene', scene: s, color: s.c, dark: s.p === 'dark',
      name: { en: s.en, yi: s.yi }, bg: p.bg, ink: p.ink, title: p.title, nm: p.nm, muted: p.muted, line: p.line, foil: s.f,
      fy: fs.fy, fe: fs.fe, by: fs.by, be: fs.be, frame: 'scene' });
  });
  const SCENES_V2 = [{"k": "babyrattle", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "blue", "p": "navy", "f": "silver", "fs": "soft", "en": "Silver Rattle on Blue Blanket", "yi": "זילבערנע קלאפער אויף בלויע דעקל", "o": 0, "r": [0.252, 0.238, 0.505, 0.536]}, {"k": "babybottle", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "blue", "p": "blue", "f": "blue", "fs": "soft", "en": "Bottle & Knit Hat", "yi": "פלעשל מיט געשטריקט היטל", "o": 0, "r": [0.204, 0.198, 0.591, 0.634]}, {"k": "bluballoons", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "blue", "p": "blue", "f": "blue", "fs": "soft", "en": "Blue & White Balloons", "yi": "בלויע און ווייסע באלאנען", "o": 0, "r": [0.228, 0.337, 0.567, 0.524]}, {"k": "swaddle", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "white", "p": "navy", "f": "blue", "fs": "soft", "en": "Swaddle & Little Kippah", "yi": "וויקל מיט קליין יארמלקע", "o": 0, "r": [0.245, 0.209, 0.51, 0.568]}, {"k": "navyvelvet", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben", "general"], "c": "navy", "p": "navy", "f": "gold", "fs": "classic", "en": "Navy Velvet & Ivory Arch", "yi": "בלויער סאמעט מיט עלפנביין בויגן", "o": 0, "r": [0.215, 0.25, 0.57, 0.565]}, {"k": "babyblue", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "blue", "p": "blue", "f": "blue", "fs": "soft", "en": "Baby Blue Scallop & Hydrangea", "yi": "בלויע בלומען מיט וועלןראנד", "o": 0, "r": [0.225, 0.205, 0.55, 0.59]}, {"k": "navycard", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben", "barmitzvah", "general"], "c": "navy", "p": "dark", "f": "lightgold", "fs": "classic", "en": "Navy Card & Gold Seal", "yi": "בלויער קארטל מיט גאלדענעם זיגל", "o": 0, "r": [0.25, 0.213, 0.5, 0.574]}, {"k": "pearlsblue", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben"], "c": "blue", "p": "blue", "f": "silver", "fs": "soft", "en": "Pearls & Blue Satin", "yi": "פערל מיט בלויע בלומען", "o": 0, "r": [0.204, 0.185, 0.592, 0.617]}, {"k": "archmarble", "t": "shalomzachor", "also": ["bris", "vachnacht", "pidyonhaben", "general"], "c": "white", "p": "navy", "f": "silver", "fs": "classic", "en": "White Arch on Marble", "yi": "ווייסער בויגן אויף מירמל", "o": 0, "r": [0.215, 0.27, 0.57, 0.566]}, {"k": "goldframe", "t": "bris", "also": ["vachnacht", "shalomzachor", "pidyonhaben", "barmitzvah", "general"], "c": "navy", "p": "navy", "f": "gold", "fs": "classic", "en": "Gold Frame on Navy", "yi": "גאלדענע ראם אויף בלוי", "o": 0, "r": [0.231, 0.226, 0.542, 0.599]}, {"k": "chasunaivory", "t": "chasuna", "also": ["vort", "shevabrachos", "kiddush"], "c": "pink", "p": "navy", "f": "gold", "fs": "classic", "en": "Ivory & Peonies", "yi": "עלפנביין מיט פיוניעס", "o": 0, "r": [0.215, 0.231, 0.57, 0.538]}, {"k": "blackgold", "t": "barmitzvah", "also": ["chasuna", "vort", "siyum", "general"], "c": "black", "p": "dark", "f": "lightgold", "fs": "classic", "en": "Black Marble & Gold", "yi": "שווארצער מירמל מיט גאלד", "o": 0, "r": [0.226, 0.186, 0.556, 0.631]}, {"k": "burgundyseal", "t": "chasuna", "also": ["barmitzvah", "vort", "shevabrachos", "general"], "c": "burgundy", "p": "burg", "f": "gold", "fs": "classic", "en": "Burgundy Ribbon & Seal", "yi": "בורגונדי באנד מיט זיגל", "o": 0, "r": [0.201, 0.194, 0.596, 0.576]}, {"k": "greenlinen", "t": "chanukashabayis", "also": ["general", "siyum", "kiddush"], "c": "green", "p": "green", "f": "gold", "fs": "classic", "en": "Sage Linen & Olive", "yi": "גרינער לייוונט מיט אליוו צווייג", "o": 0, "r": [0.215, 0.195, 0.57, 0.609]}, {"k": "seforim", "t": "siyum", "also": ["barmitzvah", "general"], "c": "cream", "p": "brown", "f": "gold", "fs": "classic", "en": "Before the Seforim Shelf", "yi": "פאר דער ספרים שאנק", "o": 0, "r": [0.22, 0.193, 0.56, 0.614]}, {"k": "blushkiddush", "t": "kiddush", "also": ["vort", "shevabrachos", "chasuna"], "c": "pink", "p": "rose", "f": "gold", "fs": "soft", "en": "Blush & Rose Gold", "yi": "ראזע מיט ראזגאלד", "o": 0, "r": [0.21, 0.177, 0.58, 0.647]}, {"k": "rusticwood", "t": "upsherin", "also": ["chanukashabayis", "general"], "c": "cream", "p": "brown", "f": "gold", "fs": "classic", "en": "Wheat on Warm Wood", "yi": "ווייץ אויף האלץ", "o": 0, "r": [0.2, 0.199, 0.592, 0.604]}, {"k": "whitemodern", "t": "general", "also": ["chasuna", "vort", "barmitzvah", "bris", "kiddush", "chanukashabayis"], "c": "white", "p": "navy", "f": "gold", "fs": "classic", "en": "Modern White & Gold Line", "yi": "ווייס מיט א גאלדענער ליניע", "o": 0, "r": [0.215, 0.209, 0.571, 0.591]}];
  SCENES_V2.forEach((s) => {
    const p = SCENE_PAL[s.p] || SCENE_PAL.navy, fs = FONTSETS[s.fs] || FONTSETS.classic;
    DESIGNS.push({ id: 'scene-' + s.k, type: s.t, also: s.also || [], isNew: true, isV2: true, isScene: true, family: 'scene', scene: s, color: s.c, dark: s.p === 'dark',
      name: { en: s.en, yi: s.yi }, bg: p.bg, ink: p.ink, title: p.title, nm: p.nm, muted: p.muted, line: p.line, foil: s.f,
      fy: fs.fy, fe: fs.fe, by: fs.by, be: fs.be, frame: 'scene' });
  });
  FAMILY_NAMES.scene = { en: 'Photo scene', yi: 'פאטא סצענע' };
  const sceneImgs = {};
  function sceneSrc(key, small) { return 'images/inv-scenes/' + key + (small ? '-s' : '') + '.webp'; }
  function loadScene(key, small) {
    const id = key + (small ? '-s' : '');
    if (!sceneImgs[id]) {
      sceneImgs[id] = new Promise((res) => {
        const im = new Image(); im.decoding = 'async';
        im.onload = () => res(im);
        im.onerror = () => { delete sceneImgs[id]; res(null); };
        im.src = sceneSrc(key, small);
      });
    }
    return sceneImgs[id];
  }
  // metallic foil for scene titles: [colour, stop, …] top-to-bottom across one line of type
  const FOIL = {
    gold: ['#6f4e14', 0, '#b88c38', 0.3, '#ecd38a', 0.48, '#c79a45', 0.62, '#7a5718', 1],
    lightgold: ['#b08537', 0, '#efd690', 0.4, '#fff3cc', 0.52, '#d9b366', 0.68, '#a07730', 1],
    rose: ['#874a40', 0, '#c98a7b', 0.35, '#f1cbbd', 0.5, '#b97a6b', 0.66, '#7a3f35', 1],
    blue: ['#1c3a6b', 0, '#3f6aa8', 0.35, '#8db0e0', 0.5, '#3b64a2', 0.66, '#1a3564', 1],
    silver: ['#4d5463', 0, '#9aa3b1', 0.35, '#f2f4f7', 0.5, '#8c95a3', 0.66, '#454c5a', 1],
    deepgold: ['#5a3f0e', 0, '#94702c', 0.3, '#c9a24f', 0.48, '#a07a31', 0.62, '#5e430f', 1]
  };

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
    const specs = [design.fy, design.fe, design.by, design.be].concat(design.xf || []);
    const loads = specs.map(([fam, wt]) => (document.fonts && document.fonts.load)
      ? document.fonts.load(wt + ' 40px "' + fam + '"', 'אבג Abc').catch(() => null) : Promise.resolve());
    if (document.fonts && document.fonts.load) {
      loads.push(document.fonts.load('italic 500 40px "Cormorant Garamond"', 'Abc').catch(() => null));
      if (design.be) loads.push(document.fonts.load('italic ' + design.be[1] + ' 40px "' + design.be[0] + '"', 'Abc').catch(() => null));
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
  FRAMES.scene = function (ctx, d, data, img) {
    const s = d.scene;
    if (img) {
      const r = Math.max(W / img.naturalWidth, H / img.naturalHeight), iw = img.naturalWidth * r, ih = img.naturalHeight * r;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } else bgFill(ctx, d, 'radial');
    const x = s.r[0] * W, y = s.r[1] * H, w = s.r[2] * W, h = s.r[3] * H;
    if (s.o) { // open backdrop: a soft veil behind the type keeps it legible on texture
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, x + w / 2, y + h / 2, Math.max(w, h) * 0.62);
      const c = d.dark ? '10,8,6' : '255,253,248';
      g.addColorStop(0, 'rgba(' + c + ',' + (d.dark ? 0.28 : 0.42) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - w * 0.1, y - h * 0.08, w * 1.2, h * 1.16);
    }
    const ix = s.o ? 0.05 : 0.1, iy = s.o ? 0.035 : 0.07;
    const top = y + h * iy;
    return { x: x + w * ix, y: top + 46, w: w * (1 - 2 * ix), h: h * (1 - 2 * iy) - 46, bsd: [x + w * (1 - ix) - 34, top + 12], div: 'flourish' };
  };

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
    const v2 = !!d.isV2;
    let ttl = titleText(data);
    if (yi && (d.stack || v2) && !data.ti) { const ws = String(ttl).trim().split(/\s+/); if (ws.length === 2 || ws.length === 3) ttl = ws.length === 2 ? ws.join('\n') : ws[0] + '\n' + ws[1] + ' ' + ws[2]; }
    const tsz = yi ? (v2 ? 230 : (d.isScene ? 215 : 172)) : (v2 ? 160 : (d.isScene ? 132 : 118)) * (d.escale || 1);
    t(ttl, disp, tsz, d.title, 22, { lh: yi ? 1.0 : 1.08, track: yi ? 0 : (d.etrack !== undefined ? d.etrack : 6), foil: d.foil, dark: d.dark });
    B.push({ kind: 'div', h: 56, gap: 22 });
    t(data.w || w.invite, body, d.isV2 ? 50 : 46, d.ink, 44, { maxW: Math.min(maxW, 1000), lh: 1.42 });
    if (data.p) {
      t(w.p, body, 36, d.muted, 4, { italic: !yi });
      t(data.p, disp, yi ? 118 : 94, d.nm, type.two ? 14 : 40, { lh: 1.12 });
    }
    if (type.two && data.s) {
      if (data.p) t(w.c, body, yi ? 44 : 56, d.title, 14, { italic: !yi });
      t(w.s, body, 36, d.muted, 4, { italic: !yi });
      t(data.s, disp, yi ? 118 : 94, d.nm, 40, { lh: 1.12 });
    }
    B.push({ kind: 'div', h: 56, gap: 30 });
    const hd = data.hd || (hebrewParts(data.dt) || {})[lang];
    t(dayLine(data, lang), body, 44, d.ink, 10);
    t(hd, SCRIPT_FONTS[disp[0]] ? [body[0], 600] : disp, yi ? 72 : 62, d.title, 8, { track: 0 });
    if (data.dt) t(civilLong(data.dt, yi ? 'yi' : 'en'), body, 36, d.muted, 18);
    t(timeLabel(data.tm, lang), body, 46, d.ink, 30, { weight: 700 });
    const plain = SCRIPT_FONTS[disp[0]] ? [body[0], 600] : disp;
    t(data.v, plain, yi ? 64 : 56, d.nm, 8, { lh: 1.15 });
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
    if (total < box.h * 0.8) { s = Math.min(d.isScene ? 1.3 : (d.isV2 ? 1.45 : 1.2), (box.h * (d.isV2 ? 0.93 : 0.86)) / total); total = measure(ctx, B, s); }
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
        b._lines.forEach((l, i) => {
          ctx.direction = dirOf(l);
          const ly = y + b._lh * (i + 0.5);
          if (b.foil && FOIL[b.foil]) { // foil-stamped title: metallic gradient + a pressed-in shadow
            const st = FOIL[b.foil], g = ctx.createLinearGradient(0, ly - b._fs * 0.55, 0, ly + b._fs * 0.45);
            for (let k = 0; k < st.length; k += 2) g.addColorStop(st[k + 1], st[k]);
            ctx.save();
            ctx.shadowColor = b.dark ? 'rgba(0,0,0,0.55)' : 'rgba(70,50,20,0.30)'; ctx.shadowBlur = b._fs * 0.05; ctx.shadowOffsetY = b._fs * 0.025;
            ctx.fillStyle = g; ctx.fillText(l, cx, ly);
            ctx.restore();
          } else ctx.fillText(l, cx, ly);
        });
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      }
      y += b._h + b.gap * s;
    });
  }

  // ================================================================ boy-simcha designs (Nov 2026)
  // Bris · Vach Nacht · Shalom Zachor · Pidyon Haben. Styles researched as ideas only; every ornament here is drawn in code.
  const TAU = Math.PI * 2;
  function glowAt(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, hexA(color, a)); g.addColorStop(1, hexA(color, 0));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function bgGrad(ctx, d) { const g = ctx.createLinearGradient(0, 0, W * 0.3, H); g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]); return g; }
  function softOf(d, a) { return hexA(d.line, a); }
  function flame(ctx, x, y, s, d) {
    glowAt(ctx, x, y - s * 0.6, s * 3.4, '#ffd27a', d.dark ? 0.42 : 0.26);
    ctx.save();
    const g = ctx.createLinearGradient(x, y - s * 1.7, x, y); g.addColorStop(0, '#fff7da'); g.addColorStop(0.45, '#ffd062'); g.addColorStop(1, '#e5832a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - s * 1.75);
    ctx.bezierCurveTo(x + s * 0.6, y - s * 0.95, x + s * 0.52, y - s * 0.05, x, y);
    ctx.bezierCurveTo(x - s * 0.52, y - s * 0.05, x - s * 0.6, y - s * 0.95, x, y - s * 1.75); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.42, s * 0.14, s * 0.3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function candle(ctx, x, by, h, w, d) {
    ctx.save();
    const c = d.dark ? '#f3ead6' : '#fffaf0';
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, mix(c, '#7a6a55', 0.25)); g.addColorStop(0.42, c); g.addColorStop(1, mix(c, '#7a6a55', 0.35));
    ctx.fillStyle = g; ctx.strokeStyle = hexA(d.line, 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); roundRectPath(ctx, x - w / 2, by - h, w, h, Math.min(6, w * 0.2)); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3b2c20'; ctx.lineWidth = Math.max(2, w * 0.08); ctx.beginPath(); ctx.moveTo(x, by - h); ctx.lineTo(x, by - h - w * 0.35); ctx.stroke();
    ctx.restore();
    flame(ctx, x, by - h - w * 0.2, w * 0.8, d);
  }
  // an ornate candlestick of height s, foot at (x, by); returns the y of the cup top
  function candlestick(ctx, x, by, s, d) {
    ctx.save(); ctx.fillStyle = metal(ctx, d.line, x - s * 0.3, 0, x + s * 0.3, 0);
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, by); ctx.quadraticCurveTo(x - s * 0.06, by - s * 0.04, x - s * 0.05, by - s * 0.2); ctx.lineTo(x + s * 0.05, by - s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.06, by - s * 0.04, x + s * 0.3, by); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, by, s * 0.3, s * 0.045, 0, 0, TAU); ctx.fill();
    ctx.fillRect(x - s * 0.035, by - s * 0.86, s * 0.07, s * 0.68);
    [0.3, 0.52, 0.74].forEach((t, i) => { ctx.beginPath(); ctx.ellipse(x, by - s * t, s * (i === 1 ? 0.1 : 0.075), s * 0.04, 0, 0, TAU); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(x - s * 0.17, by - s); ctx.lineTo(x + s * 0.17, by - s); ctx.lineTo(x + s * 0.07, by - s * 0.86); ctx.lineTo(x - s * 0.07, by - s * 0.86); ctx.closePath(); ctx.fill();
    ctx.restore();
    return by - s;
  }
  function kosCup(ctx, x, by, s, d) {
    ctx.save(); ctx.fillStyle = metal(ctx, d.line, x - s * 0.3, 0, x + s * 0.3, 0);
    ctx.beginPath(); ctx.ellipse(x, by, s * 0.24, s * 0.05, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - s * 0.22, by); ctx.quadraticCurveTo(x - s * 0.04, by - s * 0.06, x - s * 0.04, by - s * 0.3); ctx.lineTo(x + s * 0.04, by - s * 0.3); ctx.quadraticCurveTo(x + s * 0.04, by - s * 0.06, x + s * 0.22, by); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, by - s * 0.32, s * 0.08, s * 0.035, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, by - s); ctx.bezierCurveTo(x - s * 0.3, by - s * 0.55, x - s * 0.12, by - s * 0.36, x, by - s * 0.36);
    ctx.bezierCurveTo(x + s * 0.12, by - s * 0.36, x + s * 0.3, by - s * 0.55, x + s * 0.3, by - s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = d.dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.45)'; magenFill(ctx, x, by - s * 0.68, s * 0.12);
    ctx.restore();
  }
  // Kisei shel Eliyahu: a high-backed carved chair, s tall, feet at by
  function kisei(ctx, cx, by, s, d) {
    const c = d.line, w = s * 0.62, seatY = by - s * 0.4, topY = by - s;
    ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = hexA(c, d.dark ? 0.16 : 0.12); ctx.lineWidth = Math.max(2.4, s * 0.012); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bx = w * 0.4;
    ctx.beginPath(); ctx.moveTo(cx - bx, seatY); ctx.lineTo(cx - bx, topY + s * 0.2);
    ctx.quadraticCurveTo(cx - bx, topY + s * 0.07, cx - bx * 0.55, topY + s * 0.08);
    ctx.quadraticCurveTo(cx, topY - s * 0.04, cx + bx * 0.55, topY + s * 0.08);
    ctx.quadraticCurveTo(cx + bx, topY + s * 0.07, cx + bx, topY + s * 0.2); ctx.lineTo(cx + bx, seatY); ctx.closePath(); ctx.fill(); ctx.stroke();
    // carved inner panel with a star
    ctx.beginPath(); roundRectPath(ctx, cx - bx * 0.68, topY + s * 0.16, bx * 1.36, s * 0.34, s * 0.04); ctx.stroke();
    magen(ctx, cx, topY + s * 0.33, s * 0.08, c, Math.max(2, s * 0.008));
    // finials
    ctx.fillStyle = c;
    [[cx - bx, topY + s * 0.16], [cx + bx, topY + s * 0.16]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y - s * 0.035, s * 0.028, 0, TAU); ctx.fill(); });
    // arms with scrolled ends
    [-1, 1].forEach((sd) => {
      ctx.beginPath(); ctx.moveTo(cx + sd * bx, seatY - s * 0.2);
      ctx.quadraticCurveTo(cx + sd * w * 0.62, seatY - s * 0.24, cx + sd * w * 0.62, seatY - s * 0.13); ctx.stroke();
      ctx.beginPath(); spiral(ctx, cx + sd * w * 0.6, seatY - s * 0.1, s * 0.035, 1, sd > 0 ? Math.PI : 0, sd); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + sd * w * 0.58, seatY - s * 0.08); ctx.lineTo(cx + sd * w * 0.56, seatY); ctx.stroke();
    });
    // seat (cushioned)
    ctx.fillStyle = hexA(c, d.dark ? 0.28 : 0.2);
    ctx.beginPath(); ctx.moveTo(cx - w * 0.62, seatY); ctx.quadraticCurveTo(cx, seatY - s * 0.05, cx + w * 0.62, seatY); ctx.lineTo(cx + w * 0.55, seatY + s * 0.07); ctx.lineTo(cx - w * 0.55, seatY + s * 0.07); ctx.closePath(); ctx.fill(); ctx.stroke();
    // apron scallop
    ctx.beginPath(); ctx.moveTo(cx - w * 0.5, seatY + s * 0.07);
    for (let i = 0; i < 4; i++) { const x0 = cx - w * 0.5 + i * w * 0.25; ctx.quadraticCurveTo(x0 + w * 0.125, seatY + s * 0.15, x0 + w * 0.25, seatY + s * 0.07); }
    ctx.stroke();
    // legs (gently curved) + stretcher
    [-1, 1].forEach((sd) => {
      const x = cx + sd * w * 0.48;
      ctx.beginPath(); ctx.moveTo(x, seatY + s * 0.07); ctx.quadraticCurveTo(x + sd * s * 0.05, by - s * 0.18, x + sd * s * 0.015, by); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + sd * s * 0.015, by, s * 0.03, s * 0.012, 0, 0, TAU); ctx.fill();
    });
    ctx.beginPath(); ctx.moveTo(cx - w * 0.44, by - s * 0.12); ctx.lineTo(cx + w * 0.44, by - s * 0.12); ctx.stroke();
    ctx.restore();
  }
  function coin(ctx, x, y, r, d, i) {
    const base = d.coin || d.line;
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, mix(base, '#ffffff', 0.7)); g.addColorStop(0.55, mix(base, '#ffffff', 0.2)); g.addColorStop(1, mix(base, '#000000', 0.35));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = mix(base, '#000000', 0.4); ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, TAU); ctx.stroke();
    // little dotted rim
    ctx.fillStyle = mix(base, '#000000', 0.35);
    for (let k = 0; k < 24; k++) { const a = k * TAU / 24; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.025, 0, TAU); ctx.fill(); }
    if (i % 2) { ctx.save(); ctx.globalAlpha = 0.75; magen(ctx, x, y, r * 0.42, mix(base, '#000000', 0.45), Math.max(1.5, r * 0.06)); ctx.restore(); }
    else rimon(ctx, x, y + r * 0.08, r * 0.36, mix(base, '#000000', 0.45), false);
    ctx.restore();
  }
  function coinArc(ctx, cx, cy, r, d) {
    for (let i = 0; i < 5; i++) { const k = i - 2; coin(ctx, cx + k * r * 2.3, cy + Math.abs(k) * Math.abs(k) * r * 0.22, r, d, i); }
  }
  // a pomegranate, r = body radius
  function rimon(ctx, x, y, r, color, filled) {
    ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1.6, r * 0.09); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.28, y - r * 0.92);
    ctx.bezierCurveTo(x - r * 1.2, y - r * 0.75, x - r * 1.15, y + r, x, y + r);
    ctx.bezierCurveTo(x + r * 1.15, y + r, x + r * 1.2, y - r * 0.75, x + r * 0.28, y - r * 0.92); ctx.closePath();
    if (filled) { ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; } else ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.9); ctx.lineTo(x - r * 0.42, y - r * 1.35); ctx.lineTo(x - r * 0.14, y - r * 1.08); ctx.lineTo(x, y - r * 1.42);
    ctx.lineTo(x + r * 0.14, y - r * 1.08); ctx.lineTo(x + r * 0.42, y - r * 1.35); ctx.lineTo(x + r * 0.3, y - r * 0.9); filled ? ctx.fill() : ctx.stroke();
    ctx.restore();
  }
  // an open Torah scroll on its two rollers
  function torahScroll(ctx, cx, cy, w, h, d) {
    const c = d.line;
    ctx.save(); ctx.lineJoin = 'round';
    const parch = d.dark ? '#f6ecd4' : mix(d.bg[0], '#f1e2bd', 0.55);
    ctx.fillStyle = parch; ctx.strokeStyle = hexA(c, 0.9); ctx.lineWidth = 2;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h); ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
    ctx.strokeStyle = 'rgba(60,45,30,0.55)'; ctx.lineWidth = Math.max(1.2, h * 0.012);
    [-1, 1].forEach((sd) => { const x0 = cx + sd * w * 0.25; for (let k = 0; k < 9; k++) { const y = cy - h * 0.36 + k * h * 0.09; const ww = w * (k === 4 ? 0.2 : 0.36); ctx.beginPath(); ctx.moveTo(x0 - ww / 2, y); ctx.lineTo(x0 + ww / 2, y); ctx.stroke(); } });
    [-1, 1].forEach((sd) => {
      const x = cx + sd * (w / 2 + w * 0.06);
      ctx.fillStyle = metal(ctx, c, x - w * 0.05, 0, x + w * 0.05, 0);
      ctx.fillRect(x - w * 0.022, cy - h / 2 - h * 0.32, w * 0.044, h * 1.64);
      const g = ctx.createLinearGradient(x - w * 0.07, 0, x + w * 0.07, 0); g.addColorStop(0, mix(parch, '#6b5a40', 0.4)); g.addColorStop(0.5, parch); g.addColorStop(1, mix(parch, '#6b5a40', 0.45));
      ctx.fillStyle = g; ctx.beginPath(); roundRectPath(ctx, x - w * 0.07, cy - h / 2 - h * 0.04, w * 0.14, h * 1.08, w * 0.05); ctx.fill(); ctx.strokeStyle = hexA(c, 0.8); ctx.stroke();
      ctx.fillStyle = metal(ctx, c, x - w * 0.08, 0, x + w * 0.08, 0);
      [cy - h / 2 - h * 0.1, cy + h / 2 + h * 0.1].forEach((y) => { ctx.beginPath(); ctx.ellipse(x, y, w * 0.085, h * 0.03, 0, 0, TAU); ctx.fill(); });
      ctx.beginPath(); ctx.arc(x, cy - h / 2 - h * 0.34, w * 0.032, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x, cy + h / 2 + h * 0.33, w * 0.03, 0, TAU); ctx.fill();
    });
    ctx.restore();
  }
  // a hanging lantern (oil lamp) with a flame; hook at (cx, top), s tall
  function lantern(ctx, cx, top, s, d) {
    const c = d.line;
    ctx.save(); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = Math.max(2, s * 0.012); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, top + s * 0.18); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, top + s * 0.2, s * 0.025, 0, TAU); ctx.stroke();
    const y0 = top + s * 0.24, y1 = y0 + s * 0.12, y2 = y1 + s * 0.42, y3 = y2 + s * 0.12;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.06, y0); ctx.lineTo(cx + s * 0.06, y0); ctx.lineTo(cx + s * 0.2, y1); ctx.lineTo(cx - s * 0.2, y1); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.fillStyle = hexA('#ffd98a', d.dark ? 0.22 : 0.18);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.18, y1); ctx.lineTo(cx + s * 0.18, y1); ctx.lineTo(cx + s * 0.15, y2); ctx.lineTo(cx - s * 0.15, y2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    [-0.06, 0.06].forEach((o) => { ctx.beginPath(); ctx.moveTo(cx + o * s, y1); ctx.lineTo(cx + o * s * 0.85, y2); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(cx - s * 0.15, y2); ctx.lineTo(cx + s * 0.15, y2); ctx.lineTo(cx + s * 0.05, y3); ctx.lineTo(cx - s * 0.05, y3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, y3 + s * 0.025, s * 0.025, 0, TAU); ctx.fill();
    ctx.restore();
    flame(ctx, cx, y2 - s * 0.06, s * 0.08, d);
  }
  function dove(ctx, x, y, s, dir, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * s / 100, s / 100); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(60, -8); ctx.quadraticCurveTo(70, -22, 82, -14); ctx.lineTo(94, -10); ctx.lineTo(82, -6);
    ctx.quadraticCurveTo(76, 18, 40, 22); ctx.lineTo(-30, 30); ctx.lineTo(-58, 46); ctx.lineTo(-48, 24); ctx.lineTo(-62, 20); ctx.quadraticCurveTo(-10, 10, 20, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(30, 2); ctx.quadraticCurveTo(0, -40, -40, -62); ctx.quadraticCurveTo(-6, -58, 22, -30); ctx.quadraticCurveTo(40, -14, 46, 0); ctx.closePath(); ctx.globalAlpha = 0.85; ctx.fill();
    ctx.restore();
  }
  function laurel(ctx, cx, cy, r, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.02);
    [-1, 1].forEach((sd) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI / 2 + sd * 0.35, Math.PI / 2 + sd * 2.45, sd < 0); ctx.stroke();
      for (let k = 0; k < 9; k++) {
        const a = Math.PI / 2 + sd * (0.5 + k * 0.23), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        const tang = a + sd * Math.PI / 2;
        leaf(ctx, x, y, r * 0.3, tang - sd * 0.6, color, true); leaf(ctx, x, y, r * 0.26, tang + sd * 0.55 + Math.PI, color, true);
      }
    });
    ctx.restore();
  }
  // a bowl of arbes (chickpeas)
  function arbesBowl(ctx, cx, by, s, d) {
    const c = d.line;
    ctx.save();
    const pea = d.dark ? '#e9cf98' : '#e6c98e', r = rng(91);
    for (let i = 0; i < 60; i++) {
      const t = r(), u = r(); const x = cx + (t - 0.5) * s * 0.9 * (1 - u * 0.5), y = by - s * 0.42 - u * s * 0.2 * (1 - Math.abs(t - 0.5) * 1.6);
      ctx.fillStyle = pea; ctx.strokeStyle = 'rgba(120,90,40,0.6)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(x, y, s * 0.035, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = metal(ctx, c, cx - s * 0.5, 0, cx + s * 0.5, 0);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.5, by - s * 0.42); ctx.quadraticCurveTo(cx - s * 0.46, by - s * 0.08, cx - s * 0.16, by - s * 0.06);
    ctx.lineTo(cx + s * 0.16, by - s * 0.06); ctx.quadraticCurveTo(cx + s * 0.46, by - s * 0.08, cx + s * 0.5, by - s * 0.42); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - s * 0.18, by - s * 0.07, s * 0.36, s * 0.07);
    ctx.fillStyle = d.dark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.4)';
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(cx + k * s * 0.15, by - s * 0.25, s * 0.025, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // a band of repeated ornaments between two ruled lines at insets a (outer) and b (inner)
  function motifAt(ctx, motif, x, y, s, horiz, i, d) {
    ctx.save(); ctx.translate(x, y); if (!horiz) ctx.rotate(Math.PI / 2);
    if (motif === 'zigzag') { ctx.beginPath(); ctx.moveTo(-s * 1.1, -s * 0.45); ctx.lineTo(0, s * 0.45); ctx.lineTo(s * 1.1, -s * 0.45); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -s * 0.3, s * 0.12, 0, TAU); ctx.fill(); }
    else if (motif === 'magen') { magen(ctx, 0, 0, s * 0.72, d.line, Math.max(1.6, s * 0.08)); }
    else if (motif === 'quatre') { rosette(ctx, 0, 0, s * 0.62, 4, d.line, i % 2 === 0); }
    else if (motif === 'wave') { ctx.beginPath(); ctx.moveTo(-s * 1.1, 0); ctx.bezierCurveTo(-s * 0.55, -s * 0.9, s * 0.55, s * 0.9, s * 1.1, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(-s * 0.45, s * 0.35, s * 0.1, 0, TAU); ctx.arc(s * 0.45, -s * 0.35, s * 0.1, 0, TAU); ctx.fill(); }
    else if (motif === 'rimon') { if (i % 2) rimon(ctx, 0, s * 0.18, s * 0.42, d.line, true); else { ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, TAU); ctx.fill(); } }
    else if (motif === 'leaf') { leaf(ctx, -s * 0.9, 0, s * 0.95, -0.35, d.line, true); leaf(ctx, -s * 0.9, 0, s * 0.95, 0.35, d.line, true); }
    else { // diamond + dot
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.lineTo(s * 0.45, 0); ctx.lineTo(0, s * 0.6); ctx.lineTo(-s * 0.45, 0); ctx.closePath(); i % 2 ? ctx.stroke() : ctx.fill();
      ctx.beginPath(); ctx.arc(s * 1.1, 0, s * 0.1, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function bandBorder(ctx, d, a, b, motif, corner) {
    rectStroke(ctx, a, 3, d.line); rectStroke(ctx, b, 2.4, d.line);
    const m = (a + b) / 2, s = (b - a) / 2 - 6, step = s * 2.2, bw = b - a;
    ctx.save(); ctx.strokeStyle = d.line; ctx.fillStyle = d.line; ctx.lineWidth = Math.max(1.8, s * 0.09); ctx.lineCap = 'round';
    [[a + bw, m, W - a - bw, m, 1], [a + bw, H - m, W - a - bw, H - m, 1], [m, a + bw, m, H - a - bw, 0], [W - m, a + bw, W - m, H - a - bw, 0]].forEach(([x0, y0, x1, y1, horiz]) => {
      const len = horiz ? x1 - x0 : y1 - y0, n = Math.floor(len / step), start = (len - n * step) / 2;
      for (let i = 0; i < n; i++) { const t = start + step * (i + 0.5); motifAt(ctx, motif, horiz ? x0 + t : x0, horiz ? y0 : y0 + t, s, !!horiz, i, d); }
    });
    ctx.restore();
    [[a, a], [W - b, a], [a, H - b], [W - b, H - b]].forEach(([x, y]) => {
      ctx.save(); ctx.fillStyle = bgGrad(ctx, d); ctx.fillRect(x, y, bw, bw); ctx.strokeStyle = d.line; ctx.lineWidth = 2.4; ctx.strokeRect(x, y, bw, bw);
      const cx = x + bw / 2, cy = y + bw / 2;
      if (corner === 'magen') magen(ctx, cx, cy, bw * 0.3, d.line, 2.2);
      else if (corner === 'rimon') rimon(ctx, cx, cy + bw * 0.06, bw * 0.2, d.line, true);
      else rosette(ctx, cx, cy, bw * 0.3, 8, d.line, false);
      ctx.restore();
    });
  }
  // rectangle with an arched top; the arch springs at y and rises w/2 above it
  function archPath(ctx, x, y, w, yb, kind) {
    const r = w / 2;
    ctx.moveTo(x, yb); ctx.lineTo(x, y);
    if (kind === 'ogee') {
      ctx.bezierCurveTo(x, y - r * 0.75, x + r * 0.62, y - r * 0.62, x + r, y - r * 1.05);
      ctx.bezierCurveTo(x + r * 1.38, y - r * 0.62, x + w, y - r * 0.75, x + w, y);
    } else if (kind === 'pointed') {
      ctx.quadraticCurveTo(x, y - r * 0.85, x + r, y - r * 1.1); ctx.quadraticCurveTo(x + w, y - r * 0.85, x + w, y);
    } else ctx.arc(x + r, y, r, Math.PI, 0);
    ctx.lineTo(x + w, yb); ctx.closePath();
  }
  function lattice(ctx, d, kind, alpha, step) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = d.line; ctx.fillStyle = d.line; ctx.lineWidth = 2;
    for (let y = 0, row = 0; y < H + step; y += step * 0.87, row++) {
      for (let x = (row % 2) * step / 2; x < W + step; x += step) {
        if (kind === 'magen') magen(ctx, x, y, step * 0.3, d.line, 1.8);
        else if (kind === 'dots') { ctx.beginPath(); ctx.arc(x, y, step * 0.07, 0, TAU); ctx.fill(); }
        else if (kind === 'quatre') rosette(ctx, x, y, step * 0.3, 4, d.line, false);
        else { ctx.beginPath(); ctx.moveTo(x, y - step * 0.42); ctx.lineTo(x + step * 0.5, y); ctx.lineTo(x, y + step * 0.42); ctx.lineTo(x - step * 0.5, y); ctx.closePath(); ctx.stroke(); }
      }
    }
    ctx.restore();
  }
  function starField(ctx, d, n, seed, keepOut) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H;
      if (keepOut && x > keepOut[0] && x < keepOut[0] + keepOut[2] && y > keepOut[1] && y < keepOut[1] + keepOut[3]) continue;
      const big = r() < 0.08;
      ctx.save(); ctx.globalAlpha = 0.35 + r() * 0.55;
      if (big) sparkle(ctx, x, y, 8 + r() * 10, d.line); else { ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(x, y, 1.4 + r() * 2.4, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
  }
  function cloud(ctx, x, y, s, color) {
    ctx.save(); ctx.fillStyle = color; ctx.beginPath();
    [[0, 0, 1], [-0.9, 0.25, 0.7], [0.95, 0.2, 0.75], [-0.4, -0.45, 0.65], [0.45, -0.4, 0.6]].forEach(([dx, dy, rr]) => { ctx.moveTo(x + dx * s + rr * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); });
    ctx.fill(); ctx.restore();
  }
  function textOnLine(ctx, text, x0, y0, len, angle, size, spec, color) {
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(angle); font(ctx, spec, size); ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.direction = 'rtl';
    let t = text; while (ctx.measureText(t).width > len && t.length > 4) t = t.slice(0, t.lastIndexOf(' '));
    ctx.fillText(t, len / 2, 0); ctx.restore();
  }
  const SHIR = 'שיר למעלות אשא עיני אל ההרים מאין יבא עזרי · עזרי מעם ה׳ עשה שמים וארץ · אל יתן למוט רגלך אל ינום שמרך · הנה לא ינום ולא יישן שומר ישראל · ה׳ שמרך ה׳ צלך על יד ימינך · יומם השמש לא יככה וירח בלילה · ה׳ ישמרך מכל רע ישמר את נפשך · ה׳ ישמר צאתך ובואך מעתה ועד עולם';
  function mazelBanner(ctx, cx, cy, w, d) {
    ctx.save(); ctx.fillStyle = d.dark ? hexA(d.line, 0.9) : d.title; ctx.strokeStyle = d.line; ctx.lineWidth = 2;
    const h = w * 0.16;
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(cx + sd * w * 0.42, cy - h * 0.25); ctx.lineTo(cx + sd * w * 0.62, cy - h * 0.25); ctx.lineTo(cx + sd * w * 0.55, cy + h * 0.25); ctx.lineTo(cx + sd * w * 0.62, cy + h * 0.75); ctx.lineTo(cx + sd * w * 0.42, cy + h * 0.75); ctx.closePath(); ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1; });
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h / 2); ctx.quadraticCurveTo(cx, cy - h * 0.9, cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2, cy + h / 2); ctx.quadraticCurveTo(cx, cy + h * 0.1, cx - w / 2, cy + h / 2); ctx.closePath(); ctx.fill();
    font(ctx, ['Suez One', 400], h * 0.62); ctx.fillStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillText('מזל טוב', cx, cy - h * 0.18);
    ctx.restore();
  }

  const BOY_FRAMES = {
    // kesuba-style arched window with columns, patterned surround
    bKesuba(ctx, d) {
      bgFill(ctx, d); lattice(ctx, d, 'diamond', d.dark ? 0.16 : 0.2, 74);
      const x = 190, w = W - 380, y = 720, yb = H - 150;
      ctx.save(); ctx.beginPath(); archPath(ctx, x, y, w, yb, 'round'); ctx.fillStyle = bgGrad(ctx, d); ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.beginPath(); archPath(ctx, x + 26, y, w - 52, yb - 26, 'round'); ctx.strokeStyle = d.line; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      rectStroke(ctx, 48, 3, d.line); rectStroke(ctx, 62, 1.2, d.line);
      [x, x + w].forEach((cx) => {
        ctx.save(); ctx.fillStyle = d.line;
        ctx.fillRect(cx - 26, y - 6, 52, 18); ctx.fillRect(cx - 22, yb - 20, 44, 20);
        ctx.globalAlpha = 0.85; ctx.fillRect(cx - 14, y + 12, 28, yb - y - 32);
        ctx.globalAlpha = 1; ctx.strokeStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.lineWidth = 2;
        [-6, 0, 6].forEach((o) => { ctx.beginPath(); ctx.moveTo(cx + o, y + 22); ctx.lineTo(cx + o, yb - 30); ctx.stroke(); });
        ctx.restore();
      });
      keser(ctx, W / 2, 300, 150, metal(ctx, d.line, W / 2 - 80, 200, W / 2 + 80, 300));
      [-1, 1].forEach((sd) => { sparkle(ctx, W / 2 + sd * 150, 260, 12, d.line); sparkle(ctx, W / 2 + sd * 220, 300, 7, d.line); });
      return { x: 280, y: 400, w: W - 560, h: yb - 400 - 90, bsd: [W - 150, 112], div: 'diamond' };
    },
    // papercut: a solid lace band with cut-out scallops and holes, doves at the top
    bLace(ctx, d) {
      bgFill(ctx, d);
      const a = 60, b = 168, col = d.dark ? d.line : d.title;
      ctx.save(); ctx.fillStyle = hexA(col, d.dark ? 0.85 : 0.9); ctx.beginPath(); ctx.rect(a, a, W - 2 * a, H - 2 * a); ctx.rect(b, b, W - 2 * b, H - 2 * b); ctx.fill('evenodd'); ctx.restore();
      ctx.save(); ctx.fillStyle = bgGrad(ctx, d);
      const holes = (x0, y0, x1, y1) => { const horiz = y0 === y1, len = horiz ? x1 - x0 : y1 - y0, n = Math.floor(len / 54);
        for (let i = 0; i <= n; i++) { const t = i * len / n, x = horiz ? x0 + t : x0, y = horiz ? y0 : y0 + t;
          ctx.beginPath(); ctx.arc(x, y, i % 2 ? 9 : 14, 0, TAU); ctx.fill(); } };
      const m1 = a + 34, m2 = b - 30;
      [[m1, m1, W - m1, m1], [m1, H - m1, W - m1, H - m1], [m1, m1, m1, H - m1], [W - m1, m1, W - m1, H - m1]].forEach((r) => holes.apply(null, r));
      const scal = (x0, y0, x1, y1, inward) => { const horiz = y0 === y1, len = horiz ? x1 - x0 : y1 - y0, n = Math.floor(len / 46);
        for (let i = 0; i < n; i++) { const t = (i + 0.5) * len / n, x = horiz ? x0 + t : x0, y = horiz ? y0 : y0 + t; ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); ctx.fill(); } };
      [[b, b, W - b, b], [b, H - b, W - b, H - b], [b, b, b, H - b], [W - b, b, W - b, H - b]].forEach((r) => scal.apply(null, r));
      [[m2, m2], [W - m2, m2], [m2, H - m2], [W - m2, H - m2]].forEach(([x, y]) => { magenFill(ctx, x, y, 22); });
      ctx.restore();
      dove(ctx, W / 2 - 150, 300, 120, 1, col); dove(ctx, W / 2 + 150, 300, 120, -1, col);
      magen(ctx, W / 2, 248, 34, col, 3);
      return { x: 250, y: 400, w: W - 500, h: H - 400 - 250, bsd: [W - 250, 250], div: 'leaf' };
    },
    // art-deco: stepped corners, fan rays, magen medallion
    bDeco(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 77);
      const g = metal(ctx, d.line, 0, 0, W, H);
      ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 5;
      const st = (k) => { const i = 60 + k * 26, c = 70 + k * 30; ctx.beginPath(); ctx.moveTo(i + c, i); ctx.lineTo(W - i - c, i); ctx.lineTo(W - i - c, i + 16); ctx.lineTo(W - i - 16, i + 16); ctx.lineTo(W - i - 16, i + c); ctx.lineTo(W - i, i + c);
        ctx.lineTo(W - i, H - i - c); ctx.lineTo(W - i - 16, H - i - c); ctx.lineTo(W - i - 16, H - i - 16); ctx.lineTo(W - i - c, H - i - 16); ctx.lineTo(W - i - c, H - i); ctx.lineTo(i + c, H - i); ctx.lineTo(i + c, H - i - 16); ctx.lineTo(i + 16, H - i - 16); ctx.lineTo(i + 16, H - i - c); ctx.lineTo(i, H - i - c);
        ctx.lineTo(i, i + c); ctx.lineTo(i + 16, i + c); ctx.lineTo(i + 16, i + 16); ctx.lineTo(i + c, i + 16); ctx.closePath(); ctx.stroke(); };
      st(0); ctx.lineWidth = 2; st(1);
      ctx.restore();
      // fan rays behind the medallion
      ctx.save(); ctx.strokeStyle = hexA(d.line, 0.55); ctx.lineWidth = 2;
      for (let k = 0; k <= 16; k++) { const a = Math.PI + k * Math.PI / 16; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * 110, 330 + Math.sin(a) * 110); ctx.lineTo(W / 2 + Math.cos(a) * 250, 330 + Math.sin(a) * 250); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.fillStyle = bgGrad(ctx, d); ctx.beginPath(); ctx.arc(W / 2, 290, 90, 0, TAU); ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(W / 2, 290, 74, 0, TAU); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = g; magenFill(ctx, W / 2, 290, 50); ctx.restore();
      ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(300, 330); ctx.lineTo(W / 2 - 260, 330); ctx.moveTo(W / 2 + 260, 330); ctx.lineTo(W - 300, 330); ctx.stroke(); ctx.restore();
      return { x: 240, y: 430, w: W - 480, h: H - 430 - 230, bsd: [W - 230, 220], div: 'deco' };
    },
    // Moorish keyhole window with a tiled surround and a lantern
    bTile(ctx, d) {
      bgFill(ctx, d);
      lattice(ctx, d, 'quatre', d.dark ? 0.22 : 0.26, 96);
      const x = 170, w = W - 340, y = 760, yb = H - 130;
      ctx.save(); ctx.beginPath(); archPath(ctx, x, y, w, yb, 'ogee'); ctx.fillStyle = bgGrad(ctx, d); ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); archPath(ctx, x + 22, y + 4, w - 44, yb - 22, 'ogee'); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      rectStroke(ctx, 40, 3, d.line);
      lantern(ctx, W / 2, y - w / 2 * 1.05 + 30, 300, d);
      return { x: 260, y: 470, w: W - 520, h: yb - 470 - 80, bsd: [W - 120, 110], div: 'rosette' };
    },
    // damask-like pattern ground with a calm central panel and a laurel crest
    bDamask(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); ctx.fillStyle = hexA(d.line, d.dark ? 0.14 : 0.16);
      for (let y = 0, row = 0; y < H + 120; y += 120, row++) for (let x = (row % 2) * 85; x < W + 170; x += 170) {
        rosette(ctx, x, y, 34, 6, hexA(d.line, d.dark ? 0.3 : 0.32), false);
        ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
        leaf(ctx, x, y + 40, 26, Math.PI / 2, hexA(d.line, 0.25), true); leaf(ctx, x, y - 40, 26, -Math.PI / 2, hexA(d.line, 0.25), true);
      }
      ctx.restore();
      const px = 140, py = 140;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 30; ctx.fillStyle = d.dark ? mix(d.bg[0], '#000000', 0.15) : '#fffdf8';
      ctx.beginPath(); roundRectPath(ctx, px, py, W - 2 * px, H - 2 * py, 18); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.beginPath(); roundRectPath(ctx, px + 24, py + 24, W - 2 * px - 48, H - 2 * py - 48, 10); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); roundRectPath(ctx, px + 36, py + 36, W - 2 * px - 72, H - 2 * py - 72, 6); ctx.stroke(); ctx.restore();
      laurel(ctx, W / 2, 330, 92, d.line); magen(ctx, W / 2, 322, 40, d.line, 3);
      return { x: 260, y: 470, w: W - 520, h: H - 470 - 260, bsd: [W - 250, 250], div: 'leaf' };
    },
    // modern: a deep colour band across the top with stars, clean type below
    bModern(ctx, d) {
      const band = d.dark ? mix(d.bg[1], '#ffffff', 0.08) : d.title;
      ctx.fillStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.fillRect(0, 0, W, H);
      if (!d.dark) bgFill(ctx, d);
      ctx.save(); ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 380); ctx.quadraticCurveTo(W / 2, 470, 0, 380); ctx.closePath(); ctx.fill(); ctx.restore();
      const onBand = d.dark ? d.line : '#ffffff';
      const r = rng(5); ctx.save();
      for (let i = 0; i < 40; i++) { ctx.globalAlpha = 0.25 + r() * 0.5; const x = r() * W, y = 30 + r() * 320; if (Math.abs(x - W / 2) < 170 && y > 120) continue; ctx.fillStyle = onBand; ctx.beginPath(); ctx.arc(x, y, 2 + r() * 3, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.fillStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.beginPath(); ctx.arc(W / 2, 330, 110, 0, TAU); ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
      magen(ctx, W / 2, 330, 58, d.dark ? d.line : d.title, 5);
      ctx.save(); ctx.fillStyle = d.dark ? d.line : d.title; ctx.fillRect(W / 2 - 120, H - 110, 240, 6); ctx.restore();
      return { x: 200, y: 500, w: W - 400, h: H - 500 - 190, bsd: [W - 110, 60], div: 'dot' };
    },
    // constellation: a starry night (or day) sky, "count the stars" crest
    bStars(ctx, d) {
      bgFill(ctx, d, 'radial');
      starField(ctx, d, 260, 17, [200, 360, W - 400, H - 560]);
      rectStroke(ctx, 70, 2, d.line);
      ctx.save(); ctx.strokeStyle = hexA(d.line, 0.6); ctx.lineWidth = 1.6;
      const pts = [[W / 2 - 300, 300], [W / 2 - 170, 220], [W / 2, 170], [W / 2 + 170, 220], [W / 2 + 300, 300]];
      ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
      pts.forEach(([x, y], i) => { glowAt(ctx, x, y, 50, d.line, 0.35); sparkle(ctx, x, y, i === 2 ? 34 : 18, d.line); });
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 500], 38); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('הבט נא השמימה וספור הכוכבים', W / 2, 360); ctx.restore();
      return { x: 230, y: 420, w: W - 460, h: H - 420 - 210, bsd: [W - 150, 150], div: 'sparkle' };
    },
    // Yerushalayim skyline along the foot, a band of stars border
    bJerusalem(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.dark ? '#ffffff' : d.line, 0.035, 2600, 23);
      bandBorder(ctx, d, 50, 118, 'magen', 'rosette');
      skyline(ctx, d, H - 150, 230);
      keser(ctx, W / 2, 300, 140, metal(ctx, d.line, W / 2 - 80, 200, W / 2 + 80, 300));
      return { x: 240, y: 380, w: W - 480, h: H - 380 - 420, bsd: [W - 200, 200], div: 'star' };
    },
    // pomegranates: kesuba band of pomegranates, a trio as the crest
    bRimon(ctx, d) {
      bgFill(ctx, d);
      bandBorder(ctx, d, 56, 140, 'rimon', 'rimon');
      rimon(ctx, W / 2, 285, 48, d.line, true); rimon(ctx, W / 2 - 110, 305, 34, d.line, false); rimon(ctx, W / 2 + 110, 305, 34, d.line, false);
      [-1, 1].forEach((sd) => { leaf(ctx, W / 2 + sd * 165, 318, 70, sd > 0 ? -0.15 : Math.PI + 0.15, d.line, true); });
      return { x: 250, y: 400, w: W - 500, h: H - 400 - 240, bsd: [W - 230, 230], div: 'diamond' };
    },
    // soft watercolour clouds in the corners, a fine gold line
    bClouds(ctx, d) {
      bgFill(ctx, d);
      const cc = d.dark ? 'rgba(255,255,255,0.07)' : hexA(mix(d.line, '#ffffff', 0.3), 0.22);
      [[150, 170, 120], [330, 120, 80], [W - 170, 200, 110], [W - 360, 110, 70], [140, H - 160, 120], [W - 150, H - 190, 130], [W - 380, H - 110, 80]].forEach(([x, y, s]) => { cloud(ctx, x, y, s, cc); cloud(ctx, x + 20, y + 10, s * 0.7, cc); });
      rectStroke(ctx, 96, 2, d.line, 24);
      starField(ctx, d, 26, 61, [180, 180, W - 360, H - 360]);
      ctx.save(); ctx.fillStyle = hexA(d.line, 0.9);
      [[-60, 260, 18], [0, 220, 30], [60, 260, 18]].forEach(([o, y, s]) => { magenFill(ctx, W / 2 + o, y, s); });
      ctx.restore();
      return { x: 230, y: 330, w: W - 460, h: H - 330 - 230, bsd: [W - 190, 180], div: 'sparkle' };
    },
    // ---- Bris: Kisei shel Eliyahu
    brisKisei(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2200, 31);
      bandBorder(ctx, d, 54, 120, 'diamond', 'magen');
      glowAt(ctx, W / 2, 300, 230, d.line, d.dark ? 0.2 : 0.14);
      kisei(ctx, W / 2, 470, 360, d);
      return { x: 240, y: 520, w: W - 480, h: H - 520 - 220, bsd: [W - 200, 200], div: 'flourish' };
    },
    brisKiseiArch(ctx, d) {
      bgFill(ctx, d);
      lattice(ctx, d, 'dots', d.dark ? 0.35 : 0.4, 60);
      const x = 150, w = W - 300, y = 700, yb = H - 120;
      ctx.save(); ctx.beginPath(); archPath(ctx, x, y, w, yb, 'pointed'); ctx.fillStyle = bgGrad(ctx, d); ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); archPath(ctx, x + 18, y + 4, w - 36, yb - 18, 'pointed'); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      kisei(ctx, W / 2, 560, 330, d);
      return { x: 250, y: 600, w: W - 500, h: yb - 600 - 70, bsd: [W - 110, 90], div: 'diamond' };
    },
    // ---- Torah scroll — "le-Torah, le-chuppah u-le-ma'asim tovim"
    brisTorah(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2200, 37);
      rectStroke(ctx, 56, 4, d.line); rectStroke(ctx, 76, 1.4, d.line);
      cornerScroll(ctx, 96, 96, 1, 1, 120, d.line, 2.6); cornerScroll(ctx, W - 96, 96, -1, 1, 120, d.line, 2.6);
      cornerScroll(ctx, 96, H - 96, 1, -1, 120, d.line, 2.6); cornerScroll(ctx, W - 96, H - 96, -1, -1, 120, d.line, 2.6);
      torahScroll(ctx, W / 2, 300, 230, 170, d);
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 700], 36); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('לתורה לחופה ולמעשים טובים', W / 2, 500); ctx.restore();
      return { x: 230, y: 540, w: W - 460, h: H - 540 - 210, bsd: [W - 200, 170], div: 'flourish' };
    },
    // ---- Vach Nacht: two tall candles in the night
    vnCandles(ctx, d) {
      bgFill(ctx, d, 'radial');
      starField(ctx, d, 110, 71, [200, 150, W - 400, H - 300]);
      rectStroke(ctx, 52, 3, d.line); rectStroke(ctx, 70, 1.2, d.line);
      glowAt(ctx, W / 2, 250, 300, '#ffcf70', d.dark ? 0.22 : 0.14);
      [-1, 1].forEach((sd) => { const top = candlestick(ctx, W / 2 + sd * 110, 470, 170, d); candle(ctx, W / 2 + sd * 110, top, 150, 36, d); });
      return { x: 230, y: 520, w: W - 460, h: H - 520 - 210, bsd: [W - 170, 160], div: 'star' };
    },
    // Shir Hamaalos written around the border, a candle at the top
    vnShir(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 53);
      rectStroke(ctx, 46, 2.6, d.line); rectStroke(ctx, 116, 2.6, d.line);
      const spec = ['Frank Ruhl Libre', 500], sz = 34, c = d.dark ? d.line : d.title;
      const parts = SHIR.split(' · ');
      const top = parts.slice(0, 2).join(' · '), right = parts.slice(2, 4).join(' · '), bottom = parts.slice(4, 6).join(' · '), left = parts.slice(6).join(' · ');
      textOnLine(ctx, top, 130, 81, W - 260, 0, sz, spec, c);
      textOnLine(ctx, right, W - 81, 130, H - 260, Math.PI / 2, sz, spec, c);
      textOnLine(ctx, bottom, 130, H - 81, W - 260, 0, sz, spec, c);
      textOnLine(ctx, left, 81, H - 130, H - 260, -Math.PI / 2, sz, spec, c);
      [[81, 81], [W - 81, 81], [81, H - 81], [W - 81, H - 81]].forEach(([x, y]) => { magen(ctx, x, y, 22, d.line, 2.2); });
      ctx.save(); font(ctx, ['Suez One', 400], 64); ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('שיר המעלות', W / 2, 270); ctx.restore();
      divider(ctx, 'star', W / 2, 320, 360, d.line);
      return { x: 230, y: 380, w: W - 460, h: H - 380 - 220, bsd: [W - 200, 190], div: 'star' };
    },
    // three lanterns hanging from the top edge
    vnLanterns(ctx, d) {
      bgFill(ctx, d, 'radial');
      starField(ctx, d, 70, 83, [180, 520, W - 360, H - 700]);
      rectStroke(ctx, 60, 2.4, d.line, 30);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(60, 120); ctx.quadraticCurveTo(W / 2, 220, W - 60, 120); ctx.stroke(); ctx.restore();
      lantern(ctx, W / 2, 168, 320, d); lantern(ctx, W / 2 - 300, 142, 230, d); lantern(ctx, W / 2 + 300, 142, 230, d);
      return { x: 230, y: 540, w: W - 460, h: H - 540 - 200, bsd: [W - 120, 210], div: 'sparkle' };
    },
    // an open siddur with a candle — Krias Shema by the baby
    vnSiddur(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 59);
      bandBorder(ctx, d, 58, 122, 'wave', 'magen');
      const cx = W / 2, cy = 330, c = d.line;
      ctx.save(); const pg = d.dark ? '#f5ecd6' : '#fffaf0';
      [-1, 1].forEach((sd) => { ctx.fillStyle = pg; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.quadraticCurveTo(cx + sd * 90, cy - 100, cx + sd * 190, cy - 80); ctx.lineTo(cx + sd * 190, cy + 60); ctx.quadraticCurveTo(cx + sd * 90, cy + 40, cx, cy + 70); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(70,55,35,0.45)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { const y = cy - 50 + k * 20; ctx.beginPath(); ctx.moveTo(cx + sd * 30, y); ctx.lineTo(cx + sd * 160, y - 8); ctx.stroke(); } });
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx - 200, cy + 64); ctx.quadraticCurveTo(cx - 90, cy + 50, cx, cy + 84); ctx.quadraticCurveTo(cx + 90, cy + 50, cx + 200, cy + 64); ctx.lineTo(cx + 200, cy + 76); ctx.quadraticCurveTo(cx + 90, cy + 62, cx, cy + 96); ctx.quadraticCurveTo(cx - 90, cy + 62, cx - 200, cy + 76); ctx.closePath(); ctx.fill();
      ctx.restore();
      candle(ctx, cx + 300, 420, 150, 32, d); candle(ctx, cx - 300, 420, 150, 32, d);
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 700], 38); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('שמע ישראל', cx, 490); ctx.restore();
      return { x: 240, y: 540, w: W - 480, h: H - 540 - 210, bsd: [W - 200, 190], div: 'dot' };
    },
    // ---- Shalom Zachor / Kiddush: Shabbos candlesticks with the becher
    szShabbos(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 67);
      rectStroke(ctx, 50, 3.4, d.line); rectStroke(ctx, 66, 1.2, d.line);
      [[66, 66], [W - 66, 66], [66, H - 66], [W - 66, H - 66]].forEach(([x, y]) => { ctx.save(); ctx.fillStyle = d.line; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.restore(); });
      glowAt(ctx, W / 2, 260, 300, '#ffcf70', d.dark ? 0.18 : 0.12);
      [-1, 1].forEach((sd) => { const top = candlestick(ctx, W / 2 + sd * 190, 470, 190, d); candle(ctx, W / 2 + sd * 190, top, 120, 32, d); });
      kosCup(ctx, W / 2, 470, 190, d);
      return { x: 230, y: 530, w: W - 460, h: H - 530 - 200, bsd: [W - 160, 150], div: 'flourish' };
    },
    // a bowl of arbes, cheerful dotted border
    szArbes(ctx, d) {
      bgFill(ctx, d);
      bandBorder(ctx, d, 52, 112, 'quatre', 'rosette');
      arbesBowl(ctx, W / 2, 420, 300, d);
      mazelBanner(ctx, W / 2, 470, 460, d);
      return { x: 240, y: 560, w: W - 480, h: H - 560 - 200, bsd: [W - 190, 190], div: 'rosette' };
    },
    // Friday night through an arched window: two candles and stars
    szWindow(ctx, d) {
      bgFill(ctx, d);
      const x = 120, w = W - 240, y = 640, yb = H - 110;
      ctx.save(); ctx.fillStyle = hexA(d.line, d.dark ? 0.12 : 0.1); ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.beginPath(); archPath(ctx, x, y, w, yb, 'round'); ctx.clip();
      const sky = ctx.createLinearGradient(0, 0, 0, 900); sky.addColorStop(0, d.dark ? '#0a1430' : '#1d3157'); sky.addColorStop(1, d.dark ? '#1c2a52' : '#3a5a8c');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 900);
      const r = rng(7); for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,240,200,' + (0.4 + r() * 0.6) + ')'; ctx.beginPath(); ctx.arc(x + r() * w, 100 + r() * 400, 1.5 + r() * 2.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = bgGrad(ctx, d); ctx.fillRect(0, 560, W, H);
      ctx.restore();
      ctx.save(); ctx.beginPath(); archPath(ctx, x, y, w, yb, 'round'); ctx.strokeStyle = d.line; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x + w, 560); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W / 2, 560); ctx.lineTo(W / 2, y - w / 2 + 6); ctx.stroke(); ctx.restore();
      const lt = { line: '#e6cf8f', dark: true, bg: d.bg };
      [-1, 1].forEach((sd) => { const top = candlestick(ctx, W / 2 + sd * 200, 556, 150, lt); candle(ctx, W / 2 + sd * 200, top, 110, 28, lt); });
      return { x: 230, y: 620, w: W - 460, h: yb - 620 - 60, bsd: [W - 90, 80], div: 'star' };
    },
    // ---- Pidyon Haben: five silver coins
    phCoins(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 97);
      rectStroke(ctx, 52, 4, d.line); rectStroke(ctx, 72, 1.4, d.line);
      [[72, 72], [W - 72, 72], [72, H - 72], [W - 72, H - 72]].forEach(([x, y]) => rosette(ctx, x, y, 34, 8, d.line, false));
      coinArc(ctx, W / 2, 290, 62, Object.assign({}, d, { coin: '#c9ced6' }));
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 700], 36); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('חמשת סלעים', W / 2, 420); ctx.restore();
      return { x: 240, y: 470, w: W - 480, h: H - 470 - 220, bsd: [W - 200, 170], div: 'diamond' };
    },
    // silver tray with the coins, deco frame
    phTray(ctx, d) {
      bgFill(ctx, d);
      const g = metal(ctx, d.line, 0, 0, W, 0);
      ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.beginPath(); roundRectPath(ctx, 60, 60, W - 120, H - 120, 60); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); roundRectPath(ctx, 86, 86, W - 172, H - 172, 44); ctx.stroke(); ctx.restore();
      ctx.save(); const tg = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0); tg.addColorStop(0, '#8d949e'); tg.addColorStop(0.35, '#eef0f3'); tg.addColorStop(0.6, '#b9bec6'); tg.addColorStop(1, '#7d838c');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(W / 2, 360, 270, 70, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6f757e'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(W / 2, 352, 220, 50, 0, 0, TAU); ctx.stroke(); ctx.restore();
      const sd = Object.assign({}, d, { coin: '#cfd3da' });
      [[-130, 330], [-65, 312], [0, 336], [65, 312], [130, 330]].forEach(([o, y], i) => coin(ctx, W / 2 + o, y - 30, 46, sd, i));
      return { x: 240, y: 480, w: W - 480, h: H - 480 - 230, bsd: [W - 200, 190], div: 'deco' };
    },
    // coins along the foot, crown at the top
    phCrown(ctx, d) {
      bgFill(ctx, d, 'radial');
      bandBorder(ctx, d, 54, 118, 'zigzag', 'rosette');
      keser(ctx, W / 2, 300, 150, metal(ctx, d.line, W / 2 - 80, 200, W / 2 + 80, 300));
      coinArc(ctx, W / 2, H - 260, 42, Object.assign({}, d, { coin: '#c9ced6' }));
      return { x: 250, y: 380, w: W - 500, h: H - 380 - 400, bsd: [W - 200, 190], div: 'star' };
    }
  };
  Object.assign(FRAMES, BOY_FRAMES);

  // ================================================================ more simchas (Nov 2026, part 2) — all drawn here in code
  function letterTile(ctx, x, y, s, ch, d, rot, hue) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    const base = hue || d.line;
    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, mix(base, '#ffffff', 0.35)); g.addColorStop(1, mix(base, '#000000', 0.12));
    ctx.fillStyle = g; ctx.beginPath(); roundRectPath(ctx, -s / 2, -s / 2, s, s, s * 0.14); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = Math.max(2, s * 0.03); ctx.beginPath(); roundRectPath(ctx, -s * 0.42, -s * 0.42, s * 0.84, s * 0.84, s * 0.1); ctx.stroke();
    font(ctx, ['Suez One', 400], s * 0.62); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    ctx.fillText(ch, 0, s * 0.04); ctx.restore();
  }
  function scissors(ctx, cx, cy, s, d) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = d.line; ctx.fillStyle = metal(ctx, d.line, -s / 2, 0, s / 2, 0); ctx.lineWidth = Math.max(2.4, s * 0.025);
    [-1, 1].forEach((sd) => {
      ctx.save(); ctx.rotate(sd * 0.32);
      ctx.beginPath(); ctx.moveTo(-s * 0.03, 0); ctx.lineTo(0, -s * 0.62); ctx.quadraticCurveTo(s * 0.05, -s * 0.3, s * 0.035, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, s * 0.02); ctx.lineTo(0, s * 0.18); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, s * 0.32, s * 0.1, s * 0.14, 0, 0, TAU); ctx.lineWidth = Math.max(4, s * 0.04); ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, s * 0.03, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // a small tallis katan with tzitzis
  function tzitzis(ctx, cx, top, s, d) {
    const w = s * 0.7, h = s;
    ctx.save(); ctx.fillStyle = d.dark ? '#f6f1e6' : '#ffffff'; ctx.strokeStyle = d.line; ctx.lineWidth = Math.max(2.4, s * 0.012);
    ctx.beginPath(); ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx - w * 0.14, top); ctx.quadraticCurveTo(cx, top + h * 0.16, cx + w * 0.14, top); ctx.lineTo(cx + w / 2, top); ctx.lineTo(cx + w / 2, top + h * 0.8); ctx.lineTo(cx - w / 2, top + h * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = d.dark ? '#22314f' : d.title; ctx.lineWidth = Math.max(3, s * 0.03);
    [0.56, 0.64].forEach((t) => { ctx.beginPath(); ctx.moveTo(cx - w / 2 + 4, top + h * t); ctx.lineTo(cx + w / 2 - 4, top + h * t); ctx.stroke(); });
    ctx.strokeStyle = d.dark ? '#f6f1e6' : mix(d.line, '#ffffff', 0.2); ctx.lineWidth = Math.max(1.6, s * 0.008);
    [[cx - w / 2 + 10, top + h * 0.8], [cx + w / 2 - 10, top + h * 0.8]].forEach(([x, y]) => { for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + k * 4, y + h * 0.12, x + k * 6, y + h * 0.24); ctx.stroke(); } });
    ctx.restore();
  }
  function honeyJar(ctx, cx, by, s, d) {
    ctx.save();
    const hg = ctx.createLinearGradient(cx - s * 0.3, 0, cx + s * 0.3, 0); hg.addColorStop(0, '#c9861f'); hg.addColorStop(0.5, '#f2c25a'); hg.addColorStop(1, '#b8741a');
    ctx.fillStyle = hg; ctx.strokeStyle = d.line; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.24, by - s * 0.62); ctx.quadraticCurveTo(cx - s * 0.36, by - s * 0.3, cx - s * 0.26, by); ctx.lineTo(cx + s * 0.26, by); ctx.quadraticCurveTo(cx + s * 0.36, by - s * 0.3, cx + s * 0.24, by - s * 0.62); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = d.line; ctx.fillRect(cx - s * 0.27, by - s * 0.74, s * 0.54, s * 0.12);
    ctx.fillStyle = '#f2c25a'; ctx.beginPath(); ctx.moveTo(cx - s * 0.2, by - s * 0.62); ctx.quadraticCurveTo(cx - s * 0.16, by - s * 0.45, cx - s * 0.12, by - s * 0.62); ctx.quadraticCurveTo(cx - s * 0.05, by - s * 0.4, cx + s * 0.04, by - s * 0.62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; font(ctx, ['Suez One', 400], s * 0.2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('דבש', cx, by - s * 0.3);
    ctx.restore();
  }
  // an arched doorway with a mezuzah on the right post
  function doorway(ctx, cx, by, s, d) {
    const w = s * 0.56, h = s, c = d.line;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = Math.max(3, s * 0.012);
    ctx.fillStyle = hexA(c, d.dark ? 0.2 : 0.14);
    ctx.beginPath(); archPath(ctx, cx - w / 2 - s * 0.06, by - h + w / 2 + s * 0.06, w + s * 0.12, by, 'round'); ctx.stroke();
    ctx.beginPath(); archPath(ctx, cx - w / 2, by - h + w / 2 + s * 0.08, w, by, 'round'); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, by - h + s * 0.09); ctx.lineTo(cx, by); ctx.stroke();
    [-1, 1].forEach((sd) => { ctx.beginPath(); roundRectPath(ctx, cx + sd * w * 0.27 - w * 0.17, by - h * 0.62, w * 0.34, h * 0.22, 6); ctx.stroke(); ctx.beginPath(); roundRectPath(ctx, cx + sd * w * 0.27 - w * 0.17, by - h * 0.32, w * 0.34, h * 0.24, 6); ctx.stroke(); });
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + w * 0.08, by - h * 0.38, s * 0.016, 0, TAU); ctx.fill();
    ctx.fillRect(cx - w / 2 - s * 0.1, by - 6, w + s * 0.2, 8);
    mezuzah(ctx, cx + w / 2 + s * 0.03, by - h * 0.62, s * 0.2, d);
    ctx.restore();
  }
  function mezuzah(ctx, x, y, s, d) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.38);
    ctx.fillStyle = metal(ctx, d.line, -s * 0.12, 0, s * 0.12, 0); ctx.beginPath(); roundRectPath(ctx, -s * 0.11, -s / 2, s * 0.22, s, s * 0.08); ctx.fill();
    ctx.strokeStyle = mix(d.line, '#000000', 0.35); ctx.lineWidth = Math.max(1.5, s * 0.02); ctx.stroke();
    font(ctx, ['Frank Ruhl Libre', 900], s * 0.2); ctx.fillStyle = mix(d.line, '#000000', 0.5); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('ש', 0, -s * 0.22);
    ctx.restore();
  }
  function bigKey(ctx, cx, cy, s, d) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12);
    const g = metal(ctx, d.line, -s / 2, -s * 0.1, s / 2, s * 0.1);
    ctx.fillStyle = g; ctx.strokeStyle = g; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.arc(-s * 0.32, 0, s * 0.15, 0, TAU); ctx.stroke();
    ctx.save(); ctx.fillStyle = g; magenFill(ctx, -s * 0.32, 0, s * 0.09); ctx.restore();
    [0, 1, 2, 3].forEach((k) => { const a = k * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.arc(-s * 0.32 + Math.cos(a) * s * 0.19, Math.sin(a) * s * 0.19, s * 0.035, 0, TAU); ctx.fill(); });
    ctx.fillRect(-s * 0.17, -s * 0.025, s * 0.62, s * 0.05);
    ctx.fillRect(s * 0.3, s * 0.02, s * 0.05, s * 0.1); ctx.fillRect(s * 0.38, s * 0.02, s * 0.06, s * 0.14);
    [-0.1, -0.04].forEach((o) => { ctx.beginPath(); ctx.ellipse(s * o, 0, s * 0.015, s * 0.05, 0, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  function house(ctx, cx, by, s, d) {
    const w = s * 0.8, c = d.line;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = Math.max(3, s * 0.012); ctx.lineJoin = 'round';
    ctx.fillStyle = d.dark ? hexA(c, 0.12) : hexA(c, 0.08);
    ctx.beginPath(); ctx.moveTo(cx - w / 2, by); ctx.lineTo(cx - w / 2, by - s * 0.5); ctx.lineTo(cx, by - s * 0.9); ctx.lineTo(cx + w / 2, by - s * 0.5); ctx.lineTo(cx + w / 2, by); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w / 2 - s * 0.06, by - s * 0.46); ctx.lineTo(cx, by - s * 0.95); ctx.lineTo(cx + w / 2 + s * 0.06, by - s * 0.46); ctx.stroke();
    ctx.fillRect(cx + w * 0.22, by - s * 0.86, s * 0.08, s * 0.2);
    const win = (x, y) => { ctx.save(); ctx.fillStyle = 'rgba(255,214,120,0.85)'; ctx.fillRect(x, y, s * 0.14, s * 0.14); ctx.restore(); ctx.strokeRect(x, y, s * 0.14, s * 0.14); ctx.beginPath(); ctx.moveTo(x + s * 0.07, y); ctx.lineTo(x + s * 0.07, y + s * 0.14); ctx.moveTo(x, y + s * 0.07); ctx.lineTo(x + s * 0.14, y + s * 0.07); ctx.stroke(); };
    win(cx - w * 0.38, by - s * 0.4); win(cx + w * 0.38 - s * 0.14, by - s * 0.4);
    ctx.beginPath(); archPath(ctx, cx - s * 0.08, by - s * 0.24, s * 0.16, by, 'round'); ctx.stroke();
    ctx.restore();
    magen(ctx, cx, by - s * 0.66, s * 0.07, c, 2.2);
    mezuzah(ctx, cx + s * 0.13, by - s * 0.2, s * 0.1, d);
  }
  function bookStack(ctx, cx, by, s, d) {
    const cols = d.dark ? ['#f0e6cf', '#d8c7a0', '#efe2c0', '#e3d3ac', '#f5ecd8'] : [d.title, mix(d.title, '#000000', 0.2), mix(d.line, '#000000', 0.15), mix(d.title, '#ffffff', 0.15), mix(d.nm, '#ffffff', 0.1)];
    const gold = d.dark ? mix(d.line, '#000000', 0.3) : (d.line);
    let y = by; const r = rng(29);
    for (let i = 0; i < 5; i++) {
      const h = s * (0.13 + r() * 0.04), w = s * (0.92 - i * 0.07 + r() * 0.05), x = cx - w / 2 + (r() - 0.5) * s * 0.06;
      ctx.save(); ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); roundRectPath(ctx, x, y - h, w, h, 6); ctx.fill();
      ctx.fillStyle = gold; ctx.fillRect(x + w * 0.08, y - h + 3, w * 0.03, h - 6); ctx.fillRect(x + w * 0.89, y - h + 3, w * 0.03, h - 6);
      ctx.fillRect(x + w * 0.3, y - h * 0.62, w * 0.4, h * 0.24);
      ctx.restore(); y -= h + 2;
    }
    return y;
  }
  function gemaraPage(ctx, cx, cy, w, h, d) {
    ctx.save();
    const pg = d.dark ? '#f6ecd4' : '#fffaf0';
    ctx.fillStyle = pg; ctx.strokeStyle = d.line; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h / 2 + 12); ctx.quadraticCurveTo(cx - w / 4, cy - h / 2 - 10, cx, cy - h / 2 + 8); ctx.quadraticCurveTo(cx + w / 4, cy - h / 2 - 10, cx + w / 2, cy - h / 2 + 12);
    ctx.lineTo(cx + w / 2, cy + h / 2); ctx.quadraticCurveTo(cx + w / 4, cy + h / 2 - 18, cx, cy + h / 2); ctx.quadraticCurveTo(cx - w / 4, cy + h / 2 - 18, cx - w / 2, cy + h / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - h / 2 + 8); ctx.lineTo(cx, cy + h / 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(60,45,30,0.5)';
    [-1, 1].forEach((sd) => {
      const px = cx + sd * w / 4, pw = w / 2 - 40;
      for (let k = 0; k < 12; k++) { const y = cy - h / 2 + 34 + k * (h - 70) / 12; const inner = k > 2 && k < 9; ctx.lineWidth = inner ? 3 : 1.6;
        const ww = inner ? pw * 0.46 : pw * 0.86; ctx.beginPath(); ctx.moveTo(px - ww / 2, y); ctx.lineTo(px + ww / 2, y); ctx.stroke();
        if (inner) { ctx.lineWidth = 1.4; [-1, 1].forEach((q) => { ctx.beginPath(); ctx.moveTo(px + q * pw * 0.27, y); ctx.lineTo(px + q * pw * 0.43, y); ctx.stroke(); }); } }
    });
    ctx.restore();
  }
  function quill(ctx, x, y, s, d) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.55);
    ctx.fillStyle = hexA(d.line, 0.85); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s * 0.16, -s * 0.5, 0, -s); ctx.quadraticCurveTo(s * 0.16, -s * 0.5, 0, 0); ctx.fill();
    ctx.strokeStyle = d.dark ? d.bg[0] : '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.95); ctx.stroke();
    for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.moveTo(0, -s * k * 0.1); ctx.lineTo(-s * 0.08, -s * (k * 0.1 + 0.06)); ctx.moveTo(0, -s * k * 0.1); ctx.lineTo(s * 0.08, -s * (k * 0.1 + 0.06)); ctx.stroke(); }
    ctx.restore();
  }
  function tefillin(ctx, cx, by, s, d) {
    // the shel rosh: a square bayis on a square base, gold shin, the strap looping down from the back
    ctx.save();
    const blk = '#151515', side = '#262626', top = '#3b3b3b', w = s * 0.42, dx = s * 0.16, dy = s * 0.11;
    const bx = cx - w / 2, baseY = by, baseH = s * 0.07, cubeY = baseY - baseH - w;
    ctx.strokeStyle = blk; ctx.lineWidth = s * 0.035; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + w / 2 + dx * 0.6, baseY - baseH * 0.5); ctx.bezierCurveTo(cx + s * 0.75, baseY + s * 0.05, cx + s * 0.85, baseY - s * 0.45, cx + s * 0.55, baseY - s * 0.42);
    ctx.bezierCurveTo(cx + s * 0.35, baseY - s * 0.4, cx + s * 0.45, baseY + s * 0.12, cx + s * 0.95, baseY + s * 0.08); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - w / 2, baseY - baseH * 0.5); ctx.bezierCurveTo(cx - s * 0.7, baseY, cx - s * 0.75, baseY - s * 0.3, cx - s * 0.95, baseY - s * 0.05); ctx.stroke();
    // base (titura), only a little wider than the bayis
    const tw = w * 1.22, tx = cx - tw / 2;
    ctx.fillStyle = blk; ctx.fillRect(tx, baseY - baseH, tw, baseH);
    ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(tx, baseY - baseH); ctx.lineTo(tx + dx, baseY - baseH - dy); ctx.lineTo(tx + tw + dx, baseY - baseH - dy); ctx.lineTo(tx + tw, baseY - baseH); ctx.closePath(); ctx.fill();
    ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(tx + tw, baseY - baseH); ctx.lineTo(tx + tw + dx, baseY - baseH - dy); ctx.lineTo(tx + tw + dx, baseY - dy); ctx.lineTo(tx + tw, baseY); ctx.closePath(); ctx.fill();
    // bayis
    const by0 = cubeY - dy * 0.3;
    ctx.fillStyle = blk; ctx.fillRect(bx, by0, w, w);
    ctx.fillStyle = side; ctx.beginPath(); ctx.moveTo(bx + w, by0); ctx.lineTo(bx + w + dx, by0 - dy); ctx.lineTo(bx + w + dx, by0 + w - dy); ctx.lineTo(bx + w, by0 + w); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(bx, by0); ctx.lineTo(bx + dx, by0 - dy); ctx.lineTo(bx + w + dx, by0 - dy); ctx.lineTo(bx + w, by0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 1.5; [0.25, 0.5, 0.75].forEach((t) => { ctx.beginPath(); ctx.moveTo(bx + w * t, by0); ctx.lineTo(bx + w * t, by0 + w); ctx.stroke(); });
    font(ctx, ['Frank Ruhl Libre', 900], w * 0.62); ctx.fillStyle = '#e2c47c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'; ctx.fillText('ש', bx + w / 2, by0 + w * 0.52);
    ctx.restore();
  }
  function kotel(ctx, d, yTop, h) {
    ctx.save();
    const stone = d.dark ? '#cbbd9c' : '#e7dcc3', edge = d.dark ? '#8f8263' : '#b9a986';
    const r = rng(13); const rows = 5, rh = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -(r() * 160), y = yTop + i * rh;
      while (x < W) { const w = 180 + r() * 160; ctx.fillStyle = mix(stone, '#ffffff', r() * 0.25); ctx.fillRect(x + 3, y + 3, w - 6, rh - 6); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, rh - 6);
        ctx.strokeStyle = hexA(edge, 0.6); ctx.lineWidth = 1.2; ctx.strokeRect(x + 14, y + 14, w - 28, rh - 28);
        if (r() < 0.22) { ctx.save(); ctx.fillStyle = '#fffdf6'; ctx.translate(x + w * 0.9, y + rh * 0.5); ctx.rotate((r() - 0.5) * 0.8); ctx.fillRect(-8, -5, 16, 10); ctx.restore(); }
        if (r() < 0.12) { leaf(ctx, x + w, y + 4, 34, -0.8, '#6f8f5a', true); leaf(ctx, x + w, y + 4, 28, -2.2, '#6f8f5a', true); }
        x += w; }
    }
    ctx.restore();
  }
  function rimonim(ctx, cx, by, s, d) {
    const g = metal(ctx, d.line, cx - s * 0.2, 0, cx + s * 0.2, 0);
    ctx.save(); ctx.fillStyle = g; ctx.strokeStyle = g; ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.fillRect(cx - s * 0.03, by - s * 0.5, s * 0.06, s * 0.5);
    ctx.beginPath(); ctx.moveTo(cx - s * 0.16, by - s * 0.5); ctx.quadraticCurveTo(cx - s * 0.22, by - s * 0.85, cx, by - s); ctx.quadraticCurveTo(cx + s * 0.22, by - s * 0.85, cx + s * 0.16, by - s * 0.5); ctx.closePath(); ctx.fill();
    [-0.12, 0, 0.12].forEach((o) => { ctx.beginPath(); ctx.arc(cx + o * s, by - s * 0.46, s * 0.025, 0, TAU); ctx.fill(); });
    ctx.beginPath(); ctx.arc(cx, by - s * 1.04, s * 0.04, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function blossomBranch(ctx, x, y, len, angle, d, seed) {
    const r = rng(seed || 3), pet = petalsOf(d);
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.strokeStyle = d.dark ? mix(d.line, '#000', 0.2) : '#7a5c46'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.3, -len * 0.08, len * 0.6, len * 0.06, len, -len * 0.02); ctx.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, bx = len * t, by2 = Math.sin(t * 3) * len * 0.03; const side = i % 2 ? -1 : 1;
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by2); ctx.lineTo(bx + 20, by2 + side * 34); ctx.stroke();
      const fx = bx + 20, fy = by2 + side * 34, fr = 16 + r() * 10, col = 'rgba(' + pet[i % pet.length] + ',0.92)';
      ctx.save(); ctx.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + r(); ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * fr * 0.6, fy + Math.sin(a) * fr * 0.6, fr * 0.55, fr * 0.4, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = d.dark ? d.line : '#c99a3a'; ctx.beginPath(); ctx.arc(fx, fy, fr * 0.22, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.restore();
  }
  function chuppah(ctx, cx, by, s, d) {
    const w = s * 1.2, c = d.line, top = by - s;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = Math.max(3, s * 0.014); ctx.lineCap = 'round';
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(cx + sd * w * 0.46, top + s * 0.08); ctx.lineTo(cx + sd * w * 0.46, by); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx + sd * w * 0.46, top + s * 0.05, s * 0.025, 0, TAU); ctx.fill(); });
    ctx.fillStyle = hexA(c, d.dark ? 0.22 : 0.14);
    ctx.beginPath(); ctx.moveTo(cx - w * 0.52, top + s * 0.12); ctx.quadraticCurveTo(cx, top - s * 0.12, cx + w * 0.52, top + s * 0.12);
    const n = 8; for (let i = n; i > 0; i--) { const x0 = cx - w * 0.52 + i * w * 1.04 / n; ctx.quadraticCurveTo(x0 - w * 0.065, top + s * 0.24, x0 - w * 0.13, top + s * 0.12); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    magen(ctx, cx, top + s * 0.06, s * 0.05, c, 2);
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(cx + sd * w * 0.46, top + s * 0.2); ctx.quadraticCurveTo(cx + sd * w * 0.3, top + s * 0.5, cx + sd * w * 0.46, top + s * 0.75); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      for (let k = 0; k < 4; k++) { const t = k / 3, yy = top + s * (0.25 + t * 0.45); rosette(ctx, cx + sd * (w * 0.38 + Math.sin(t * 3) * 10), yy, s * 0.03, 5, c, true); } });
    ctx.restore();
  }
  function brokenPlate(ctx, cx, cy, r, d) {
    ctx.save();
    const shards = [[-0.2, 1.3, -14, -6], [1.3, 2.6, 10, -12], [2.6, 4.2, 12, 10], [4.2, 6.08, -10, 12]];
    shards.forEach(([a0, a1, dx, dy]) => {
      ctx.save(); ctx.translate(dx, dy); ctx.beginPath(); ctx.moveTo(cx + Math.cos((a0 + a1) / 2) * r * 0.08, cy + Math.sin((a0 + a1) / 2) * r * 0.08); ctx.arc(cx, cy, r, a0, a1); ctx.closePath();
      ctx.fillStyle = d.dark ? '#f4efe6' : '#ffffff'; ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.82, a0 + 0.05, a1 - 0.05); ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
  function sevenLights(ctx, cx, cy, rad, d) {
    for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 1) * Math.PI / 8, x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.5;
      candle(ctx, x, y + 80, 70, 22, d); }
  }

  const MORE_FRAMES = {
    // ---- Upsherin
    upAlefBeis(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.line, 0.03, 1800, 101);
      rectStroke(ctx, 54, 3, d.line, 26); rectStroke(ctx, 72, 1.2, d.line, 18);
      const hues = [d.title, d.line, mix(d.title, '#c9861f', 0.5), mix(d.line, '#2c7a6f', 0.5)];
      [['א', -190, 290, -0.12], ['ב', -64, 270, 0.06], ['ג', 64, 285, -0.05], ['ד', 190, 268, 0.1]].forEach(([ch, o, y, rot], i) => letterTile(ctx, W / 2 - o * 1.2, y, 150, ch, d, rot, hues[i]));
      const lt = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
      ctx.save(); font(ctx, ['Suez One', 400], 40); ctx.fillStyle = hexA(d.line, 0.55); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
      lt.forEach((ch, i) => { ctx.fillText(ch, W - 140 - i * ((W - 280) / 21), H - 120); });
      ctx.restore();
      return { x: 230, y: 400, w: W - 460, h: H - 400 - 230, bsd: [W - 140, 140], div: 'dot' };
    },
    upScissors(ctx, d) {
      bgFill(ctx, d, 'radial');
      bandBorder(ctx, d, 52, 112, 'diamond', 'magen');
      scissors(ctx, W / 2, 300, 230, d);
      [-1, 1].forEach((sd) => { sparkle(ctx, W / 2 + sd * 170, 250, 16, d.line); sparkle(ctx, W / 2 + sd * 240, 320, 9, d.line); });
      return { x: 240, y: 470, w: W - 480, h: H - 470 - 210, bsd: [W - 190, 190], div: 'sparkle' };
    },
    upTzitzis(ctx, d) {
      bgFill(ctx, d); grain(ctx, d.line, 0.03, 1800, 103);
      rectStroke(ctx, 60, 2.6, d.line); rectStroke(ctx, 80, 1.2, d.line);
      [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80]].forEach(([x, y]) => magen(ctx, x, y, 22, d.line, 2.2));
      tzitzis(ctx, W / 2, 130, 270, d);
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 700], 36); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('תורה צוה לנו משה', W / 2, 495); ctx.restore();
      return { x: 230, y: 530, w: W - 460, h: H - 530 - 200, bsd: [W - 170, 160], div: 'diamond' };
    },
    upHoney(ctx, d) {
      bgFill(ctx, d);
      lattice(ctx, d, 'dots', d.dark ? 0.3 : 0.35, 58);
      ctx.save(); ctx.fillStyle = d.dark ? mix(d.bg[0], '#000', 0.1) : '#fffdf7'; ctx.beginPath(); roundRectPath(ctx, 110, 110, W - 220, H - 220, 40); ctx.fill(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      honeyJar(ctx, W / 2 - 150, 430, 240, d);
      letterTile(ctx, W / 2 + 70, 360, 90, 'א', d, -0.1, '#d79a2b'); letterTile(ctx, W / 2 + 180, 395, 90, 'ב', d, 0.12, d.title);
      return { x: 230, y: 500, w: W - 460, h: H - 500 - 210, bsd: [W - 190, 180], div: 'dot' };
    },
    // ---- Chanukas Habayis
    chbDoor(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.line, 0.03, 1800, 107);
      rectStroke(ctx, 50, 3.4, d.line); rectStroke(ctx, 68, 1.2, d.line);
      cornerScroll(ctx, 88, 88, 1, 1, 110, d.line, 2.4); cornerScroll(ctx, W - 88, 88, -1, 1, 110, d.line, 2.4); cornerScroll(ctx, 88, H - 88, 1, -1, 110, d.line, 2.4); cornerScroll(ctx, W - 88, H - 88, -1, -1, 110, d.line, 2.4);
      doorway(ctx, W / 2, 500, 360, d);
      return { x: 240, y: 550, w: W - 480, h: H - 550 - 200, bsd: [W - 180, 170], div: 'flourish' };
    },
    chbKey(ctx, d) {
      bgFill(ctx, d);
      bandBorder(ctx, d, 54, 120, 'quatre', 'rosette');
      bigKey(ctx, W / 2, 300, 420, d);
      ctx.save(); font(ctx, ['Frank Ruhl Libre', 700], 34); ctx.fillStyle = d.muted; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('בית נאמן בישראל', W / 2, 420); ctx.restore();
      return { x: 250, y: 470, w: W - 500, h: H - 470 - 230, bsd: [W - 200, 200], div: 'diamond' };
    },
    chbHouse(ctx, d) {
      bgFill(ctx, d, 'radial');
      rectStroke(ctx, 70, 2.4, d.line, 30);
      starField(ctx, d, 40, 109, [180, 520, W - 360, H - 700]);
      house(ctx, W / 2, 470, 330, d);
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(300, 472); ctx.lineTo(W - 300, 472); ctx.stroke(); ctx.restore();
      return { x: 230, y: 530, w: W - 460, h: H - 530 - 210, bsd: [W - 150, 150], div: 'star' };
    },
    chbMezuzah(ctx, d) {
      bgFill(ctx, d);
      const g = metal(ctx, d.line, 0, 0, W, 0);
      ctx.save(); ctx.fillStyle = hexA(d.line, d.dark ? 0.2 : 0.14); ctx.fillRect(0, 0, 150, H); ctx.fillRect(W - 150, 0, 150, H); ctx.restore();
      ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, H); ctx.moveTo(W - 150, 0); ctx.lineTo(W - 150, H); ctx.stroke(); ctx.restore();
      for (let y = 120; y < H; y += 220) { magen(ctx, 75, y, 26, d.line, 2); magen(ctx, W - 75, y + 110, 26, d.line, 2); }
      mezuzah(ctx, W / 2, 290, 300, d);
      [-1, 1].forEach((sd) => { leaf(ctx, W / 2 + sd * 70, 330, 90, sd > 0 ? -0.5 : Math.PI + 0.5, d.line, true); leaf(ctx, W / 2 + sd * 80, 270, 70, sd > 0 ? -1 : Math.PI + 1, d.line, true); });
      return { x: 240, y: 480, w: W - 480, h: H - 480 - 170, bsd: [W - 220, 120], div: 'leaf' };
    },
    // ---- Siyum
    siyStack(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.line, 0.03, 1800, 113);
      rectStroke(ctx, 52, 4, d.line); rectStroke(ctx, 72, 1.4, d.line);
      const top = bookStack(ctx, W / 2, 470, 340, d);
      keser(ctx, W / 2, top - 14, 120, metal(ctx, d.line, W / 2 - 60, top - 80, W / 2 + 60, top));
      return { x: 230, y: 520, w: W - 460, h: H - 520 - 210, bsd: [W - 180, 170], div: 'flourish' };
    },
    siyGemara(ctx, d) {
      bgFill(ctx, d);
      bandBorder(ctx, d, 54, 116, 'leaf', 'rosette');
      gemaraPage(ctx, W / 2, 310, 520, 280, d);
      return { x: 250, y: 500, w: W - 500, h: H - 500 - 230, bsd: [W - 190, 190], div: 'diamond' };
    },
    siyQuill(ctx, d) {
      bgFill(ctx, d, 'radial');
      ctx.save(); ctx.strokeStyle = d.line; ctx.lineWidth = 3; ctx.beginPath(); roundRectPath(ctx, 80, 80, W - 160, H - 160, 50); ctx.stroke(); ctx.lineWidth = 1.2; ctx.beginPath(); roundRectPath(ctx, 100, 100, W - 200, H - 200, 36); ctx.stroke(); ctx.restore();
      torahScroll(ctx, W / 2 - 40, 300, 200, 150, d);
      quill(ctx, W / 2 + 190, 420, 260, d);
      ctx.save(); ctx.fillStyle = d.dark ? '#111' : '#222'; ctx.beginPath(); ctx.ellipse(W / 2 + 205, 425, 38, 14, 0, 0, TAU); ctx.fill(); ctx.fillRect(W / 2 + 170, 425, 70, 40); ctx.restore();
      return { x: 230, y: 520, w: W - 460, h: H - 520 - 200, bsd: [W - 170, 160], div: 'dot' };
    },
    // ---- Bar Mitzvah
    bmTefillin(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 127);
      rectStroke(ctx, 50, 3, d.line); rectStroke(ctx, 120, 3, d.line);
      for (let x = 120; x < W - 100; x += 68) { magen(ctx, x, 85, 14, d.line, 1.6); magen(ctx, x, H - 85, 14, d.line, 1.6); }
      for (let y = 160; y < H - 100; y += 68) { magen(ctx, 85, y, 14, d.line, 1.6); magen(ctx, W - 85, y, 14, d.line, 1.6); }
      if (!d.dark) glowAt(ctx, W / 2, 330, 260, d.line, 0.12);
      tefillin(ctx, W / 2, 450, 330, d);
      return { x: 240, y: 510, w: W - 480, h: H - 510 - 220, bsd: [W - 190, 190], div: 'star' };
    },
    bmKotel(ctx, d) {
      bgFill(ctx, d);
      kotel(ctx, d, H - 420, 420);
      ctx.save(); const fade = ctx.createLinearGradient(0, H - 440, 0, H - 300); fade.addColorStop(0, d.bg[1]); fade.addColorStop(1, hexA(d.bg[1], 0)); ctx.fillStyle = fade; ctx.fillRect(0, H - 440, W, 140); ctx.restore();
      rectStroke(ctx, 50, 3, d.line);
      keser(ctx, W / 2, 290, 140, metal(ctx, d.line, W / 2 - 80, 200, W / 2 + 80, 300));
      return { x: 230, y: 360, w: W - 460, h: H - 360 - 500, bsd: [W - 150, 140], div: 'diamond' };
    },
    bmRimonim(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 131);
      bandBorder(ctx, d, 56, 120, 'magen', 'magen');
      rimonim(ctx, W / 2 - 200, 440, 230, d); rimonim(ctx, W / 2 + 200, 440, 230, d);
      keser(ctx, W / 2, 400, 200, metal(ctx, d.line, W / 2 - 100, 280, W / 2 + 100, 400));
      return { x: 250, y: 510, w: W - 500, h: H - 510 - 230, bsd: [W - 200, 200], div: 'flourish' };
    },
    // ---- Kiddush (a girl)
    kdBlossom(ctx, d) {
      bgFill(ctx, d);
      rectStroke(ctx, 70, 1.8, d.line, 20);
      blossomBranch(ctx, 40, 230, 620, 0.1, d, 5); blossomBranch(ctx, W - 40, H - 240, 620, Math.PI + 0.1, d, 9);
      return { x: 230, y: 420, w: W - 460, h: H - 420 - 380, bsd: [W - 160, 150], div: 'leaf' };
    },
    kdLace(ctx, d) {
      bgFill(ctx, d);
      ctx.save(); ctx.fillStyle = hexA(d.line, 0.35);
      for (let x = 30; x < W; x += 60) { ctx.beginPath(); ctx.arc(x, 40, 26, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.arc(x, H - 40, 26, Math.PI, TAU); ctx.fill(); }
      ctx.restore();
      rectStroke(ctx, 100, 2, d.line, 14);
      blossomBranch(ctx, W / 2 - 300, 300, 600, 0, d, 21);
      return { x: 230, y: 430, w: W - 460, h: H - 430 - 220, bsd: [W - 170, 170], div: 'rosette' };
    },
    // ---- Chasuna / Vort / Sheva Brachos
    chChuppah(ctx, d) {
      bgFill(ctx, d, 'radial'); grain(ctx, d.dark ? '#ffffff' : d.line, 0.03, 2000, 137);
      rectStroke(ctx, 54, 3.2, d.line); rectStroke(ctx, 72, 1.2, d.line);
      chuppah(ctx, W / 2, 520, 400, d);
      return { x: 240, y: 560, w: W - 480, h: H - 560 - 210, bsd: [W - 180, 170], div: 'flourish' };
    },
    vtPlate(ctx, d) {
      bgFill(ctx, d);
      bandBorder(ctx, d, 54, 114, 'wave', 'rosette');
      brokenPlate(ctx, W / 2, 300, 140, d);
      ctx.save(); font(ctx, ['Suez One', 400], 46); ctx.fillStyle = d.title; ctx.textAlign = 'center'; ctx.direction = 'rtl'; ctx.fillText('מזל טוב', W / 2, 500); ctx.restore();
      return { x: 250, y: 540, w: W - 500, h: H - 540 - 220, bsd: [W - 190, 190], div: 'diamond' };
    },
    sbSeven(ctx, d) {
      bgFill(ctx, d, 'radial');
      starField(ctx, d, 60, 141, [180, 480, W - 360, H - 660]);
      rectStroke(ctx, 56, 2.6, d.line, 24);
      sevenLights(ctx, W / 2, 380, 330, d);
      return { x: 230, y: 520, w: W - 460, h: H - 520 - 210, bsd: [W - 150, 140], div: 'sparkle' };
    }
  };
  Object.assign(FRAMES, MORE_FRAMES);


  // ================================================================ Printed classics (Nov 2026, v2)
  // Typography-led cards the way frum printers print them: a plain stock, a big heavy Hebrew title, thin foil rules,
  // a die-cut card shape or a small ornament. Style ideas only (see the research notes); every line is drawn here.
  const K_SURF = { navygold: '#e6dfd1', navysilver: '#d8dce2', midnight: '#ddd5c4', denimgold: '#ebe4d6', blackgold: '#d6cfc2',
    burgundygold: '#e6dccf', emeraldgold: '#e3ded0', purplegold: '#e2dbe4', charcoalcopper: '#dcd4cb', powderblue: '#2b4163',
    skywhite: '#304a6d', whiteblue: '#22375a', creamnavy: '#24344f', silvergrey: '#40454f', ivorygold: '#2e3d4f',
    creamburgundy: '#5b1c2c', blushsilver: '#b79692', ivorysage: '#5c6d55', whitesilver: '#7f8794', tealsand: '#1f4d4a', navywhite: '#1d2f42',
    blushgold: '#c5a29a', ivorynavy: '#1e2d47' };
  function kSurface(ctx, d) { // fabric / linen the card lies on
    const c = d.surf || '#2e3d4f';
    const g = ctx.createRadialGradient(W * 0.45, H * 0.4, 100, W / 2, H / 2, H * 0.8);
    g.addColorStop(0, mix(c, '#ffffff', 0.12)); g.addColorStop(1, mix(c, '#000000', 0.22));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 6) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.globalAlpha = 0.04; ctx.strokeStyle = '#000000';
    for (let y = 0; y < H; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }
  // the card face: soft gradient + fine paper grain, clipped to `path`
  function kFace(ctx, d, path, shadow) {
    if (shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.38)'; ctx.shadowBlur = 46; ctx.shadowOffsetY = 22; ctx.fillStyle = d.bg[0]; ctx.beginPath(); path(ctx); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.beginPath(); path(ctx); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H); g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    grain(ctx, d.dark ? '#ffffff' : '#6b5a40', d.dark ? 0.025 : 0.035, 3500, 7);
    ctx.restore();
  }
  const kFull = () => (ctx) => ctx.rect(0, 0, W, H);
  function kRect(ctx, x, y, w, h) { ctx.rect(x, y, w, h); }
  function kFoil(ctx, d, x0, y0, x1, y1) { return metal(ctx, d.line, x0, y0, x1, y1); }
  function kRule(ctx, d, inset, lw, r) { ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = lw; ctx.beginPath();
    if (r) roundRectPath(ctx, inset, inset, W - inset * 2, H - inset * 2, r); else ctx.rect(inset, inset, W - inset * 2, H - inset * 2); ctx.stroke(); ctx.restore(); }
  function kDiamond(ctx, cx, cy, r, fill) { ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.62, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.62, cy); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // a symmetric scroll flourish, centred on (cx, cy), `w` wide; flip = -1 draws it upside down
  function kFlourish(ctx, cx, cy, w, color, flip) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, flip || 1); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
    [-1, 1].forEach((s) => {
      ctx.save(); ctx.scale(s, 1);
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(18, 0); ctx.bezierCurveTo(w * 0.16, -w * 0.09, w * 0.3, w * 0.07, w * 0.42, -w * 0.02); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); spiral(ctx, w * 0.42 + w * 0.03, -w * 0.035, w * 0.04, 1.2, Math.PI, 1); ctx.stroke();
      ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(w * 0.1, -w * 0.035); ctx.bezierCurveTo(w * 0.14, -w * 0.12, w * 0.24, -w * 0.12, w * 0.24, -w * 0.07); ctx.stroke();
      ctx.beginPath(); spiral(ctx, w * 0.215, -w * 0.075, w * 0.025, 1, 0, -1); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(w * 0.2, w * 0.03); ctx.bezierCurveTo(w * 0.27, w * 0.08, w * 0.34, w * 0.06, w * 0.36, w * 0.02); ctx.stroke();
      leaf(ctx, w * 0.3, -w * 0.06, w * 0.06, -0.9, color, true);
      ctx.beginPath(); ctx.arc(w * 0.5, -w * 0.02, 4.5, 0, TAU); ctx.fill();
      ctx.restore();
    });
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(10, -6, 0, 18); ctx.quadraticCurveTo(-10, -6, 0, -20); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -32, 5.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  const kBox = (x, y, w, h, div) => ({ x, y, w, h, bsd: [x + w - 20, y - 50], div: div || 'diamond' });

  // 1 · thick-and-thin double rule, little diamonds at the corners
  FRAMES.kDouble = function (ctx, d) {
    kFace(ctx, d, kFull());
    kRule(ctx, d, 62, 9); kRule(ctx, d, 86, 2.4);
    const f = kFoil(ctx, d, 0, 0, W, H);
    [[86, 86], [W - 86, 86], [86, H - 86], [W - 86, H - 86]].forEach(([x, y]) => kDiamond(ctx, x, y, 20, f));
    return kBox(170, 220, W - 340, H - 400, 'diamond');
  };
  // 2 · hairline frame with scroll corners and a crest flourish on top
  FRAMES.kCorners = function (ctx, d) {
    kFace(ctx, d, kFull());
    kRule(ctx, d, 74, 2.4);
    const f = kFoil(ctx, d, 0, 0, W, H);
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sy]) => cornerScroll(ctx, sx > 0 ? 96 : W - 96, sy > 0 ? 96 : H - 96, sx, sy, 150, f, 4));
    kFlourish(ctx, W / 2, 150, 420, f, 1);
    return kBox(180, 270, W - 360, H - 460, 'flourish');
  };
  // 3 · arched card lying on fabric
  FRAMES.kArch = function (ctx, d) {
    kSurface(ctx, d);
    const x = 150, y = 120, w = W - 300, h = H - 240, r = w / 2;
    const arch = (ix) => () => { ctx.moveTo(x + ix, y + h - ix); ctx.lineTo(x + ix, y + r); ctx.arc(W / 2, y + r, r - ix, Math.PI, 0); ctx.lineTo(x + w - ix, y + h - ix); ctx.closePath(); };
    kFace(ctx, d, arch(0), true);
    const f = kFoil(ctx, d, 0, 0, W, H);
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 6; ctx.beginPath(); arch(38)(); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); arch(56)(); ctx.stroke(); ctx.restore();
    kDiamond(ctx, W / 2, y + 100, 18, f);
    return kBox(x + 120, y + 330, w - 240, h - 430, 'dot');
  };
  // 4 · scalloped die-cut card on linen
  FRAMES.kScallop = function (ctx, d) {
    kSurface(ctx, d);
    const x = 130, y = 120, w = W - 260, h = H - 240, r = 26;
    const path = () => {
      const nx = Math.round(w / (r * 2)), ny = Math.round(h / (r * 2)), sx = w / nx, sy = h / ny;
      ctx.moveTo(x, y);
      for (let i = 0; i < nx; i++) ctx.arc(x + sx * (i + 0.5), y, sx / 2, Math.PI, 0, false);
      for (let i = 0; i < ny; i++) ctx.arc(x + w, y + sy * (i + 0.5), sy / 2, -Math.PI / 2, Math.PI / 2, false);
      for (let i = nx - 1; i >= 0; i--) ctx.arc(x + sx * (i + 0.5), y + h, sx / 2, 0, Math.PI, false);
      for (let i = ny - 1; i >= 0; i--) ctx.arc(x, y + sy * (i + 0.5), sy / 2, Math.PI / 2, Math.PI * 1.5, false);
      ctx.closePath();
    };
    kFace(ctx, d, path, true);
    const f = kFoil(ctx, d, 0, 0, W, H);
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.rect(x + 50, y + 50, w - 100, h - 100); ctx.stroke();
    ctx.setLineDash([2, 10]); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.rect(x + 68, y + 68, w - 136, h - 136); ctx.stroke(); ctx.restore();
    return kBox(x + 140, y + 200, w - 280, h - 330, 'star');
  };
  // 5 · coloured bands top and bottom with a foil edge
  FRAMES.kBands = function (ctx, d) {
    kFace(ctx, d, kFull());
    const band = d.dark ? mix(d.bg[0], '#000000', 0.35) : mix(d.nm, d.title, 0.2), bh = 150;
    ctx.save(); ctx.fillStyle = band; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
    const f = kFoil(ctx, d, 0, 0, W, 0);
    ctx.fillStyle = f; ctx.fillRect(0, bh, W, 8); ctx.fillRect(0, H - bh - 8, W, 8);
    ctx.fillRect(0, bh + 20, W, 2.5); ctx.fillRect(0, H - bh - 22, W, 2.5);
    ctx.restore();
    kDiamond(ctx, W / 2, bh + 4, 22, kFoil(ctx, d, 0, 0, W, H)); kDiamond(ctx, W / 2, H - bh - 4, 22, kFoil(ctx, d, 0, 0, W, H));
    return kBox(160, bh + 130, W - 320, H - bh * 2 - 230, 'deco');
  };
  // 6 · passe-partout: a contrasting mat around the printed panel
  FRAMES.kPanel = function (ctx, d) {
    const mat = d.dark ? mix(d.ink, '#ffffff', 0.35) : mix(d.nm, '#000000', 0.08);
    ctx.save(); ctx.fillStyle = mat; ctx.fillRect(0, 0, W, H); grain(ctx, d.dark ? '#000000' : '#ffffff', 0.04, 2500, 3); ctx.restore();
    const ins = 92;
    kFace(ctx, d, () => ctx.rect(ins, ins, W - ins * 2, H - ins * 2));
    kRule(ctx, d, ins + 28, 3); kRule(ctx, d, ins + 40, 1.2);
    return kBox(ins + 110, ins + 150, W - (ins + 110) * 2, H - (ins * 2 + 260), 'rosette');
  };
  // 7 · beaded border (pearl dots) between two hairlines
  FRAMES.kBeaded = function (ctx, d) {
    kFace(ctx, d, kFull());
    kRule(ctx, d, 58, 2); kRule(ctx, d, 104, 2);
    const f = kFoil(ctx, d, 0, 0, W, H), ins = 81, step = 24;
    ctx.save(); ctx.fillStyle = f;
    for (let x = ins; x <= W - ins + 1; x += (W - ins * 2) / Math.round((W - ins * 2) / step)) { [ins, H - ins].forEach((y) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }); }
    for (let y = ins; y <= H - ins + 1; y += (H - ins * 2) / Math.round((H - ins * 2) / step)) { [ins, W - ins].forEach((x) => { ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }); }
    ctx.restore();
    return kBox(190, 240, W - 380, H - 440, 'dot');
  };
  // 8 · art-deco stepped corners
  FRAMES.kDeco = function (ctx, d) {
    kFace(ctx, d, kFull());
    const f = kFoil(ctx, d, 0, 0, W, H);
    ctx.save(); ctx.strokeStyle = f; ctx.lineJoin = 'miter';
    [[70, 4], [92, 1.6], [108, 1.6]].forEach(([i, lw], k) => {
      const c = 60 - k * 12; ctx.lineWidth = lw; ctx.beginPath();
      ctx.moveTo(i + c, i); ctx.lineTo(W - i - c, i); ctx.lineTo(W - i - c, i + c); ctx.lineTo(W - i, i + c);
      ctx.lineTo(W - i, H - i - c); ctx.lineTo(W - i - c, H - i - c); ctx.lineTo(W - i - c, H - i); ctx.lineTo(i + c, H - i);
      ctx.lineTo(i + c, H - i - c); ctx.lineTo(i, H - i - c); ctx.lineTo(i, i + c); ctx.lineTo(i + c, i + c); ctx.closePath(); ctx.stroke();
    });
    // fan at the top
    ctx.lineWidth = 2.4; const cx = W / 2, cy = 190;
    for (let a = 0; a <= 12; a++) { const t = Math.PI + (a / 12) * Math.PI; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(t) * 90, cy + Math.sin(t) * 90); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy, 96, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 160, cy + 2); ctx.lineTo(cx + 160, cy + 2); ctx.stroke();
    ctx.restore();
    return kBox(190, 300, W - 380, H - 480, 'deco');
  };
  // 9 · oval cartouche
  FRAMES.kOval = function (ctx, d) {
    kFace(ctx, d, kFull());
    const f = kFoil(ctx, d, 0, 0, W, H), cx = W / 2, cy = H / 2, rx = 640, ry = 960;
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(cx, cy, rx - 22, ry - 22, 0, 0, TAU); ctx.stroke(); ctx.restore();
    kFlourish(ctx, cx, cy - ry - 2, 380, f, 1); kFlourish(ctx, cx, cy + ry + 2, 380, f, -1);
    return kBox(cx - 470, 420, 940, H - 840, 'sparkle');
  };
  // 10 · marble stock with a gold frame
  FRAMES.kMarble = function (ctx, d) {
    kFace(ctx, d, kFull());
    const r = rng(41); ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x0 = r() * W * 1.2 - W * 0.1, y0 = r() * H, len = 500 + r() * 900, a = -0.6 + r() * 0.5;
      ctx.strokeStyle = d.dark ? 'rgba(255,255,255,' + (0.05 + r() * 0.07) + ')' : 'rgba(90,90,100,' + (0.06 + r() * 0.09) + ')';
      ctx.lineWidth = 1 + r() * 3.5; ctx.beginPath(); ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x0 + Math.cos(a) * len * 0.3 + r() * 120, y0 + Math.sin(a) * len * 0.3 - 80, x0 + Math.cos(a) * len * 0.7 - r() * 120, y0 + Math.sin(a) * len * 0.7 + 80, x0 + Math.cos(a) * len, y0 + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
    kRule(ctx, d, 70, 5); kRule(ctx, d, 88, 1.6);
    return kBox(180, 230, W - 360, H - 420, 'flourish');
  };
  // 11 · watercolour wash edges, no frame
  FRAMES.kWash = function (ctx, d) {
    kFace(ctx, d, kFull());
    const r = rng(17), c = mix(d.line, d.nm, 0.25);
    ctx.save();
    [[0, 1], [H, -1]].forEach(([y0, dir]) => {
      const g = ctx.createLinearGradient(0, y0, 0, y0 + dir * 520); g.addColorStop(0, hexA(c, 0.2)); g.addColorStop(0.55, hexA(c, 0.06)); g.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y0 + dir * 520), W, 520);
      for (let i = 0; i < 9; i++) {
        const x = r() * W, y = y0 + dir * (r() * 260), rad = 260 + r() * 300;
        const gg = ctx.createRadialGradient(x, y, 0, x, y, rad); gg.addColorStop(0, hexA(c, 0.07)); gg.addColorStop(1, hexA(c, 0));
        ctx.fillStyle = gg; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
    });
    ctx.restore();
    const f = kFoil(ctx, d, 0, 0, W, H);
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 120, 170); ctx.lineTo(W / 2 + 120, 170); ctx.stroke(); ctx.restore();
    kDiamond(ctx, W / 2, 170, 14, f);
    return kBox(170, 260, W - 340, H - 450, 'leaf');
  };
  // 12 · ticket shape: inverted round corners, card on fabric
  FRAMES.kTicket = function (ctx, d) {
    kSurface(ctx, d);
    const x = 140, y = 130, w = W - 280, h = H - 260;
    const path = (ins, rr) => () => { const X = x + ins, Y = y + ins, Wd = w - ins * 2, Hd = h - ins * 2, R = rr;
      ctx.moveTo(X + R, Y); ctx.lineTo(X + Wd - R, Y); ctx.arc(X + Wd, Y, R, Math.PI, Math.PI / 2, true); ctx.lineTo(X + Wd, Y + Hd - R);
      ctx.arc(X + Wd, Y + Hd, R, -Math.PI / 2, -Math.PI, true); ctx.lineTo(X + R, Y + Hd); ctx.arc(X, Y + Hd, R, 0, -Math.PI / 2, true);
      ctx.lineTo(X, Y + R); ctx.arc(X, Y, R, Math.PI / 2, 0, true); ctx.closePath(); };
    kFace(ctx, d, path(0, 90), true);
    ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = 4; ctx.beginPath(); path(40, 70)(); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); path(56, 62)(); ctx.stroke(); ctx.restore();
    return kBox(x + 130, y + 210, w - 260, h - 360, 'star');
  };
  // 13 · minimal with a laurel crest on top
  FRAMES.kCrest = function (ctx, d) {
    kFace(ctx, d, kFull());
    kRule(ctx, d, 54, 1.6);
    const f = kFoil(ctx, d, 0, 0, W, H);
    laurel(ctx, W / 2, 200, 82, f);
    magen(ctx, W / 2, 196, 34, f, 3);
    return kBox(170, 340, W - 340, H - 500, 'leaf');
  };
  // 14 · layered cards: a tinted back card turned a little behind the printed card
  FRAMES.kLayer = function (ctx, d) {
    kSurface(ctx, d);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.045); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
    ctx.fillStyle = d.dark ? mix(d.line, '#000000', 0.15) : mix(d.title, '#ffffff', 0.55); ctx.fillRect(-W / 2 + 120, -H / 2 + 110, W - 240, H - 220); ctx.restore();
    const x = 165, y = 150, w = W - 330, h = H - 300;
    kFace(ctx, d, () => ctx.rect(x, y, w, h), true);
    ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = 3; ctx.strokeRect(x + 34, y + 34, w - 68, h - 68); ctx.restore();
    return kBox(x + 110, y + 170, w - 220, h - 290, 'diamond');
  };
  // 15 · open flourishes top and bottom (the classic heimish header ornament)
  FRAMES.kFlourish = function (ctx, d) {
    kFace(ctx, d, kFull());
    const f = kFoil(ctx, d, 0, 0, W, H);
    kFlourish(ctx, W / 2, 175, 640, f, 1); kFlourish(ctx, W / 2, H - 175, 640, f, -1);
    kRule(ctx, d, 46, 1.4);
    return kBox(170, 290, W - 340, H - 560, 'flourish');
  };
  // 16 · tone-on-tone lattice stock with a plain framed panel
  FRAMES.kLattice = function (ctx, d) {
    kFace(ctx, d, kFull());
    ctx.save(); ctx.strokeStyle = d.dark ? 'rgba(255,255,255,0.07)' : hexA(d.line, 0.22); ctx.lineWidth = 2;
    const s = 70;
    for (let y = -s; y < H + s; y += s) for (let x = -s; x < W + s; x += s) { const ox = ((y / s) % 2) * s / 2; ctx.beginPath(); ctx.moveTo(x + ox, y - s / 2); ctx.lineTo(x + ox + s / 2, y); ctx.lineTo(x + ox, y + s / 2); ctx.lineTo(x + ox - s / 2, y); ctx.closePath(); ctx.stroke(); }
    ctx.restore();
    const ins = 120;
    kFace(ctx, d, () => roundRectPath(ctx, ins, ins, W - ins * 2, H - ins * 2, 30));
    ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = 4; ctx.beginPath(); roundRectPath(ctx, ins, ins, W - ins * 2, H - ins * 2, 30); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); roundRectPath(ctx, ins + 18, ins + 18, W - ins * 2 - 36, H - ins * 2 - 36, 20); ctx.stroke(); ctx.restore();
    return kBox(ins + 100, ins + 140, W - (ins + 100) * 2, H - (ins * 2 + 240), 'rosette');
  };
  // 17 · wide bevelled foil frame, like a gilt picture frame
  FRAMES.kGilt = function (ctx, d) {
    kFace(ctx, d, kFull());
    const b = 64, m = 40;
    ctx.save();
    const sides = [[m, m, W - m, m, W - m - b, m + b, m + b, m + b, 0, m, 0, m + b], [W - m, m, W - m, H - m, W - m - b, H - m - b, W - m - b, m + b, W - m, 0, W - m - b, 0],
      [W - m, H - m, m, H - m, m + b, H - m - b, W - m - b, H - m - b, 0, H - m, 0, H - m - b], [m, H - m, m, m, m + b, m + b, m + b, H - m - b, m, 0, m + b, 0]];
    sides.forEach((p) => { const g = ctx.createLinearGradient(p[8], p[9], p[10], p[11]);
      const c = d.line; g.addColorStop(0, mix(c, '#000000', 0.35)); g.addColorStop(0.35, mix(c, '#ffffff', 0.5)); g.addColorStop(0.6, c); g.addColorStop(1, mix(c, '#000000', 0.25));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.lineTo(p[6], p[7]); ctx.closePath(); ctx.fill(); });
    ctx.strokeStyle = mix(d.line, '#000000', 0.4); ctx.lineWidth = 2; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.strokeRect(m + b, m + b, W - (m + b) * 2, H - (m + b) * 2);
    ctx.fillStyle = mix(d.line, '#ffffff', 0.3);
    const ins = m + b + 18; for (let x = ins; x < W - ins; x += 20) { ctx.beginPath(); ctx.arc(x, ins, 3.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, H - ins, 3.5, 0, TAU); ctx.fill(); }
    for (let y = ins; y < H - ins; y += 20) { ctx.beginPath(); ctx.arc(ins, y, 3.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(W - ins, y, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
    return kBox(220, 280, W - 440, H - 500, 'diamond');
  };
  // 18 · a deckled, torn-edge card on fabric with a ribbon band
  FRAMES.kRibbon = function (ctx, d) {
    kSurface(ctx, d);
    const x = 150, y = 130, w = W - 300, h = H - 260, r = rng(5);
    const path = () => { ctx.moveTo(x, y); for (let i = 0; i <= 60; i++) ctx.lineTo(x + w * i / 60, y + (r() - 0.5) * 7);
      for (let i = 0; i <= 80; i++) ctx.lineTo(x + w + (r() - 0.5) * 7, y + h * i / 80); for (let i = 60; i >= 0; i--) ctx.lineTo(x + w * i / 60, y + h + (r() - 0.5) * 7);
      for (let i = 80; i >= 0; i--) ctx.lineTo(x + (r() - 0.5) * 7, y + h * i / 80); ctx.closePath(); };
    kFace(ctx, d, path, true);
    // satin ribbon across the lower third
    const ry = y + h - 300, rc = d.dark ? mix(d.line, '#ffffff', 0.1) : mix(d.title, d.nm, 0.4);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    const g = ctx.createLinearGradient(0, ry, 0, ry + 46); g.addColorStop(0, mix(rc, '#ffffff', 0.25)); g.addColorStop(0.5, rc); g.addColorStop(1, mix(rc, '#000000', 0.2));
    ctx.fillStyle = g; ctx.fillRect(0, ry, W, 46); ctx.restore();
    ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = 2; ctx.strokeRect(x + 46, y + 46, w - 92, h - 92); ctx.restore();
    return kBox(x + 120, y + 180, w - 240, ry - y - 220, 'dot');
  };


  // 19 · parchment scroll with rolled ends
  FRAMES.kScroll = function (ctx, d) {
    kSurface(ctx, d);
    const x = 190, w = W - 380, y0 = 230, y1 = H - 230, rr = 62;
    kFace(ctx, d, () => ctx.rect(x, y0, w, y1 - y0), true);
    ctx.save(); const sh = ctx.createLinearGradient(0, y0, 0, y0 + 120); sh.addColorStop(0, 'rgba(60,40,10,0.18)'); sh.addColorStop(1, 'rgba(60,40,10,0)');
    ctx.fillStyle = sh; ctx.fillRect(x, y0, w, 120); const sh2 = ctx.createLinearGradient(0, y1, 0, y1 - 120); sh2.addColorStop(0, 'rgba(60,40,10,0.18)'); sh2.addColorStop(1, 'rgba(60,40,10,0)'); ctx.fillStyle = sh2; ctx.fillRect(x, y1 - 120, w, 120); ctx.restore();
    [y0, y1].forEach((cy) => {
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      const g = ctx.createLinearGradient(0, cy - rr, 0, cy + rr); const c0 = d.dark ? d.bg[1] : d.bg[0];
      g.addColorStop(0, mix(c0, '#000000', 0.25)); g.addColorStop(0.35, mix(c0, '#ffffff', 0.3)); g.addColorStop(0.7, c0); g.addColorStop(1, mix(c0, '#000000', 0.35));
      ctx.fillStyle = g; ctx.beginPath(); roundRectPath(ctx, x - 40, cy - rr, w + 80, rr * 2, rr); ctx.fill(); ctx.restore();
      ctx.save(); [x - 40, x + w + 40].forEach((ex) => { const eg = ctx.createRadialGradient(ex, cy, 4, ex, cy, rr); eg.addColorStop(0, mix(d.line, '#ffffff', 0.4)); eg.addColorStop(1, mix(d.line, '#000000', 0.3));
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(ex, cy, 26, rr, 0, 0, TAU); ctx.fill(); }); ctx.restore();
    });
    ctx.save(); ctx.strokeStyle = kFoil(ctx, d, 0, 0, W, H); ctx.lineWidth = 2.4; ctx.strokeRect(x + 50, y0 + 110, w - 100, y1 - y0 - 220); ctx.restore();
    return kBox(x + 110, y0 + 200, w - 220, y1 - y0 - 370, 'flourish');
  };
  // 20 · classical columns with a pediment arch (architectural frame)
  FRAMES.kColumns = function (ctx, d) {
    kFace(ctx, d, kFull());
    const f = kFoil(ctx, d, 0, 0, W, H), cw = 70, lx = 110, rx = W - 110 - cw, top = 330, bot = H - 140;
    ctx.save(); ctx.strokeStyle = f; ctx.fillStyle = f; ctx.lineWidth = 3;
    [lx, rx].forEach((cx) => {
      ctx.strokeRect(cx, top, cw, bot - top);
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx + cw * k / 4, top + 40); ctx.lineTo(cx + cw * k / 4, bot - 40); ctx.stroke(); }
      ctx.fillRect(cx - 18, top - 26, cw + 36, 14); ctx.fillRect(cx - 12, top - 12, cw + 24, 8);
      ctx.fillRect(cx - 18, bot + 12, cw + 36, 14); ctx.fillRect(cx - 12, bot + 4, cw + 24, 8);
    });
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(lx - 18, top - 26); ctx.lineTo(lx - 18, top - 60); ctx.arc(W / 2, top - 60, (rx + cw + 18 - (lx - 18)) / 2, Math.PI, 0); ctx.lineTo(rx + cw + 18, top - 26); ctx.stroke();
    ctx.lineWidth = 2; const R = (rx + cw + 18 - (lx - 18)) / 2; ctx.beginPath(); ctx.arc(W / 2, top - 60, R - 22, Math.PI, 0); ctx.stroke();
    ctx.fillRect(lx - 30, bot + 26, rx + cw + 60 - lx, 10);
    ctx.restore();
    kDiamond(ctx, W / 2, top - 60 - R + 50, 20, f);
    return kBox(lx + cw + 50, top + 10, rx - lx - cw - 100, bot - top - 60, 'diamond');
  };
  // 21 · honeycomb (hexagon) line border
  FRAMES.kHex = function (ctx, d) {
    kFace(ctx, d, kFull());
    const f = kFoil(ctx, d, 0, 0, W, H), s = 34, hw = Math.sqrt(3) * s;
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 2.2;
    const hex = (cx, cy) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s; if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke(); };
    for (let row = 0; row * s * 1.5 < H + s; row++) { const cy = row * s * 1.5; const off = (row % 2) * hw / 2;
      for (let cx = -hw + off; cx < W + hw; cx += hw) { const inner = cx > 150 && cx < W - 150 && cy > 150 && cy < H - 150; if (!inner) hex(cx, cy); } }
    ctx.restore();
    const ins = 150;
    ctx.save(); ctx.fillStyle = d.bg[0]; ctx.fillRect(ins - 20, ins - 20, W - (ins - 20) * 2, H - (ins - 20) * 2); ctx.restore();
    kRule(ctx, d, ins - 20, 4); kRule(ctx, d, ins - 4, 1.4);
    return kBox(ins + 70, ins + 120, W - (ins + 70) * 2, H - (ins * 2 + 210), 'dot');
  };
  // 22 · hanging tag: clipped corners, eyelet and a ribbon loop
  FRAMES.kTag = function (ctx, d) {
    kSurface(ctx, d);
    const x = 170, y = 200, w = W - 340, h = H - 300, c = 190;
    const path = () => { ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c); ctx.closePath(); };
    kFace(ctx, d, path, true);
    const f = kFoil(ctx, d, 0, 0, W, H);
    ctx.save(); ctx.strokeStyle = f; ctx.lineWidth = 3; ctx.beginPath();
    const i = 40; ctx.moveTo(x + c + i * 0.4, y + i); ctx.lineTo(x + w - c - i * 0.4, y + i); ctx.lineTo(x + w - i, y + c + i * 0.4); ctx.lineTo(x + w - i, y + h - i); ctx.lineTo(x + i, y + h - i); ctx.lineTo(x + i, y + c + i * 0.4); ctx.closePath(); ctx.stroke(); ctx.restore();
    // eyelet + string
    ctx.save(); ctx.fillStyle = kSurfaceTone(d); ctx.beginPath(); ctx.arc(W / 2, y + 110, 26, 0, TAU); ctx.fill();
    ctx.strokeStyle = f; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(W / 2, y + 110, 30, 0, TAU); ctx.stroke();
    ctx.strokeStyle = d.dark ? mix(d.line, '#ffffff', 0.2) : mix(d.title, d.nm, 0.3); ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(W / 2 - 8, y + 96); ctx.bezierCurveTo(W / 2 - 60, y - 40, W / 2 - 280, y - 120, W / 2 - 420, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2 + 8, y + 96); ctx.bezierCurveTo(W / 2 + 70, y - 50, W / 2 + 260, y - 130, W / 2 + 380, -20); ctx.stroke();
    ctx.restore();
    return kBox(x + 120, y + 230, w - 240, h - 330, 'star');
  };
  function kSurfaceTone(d) { return d.surf || '#2e3d4f'; }

  // the v2 collection: every layout × the stocks that suit each simcha
  const K_LAYOUTS = [
    ['kDouble', 'Double Rule', 'דאפלטע ליניע', 'kHeim'], ['kArch', 'Arched Card', 'בויגן קארטל', 'kHeim', 1], ['kCorners', 'Scroll Corners', 'ווינקל צירונג', 'kNoto'],
    ['kScallop', 'Scalloped Edge', 'וועלן ראנד', 'kSuez'], ['kFlourish', 'Classic Flourish', 'קלאסישע צירונג', 'kHeim', 1], ['kBeaded', 'Pearl Border', 'פערל ראנד', 'kDavid'],
    ['kTicket', 'Die-cut Card', 'אויסגעשניטן קארטל', 'kNoto'], ['kGilt', 'Gilt Frame', 'גאלדענע ראם', 'kHeim'], ['kPanel', 'Matted Panel', 'פאנעל', 'kScript'],
    ['kOval', 'Oval Cartouche', 'אוואלע ראם', 'kSuez', 1], ['kMarble', 'Marble & Gold', 'מירמל מיט גאלד', 'kNoto'], ['kBands', 'Foil Bands', 'פאסן', 'kBlock'],
    ['kLayer', 'Layered Card', 'צוויי שיכטן', 'kHeim'], ['kCrest', 'Laurel Crest', 'קראנץ', 'kMiriam'], ['kDeco', 'Art Deco', 'ארט דעקא', 'kSuez'],
    ['kWash', 'Watercolour Edge', 'וואסערפארב', 'kDavid', 1], ['kLattice', 'Lattice Stock', 'גיטער', 'kNoto'], ['kRibbon', 'Ribbon & Deckle', 'בענדל', 'kScript', 1],
    ['kScroll', 'Parchment Scroll', 'מגילה', 'kHeim', 1], ['kColumns', 'Columns & Arch', 'זיילן', 'kNoto'], ['kHex', 'Honeycomb Border', 'האניק ראם', 'kBlock'], ['kTag', 'Hanging Tag', 'הענגל קארטל', 'kSuez', 1]
  ];
  Object.assign(PALETTES, {
    blushgold: { name: { en: 'Blush & Gold', yi: 'ראזע מיט גאלד' }, color: 'pink',
      bg: ['#fcf3f0', '#f3e1dc'], ink: '#4a3436', title: '#9b6a55', nm: '#4b2b33', muted: '#8a7174', line: '#c19a62' },
    ivorynavy: { name: { en: 'Ivory & Navy', yi: 'עלפנביין מיט בלוי' }, color: 'cream',
      bg: ['#fdfaf2', '#f2ebdc'], ink: '#1d2a40', title: '#1f3558', nm: '#14223a', muted: '#636a75', line: '#a98c58' }
  });
  Object.assign(FONTSETS, {
    kHeim:   { fy: ['Frank Ruhl Libre', 900], fe: ['Playfair Display', 700], by: ['Frank Ruhl Libre', 500], be: ['EB Garamond', 500] },
    kSuez:   { fy: ['Suez One', 400], fe: ['Cinzel', 700], by: ['Noto Serif Hebrew', 500], be: ['Cormorant Garamond', 500] },
    kNoto:   { fy: ['Noto Serif Hebrew', 900], fe: ['Playfair Display', 700], by: ['Noto Serif Hebrew', 500], be: ['EB Garamond', 500] },
    kBlock:  { fy: ['Heebo', 900], fe: ['Bona Nova', 700], by: ['Assistant', 500], be: ['EB Garamond', 500] },
    kDavid:  { fy: ['David Libre', 700], fe: ['Cormorant Garamond', 700], by: ['David Libre', 400], be: ['Cormorant Garamond', 500] },
    kScript: { fy: ['Frank Ruhl Libre', 900], fe: ['Great Vibes', 400], by: ['Frank Ruhl Libre', 500], be: ['Cormorant Garamond', 500], etrack: 0, escale: 1.3 },
    kMiriam: { fy: ['Miriam Libre', 700], fe: ['Cinzel', 700], by: ['Miriam Libre', 400], be: ['EB Garamond', 500] }
  });
  // which stocks each simcha gets (boys: navy / silver / baby blue / gold first)
  const K_GROUPS = {
    boy:   { types: ['bris', 'vachnacht', 'shalomzachor', 'pidyonhaben'], pals: ['ivorynavy', 'navygold', 'powderblue', 'navysilver', 'whiteblue', 'midnight', 'creamnavy', 'skywhite', 'silvergrey', 'denimgold', 'whitesilver', 'ivorygold'] },
    wed:   { types: ['chasuna', 'vort', 'shevabrachos'], pals: ['ivorygold', 'navygold', 'blackgold', 'creamburgundy', 'whitesilver', 'burgundygold', 'ivorysage', 'blushgold', 'emeraldgold', 'ivorynavy', 'creamnavy', 'blushsilver'] },
    bm:    { types: ['barmitzvah', 'siyum'], pals: ['navygold', 'blackgold', 'ivorynavy', 'burgundygold', 'emeraldgold', 'ivorygold', 'midnight', 'charcoalcopper', 'creamnavy', 'navysilver', 'whitesilver', 'purplegold'] },
    girl:  { types: ['kiddush'], pals: ['blushgold', 'blushsilver', 'ivorygold', 'whitesilver', 'ivorysage', 'creamburgundy', 'tealsand', 'skywhite', 'purplegold', 'ivorynavy', 'emeraldgold', 'navygold'] },
    home:  { types: ['chanukashabayis', 'upsherin', 'general'], pals: ['ivorygold', 'navygold', 'ivorysage', 'emeraldgold', 'ivorynavy', 'tealsand', 'creamnavy', 'blackgold', 'whiteblue', 'burgundygold', 'charcoalcopper', 'powderblue'] }
  };
  const K_FAVS = { kArch: 1, kDouble: 1, kGilt: 1, kScroll: 1, kFlourish: 1 };   // the looks David picked (Nov 1, first row)
  const K_WEAK = { kBands: 1, kHex: 1, kLattice: 1, kWash: 1, kPanel: 1, kCrest: 1 };  // built (links work) but not listed
  const K_DESIGNS = [];
  (function buildClassics() {
    const byId = {};
    const per = 4;   // stocks per layout per group → 22 × 4 = 88 per simcha
    Object.keys(K_GROUPS).forEach((gk, gi) => {
      const G = K_GROUPS[gk];
      K_LAYOUTS.forEach((Ly, li) => {
        const n = K_FAVS[Ly[0]] ? 8 : per;
        for (let j = 0; j < n; j++) {
          let pk = G.pals[(li * 5 + j * 7 + gi) % G.pals.length];
          if (Ly[0] === 'kWash') for (let s = 1; PALETTES[pk].dark && s < G.pals.length; s++) pk = G.pals[(li * 5 + j * 7 + gi + s) % G.pals.length];
          const id = 'pc-' + Ly[0].slice(1).toLowerCase() + '-' + pk;
          let d = byId[id];
          if (!d) {
            const p = PALETTES[pk], fs = FONTSETS[Ly[3]];
            const solid = !p.dark && ((li + j) % 2 === 0);      // half the light cards: a solid dark title; the other half deep gold foil
            d = Object.assign({ id, type: G.types[0], also: [], isNew: true, isV2: true, family: Ly[0], frame: Ly[0], palette: pk, color: p.color, dark: !!p.dark,
              name: { en: Ly[1] + ' · ' + p.name.en, yi: Ly[2] + ' · ' + p.name.yi }, bg: p.bg, ink: p.ink, title: solid ? p.nm : p.title, nm: p.nm, muted: p.muted, line: p.line,
              foil: p.dark ? (/silver|white/.test(pk) || pk === 'navysilver' ? 'silver' : 'lightgold') : (solid ? null : (/blush/.test(pk) ? 'rose' : (/silver|blue|sky|grey/.test(pk) ? 'blue' : 'deepgold'))),
              surf: K_SURF[pk], stack: !!Ly[4], round: j * 100 + li }, fs);
            if (pk === 'navysilver') d.foil = 'silver';
            if (K_FAVS[Ly[0]] && !p.dark) { d.title = p.title; d.foil = /blush/.test(pk) ? 'rose' : 'gold'; }   // the big 3D gold-foil title David liked
            if (K_FAVS[Ly[0]]) d.stack = true;
            byId[id] = d; K_DESIGNS.push(d);
          }
          G.types.forEach((t) => { if (t !== d.type && !d.also.includes(t)) d.also.push(t); });
        }
      });
    });
    K_DESIGNS.sort((a, b) => a.round - b.round);
    K_DESIGNS.forEach((d) => DESIGNS.push(d));
    K_LAYOUTS.forEach((Ly) => { FAMILY_NAMES[Ly[0]] = { en: Ly[1], yi: Ly[2] }; });
  })();

  // ---- retired from the gallery (Nov 1 2026): the illustrated / clip-art designs. Their ids still resolve, so links already shared keep opening.
  const RETIRED_FAMILY = /^(b[A-Z]|bris[A-Z]|vn[A-Z]|sz[A-Z]|ph[A-Z]|up[A-Z]|chb[A-Z]|siy[A-Z]|bm[A-Z]|kd[A-Z]|ch[A-Z]|vt[A-Z]|sb[A-Z])/;
  const RETIRED_IDS = { 'scene-sky': 1, 'scene-nursery': 1 };
  DESIGNS.forEach((d) => { const f = d.family || d.frame || ''; if (RETIRED_FAMILY.test(f) || RETIRED_IDS[d.id] || f === 'yerushalayim' || f === 'kosel' || K_WEAK[f]) d.retired = true; });

  // ---- font picker (title font + text font), per card language
  const FONT_PICK = {
    title: {
      yi: [['frank', 'Frank Ruhl', ['Frank Ruhl Libre', 900]], ['suez', 'Suez', ['Suez One', 400]], ['notoserif', 'Noto Serif', ['Noto Serif Hebrew', 900]],
        ['david', 'David', ['David Libre', 700]], ['miriam', 'Miriam', ['Miriam Libre', 700]], ['bellefair', 'Bellefair', ['Bellefair', 400]],
        ['heebo', 'Heebo', ['Heebo', 900]], ['rubik', 'Rubik', ['Rubik', 800]], ['secular', 'Secular', ['Secular One', 400]],
        ['karantina', 'Karantina', ['Karantina', 700]], ['rashi', 'רש״י', ['Noto Rashi Hebrew', 500]], ['amatic', 'Amatic', ['Amatic SC', 700]]],
      en: [['cinzel', 'Cinzel', ['Cinzel', 700]], ['playfair', 'Playfair Display', ['Playfair Display', 700]], ['cormorant', 'Cormorant Garamond', ['Cormorant Garamond', 700]],
        ['ebgaramond', 'EB Garamond', ['EB Garamond', 600]], ['marcellus', 'Marcellus', ['Marcellus', 400]], ['italiana', 'Italiana', ['Italiana', 400]],
        ['bonanova', 'Bona Nova', ['Bona Nova', 700]], ['greatvibes', 'Great Vibes (script)', ['Great Vibes', 400]], ['parisienne', 'Parisienne (script)', ['Parisienne', 400]],
        ['pinyon', 'Pinyon Script', ['Pinyon Script', 400]]]
    },
    body: {
      yi: [['frank', 'Frank Ruhl', ['Frank Ruhl Libre', 500]], ['notoserif', 'Noto Serif', ['Noto Serif Hebrew', 500]], ['david', 'David', ['David Libre', 400]],
        ['miriam', 'Miriam', ['Miriam Libre', 400]], ['bellefair', 'Bellefair', ['Bellefair', 400]], ['assistant', 'Assistant', ['Assistant', 500]], ['heebo', 'Heebo', ['Heebo', 400]]],
      en: [['cormorant', 'Cormorant Garamond', ['Cormorant Garamond', 500]], ['ebgaramond', 'EB Garamond', ['EB Garamond', 500]], ['playfair', 'Playfair Display', ['Playfair Display', 400]],
        ['marcellus', 'Marcellus', ['Marcellus', 400]], ['assistant', 'Assistant', ['Assistant', 500]], ['heebo', 'Heebo', ['Heebo', 400]]]
    }
  };
  const SCRIPT_FONTS = { 'Great Vibes': 1, 'Parisienne': 1, 'Pinyon Script': 1 };
  function pickFont(kind, lang, key) { const l = FONT_PICK[kind][lang === 'en' ? 'en' : 'yi']; const f = key && l.find((x) => x[0] === key); return f ? f[2] : null; }
  // the design as drawn for this invitation: the chosen fonts replace the design's own
  function effDesign(data) {
    const d = designById(data.d);
    const lang = data.l === 'en' ? 'en' : 'yi';
    const t = pickFont('title', lang, data.ft), b = pickFont('body', lang, data.fb);
    if (!t && !b) return d;
    const o = Object.assign({}, d, { id: d.id + '|' + (data.ft || '') + '|' + (data.fb || '') });
    if (t) { if (lang === 'en') { o.fe = t; o.etrack = SCRIPT_FONTS[t[0]] ? 0 : undefined; o.escale = SCRIPT_FONTS[t[0]] ? 1.3 : 1; } else o.fy = t; }
    if (b) { if (lang === 'en') o.be = b; else o.by = b; }
    return o;
  }

  // photo scenes: a printed card's title is big and solid, stacked like the printers set it
  DESIGNS.filter((d) => d.isScene && d.isV2).forEach((d, i) => { const fs = FONTSETS[['kHeim', 'kNoto', 'kSuez', 'kHeim'][i % 4]]; d.fy = fs.fy; d.fe = fs.fe; d.by = fs.by; d.be = fs.be; });
  const V2_SCENE_GOLD = [];
  DESIGNS.forEach((d, i) => { if (d.isScene) { d.stack = true; if (!d.dark && (d.isV2 || (i % 3) !== 2 || !/^(gold|rose)$/.test(d.foil || ''))) { d.title = d.nm; d.foil = null; } } });
  DESIGNS.filter((d) => d.isScene && d.isV2 && !d.dark).forEach((d, i) => { if (i % 2) { d.foil = 'deepgold'; d.title = '#8a6526'; } });
  // only the v2 collection (and new photo scenes) carry the "New" badge now
  DESIGNS.forEach((d) => { if (!d.isV2) d.isNew = false; });

  function paint(ctx, data, img) {
    const d = effDesign(data);
    ctx.save();
    const box = FRAMES[d.frame](ctx, d, data, img);
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
    const d = effDesign(data);
    scale = scale || 1;
    const [, img] = await Promise.all([ensureFonts(d), d.scene ? loadScene(d.scene.k, scale < 0.3) : null]);
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    paint(ctx, data, img);
    return canvas;
  }

  // ---------------------------------------------------------------- link encoding
  const KEYS = ['t', 'd', 'l', 'p', 's', 'm', 'h1', 'h2', 'dt', 'hd', 'pr', 'tm', 'v', 'a', 'n', 'r', 'w', 'ti', 'ft', 'fb'];
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

  // Photo scenes and dark designs go out as JPEG (a PNG of a photograph is 5–8 MB); the light drawn designs stay PNG.
  function photoLike(data) { const d = designById(data.d); return !!(d.isScene || d.dark); }
  function imgExt(data) { return photoLike(data) ? '.jpg' : '.png'; }
  function imgType(data) { return photoLike(data) ? 'image/jpeg' : 'image/png'; }
  async function pngBlob(data) { const c = await fullCanvas(data); return photoLike(data) ? canvasBlob(c, 'image/jpeg', 0.9) : canvasBlob(c, 'image/png'); }

  // PDFs written by hand (no library): the card as a full-resolution JPEG; the letter page adds a QR code to the online invitation.
  function buildPdf(pageW, pageH, images) {
    const enc = new TextEncoder();
    const parts = []; const offsets = []; let len = 0;
    const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const obj = (n, body) => { offsets[n] = len; push(n + ' 0 obj\n'); body(); push('\nendobj\n'); };
    const content = images.map((im, i) => 'q ' + im.w + ' 0 0 ' + im.h + ' ' + im.x + ' ' + im.y + ' cm /Im' + i + ' Do Q').join('\n');
    const xobjs = images.map((im, i) => '/Im' + i + ' ' + (5 + i) + ' 0 R').join(' ');
    const n = 4 + images.length;
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    obj(3, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << ' + xobjs + ' >> >> /Contents 4 0 R >>'));
    obj(4, () => push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'));
    images.forEach((im, i) => obj(5 + i, () => { push('<< /Type /XObject /Subtype /Image /Width ' + im.pw + ' /Height ' + im.ph + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.jpg.length + ' >>\nstream\n'); push(im.jpg); push('\nendstream'); }));
    const xref = len;
    let x = 'xref\n0 ' + (n + 1) + '\n0000000000 65535 f \n';
    for (let i = 1; i <= n; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(x + 'trailer\n<< /Size ' + (n + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }
  async function jpegOf(canvas, q) { return new Uint8Array(await (await canvasBlob(canvas, 'image/jpeg', q)).arrayBuffer()); }
  async function pdfBlob(data) {
    const canvas = await fullCanvas(data);
    return buildPdf(360, 504, [{ x: 0, y: 0, w: 360, h: 504, pw: canvas.width, ph: canvas.height, jpg: await jpegOf(canvas, 0.95) }]);
  }
  // QR code (vendored qrcode-generator, MIT) — loaded only when a letter PDF is made; nothing leaves the phone.
  let qrLib = null;
  function loadQr() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!qrLib) qrLib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/qrcode.js'; s.onload = () => res(window.qrcode); s.onerror = rej; document.head.appendChild(s); });
    return qrLib;
  }
  async function qrPanel(link, lang) {
    const qrcode = await loadQr();
    const qr = qrcode(0, 'M'); qr.addData(link); qr.make();
    const n = qr.getModuleCount(), quiet = 4, cell = Math.max(6, Math.floor(1000 / (n + quiet * 2)));
    const side = (n + quiet * 2) * cell, capH = 230;
    const c = document.createElement('canvas'); c.width = 1800; c.height = side + capH;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    const ox = (c.width - side) / 2; ctx.fillStyle = '#111';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) ctx.fillRect(ox + (k + quiet) * cell, (r + quiet) * cell, cell, cell);
    await (document.fonts && document.fonts.load ? document.fonts.load('600 60px "Frank Ruhl Libre"', 'אבג').catch(() => null) : null);
    ctx.textAlign = 'center'; ctx.fillStyle = '#3b3326';
    ctx.font = '600 62px "Frank Ruhl Libre", serif'; ctx.direction = 'rtl';
    ctx.fillText('סקענט פאר וועגווייזער, קאלענדאר און ענטפערן', c.width / 2, side + 80);
    ctx.direction = 'ltr'; ctx.font = '500 52px "Cormorant Garamond", "Frank Ruhl Libre", serif';
    ctx.fillText('Scan for directions, calendar & RSVP', c.width / 2, side + 170);
    return c;
  }
  // US letter page: the 5×7 card centred at the top, the QR code to the online invitation underneath.
  async function pdfLetterBlob(data, link) {
    const card = await fullCanvas(data);
    const imgs = [{ x: 126, y: 792 - 54 - 504, w: 360, h: 504, pw: card.width, ph: card.height, jpg: await jpegOf(card, 0.95) }];
    if (link) {
      const p = await qrPanel(link, data.l);
      const w = 300, h = Math.round(w * p.height / p.width);
      imgs.push({ x: (612 - w) / 2, y: 792 - 54 - 504 - 26 - h, w, h, pw: p.width, ph: p.height, jpg: await jpegOf(p, 0.92) });
    }
    return buildPdf(612, 792, imgs);
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
      shalomzachor: { h1: yi ? 'ר׳ אהרן ליכטענשטיין' : 'Mr. & Mrs. Aharon Lichtenstein', tm: '21:00' },
      vachnacht: { h1: yi ? 'ר׳ אהרן ליכטענשטיין' : 'Mr. & Mrs. Aharon Lichtenstein', tm: '20:00' },
      pidyonhaben: { h1: yi ? 'ר׳ מרדכי הורוויץ' : 'Mr. & Mrs. Mordechai Horowitz', tm: '18:00' },
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
    if (!state || typeof state !== 'object') state = fromSample((K_DESIGNS.find((d) => d.type === 'chasuna') || { id: 'royal' }).id, 'chasuna', 'yi');
    if (state.ps === undefined) state.ps = 1;
    // While the form still holds the sample wording, switching design/simcha/language swaps in matching samples.
    const reSample = () => { if (state.sm) { const f = { ft: state.ft, fb: state.fb }; state = Object.assign(fromSample(state.d, state.t, state.l === 'en' ? 'en' : 'yi'), f); } };

    const m = /^#make=([a-z][a-z-]*)(?:&t=([a-z]+))?/.exec(location.hash);
    if (m) { const d = designById(m[1]); state.d = d.id; state.t = (m[2] && TYPES[m[2]]) ? m[2] : d.type; reSample(); }

    // hero: three photo-scene invitations fanned out, drawn live in the page's language
    const fan = $('#invHeroFan');
    if (fan) {
      const heroLang = siteLang() === 'en' ? 'en' : 'yi';
      const picks = [['scene-briscream', 'bris'], ['scene-velvet', 'chasuna'], ['scene-navygold', 'barmitzvah']];
      $$('canvas', fan).forEach((c, i) => { const d = designById(picks[i][0]); render(c, Object.assign(sample(d, heroLang), { t: picks[i][1] }), 0.24).catch(() => {}); });
    }
    // gallery — ~160 designs: filter by simcha / colour / search, rendered lazily as tiles scroll into view, "show more" pages
    const gallery = $('#invGallery'); let sampleLang = 'yi';
    const PAGE = 24;
    const gf = { type: 'all', color: 'all', q: '', limit: PAGE };
    const tiles = [];
    const drawQueue = []; let gDrawing = false;
    // a design that suits several simchas is shown (and opened) with the wording of the simcha being filtered
    const typeOf = (t) => (gf.type !== 'all' && TYPES[gf.type] && t.types.includes(gf.type)) ? gf.type : t.d.type;
    const keyOf = (t) => sampleLang + '|' + typeOf(t);
    async function pump() {
      if (gDrawing) return; gDrawing = true;
      while (drawQueue.length) {
        const t = drawQueue.shift();
        if (t.drawn === keyOf(t) || t.el.hidden) continue;
        const lang = sampleLang, ty = typeOf(t), key = keyOf(t);
        try { await render(t.cv, sample({ id: t.d.id, type: ty }, lang), 0.24); t.drawn = key; } catch (_) {}
        if (t.tyEl && t.tyEl.dataset.t !== ty) { t.tyEl.dataset.t = ty; both(t.tyEl, TYPES[ty].label.en, TYPES[ty].label.yi); }
        await new Promise((r) => setTimeout(r, 0));
      }
      gDrawing = false;
    }
    const io = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { const t = tiles[+e.target.dataset.idx]; if (t && t.drawn !== keyOf(t) && !drawQueue.includes(t)) drawQueue.push(t); } });
      pump();
    }, { rootMargin: '400px 0px' }) : null;
    function queueVisible() {
      tiles.forEach((t) => { if (!t.el.hidden && t.drawn !== keyOf(t)) { if (io) { io.unobserve(t.el); io.observe(t.el); } else if (!drawQueue.includes(t)) drawQueue.push(t); } });
      pump();
    }
    const norm = (x) => String(x || '').toLowerCase().replace(/[\u0591-\u05C7]/g, '');
    function applyFilter() {
      const q = norm(gf.q.trim());
      let match = 0, shown = 0;
      tiles.forEach((t) => {
        const d = t.d;
        const ok = (gf.type === 'all' || (gf.type === 'scene' ? !!d.isScene : t.types.includes(gf.type))) && (gf.color === 'all' || d.color === gf.color) && (!q || t.text.includes(q));
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
      // order (Nov 2026 v2): the printed classics lead (one of each layout), then the photo scenes, then the rest; retired designs are not listed
      const live = DESIGNS.filter((d) => !d.retired);
      const v2 = live.filter((d) => d.isV2 && !d.isScene);
      const scenesNew = live.filter((d) => d.isScene && d.isV2), scenesOld = live.filter((d) => d.isScene && !d.isV2);
      // the looks David picked lead: new photo cards alternating with the arch / double-rule / gilt / scroll cards
      const favs = v2.filter((d) => K_FAVS[d.family]), others = v2.filter((d) => !K_FAVS[d.family]);
      const lead = []; const sN = scenesNew.concat(scenesOld), fv = favs.slice();
      while (sN.length) { lead.push(sN.shift()); if (fv.length) lead.push(fv.shift()); if (fv.length && lead.length % 3 === 2) lead.push(fv.shift()); }
      const mixIn = fv.splice(0); const sc = []; const ot = others.slice();
      while (ot.length) mixIn.push(ot.shift());
      while (fv.length || ot.length) { if (fv.length) mixIn.push(fv.shift()); if (ot.length) mixIn.push(ot.shift()); if (ot.length && mixIn.length % 5 === 4) mixIn.push(ot.shift()); if (sc.length && mixIn.length % 6 === 0) mixIn.push(sc.shift()); }
      const order = lead.concat(mixIn, sc, live.filter((d) => !d.isV2 && !d.isScene));
      order.forEach((d, idx) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-tile' + (d.isScene ? ' inv-tile-scene' : ''); b.dataset.design = d.id; b.dataset.type = d.type; b.dataset.idx = String(idx);
        const types = [d.type].concat(d.also || []); b.dataset.types = types.join(' ');
        const cv = document.createElement('canvas'); cv.dataset.design = d.id; cv.width = 360; cv.height = 504; cv.setAttribute('aria-hidden', 'true'); cv.style.background = d.bg[0];
        const cap = document.createElement('span'); cap.className = 'inv-tile-cap';
        const ty = document.createElement('span'); ty.className = 'inv-tile-type'; both(ty, TYPES[d.type].label.en, TYPES[d.type].label.yi);
        const nm = document.createElement('span'); nm.className = 'inv-tile-name'; both(nm, d.name.en, d.name.yi);
        const go = document.createElement('span'); go.className = 'inv-tile-go'; if (d.isScene) both(go, 'Customize →', 'צוגרייטן ←'); else both(go, 'Use this design →', 'נעמט די דיזיין ←');
        cap.append(ty, nm, go); b.append(cv, cap);
        if (d.isNew) { const nb = document.createElement('span'); nb.className = 'inv-tile-new'; both(nb, 'New', 'נייע'); b.appendChild(nb); }
        b.addEventListener('click', () => {
          const ty = typeOf(tiles[idx]);
          state.d = d.id; state.t = ty; if (state.sm) { state.l = sampleLang; reSample(); } syncForm(); update(); parsha();
          history.replaceState(null, '', '#make=' + d.id + (ty !== d.type ? '&t=' + ty : ''));
          $('#invEditorTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => { const f = $('#fP'); if (f && !f.closest('[hidden]')) f.focus({ preventScroll: true }); }, 500);
        });
        const fam = FAMILY_NAMES[d.family] || { en: '', yi: '' }; const col = COLORS[d.color] || { en: '', yi: '' };
        const text = norm([d.id, d.name.en, d.name.yi, fam.en, fam.yi, col.en, col.yi].concat(types.map((k) => TYPES[k].label.en + ' ' + TYPES[k].label.yi)).join(' '));
        tiles.push({ el: b, cv, d, types, text, drawn: null, tyEl: ty });
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
      const list = DESIGNS.filter((d) => (d.family || d.frame) === fam && (!d.retired || d.id === state.d));
      sw.innerHTML = '';
      list.forEach((d) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'inv-swatch'; b.dataset.design = d.id;
        b.style.setProperty('--sw-a', d.bg[0]); b.style.setProperty('--sw-b', d.line);
        if (d.isScene) { b.classList.add('inv-swatch-photo'); b.style.backgroundImage = 'url(' + sceneSrc(d.scene.k, true) + ')'; b.title = d.name.en; }
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
      fontSelects();
      $('#invSampleNote').hidden = !state.sm;
      hebHint();
    }

    // font picker: the heading font and the text font, listed for the card's language ("Design font" keeps the design's own)
    function fontSelects() {
      const lang = state.l === 'en' ? 'en' : 'yi';
      [['fFontT', 'title', 'ft'], ['fFontB', 'body', 'fb']].forEach(([id, kind, key]) => {
        const sel = document.getElementById(id); if (!sel) return;
        if (sel.dataset.forLang !== lang) {
          sel.innerHTML = '';
          const o0 = document.createElement('option'); o0.value = ''; o0.textContent = lang === 'en' ? 'Design font' : 'פונעם דיזיין'; sel.appendChild(o0);
          FONT_PICK[kind][lang].forEach(([k, label, spec]) => { const o = document.createElement('option'); o.value = k; o.textContent = label; o.style.fontFamily = '"' + spec[0] + '"'; sel.appendChild(o); });
          sel.dataset.forLang = lang;
        }
        const ok = pickFont(kind, lang, state[key]);
        sel.value = ok ? state[key] : '';
      });
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
      if (e.target.id === 'fFontT') { state.ft = e.target.value; update(); }
      if (e.target.id === 'fFontB') { state.fb = e.target.value; update(); }
      if (e.target.id === 'fDate') { hebHint(); parsha(); }
    });
    $('#btnResetWording').addEventListener('click', () => { state.w = ''; state.ti = ''; syncForm(); update(); });
    $('#btnClear').addEventListener('click', () => {
      const keep = { d: state.d, t: state.t, l: state.l, ps: state.ps, ft: state.ft, fb: state.fb, sm: 0 };
      state = keep; syncForm(); update();
      flash(status, 'Cleared — start fresh.', 'אויסגעמעקט.');
    });

    const busy = async (btn, fn) => { btn.disabled = true; try { await fn(); } catch (err) { console.warn(err); flash(status, 'Something went wrong — please try again.', 'עפעס האט נישט געארבעט, פרובירט נאכאמאל.'); } finally { btn.disabled = false; } };
    $('#btnPng').addEventListener('click', (e) => busy(e.currentTarget, async () => { saveBlob(await pngBlob(state), fileBase(state) + imgExt(state)); flash(status, 'Image downloaded.', 'די בילד איז אראפגעלאדן.'); }));
    $('#btnPdf').addEventListener('click', (e) => busy(e.currentTarget, async () => { saveBlob(await pdfBlob(state), fileBase(state) + '.pdf'); flash(status, 'PDF downloaded.', 'דער PDF איז אראפגעלאדן.'); }));
    $('#btnPdfLetter').addEventListener('click', (e) => busy(e.currentTarget, async () => { const link = await refreshLink(); saveBlob(await pdfLetterBlob(state, link), fileBase(state) + '-letter.pdf'); flash(status, 'Letter PDF with QR code downloaded.', 'דער PDF מיטן QR קאוד איז אראפגעלאדן.'); }));
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
      const file = new File([await pngBlob(state)], fileBase(state) + imgExt(state), { type: imgType(state) });
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


  // ---------------------------------------------------------------- invite view extras: envelope, countdown, mazel tov
  function mazelMessage(data) {
    const t = summary(data);
    return data.l === 'en' ? 'Mazel Tov on the ' + t + '! Wishing you much nachas.' : 'מזל טוב צו ' + t + '! זאלט איר האבן אסאך נחת.';
  }
  function countdown(data) {
    const el = $('#vCount'); if (!el) return;
    const t = eventTimes(data); if (!t) return;
    const yi = siteLang() === 'yi';
    const tick = () => {
      const now = new Date();
      const start = t.allDay ? new Date(t.g.y, t.g.m - 1, t.g.d) : t.start;
      const end = t.allDay ? new Date(t.g.y, t.g.m - 1, t.g.d + 1) : t.end;
      if (now >= end) { el.hidden = true; return false; }
      const today = now.getFullYear() === t.g.y && now.getMonth() === t.g.m - 1 && now.getDate() === t.g.d;
      el.hidden = false;
      if (now >= start || (t.allDay && today)) { el.textContent = yi ? 'די שמחה איז יעצט! מזל טוב' : 'The simcha is happening now — Mazel Tov!'; return true; }
      const ms = start - now, days = Math.floor(ms / 86400000), hrs = Math.floor((ms % 86400000) / 3600000), mins = Math.floor((ms % 3600000) / 60000);
      const parts = yi
        ? [days ? days + (days === 1 ? ' טאג' : ' טעג') : '', hrs ? hrs + ' שעה' : '', !days ? mins + ' מינוט' : ''].filter(Boolean)
        : [days ? days + (days === 1 ? ' day' : ' days') : '', hrs ? hrs + (hrs === 1 ? ' hour' : ' hours') : '', !days ? mins + (mins === 1 ? ' minute' : ' minutes') : ''].filter(Boolean);
      el.innerHTML = '';
      const lead = document.createElement('span'); lead.textContent = today ? (yi ? 'היינט! נאך' : 'Today! In') : (yi ? 'נאך' : 'In');
      const b = document.createElement('b'); b.textContent = parts.join(yi ? ' און ' : ', ');
      el.append(lead, b);
      return true;
    };
    if (tick()) setInterval(tick, 30000);
    document.addEventListener('site-language-change', () => { /* labels follow the page language on the next tick */ });
  }
  // The envelope: shown once when the link is opened, tap (or wait) to open, Skip always there; no animation for reduced motion.
  function openEnvelope(canvas, data) {
    const env = $('#invEnvelope'); if (!env) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || /[?&]noenv\b/.test(location.search)) return;
    try { $('#envCard').src = canvas.toDataURL('image/jpeg', 0.82); } catch (_) {}
    if (designById(data.d).dark) env.classList.add('is-dark');
    env.hidden = false; document.documentElement.classList.add('env-lock');
    let done = false, timer = null;
    const finish = (fast) => {
      if (done) return; done = true; clearTimeout(timer);
      env.classList.add('is-open');
      setTimeout(() => { env.classList.add('is-gone'); document.documentElement.classList.remove('env-lock'); }, fast ? 0 : 1500);
      setTimeout(() => { env.hidden = true; }, fast ? 600 : 2200);
    };
    $('#envOpen').addEventListener('click', () => finish(false));
    $('#envSkip').addEventListener('click', () => finish(true));
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { finish(true); document.removeEventListener('keydown', k); } });
    timer = setTimeout(() => finish(false), 3800);
  }

  // ---------------------------------------------------------------- shared invitation view
  async function initView() {
    const root = $('#invView'); if (!root) return;
    const m = /[#&]i=([A-Za-z0-9_-]+)/.exec(location.hash);
    const ms = /[#&]s=([A-Za-z0-9_-]+)/.exec(location.hash);
    let data = null, studioDesign = null;
    try { data = m ? await decode(m[1]) : null; } catch (_) { data = null; }
    // Design Studio links (#s=…): a free-form design; its event details travel in design.meta
    if (!data && ms) { for (let k = 0; k < 60 && !window.KashoStudio; k++) await new Promise((r) => setTimeout(r, 50)); }
    if (!data && ms && window.KashoStudio) {
      try { studioDesign = await window.KashoStudio.decodeDesign(ms[1]); } catch (_) { studioDesign = null; }
      if (studioDesign) data = Object.assign(clean(studioDesign.meta || {}), { d: 'scene-velvet' });
    }
    if (!data || !data.d) { $('#viewEmpty').hidden = false; $('#viewLoading').hidden = true; return; }
    if (!TYPES[data.t]) data.t = 'general';
    if (!SAVED_LANG && data.l !== 'en' && siteLang() !== 'yi' && window.toggleLang) window.toggleLang();

    const canvas = $('#viewCanvas');
    if (studioDesign) await window.KashoStudio.render(canvas, studioDesign, 0.6); else await render(canvas, data, 0.6);
    $('#viewLoading').hidden = true; $('#viewMain').hidden = false;
    requestAnimationFrame(() => root.classList.add('is-ready'));
    openEnvelope(canvas, data);
    canvas.setAttribute('aria-label', summary(data));
    const link = location.href.split('#')[0] + (m ? '#i=' + m[1] : '#s=' + ms[1]);
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
    const mz = phoneDigits(data.r);
    if (mz && $('#vMazel')) { $('#vMazel').href = 'sms:+' + mz + '?&body=' + encodeURIComponent(mazelMessage(data)); $('#vMazel').hidden = false; }
    countdown(data);
    $('#vPng').addEventListener('click', async (e) => { const btn = e.currentTarget; btn.disabled = true; try { if (studioDesign) { const c = document.createElement('canvas'); await window.KashoStudio.render(c, studioDesign, 1); saveBlob(await canvasBlob(c, 'image/jpeg', 0.92), fileBase(data) + '.jpg'); } else saveBlob(await pngBlob(data), fileBase(data) + imgExt(data)); } finally { btn.disabled = false; } });
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
    $('#vMake').href = studioDesign ? 'invitations.html#studio' : 'invitations.html#make=' + designById(data.d).id + '&t=' + data.t;
  }

  // building blocks shared with the Design Studio (studio.js)
  const KIT = { W, H, HE, FOIL, FONTSETS, loadScene, sceneSrc, divider, cornerScroll, rectStroke, magen, keser, sparkle, rosette, leaf, wrapLines, font, dirOf,
    hebrewParts, civilLong, dayLine, timeLabel, titleText, words, saveBlob, buildPdf, jpegOf, canvasBlob, fileBase, streamBytes, b64url, unb64url, summary,
    eventTimes, mazelMessage, countdown, openEnvelope, phoneDigits, rsvpLinks, mapsUrl, wazeUrl, googleCalUrl, icsText, copyText, flash, both, qrPanel, ensureFonts };
  window.KashoInvites = { TYPES, DESIGNS, SCENES, pdfLetterBlob, KIT, render, encode, decode, hebrewParts, gematria, icsText, googleCalUrl, pdfBlob, pngBlob, sample, designById, viewUrl };

  function start() { initEditor(); initView(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
