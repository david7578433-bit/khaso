/* Kasho · Community Designs client (plain browser JS, no build step, no tracking).
 *
 * Every design made in the Design Studio is shared as "pending" and shows in the
 * public Community Designs gallery 3 days later unless an admin rejects it.
 * The database (community-designs.sql) enforces all of this with row level security;
 * this file only mirrors it so the page shows the same thing.
 *
 * Works on the Kasho site (uses window.memberClient when member-auth.js is loaded)
 * and on a standalone copy of the maker (loads supabase-js from the CDN on first use
 * and makes its own anonymous client).
 *
 * Every function fails QUIETLY: [] / false / null, never throws, never console.error,
 * so a gallery can simply hide itself when the table is not there yet.
 * KashoCommunity.lastError says why the last call came back empty:
 *   null | 'missing_table' | 'network' | 'denied' | 'too_big' | 'rate_limited' | 'invalid'
 */
(function () {
  'use strict';
  if (window.KashoCommunity) return;

  // ###################################################################
  // ### THE ONE SWITCH — must match community_designs_require_approval()
  // ### in community-designs.sql.  false = MODE A: designs go public
  // ### 3 days after they are made unless an admin rejects them.
  // ### true = MODE B: only designs an admin approved go public.
  // ###################################################################
  var REQUIRE_APPROVAL = false;

  var SUPABASE_URL = 'https://dzlxyglrefyzebjrlgtl.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Lz7HJgOFTKNAkjlQIhplFQ_4bIAZ3La';
  var SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  var TABLE = 'community_designs';
  var TIMEOUT_MS = 9000;
  var MAX_DESIGN_BYTES = 39000;   // SQL limit is 40000 (octet_length of the JSON text)
  var MAX_THUMB_CHARS = 79000;    // SQL limit is 80000
  var SENT_KEY = 'kashoCommunitySent';
  var PUBLIC_COLUMNS = 'id, design, thumb, title, simcha_type, created_at';
  var ADMIN_COLUMNS = 'id, design, thumb, title, simcha_type, site, created_at, publish_at, status, reviewed_at';

  // Keys that can carry personal details; dropped at any depth before sharing.
  var PERSONAL_KEY = /^(r|a|tel|tels|sms|email|emails|mail|addr|names|hostnames?|parents|grandparents|rsvp|contact|contacts)$|phone|address/i;

  var client = null;
  var clientPromise = null;
  var missingUntil = 0;   // when the table is missing, stay quiet (no requests) for a minute

  function debug() {
    try { if (window.console && console.debug) console.debug.apply(console, ['[KashoCommunity]'].concat([].slice.call(arguments))); } catch (_) {}
  }

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('timeout')); }, TIMEOUT_MS);
      Promise.resolve(promise).then(function (value) { clearTimeout(timer); resolve(value); },
                                    function (err) { clearTimeout(timer); reject(err); });
    });
  }

  function loadLibrary() {
    if (window.supabase && typeof window.supabase.createClient === 'function') return Promise.resolve(window.supabase);
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[data-kasho-supabase]') ||
        document.querySelector('script[src^="' + SUPABASE_CDN + '"]');
      var script = existing || document.createElement('script');
      var done = false;
      function finish() {
        if (done) return; done = true;
        resolve(window.supabase && typeof window.supabase.createClient === 'function' ? window.supabase : null);
      }
      script.addEventListener('load', finish);
      script.addEventListener('error', finish);
      setTimeout(finish, TIMEOUT_MS);
      if (!existing) {
        script.src = SUPABASE_CDN;
        script.async = true;
        script.setAttribute('data-kasho-supabase', '1');
        (document.head || document.documentElement).appendChild(script);
      }
    });
  }

  function getClient() {
    if (client) return Promise.resolve(client);
    if (window.memberClient && typeof window.memberClient.from === 'function') {
      client = window.memberClient;
      return Promise.resolve(client);
    }
    if (!clientPromise) {
      clientPromise = loadLibrary().then(function (lib) {
        if (!lib) { clientPromise = null; return null; }
        if (window.memberClient && typeof window.memberClient.from === 'function') {
          client = window.memberClient;
          return client;
        }
        try {
          // Anonymous, no stored session: never clashes with the site's own login client.
          client = lib.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'kasho-community-anon' }
          });
        } catch (err) {
          debug('client', err && err.message);
          client = null;
        }
        if (!client) clientPromise = null;
        return client;
      }, function () { clientPromise = null; return null; });
    }
    return clientPromise;
  }

  function classify(error) {
    if (!error) return null;
    var code = String(error.code || '');
    var text = String(error.message || error.details || error.hint || error || '').toLowerCase();
    if (code === 'PGRST205' || code === '42P01' || code === 'PGRST204' || code === '42883' ||
        /could not find the table|does not exist|schema cache/.test(text)) return 'missing_table';
    if (code === '42501' || /permission denied|row-level security|jwt/.test(text)) return 'denied';
    if (/too many new designs/.test(text)) return 'rate_limited';
    if (code === '23514' || code === '22P02' || code === '23502') return 'invalid';
    if (/fetch|network|timeout|load failed|abort/.test(text) || !code) return 'network';
    return 'invalid';
  }

  // Runs fn(client) and turns every failure into { data: fallback }, never a throw.
  function run(fn, fallback) {
    api.lastError = null;
    if (Date.now() < missingUntil) { api.lastError = 'missing_table'; return Promise.resolve(fallback); }
    return getClient().then(function (c) {
      if (!c) { api.lastError = 'network'; return fallback; }
      return withTimeout(fn(c)).then(function (res) {
        if (res && res.error) {
          api.lastError = classify(res.error);
          if (api.lastError === 'missing_table') missingUntil = Date.now() + 60000;
          debug(api.lastError, res.error.code || '', res.error.message || '');
          return fallback;
        }
        return res;
      });
    }).catch(function (err) {
      api.lastError = classify(err) || 'network';
      debug(api.lastError, err && err.message);
      return fallback;
    });
  }

  function stripPersonal(value, depth) {
    if (depth > 12) return undefined;
    if (typeof value === 'string') {
      // No uploaded photos or local files ever go public (tznius + privacy).
      if (/^(data:|blob:|file:)/i.test(value)) return undefined;
      return value;
    }
    if (Array.isArray(value)) {
      var arr = [];
      value.forEach(function (item) {
        var clean = stripPersonal(item, depth + 1);
        if (clean !== undefined) arr.push(clean);
      });
      return arr;
    }
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (key) {
        if (PERSONAL_KEY.test(key)) return;
        var clean = stripPersonal(value[key], depth + 1);
        if (clean !== undefined) out[key] = clean;
      });
      return out;
    }
    if (typeof value === 'number') return isFinite(value) ? value : undefined;
    if (typeof value === 'boolean' || value === null) return value;
    return undefined;
  }

  function utf8Length(text) {
    try { return new Blob([text]).size; } catch (_) { return unescape(encodeURIComponent(text)).length; }
  }

  function cleanText(text, max) {
    if (typeof text !== 'string') return null;
    var t = text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    return t.length > max ? t.slice(0, max) : t;
  }

  function guessSite() {
    try { return /\/khaso(\/|$)/i.test(location.pathname) ? 'kasho' : 'public'; } catch (_) { return 'public'; }
  }

  function fingerprint(text) {
    var h = 5381;
    for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36) + ':' + text.length;
  }

  function alreadySent(fp) {
    try { return (JSON.parse(localStorage.getItem(SENT_KEY) || '[]') || []).indexOf(fp) !== -1; } catch (_) { return false; }
  }

  function rememberSent(fp) {
    try {
      var list = JSON.parse(localStorage.getItem(SENT_KEY) || '[]') || [];
      list.push(fp);
      localStorage.setItem(SENT_KEY, JSON.stringify(list.slice(-60)));
    } catch (_) {}
  }

  function nowIso() { return new Date().toISOString(); }

  var api = {
    REQUIRE_APPROVAL: REQUIRE_APPROVAL,
    lastError: null,

    // Optional: hand in an existing supabase client (admin.html does, so the admin's login is used).
    useClient: function (existingClient) {
      if (existingClient && typeof existingClient.from === 'function') { client = existingClient; clientPromise = null; return true; }
      return false;
    },

    // The same personal-data strip submit() applies; exposed so callers can preview it.
    sanitize: function (design) {
      try {
        var copy = JSON.parse(JSON.stringify(design));
        var clean = stripPersonal(copy, 0);
        return clean && typeof clean === 'object' && !Array.isArray(clean) ? clean : null;
      } catch (_) { return null; }
    },

    // Share one design. Resolves true when the database accepted it, else false.
    // The same design is never sent twice from the same browser.
    submit: function (opts) {
      opts = opts || {};
      var design = api.sanitize(opts.design);
      if (!design || !Object.keys(design).length) { api.lastError = 'invalid'; return Promise.resolve(false); }
      var json = JSON.stringify(design);
      if (utf8Length(json) > MAX_DESIGN_BYTES) { api.lastError = 'too_big'; debug('design too big'); return Promise.resolve(false); }
      var fp = fingerprint(json);
      if (alreadySent(fp)) { api.lastError = null; return Promise.resolve(true); }
      var thumb = (typeof opts.thumb === 'string' && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(opts.thumb) &&
                   opts.thumb.length <= MAX_THUMB_CHARS) ? opts.thumb : null;
      var site = opts.site === 'kasho' || opts.site === 'public' ? opts.site : guessSite();
      var row = {
        design: design,
        thumb: thumb,
        title: cleanText(opts.title, 119),
        simcha_type: cleanText(opts.simchaType, 59),
        site: site
      };
      return run(function (c) { return c.from(TABLE).insert(row); }, null).then(function (res) {
        if (!res) return false;
        rememberSent(fp);
        return true;
      });
    },

    // Published designs only, newest first: [{id, design, thumb, title, simcha_type, created_at}].
    // Optional: site ('kasho' | 'public') to show only one site's designs.
    list: function (opts) {
      opts = opts || {};
      var limit = Math.max(1, Math.min(100, parseInt(opts.limit, 10) || 24));
      var offset = Math.max(0, parseInt(opts.offset, 10) || 0);
      return run(function (c) {
        var q = c.from(TABLE).select(PUBLIC_COLUMNS).lte('publish_at', nowIso());
        q = api.REQUIRE_APPROVAL ? q.eq('status', 'approved') : q.neq('status', 'rejected');
        if (opts.site === 'kasho' || opts.site === 'public') q = q.eq('site', opts.site);
        return q.order('publish_at', { ascending: false }).order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
      }, null).then(function (res) {
        return res && Array.isArray(res.data) ? res.data : [];
      });
    },

    // ADMINS. Designs waiting for review (default), or every recent design with {all: true}.
    // Rows: {id, design, thumb, title, simcha_type, site, created_at, publish_at, status, reviewed_at}.
    pending: function (opts) {
      opts = opts || {};
      var limit = Math.max(1, Math.min(200, parseInt(opts.limit, 10) || 100));
      return run(function (c) {
        var q = c.from(TABLE).select(ADMIN_COLUMNS);
        if (!opts.all) q = q.eq('status', 'pending');
        return q.order('created_at', { ascending: false }).limit(limit);
      }, null).then(function (res) {
        return res && Array.isArray(res.data) ? res.data : [];
      });
    },

    // ADMINS. status: 'approved' | 'rejected' | 'pending'. Resolves true only if a row changed.
    setStatus: function (id, status) {
      if (!id || ['approved', 'rejected', 'pending'].indexOf(status) === -1) { api.lastError = 'invalid'; return Promise.resolve(false); }
      return run(function (c) {
        return c.from(TABLE).update({ status: status, reviewed_at: nowIso() }).eq('id', id).select('id');
      }, null).then(function (res) {
        if (res && Array.isArray(res.data) && res.data.length) return true;
        if (res && !api.lastError) api.lastError = 'denied';
        return false;
      });
    },

    // ADMINS. Deletes the design for good. Resolves true only if a row was removed.
    remove: function (id) {
      if (!id) { api.lastError = 'invalid'; return Promise.resolve(false); }
      return run(function (c) {
        return c.from(TABLE).delete().eq('id', id).select('id');
      }, null).then(function (res) {
        if (res && Array.isArray(res.data) && res.data.length) return true;
        if (res && !api.lastError) api.lastError = 'denied';
        return false;
      });
    }
  };

  window.KashoCommunity = api;
})();
