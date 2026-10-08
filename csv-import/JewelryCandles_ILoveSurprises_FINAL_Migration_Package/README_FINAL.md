# JewelryCandles -> ILoveSurprises Final Migration Package

This package is the authoritative migration handoff built from:
- Shopify product exports `products_export_1.csv` through `products_export_6.csv`
- Matrixify Enterprise collection export job `#743984685`

The untouched source files are included in `source_exports/`.

## Verified catalog totals
- 57,479 unique products
- 64,700 product image records
- 1,547,749 variant rows
- 47,788 product option definitions
- 706,291 distinct product option values
- 9,664 populated product metafield values
- 460 Shopify collections
- 43,519 collection condition rows
- 948,607 product-to-collection links
- 100 populated collection metafield values
- 6,900 collection publication/channel rows
- 0 unmatched product handles in Matrixify collection membership
- 0 duplicate product handles
- 0 duplicate product/collection links

## Important QA exceptions
- 763 products have no product image in the supplied Shopify product exports.
- 1,206 products are not linked to any collection in the Matrixify collection snapshot.
- 0 products are missing a variant row.
- 0 products are missing a variant price.

These exception lists are included as CSVs. Do not invent missing relationships or images; review them in staging.

## Final normalized files
- `products.csv`
- `product_images.csv`
- `product_variants.csv`
- `product_options.csv`
- `product_option_values.csv`
- `product_metafields.csv`
- `collections.csv`
- `collection_conditions.csv`
- `product_collections.csv`
- `collection_metafields.csv`
- `collection_publications.csv`
- `QA_summary.csv`
- `products_without_images.csv`
- `products_without_collection.csv`
- `products_without_variants.csv`
- `products_without_price.csv`
- `unmatched_collection_product_handles.csv`
- `source_file_counts.csv`
- `supabase_schema.sql`
- `IMPORT_INSTRUCTIONS.md`

## Migration rules
1. Shopify product handle is used as the stable `product_id` migration key.
2. Never invent a SKU when the source SKU is blank.
3. Never apply the same jewelry/scent/ring-size option template to every product.
4. Each product must use only its real option names, option values, and variant combinations from Shopify.
5. `Title` / `Default Title` is Shopify's simple-product placeholder and must not appear as a customer-facing selector.
6. Original option names are preserved. A canonical option name is also supplied for frontend consistency.
7. Product-to-collection membership is taken directly from Matrixify Linked Products; it is not guessed.
8. Smart/automated collection rules are retained in `collection_conditions.csv`.
9. Products may belong to multiple collections; use the many-to-many `product_collections` table.
10. Import and validate in staging before replacing production data.
