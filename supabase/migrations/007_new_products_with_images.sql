-- Migration 007: Insert 30 new products with image paths
-- Run this in the Supabase SQL Editor (supabase.com → SQL Editor)
-- These products have hero images in public/products/<slug>/hero.webp

INSERT INTO products (slug, name, category, description, price_base, dimensions, materials, featured, active, image_url)
VALUES
  (
    'articulated-dual-tone-dragon-moth-figure',
    'Articulated Dual-Tone Dragon Moth Figure',
    'decor',
    'A stunning dual-tone articulated dragon-moth figure, printed in-place with full movement. A head-turning conversation piece for any shelf.',
    799, '350 mm wingspan',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    true, true,
    '/products/articulated-dual-tone-dragon-moth-figure/hero.webp'
  ),
  (
    'bambu-lab-3d-print-bed-scraper-v2',
    'Bambu Lab 3D Print Bed Scraper V2',
    'functional',
    'Precision-fit bed scraper for Bambu Lab printers. Ergonomic grip, stiff blade channel, and a lanyard hole — the V2 you didn''t know you needed.',
    199, '180 × 40 × 12 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":50}]'::jsonb,
    false, true,
    '/products/bambu-lab-3d-print-bed-scraper-v2/hero.webp'
  ),
  (
    'chansey-google-home-mini-wall-mount',
    'Chansey Google Home Mini Wall Mount',
    'functional',
    'Mount your Google Home Mini inside a Chansey Pokémon shell on any wall. Secure friction-fit, no glue needed.',
    349, '120 × 120 × 80 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/chansey-google-home-mini-wall-mount/hero.webp'
  ),
  (
    'custom-3d-printed-id-key-tags',
    'Custom 3D Printed ID & Key Tags',
    'functional',
    'Personalised luggage, key, and ID tags printed with your name or text. Durable, lightweight, and available in any colour.',
    149, '80 × 35 × 4 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":30}]'::jsonb,
    false, true,
    '/products/custom-3d-printed-id-key-tags/hero.webp'
  ),
  (
    'elegant-multi-tiered-cosmetic-desk-organizers',
    'Elegant Multi-Tiered Cosmetic Desk Organiser',
    'functional',
    'A sleek multi-tiered organiser for makeup, brushes, and skincare. Modular tiers stack to the height you need.',
    649, '150 × 150 × 200 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":120}]'::jsonb,
    false, true,
    '/products/elegant-multi-tiered-cosmetic-desk-organizers/hero.webp'
  ),
  (
    'ergonomic-desktop-phone-stand-with-media-control-knob',
    'Ergonomic Desktop Phone Stand with Media Control Knob',
    'functional',
    'A premium phone stand with a built-in rotary knob that doubles as a media controller. Adjustable viewing angle, cable slot included.',
    549, '130 × 90 × 110 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]'::jsonb,
    true, true,
    '/products/ergonomic-desktop-phone-stand-with-media-control-knob/hero.webp'
  ),
  (
    'garmin-smartwatch-charging-stand-mount',
    'Garmin Smartwatch Charging Stand & Mount',
    'functional',
    'Holds your Garmin watch at the perfect bedside angle while it charges. Clean cable routing keeps your desk tidy.',
    299, '80 × 60 × 90 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/garmin-smartwatch-charging-stand-mount/hero.webp'
  ),
  (
    'geometric-skull-planter-modern-3d-printed-decor',
    'Geometric Skull Planter — Modern 3D Printed Decor',
    'decor',
    'A low-poly skull planter with drainage hole — equal parts edgy and elegant. Perfect for succulents and air plants.',
    449, '120 × 100 × 130 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":80}]'::jsonb,
    false, true,
    '/products/geometric-skull-planter-modern-3d-printed-decor/hero.webp'
  ),
  (
    'golden-atlas-smart-speaker-holder-stand',
    'Golden Atlas Smart Speaker Holder Stand',
    'functional',
    'An elevated stand for your smart speaker with a golden-finish aesthetic. Cable management channel keeps everything tidy.',
    399, '130 × 130 × 60 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/golden-atlas-smart-speaker-holder-stand/hero.webp'
  ),
  (
    'hexagonal-vesa-mount-laptop-tray',
    'Hexagonal VESA Mount Laptop Tray',
    'functional',
    'Attaches to any VESA-compatible monitor arm to give your laptop a floating side shelf. Hex lattice design keeps weight low.',
    749, '320 × 240 × 20 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":150}]'::jsonb,
    false, true,
    '/products/hexagonal-vesa-mount-laptop-tray/hero.webp'
  ),
  (
    'iconic-spider-man-bust-3d-print',
    'Iconic Spider-Man Bust 3D Print',
    'cosplay',
    'A high-detail Spider-Man bust ready for display or painting. Captures the iconic mask and suit texture at desk-display scale.',
    899, '150 × 120 × 200 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    true, true,
    '/products/iconic-spider-man-bust-3d-print/hero.webp'
  ),
  (
    'minimalist-smartwatch-charging-dock',
    'Minimalist Smartwatch Charging Dock',
    'functional',
    'A clean, minimalist dock that charges your smartwatch at nightstand height. Works with Apple Watch, Samsung, Amazfit, and more.',
    249, '70 × 70 × 50 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/minimalist-smartwatch-charging-dock/hero.webp'
  ),
  (
    'modern-geometric-facet-mini-vase',
    'Modern Geometric Facet Mini Vase',
    'decor',
    'A petite faceted vase with sharp geometric angles. Perfect for a single stem or dried botanicals on a bookshelf.',
    349, '60 × 60 × 100 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":60}]'::jsonb,
    false, true,
    '/products/modern-geometric-facet-mini-vase/hero.webp'
  ),
  (
    'organic-teal-magsafe-charger-stand',
    'Organic Teal MagSafe Charger Stand',
    'functional',
    'An organic-shaped stand that holds your MagSafe puck at the perfect portrait angle. The teal colour looks stunning on any desk.',
    299, '80 × 50 × 100 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/organic-teal-magsafe-charger-stand/hero.webp'
  ),
  (
    'precision-3d-printed-planetary-gear-set',
    'Precision 3D Printed Planetary Gear Set',
    'functional',
    'A fully functional print-in-place planetary gear set — a mechanical marvel you can actually spin. Great for engineers and curious minds.',
    599, '120 mm diameter',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]'::jsonb,
    true, true,
    '/products/precision-3d-printed-planetary-gear-set/hero.webp'
  ),
  (
    'premium-3d-printed-vesa-mount-bracket',
    'Premium 3D Printed VESA Mount Bracket',
    'functional',
    'A sturdy VESA mount bracket for attaching monitors, small TVs, or tablets to arms and walls. Supports 75×75 and 100×100 VESA patterns.',
    499, '120 × 120 × 40 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]'::jsonb,
    false, true,
    '/products/premium-3d-printed-vesa-mount-bracket/hero.webp'
  ),
  (
    'roronoa-zoro-three-sword-style-anime-statue',
    'Roronoa Zoro — Three Sword Style Anime Statue',
    'cosplay',
    'A detailed Roronoa Zoro statue in his iconic three-sword style pose. A must-have for One Piece fans — display-ready straight off the printer.',
    1299, '200 × 120 × 300 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    true, true,
    '/products/roronoa-zoro-three-sword-style-anime-statue/hero.webp'
  ),
  (
    'sleek-3d-printed-desk-organizer-with-phone-stand',
    'Sleek 3D Printed Desk Organiser with Phone Stand',
    'functional',
    'A combined desk organiser and phone stand in one sleek unit. Holds pens, sticky notes, and your phone at the perfect viewing angle.',
    549, '200 × 100 × 130 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":100}]'::jsonb,
    false, true,
    '/products/sleek-3d-printed-desk-organizer-with-phone-stand/hero.webp'
  ),
  (
    'spider-man-advanced-suit-3d-print-figurine',
    'Spider-Man Advanced Suit 3D Print Figurine',
    'cosplay',
    'Spider-Man in his advanced suit, captured in a dynamic action pose. High surface detail with crisp web lines — paint it or display it raw.',
    999, '80 × 60 × 200 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    true, true,
    '/products/spider-man-advanced-suit-3d-print-figurine/hero.webp'
  ),
  (
    'spin-click-fidget-toy',
    'Spin-Click Fidget Toy',
    'functional',
    'A satisfying print-in-place fidget toy with a tactile click on every spin. Pocket-sized, durable, and endlessly clickable.',
    199, '65 mm diameter',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/spin-click-fidget-toy/hero.webp'
  ),
  (
    'superman-man-of-steel-3d-printed-sculpture',
    'Superman — Man of Steel 3D Printed Sculpture',
    'cosplay',
    'Superman in his iconic Man of Steel pose, sculpted with cape-in-wind detail. A premium display piece for DC fans.',
    1199, '180 × 120 × 280 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/superman-man-of-steel-3d-printed-sculpture/hero.webp'
  ),
  (
    'textured-smartwatch-charger-stand',
    'Textured Smartwatch Charger Stand',
    'functional',
    'A textured-finish smartwatch charging stand that looks premium on any nightstand. Supports Apple Watch, Samsung Galaxy Watch, and more.',
    279, '75 × 75 × 55 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/textured-smartwatch-charger-stand/hero.webp'
  ),
  (
    'two-tone-ribbed-desk-organizer-with-pen-holder',
    'Two-Tone Ribbed Desk Organiser with Pen Holder',
    'functional',
    'A two-tone ribbed organiser with dedicated pen/pencil slot, phone ledge, and accessory compartments. A desk upgrade in one print.',
    499, '180 × 90 × 120 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":80}]'::jsonb,
    false, true,
    '/products/two-tone-ribbed-desk-organizer-with-pen-holder/hero.webp'
  ),
  (
    'versatile-cable-organizer-clip',
    'Versatile Cable Organiser Clip',
    'functional',
    'A universal cable clip that mounts to any desk edge and keeps your cables exactly where you left them. Works with USB-C, Lightning, HDMI, and more.',
    99, '45 × 25 × 20 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":20}]'::jsonb,
    false, true,
    '/products/versatile-cable-organizer-clip/hero.webp'
  ),
  (
    'vibrant-green-geometric-smartwatch-charging-stand',
    'Vibrant Green Geometric Smartwatch Charging Stand',
    'functional',
    'A bold geometric smartwatch stand in vibrant green. Holds your watch at the perfect bedside angle while adding a pop of colour to your space.',
    299, '80 × 70 × 60 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/vibrant-green-geometric-smartwatch-charging-stand/hero.webp'
  ),
  (
    'vibrant-miniature-pokemon-collectibles-set',
    'Vibrant Miniature Pokémon Collectibles Set',
    'cosplay',
    'A set of vibrant miniature Pokémon figurines — perfect for a desk, shelf, or Poké-fan gift. Printed in bright multi-colour PLA.',
    699, '30–60 mm per figure',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    true, true,
    '/products/vibrant-miniature-pokemon-collectibles-set/hero.webp'
  ),
  (
    'vibrant-spherical-smart-device-enclosure',
    'Vibrant Spherical Smart Device Enclosure',
    'functional',
    'A spherical enclosure for small smart devices (sensors, trackers, hubs). Ventilated, screwless assembly, and available in any colour.',
    449, '100 mm diameter',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":80}]'::jsonb,
    false, true,
    '/products/vibrant-spherical-smart-device-enclosure/hero.webp'
  ),
  (
    'vibrant-wavy-red-decorative-vase',
    'Vibrant Wavy Red Decorative Vase',
    'decor',
    'A striking wavy vase in vibrant red — the vase-mode print technique gives it a seamless, ultra-smooth exterior. Watertight PETG option available.',
    399, '80 × 80 × 180 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":70}]'::jsonb,
    false, true,
    '/products/vibrant-wavy-red-decorative-vase/hero.webp'
  ),
  (
    'wavy-ribbed-blue-decorative-vase',
    'Wavy Ribbed Blue Decorative Vase',
    'decor',
    'A beautifully ribbed blue vase with a flowing wave silhouette. The textured surface catches light from every angle.',
    399, '80 × 80 × 200 mm',
    '[{"type":"PLA","surcharge":0},{"type":"PETG","surcharge":70}]'::jsonb,
    false, true,
    '/products/wavy-ribbed-blue-decorative-vase/hero.webp'
  ),
  (
    'whimsical-smart-speaker-stand',
    'Whimsical Smart Speaker Stand',
    'functional',
    'A playful, whimsical stand for small smart speakers. Elevates sound projection and adds personality to your Alexa, Echo Dot, or Google Nest.',
    349, '110 × 110 × 70 mm',
    '[{"type":"PLA","surcharge":0}]'::jsonb,
    false, true,
    '/products/whimsical-smart-speaker-stand/hero.webp'
  )
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  active    = EXCLUDED.active;
