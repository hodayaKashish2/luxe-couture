import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/site-seo';

export default function SiteStructuredData() {
  const payload = [buildWebSiteJsonLd(), buildOrganizationJsonLd()];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
