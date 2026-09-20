/* =================================================================
   PUT YOUR WHATSAPP NUMBER HERE
   Country code + number, digits only, no "+", no spaces, no dashes.
   Example for India: '91' + 10-digit number.
================================================================= */
var WHATSAPP_NUMBER = '919876543210';

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------------------------------------
     Mobile nav toggle
  --------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------
     Open / closed status, based on real local time
     Hours: Mon-Fri 9am-8pm, Sat 9am-9pm, Sun closed
  --------------------------------------------- */
  var HOURS = {
    0: null,          // Sunday - closed
    1: [9, 20],
    2: [9, 20],
    3: [9, 20],
    4: [9, 20],
    5: [9, 20],
    6: [9, 21]
  };

  function updateStatus() {
    var badge = document.getElementById('statusBadge');
    var text = document.getElementById('statusText');
    if (!badge || !text) return;

    var now = new Date();
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var today = HOURS[day];

    var isOpen = today && hour >= today[0] && hour < today[1];

    badge.classList.toggle('is-open', isOpen);
    badge.classList.toggle('is-closed', !isOpen);

    if (isOpen) {
      var closeHour = today[1];
      var closeLabel = (closeHour > 12 ? closeHour - 12 : closeHour) + ':00 ' + (closeHour >= 12 ? 'PM' : 'AM');
      text.textContent = 'Open now · closes ' + closeLabel;
    } else {
      text.textContent = 'Closed now · opens 9:00 AM';
    }
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------------------------------------------
     Reveal the service menu once it scrolls into view
  --------------------------------------------- */
  var menuLists = document.querySelectorAll('.menu-list');

  if ('IntersectionObserver' in window && menuLists.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    menuLists.forEach(function (list) { observer.observe(list); });
  } else {
    menuLists.forEach(function (list) { list.classList.add('is-visible'); });
  }

  /* ---------------------------------------------
     Floating WhatsApp button — appears after scrolling
     (it also opens the appointment modal, handled below)
  --------------------------------------------- */
  var fab = document.getElementById('fabWhatsapp');

  if (fab) {
    var toggleFab = function () {
      fab.classList.toggle('is-visible', window.scrollY > 480);
    };
    toggleFab();
    window.addEventListener('scroll', toggleFab, { passive: true });
  }

  /* ---------------------------------------------
     Appointment modal
  --------------------------------------------- */
  var overlay = document.getElementById('modalOverlay');
  var openTriggers = document.querySelectorAll('.js-open-modal');
  var closeBtn = document.getElementById('modalClose');
  var form = document.getElementById('appointmentForm');
  var formError = document.getElementById('formError');
  var lastFocused = null;

  var formPanel = document.getElementById('formPanel');
  var confirmPanel = document.getElementById('confirmPanel');
  var contactInput = document.getElementById('clientContact');
  var contactError = document.getElementById('contactError');
  var editDetailsBtn = document.getElementById('editDetailsBtn');
  var confirmSendBtn = document.getElementById('confirmSendBtn');

  function showPanel(panel) {
    formPanel.hidden = panel !== 'form';
    confirmPanel.hidden = panel !== 'confirm';
  }

  function openModal() {
    if (!overlay) return;
    lastFocused = document.activeElement;
    showPanel('form');
    overlay.hidden = false;
    // next frame, so the transition actually plays
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    var firstField = document.getElementById('clientName');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      overlay.hidden = true;
      showPanel('form');
    }, 250);
    if (lastFocused) lastFocused.focus();
  }

  openTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && !overlay.hidden) closeModal();
  });

  /* --- Live check: contact field accepts numbers only, max 10 digits --- */
  function digitsOnly(value) {
    return value.replace(/\D/g, '');
  }

  if (contactInput) {
    contactInput.addEventListener('input', function () {
      var rawValue = contactInput.value;
      var cleaned = digitsOnly(rawValue);
      var hadLetters = cleaned !== rawValue;

      if (hadLetters) {
        // strip anything that isn't a digit as they type
        contactInput.value = cleaned;
        contactInput.classList.add('is-invalid');
        contactError.textContent = 'Only numbers are allowed.';
        contactError.hidden = false;
      } else if (cleaned.length > 10) {
        contactInput.classList.add('is-invalid');
        contactError.textContent = 'Contact number cannot exceed 10 digits.';
        contactError.hidden = false;
      } else {
        // don't nag about "too short" while they're still typing
        contactInput.classList.remove('is-invalid');
        contactError.hidden = true;
      }
    });

    // only check "too short" once they leave the field, not on every keystroke
    contactInput.addEventListener('blur', function () {
      var digitCount = digitsOnly(contactInput.value).length;
      if (digitCount > 0 && digitCount < 10) {
        contactInput.classList.add('is-invalid');
        contactError.textContent = 'Contact number must be exactly 10 digits.';
        contactError.hidden = false;
      }
    });
  }

  /* --- Step 1: submit the form -> validate -> show confirmation --- */
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = document.getElementById('clientName').value.trim();
      var contact = contactInput.value.trim();
      var haircut = document.getElementById('haircutType').value;
      var digitCount = digitsOnly(contact).length;

      if (digitCount > 10) {
        contactInput.classList.add('is-invalid');
        contactError.textContent = 'Contact number cannot exceed 10 digits.';
        contactError.hidden = false;
        contactInput.focus();
        return;
      }

      if (digitCount > 0 && digitCount < 10) {
        contactInput.classList.add('is-invalid');
        contactError.textContent = 'Contact number must be exactly 10 digits.';
        contactError.hidden = false;
        contactInput.focus();
        return;
      }

      if (!name || !contact || !haircut) {
        formError.hidden = false;
        return;
      }
      formError.hidden = true;

      document.getElementById('confirmName').textContent = name;
      document.getElementById('confirmContact').textContent = contact;
      document.getElementById('confirmHaircut').textContent = haircut;

      showPanel('confirm');
    });
  }

  /* --- Step 2: confirmation panel --- */
  if (editDetailsBtn) {
    editDetailsBtn.addEventListener('click', function () {
      showPanel('form');
      document.getElementById('clientName').focus();
    });
  }

  if (confirmSendBtn) {
    confirmSendBtn.addEventListener('click', function () {
      var name = document.getElementById('confirmName').textContent;
      var contact = document.getElementById('confirmContact').textContent;
      var haircut = document.getElementById('confirmHaircut').textContent;

      var message =
        'Hi, I would like to book an appointment at Steel & Strop.\n' +
        'Name: ' + name + '\n' +
        'Contact: ' + contact + '\n' +
        'Haircut: ' + haircut;

      var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

      window.open(waUrl, '_blank', 'noopener');

      form.reset();
      contactInput.classList.remove('is-invalid');
      contactError.hidden = true;
      closeModal();
    });
  }

});