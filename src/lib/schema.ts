// Schema.org JSON-LD builders mirroring the Rank Math output the source
// WordPress site produced. Each page emits a single `@graph` with multiple
// typed nodes (Place, LocalBusiness+Organization, WebSite, ImageObject,
// WebPage, Person, Article/BlogPosting, BreadcrumbList, FAQPage).
import { SITE } from "../config/site";

const ORG_ID = `${SITE.url}/#organization`;
const PLACE_ID = `${SITE.url}/#place`;
const WEBSITE_ID = `${SITE.url}/#website`;
const LOGO_ID = `${SITE.url}${SITE.ogImage}`;

function placeNode() {
  return {
    "@type": "Place",
    "@id": PLACE_ID,
    geo: {
      "@type": "GeoCoordinates",
      latitude: 49.16382,
      longitude: -121.94166,
    },
    hasMap: "https://www.google.com/maps/place/Fraser+Valley,+BC",
    address: {
      "@type": "PostalAddress",
      addressCountry: "CA",
      addressRegion: "British Columbia",
      addressLocality: "Fraser Valley",
    },
  };
}

function orgNode() {
  return {
    "@type": ["LocalBusiness", "Organization"],
    "@id": ORG_ID,
    name: SITE.fullName,
    url: SITE.url,
    sameAs: [],
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CA",
      addressRegion: SITE.address.region,
      addressLocality: "Fraser Valley",
    },
    location: { "@id": PLACE_ID },
    logo: {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: LOGO_ID,
      contentUrl: LOGO_ID,
      caption: SITE.fullName,
      inLanguage: "en-US",
      width: 1000,
      height: 300,
    },
    image: { "@id": LOGO_ID },
    telephone: SITE.phone,
    priceRange: "$$",
    openingHours: "Mo-Su 00:00-24:00",
    areaServed: SITE.address.serviceCities.map(c => ({ "@type": "City", name: c })),
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE.url,
    name: SITE.fullName,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
    potentialAction: [{
      "@type": "SearchAction",
      target: `${SITE.url}/?s={search_term_string}`,
      "query-input": "required name=search_term_string",
    }],
  };
}

function logoImageNode() {
  return {
    "@type": "ImageObject",
    "@id": LOGO_ID,
    url: LOGO_ID,
    contentUrl: LOGO_ID,
    caption: SITE.fullName,
    inLanguage: "en-US",
    width: 1000,
    height: 300,
  };
}

