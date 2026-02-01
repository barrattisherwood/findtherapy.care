import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

const SITE_NAME = 'findtherapy.care';
const DEFAULT_DESCRIPTION = 'Find therapists, counsellors, and support groups near you in South Africa. Browse verified mental health professionals by specialty, location, and availability.';
const DEFAULT_IMAGE = 'https://findtherapy.care/assets/images/og-image.png';
const BASE_URL = 'https://findtherapy.care';

export interface SeoConfig {
  title: string;
  description?: string;
  url?: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private doc = inject(DOCUMENT);

  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  update(config: SeoConfig): void {
    const fullTitle = config.title.includes(SITE_NAME)
      ? config.title
      : `${config.title} — ${SITE_NAME}`;
    const description = config.description || DEFAULT_DESCRIPTION;
    const url = config.url ? `${BASE_URL}${config.url}` : BASE_URL;
    const image = config.image || DEFAULT_IMAGE;

    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.updateCanonical(url);
  }

  private updateCanonical(url: string): void {
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
