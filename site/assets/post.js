/*
 * Web page for shared GoTourGo posts (/p?id=<post id>). Reads the post from the
 * public RPC get_shared_post (only posts by public profiles) and offers to open
 * it in the app. Text goes through textContent, never innerHTML.
 */
(function () {
  var cfg = window.GOTOURGO || {};
  var app = document.getElementById('app');
  var id = new URLSearchParams(location.search).get('id') || '';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function render(nodes) {
    app.replaceChildren.apply(app, nodes.filter(Boolean));
  }

  function ago(iso) {
    var min = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + ' min ago';
    var h = Math.round(min / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    var d = Math.round(h / 24);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }

  function safeUrl(u) {
    return typeof u === 'string' && /^https:\/\//.test(u) ? u : null;
  }

  // Android: an intent opens the app (custom scheme, no App Link needed) and falls
  // back to the install page, or this page, when the app isn't installed.
  function openButtons() {
    var deep = cfg.appScheme + '://post/' + id;
    var fallback = cfg.installUrl || location.href;
    var intent =
      'intent://post/' + id + '#Intent;scheme=' + cfg.appScheme + ';package=' + cfg.androidPackage +
      ';S.browser_fallback_url=' + encodeURIComponent(fallback) + ';end';
    var isAndroid = /Android/i.test(navigator.userAgent);
    return [
      el('a', { class: 'btn', href: isAndroid ? intent : deep, text: 'Open in GoTourGo' }),
      cfg.installUrl ? el('a', { class: 'btn secondary', href: cfg.installUrl, text: 'Get the GoTourGo app' }) : null,
    ];
  }

  function media(data) {
    var items = Array.isArray(data.media) && data.media.length ? data.media : [{ type: data.video_url ? 'video' : 'image', url: data.video_url || data.image_url, poster_url: data.image_url }];
    return items
      .map(function (m) {
        var url = safeUrl(m.url);
        if (!url) return null;
        if (m.type === 'video') return el('video', { class: 'media', src: url, poster: safeUrl(m.poster_url) || '', controls: '', playsinline: '', preload: 'none' });
        return el('img', { class: 'media', src: url, alt: 'Photo from the post', loading: 'lazy' });
      })
      .filter(Boolean);
  }

  function show(data) {
    if (!data) {
      render([el('h1', { text: 'Post not found' }), el('p', { class: 'muted', text: 'It may have been deleted.' })].concat(openButtons()));
      return;
    }
    if (data.status !== 'ok') {
      render([el('h1', { text: 'This post is private' }), el('p', { class: 'muted', text: 'Open it in GoTourGo to see it.' })].concat(openButtons()));
      return;
    }
    var author = data.author || {};
    var avatar = safeUrl(author.avatar_url);
    var head = el('div', { class: 'author' }, [
      avatar ? el('img', { class: 'avatar', src: avatar, alt: '' }) : el('div', { class: 'avatar' }),
      el('div', {}, [el('strong', { text: author.name || 'A traveller' }), el('div', { class: 'muted small', text: '@' + (author.username || '') + ' · ' + ago(data.created_at) })]),
    ]);
    render(
      [
        el('article', { class: 'card post' }, [
          head,
          data.place ? el('div', { class: 'pill', text: '📍 ' + data.place }) : null,
          el('p', { class: 'body', text: data.body || '' }),
        ].concat(media(data)).concat([el('p', { class: 'muted small', text: data.likes + ' likes · ' + data.comments + ' comments' })])),
      ].concat(openButtons()),
    );
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    show(null);
    return;
  }
  fetch(cfg.supabaseUrl + '/rest/v1/rpc/get_shared_post', {
    method: 'POST',
    headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_id: id }),
  })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(show)
    .catch(function () {
      render([el('h1', { text: 'Could not load the post' }), el('p', { class: 'muted', text: 'Check your internet connection and refresh the page.' })]);
    });
})();
