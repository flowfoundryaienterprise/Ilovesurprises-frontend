# Harsha - Supabase Import Instructions

## 1. Safety first
Create a staging Supabase project or staging schema and back up the current ILoveSurprises catalog. Do not delete or overwrite production until the new catalog passes QA.

## 2. Import order
1. Run/review `supabase_schema.sql`.
2. Import `products.csv`.
3. Import `product_images.csv`.
4. Import `product_options.csv`.
5. Import `product_option_values.csv`.
6. Import `product_variants.csv`.
7. Map/import `product_metafields.csv` into a metafield table or JSON structure.
8. Import `collections.csv`.
9. Import `collection_conditions.csv`.
10. Import `product_collections.csv`.
11. Import `collection_metafields.csv`.
12. Import `collection_publications.csv` if sales-channel visibility is needed.

## 3. Product behavior
- Use `handle` for the product slug/URL where possible.
- Use variant-level price and compare-at price for purchasable combinations.
- Generate option selectors only from that product's actual option records.
- The selected option combination must resolve to an actual row in `product_variants.csv`.
- Add to Cart must store the selected variant key/options, not only the parent product.
- Preserve image order using `position`.
- Preserve product SEO title/description where present.
- Do not create SKUs for blank source SKUs.

## 4. Collection behavior
- A product can belong to many collections.
- Use `product_collections.csv` for the exact Matrixify membership snapshot.
- Preserve `position` for manual/ordered collections where available.
- `collection_conditions.csv` contains the Shopify automated collection logic; retain it for admin/reference and future rule-based rebuilding.
- Preserve collection SEO and metafields from `collections.csv` / `collection_metafields.csv`.

## 5. Required post-import checks
Return a reconciliation report containing:
- Products imported
- Variants imported
- Images imported
- Collections imported
- Product/collection links imported
- Failed/skipped rows
- Duplicate handles or variant keys
- Products without images
- Products without collection membership
- Products without prices
- Any invalid option/variant combinations

## 6. Functional spot checks
Test at least:
- A simple/default product
- A Jewelry Surprise product
- A scent-option product
- A ring-size product
- A product with multiple option groups
- A product belonging to multiple collections
- A smart/automated collection
- A manually ordered collection

Verify Product -> Cart -> Checkout flow, collection pages, search/filtering, SEO fields, image order, and variant pricing before production cutover.