function webPageNode(opts: {
  url: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  isFaq?: boolean;
  pageType?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  const image = opts.image || LOGO_ID;
  const baseType = opts.pageType || "WebPage";
  const types: string | string[] = opts.isFaq ? [baseType, "FAQPage"] : baseType;
  // AboutPage and ContactPage emit a leaner node (matches source).
  if (baseType !== "WebPage") {
    return {
      "@type": types,
      "@id": `${opts.url}#webpage`,
      url: opts.url,
      name: opts.title,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
      isPartOf: { "@id": WEBSITE_ID },
      primaryImageOfPage: { "@id": image },
      inLanguage: "en-US",
    };
  }
  return {
    "@type": types,
    "@id": `${opts.url}#webpage`,
    url: opts.url,
    name: opts.title,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    isPartOf: { "@id": WEBSITE_ID },
    primaryImageOfPage: { "@id": image },
    inLanguage: "en-US",
    about: { "@id": ORG_ID },
    description: opts.description,
  };
}

// Multi-word author names ("Valley Septic") need a URL-safe slug so the JSON-LD
// @id isn't a URL with a raw space ("/author/valley septic/").
function authorSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function personNode(name: string) {
  const id = `${SITE.url}/author/${authorSlug(name)}/`;
  return {
    "@type": "Person",
    "@id": id,
    name,
    url: id,
    image: {
      "@type": "ImageObject",
      "@id": `${SITE.url}/author/${authorSlug(name)}/#authorImage`,
      url: `${SITE.url}${SITE.ogImage}`,
      contentUrl: `${SITE.url}${SITE.ogImage}`,
      caption: name,
      inLanguage: "en-US",
    },
    worksFor: { "@id": ORG_ID },
  };
}

function articleNode(opts: {
  url: string;
  headline: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  author?: string;
  isPost?: boolean;
  category?: string;
}) {
  const author = opts.author || "Valley Septic";
  const types = opts.isPost ? ["BlogPosting", "NewsArticle"] : ["Article"];
  return types.map(type => ({
    "@type": type,
    "@id": `${opts.url}#${type === "Article" ? "richSnippet" : type === "BlogPosting" ? "richSnippet" : "newsArticle"}`,
    isPartOf: { "@id": `${opts.url}#webpage` },
    mainEntityOfPage: { "@id": `${opts.url}#webpage` },
    author: { "@id": `${SITE.url}/author/${authorSlug(author)}/` },
    headline: opts.headline,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    publisher: { "@id": ORG_ID },
    image: opts.image
      ? {
          "@type": "ImageObject",
          "@id": opts.image,
          url: opts.image,
          contentUrl: opts.image,
          caption: opts.headline,
          inLanguage: "en-US",
        }
      : { "@id": LOGO_ID },
    thumbnailUrl: opts.image,
    inLanguage: "en-US",
    articleSection: opts.category || "Uncategorized",
  }));
}

function breadcrumbNode(items: Array<{ name: string; url: string }>) {
  return {
    "@type": "BreadcrumbList",
    "@id": items.length ? `${items[items.length - 1].url}#breadcrumb` : `${SITE.url}/#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

function faqEntities(items: Array<{ q: string; a: string }>) {
  return items.map((it, i) => ({
    "@type": "Question",
    "@id": `#question-${i}`,
    name: it.q,
    answerCount: 1,
    acceptedAnswer: {
      "@type": "Answer",
      text: it.a,
    },
  }));
}

export function pageSchema(opts: {
  url: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  ogType?: "website" | "article";
  isPost?: boolean;
  author?: string;
  category?: string;
  breadcrumb?: Array<{ name: string; url: string }>;
  faqs?: Array<{ q: string; a: string }>;
  /** Source pages use AboutPage/ContactPage instead of WebPage; these skip Person + Article. */
  pageType?: "WebPage" | "AboutPage" | "ContactPage";
}) {
  const isUtilityPage = opts.pageType === "AboutPage" || opts.pageType === "ContactPage";

  const graph: unknown[] = [
    placeNode(),
    orgNode(),
    websiteNode(),
    logoImageNode(),
    webPageNode({
      url: opts.url,
      title: opts.title,
      description: opts.description,
      image: opts.image,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
      isFaq: !!opts.faqs?.length,
      pageType: opts.pageType,
    }),
  ];

  // AboutPage and ContactPage in the source skip Person + Article nodes
  if (!isUtilityPage) {
    if (opts.author) graph.push(personNode(opts.author));
    graph.push(
      ...articleNode({
        url: opts.url,
        headline: opts.title,
        description: opts.description,
        datePublished: opts.datePublished,
        dateModified: opts.dateModified,
        image: opts.image,
        author: opts.author,
        isPost: opts.isPost,
        category: opts.category,
      })
    );
  }

  if (opts.breadcrumb && opts.breadcrumb.length) {
    graph.push(breadcrumbNode(opts.breadcrumb));
  }

  if (opts.faqs && opts.faqs.length) {
    graph.push(...faqEntities(opts.faqs));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

// Standalone helpers kept for the FAQ archive and category pages
export function faqPageSchema(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    ...breadcrumbNode(items),
  };
}

// Backwards-compat shims for files that still use the older helpers.
export function defaultPageSchema(opts: {
  url: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return pageSchema({ ...opts, ogType: "website" });
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  areaServed?: readonly string[] | string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    provider: { "@id": ORG_ID },
    areaServed: ((opts.areaServed as string[]) || SITE.address.serviceCities).map(c => ({
      "@type": "City",
      name: c,
    })),
    url: opts.url,
    serviceType: opts.name,
  };
}

export function articleSchema(opts: {
  url: string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}) {
  return articleNode({ ...opts, isPost: true })[0];
}

export function localBusinessSchema() {
  return { "@context": "https://schema.org", ...orgNode() };
}
