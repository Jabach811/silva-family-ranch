(function () {
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  /* ---------- menu ---------- */

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');

  if (toggle && nav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.setAttribute('data-open', String(open));
      document.body.setAttribute('data-nav-open', String(open));
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      setNav(open);
      if (open) nav.querySelector('a').focus();
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setNav(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setNav(false);
    });

    /* Rotating the phone while the menu is open leaves it stuck open
       over a layout it no longer fits. */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ---------- hero video ---------- */

  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    var conn = navigator.connection || {};
    var thrifty = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
    var stillOnly = window.matchMedia('(prefers-reduced-motion: reduce)').matches || thrifty;

    if (!stillOnly) {
      /* Full speed to a dead stop reads as a glitch. Ease the last couple of
         seconds of footage down so the push-in coasts onto its final frame. */
      var settle = function () {
        if (heroVideo.paused) return;
        var left = heroVideo.duration - heroVideo.currentTime;
        if (left < 2) heroVideo.playbackRate = 0.3 + 0.35 * left;
        requestAnimationFrame(settle);
      };

      var startHero = function () {
        heroVideo.addEventListener('playing', function () {
          heroVideo.setAttribute('data-playing', '');
          requestAnimationFrame(settle);
        }, { once: true });
        /* Smaller side, not width — a phone turned sideways is 812 wide but
           still a phone, and shouldn't pay for the big file. */
        heroVideo.src = Math.min(window.innerWidth, window.innerHeight) < 800
          ? 'assets/video/hero-768.mp4'
          : 'assets/video/hero-1168.mp4';
        /* Some browsers refuse autoplay. Nothing to do — the photo stays. */
        var p = heroVideo.play();
        if (p) p.catch(function () {});
      };

      /* Opened in a background tab, the browser refuses to start it and never
         tries again. Hold off until someone is actually looking. */
      var whenVisible = function () {
        if (!document.hidden) return startHero();
        document.addEventListener('visibilitychange', function once () {
          if (document.hidden) return;
          document.removeEventListener('visibilitychange', once);
          startHero();
        });
      };

      /* Wait for the page to finish so the video never competes with the
         photograph for bandwidth, then let the headline finish rising. */
      if (document.readyState === 'complete') setTimeout(whenVisible, 500);
      else window.addEventListener('load', function () { setTimeout(whenVisible, 500); });
    }
  }

  var here = location.pathname.split('/').pop() || 'index.html';
  var link = nav && nav.querySelector('a[href="' + here + '"]');
  if (link && !link.classList.contains('btn')) link.setAttribute('aria-current', 'page');

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* The share cards on the home page link here as order.html?share=Half. */
  var wanted = new URLSearchParams(location.search).get('share');
  if (wanted) {
    document.querySelectorAll('input[name="share"]').forEach(function (r) {
      if (r.value === wanted) r.checked = true;
    });
  }

  /* ---------- content from ranch-data.js ---------- */

  var data = window.RANCH;
  if (!data) return;

  var STATUS_LABEL = {
    open: 'Taking orders now',
    waitlist: 'Waitlist only',
    closed: 'Not taking orders'
  };

  document.querySelectorAll('[data-beef-status]').forEach(function (slot) {
    if (!data.beef) return;
    var b = data.beef;
    var key = STATUS_LABEL[b.status] ? b.status : 'waitlist';
    var html =
      '<p class="status status--' + key + '">' + STATUS_LABEL[key] + '</p>' +
      '<h2 class="display-md">' + esc(b.headline) + '</h2>' +
      '<p class="lede">' + esc(b.detail) + '</p>';
    if (b.deadline) html += '<p class="fine">' + esc(b.deadline) + '</p>';
    slot.innerHTML = html;
  });

  var BRIEF_LINK = {
    open: 'Request a share',
    waitlist: 'Join the waitlist',
    closed: 'Ask about the next harvest'
  };

  document.querySelectorAll('[data-beef-brief]').forEach(function (slot) {
    if (!data.beef) return;
    var b = data.beef;
    var key = STATUS_LABEL[b.status] ? b.status : 'waitlist';
    var html = '<span class="status status--' + key + '">' + STATUS_LABEL[key] + '</span>';
    if (b.deadline) html += '<span class="fine">' + esc(b.deadline) + '</span>';
    html += '<a class="link-arrow" href="order.html">' + BRIEF_LINK[key] + '</a>';
    slot.innerHTML = html;
  });

  var pricing = document.querySelector('[data-beef-pricing]');
  if (pricing && data.beef && data.beef.pricing) pricing.textContent = data.beef.pricing;

  var hayNote = document.querySelector('[data-hay-note]');
  if (hayNote && data.hay && data.hay.note) hayNote.textContent = data.hay.note;

  var hayBody = document.querySelector('[data-hay-rows]');
  if (hayBody && data.hay && data.hay.items) {
    hayBody.innerHTML = data.hay.items.map(function (item) {
      return '<tr data-status="' + esc(item.status) + '">' +
        '<td>' + esc(item.name) + '</td>' +
        '<td>' + esc(item.price) + '</td>' +
        '<td>' + esc(item.when) + '</td>' +
        '</tr>';
    }).join('');
  }

  if (data.lastUpdated) {
    document.querySelectorAll('[data-updated]').forEach(function (el) {
      el.textContent = 'Updated ' + data.lastUpdated;
    });
  }

  /* ---------- request forms ---------- */

  /* Hay is Mike on a different line. Everything else on the hay page
     already sends people to him; a stuck visitor should go there too. */
  var DESKS = {
    beef: { tel: '+12094002660', phone: '209-400-2660' },
    hay: { tel: '+12095648309', phone: '209-564-8309' }
  };

  var LABELS = {
    name: 'Name', email: 'Email', phone: 'Phone', town: 'Town',
    share: 'Share size', finish: 'Finish', season: 'Harvest',
    hay: 'Hay wanted', bales: 'Roughly how many bales', timing: 'When',
    address: 'Delivery address', notes: 'Notes', heard: 'Heard about us'
  };

  document.querySelectorAll('form[data-request]').forEach(function (form) {
    var subject = form.getAttribute('data-request');
    var panel = document.getElementById(form.id + '-done');
    var btn = form.querySelector('button[type=submit]');
    var btnText = btn.textContent;

    function done() {
      form.hidden = true;
      panel.hidden = false;
      panel.setAttribute('tabindex', '-1');
      panel.focus();
      panel.scrollIntoView({ block: 'center' });
    }

    function clearError() {
      var old = form.querySelector('.form-error');
      if (old) old.remove();
    }

    var desk = DESKS[form.getAttribute('data-page')] || DESKS.beef;
    var reach = 'call <a href="tel:' + desk.tel + '">' + desk.phone + '</a> or email <a href="mailto:' +
      esc(data.orderEmail) + '">' + esc(data.orderEmail) + '</a>';

    /* The server knows whether this was a typo or a real outage. Saying
       "that did not go through" to someone who mistyped their email sends
       them away thinking the site is broken. */
    function fail(problem) {
      btn.disabled = false;
      btn.textContent = btnText;
      clearError();

      var msg = document.createElement('p');
      msg.className = 'form-error';
      /* Sighted users see this appear. Screen reader users need telling. */
      msg.setAttribute('role', 'alert');

      var field = problem && problem.field && form.elements[problem.field];
      var box = field && field.closest ? field.closest('.field') : null;

      if (problem && problem.error) {
        msg.innerHTML = esc(problem.error) +
          (box ? ' Change it and send again, or ' : ' You can ') + reach + '.';
      } else {
        msg.innerHTML = 'That did not go through. Please ' + reach + '.';
      }

      if (box) {
        box.append(msg);
        field.focus();
      } else {
        btn.closest('.btn-row').insertAdjacentElement('beforebegin', msg);
      }
      msg.scrollIntoView({ block: 'center' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.website.value) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var fd = new FormData(form);
      fd.delete('website');
      fd.append('_subject', subject);
      fd.append('page', form.getAttribute('data-page') || '');

      if (data.formEndpoint) {
        clearError();
        btn.disabled = true;
        btn.textContent = 'Sending…';
        fetch(data.formEndpoint, { method: 'POST', body: new URLSearchParams(fd), headers: { Accept: 'application/json' } })
          .then(function (r) {
            if (r.ok) return done();
            return r.json().then(fail, function () { fail(); });
          })
          .catch(function () { fail(); });
        return;
      }

      var lines = [];
      fd.forEach(function (value, key) {
        if (value && key !== '_subject' && key !== 'page') lines.push((LABELS[key] || key) + ': ' + value);
      });
      location.href = 'mailto:' + data.orderEmail +
        '?subject=' + encodeURIComponent(subject + ' — ' + fd.get('name')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      done();
    });
  });
})();
