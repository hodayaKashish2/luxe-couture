import {
  PRODUCTION_SITE_URL,
  SITE_NAME,
  SITE_SEO_DESCRIPTION,
  getServerAppUrl,
} from '@/lib/site-config';

export function getSiteBaseUrl() {
  return getServerAppUrl().replace(/\/$/, '');
}

export function buildWebSiteJsonLd() {
  const url = getSiteBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['Dress Click', 'dress-click.co.il'],
    url,
    description: SITE_SEO_DESCRIPTION,
    inLanguage: 'he-IL',
  };
}

export function buildOrganizationJsonLd() {
  const url = getSiteBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url,
    logo: `${url}/logo.svg`,
  };
}

/** For reference in docs — production canonical host */
export const SITE_CANONICAL_HOST = PRODUCTION_SITE_URL.replace(/^https?:\/\//, '');
