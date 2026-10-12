# Still Form handoff

The working skincare brand is **Still Form**. The stable store identifier is `still-form`; keep it when the brand changes. The separate React/Vite application lives in `skincare-store`, outside the original repository. The original store is RevID (`lizalisenzo-revid/sign-up-studio`, Vercel `prj_5RKiUdwKY65JmWyHll1Wom0VThiB`). Both use the existing Supabase project `mvgxiukcymgeqzghybqv`. No shared production changes have been applied.

## Run and inspect

Run `npm ci`, `npm run dev`, `npm test` and `npm run build` from this application. The local preview is http://127.0.0.1:5173. `node tests/browser.mjs` runs the responsive checks using local Chrome; adjust the executable path for another computer. Screenshots are in this folder.

The site intentionally works without credentials as a coming-soon storefront. No demonstration catalogue is shipped, no reviews or product claims are invented, and checkout rejects requests while closed. There is no email signup, so there is no unpersisted consent or mailing list.

## Inspection and reuse

The original repository is one React/Vite app, not a monorepo. Its product catalogue is `src/lib/products.ts`; products are not managed in its admin. The legacy cart stores data under `revid-cart-v2`. Its checkout uses `notify-order` followed by `create-yoco-checkout`; PayFast functions also exist. The new app reuses the customer/address Zod validation, two-hour draft persistence, cart persistence/quantity patterns, Yoco hosted checkout flow, and the existing tested Yoco signature utility. It does not invoke legacy order, admin, mail or payment endpoints.

The legacy admin uses a password endpoint rather than customer-based store membership. Its service-role queries list all legacy orders. The existing order creation code accepts client totals and has product-specific sign fields. These parts cannot safely serve another store unchanged. The new API instead validates identity, fixes the store on the server, reads authoritative prices, and uses database transactions. Its admin needs explicit `commerce_store_members` membership and edits the skincare catalogue only.

The live database inspection found only `orders` and `reviews` in public, no store IDs, and a public `order-uploads` bucket with anonymous insert. Repository migrations refer to tables and columns absent from the live database. No customer records or secrets were exported. The existing public upload bucket is not used by skincare. New catalogue imagery uses `commerce-catalog` and paths `still-form/products/<product-uuid>/<filename>`, uploaded by an authorised operator through Supabase Storage. Keep personal information out of catalogue files. Browser roles have no upload/write permissions on this new bucket. Future private uploads require a separate private bucket, scoped paths and signed access.

## Exact shared changes requiring approval

Read `../database/proposed-shared-schema.sql` and `proposed-legacy-webhook.patch` before approval. The SQL is a review proposal, not an applied migration. Test in a fresh staging copy, then generate a migration with the Supabase CLI before applying it to production.

- Add a registry containing `revid` and `still-form`. Add `store_id` to existing orders/reviews, default/backfill `revid`, and constrain those legacy tables to RevID only. Existing columns, rows, policies and business values stay intact; legacy code can omit the new column.
- Add isolated commerce tables for products, variants, orders, membership, payment events, discounts and content. Composite foreign keys prevent variants/events crossing stores. Skincare orders never enter legacy `orders`, so unmodified legacy admin queries cannot read them.
- Enable RLS and revoke browser-role access on every new table. Only server endpoints can read/write them, after checking customer or store administrator identity. Direct RPC access is revoked from browser roles. Functions are SECURITY INVOKER, not SECURITY DEFINER.
- Create atomic product-save, order/inventory-reservation and signed-payment application functions. Amounts are integer ZAR cents. Duplicate checkout requests must have identical contents; duplicate payment events cannot repeat order updates or stock release.
- Add a new public bucket for non-sensitive catalogue imagery, with no anonymous writes. No existing bucket or storage policy is altered.
- Patch the existing Yoco webhook to ignore foreign store metadata or checkout IDs belonging to another commerce store, before its legacy notifications. This is necessary if the same merchant’s webhook subscriptions receive both stores’ events. Apply only after the schema exists. The patch was checked against the exact repository checkout with `git apply --check`; it has not been deployed.

