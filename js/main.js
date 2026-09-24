// Natura Agrobrand — shared site behavior. Plain JS, no build step, no dependencies.

(function mobileNav() {
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  var iconMenu = toggle.querySelector('.icon-menu');
  var iconClose = toggle.querySelector('.icon-close');

  toggle.addEventListener('click', function () {
    var willOpen = menu.hidden;
    menu.hidden = !willOpen;
    toggle.setAttribute('aria-expanded', String(willOpen));
    toggle.setAttribute('aria-label', willOpen ? 'Close menu' : 'Open menu');
    if (iconMenu && iconClose) {
      iconMenu.hidden = willOpen;
      iconClose.hidden = !willOpen;
    }
  });
})();

(function languageSwitcher() {
  var root = document.querySelector('.lang-switch');
  if (!root) return;

  var button = root.querySelector('.lang-btn');
  var menu = root.querySelector('.lang-menu');
  var label = root.querySelector('.lang-current');
  var items = root.querySelectorAll('[data-lang]');
  var LANGS = { en: 'EN', es: 'ES', de: 'DE', fr: 'FR', nl: 'NL' };
  var NO_TRANSLATE = '.brand, .team-name, .stat-value, a[href^="mailto:"], a[href^="tel:"]';

  function readLang() {
    var match = document.cookie.match(/(?:^|;\s*)googtrans=\/[a-z-]+\/([a-z-]+)/i);
    var code = match ? match[1].toLowerCase() : 'en';
    return LANGS.hasOwnProperty(code) ? code : 'en';
  }

  function writeCookie(value, expired) {
    var base = 'googtrans=' + value + '; path=/' + (expired ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '');
    document.cookie = base;
    if (location.hostname.indexOf('.') !== -1) document.cookie = base + '; domain=' + location.hostname;
  }

  function showLang(code) {
    label.textContent = LANGS[code];
    items.forEach(function (item) {
      if (item.dataset.lang === code) {
        item.setAttribute('aria-current', 'true');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  function setOpen(open) {
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  }

  // Google's script is only loaded once a visitor has chosen a non-English language.
  function loadTranslate() {
    document.querySelectorAll(NO_TRANSLATE).forEach(function (el) {
      el.setAttribute('translate', 'no');
    });

    var holder = document.createElement('div');
    holder.id = 'google_translate_element';
    holder.className = 'visually-hidden';
    document.body.appendChild(holder);

    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement(
        { pageLanguage: 'en', includedLanguages: 'es,de,fr,nl', autoDisplay: false },
        'google_translate_element'
      );
    };

    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = function () {
      writeCookie('', true);
      showLang('en');
    };
    document.head.appendChild(script);
  }

  var current = readLang();
  showLang(current);
  if (current !== 'en') loadTranslate();

  button.addEventListener('click', function () {
    setOpen(menu.hidden);
  });

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      var code = item.dataset.lang;
      setOpen(false);
      if (code === current) return;
      if (code === 'en') {
        writeCookie('', true);
      } else {
        writeCookie('/en/' + code, false);
      }
      window.location.reload();
    });
  });

  document.addEventListener('click', function (e) {
    if (!root.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      button.focus();
    }
  });
})();

(function prefillEnquiryType() {
  var select = document.getElementById('enquiryType');
  if (!select) return;
  var wanted = new URLSearchParams(window.location.search).get('enquiry');
  if (!wanted) return;
  for (var i = 0; i < select.options.length; i++) {
    if (select.options[i].value === wanted) {
      select.value = wanted;
      break;
    }
  }
})();

(function contactForm() {
  var form = document.querySelector('[data-form]');
  if (!form) return;
  var status = form.querySelector('.form-status');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (response) {
        if (!response.ok) throw new Error('submission failed');
        status.textContent = "Thank you — your enquiry has been sent. We'll be in touch soon.";
        status.hidden = false;
        form.reset();
      })
      .catch(function () {
        status.textContent = 'Something went wrong sending your message. Please email us directly instead.';
        status.hidden = false;
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();

(function countUpStats() {
  var els = document.querySelectorAll('.stat-value[data-target]');
  if (!els.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(el) {
    var target = parseInt(el.dataset.target, 10);
    var suffix = el.dataset.suffix || '';
    if (reduceMotion || !target) {
      el.textContent = target.toLocaleString() + suffix;
      return;
    }

    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString() + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  els.forEach(function (el) {
    observer.observe(el);
  });
})();
