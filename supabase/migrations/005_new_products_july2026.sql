-- Migration 005 — new product batch (charging docks, keychain, VESA mount,
-- figurines, vases) generated via the lol3d_studio AI content pipeline.
-- Run once in Supabase Dashboard → SQL Editor.
--
-- All 12 rows are inserted with a ₹1 PLACEHOLDER price and active = false
-- (Hidden). Before going live: open /admin → Products, set the real price
-- for each item, then toggle it to "Live".

-- ============================================================
-- 1. New category: Figurines & Collectibles
-- ============================================================
insert into public.categories (id, name, blurb, sort) values
  ('figurines', 'Figurines & Collectibles', 'Fan-art busts and full figures, printed and finished for display.', 25)
on conflict (id) do nothing;

-- ============================================================
-- 2. Products (placeholder price ₹1, hidden until reviewed)
-- ============================================================
insert into public.products (slug, name, description, category, price_base, dimensions, materials, image_url, featured, active) values
  (
    'textured-smartwatch-charger-stand',
    'Textured Smartwatch Charger Stand',
    $desc$Elevate your charging experience with our premium 3D printed smartwatch charger stand. This meticulously crafted accessory features a distinctive textured base, offering a sophisticated tactile finish that minimizes fingerprints and enhances grip. The smooth, precisely curved cradle ensures your smartwatch charger fits snugly and securely, providing a stable platform for your device. Engineered with exceptional layer fidelity, the print exhibits a flawless matte black aesthetic with virtually imperceptible layer lines, showcasing lol3d.in's commitment to superior print quality. A perfect blend of durability and modern design, it's an essential addition to any desk or nightstand.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/textured-smartwatch-charger-stand/hero.webp', false, false
  ),
  (
    'garmin-smartwatch-charging-stand-mount',
    'Garmin Smartwatch Charging Stand Mount',
    $desc$Elevate your charging experience with our custom-designed Garmin Smartwatch Charging Stand. Meticulously 3D printed in premium white PLA, this stand boasts an exceptionally smooth finish and remarkable layer fidelity, showcasing the superior print quality synonymous with lol3d.in. Engineered for a perfect, secure fit, it cradles your Garmin smartwatch charger, ensuring stable and convenient charging. The robust design, featuring a sturdy base for optional screw mounting, keeps your device neatly organized and easily accessible. Experience the blend of precision engineering and elegant aesthetics, transforming your charging routine into a seamless and stylish affair.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/garmin-smartwatch-charging-stand-mount/hero.webp', false, false
  ),
  (
    'custom-3d-printed-id-key-tags',
    'Custom 3D Printed ID Key Tags',
    $desc$Elevate your organization with our premium Custom 3D Printed ID Key Tags from lol3d.in. Crafted with meticulous attention to detail, these tags feature a robust blue frame designed to securely hold customizable white inserts. Each tag boasts exceptional material finish, showcasing the smooth, consistent texture of high-quality PLA. Our advanced 3D printing technology ensures impeccable layer fidelity, resulting in crisp, legible alphanumeric codes without visible striations. Perfect for vehicle keys, asset management, or personal identification, these durable tags offer superior print quality and a professional aesthetic. Customize your inserts for a truly unique and functional solution.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/custom-3d-printed-id-key-tags/hero.webp', false, false
  ),
  (
    'premium-3d-printed-vesa-mount-bracket',
    'Premium 3D Printed VESA Mount Bracket',
    $desc$Elevate your workspace with our premium 3D Printed VESA Mount Bracket from lol3d.in. Expertly crafted for seamless integration, this bracket offers a clean, organized solution for mounting mini PCs or other devices behind your monitor. Available in sleek Matte White and sophisticated Matte Black, its smooth finish and exceptional layer fidelity are a testament to our advanced 3D printing technology. Each bracket features precisely engineered holes for secure attachment, ensuring robust support and durability. Experience the superior print quality and meticulous attention to detail that only lol3d.in delivers, transforming your setup with functional elegance.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/premium-3d-printed-vesa-mount-bracket/hero.webp', false, false
  ),
  (
    'spider-man-advanced-suit-3d-print-figurine',
    'Spider-Man Advanced Suit 3D Print Figurine',
    $desc$Unleash your inner hero with our meticulously crafted Spider-Man Advanced Suit 3D print figurine. This stunning collectible captures every intricate detail of the iconic suit, from the textured web patterns to the powerful stance, all rendered with exceptional precision. Printed using premium filament, the figurine boasts a sleek, dark finish that subtly reflects light, highlighting its dynamic form. Our advanced 3D printing technology ensures remarkable layer fidelity, showcasing the unique aesthetic of FDM printing while maintaining sharp contours and robust construction. Perfect for display, this piece from lol3d.in exemplifies superior print quality and a passion for detail, making it a must-have for any fan or collector.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/spider-man-advanced-suit-3d-print-figurine/hero.webp', false, false
  ),
  (
    'iconic-spider-man-bust-3d-print',
    'Iconic Spider-Man Bust 3D Print',
    $desc$Unleash your inner hero with our meticulously crafted Spider-Man bust, a premium 3D print from lol3d.in. Rendered in a sleek, dark filament, this piece showcases exceptional layer fidelity, capturing every intricate detail from the iconic mask texture to the subtle web pattern and the prominent spider emblem on the chest. Our advanced 3D printing technology ensures a smooth, consistent finish with minimal layer lines, highlighting the superior print quality. This robust and striking sculpture is perfect for collectors, Marvel enthusiasts, or as a unique desk accent. Experience the precision and artistry of lol3d.in.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/iconic-spider-man-bust-3d-print/hero.webp', false, false
  ),
  (
    'superman-man-of-steel-3d-printed-sculpture',
    'Superman Man of Steel 3D Printed Sculpture',
    $desc$Unleash the hero within with our meticulously crafted Superman Man of Steel 3D printed sculpture. Rendered in a vibrant, eye-catching yellow premium filament, this piece showcases exceptional detail, from the iconic musculature to the dynamic flow of his cape. Our advanced 3D printing technology ensures superior layer fidelity and a remarkably smooth finish, highlighting every intricate curve and contour. The robust base, featuring the classic 'S' shield, adds to its collector's appeal. A testament to precision engineering and artistic vision, this high-quality print from lol3d.in is a must-have for any superhero enthusiast or collector.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/superman-man-of-steel-3d-printed-sculpture/hero.webp', false, false
  ),
  (
    'modern-geometric-facet-mini-vase',
    'Modern Geometric Facet Mini Vase',
    $desc$Elevate your space with our exquisite Modern Geometric Facet Mini Vase, a testament to precision 3D printing. Crafted with meticulous attention to detail, its unique faceted surface catches light beautifully, creating a dynamic interplay of shadows and highlights. The deep, rich dark finish enhances its contemporary appeal, making it a striking decorative piece for any desk, shelf, or mantel. Experience unparalleled layer fidelity and a flawless material finish, showcasing the superior quality synonymous with lol3d.in. This compact yet captivating vase is perfect for single stems or as a standalone sculptural accent, adding a touch of sophisticated artistry to your home or office.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/modern-geometric-facet-mini-vase/hero.webp', false, false
  ),
  (
    'geometric-skull-planter-modern-3d-printed-decor',
    'Geometric Skull Planter - Modern 3D Printed Decor',
    $desc$Elevate your space with our striking Geometric Skull Planter, a masterpiece of modern 3D printing. Crafted from premium, durable black filament, this unique piece boasts a captivating faceted design that catches light beautifully. Each angle reveals meticulous layer fidelity, showcasing the precision of our advanced printing process. The smooth, consistent finish ensures a high-quality aesthetic, free from imperfections. Perfect as a succulent planter, pen holder, or a standalone decorative sculpture, it adds an edgy yet sophisticated touch to any desk, shelf, or living area. Experience the superior craftsmanship of lol3d.in.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/geometric-skull-planter-modern-3d-printed-decor/hero.webp', false, false
  ),
  (
    'vibrant-wavy-red-decorative-vase',
    'Vibrant Wavy Red Decorative Vase',
    $desc$Elevate your space with our Vibrant Wavy Red Decorative Vase, a testament to premium 3D printing craftsmanship. This stunning piece features a unique, undulating vertical wave pattern that creates a dynamic visual texture, catching light beautifully. Printed in a striking matte red, its finish is smooth to the touch, highlighting the exceptional layer fidelity and precision of our advanced FDM technology. Each curve is flawlessly rendered, showcasing minimal visible layer lines for a truly high-quality aesthetic. Perfect for displaying your favorite flowers, organizing desk essentials, or simply as a standalone contemporary art piece. Experience the pinnacle of 3D printed design with lol3d.in.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/vibrant-wavy-red-decorative-vase/hero.webp', false, false
  ),
  (
    'wavy-ribbed-blue-decorative-vase',
    'Wavy Ribbed Blue Decorative Vase',
    $desc$Elevate your living space with our stunning Wavy Ribbed Blue Decorative Vase, a testament to precision 3D printing from lol3d.in. Crafted from high-quality, matte blue filament, this piece boasts an exquisite finish that feels as premium as it looks. The intricate design features beautifully consistent, undulating vertical ribs, showcasing exceptional layer fidelity and print quality. Each curve flows seamlessly, demonstrating the meticulous attention to detail in its creation. Perfect as a standalone sculptural art piece or for showcasing your favorite small floral arrangements, its vibrant hue and unique texture add a touch of modern elegance to any room. Experience the future of decor with lol3d.in's superior craftsmanship.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/wavy-ribbed-blue-decorative-vase/hero.webp', false, false
  ),
  (
    'crimson-pleated-geometric-decor-vase',
    'Crimson Pleated Geometric Decor Vase',
    $desc$Elevate your living space with our stunning Crimson Pleated Geometric Decor Vase. Expertly 3D printed, this vibrant red piece boasts an intricate zigzag pleated design that catches the light beautifully, adding a dynamic focal point to any room. Crafted from premium, durable material, it features an impeccable matte finish and exceptional layer fidelity, showcasing the precision of lol3d.in's advanced printing technology. Each curve and angle is rendered with flawless accuracy, ensuring a smooth, high-quality surface free from imperfections. Perfect for modern interiors, this vase is a testament to superior craftsmanship and innovative design, ready to hold your favorite dry botanicals or stand alone as a sculptural art piece.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/crimson-pleated-geometric-decor-vase/hero.webp', false, false
  )
on conflict (slug) do nothing;
