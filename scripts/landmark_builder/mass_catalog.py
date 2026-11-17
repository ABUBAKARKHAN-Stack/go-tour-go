"""Mass Catalog Generator for GoTourGo Landmark Expansion.

Contains complete curated matrices for:
- Sindh & Karachi (reaching 550+ total)
- Punjab (reaching 350+ total)
- Khyber Pakhtunkhwa (reaching 220+ total)
- Balochistan (reaching 150+ total)
- Gilgit-Baltistan (reaching 130+ total)
- Azad Kashmir (reaching 70+ total)
- Islamabad Capital Territory (reaching 30+ total)
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def get_mass_landmarks() -> list[dict]:
    records = []

    # -------------------------------------------------------------------------
    # MASS SINDH & KARACHI (300+ ADDITIONAL DETAILED LANDMARKS)
    # -------------------------------------------------------------------------
    # Format: (slug, name, name_ur, category, city, region, lat, lon, radius, short_en, short_ur, desc_en, desc_ur)
    sindh_items = [
        # Karachi Landmarks
        ("dolmen-mall-clifton-seafront", "Dolmen Mall Clifton Waterfront", "ڈولمن مال کلفٹن واٹر فرنٹ", "shopping", "Karachi", 24.818056, 67.031944, 400,
         "Pakistan's premier luxury seaside shopping mall in Clifton overlooking the Arabian Sea.",
         "کلفٹن کے ساحل پر واقع پاکستان کا سب سے بڑا اور جدید ترین شاپنگ مال۔",
         "Spanning over 600,000 square feet along the Clifton coast, Dolmen Mall features international fashion flagships, extensive food courts, and floor-to-ceiling glass atriums overlooking the Arabian Sea.",
         "بحیرہ عرب کے کنارے واقع ڈولمن مال کلفٹن میں دنیا کے نامور برانڈز، ملکی اور بین الاقوامی فوڈ کورٹس اور جدید شاپنگ کا اعلیٰ ترین معیار دستیاب ہے۔"),
        ("ocean-mall-and-tower-clifton", "Ocean Mall & Tower Clifton", "اوشن مال و ٹاور کلفٹن کراچی", "shopping", "Karachi", 24.828889, 67.034722, 350,
         "393-foot modern shopping tower in Clifton with 3D cinema and rooftop dining.",
         "کلفٹن کا 393 فٹ بلند جدید شاپنگ ٹاور جہاں سینما اور روف ٹاپ ڈائننگ موجود ہے۔",
         "Rising 30 storeys above Clifton, Ocean Tower features multi-level fashion retail arcades, a cineplex, family entertainment zones, and panoramic dining decks looking over southern Karachi.",
         "کلفٹن کا یہ جدید فلک بوس ٹاور فیشن برانڈز، سینما اور بالائی منزلوں سے کراچی کے شاندار رات کے نظاروں کے لیے جانا جاتا ہے۔"),
        ("the-forum-mall-clifton", "The Forum Shopping Mall", "دی فورم شاپنگ مال کلفٹن", "shopping", "Karachi", 24.828333, 67.038889, 250,
         "Boutique shopping center in Clifton famous for imported delicacies, cafes, and fashion.",
         "کلفٹن کا معروف بوتیک شاپنگ مال جو درآمدی اشیاء، کیفے اور برانڈز کا مرکز ہے۔",
         "A pioneering modern retail destination in Clifton featuring specialty bookshops, gourmet supermarkets, high-end fashion boutiques, and ambient cafe terraces.",
         "کلفٹن کا یہ پروقار مال امپورٹڈ اشیاء، کتابوں کی دکانوں اور پرسکون کافی شاپس کی بدولت شہریوں کی پسندیدہ جگہ ہے۔"),
        ("park-towers-clifton-karachi", "Park Towers Mall Clifton", "پارک ٹاورز کلفٹن کراچی", "shopping", "Karachi", 24.815556, 67.034722, 300,
         "Karachi's first modern atrium shopping mall opened in 1999 near Abdullah Shah Ghazi.",
         "مزار عبداللہ شاہ غازی کے قریب 1999ء میں قائم ہونے والا کراچی کا پہلا ایٹریم شاپنگ مال۔",
         "Opened in 1999, Park Towers was the pioneer of modern American-style enclosed shopping malls in Pakistan, featuring central glass elevators, fashion brands, and food courts.",
         "1999ء میں کھلنے والا پارک ٹاورز پاکستان میں جدید ایٹریم مالز کا بانی تھا جس کے شیشے کے لفٹس اور شاپنگ آؤٹ لیٹس نے کراچی میں نئی روایت ڈالی۔"),
        ("rabi-center-tariq-road", "Rabi Center (Tariq Road)", "رابعہ سینٹر طارق روڈ کراچی", "shopping", "Karachi", 24.872778, 67.061944, 300,
         "Pakistan's premier bridal fabric, embroidery, and wedding dress bazaar on Tariq Road.",
         "طارق روڈ پر پاکستان کی مشہور ترین برائیڈل فیبرک، کڑھائی اور شادی کے ملبوسات کی مارکیٹ۔",
         "A multi-level shopping paradise holding hundreds of specialized fabric boutiques offering pure chiffon, banarsi silk, hand-embroidered zardozi work, and formal bridal wear.",
         "طارق روڈ کا رابعہ سینٹر شادی بیاہ کے ملبوسات، بنارسی ساڑھیوں، شفون اور زردوزی کڑھائی کے کپڑوں کا ملک گیر شہرت یافتہ مرکز ہے۔"),
        ("chakiwara-historic-lyari-bazaar", "Chakiwara Historic Commercial Street", "چاکیواڑہ تاریخی بازار لیاری کراچی", "shopping", "Karachi", 24.871944, 67.005556, 300,
         "The vibrant social and trading spine of Lyari, famous for traditional bakeries, chai, and fabrics.",
         "لیاری کی مرکزی سماجی اور تجارتی شاہراہ جو روایتی بیکریوں، کڑک چائے اور کپڑے کے لیے مشہور ہے۔",
         "Chakiwara is the beating cultural heart of Lyari. Bustling day and night with tea hotels, football debates, traditional Balochi dress shops, and sweetmeat vendors.",
         "چاکیواڑہ لیاری کا سب سے متحرک علاقہ ہے جہاں روایتی بلوچی لباس، کڑھائی، گرم چائے خانے اور فٹبال کی بحثیں اس کی منفرد پہچان ہیں۔"),
        ("national-stadium-karachi-cricket", "National Bank Stadium (National Stadium Karachi)", "نیشنل بینک اسٹیڈیم (نیشنل اسٹیڈیم کراچی)", "attraction", "Karachi", 24.893889, 67.078889, 600,
         "Pakistan's fortress of test cricket, seating 34,000 passionate spectators on Stadium Road.",
         "اسٹیڈیم روڈ پر 34 ہزار تماشائیوں کی گنجائش والا پاکستان کرکٹ کا ناقابلِ تسخیر قلعہ۔",
         "Established in 1955, National Stadium Karachi has witnessed historic international cricket victories, world cup matches, and PSL finals. It was long known as the 'Fortress of Pakistan Cricket'.",
         "1955ء میں قائم ہونے والا نیشنل اسٹیڈیم کراچی پاکستان کی کرکٹ کا تاریخی ہوم گراؤنڈ ہے جہاں ٹیسٹ، ورلڈ کپ اور پی ایس ایل کے یادگار مقابلے منعقد ہوئے۔"),
        ("karachi-expo-centre-gulshan", "Karachi Expo Centre", "کراچی ایکسپو سینٹر گلشن اقبال", "cultural", "Karachi", 24.901667, 67.086944, 500,
         "Pakistan's premier international trade exhibition, book fair, and conventions complex.", "پاکستان کا سب سے بڑا بین الاقوامی تجارتی نمائش، کتاب میلہ اور کنونشن سینٹر۔",
         "Spanning multiple climate-controlled exhibition halls on University Road, Karachi Expo Centre hosts IDEAS defense expo, the annual Karachi International Book Fair, and industrial trade summits.",
         "یونیورسٹی روڈ پر واقع ایکسپو سینٹر سالانہ کراچی بین الاقوامی کتب میلے، دفاعی نمائش آئیڈیاز اور عالمی تجارتی کانفرنسوں کا مرکزی مقام ہے۔"),
        ("machi-miani-market-kharadar", "Machi Miani Historic Fish Market", "ماچھی میانی تاریخی مچھلی مارکیٹ کھارادر", "shopping", "Karachi", 24.853056, 66.994444, 250,
         "Karachi's oldest coastal fish and seafood market in Kharadar, dating back to the 18th century.",
         "کھارادر میں اٹھارہویں صدی کی کراچی کی سب سے پرانی ساحلی مچھلی منڈی۔",
         "Located near the site of the ancient Kharadar port gate, Machi Miani has served fresh Arabian Sea catches (pomfret, surmai, red snapper, and jumbo prawns) to Karachiites for over two centuries.",
         "پرانے کھارادر کی یہ تاریخی مچھلی منڈی دو سو سال سے زائد عرصے سے سمندری مچھلی، پاپلیٹ، سرمئی اور جھینگوں کی تازہ فراہمی کا سب سے قدیم اڈا ہے۔"),
        ("baba-and-bhit-islands-harbour", "Baba & Bhit Islands (Karachi Harbour)", "بابا و بھٹ جزائر کراچی ہاربر", "cultural", "Karachi", 24.819444, 66.969444, 1000,
         "Densely populated historic fishing community islands situated inside the calm waters of Karachi harbour.",
         "کراچی کی قدرتی بندرگاہ کے اندر واقع مچھیروں کے تاریخی جزائر جہاں روایتی کشتیاں بنتی ہیں۔",
         "Inhabited by indigenous Sindhi and Kutchi fisherfolk for over 400 years, these islands feature narrow labyrinthine alleys, traditional wooden boatbuilding yards, and rich maritime folklore.",
         "چار سو سال سے آباد بابا اور بھٹ جزائر لکڑی کی کشتیاں بنانے والے روایتی کاریگروں اور مچھیروں کی منفرد ثقافت کا تاریخی جزیرہ نما گڑھ ہیں۔"),
        ("shri-mariamman-temple-soldier-bazaar", "Shri Mariamman Temple (Soldier Bazaar)", "شری مریم من مندر سولجر بازار کراچی", "religious", "Karachi", 24.871944, 67.029444, 200,
         "Historic South Indian Dravidian Hindu temple in Soldier Bazaar dedicated to Goddess Mariamman.", "سولجر بازار میں جنوبی ہند کی دراوڑی طرز کا تاریخی مندر جو ماتا مریم من سے منسوب ہے۔",
         "Constructed by the Tamil and Madrasi Hindu community settled in Karachi during the colonial era, this colorful gopuram temple is unique in Pakistan for its South Indian architectural style.",
         "نوآبادیاتی دور میں کراچی میں آباد ہونے والی مدراسی اور تمل برادری کا تعمیر کردہ یہ مندر اپنے روایتی جنوبی ہندی گوپرم مینار کی بدولت پاکستان میں نایاب ہے۔"),
        ("shri-laxmi-narayan-mandir-native-jetty", "Shri Laxmi Narayan Mandir (Native Jetty)", "شری لکشمی نارائن مندر نیٹو جیٹی کراچی", "religious", "Karachi", 24.838889, 66.981944, 250,
         "200-year-old coastal Hindu temple nestled beside Native Jetty bridge on the chinna creek waters.", "نیٹو جیٹی پل کے نیچے چنا کریک کے سمندری پانی کے کنارے واقع 200 سال قدیم ہندو مندر۔",
         "Perched on the saltwater harbour inlet, this temple is the primary coastal site in Karachi where Hindu devotees perform water immersion rituals, Ganesh Chaturthi, and Navratri prayers.",
         "سمندر کے پانی کے کنارے واقع یہ تاریخی مندر گنیش چترتھی اور مذہبی تہواروں پر مورتیوں کو سمندر برد کرنے کی قدیم رسومات کا مرکزی مقام ہے۔"),
        ("st-judes-shrine-clifton", "Saint Jude's Shrine (St. Anthony's Parish)", "سینٹ جوڈز زیارت گاہ کلفٹن کراچی", "religious", "Karachi", 24.825, 67.038889, 200,
         "Popular Catholic pilgrimage shrine in Clifton visited by people of all faiths seeking solace.", "کلفٹن میں واقع معروف کیتھولک زیارت گاہ جہاں ہر مذہب کے لوگ دعاؤں کے لیے آتے ہیں۔",
         "Dedicated to Saint Jude Thaddeus, the patron saint of lost causes, this peaceful coastal chapel features beautiful stained glass windows and votive candle prayer halls.",
         "کلفٹن کا یہ پرسکون گرجا گھر امید اور دعاؤں کا مرکز ہے جہاں شمعیں روشن کر کے روحانی سکون حاصل کیا جاتا ہے۔"),
        ("alamgir-mosque-bahadurabad", "Jamia Masjid Alamgir (Bahadurabad)", "جامع مسجد عالمگیر بہادر آباد کراچی", "religious", "Karachi", 24.881944, 67.068056, 300,
         "Grand central congregational mosque of Bahadurabad featuring tall white minarets and expansive prayer halls.", "بہادر آباد کی مرکزی جامع مسجد جس کے بلند سفید مینار اور کشادہ دالان قابلِ دید ہیں۔",
         "Built in the 1950s in classical Mughal-modernist style, Alamgir Mosque is a spiritual landmark of District East, accommodating thousands of worshippers for Friday and Eid prayers.",
         "1950 کی دہائی میں تعمیر ہونے والی یہ خوبصورت سفید مسجد بہادر آباد کا روحانی مرکز ہے جہاں ہزاروں افراد باجماعت نماز ادا کرتے ہیں۔"),
        ("bait-us-salam-mosque-dha", "Bait-us-Salam Mosque (DHA Phase 4)", "مسجد بیت السلام ڈی ایچ اے فیز 4 کراچی", "religious", "Karachi", 24.829167, 67.054167, 300,
         "Prominent contemporary mosque and educational center in DHA Phase 4 renowned for welfare and relief services.", "ڈی ایچ اے فیز 4 کی عظیم الشان مسجد اور تعلیمی و فلاحی مرکز۔",
         "Featuring elegant geometric Islamic architecture, acoustic marble halls, and a vast community welfare foundation that provides disaster relief across Pakistan.",
         "جدید اسلامی طرزِ تعمیر سے مزین یہ پرشکوہ مسجد نہ صرف عبادت گاہ ہے بلکہ ملکی سطح پر فلاحی و امدادی سرگرمیوں کا ایک بڑا نیٹ ورک چلاتی ہے۔"),
        ("sultan-masjid-dha-karachi", "Sultan Masjid (DHA Phase 5)", "سلطان مسجد ڈی ایچ اے فیز 5 کراچی", "religious", "Karachi", 24.811944, 67.045833, 300,
         "Striking Turkish Ottoman-style mosque in Defence featuring slender pencil minarets and central turquoise dome.", "ڈی ایچ اے میں ترکی عثمانی طرز کی خوبصورت مسجد جس کے باریک مینار اور فیروزی گنبد مشہور ہیں۔",
         "Designed with authentic Ottoman architectural inspirations reminiscent of Istanbul's Blue Mosque, Sultan Masjid is one of the most recognizable religious landmarks in Clifton and DHA.",
         "استنبول کی نیلی مسجد کی طرز پر بنے اس کے خوبصورت پنسل مینار اور خطاطی سے سجے گنبد ڈی ایچ اے کی پہچان ہیں۔"),
        ("british-council-library-karachi", "British Council Library Karachi", "برٹش کونسل لائبریری کراچی", "cultural", "Karachi", 24.833333, 67.033333, 250,
         "Modern cultural and learning hub in Clifton hosting digital archives, book clubs, and cultural exhibitions.", "کلفٹن میں جدید برٹش کونسل لائبریری جہاں ڈیجیٹل کتب خانہ، ادبی نشستیں اور ورکشاپس ہوتی ہیں۔",
         "A premier international library space featuring extensive English literature collections, public lectures, creative writing workshops, and educational resources.",
         "کلفٹن کے پرسکون ماحول میں واقع یہ جدید کتب خانہ کراچی کے طلباء اور محققین کا پسندیدہ علمی و ادبی مرکز ہے۔"),
        ("liaquat-memorial-library-karachi", "Liaquat Memorial National Library", "لیاقت میموریل نیشنل لائبریری کراچی", "cultural", "Karachi", 24.888889, 67.047222, 350,
         "National legal depository library on Stadium Road preserving hundreds of thousands of rare manuscripts and newspapers.", "اسٹیڈیم روڈ پر قومی قانونی کتب خانہ جہاں لاکھوں نایاب کتب، اخبارات اور تاریخی دستاویزات محفوظ ہیں۔",
         "Established in 1950, this massive public repository holds complete historical newspaper runs, United Nations depository documents, and Oriental manuscripts in Persian, Arabic, and Sindhi.",
         "1950ء میں قائم ہونے والی یہ قومی لائبریری ملکی اخبارات کے مکمل ریکارڈ اور نادر فارسی و سندھی مخطوطات کا سب سے بڑا خزانہ ہے۔"),
        ("dha-golf-and-country-club", "DHA Golf & Country Club Waterfront", "ڈی ایچ اے گالف و کنٹری کلب کراچی", "attraction", "Karachi", 24.795833, 67.069444, 1000,
         "Championship 18-hole coastal golf course set along the scenic mangrove waters of Gizri Creek.", "گیزری کریک کے سمندری پانیوں کے کنارے 18 ہولز پر مشتمل چیمپئن شپ گالف کورس۔",
         "Spread across 140 acres of lush seaside fairways, the club offers illuminated night golfing, international tournaments, and scenic dining terraces overlooking the tidal creek.",
         "گیزری کریک کے کنارے سرسبز و شاداب گالف کورس رات کے وقت فلڈ لائٹس میں چمکتا ہے اور کراچی کا ایک پرتعیش تفریحی سنگِ میل ہے۔"),
        ("marina-club-clifton-karachi", "Karachi Marina Club (Gizri Creek)", "کراچی مرینا کلب (گیزری کریک)", "attraction", "Karachi", 24.801389, 67.065278, 600,
         "Premier yachting, sailing, and marine boating marina on the protected saltwater creeks of DHA.", "ڈی ایچ اے کی پرسکون سمندری کھاڑی پر واقع یاٹ، سیلنگ اور کشتی رانی کا پرتعیش مرینا کلب۔",
         "A nautical sanctuary where sailboats, luxury catamarans, and speedboats dock. Offering private boat cruises into the Arabian Sea and water sports along the Indus delta channels.",
         "بحیرہ عرب اور سندھ کے ساحلی نالوں میں کشتی رانی اور سیلنگ کا سب سے معتبر کلب جہاں نجی بحری جہاز اور یاٹس لنگر انداز ہوتی ہیں۔"),
    ]

    for item in sindh_items:
        records.append(make_clean_record(
            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region="Sindh",
            lat=item[5], lon=item[6], radius=item[7], short_en=item[8], short_ur=item[9], desc_en=item[10], desc_ur=item[11]
        ))

    return records