Schema rollback is not a routine destructive operation: close skincare checkout and disable the new deployment first. Leave additive tables in place for recovery and accounting. Do not remove original data or rename shared identities.

## Identities and private records

Customer identities are deliberately shared in Supabase Auth. Browser sessions use store-specific storage keys. The new orders API requires a verified, non-anonymous Supabase user and applies both `store_id = still-form` and `user_id = authenticated user`. It never returns RevID orders. Admin membership is independently granted per store. No store ID submitted by a browser is accepted as authority.

Grant the owner's verified Supabase user UUID membership for `still-form` through the approved administrative workflow. Do not use the original admin password or its fallback in the new app. Customer self-registration requires working shared email configuration; confirm its existing branding and redirects before enabling it publicly. No shared Auth hook/template was changed.

## Add products

After schema approval and environment setup, sign in at `/account`, then open `/admin`. The studio uses a structured JSON editor: load products, select one to edit, or replace the provided blank template. Save drafts with `published: false` until supplier information is confirmed.

Required product fields: UUID `id`; unique hyphenated `slug`; `title`; `description`; `collection` (`cleanse`, `treat`, `moisturise`); complete supplier-confirmed `ingredients`; `usage`; confirmed `delivery`; at least one HTTPS `images` entry with descriptive `alt`; booleans `published` and `demo`; and at least one variant. Variants need stable UUID `id`, unique per-store `sku`, `label`, `size`, positive integer `price_cents` and nonnegative integer `stock`. Prices are in cents: R125.00 is 12500. Stock means available inventory after reservations, not an unadjusted supplier total. Removed variants retain history and become unavailable.

Use real supplier-authorised images, preferably square front/detail images at least 1600 px wide, compressed WebP/AVIF, with one consistent crop and accurate alt descriptions. Do not upload identity/order documents to the public catalogue bucket. `demo: true` products never appear publicly or pass checkout. No placeholders can be bought. The real public catalogue stays empty until the store registry is launched.

## Branding and policies

Edit `src/brand.json` for the working name, tagline, description, support email, delivery and returns copy. Build metadata reads this same file. Adjust colours/type in `src/style.css` and replace the abstract editorial illustration in `public/stillness.svg` when desired. Update the SVG favicon for the final brand. Leave `id` unchanged.

Policy pages in `src/App.tsx` are clearly marked as in preparation. Complete seller identity, privacy contact, processors/retention, destinations, shipping costs, dispatch estimates, returns address/eligibility and terms before approving policies. The font stylesheet currently uses Google Fonts; include this in the final privacy review or self-host fonts. No dispatch deadline, refund window or medical claim is assumed.

## Vercel and domain

The public GitHub repository `https://github.com/lizalisenzo-revid/still-form-skincare` contains this separate application, published at the owner's request. Browser uploads were used because the connector permits public reads but rejects writes with HTTP 403. Create an independent Vercel project in the existing team `team_zt2hOpvyERGwOQod9PKGJZT5`. Import the new repository with framework Vite, root `.`, build `npm run build`, output `dist`, and Node 24. The existing Vercel project/root/domain must not change.

Only add skincare’s environment variables to its project. `.env.example` contains names/placeholders and closed launch defaults. Keep `SUPABASE_SERVICE_ROLE_KEY`, `YOCO_SECRET_KEY`, and `YOCO_WEBHOOK_SECRET` server-side, never under `VITE_`. Public Supabase URL/key must point at the existing project. Coming-soon deployment needs no privileged keys at all. Configure production and previews independently; do not allow public previews to create live payments. Use test mode in controlled staging.

For a domain change:

