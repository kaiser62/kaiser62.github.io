(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');

  function current() {
    return root.dataset.theme || 'dark';
  }
  function label() {
    if (btn) btn.textContent = current() === 'dark' ? 'light mode' : 'dark mode';
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
    });
    label();
  }

  document.querySelectorAll('time[datetime]').forEach(function (el) {
    var iso = el.getAttribute('datetime');
    var then = Date.parse(iso);
    if (isNaN(then)) return;
    var days = Math.floor((Date.now() - then) / 864e5);
    el.textContent = days < 1 ? 'today'
      : days < 7 ? days + 'd ago'
      : days < 60 ? Math.floor(days / 7) + 'w ago'
      : days < 730 ? Math.floor(days / 30) + 'mo ago'
      : Math.floor(days / 365) + 'y ago';
    el.title = iso.slice(0, 10);
  });
})();
