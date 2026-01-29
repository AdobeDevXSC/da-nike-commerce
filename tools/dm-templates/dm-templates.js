import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { LitElement, html } from 'da-lit';
//import { loadPageTags, loadGenTags, savePageTags } from './utils.js';

// Super Lite components
import 'https://da.live/nx/public/sl/components.js';

// Application styles
import loadStyle from './utils.js';
const styles = await loadStyle(import.meta.url);

class DMTemplates extends LitElement {
  static properties = {
    path: { attribute: false },
    url: { attribute: false },
    token: { attribute: false },
    actions: { attribute: false },
    templates: { state: true },
    title: { state: true },
    description: { state: true },
    image: { state: true },
    view: { attribute: false },
    org: { attribute: false },
    repo: { attribute: false },
  };

  constructor() {
    super();
    this.path = '';
    this.url = '';
    this.token = '';
    this.actions = {};
    this.title = '';
    this.description = '';
    this.image = '';
    this.view = '';
    this.org = '';
    this.repo = '';
    this.templates = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, styles];
    this.loadTemplates();  // Fetch data here
  }

  async loadPage() {
    try {
      const response = await fetch(this.url);
      const html = await response.text();
      console.log(this.url);
      console.log(html);
      const dom = new DOMParser().parseFromString(html, 'text/html');
      const block = dom.querySelector('.media-promo-banner');
      this.title = block.querySelector('h3').textContent || '';
      this.description = block.querySelector('p').textContent || '';
      this.image = block.querySelector('img').src || '';

      const section = dom.querySelector('.section-metadata');
      [...section.children].forEach((child) => {
        if (child.textContent.includes('dm-image')) {
          this.image = child.textContent.replace('dm-image', '');
        }
      });
      this.image = this.image.trim();
      this.image = this.image.replace('https://smartimaging.scene7.com/is/image/', '');
    } catch (error) {
      console.error(error);
    }
  }

  async loadTemplates() {
    await this.loadPage();
    try {
      const response = await fetch('/extras/dm-templates.json');
      const { data } = await response.json();
      data.forEach((item) => {
        const tmpUrl = new URL(item.dmUrl);
        const ttl = tmpUrl.searchParams.get('$title');
        const desc = tmpUrl.searchParams.get('$description');
        const img = tmpUrl.searchParams.get('$imgsrc');

        item.dmUrl = item.dmUrl.replace('$title=' + encodeURIComponent(ttl), '$title=' + encodeURIComponent(this.title));
        item.dmUrl = item.dmUrl.replace('$description=' + encodeURIComponent(desc), '$description=' + encodeURIComponent(this.description));
        item.dmUrl = item.dmUrl.replace('$imgsrc=' + img, '$imgsrc=is(' + this.image + ':' + item.smartcrop + ')');
      });
      this.templates = data;  // Setting this triggers re-render
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const previewAllUrl = `https://da.live/app/${this.org}/${this.repo}/tools/dm-templates/dm-templates#${this.url}`;

    return html`
      <div id="dm-templates">
        ${this.view === 'edit' ? html`
          <a href="${previewAllUrl}" target="_blank" class="preview-all-link">Preview All</a>
        ` : ''}
        <ul class="da-group-list">
          ${this.templates.map(({ name, dmUrl }) => html`
            <li class="da-group-item">
              <button class="da-group-button">
                <img src="${dmUrl}" alt="${name}" class="da-group-image ${this.view}">
                <div class="da-group-title-row">
                  <span class="da-group-title-text">${name}</span>
                  <a href="${dmUrl}" target="_blank" class="open-link" @click=${(e) => e.stopPropagation()} title="Open in new tab">
                    <svg class="open-icon" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
                      <path fill="currentColor" d="M16.5,1H1.5a.5.5,0,0,0-.5.5v7a.5.5,0,0,0,.5.5h1A.5.5,0,0,0,3,8.5V3H15V15H9.5a.5.5,0,0,0-.5.5v1a.5.5,0,0,0,.5.5h7a.5.5,0,0,0,.5-.5V1.5A.5.5,0,0,0,16.5,1Z" />
                      <path fill="currentColor" d="M9.318,13.882A.39051.39051,0,0,0,9.6,14a.4.4,0,0,0,.4-.377V8.25A.25.25,0,0,0,9.75,8H4.377A.4.4,0,0,0,4,8.4a.392.392,0,0,0,.1175.28l1.893,1.893-4.521,4.523a.5.5,0,0,0-.00039.70711l.00039.00039.707.707a.5.5,0,0,0,.707,0l4.5215-4.521Z" />
                    </svg>
                  </a>
                </div>
              </button>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

customElements.define('dm-templates', DMTemplates);

(async function init() {
  const { context, token } = await DA_SDK;
  const { org, repo, ref, path, view } = context;
  
  let url;
  if (view === 'fullscreen' && window.location.hash) {
    // Get URL from the hash (remove the leading #)
    url = window.location.hash.substring(1);
  } else {
    url = `${path}.plain.html`;
  }

  console.log(context);
  
  const cmp = document.createElement('dm-templates');
  cmp.path = `/${org}/${repo}`;
  cmp.token = token;
  cmp.url = url;
  cmp.view = view;
  cmp.org = org;
  cmp.repo = repo;

  document.body.append(cmp);
}());
