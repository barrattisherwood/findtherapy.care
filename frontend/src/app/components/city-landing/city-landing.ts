import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { ProviderList } from '../provider-list/provider-list';
import { CITY_CONFIGS, CityConfig, MajorCity } from '@findlocal/shared';

@Component({
  selector: 'app-city-landing',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, ProviderList],
  templateUrl: './city-landing.html',
  styleUrl: './city-landing.scss'
})
export class CityLanding implements OnInit {
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  private doc = inject(DOCUMENT);

  cityConfig = signal<CityConfig | null>(null);

  ngOnInit(): void {
    const citySlug = this.route.snapshot.url[0]?.path as MajorCity;
    const config = CITY_CONFIGS[citySlug];

    if (config) {
      this.cityConfig.set(config);
      this.updateSeo(config);
      this.addStructuredData(config);
    }
  }

  private updateSeo(config: CityConfig): void {
    this.seo.update({
      title: `Therapists in ${config.name}`,
      description: config.metaDescription,
      url: `/${config.slug}`,
      image: config.ogImage
    });
  }

  private addStructuredData(config: CityConfig): void {
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': `findtherapy.care - ${config.name}`,
      'description': config.metaDescription,
      'url': `https://findtherapy.care/${config.slug}`,
      'areaServed': {
        '@type': 'City',
        'name': config.name,
        'containedIn': {
          '@type': 'State',
          'name': config.province
        }
      },
      'category': 'Mental Health Service Directory',
      'priceRange': 'R300-R1500'
    });
    this.doc.head.appendChild(script);
  }
}
