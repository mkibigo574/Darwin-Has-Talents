/* ============================================
   DARWIN HAS TALENT — Main JS v2
   ============================================ */

(function () {
  'use strict';

  // ---------- Countdown timer ----------
  var AUDITION_DATE = new Date('2027-01-01T00:00:00');
  function updateCountdown() {
    var now  = new Date();
    var diff = AUDITION_DATE - now;
    if (diff <= 0) {
      document.getElementById('cdDays').textContent  = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMins').textContent  = '00';
      document.getElementById('cdSecs').textContent  = '00';
      return;
    }
    var days  = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins  = Math.floor((diff % 3600000)  / 60000);
    var secs  = Math.floor((diff % 60000)    / 1000);
    var d = document.getElementById('cdDays');
    var h = document.getElementById('cdHours');
    var m = document.getElementById('cdMins');
    var s = document.getElementById('cdSecs');
    if (d) d.textContent = String(days).padStart(3, '0');
    if (h) h.textContent = String(hours).padStart(2, '0');
    if (m) m.textContent = String(mins).padStart(2, '0');
    if (s) s.textContent = String(secs).padStart(2, '0');
  }
  if (document.getElementById('cdDays')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ---------- Hero video fade-in ----------
  var heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    function onVideoReady() { heroVideo.classList.add('loaded'); }
    if (heroVideo.readyState >= 3) {
      onVideoReady();
    } else {
      heroVideo.addEventListener('canplaythrough', onVideoReady, { once: true });
      heroVideo.addEventListener('loadeddata', onVideoReady, { once: true });
    }
  }

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


  // ---------- Supabase config ----------
  var SB_URL = 'https://mxaezkfyowvotzfrnfil.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14YWV6a2Z5b3d2b3R6ZnJuZmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzA2MzAsImV4cCI6MjA4NzQ0NjYzMH0.ueMC6olfg0oR7mG_UtdcRCk61YRdMGzkUdqiHvmirT4';

  function sbInsert(table, payload) {
    return fetch(SB_URL + '/rest/v1/' + table, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).catch(function () {});
  }

  // ---------- Waitlist → Google Forms + Supabase ----------
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

      var nameVal   = waitlistForm.querySelector('#wf-name').value.trim();
      var regionVal = waitlistForm.querySelector('#wf-region').value;
      var roleVal   = roleChecked ? roleChecked.value : '';

      // Send to Google Forms (fire-and-forget)
      var gBody = new FormData(waitlistForm);
      fetch(GFORM_URL, { method: 'POST', mode: 'no-cors', body: gBody }).catch(function () {});

      // Send to Supabase (fire-and-forget)
      sbInsert('registrations', {
        name:   nameVal,
        email:  emailVal,
        role:   roleVal,
        region: regionVal || null
      });

      // Show success immediately
      waitlistForm.hidden = true;
      waitlistSuccess.hidden = false;
    });
  }

  // ---------- Contact form → Supabase ----------
  var contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(contactForm);

      sbInsert('contacts', {
        name:    fd.get('contact-name')    || '',
        email:   fd.get('contact-email')   || '',
        subject: fd.get('contact-subject') || '',
        message: fd.get('contact-message') || '',
        status:  'new'
      });

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
