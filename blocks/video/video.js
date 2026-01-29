
function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay = true, background = false) {
  const video = document.createElement('video');

  // Mute required for autoplay
  video.muted = true;

  // Autoplay & loop if requested
  if (autoplay || background) {
    video.autoplay = true;
    video.loop = true;
  }

  // Remove controls
  video.controls = false;

  // Plays inline for mobile
  video.playsInline = true;

  // Hide from assistive tech if decorative
  video.setAttribute('aria-hidden', 'true');

  // Add source
  const sourceEl = document.createElement('source');
  sourceEl.src = source;
  sourceEl.type = 'video/mp4';
  video.appendChild(sourceEl);

  // Ensure playback starts
  const tryPlay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Retry after a short delay if blocked
        setTimeout(tryPlay, 200);
      });
    }
  };

  tryPlay();

  // Extra safeguard: restart if it somehow stops
  video.addEventListener('ended', () => {
    video.currentTime = 0;
    tryPlay();
  });

  return video;
}




const loadVideoEmbed = (block, link, autoplay, background) => {
  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  if (isYoutube) {
    const url = new URL(link);
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = true;
    });
  }
};

function runHomePageCode(block) {
  const main = block.closest('main');
  const sections = main.querySelectorAll(':scope > .section');
  const firstSection = sections[0];

  if (!firstSection) return;

  const isInsideFirstSection = firstSection.contains(block);
  if (!isInsideFirstSection) return;

  const header = document.querySelector('header');
  if (!header) return;

  // Add transparent class on initial load
  header.classList.add('transparent-header-desktop');

  function handleScroll() {
    const scrolledPast = window.scrollY >= window.innerHeight;

    if (scrolledPast) {
      // Remove transparency after scrolling 1 viewport
      header.classList.remove('transparent-header-desktop');
    } else {
      // Add it back when user scrolls up above that point
      header.classList.add('transparent-header-desktop');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
}

export default function decorate(block) {
  if (window.location.pathname === '/') {
    runHomePageCode(block);
  }

  const link = block.querySelector(':scope div:nth-child(1) > div a').href.trim();

  // Remove link text from the block
  block.querySelector(':scope div:nth-child(1)').remove();


  // Video text content
  block.querySelector(':scope div:nth-child(1)')?.classList.add('video-text-wrapper');

  const videoTextWrapper = block.querySelector('.video-text-wrapper');
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('video-button-container');
  const buttons = videoTextWrapper.querySelectorAll('p.button-container');
  buttons.forEach((btn) => {
    buttonContainer.appendChild(btn);
  });

  videoTextWrapper.querySelector(':scope > div')?.appendChild(buttonContainer);
  

  block.dataset.embedLoaded = false;
  const autoplay = block.classList ? block.classList.contains('autoplay') : false;
  const playOnLoad = block.classList ? block.classList.contains('playonload') : false;
  loadVideoEmbed(block, link, playOnLoad, autoplay);
}
