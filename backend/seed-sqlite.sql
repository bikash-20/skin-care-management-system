-- SQLite seed: reference data only. Users are seeded by the Node script
-- because we need bcrypt-hashed passwords generated at runtime.
--
-- SQLite does NOT support PostgreSQL's `INSERT ... SELECT FROM (VALUES (...))
-- AS alias(...)` syntax, so each row below is its own INSERT...SELECT.

INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Acne', 'Breakouts including pimples, blackheads, and whiteheads');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Dryness', 'Skin feels tight, flaky, or rough');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Oiliness', 'Excess sebum production causing shiny skin');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Redness', 'Visible redness or irritation on the skin');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Dark spots', 'Hyperpigmentation or post-acne marks');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Uneven texture', 'Bumps, rough patches, or uneven skin surface');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Sensitivity', 'Reactive skin prone to irritation');
INSERT OR IGNORE INTO skin_concerns (name, description) VALUES
    ('Large pores', 'Visible or enlarged pores');

INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Cleanser', 'Products used to cleanse the skin', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Toner', 'Applied after cleansing to balance skin', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Serum', 'Concentrated treatment products', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Moisturizer', 'Hydrating creams or lotions', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Sunscreen', 'UV protection products', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Exfoliant', 'Products that help slough off dead skin cells', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Face Mask', 'Treatment masks for skin concerns', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Eye Care', 'Products targeted for the eye area', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Treatment', 'Specialized treatment products', 1);
INSERT OR IGNORE INTO product_categories (name, description, is_active) VALUES
    ('Other', 'Other skin-care items', 1);

-- Products: one INSERT...SELECT per product so we can resolve category_id by name.
INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Gentle Foam Cleanser', 'Lumiere Labs',
       'Mild foaming cleanser that removes impurities without stripping moisture.',
       'Glycerin, Niacinamide', 'ALL',
       'Use morning and night on damp skin. Massage gently and rinse.', 12.99, 1
FROM product_categories WHERE name = 'Cleanser';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Hydrating Cream Cleanser', 'Auralis',
       'Non-foaming cream cleanser for dry and sensitive skin.',
       'Squalane, Ceramides', 'DRY,SENSITIVE',
       'Massage onto dry skin, then rinse with lukewarm water.', 14.50, 1
FROM product_categories WHERE name = 'Cleanser';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Balancing pH Toner', 'Lumiere Labs',
       'Alcohol-free toner that balances skin pH after cleansing.',
       'Witch Hazel, Centella Asiatica', 'OILY,COMBINATION',
       'Apply with cotton pad or palms after cleansing.', 10.00, 1
FROM product_categories WHERE name = 'Toner';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Vitamin C Brightening Serum', 'Solen Skincare',
       'Stabilized vitamin C serum for radiance and dark spots.',
       '10% Ascorbic Acid, Ferulic Acid', 'NORMAL,COMBINATION,DARK_SPOTS',
       'Use 3-4 drops in the morning before moisturizer.', 28.00, 1
FROM product_categories WHERE name = 'Serum';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Niacinamide 10% Serum', 'Auralis',
       'Pore-refining and oil-control serum.',
       'Niacinamide, Zinc PCA', 'OILY,COMBINATION',
       'Apply morning and/or night before moisturizer.', 18.75, 1
FROM product_categories WHERE name = 'Serum';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Hyaluronic Acid Hydration Serum', 'Solen Skincare',
       'Multi-weight hyaluronic acid for layered hydration.',
       'Hyaluronic Acid, Panthenol', 'ALL',
       'Apply onto damp skin morning and night.', 22.00, 1
FROM product_categories WHERE name = 'Serum';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Daily Light Moisturizer', 'Lumiere Labs',
       'Lightweight gel-cream suitable for oily and combination skin.',
       'Hyaluronic Acid, Green Tea Extract', 'OILY,COMBINATION,NORMAL',
       'Use morning and night after serums.', 16.40, 1
FROM product_categories WHERE name = 'Moisturizer';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Rich Repair Cream', 'Auralis',
       'Heavy cream with ceramides for dry skin.',
       'Ceramides, Shea Butter', 'DRY,SENSITIVE',
       'Use at night, or twice daily for very dry skin.', 24.99, 1
FROM product_categories WHERE name = 'Moisturizer';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Invisible Shield SPF 50', 'Solen Skincare',
       'Lightweight broad-spectrum sunscreen, no white cast.',
       'Zinc Oxide, Tinosorb S', 'ALL',
       'Apply generously as the last morning step. Reapply every 2 hours.', 19.00, 1
FROM product_categories WHERE name = 'Sunscreen';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Mineral Sunscreen SPF 30', 'Lumiere Labs',
       'Mineral sunscreen for sensitive skin.',
       'Zinc Oxide, Titanium Dioxide', 'SENSITIVE,DRY',
       'Apply as the last morning step.', 21.00, 1
FROM product_categories WHERE name = 'Sunscreen';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'AHA 7% Toning Solution', 'Auralis',
       'Weekly exfoliating toner with glycolic acid.',
       'Glycolic Acid, Green Tea', 'NORMAL,OILY',
       'Use 2-3 nights per week, build up gradually.', 11.25, 1
FROM product_categories WHERE name = 'Exfoliant';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'PHA Gentle Exfoliant', 'Lumiere Labs',
       'Very mild exfoliant for sensitive skin.',
       'Gluconolactone, Lactobionic Acid', 'SENSITIVE,DRY',
       'Use 2-3 nights per week.', 13.50, 1
FROM product_categories WHERE name = 'Exfoliant';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Clay Detox Mask', 'Solen Skincare',
       'Weekly clay mask for oily areas.',
       'Kaolin, Bentonite', 'OILY,COMBINATION',
       'Apply a thin layer for 10-15 minutes, then rinse.', 15.00, 1
FROM product_categories WHERE name = 'Face Mask';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Hydrating Sheet Mask', 'Auralis',
       'Single-use sheet mask for instant hydration.',
       'Hyaluronic Acid, Aloe', 'ALL',
       'Use as needed, leave on for 15-20 minutes.', 3.50, 1
FROM product_categories WHERE name = 'Face Mask';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Brightening Eye Cream', 'Lumiere Labs',
       'Lightweight eye cream for dark circles.',
       'Peptides, Caffeine', 'ALL',
       'Pat gently around the eye area morning and night.', 26.00, 1
FROM product_categories WHERE name = 'Eye Care';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Targeted Blemish Treatment', 'Solen Skincare',
       'Spot treatment for blemishes.',
       'Salicylic Acid, Niacinamide', 'OILY,COMBINATION',
       'Apply to blemishes as needed, do not rinse.', 9.50, 1
FROM product_categories WHERE name = 'Treatment';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Retinal Night Serum', 'Auralis',
       'Encapsulated retinal for advanced nighttime renewal.',
       'Encapsulated Retinaldehyde', 'NORMAL,OILY',
       'Use 2 nights per week, gradually increase frequency.', 34.00, 1
FROM product_categories WHERE name = 'Treatment';

INSERT OR IGNORE INTO products
    (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT id, 'Cooling Eye Roll-On', 'Solen Skincare',
       'Cooling roll-on for puffiness.',
       'Caffeine, Cucumber', 'ALL',
       'Roll gently around the eye area as needed.', 12.00, 1
FROM product_categories WHERE name = 'Eye Care';
