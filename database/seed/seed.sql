-- seed.sql
-- Seed reference data: skin concerns, product categories, products.
-- Passwords for users are seeded by the Node script `npm run seed`,
-- which generates bcrypt hashes at runtime and inserts the demo users
-- (admin + 3 demo users) idempotently.

-- Skin concerns (master list)
INSERT INTO skin_concerns (name, description) VALUES
    ('Acne', 'Breakouts including pimples, blackheads, and whiteheads'),
    ('Dryness', 'Skin feels tight, flaky, or rough'),
    ('Oiliness', 'Excess sebum production causing shiny skin'),
    ('Redness', 'Visible redness or irritation on the skin'),
    ('Dark spots', 'Hyperpigmentation or post-acne marks'),
    ('Uneven texture', 'Bumps, rough patches, or uneven skin surface'),
    ('Sensitivity', 'Reactive skin prone to irritation'),
    ('Large pores', 'Visible or enlarged pores')
ON CONFLICT (name) DO NOTHING;

-- Product categories
INSERT INTO product_categories (name, description, is_active) VALUES
    ('Cleanser', 'Products used to cleanse the skin', TRUE),
    ('Toner', 'Applied after cleansing to balance skin', TRUE),
    ('Serum', 'Concentrated treatment products', TRUE),
    ('Moisturizer', 'Hydrating creams or lotions', TRUE),
    ('Sunscreen', 'UV protection products', TRUE),
    ('Exfoliant', 'Products that help slough off dead skin cells', TRUE),
    ('Face Mask', 'Treatment masks for skin concerns', TRUE),
    ('Eye Care', 'Products targeted for the eye area', TRUE),
    ('Treatment', 'Specialized treatment products', TRUE),
    ('Other', 'Other skin-care items', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Demo products (fictional brands - no real-brand endorsements)
INSERT INTO products (category_id, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price, is_active)
SELECT c.id, p.name, p.brand, p.description, p.key_ingredients, p.suitable_skin_types, p.usage_instructions, p.price, TRUE
FROM (VALUES
    ('Cleanser','Gentle Foam Cleanser','Lumiere Labs','Mild foaming cleanser that removes impurities without stripping moisture.','Glycerin, Niacinamide','ALL','Use morning and night on damp skin. Massage gently and rinse.',12.99),
    ('Cleanser','Hydrating Cream Cleanser','Auralis','Non-foaming cream cleanser for dry and sensitive skin.','Squalane, Ceramides','DRY,SENSITIVE','Massage onto dry skin, then rinse with lukewarm water.',14.50),
    ('Toner','Balancing pH Toner','Lumiere Labs','Alcohol-free toner that balances skin pH after cleansing.','Witch Hazel, Centella Asiatica','OILY,COMBINATION','Apply with cotton pad or palms after cleansing.',10.00),
    ('Serum','Vitamin C Brightening Serum','Solen Skincare','Stabilized vitamin C serum for radiance and dark spots.','10% Ascorbic Acid, Ferulic Acid','NORMAL,COMBINATION,DARK_SPOTS','Use 3-4 drops in the morning before moisturizer.',28.00),
    ('Serum','Niacinamide 10% Serum','Auralis','Pore-refining and oil-control serum.','Niacinamide, Zinc PCA','OILY,COMBINATION','Apply morning and/or night before moisturizer.',18.75),
    ('Serum','Hyaluronic Acid Hydration Serum','Solen Skincare','Multi-weight hyaluronic acid for layered hydration.','Hyaluronic Acid, Panthenol','ALL','Apply onto damp skin morning and night.',22.00),
    ('Moisturizer','Daily Light Moisturizer','Lumiere Labs','Lightweight gel-cream suitable for oily and combination skin.','Hyaluronic Acid, Green Tea Extract','OILY,COMBINATION,NORMAL','Use morning and night after serums.',16.40),
    ('Moisturizer','Rich Repair Cream','Auralis','Heavy cream with ceramides for dry skin.','Ceramides, Shea Butter','DRY,SENSITIVE','Use at night, or twice daily for very dry skin.',24.99),
    ('Sunscreen','Invisible Shield SPF 50','Solen Skincare','Lightweight broad-spectrum sunscreen, no white cast.','Zinc Oxide, Tinosorb S','ALL','Apply generously as the last morning step. Reapply every 2 hours.',19.00),
    ('Sunscreen','Mineral Sunscreen SPF 30','Lumiere Labs','Mineral sunscreen for sensitive skin.','Zinc Oxide, Titanium Dioxide','SENSITIVE,DRY','Apply as the last morning step.',21.00),
    ('Exfoliant','AHA 7% Toning Solution','Auralis','Weekly exfoliating toner with glycolic acid.','Glycolic Acid, Green Tea','NORMAL,OILY','Use 2-3 nights per week, build up gradually.',11.25),
    ('Exfoliant','PHA Gentle Exfoliant','Lumiere Labs','Very mild exfoliant for sensitive skin.','Gluconolactone, Lactobionic Acid','SENSITIVE,DRY','Use 2-3 nights per week.',13.50),
    ('Face Mask','Clay Detox Mask','Solen Skincare','Weekly clay mask for oily areas.','Kaolin, Bentonite','OILY,COMBINATION','Apply a thin layer for 10-15 minutes, then rinse.',15.00),
    ('Face Mask','Hydrating Sheet Mask','Auralis','Single-use sheet mask for instant hydration.','Hyaluronic Acid, Aloe','ALL','Use as needed, leave on for 15-20 minutes.',3.50),
    ('Eye Care','Brightening Eye Cream','Lumiere Labs','Lightweight eye cream for dark circles.','Peptides, Caffeine','ALL','Pat gently around the eye area morning and night.',26.00),
    ('Treatment','Targeted Blemish Treatment','Solen Skincare','Spot treatment for blemishes.','Salicylic Acid, Niacinamide','OILY,COMBINATION','Apply to blemishes as needed, do not rinse.',9.50),
    ('Treatment','Retinal Night Serum','Auralis','Encapsulated retinal for advanced nighttime renewal.','Encapsulated Retinaldehyde','NORMAL,OILY','Use 2 nights per week, gradually increase frequency.',34.00),
    ('Eye Care','Cooling Eye Roll-On','Solen Skincare','Cooling roll-on for puffiness.','Caffeine, Cucumber','ALL','Roll gently around the eye area as needed.',12.00)
) AS p(category_name, name, brand, description, key_ingredients, suitable_skin_types, usage_instructions, price)
JOIN product_categories c ON c.name = p.category_name
WHERE NOT EXISTS (SELECT 1 FROM products WHERE products.name = p.name);