1. Add the domain and DNS in the new Vercel project only.
2. Set `SITE_URL` and `VITE_SITE_URL` to its HTTPS origin and rebuild. Server callbacks use the configured origin; Vercel preview origin can be used until then.
3. Add the new `/account` URL to Supabase Auth’s permitted redirects. Preserve existing RevID entries and its shared Site URL. Review signup/recovery email branding and any shared auth-email hook; do not replace it globally with skincare branding.
4. Have Yoco approve the second website/business use and confirm the merchant account can support the skincare brand, product category, receipt/statement descriptor and contact details. Copying keys is not proof of approval. Check the public business/receipt name with the owner. There is no new automatic email sender here; Yoco receipts and the on-site order page are the initial confirmation flow.
5. Register a dedicated signed Yoco webhook to `https://<new-domain>/api/yoco-webhook`; do not replace the original subscription. Install the reviewed legacy guard and confirm account-wide event routing. Replace preview webhook URLs when the domain changes; public signed webhooks must not be behind preview authentication.
6. Verify success `/account?payment=success`, cancel `/checkout?payment=cancelled`, failure `/checkout?payment=failed`. No return URL is treated as proof of payment.
7. Keep the noindex build/robots until launch. The build reuses the original store’s prerender approach: public pages receive readable HTML, and real published product pages and their sitemap entries are generated at launch. Rebuild after adding products so new product URLs are deployed.

## Enable checkout only after verification

Keep `CHECKOUT_ENABLED`, `STOREFRONT_LAUNCHED`, `VITE_STOREFRONT_LAUNCHED` false initially, and the registry flags false. In controlled staging, configure test Yoco keys/signing secret and `YOCO_MODE=test`, real test-only fixture data, known delivery cents and approved policies. Test signed success, failure, cancellation, duplicate/retried webhooks, concurrent stock claims, cross-store IDs, two customers and both original-store payments. Confirm receipt branding, correct provider settlement and shipping/returns information with the owner. An account redirect alone never clears a cart or confirms an order.

Pending orders reserve inventory. Failed signed events release it once. Cancellation redirects do not release inventory, because the browser is not payment authority. Before live launch, establish a provider-based abandoned-pending-order reconciliation process. Investigate pending reservations with the provider before releasing stock. No automatic expiry is included; do not enable high-volume sales without this operational process. Refunds/fulfilment are reconciled by an authorised operator; automated refund handling and branded transactional email are not implemented here.

After the shared change approval, provider configuration and actual test-payment checks pass, enable registry `launched`, `checkout_enabled`, `policies_approved`, and set confirmed `shipping_cents`; enable the matching server/client flags in the new deployment and rebuild. The API and database independently check these gates. Never enable live Yoco keys on an unrestricted preview.

## Verification record — 12 October 2026

- New TypeScript and production build: passed; 14 pages prerendered in coming-soon mode.
- New 10 security/server/PostgreSQL tests: passed. PostgreSQL tests run locally in PGlite, not on the production database. They exercise SQL transactions, ownership constraints, reserved stock, amount/currency checks, repeat requests/events, failed-event release and direct-role denials. Provider calls in server tests are mocked.
- Responsive browser checks: passed at 360, 390, 768 and 1440 px across 11 routes; navigation, catalogue filters, coming-soon/noindex state, closed checkout, and no horizontal overflow. Screenshots were inspected.
- New dependency audit after upgrading inherited packages: zero vulnerabilities at implementation time.
- Original store: 13 existing tests, production build and 18-page search checks passed in the local copy. Original tracked source is unchanged. Existing dependency audit reports advisories; upgrades to the original store are outside this change.
- Live checkout, live signed webhooks, receipt appearance, shared-schema deployment, provider account approval, auth email/redirect configuration and live cross-store payment tests: pending account configuration and owner approval. No production charge, order, customer email or data write was generated.
- Vercel can list the original project but project inspection and new-project creation returned HTTP 403 for the existing team. No CLI credentials were available. A same-team project/deployment needs restored account-scope access; no new Vercel project was created.

A separate local Git repository was created and committed. The remote repository was created through the signed-in GitHub browser, made public at the owner's request, and populated using folder-specific browser uploads. Public read access works through the connector, but its write API returns HTTP 403. Local Git Credential Manager previously stalled and its helper was stopped before any API request. Vercel team inspection still returns 403, and its Codex browser session is signed out. Deployment is pending access to the existing Vercel team.

The completed coming-soon front end is ready for review. Production integration is deliberately gated by the exact proposed shared changes and actual provider tests above.
