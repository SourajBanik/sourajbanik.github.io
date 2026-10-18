/* No frameworks, trackers, cookies, or external scripts. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  // One accessible switch; remember a visitor's explicit choice on this origin.
  // Failure to access localStorage must never block the switch or the rest of the site.
  const themeToggle = $('.theme-toggle');
  const themeKey = 'souraj-portfolio-theme';

  function applyTheme(theme, persist = false) {
    const selected = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = selected;
    if (themeToggle) {
      themeToggle.setAttribute('aria-checked', String(selected === 'light'));
      themeToggle.title = `Switch to ${selected === 'light' ? 'dark' : 'light'} mode`;
    }
    const themeColor = $('meta[name="theme-color"]');
    if (themeColor) themeColor.content = selected === 'light' ? '#f5f8fc' : '#090d16';
    if (persist) {
      try { window.localStorage.setItem(themeKey, selected); }
      catch { /* Theme still works for this visit when storage is blocked. */ }
    }
  }

  applyTheme(document.documentElement.dataset.theme);
  let themeTransitionTimer;
  if (themeToggle) {
    themeToggle.hidden = false;
    themeToggle.addEventListener('click', () => {
      // Smooth surface-color changes, but keep motion preferences in control.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('theme-changing');
        window.clearTimeout(themeTransitionTimer);
        themeTransitionTimer = window.setTimeout(() => document.documentElement.classList.remove('theme-changing'), 420);
      }
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }
  // Keep other tabs consistent when the same site is open more than once.
  window.addEventListener('storage', event => {
    if (event.key === themeKey && (event.newValue === 'light' || event.newValue === 'dark' || event.newValue === null)) {
      applyTheme(event.newValue);
    } else if (event.key === null) {
      applyTheme('dark');
    }
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) document.documentElement.classList.add('motion-ready');

  // Scroll progress: updates one compositor transform, scheduled at most once per frame.
  if (!reducedMotion) {
    const indicator = $('.scroll-progress');
    let scrollFrame = 0;
    const updateProgress = () => {
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const fraction = Math.min(1, Math.max(0, window.scrollY / total));
      if (indicator) indicator.style.setProperty('--scroll-progress', fraction.toFixed(4));
      scrollFrame = 0;
    };
    const scheduleProgress = () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', scheduleProgress, { passive: true });
    window.addEventListener('resize', scheduleProgress, { passive: true });
    window.addEventListener('load', scheduleProgress, { once: true });
    scheduleProgress();

    // Keep the finance blueprint flat until a fine pointer moves INSIDE the card.
    // Pointer coordinates use the untransformed card layout to avoid wobbling
    // while the card itself is tilting. Touch and reduced-motion views stay flat.
    const visual = $('.hero-visual');
    const lab = visual ? $('.lab-card', visual) : null;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (visual && lab) {
      let tiltFrame = 0;
      let targetX = 0;
      let targetY = 0;
      const resetTilt = () => {
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
        lab.classList.remove('is-tilting');
        lab.style.removeProperty('--hero-rx');
        lab.style.removeProperty('--hero-ry');
      };
      lab.addEventListener('pointermove', event => {
        if (!finePointer.matches || event.pointerType === 'touch') return;
        const visualBounds = visual.getBoundingClientRect();
        const left = visualBounds.left + lab.offsetLeft;
        const top = visualBounds.top + lab.offsetTop;
        const x = Math.max(0, Math.min(1, (event.clientX - left) / lab.offsetWidth));
        const y = Math.max(0, Math.min(1, (event.clientY - top) / lab.offsetHeight));
        targetX = (0.5 - y) * 8;    // maximum +/- 4deg on the X axis
        targetY = (x - 0.5) * 10;   // maximum +/- 5deg on the Y axis
        if (tiltFrame) return;
        tiltFrame = window.requestAnimationFrame(() => {
          lab.classList.add('is-tilting');
          lab.style.setProperty('--hero-rx', `${targetX.toFixed(2)}deg`);
          lab.style.setProperty('--hero-ry', `${targetY.toFixed(2)}deg`);
          tiltFrame = 0;
        });
      }, { passive: true });
      lab.addEventListener('pointerleave', resetTilt);
      lab.addEventListener('pointercancel', resetTilt);
      window.addEventListener('blur', resetTilt);
      window.addEventListener('resize', resetTilt, { passive: true });
      if (finePointer.addEventListener) finePointer.addEventListener('change', resetTilt);
    }

    // A subtle mouse-following background glow on cards; no effect on touch.
    projectSpotlights();
  }

  function projectSpotlights() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    $$('.project-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${Math.round(event.clientX - bounds.left)}px`);
        card.style.setProperty('--spot-y', `${Math.round(event.clientY - bounds.top)}px`);
      }, { passive: true });
    });
  }

  const menuToggle = $('.menu-toggle');
  const mobileMenu = $('#mobile-menu');

  function closeMenu() {
    mobileMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    $('use', menuToggle).setAttribute('href', '#i-menu');
  }

  menuToggle.addEventListener('click', () => {
    const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
    mobileMenu.hidden = !opening;
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    $('use', menuToggle).setAttribute('href', opening ? '#i-close' : '#i-menu');
  });
  $$('a', mobileMenu).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileMenu.hidden) {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!mobileMenu.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  window.matchMedia('(min-width: 768px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });

  // Project details come from the supplied resume and the new Power Query description provided by Souraj.
  // We never interpolate input, URLs, or remote data into these templates.
  const projectCases = {
    workflow: `

<h2 id="case-title">Financial statement review workflow</h2>
      <p class="case-intro">A Power Automate workflow designed and implemented to improve tracking, notifications, handoffs, and follow-up visibility during financial statement preparation and review.</p>
      <div class="tags"><span>Microsoft Power Automate</span><span>Financial reporting</span><span>Review coordination</span></div>
      <h3>The challenge</h3>
      <p>Financial reporting involves multiple preparation and review activities. Manual follow-ups and scattered status updates add coordination effort and make handoffs harder to track.</p>
      <h3>My contribution</h3>
      <ul><li>Designed and implemented a Power Automate workflow around the preparation and review process.</li><li>Centralized review status and improved visibility over tracking and handoffs.</li><li>Streamlined notifications and follow-ups to support timely completion of reporting activities.</li></ul>
      <div class="case-impact"><strong>Approximately 10 hours saved per month</strong><p>Outcome reported in my professional experience. The benefit was reduced manual coordination and clearer review visibility.</p></div>
      <h3>Why this matters</h3>
      <p>A useful reporting automation does more than move a file. It makes ownership and the next action clearer, while keeping review decisions with the people responsible.</p>

<div class="case-links"><a class="button button-primary" href="mailto:souraj44@gmail.com?subject=Let%27s%20discuss%20your%20finance%20automation%20experience">Discuss my approach <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>`,
    powerquery: `

<h2 id="case-title">Client-package data preparation for Workiva</h2>
      <p class="case-intro">I developed a Power Query solution to clean and transform client-package data before Workiva updates, reducing manual effort and supporting greater process consistency, timeliness, and team efficiency.</p>
      <div class="tags"><span>Power Query</span><span>Workiva</span><span>Financial reporting</span><span>Data transformation</span></div>
      <h3>The challenge</h3>
      <p>Client-package data needs to be prepared before it is used in financial reporting updates. Repeating manual cleaning and transformation work can slow the reporting process and create inconsistent preparation steps.</p>
      <h3>What I developed</h3>
      <ul><li>Developed a Power Query solution to clean and transform client-package data.</li><li>Used repeatable data-preparation steps ahead of Workiva updates.</li><li>Reduced manual handling and improved the consistency of the preparation process and team handoffs.</li></ul>
      <div class="case-impact"><strong>Less manual effort. More consistent reporting.</strong><p>Helped improve the timeliness of Workiva updates and overall team efficiency. No unprovided hours-saved or percentage metric is claimed.</p></div>
      <h3>Why it matters</h3>
      <p>This project brings data-transformation automation into a real financial reporting workflow. The underlying skills&mdash;repeatable preparation, cleaner inputs, and more reliable handoffs&mdash;extend beyond a single reporting platform.</p>

<div class="case-links"><a class="button button-primary" href="mailto:souraj44@gmail.com?subject=Let%27s%20discuss%20your%20Power%20Query%20project">Discuss this project <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>`,
    agent: `

<h2 id="case-title">Custom process query agent</h2>
      <p class="case-intro">A Microsoft Copilot and Copilot Studio-based SOP agent built to make documented process steps and recurring procedure guidance easier to find.</p>
      <div class="tags"><span>Microsoft Copilot</span><span>Copilot Studio</span><span>SOP guidance</span></div>
      <h3>The challenge</h3>
      <p>Frequent questions about standard operating procedures (SOPs) create repetitive knowledge-sharing work. Team members need an easier way to find the relevant steps and guidance.</p>
      <h3>My contribution</h3>
      <ul><li>Built a custom Copilot-based process query agent.</li><li>Centralized access to SOP steps, workflow guidance, and recurring process information.</li><li>Created an AI-assisted support channel to make common guidance easier to retrieve.</li></ul>
      <div class="case-impact"><strong>Easier access to SOP guidance</strong><p>Reduced repetitive knowledge-sharing effort and supported faster query resolution. No measured percentage improvement is claimed.</p></div>
      <h3>My approach to finance AI</h3>
      <p>I see AI as support for finding information and navigating a process, not as a replacement for accounting judgment. Governed workflows and human review are central to the direction I am building toward.</p>

<div class="case-links"><a class="button button-primary" href="mailto:souraj44@gmail.com?subject=Let%27s%20discuss%20your%20Copilot%20process%20agent">Talk about the project <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>`,
    soi: `

<h2 id="case-title">Automated Statement of Investments</h2>
      <p class="case-intro">Developed a Python-based web application that takes holdings-report data from a client file and generates a Statement of Investments, replacing time-consuming manual preparation steps.</p>
      <div class="tags"><span>Python</span><span>Web application</span><span>Holdings data</span><span>Investment reporting</span></div>
      <h3>The challenge</h3>
      <p>Preparing a Statement of Investments from client-provided holdings data requires manual effort and time. The goal was to make the generation process more efficient.</p>
      <h3>What I built</h3>
      <ul><li>Developed a web application using Python.</li><li>Enabled it to take client holdings-report data as input.</li><li>Automated generation of the Statement of Investments from that data.</li></ul>
      <div class="case-impact"><strong>48 hours saved per month</strong><p>Monthly time saving reported for this automation. This is a user-provided result, not an independently audited benchmark.</p></div>
      <h3>Why it matters</h3>
      <p>This project connects domain expertise in investment reporting with practical software automation to reduce repetitive statement-preparation work.</p>

<div class="case-links"><a class="button button-primary" href="mailto:souraj44@gmail.com?subject=Statement%20of%20Investments%20automation">Discuss this project <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>`,
    analytics: `

<h2 id="case-title">Finance analytics &amp; reporting visibility</h2>
      <p class="case-intro">A Power BI project portfolio focused on finance analytics, reporting visibility, and dashboarding, supporting my transition toward data-driven reporting and finance transformation.</p>
      <div class="tags"><span>Power BI</span><span>Finance analytics</span><span>Dashboarding</span></div>
      <h3>The focus</h3>
      <p>Use a finance-first perspective to create reporting views that make information easier to understand. My professional background in financial statements, variance analysis, and reconciliations informs that perspective.</p>
      <h3>What this portfolio represents</h3>
      <ul><li>Applied learning and project practice in finance analytics.</li><li>Dashboarding and reporting visibility rather than a claim of a production enterprise analytics system.</li><li>A complement to hands-on financial reporting and workflow automation experience.</li></ul>
      <div class="case-impact"><strong>Finance context meets data visualization</strong><p>This is portfolio practice. No client deployment, savings figure, specific dashboard feature set, or validated performance improvement is claimed here.</p></div>
      <h3>Explore my work</h3>
      <p>The link below opens my GitHub profile. Repository availability and published project detail may vary. No invented repository or live dashboard link is used on this site.</p>

<div class="case-links"><a class="button button-primary" href="https://github.com/SourajBanik" target="_blank" rel="noopener noreferrer">Visit my GitHub profile <svg class="icon" aria-hidden="true"><use href="#i-up-right"/></svg></a></div>`
  };

  const dialog = $('#case-dialog');
  const caseContent = $('#case-content');
  let lastProjectButton = null;

  $$('.project-open').forEach(button => {
    button.addEventListener('click', () => {
      const template = projectCases[button.dataset.project];
      if (!template) return;
      lastProjectButton = button;
      caseContent.innerHTML = template;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
      $('.dialog-close').focus();
    });
  });
  // Keep Tab within the dialog, including browsers that otherwise move focus
  // from the last control into browser chrome before wrapping.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = $$('a[href], button:not([disabled]), [tabindex="0"]', dialog)
      .filter(element => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (lastProjectButton) lastProjectButton.focus({ preventScroll: true });
  });

  // Filtering does not require a network request or a backend.
  const projectCards = $$('.project-card');
  // Scroll-snap projects carousel: accessible arrows, keyboard and native swipe.
  // All five cards stay in the DOM, and filters reuse the existing case studies.
  const projectRail = $('#project-carousel');
  const previousProject = $('.carousel-prev');
  const nextProject = $('.carousel-next');
  const carouselPosition = $('#carousel-position');
  const visibleProjects = () => projectCards.filter(card => !card.hidden);
  const maxRailScroll = () => Math.max(0, projectRail.scrollWidth - projectRail.clientWidth);
  let carouselFrame = 0;
  function updateProjectCarousel() {
    carouselFrame = 0;
    const cards = visibleProjects();
    const left = projectRail.getBoundingClientRect().left;
    const right = projectRail.getBoundingClientRect().right;
    const max = maxRailScroll();
    const canScroll = max > 3;
    // Keep single-category results centered instead of stranded on the left.
    projectRail.classList.toggle('carousel-static', !canScroll && cards.length < 5);
    previousProject.disabled = !canScroll || projectRail.scrollLeft <= 3;
    nextProject.disabled = !canScroll || projectRail.scrollLeft >= max - 3;
    if (!cards.length) {
      carouselPosition.textContent = '00 / 00';
      return;
    }
    // Count cards that are at least 60% visible; a sliver of the next card
    // signals that the rail is scrollable without inflating the counter.
    const visibleIndexes = cards.map((card, i) => {
      const rect = card.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(rect.right, right) - Math.max(rect.left, left));
      return overlap >= rect.width * .60 ? i : -1;
    }).filter(i => i !== -1);
    const first = visibleIndexes.length ? visibleIndexes[0] : 0;
    const last = visibleIndexes.length ? visibleIndexes[visibleIndexes.length-1] : first;
    const digits = number => String(number).padStart(2, '0');
    const visibleLabel = first === last ? digits(first+1) : `${digits(first+1)}–${digits(last+1)}`;
    carouselPosition.textContent = `${visibleLabel} / ${digits(cards.length)}`;
  }
  function scheduleCarouselUpdate() {
    if (!carouselFrame) carouselFrame = window.requestAnimationFrame(updateProjectCarousel);
  }
  function moveProjectCarousel(direction) {
    const cards = visibleProjects();
    if (!cards.length || maxRailScroll() < 3) return;
    const currentLeft = projectRail.getBoundingClientRect().left;
    const positions = cards.map(card => card.offsetLeft - cards[0].offsetLeft);
    const current = positions.reduce((best, position, i) =>
      Math.abs(position - projectRail.scrollLeft) < Math.abs(positions[best] - projectRail.scrollLeft) ? i : best, 0);
    // Move exactly one card; clamp naturally at the last available snap point.
    const next = Math.min(cards.length-1, Math.max(0, current+direction));
    const target = Math.max(0, Math.min(maxRailScroll(), positions[next]));
    projectRail.scrollTo({left: target, behavior: reducedMotion ? 'instant' : 'smooth'});
  }
  previousProject.addEventListener('click', () => moveProjectCarousel(-1));
  nextProject.addEventListener('click', () => moveProjectCarousel(1));
  projectRail.addEventListener('scroll', scheduleCarouselUpdate, {passive:true});
  projectRail.addEventListener('keydown', event => {
    if (event.target !== projectRail) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    moveProjectCarousel(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('resize', scheduleCarouselUpdate, {passive:true});
  window.addEventListener('load', scheduleCarouselUpdate, {once:true});
  if ('ResizeObserver' in window) new ResizeObserver(scheduleCarouselUpdate).observe(projectRail);
  scheduleCarouselUpdate();

  projectCards.forEach(card => card.addEventListener('animationend', event => {
    if (event.animationName === 'motion-filter-in') card.classList.remove('filter-animating');
  }));
  $$('.filter').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filter').forEach(other => {
        const selected = other === button;
        other.classList.toggle('active', selected);
        other.setAttribute('aria-pressed', String(selected));
      });
      let shown = 0;
      const incoming = [];
      projectCards.forEach(card => {
        const show = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
        card.hidden = !show;
        card.classList.remove('filter-animating');
        if (show) {
          card.classList.add('visible');
          incoming.push(card);
          shown += 1;
        }
      });
      // Animate incoming content only; all filter changes remain immediate to assistive tech.
      if (!reducedMotion) {
        window.requestAnimationFrame(() => incoming.forEach(card => {
          if (!card.hidden) card.classList.add('filter-animating');
        }));
      }
      // Reset the rail and controls so filtered sets always start on the first card.
      projectRail.scrollTo({left: 0, behavior: 'instant'});
      scheduleCarouselUpdate();
      $('#filter-status').textContent = `Showing ${shown} ${shown === 1 ? 'project' : 'projects'}.`;
    });
  });

  let toastTimer;
  const showToast = message => {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3800);
  };
  $('[data-copy]').addEventListener('click', async event => {
    const address = event.currentTarget.dataset.copy;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(address);
      showToast('Email address copied. Let\'s connect.');
    } catch {
      // Local file/browser restrictions: keep the address visible and selectable.
      const emailLink = $('.email-link');
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(emailLink);
      selection.removeAllRanges();
      selection.addRange(range);
      showToast('Email selected. Press Ctrl+C (or Cmd+C) to copy.');
    }
  });

  $('#current-year').textContent = String(new Date().getFullYear());

  // Content remains visible if JavaScript or IntersectionObserver is unavailable.
  if ('IntersectionObserver' in window) {
    if (!reducedMotion) {
      document.documentElement.classList.add('js');
      const reveals = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            reveals.unobserve(entry.target);
          }
        });
      }, { threshold: 0.07, rootMargin: '0px 0px -20px 0px' });
      $$('.reveal').forEach(element => reveals.observe(element));
    }
    const navigation = $$('.desktop-nav a');
    const sections = ['work', 'expertise', 'experience', 'about'].map(id => document.getElementById(id));
    const visibleSections = new Set();
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visibleSections.add(entry.target.id);
        else visibleSections.delete(entry.target.id);
      });
      const current = sections.find(section => visibleSections.has(section.id));
      navigation.forEach(link => {
        if (current && link.hash === `#${current.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }
})();
