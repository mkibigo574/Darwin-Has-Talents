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


  // ---------- Waitlist → Google Forms silent submit ----------
  var GFORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe29UGd-X-3vQIgfRqW8I6RcZNalW5zOpnErlOiCzQFezneeQ/formResponse';

  var waitlistForm    = document.getElementById('waitlistForm');
  var waitlistSuccess = document.getElementById('waitlistSuccess');

  if (waitlistForm) {
    waitlistForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate
      var valid = true;

      var nameGroup = waitlistForm.querySelector('#wf-name').closest('.cgf-group');
      var emailGroup = waitlistForm.querySelector('#wf-email').closest('.cgf-group');
      var roleChecked = waitlistForm.querySelector('input[name="entry.1483143165"]:checked');

      nameGroup.classList.remove('has-error');
      emailGroup.classList.remove('has-error');
      document.getElementById('role-error').style.display = 'none';

      if (!waitlistForm.querySelector('#wf-name').value.trim()) {
        nameGroup.classList.add('has-error'); valid = false;
      }
      var emailVal = waitlistForm.querySelector('#wf-email').value.trim();
      if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        emailGroup.classList.add('has-error'); valid = false;
      }
      if (!roleChecked) {
        document.getElementById('role-error').style.display = 'block'; valid = false;
      }
      if (!valid) return;

      // Show spinner
      var btn = document.getElementById('wfSubmitBtn');
      btn.querySelector('.btn-label').hidden = true;
      btn.querySelector('.btn-spinner').hidden = false;
      btn.disabled = true;

      // Submit to Google Forms (no-cors — response is opaque but data is saved)
      var body = new FormData(waitlistForm);
      fetch(GFORM_URL, { method: 'POST', mode: 'no-cors', body: body })
        .finally(function () {
          waitlistForm.hidden = true;
          waitlistSuccess.hidden = false;
        });
    });
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
