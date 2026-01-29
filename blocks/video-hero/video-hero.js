/**
 * Nike-style Video Hero Block
 * Full-viewport video background with overlaid text content and CTA buttons
 */

// Sample video URLs for demo purposes
const SAMPLE_VIDEOS = {
  desktop: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-through-a-park-515-large.mp4',
  mobile: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-running-through-a-park-515-large.mp4',
};

function createVideoElement(src) {
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.setAttribute('aria-hidden', 'true');

  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.appendChild(source);

  // Ensure autoplay works
  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setTimeout(tryPlay, 200);
      });
    }
  };

  video.addEventListener('loadeddata', tryPlay);
  tryPlay();

  return video;
}

function extractContent(block) {
  const rows = [...block.children];
  const content = {
    videoUrl: null,
    posterUrl: null,
    category: null,
    headline: null,
    subheadline: null,
    buttons: [],
  };

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;

    // Check for video link
    const link = row.querySelector('a');
    if (link && (link.href.includes('.mp4') || link.href.includes('youtube') || link.href.includes('youtu.be'))) {
      content.videoUrl = link.href;
      return;
    }

    // Check for poster image
    const picture = row.querySelector('picture');
    if (picture) {
      const img = picture.querySelector('img');
      if (img) {
        content.posterUrl = img.src;
      }
      return;
    }

    // Check for headline
    const headline = row.querySelector('h1, h2, h3');
    if (headline) {
      content.headline = headline.textContent;
      return;
    }

    // Check for buttons
    const buttonContainers = row.querySelectorAll('.button-container');
    if (buttonContainers.length > 0) {
      buttonContainers.forEach((bc) => {
        const btn = bc.querySelector('a');
        if (btn) {
          content.buttons.push({
            text: btn.textContent,
            href: btn.href,
            primary: content.buttons.length === 0,
          });
        }
      });
      return;
    }

    // Check for text paragraphs (category or subheadline)
    const paragraphs = row.querySelectorAll('p:not(.button-container)');
    paragraphs.forEach((p) => {
      const text = p.textContent.trim();
      if (!text) return;

      if (!content.category && text.length < 30) {
        content.category = text;
      } else if (!content.subheadline) {
        content.subheadline = text;
      }
    });
  });

  return content;
}

function buildHeroHTML(content) {
  const videoSrc = content.videoUrl || SAMPLE_VIDEOS.desktop;

  // Use sample content if none provided
  const category = content.category || 'Just Do It';
  const headline = content.headline || 'Move Your Way';
  const subheadline = content.subheadline || 'Discover the latest in performance and style.';
  const buttons = content.buttons.length > 0 ? content.buttons : [
    { text: 'Shop Now', href: '#', primary: true },
    { text: 'Explore', href: '#', primary: false },
  ];

  return `
    <div class="video-hero-media">
      <video muted autoplay loop playsinline aria-hidden="true">
        <source src="${videoSrc}" type="video/mp4">
      </video>
      <div class="video-hero-overlay"></div>
    </div>
    <div class="video-hero-content">
      <div class="video-hero-content-inner">
        ${category ? `<p class="video-hero-category">${category}</p>` : ''}
        <h1 class="video-hero-headline">${headline}</h1>
        ${subheadline ? `<p class="video-hero-subheadline">${subheadline}</p>` : ''}
        <div class="video-hero-buttons">
          ${buttons.map((btn, i) => `
            <a href="${btn.href}" class="video-hero-button ${i === 0 ? 'primary' : 'secondary'}">
              ${btn.text}
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function setupTransparentHeader(block) {
  const main = block.closest('main');
  const sections = main?.querySelectorAll(':scope > .section');
  const firstSection = sections?.[0];

  if (!firstSection?.contains(block)) return;

  const header = document.querySelector('header');
  if (!header) return;

  header.classList.add('transparent-header-desktop');

  function handleScroll() {
    const scrolledPast = window.scrollY >= window.innerHeight * 0.8;
    header.classList.toggle('transparent-header-desktop', !scrolledPast);
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
}

export default function decorate(block) {
  // Extract content from authored block
  const content = extractContent(block);

  // Clear block and rebuild with Nike-style structure
  block.innerHTML = buildHeroHTML(content);

  // Setup video autoplay
  const video = block.querySelector('video');
  if (video) {
    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setTimeout(tryPlay, 200);
        });
      }
    };
    tryPlay();
  }

  // Setup transparent header for homepage
  if (window.location.pathname === '/' || block.closest('.section')?.matches(':first-of-type')) {
    setupTransparentHeader(block);
  }
}
