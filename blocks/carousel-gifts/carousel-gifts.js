function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-gifts');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-gifts-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-gifts-slide');
  const realSlideIndex = (slideIndex + slides.length) % slides.length;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-gifts-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });

  updateActiveSlide(activeSlide);
}

function bindEvents(block) {
  const prevButton = block.querySelector('.slide-prev');
  const nextButton = block.querySelector('.slide-next');

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
    });
  }

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-gifts-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-gifts-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-gifts-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-gifts-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-gifts-${carouselId}`);

  const rows = [...block.querySelectorAll(':scope > div')];

  // First row is the intro/sidebar content
  const introRow = rows.shift();
  if (introRow) {
    introRow.classList.add('carousel-gifts-intro');
  }

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Gift Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-gifts-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-gifts-slides');

  // Create navigation buttons
  const slideNavButtons = document.createElement('div');
  slideNavButtons.classList.add('carousel-gifts-navigation');
  slideNavButtons.innerHTML = `
    <button type="button" class="slide-prev" aria-label="Previous Slide"></button>
    <button type="button" class="slide-next" aria-label="Next Slide"></button>
  `;

  // Create slides from remaining rows
  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);
    row.remove();
  });

  container.append(slidesWrapper);
  block.append(container);
  block.append(slideNavButtons);

  if (rows.length > 1) {
    bindEvents(block);
  }
}
