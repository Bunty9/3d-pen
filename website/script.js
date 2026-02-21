(() => {
  'use strict';

  // --- Navigation: solid on scroll ---
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('nav--solid', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile hamburger toggle ---
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });

  // Close mobile nav on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });

  // --- Active nav link highlight ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = links.querySelectorAll('a[href^="#"]');

  const highlightNav = () => {
    const scrollPos = window.scrollY + 120;
    let currentId = '';

    sections.forEach(section => {
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  // --- Scroll reveal (IntersectionObserver) ---
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // --- Gallery Lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const galleryItems = document.querySelectorAll('.gallery__item');
  let currentIndex = 0;

  const galleryImages = Array.from(galleryItems).map(item => {
    const img = item.querySelector('img');
    return { src: img.src, alt: img.alt };
  });

  const openLightbox = (index) => {
    currentIndex = index;
    lightboxImg.src = galleryImages[index].src;
    lightboxImg.alt = galleryImages[index].alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.alt = galleryImages[currentIndex].alt;
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    lightboxImg.src = galleryImages[currentIndex].src;
    lightboxImg.alt = galleryImages[currentIndex].alt;
  };

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter') openLightbox(i);
    });
  });

  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__prev').addEventListener('click', showPrev);
  lightbox.querySelector('.lightbox__next').addEventListener('click', showNext);

  // Close on backdrop click
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target === lightbox.querySelector('.lightbox__content')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  // --- Lazy image fade-in ---
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    if (img.complete) return;
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';
    img.addEventListener('load', () => {
      img.style.opacity = '1';
    }, { once: true });
  });
})();
