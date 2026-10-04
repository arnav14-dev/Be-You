/* BE YOU — catalogue data (from the BE YOU Premium Collection catalogue).
   Tool kit and document holder codes (TK / DH) are demo labels: the printed
   catalogue lists those styles by name only. */
window.BY_DATA = (() => {
  const img = n => `assets/img/${n}.jpg`;
  const tile = n => `assets/img/tiles/p-${n}.jpg`;

  const cats = [
    { id: 'backpacks', name: 'Backpacks', letter: 'B', hero: 'bp06-l', line: 'Designed for every lifestyle. Built for every journey.',
      feats: ['Premium-quality materials', 'Ergonomic, comfortable carry', 'Durable & reliable build', 'Timely delivery'] },
    { id: 'duffles', name: 'Duffle Bags', letter: 'D', hero: 'db01-l', line: 'An array of travel duffles to meet your requirements.',
      feats: ['Soft padded shoulder straps', 'Lightweight design', 'Minimises pressure on shoulders & spine'] },
    { id: 'handbags', name: 'Handbags', letter: 'H', hero: 'hb01-l', line: 'A chic yet classy touch to every bag collection.',
      feats: ['Exquisite, modern styles', 'Trending new shapes', 'Suitable for all occasions'] },
    { id: 'gifts', name: 'Gift Sets', letter: 'G', hero: 'gs02-l', line: 'The best combinations for corporate gifting.',
      feats: ['Presentation-ready gift box', 'Perfect hamper for special occasions', 'Ideal for corporate gifting'] },
    { id: 'laptop', name: 'Laptop Bags', letter: 'L', hero: 'lb04-l', line: 'Premium, durable, spacious and fashionable.',
      feats: ['Durable & dependable', 'Keeps everything organised on the go', 'Built for professionals'] },
    { id: 'luggage', name: 'Luggage Bags', letter: 'L', hero: 'lgb01-l', line: 'Stylish, accommodating and easy to carry.',
      feats: ['From weekend trips to long journeys', 'Smooth, effortless travel', 'Sets & singles'] },
    { id: 'messenger', name: 'Messenger Bags', letter: 'M', hero: 'msb02-l', line: 'Fashion bags for men — office, travel and everyday.',
      feats: ['Multiple compartments', 'Classic leather & canvas finishes', 'Everyday versatility'] },
    { id: 'wallets', name: 'Men’s Wallets', letter: 'W', hero: 'mw01-l', line: 'Exclusive, durable and stylish.',
      feats: ['Sleek & suave profiles', 'Ample card & cash space', 'Premium finishes'] },
    { id: 'passport', name: 'Passport Organisers', letter: 'P', hero: 'po01-l', line: 'To suit every travel need.',
      feats: ['Slots for passport, cards & tickets', 'Secure closures', 'Leather, PU & fabric options'] },
    { id: 'pouches', name: 'Makeup Pouches', letter: 'M', hero: 'mp02-l', line: 'Stylish pouches for makeup and accessories.',
      feats: ['Ample space for cosmetic essentials', 'Travel-ready', 'Easy-clean finishes'] },
    { id: 'toolkits', name: 'Tool Kit Holders', letter: 'T', hero: 'tk-hero2', line: 'Designed to protect. Crafted to fit.',
      feats: ['Custom-fit designs', 'Durable, water-resistant materials', 'Secure & organised', 'Compact & space-saving', 'For cars, SUVs, trucks, two-wheelers & commercial vehicles'] },
    { id: 'documents', name: 'Document Holders', letter: 'D', hero: 'doc-hero2', line: 'Organised today. Secured tomorrow.',
      feats: ['Premium quality', 'Secure & safe', 'Smart organisation', 'Portable & stylish', 'Built to last'] },
  ];

  /* photo: clean studio cut-out (transparent WebP) used by the current page;
     img: older composited tile, kept for the archived v3 page. */
  const P = (sku, cat, name, tag, desc, pack, life) => ({ sku, cat, name, tag, desc, img: tile(pack), photo: `assets/img/products/${pack}.webp`, life: life ? img(life) : null });
  const products = [
    P('BP01', 'backpacks', 'Adventure Backpack', 'Adventure. Comfort. Durability.', 'Perfect for travellers, trekkers and outdoor enthusiasts.', 'bp01', 'bp01-l'),
    P('BP02', 'backpacks', 'Professional Backpack', 'Professional. Sleek. Smart.', 'Ideal for business professionals and corporate use.', 'bp02', 'bp02-l'),
    P('BP03', 'backpacks', 'Everyday Laptop Backpack', 'Study. Everyday. Essential.', 'Great for students and daily use with laptop and books.', 'bp03', 'bp03-l'),
    P('BP04', 'backpacks', 'Compact Sling Backpack', 'Light. Compact. Trendy.', 'Perfect for city life, short trips and on-the-go style.', 'bp04', 'bp04-l'),
    P('BP05', 'backpacks', 'Heritage Flap Backpack', 'College & everyday use.', 'Spacious and stylish — sleek, compact and built to last with premium-quality materials.', 'bp05', 'bp05-l'),
    P('BP06', 'backpacks', 'Business & Travel Backpack', 'Business & weekend travel.', 'Professional look with smart compartments for work and travel.', 'bp06', 'bp06-l'),
    P('BP07', 'backpacks', 'Office Backpack', 'Office & daily use.', 'Clean, modern design for the daily commute, in water-resistant fabric.', 'bp07', 'bp07-l'),
    P('DB01', 'duffles', 'Weekender Duffle', 'For weekend getaways.', 'Spacious, rugged and stylish — perfect for short trips and weekend escapes.', 'db01', 'db01-l'),
    P('DB02', 'duffles', 'Gym & Fitness Duffle', 'For gym & fitness.', 'Lightweight and durable — built to carry your fitness essentials in style.', 'db02', 'db02-l'),
    P('DB03', 'duffles', 'City-Break Duffle', 'For city breaks.', 'Trendy and elegant — ideal for short trips, shopping or city adventures.', 'db03', 'db03-l'),
    P('DB04', 'duffles', 'Everyday Duffle Set', 'For everyday elegance.', 'Minimal yet classy — perfect for daily use, work trips or overnight stays.', 'db04', 'db04-l'),
    P('HB01', 'handbags', 'Elegant Tote', 'Work, shopping & everyday.', 'Perfect for work, shopping and everyday elegance.', 'hb01', 'hb01-l'),
    P('HB02', 'handbags', 'Chic Bucket Set', 'Trendy & versatile.', 'Trendy and versatile for every occasion.', 'hb02', 'hb02-l'),
    P('HB03', 'handbags', 'Classic Elegance Set', 'Sophisticated design.', 'Sophisticated design with ample space.', 'hb03', 'hb03-l'),
    P('HB04', 'handbags', 'Trendy Colorblock Set', 'Modern colour combination.', 'A modern colour combination that stands out in style.', 'hb04', 'hb04-l'),
    P('HB05', 'handbags', 'Luxury Handbag Set', 'Premium look.', 'A premium look with matching accessories.', 'hb05', 'hb05-l'),
    P('GS01', 'gifts', 'Executive Gift Set', 'Elegant corporate appeal.', 'Ideal corporate gifting choice with elegant appeal.', 'gs01', 'gs02-l'),
    P('GS02', 'gifts', 'Premium Gift Set', 'Stylish & practical.', 'Stylish, practical and perfect for any occasion — a perfect gift hamper for special occasions or corporate.', 'gs02', 'gs02-l'),
    P('LB01', 'laptop', 'Leather Laptop Bag', 'Classy & spacious.', 'Classy and spacious for your work essentials.', 'lb01', 'lb01-l'),
    P('LB02', 'laptop', 'Compact Laptop Bag', 'Trendy, ample storage.', 'Trendy design with ample storage space.', 'lb02', 'lb02-l'),
    P('LB03', 'laptop', 'Business Laptop Bag', 'Sleek & lightweight.', 'Sleek, lightweight and built for professionals.', 'lb03', 'lb03-l'),
    { sku: 'LB04', cat: 'laptop', name: 'Premium Laptop Bag', tag: 'Durable & spacious.', desc: 'Durable, spacious and crafted for modern professionals.', img: img('lb04-l'), photo: 'assets/img/products/lb04.jpg', life: null, cover: true },
    P('LGB01', 'luggage', 'Premium Duffle Bag', 'Weekend-ready.', 'Spacious, stylish and perfect for short trips or weekend getaways.', 'lgb01', 'lgb01-l'),
    P('LGB02', 'luggage', 'Soft Trolley Bag (Set)', 'Effortless travel.', 'Lightweight, durable and designed for effortless travel.', 'lgb02', null),
    P('LGB03', 'luggage', 'Duffle Trolley Bag', 'Short trips & everyday.', 'Versatile and functional duffle trolley for short trips and everyday use.', 'lgb03', 'lgb03-l'),
    { sku: 'LGB04', cat: 'luggage', name: 'Hard Shell Trolley (Set)', tag: 'Sturdy & spacious.', desc: 'Sturdy, stylish and spacious luggage set for all your travel essentials.', img: img('lgb04-l'), photo: 'assets/img/products/lgb04.jpg', life: null, cover: true },
    P('MSB01', 'messenger', 'Canvas Messenger Bag', 'Casual everyday carry.', 'Designed to meet your every need — a good messenger bag will see you through almost any casual situation.', 'msb01', 'msb01-l'),
    P('MSB02', 'messenger', 'Leather Messenger Bag', 'Classic leather finish.', 'Classic leather finish with multiple compartments for daily use.', 'msb02', 'msb02-l'),
    P('MSB03', 'messenger', 'Crossbody Sling Bag', 'Light & stylish.', 'Lightweight and stylish sling bag for travel, work or everyday adventures.', 'msb03', 'msb03-l'),
    P('MSB04', 'messenger', 'Sling Messenger Bag', 'Smart organisation.', 'Trendy sling design with ample space and smart organisation.', 'msb04', 'msb04-l'),
    P('MSB05', 'messenger', 'Office Messenger Bag', 'Office, travel & daily.', 'Spacious, durable and perfect for office, travel and daily essentials.', 'msb05', 'msb05-l'),
    P('MW01', 'wallets', 'Slim Leather Wallet', 'Sleek & suave.', 'Pocket some style with a sleek, suave leather wallet.', 'mw01', 'mw01-l'),
    P('MW02', 'wallets', 'Card Holder Wallet', 'Compact, many slots.', 'Compact design with ample card slots and cash space.', 'mw02', null),
    P('MW03', 'wallets', 'Textured Leather Wallet', 'Bold texture.', 'Premium finish with a bold texture for a classy look.', 'mw03', null),
    P('PO01', 'passport', 'Classic Passport Cover', 'Minimal & stylish.', 'Minimal yet stylish cover to protect your passport on every adventure.', 'po01', 'po01-l'),
    P('PO02', 'passport', 'Travel Organiser Wallet', 'Passport, cards & tickets.', 'Smartly designed with multiple slots for passport, cards, tickets and travel documents.', 'po02', 'po02-l'),
    P('PO03', 'passport', 'Fabric Passport Wallet', 'Light, secure snap.', 'Lightweight fabric organisers with a secure snap closure and multiple compartments.', 'po03', null),
    P('PO04', 'passport', 'PU Leather Passport Wallet', 'Elegant PU leather.', 'Premium PU leather with an elegant finish and ample space for travel essentials.', 'po04', 'po04-l'),
    P('MP01', 'pouches', 'Travel Cosmetic Pouch', 'Compact yet roomy.', 'Compact yet roomy — ideal for travel and daily use.', 'mp01', 'mp01-l'),
    P('MP02', 'pouches', 'Leather Makeup Pouch', 'Spacious & stylish.', 'Spacious, stylish and perfect to organise your daily essentials.', 'mp02', 'mp02-l'),
    P('TK01', 'toolkits', 'Zipper Pouch Tool Kit', 'Compact pouch type.', 'Smart, durable and compact — keeps every tool organised and secure.', 'tk01', null),
    P('TK02', 'toolkits', 'Roll-Up Tool Kit', 'Roll-up style.', 'Rolls tight for space-saving storage in any vehicle.', 'tk02', null),
    P('TK03', 'toolkits', 'Folder Tool Kit', 'Tri-fold folder type.', 'Folder layout for vehicle-specific tool sets.', 'tk03', null),
    P('TK04', 'toolkits', 'Triangular Tool Kit', 'Triangular shape.', 'Triangular profile that fits snugly in boots and spare-wheel wells.', 'tk04', null),
    P('TK05', 'toolkits', 'Compact Box Tool Kit', 'Compact box cover.', 'Box-style case with structured protection for tools.', 'tk05', null),
    P('DH01', 'documents', 'Zipper File Folder', 'Banking documents.', 'Smart, stylish and secure — keeps important papers safe and well organised.', 'dh01', null),
    P('DH02', 'documents', 'Button Envelope Folder', 'Financial records.', 'Envelope folder with button closure for everyday records.', 'dh02', null),
    P('DH03', 'documents', 'Multi-Pocket File Folder', 'Office documents.', 'Multiple pockets for easy sorting and quick access.', 'dh03', null),
    P('DH04', 'documents', 'Expanding File Folder', 'Projects & reports.', 'Expanding gussets for projects, reports and important papers.', 'dh04', null),
    P('DH05', 'documents', 'Document Docket', 'Important papers.', 'A professional docket for certificates, contracts and business files.', 'dh05', null),
  ];

  const logos = [
    ['google', 'Google'], ['youtube', 'YouTube'], ['facebook', 'Facebook'], ['twitter', 'Twitter'], ['gartner', 'Gartner'],
    ['aws', 'Amazon Web Services'], ['nvidia', 'NVIDIA'], ['wipro', 'Wipro'], ['icici', 'ICICI Bank'], ['asianpaints', 'Asian Paints'],
    ['mac', 'MAC'], ['clinique', 'Clinique'], ['bigbazaar', 'Big Bazaar'], ['esbeda', 'Esbeda'], ['metro', 'Metro Shoes'],
    ['janeshilton', 'Jane Shilton'], ['baggit', 'Baggit'], ['zouk', 'Zouk'], ['lavie', 'Lavie'], ['vril', 'VRIL'], ['bithalniketan', 'Bithai Niketan'],
  ];

  return { cats, products, logos, img };
})();
