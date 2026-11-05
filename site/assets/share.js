/*
 * Web page for GoTourGo SOS and live-location links, shown when the app is not
 * installed. Reads the link's details from Supabase (public RPC
 * get_shared_location; the token is the only key) and refreshes every 20 s.
 * All text goes through textContent, never innerHTML, so names cannot inject HTML.
 */
(function () {
  var cfg = window.GOTOURGO || {};
  var app = document.getElementById('app');
  var token = new URLSearchParams(location.search).get('t') || '';
  var timer = null;

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

  function ago(iso) {
    var min = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return min + ' min ago';
    var h = Math.round(min / 60);
    return h + (h === 1 ? ' hour ago' : ' hours ago');
  }

  function render(nodes) {
    app.replaceChildren.apply(
      app,
      nodes.filter(function (n) {
        return n;
      }),
    );
  }

  function emergency() {
    var numbers = [
      ['15', 'Police'],
      ['1122', 'Rescue'],
      ['115', 'Edhi'],
    ];
    return el(
      'div',
      { class: 'numbers' },
      numbers.map(function (n) {
        return el('a', { href: 'tel:' + n[0] }, [document.createTextNode(n[0]), el('small', { text: n[1] })]);
      }),
    );
  }

  function appButtons(kind) {
    var url = location.origin + '/' + kind + '?t=' + token;
    var intent =
      'intent://' + location.host + '/' + kind + '?t=' + token + '#Intent;scheme=https;package=' + cfg.androidPackage +
      (cfg.installUrl ? ';S.browser_fallback_url=' + encodeURIComponent(cfg.installUrl) : '') + ';end';
    var isAndroid = /Android/i.test(navigator.userAgent);
    return [
      el('a', { class: 'btn secondary', href: isAndroid ? intent : url, text: 'Open in GoTourGo' }),
      cfg.installUrl ? el('a', { class: 'btn secondary', href: cfg.installUrl, text: 'Get the GoTourGo app' }) : null,
    ];
  }

  function show(data) {
    if (!data) {
      render([el('h1', { text: 'Link not found' }), el('p', { class: 'muted', text: 'This link does not exist. Check that you opened the whole link.' })]);
      return;
    }
    var sos = data.kind === 'sos';
    var title = sos ? 'SOS from ' + data.name : data.name + "'s live location";
    if (data.status !== 'active' || data.latitude == null) {
      var msg =
        data.status === 'ended'
          ? data.name + (sos ? ' marked themselves safe ' : ' stopped sharing ') + ago(data.ended_at || data.created_at) + '.'
          : data.status === 'expired'
            ? 'This link has expired. Links show a location for 24 hours.'
            : data.name + ' could not get an exact location when sending this.';
      render([el('h1', { text: title }), el('p', { class: 'muted', text: msg }), sos ? emergency() : null]);
      return;
    }
    var lat = Number(data.latitude);
    var lng = Number(data.longitude);
    var d = 0.006;
    var embed =
      'https://www.openstreetmap.org/export/embed.html?bbox=' +
      [lng - d * 1.6, lat - d, lng + d * 1.6, lat + d].join(',') +
      '&layer=mapnik&marker=' + lat + ',' + lng;
    var when = data.live ? 'Live · updated ' + ago(data.located_at) : 'Location when sent · ' + ago(data.located_at);
    var details = [when];
    if (data.accuracy) details.push('accurate to about ' + Math.round(data.accuracy) + ' m');
    details.push('link works until ' + new Date(data.expires_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));

    render([
      el('span', { class: sos ? 'pill sos' : 'pill', text: sos ? 'SOS' : 'Live location' }),
      el('h1', { text: title }),
      el('p', { class: 'muted', text: details.join(' · ') }),
      el('iframe', { class: 'map', src: embed, title: 'Map', loading: 'lazy' }),
      el('a', { class: sos ? 'btn sos' : 'btn', href: 'geo:' + lat + ',' + lng + '?q=' + lat + ',' + lng, text: 'Directions in a maps app' }),
      el('a', { class: 'btn secondary', href: 'https://www.openstreetmap.org/directions?to=' + lat + '%2C' + lng, text: 'Directions on OpenStreetMap' }),
      data.phone ? el('a', { class: 'btn secondary', href: 'tel:' + data.phone, text: 'Call ' + data.name }) : null,
      sos ? el('div', { class: 'card' }, [el('p', { text: 'Emergency numbers (Pakistan)' }), emergency()]) : null,
    ].concat(appButtons(data.kind)));
  }

  function load() {
    if (!/^[0-9a-f]{32}$/.test(token)) {
      show(null);
      return;
    }
    fetch(cfg.supabaseUrl + '/rest/v1/rpc/get_shared_location', {
      method: 'POST',
      headers: { apikey: cfg.supabaseKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        show(data);
        clearTimeout(timer);
        if (data && data.status === 'active') timer = setTimeout(load, 20000);
      })
      .catch(function () {
        render([el('h1', { text: 'Could not load the location' }), el('p', { class: 'muted', text: 'Check your internet connection and refresh the page.' })]);
        timer = setTimeout(load, 20000);
      });
  }

  load();
})();
