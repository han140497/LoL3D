-- Migration 006 — second product batch: originals sourced from downloaded
-- STL/3MF design files (their bundled designer/community photos were used
-- as the pipeline's reference image), plus 4 fan-art items the business
-- owner explicitly approved despite known copyright/trademark risk
-- (Pokemon x2, One Piece/Zoro, Bambu Lab-branded scraper).
-- Run once in Supabase Dashboard → SQL Editor.
--
-- All rows use a ₹1 PLACEHOLDER price and active = false (Hidden), same
-- safety default as migration 005. Before going live: open /admin →
-- Products, set the real price for each item, then toggle it to "Live".

insert into public.products (slug, name, description, category, price_base, dimensions, materials, image_url, featured, active) values
  (
    'two-tone-ribbed-desk-organizer-with-pen-holder',
    'Two-Tone Ribbed Desk Organizer with Pen Holder',
    $desc$Elevate your workspace with our premium Two-Tone Ribbed Desk Organizer, meticulously 3D printed for both style and utility. Crafted with a distinctive ribbed exterior in a sophisticated taupe, it perfectly complements the smooth, deep olive green interior compartments. Each detail showcases exceptional layer fidelity and a flawless finish, a hallmark of lol3d.in's commitment to quality. Featuring a dedicated pen holder section and multiple spacious compartments, this organizer keeps your essentials tidy and accessible. Experience superior print quality and a durable build, designed to bring order and elegance to any desk. A perfect blend of form and function.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/two-tone-ribbed-desk-organizer-with-pen-holder/hero.webp', false, false
  ),
  (
    'vibrant-green-geometric-smartwatch-charging-stand',
    'Vibrant Green Geometric Smartwatch Charging Stand',
    $desc$Elevate your charging experience with our Vibrant Green Geometric Smartwatch Charging Stand. Expertly 3D printed by lol3d.in, this stand boasts a striking neon green finish that adds a pop of color to any desk or nightstand. Its precision-engineered design ensures a perfect, snug fit for your smartwatch charging puck, keeping your device securely in place. Crafted with exceptional layer fidelity, the stand features a smooth, consistent surface, showcasing our commitment to superior print quality. The robust material guarantees durability, making it a stylish and functional addition to your tech accessories.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/vibrant-green-geometric-smartwatch-charging-stand/hero.webp', false, false
  ),
  (
    'spin-click-fidget-toy',
    'Spin Click Fidget Toy',
    $desc$Discover the ultimate tactile experience with our Spin Click Fidget Toy, meticulously 3D printed by lol3d.in. Each piece showcases exceptional layer fidelity, ensuring a smooth, satisfying spin and a crisp, audible click. Crafted from premium, durable PLA, these vibrant fidgets boast a flawless matte finish, highlighting the precision of our advanced 3D printing technology. The intricate multi-part design is engineered for seamless operation and superior durability, making it a perfect desk companion for focus and stress relief. Experience the difference of premium print quality and vibrant, consistent colors. Elevate your everyday with this perfectly engineered, satisfying fidget.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/spin-click-fidget-toy/hero.webp', false, false
  ),
  (
    'precision-3d-printed-planetary-gear-set',
    'Precision 3D Printed Planetary Gear Set',
    $desc$Experience the marvel of engineering with our Precision 3D Printed Planetary Gear Set. Crafted with meticulous attention to detail, each gear showcases exceptional layer fidelity and a smooth, almost metallic finish. Printed using high-quality filament, these intricate components demonstrate the superior print quality synonymous with lol3d.in. The complex interlocking design operates flawlessly, making it a perfect educational tool, desk display, or a testament to advanced additive manufacturing. Elevate your space with this functional art piece, where precision meets aesthetic appeal, ensuring a durable and visually striking product.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/precision-3d-printed-planetary-gear-set/hero.webp', false, false
  ),
  (
    'hexagonal-vesa-mount-laptop-tray',
    'Hexagonal VESA Mount Laptop Tray',
    $desc$Elevate your workspace with our premium 3D Printed Hexagonal VESA Mount Laptop Tray. Crafted with precision, this stand features a striking honeycomb pattern that not only provides superior ventilation for your device but also ensures a lightweight yet incredibly robust structure. The matte black finish exudes a professional aesthetic, while our advanced 3D printing process guarantees exceptional layer fidelity and a smooth, consistent texture. Designed for ergonomic comfort, it seamlessly integrates with VESA-compatible arms, offering a stable and stylish solution to optimize your desk setup and enhance productivity. Experience the pinnacle of 3D print quality from lol3d.in.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/hexagonal-vesa-mount-laptop-tray/hero.webp', false, false
  ),
  (
    'sleek-3d-printed-desk-organizer-with-phone-stand',
    'Sleek 3D Printed Desk Organizer with Phone Stand',
    $desc$Elevate your workspace with our Sleek 3D Printed Desk Organizer, meticulously crafted for both aesthetics and utility. This premium organizer features multiple compartments for pens, tools, and office supplies, alongside a dedicated slot for your smartphone. Printed with high-quality, durable PLA filament, it boasts a sophisticated matte dark grey finish that complements any decor. Our advanced 3D printing process ensures exceptional layer fidelity, resulting in smooth surfaces and crisp edges, free from imperfections. Experience the superior print quality and robust design that lol3d.in is known for, bringing order and style to your desk. Keep your essentials neatly arranged and within reach.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/sleek-3d-printed-desk-organizer-with-phone-stand/hero.webp', false, false
  ),
  (
    'articulated-dual-tone-dragon-moth-figure',
    'Articulated Dual-Tone Dragon Moth Figure',
    $desc$Unleash mythical elegance with our stunning Articulated Dual-Tone Dragon Moth Figure. This exquisite 3D print from lol3d.in showcases unparalleled craftsmanship, featuring a mesmerizing light blue and coral color palette. Each intricate wing boasts delicate patterns and a smooth, premium material finish, highlighting the superior layer fidelity achieved through advanced 3D printing techniques. The segmented, flexible body and tail allow for dynamic posing, bringing this fantastical creature to life. Experience the exceptional print quality, free from visible layer lines, ensuring a flawless aesthetic. Perfect for collectors, fantasy enthusiasts, or as a unique decorative piece, this figure embodies the pinnacle of 3D printing artistry.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/articulated-dual-tone-dragon-moth-figure/hero.webp', false, false
  ),
  (
    'versatile-cable-organizer-clip',
    'Versatile Cable Organizer Clip',
    $desc$Experience superior organization with our 3D printed Versatile Cable Organizer Clip. Crafted from premium white PLA, this functional accessory boasts an exceptionally smooth finish and remarkable layer fidelity, showcasing the precision engineering synonymous with lol3d.in. Its innovative design, featuring a unique wavy grip and dual-loop structure, provides a secure and elegant solution for managing cables, keys, or small items. Lightweight yet durable, this clip exemplifies our commitment to high-quality 3D printing, delivering both aesthetic appeal and practical utility. Elevate your everyday essentials with lol3d.in's meticulously crafted prints.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/versatile-cable-organizer-clip/hero.webp', false, false
  ),
  (
    'ergonomic-desktop-phone-stand-with-media-control-knob',
    'Ergonomic Desktop Phone Stand with Media Control Knob',
    $desc$Elevate your workspace with the lol3d.in Ergonomic Desktop Phone Stand, featuring an integrated media control knob. Expertly 3D printed, this stand boasts a flawless matte white finish, showcasing exceptional layer fidelity and a premium, smooth texture. Designed for optimal viewing angles, it securely cradles your smartphone while providing intuitive control over your music or videos. Our advanced printing techniques ensure a robust and durable product, free from visible layer lines, reflecting lol3d.in's commitment to superior quality. Enhance your desk aesthetics and productivity with this sleek, functional accessory, a testament to precision engineering and modern design.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/ergonomic-desktop-phone-stand-with-media-control-knob/hero.webp', false, false
  ),
  (
    'whimsical-smart-speaker-stand',
    'Whimsical Smart Speaker Stand',
    $desc$Transform your smart speaker into an adorable companion with our Whimsical Smart Speaker Stand. Expertly 3D printed in premium, smooth white filament, this stand boasts exceptional layer fidelity, ensuring a flawless, high-quality finish. The sleek, glossy texture highlights lol3d.in's commitment to superior print quality, making it a delightful addition to any room. Designed to perfectly cradle your device, it adds a touch of playful charm while maintaining full speaker functionality. Elevate your home decor with this unique, precision-crafted accessory.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/whimsical-smart-speaker-stand/hero.webp', false, false
  ),
  (
    'vibrant-spherical-smart-device-enclosure',
    'Vibrant Spherical Smart Device Enclosure',
    $desc$Elevate your tech with our Vibrant Spherical Smart Device Enclosure, a testament to premium 3D printing. Crafted with meticulous attention to detail, this piece features a unique, finely textured orange finish that adds a touch of modern sophistication to any space. The exceptional layer fidelity ensures a seamless, smooth spherical form, free from visible print lines, showcasing the pinnacle of FDM precision. Designed to house your smart devices, its robust construction and flawless print quality guarantee both durability and aesthetic appeal. Experience the perfect blend of innovative design and superior craftsmanship, exclusively from lol3d.in.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/vibrant-spherical-smart-device-enclosure/hero.webp', false, false
  ),
  (
    'organic-teal-magsafe-charger-stand',
    'Organic Teal MagSafe Charger Stand',
    $desc$Elevate your charging experience with our Organic Teal MagSafe Charger Stand. This stunning 3D print boasts a unique, biomimetic design that seamlessly blends form and function. Crafted from premium, vibrant teal filament, its smooth, consistent finish highlights the exceptional layer fidelity achieved through our advanced printing process. Every curve and void is meticulously rendered, showcasing the superior print quality and structural integrity. Designed for perfect compatibility with MagSafe chargers, it provides a stable and stylish home for your device. Experience the precision and artistry of lol3d.in with this functional desk accessory.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/organic-teal-magsafe-charger-stand/hero.webp', false, false
  ),
  (
    'minimalist-smartwatch-charging-dock',
    'Minimalist Smartwatch Charging Dock',
    $desc$Elevate your desk aesthetics and organization with our Minimalist Smartwatch Charging Dock. Expertly 3D printed from premium, durable material, this dock boasts a pristine matte white finish that seamlessly integrates into any modern workspace. Experience unparalleled print quality with virtually invisible layer lines, showcasing our commitment to superior craftsmanship and precision. Designed for optimal functionality, it securely cradles your smartwatch while discreetly managing charging cables, ensuring your device is always ready and your space remains clutter-free. A perfect blend of form and function, crafted with lol3d.in's signature attention to detail.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/minimalist-smartwatch-charging-dock/hero.webp', false, false
  ),
  (
    'elegant-multi-tiered-cosmetic-desk-organizers',
    'Elegant Multi-Tiered Cosmetic & Desk Organizers',
    $desc$Elevate your space with lol3d.in's premium 3D printed Multi-Tiered Cosmetic & Desk Organizers. Crafted with meticulous precision, these pieces boast an incredibly smooth, matte finish that feels luxurious to the touch. Our state-of-the-art 3D printing technology ensures exceptional layer fidelity, resulting in virtually invisible layer lines and a seamless, high-quality aesthetic. Available in a soft, muted pink and a sophisticated creamy beige, they offer versatile storage for makeup, stationery, or small essentials. Experience superior print quality and a durable design, perfect for decluttering your vanity or workspace with a touch of modern elegance. Discover the difference of true craftsmanship.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/elegant-multi-tiered-cosmetic-desk-organizers/hero.webp', false, false
  ),
  (
    'golden-atlas-smart-speaker-holder-stand',
    'Golden Atlas Smart Speaker Holder Stand',
    $desc$Elevate your smart home with our exquisite 3D Printed Golden Atlas Smart Speaker Holder. Inspired by classical mythology, this stunning piece depicts Atlas majestically supporting your spherical smart speaker, transforming it into a captivating display. Crafted with premium gold-tone filament, it boasts a luxurious metallic sheen that catches the light beautifully. Our advanced 3D printing technology ensures exceptional layer fidelity, revealing intricate details in Atlas's musculature and drapery with remarkable precision. Each print undergoes rigorous quality checks, guaranteeing a flawless finish and robust construction. This holder isn't just functional; it's a statement piece, seamlessly blending art and technology. Perfect for any modern or classic interior.$desc$,
    'decor', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/golden-atlas-smart-speaker-holder-stand/hero.webp', false, false
  ),
  (
    'vibrant-miniature-pokemon-collectibles-set',
    'Vibrant Miniature Pokemon Collectibles Set',
    $desc$Unleash your inner trainer with our vibrant Miniature Pokemon Collectibles Set, meticulously 3D printed by lol3d.in. Each iconic character, from the fiery Charizard to the electric Pikachu, is brought to life with exceptional detail and a smooth, premium matte finish. Crafted using high-quality PLA filament, these figurines boast remarkable layer fidelity, showcasing crisp lines and intricate features without visible imperfections. The rich, diverse color palette makes this set a stunning display piece for any fan or collector. Experience the superior print quality and craftsmanship that defines lol3d.in, perfect for desks, shelves, or as a thoughtful gift.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/vibrant-miniature-pokemon-collectibles-set/hero.webp', false, false
  ),
  (
    'chansey-google-home-mini-wall-mount',
    'Chansey Google Home Mini Wall Mount',
    $desc$Transform your smart speaker into a delightful display with our premium 3D printed Chansey Google Home Mini wall mount. Crafted with meticulous attention to detail, this holder boasts a smooth, vibrant pink finish that perfectly captures Chansey's iconic charm. Our advanced 3D printing technology ensures exceptional layer fidelity, resulting in a seamless, high-quality product with no visible print lines. Designed for both aesthetics and functionality, it securely cradles your device while offering discreet cable management. Elevate your home decor and keep your smart speaker neatly organized with this unique, durable, and beautifully printed accessory from lol3d.in.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/chansey-google-home-mini-wall-mount/hero.webp', false, false
  ),
  (
    'roronoa-zoro-three-sword-style-anime-statue',
    'Roronoa Zoro Three-Sword Style Anime Statue',
    $desc$Unleash the power of the Pirate Hunter with our meticulously crafted Roronoa Zoro Three-Sword Style 3D printed statue. This stunning piece captures Zoro in his iconic dynamic pose, surrounded by intricate flame-like aura effects, showcasing unparalleled detail. Printed with premium white resin, it boasts an exceptionally smooth, matte finish that highlights every muscle contour and flowing fabric. Our advanced 3D printing technology ensures impeccable layer fidelity, resulting in a seamless, high-definition sculpture with zero visible layer lines. A true masterpiece for collectors and fans, this statue embodies the pinnacle of print quality, bringing your favorite swordsman to life with breathtaking precision. Elevate your collection with lol3d.in's superior craftsmanship.$desc$,
    'figurines', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/roronoa-zoro-three-sword-style-anime-statue/hero.webp', false, false
  ),
  (
    'bambu-lab-3d-print-bed-scraper-v2',
    'Bambu Lab 3D Print Bed Scraper V2',
    $desc$Elevate your 3D printing workflow with the Bambu Lab Scraper V2, meticulously crafted for optimal performance. This functional tool features a robust, ergonomic handle with a distinctive honeycomb pattern, ensuring a secure and comfortable grip. The design incorporates a replaceable blade, secured by two screws, making it a durable and long-lasting addition to your toolkit. Printed with exceptional layer fidelity, the handle boasts a smooth, consistent finish that speaks to lol3d.in's commitment to premium print quality. The vibrant green 'Bambu Lab' inlay adds a touch of brand elegance, making this scraper not just a tool, but a statement of quality.$desc$,
    'functional', 1, null, '[{"type":"PLA","surcharge":0}]'::jsonb,
    '/products/bambu-lab-3d-print-bed-scraper-v2/hero.webp', false, false
  )
on conflict (slug) do nothing;
