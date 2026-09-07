# Content and SEO workflow

Read this reference for public websites, marketing pages, restaurants, local businesses, stores, portfolios, and content-heavy products. Skip it for private/internal tools unless discovery is an explicit requirement.

## Content contract

Before implementation, map each public page to a user intent, primary action, content owner, required facts, and freshness expectation. Define navigation labels, headings, empty/error text, form messages, trust content, and realistic long-content behavior.

- Reuse approved brand voice and existing factual content.
- Never invent testimonials, ratings, prices, awards, addresses, availability, legal claims, or business credentials.
- Mark missing business facts as placeholders and use a popup when the missing answer affects launch correctness.
- Keep content in structured data or a maintainable content layer when non-developers must change it; do not add a paid CMS without approval.

## Technical SEO contract

For every indexable page, specify:

- Unique title, meta description, canonical URL, one clear H1, and meaningful heading hierarchy.
- Crawl/index policy, sitemap membership, robots behavior, redirects, and not-found behavior.
- Open Graph/social metadata and descriptive image alternative text.
- Stable semantic URLs, internal links, breadcrumb behavior where useful, and pagination/filter indexing rules.
- Appropriate structured data. Use only types supported by visible facts, such as `Organization`, `LocalBusiness`, `Restaurant`, `Menu`, `Product`, `BreadcrumbList`, or `FAQPage` when eligible.

Do not add keyword stuffing, hidden text, duplicate doorway pages, fabricated reviews, or unsupported schema properties.

## Verification

- Validate rendered metadata, canonical links, robots directives, sitemap URLs, status codes, and structured data.
- Verify important content is present in server-rendered or otherwise crawlable output when discovery matters.
- Check mobile usability, performance, image dimensions/compression, link integrity, and accessible names.
- Record a small search baseline: indexable page count, broken links, missing titles/descriptions, and representative performance results.
- Analytics, advertising, cookie banners, consent tools, and new tracking vendors require explicit privacy/cost approval.

SEO is a quality gate, not a promise of ranking. Report implemented signals and measurable results without guaranteeing traffic.

