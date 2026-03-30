/* ============================================
   DARWIN HAS TALENT — Main JS v2
   ============================================ */

(function () {
  'use strict';

  // ---------- Navbar scroll ----------
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ---------- Mobile nav ----------
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on backdrop click
  document.addEventListener('click', function (e) {
    if (navLinks.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !navToggle.contains(e.target)) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  // ---------- Smooth scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - 76;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ---------- Scroll reveal ----------
  var revealTargets = document.querySelectorAll(
    '.pillar-card, .portal-card, .timeline-card, .mission-block, ' +
    '.documentary-teaser, .story-content, .story-visual, ' +
    '.waitlist-card, .contact-form, .contact-sidebar, .section-header'
  );

  revealTargets.forEach(function (el) { el.classList.add('reveal'); });

  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  revealTargets.forEach(function (el) { revealObs.observe(el); });

  // ---------- Stagger pillar/portal/timeline cards ----------
  ['pillars-grid', 'portals-grid', 'roadmap-timeline'].forEach(function (cls) {
    var parent = document.querySelector('.' + cls);
    if (!parent) return;
    parent.querySelectorAll('.pillar-card, .portal-card, .timeline-card').forEach(function (card, i) {
      card.style.transitionDelay = (i * 0.1) + 's';
    });
  });

  // ---------- Stat counter ----------
  document.querySelectorAll('.hero-stat-number').forEach(function (el) {
    var raw    = el.textContent.replace(/,/g, '');
    var target = parseInt(raw, 10);
    if (isNaN(target)) return;

    var triggered = false;
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        var start = null;
        var dur   = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(ease * target).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });

    obs.observe(el);
  });

  // ---------- Google Forms embed — show iframe once URL is set ----------
  var gformIframe      = document.getElementById('waitlistGform');
  var gformPlaceholder = document.getElementById('gformPlaceholder');
  var PLACEHOLDER_URL  = 'YOUR_GOOGLE_FORM_EMBED_URL';

  if (gformIframe && gformIframe.src && gformIframe.src.indexOf(PLACEHOLDER_URL) === -1) {
    // Real URL has been set — hide placeholder, show iframe
    if (gformPlaceholder) gformPlaceholder.hidden = true;
    gformIframe.hidden = false;
  }

  // ---------- Contact form ----------
  var contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = { timestamp: new Date().toISOString() };
      new FormData(contactForm).forEach(function (v, k) { data[k] = v; });

      var msgs = JSON.parse(localStorage.getItem('dht_contacts') || '[]');
      msgs.push(data);
      localStorage.setItem('dht_contacts', JSON.stringify(msgs));

      var btn = contactForm.querySelector('button[type="submit"]');
      var orig = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      contactForm.reset();

      setTimeout(function () {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.opacity = '1';
      }, 3500);
    });
  }

})();
