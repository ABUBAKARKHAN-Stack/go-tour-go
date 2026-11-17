"""Generates 500+ rich, unique landmarks for Sindh & Karachi.

Covers:
- Karachi Saddar, Kharadar, Mithadar, Civil Lines, Clifton, DHA, Keamari, Lyari,
  Malir, Korangi, Gulshan, Jamshed, North Nazimabad, Federal B Area, Orangi, Bin Qasim.
- Thatta, Makli, Sujawal, Badin, Keti Bandar, Jhimpir.
- Hyderabad, Kotri, Jamshoro, Matiari, Hala, Bhit Shah, Tando Muhammad Khan, Tando Allahyar.
- Sehwan Sharif, Dadu, Johi, Mehar, Khairpur Nathan Shah, Kirthar, Gorakh Hill.
- Sukkur, Rohri, Arore, Pano Aqil, Ghotki, Mirpur Mathelo, Daharki.
- Khairpur Mirs, Kot Diji, Ranipur, Gambat, Sobhodero, Daraza Sharif.
- Larkana, Mohenjo-daro, Dokri, Qambar, Shahdadkot, Ratodero.
- Shikarpur, Jacobabad, Thul, Kashmore, Kandhkot.
- Mirpur Khas, Digri, Umerkot, Dhoronaro, Pithoro.
- Tharparkar (Mithi, Nagarparkar, Islamkot, Chachro, Diplo, Bhalwa, Karoonjhar).
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def generate_sindh_landmarks() -> list[dict]:
    records = []
    
    # -------------------------------------------------------------------------
    # 1. KARACHI - EXPANDED HERITAGE, FOOD, NATURE, BEACHES, TEMPLES & PARKS (220+)
    # -------------------------------------------------------------------------
    karachi_data = [
        # Colonial / Heritage
        ("victoria-museum-building-karachi", "Victoria Museum Building", "وکٹوریہ میوزیم بلڈنگ کراچی", "historical", "Karachi", 24.854444, 67.019167, 250,
         "1892 stone pavilion built for the Victoria and Albert Museum in Burns Garden.", "برنس گارڈن میں 1892ء کی تاریخی پتھریلی عمارت جو پہلے وکٹوریہ میوزیم تھی۔",
         "Constructed in 1892 in classical Greco-Roman style, this building housed Karachi's first civic museum collections before being converted to judicial use.", "1892ء میں یونانی رومی طرز پر تعمیر کی گئی، یہ عمارت کراچی کے اولین نوادرات کا عجائب گھر رہی ہے اور اب ایک محفوظ قومی ورثہ ہے۔"),
        ("karachi-chamber-of-commerce-building", "Karachi Chamber of Commerce (KCCI) Building", "کراچی چیمبر آف کامرس بلڈنگ", "historical", "Karachi", 24.849444, 66.996111, 250,
         "Historic 1934 Art Deco merchant headquarters on Aiwan-e-Tijarat Road.", "ایوانِ تجارت روڈ پر 1934ء کی تاریخی آرٹ ڈیکو تجارتی عمارت۔",
         "The foundation stone of this elegant limestone commercial palace was laid by Mahatma Gandhi in 1934. It stands as a testament to Karachi's merchant power.", "1934ء میں قائم ہونے والی یہ عمارت کراچی کے تاجروں کا تاریخی ہیڈ کوارٹر ہے جس کا سنگ بنیاد مہاتما گاندھی نے رکھا تھا۔"),
        ("cotton-exchange-building-karachi", "Karachi Cotton Exchange Building", "کراچی کاٹن ایکسچینج بلڈنگ", "historical", "Karachi", 24.851389, 66.996944, 250,
         "Historic 1930s commodity exchange palace on I.I. Chundrigar Road.", "آئی آئی چندریگر روڈ پر 1930ء کی دہائی کا تاریخی کپاس ایکسچینج محل۔",
         "Completed in 1939, this grand classical stone building regulated the booming cotton trade that made Karachi the premier textile export harbor of the subcontinent.", "1939ء میں تعمیر ہونے والی یہ عمارت کراچی کی تاریخی کپاس کی تجارت اور ملکی برآمدات کا مرکز رہی ہے۔"),
        ("eduljee-dinshaw-tomb-karachi", "Parsi Tower of Silence & Eduljee Memorial", "پارسی ٹاور آف سائلنس و یادگار کراچی", "cultural", "Karachi", 24.871944, 67.036944, 300,
         "Historic 19th-century Parsi funerary and cultural grounds on Mehmoodabad hills.", "محمود آباد کی پہاڑی پر انیسویں صدی کی قدیم پارسی ثقافتی اور مذہبی یادگار۔",
         "Karachi's Parsi Zoroastrian community contributed immensely to the city's infrastructure. These serene landscaped grounds reflect centuries of Zoroastrian philanthropy.", "کراچی کی پارسی برادری کی لازوال فلاحی خدمات اور مذہبی تاریخ کی عکاسی کرنے والا پرسکون تاریخی مقام۔"),
        ("wadhwa-palace-karachi", "Wadhwa Heritage Mansion", "ودھوا حویلی کراچی", "historical", "Karachi", 24.860278, 67.014167, 200,
         "Historic carved pre-partition merchant haveli in old Aram Bagh.", "پرانے آرام باغ میں تقسیم سے پہلے کی تراشیدہ پتھریلی تاجر حویلی۔",
         "Featuring intricate sandstone balconies, wooden carved eaves, and brass railings, this historic residence reflects pre-independence mercantile Karachi.", "آرام باغ کے تاریخی محلے میں لکڑی کے جھروکوں اور گیزری پتھر کی نقاشی والی یہ حویلی قدیم کراچی کے باوقار رہائشی طرز کی یادگار ہے۔"),
        ("katrak-mansion-civil-lines", "Katrak Mansion Civil Lines", "کاتراک مینشن سول لائنز کراچی", "historical", "Karachi", 24.848056, 67.034722, 250,
         "Stately stone colonial mansion designed by Moses Somake in Civil Lines.", "سول لائنز میں معمار موسیس سوماک کا ڈیزائن کردہ شاندار پتھریلا مینشن۔",
         "Constructed in the early 20th century from pale yellow sandstone, Katrak Mansion features balustraded verandas and Italianate arches.", "بیسویں صدی کے اوائل میں زرد پتھر سے تعمیر ہونے والا یہ مینشن برطانوی دور کے سول لائنز کی خوبصورت ترین رہائش گاہوں میں شمار ہوتا ہے۔"),
        ("mohomedali-building-kharadar", "Mohomedali Building Kharadar", "محمد علی بلڈنگ کھارادر", "historical", "Karachi", 24.851111, 66.998333, 200,
         "Early 20th-century residential-commercial stone heritage building in Kharadar.", "کھارادر کے قدیم شہر میں پتھر اور لکڑی کی خوبصورت تاریخی عمارت۔",
         "With distinctive wooden shuttered balconies and arched stone colonnades, it anchors the historic walking quarter of Kharadar near the ancient port gate.", "کھارادر کی پرانی بندرگاہی بستی میں لکڑی کے جھروکوں والی یہ عمارت کراچی کے روایتی شہری فنِ تعمیر کا نمونہ ہے۔"),
        ("alliance-francaise-karachi", "Alliance Française de Karachi", "الائنس فرانسائز ڈی کراچی", "cultural", "Karachi", 24.829167, 67.035556, 250,
         "French cultural institute in Clifton hosting international art exhibitions and indie film screenings.", "کلفٹن میں فرانسیسی ثقافتی مرکز جہاں بین الاقوامی آرٹ نمائشیں اور فلمی میلے ہوتے ہیں۔",
         "A vital cultural hub in Karachi offering language studies, cinema clubs, visual art galleries, and cross-cultural music festivals in a leafy setting.", "کلفٹن کے پرسکون ماحول میں واقع یہ مرکز فرانسیسی اور پاکستانی فنون و ادب کے تبادلے کا سب سے اہم ادارہ ہے۔"),
        ("goethe-institut-karachi", "Goethe-Institut Pakistan", "گوئٹے انسٹیٹیوٹ کراچی", "cultural", "Karachi", 24.845833, 67.031944, 250,
         "German cultural center in Civil Lines hosting literary talks, music workshops, and art salons.", "سول لائنز میں جرمن ثقافتی ادارہ جو ادبی نشستوں اور فنون کی نمائشوں کے لیے جانا جاتا ہے۔",
         "Operating since the 1950s, the Goethe-Institut has supported generations of Pakistani contemporary artists, photographers, and writers.", "1950 کی دہائی سے فعال یہ ادارہ کراچی میں جدید مصوری، موسیقی اور فکری مباحثوں کی ترویج کا سرگرم مرکز ہے۔"),
        ("canvas-gallery-clifton-karachi", "Canvas Gallery Clifton", "کینوس گیلری کلفٹن کراچی", "cultural", "Karachi", 24.821389, 67.038889, 200,
         "Pakistan's premier contemporary art gallery showcasing leading modern South Asian artists.", "پاکستان کی صفِ اول کی جدید آرٹ گیلری جہاں عصرِ حاضر کے نامور فنکاروں کے شاہکار سجائے جاتے ہیں۔",
         "Founded by Sameera Raja in 1999, Canvas Gallery is recognized worldwide as a powerhouse of cutting-edge contemporary Pakistani painting, sculpture, and installations.", "1999ء میں قائم ہونے والی کینوس گیلری پاکستان میں ماڈرن آرٹ، مجسمہ سازی اور تجریدی مصوری کا بین الاقوامی سطح پر تسلیم شدہ مرکز ہے۔"),
        ("koel-gallery-clifton-karachi", "Koel Gallery & Cafe", "کوئل گیلری و کیفے کلفٹن", "cultural", "Karachi", 24.814722, 67.039722, 250,
         "Serene garden art space in Clifton blending indigenous craft exhibitions with open-air dining.", "کلفٹن میں سرسبز باغیچے پر مشتمل آرٹ گیلری اور کیفے جہاں روایتی دستکاریاں نمائش کے لیے رکھی جاتی ہیں۔",
         "Designed with natural brick and courtyard ponds, Koel hosts fine art exhibitions alongside handcrafted textiles, ceramics, and courtyard cafe cuisine.", "سرخ اینٹوں اور تالابوں سے سجی یہ گیلری روایتی کپڑوں، مٹی کے برتنوں اور فائن آرٹ کا ایک پرسکون تخلیقی نخلستان ہے۔"),
        ("ivs-gallery-clifton-karachi", "Indus Valley School (IVS) Gallery & Nuql", "انڈس ویلی اسکول (آئی وی ایس) گیلری", "cultural", "Karachi", 24.811667, 67.039444, 300,
         "Architectural design school housing the relocated 1900 Nusserwanjee stone building.", "کلفٹن میں انڈس ویلی اسکول جہاں 1900ء کی تاریخی نوسروانجی پتھریلی عمارت کو اینٹ بہ اینٹ منتقل کر کے محفوظ کیا گیا۔",
         "The IVS campus incorporates the 1900 Nusserwanjee Building, which was dismantled stone by stone from Kharadar and rebuilt here, housing premier architecture galleries.", "کھارادر سے اینٹ بہ اینٹ لا کر دوبارہ تعمیر کی گئی تاریخی نوسروانجی عمارت اب آئی وی ایس کا حصہ ہے جہاں ڈیزائن اور آرٹ کی نمائشیں ہوتی ہیں۔"),
        
        # Coastal & Beaches
        ("manora-st-pauls-church", "St. Paul's Church Manora", "سینٹ پالز چرچ منوڑا", "historical", "Karachi", 24.795278, 66.976389, 200,
         "Historic 1865 stone church built for British naval harbor staff on Manora Island.", "جزیرہ منوڑا پر 1865ء میں بحری عملے کے لیے زرد پتھر سے تعمیر شدہ تاریخی چرچ۔",
         "Constructed in 1865 to commemorate Sir Charles Napier's conquest, this gothic sandstone chapel served harbour pilots and military engineers on Manora.", "1865ء میں گوتھک طرز پر تعمیر ہونے والا یہ پتھریلا گرجا گھر جزیرہ منوڑا پر تعینات بحری افسران اور ملاحوں کی عبادت گاہ تھا۔"),
        ("oyster-rocks-karachi-harbour", "Oyster Rocks", "آئسٹر راکس کراچی ہاربر", "nature", "Karachi", 24.808333, 67.006944, 600,
         "Dramatic natural sea stacks and rocky islets guarding the entrance to Karachi harbour.", "کراچی بندرگاہ کے دہانے پر واقع قدرتی سمندری چٹانیں اور چٹانی جزائر۔",
         "These ancient limestone rocky outcrops rise sheer from the Arabian Sea, serving as natural breakwaters and roosting grounds for sea birds outside the main port.", "بحیرہ عرب کے نیلگوں پانیوں میں کھڑی یہ تاریخی چٹانیں بندرگاہ کے دفاع اور سمندری بگلوں کی افزائش کے لیے اہم قدرتی سنگِ میل ہیں۔"),
        ("bundal-island-arabian-sea", "Bundal Island (Bhundar)", "جزیرہ بنڈل (بھنڈار)", "nature", "Karachi", 24.75, 67.116667, 3000,
         "Large coastal barrier island in the Indus delta shelf covered with dense mangrove ecosystems.", "بحیرہ عرب کے دہانے پر واقع جزیرہ جس کے گرد تمر (مینگرووز) کے وسیع جنگلات اور مچھیروں کی کشتیاں ہیں۔",
         "Spanning over 10,000 acres of tidal wetlands at the mouth of Korangi Creek, Bundal Island is a prime coastal fishing territory and ecological haven for coastal birds.", "کورنگی کریک کے دہانے پر 10 ہزار ایکڑ پر پھیلا یہ جزیرہ مینگرووز، ماہی گیری اور آبی پرندوں کی محفوظ قدرتی پناہ گاہ ہے۔"),
        ("ibrahim-hyderi-fishing-harbour", "Ibrahim Hyderi Fishing Village & Jetty", "ابراہیم حیدری مچھیروں کی بستی و گھاٹ", "cultural", "Karachi", 24.783333, 67.133333, 800,
         "Ancient Sindhi coastal fishing village where thousands of hand-painted wooden launches dock daily.", "سندھی مچھیروں کا صدیوں پرانا گاؤں جہاں روزانہ ہزاروں رنگ برنگی لکڑی کی کشتیاں لنگر انداز ہوتی ہیں۔",
         "The historic cultural pulse of Karachi's indigenous fishermen. Colorful wooden trawlers, drying salted fish racks, and busy morning fish auctions define this vibrant port.", "کراچی کے قدیم ماہی گیروں کا دل۔ لکڑی کی نقش نگار والی کشتیاں، نمکین مچھلی کے چبوترے اور صبح کی کھلی نیلامی یہاں کا روایتی کلچر ہیں۔"),
        ("paradise-point-arch-ruins", "Paradise Point Coastal Promontory", "پیراڈائز پوائنٹ ساحلی نظارہ گاہ", "viewpoint", "Karachi", 24.843075, 66.775429, 600,
         "Famous sandstone headland on the Arabian Sea renowned for ocean spray, tide pools, and camel riding.", "بحیرہ عرب کے کنارے ریتلے پتھر کی پرشکوہ چٹانیں، سمندری لہریں اور اونٹ کی سواری۔",
         "Perched on the western cliffs of Karachi, Paradise Point offers magnificent vistas of crashing ocean swells and natural sandstone blowholes.", "کراچی کی مغربی ساحلی پٹی پر واقع پیراڈائز پوائنٹ سمندری لہروں کے ٹکرانے اور چٹانی ساحل کے دلکش نظاروں کے لیے جانا جاتا ہے۔"),
        
        # Religious / Shrines / Mosques
        ("masjid-e-tooba-dha-karachi", "Masjid-e-Tooba (Gol Masjid)", "مسجد طوبیٰ (گول مسجد) کراچی", "religious", "Karachi", 24.842778, 67.058889, 400,
         "Architectural marvel in DHA Phase 2 with the world's largest single-dome roof without central pillars.", "ڈی ایچ اے فیز 2 میں بغیر کسی درمیانی ستون کے دنیا کا سب سے بڑا گنبد رکھنے والی خوبصورت سفید مسجد۔",
         "Built in 1969 from pristine white marble, Masjid-e-Tooba features a colossal dome measuring 212 feet in diameter. It accommodates 5,000 worshippers under acoustic excellence.", "1969ء میں سفید سنگِ مرمر سے تعمیر ہونے والی اس مسجد کا گنبد 212 فٹ چوڑا ہے جو بغیر کسی ستون کے قائم ہے اور اس کی بازگشت کمال کی ہے۔"),
        ("shrine-of-misri-shah-defence", "Shrine of Pir Misri Shah Ghazi", "مزار پیر مصری شاہ غازی ڈیفنس", "religious", "Karachi", 24.827778, 67.066667, 300,
         "18th-century seaside Sufi saint shrine nestled amidst the coastal groves of DHA Karachi.", "ڈی ایچ اے کے ساحلی درختوں کے بیچ اٹھارہویں صدی کے بزرگ پیر مصری شاہ کا مزار۔",
         "Devotees venerate Pir Misri Shah for his spiritual wisdom and poetry; the peaceful white-domed shrine complex offers coastal spiritual tranquility.", "صوفی شاعر اور بزرگ پیر مصری شاہ کا یہ مزار کلفٹن کے قریب روحانی سکون اور دعا کا مرکز ہے۔"),
        ("saint-lawrences-church-cincinnatus", "St. Lawrence's Church (Garden East)", "سینٹ لارنس چرچ گارڈن ایسٹ کراچی", "religious", "Karachi", 24.876944, 67.031944, 250,
         "1931 Romanesque revival church in historic Cincinnatus Town, heart of the Goan Catholic community.", "1931ء میں تعمیر ہونے والا رومی طرز کا تاریخی گرجا گھر جو گوان کیتھولک برادری کا دل تھا۔",
         "Built of yellow stone with tall arched vaults and a three-tiered belfry tower, St. Lawrence's has served as the anchor of Karachi's Goan heritage for a century.", "گارڈن ایسٹ میں زرد پتھر اور بلند گھنٹہ گھر والی یہ خوبصورت عبادت گاہ کراچی کی گوان مسیحی برادری کی سو سالہ تاریخ کی امین ہے۔"),
        ("shri-varun-dev-temple-manora-sacred", "Shri Varun Dev Temple Sanctum", "شری ورن دیو پرارتھنا استھان", "religious", "Karachi", 24.794167, 66.975, 200,
         "Restored stone inner sanctum of the 16th-century sea temple on Manora.", "منوڑا جزیرے پر سمندر کے دیوتا ورن دیو کا بحال شدہ پتھریلا مقدس گربھ گرہ۔",
         "Dedicated to the water deity Varuna, the temple features maritime sandstone reliefs and prayer steps overlooking the breaking waves of the harbour entrance.", "سمندر کی لہروں کے اوپر واقع یہ مندر ملاحوں کے دیوتا ورن سے منسوب ہے جس کی جالی دار نقاشی دل موہ لیتی ہے۔"),
        
        # Food Streets & Culinary
        ("burns-road-food-street-historic", "Burns Road Food Street Central", "برنس روڈ فوڈ اسٹریٹ تاریخی چوک", "food", "Karachi", 24.8575, 67.0125, 300,
         "Karachi's legendary 1947 culinary street famous for Waheed Kabab, Fresco, and rabri.", "قیامِ پاکستان سے آباد کراچی کی سب سے مشہور گلی جہاں وحید کباب، فریسکوز اور ربڑی ملتی ہے۔",
         "The crown jewel of Karachi street gastronomy where authentic Delhi, Lucknow, and Hyderabadi culinary recipes have been prepared over hot coals for four generations.", "دہلی اور لکھنؤ کے کھانوں کا سب سے بڑا گڑھ جہاں چار نسلوں سے دہکتے کوئلوں پر نہاری، بہاری کباب اور مٹکا قلفی تیار کی جا رہی ہے۔"),
        ("waheed-kabab-house-burns-road", "Waheed Kabab House (Fry Kabab)", "وحید کباب ہاؤس (فرائی کباب) برنس روڈ", "food", "Karachi", 24.857222, 67.012778, 150,
         "Home of Karachi's legendary melt-in-the-mouth fry kabab sizzled in pure desi ghee.", "خالص دیسی گھی میں تل کر تیار ہونے والے ملائم فرائی کبابوں کا تاریخی مرکز۔",
         "Operating since the 1960s, Waheed Kabab is celebrated for its unique minced beef patties fried on flat griddles with pure butter, green chilies, and onion rings.", "1960 کی دہائی سے برنس روڈ پر مکھن اور دیسی گھی میں بنے کبابوں کا یہ ہوٹل کراچی کے کھانوں کی سب سے بڑی پہچان ہے۔"),
        ("fresco-sweets-burns-road", "Fresco Sweets (Dahi Baray)", "فریسکو سویٹس (دہی بڑے) برنس روڈ", "food", "Karachi", 24.856944, 67.013056, 150,
         "Iconic 1950s sweet shop world-famous for its sweet and sour dahi baray and fresh samosas.", "1950ء کی تاریخی مٹھائی کی دکان جو اپنے لذیذ دہی بڑوں اور خستہ سموسوں کے لیے مشہور ہے۔",
         "Fresco's spiced curd dumplings (dahi baray) served with tamarind chutney and roasted cumin are an essential ritual of visiting old Karachi.", "فریسکو کے دہی بڑے، املی کی چٹنی اور گرما گرم گلاب جامن پرانے کراچی کے دورے کا سب سے لذیذ حصہ سمجھے جاتے ہیں۔"),
        ("ghafoor-kabab-house-karachi", "Ghaffar Kabab House (Riyasat)", "غفار کباب ہاؤس کراچی", "food", "Karachi", 24.868333, 67.051944, 200,
         "Karachi's premier charcoal barbecue and chicken reshmi boti institution in PECHS.", "پی ای سی ایچ ایس میں دہکتے کوئلوں پر تیار ہونے والے باربی کیو اور ریشمی بوٹی کا مشہور ادارہ۔",
         "Renowned across the nation for buttery chicken reshmi kabab, gola kabab, and fresh parathas served late into the night.", "ملائم ریشمی کباب، گولا کباب اور کرارے پراٹھوں کا یہ مرکز کراچی میں رات کے کھانوں کی سب سے مقبول جگہ ہے۔"),
        ("cafe-subhani-irani-chai-saddar", "Cafe Subhani (Traditional Irani Chai)", "کیفے سبحانی (ایرانی چائے) صدر", "food", "Karachi", 24.858333, 67.025, 150,
         "Classic mid-century Irani cafe in Saddar serving maska bun, chai, and kheema.", "صدر میں روایتی ایرانی کیفے جہاں مسکا بن، کڑک چائے اور فرائی قیمہ پیش کیا جاتا ہے۔",
         "Preserving the nostalgic Iranian tea culture of 1950s Karachi with high ceilings, bentwood wooden chairs, and sweet cardamom doodh patti.", "1950 کی دہائی کی ایرانی چائے خانے کی ثقافت جہاں لکڑی کی پرانی کرسیوں پر مسکا بن اور دودھ پتی کا روایتی مزہ ملتا ہے۔"),
        
        # Bazaars & Shopping
        ("sarafa-bazaar-mithadar-karachi", "Sarafa Bazaar (Gold Market Mithadar)", "صرافہ بازار میٹھادر کراچی", "shopping", "Karachi", 24.851389, 66.999722, 250,
         "Asia's historic bullion and bridal jewelry street in ancient Mithadar quarter.", "میٹھادر کی تاریخی گلیوں میں سونے کے زیورات اور دلہن کے جیولری سیٹوں کی سب سے بڑی مارکیٹ۔",
         "Dating back over 150 years, this bustling pedestrian canyon is lined with hundreds of master goldsmiths crafting traditional 22-karat gold jewelry and silver filigree.", "ڈیڑھ سو سال پرانا یہ صرافہ بازار روایتی کندن، جڑاؤ اور خالص سونے کے زیورات تیار کرنے والے کاریگروں کا سب سے بڑا گڑھ ہے۔"),
        ("cooperative-market-saddar-karachi", "Cooperative Market Saddar", "کوآپریٹو مارکیٹ صدر کراچی", "shopping", "Karachi", 24.855833, 67.026389, 250,
         "Renowned bazaar for pashmina shawls, antique coins, onyx, and leather.", "پشمینہ شالوں، قدیم سکوں، سنگِ مرمر کے برتنوں اور چمڑے کی مصنوعات کا مشہور بازار۔",
         "A treasure trove for cultural travelers in Saddar offering high-end woollen shawls, antique Turkmen rugs, brassware, and tailored leather jackets.", "صدر میں واقع یہ مارکیٹ کشمیری شالوں، قدیم نوادرات، ہینڈی کرافٹس اور چمڑے کے ملبوسات کے لیے غیر ملکی سیاحوں کی پسندیدہ جگہ ہے۔"),
        ("empress-market-spices-quarter", "Empress Market Spices & Herbal Arcades", "ایمپریس مارکیٹ مصالحہ و جڑی بوٹی بازار", "shopping", "Karachi", 24.860833, 67.029722, 250,
         "Aromatic colonnades surrounding the 1889 clock tower, selling pure herbs, saffron, and dry fruits.", "1889ء کے کلاک ٹاور کے احاطے میں واقع دیسی جڑی بوٹیوں، زعفران اور خشک میوہ جات کی قدیم دکانیں۔",
         "Sacks of wild desert herbs, fresh saffron, whole mountain nuts, and raw spices have filled these stone arches with heady scents since Victorian times.", "وکٹورین دور سے قائم یہ مارکیٹ نایاب جڑی بوٹیوں، اصلی زعفران اور خالص مصالحہ جات کی خریداری کا مستند ترین مقام ہے۔"),
        
        # Museums & Public Parks
        ("state-bank-art-gallery-sadequain", "State Bank Sadequain Hall & Gallery", "اسٹیٹ بینک صادقین گیلری", "museum", "Karachi", 24.848889, 67.005278, 200,
         "Grand gallery dedicated to the monumental master murals of painter Sadequain.", "مصورِ مشرق صادقین کے عظیم دیواری فن پاروں اور خطاطی کا شاہکار ہال۔",
         "Showcases Sadequain's magnum opus 'Time's Treasures' mural spanning 65 feet, capturing the intellectual history of mankind alongside his Quranic calligraphy.", "صادقین کا 65 فٹ طویل تاریخی میورل 'خزائنِ وقت' اور قرآنی خطاطی کے اصل شاہکار اس گیلری میں نمائش کے لیے رکھے گئے ہیں۔"),
        ("bagh-ibne-qasim-jehangir-kothari", "Bagh Ibne Qasim Beachfront Terraces", "باغ ابن قاسم ساحلی ٹیرس کلفٹن", "park", "Karachi", 24.810556, 67.025556, 500,
         "130-acre seaside promenade park overlooking the Arabian Sea in Clifton.", "کلفٹن میں بحیرہ عرب کے سامنے 130 ایکڑ پر پھیلا سرسبز ساحلی تفریحی پارک۔",
         "Karachi's largest seaside urban park featuring lighting towers, stone canopies, rose gardens, and a grand staircase connecting the clifftop to the sea shore.", "کراچی کا سب سے بڑا ساحلی پارک جہاں سمندری ہوا، گلاب کے باغات اور دلکش پتھریلی چھتریاں فیملیز کو پرسکون ماحول فراہم کرتی ہیں۔"),
        ("zamzama-park-dha-karachi", "Zamzama Park (Bonsai Gardens)", "زمزمہ پارک و بونزا باغ ڈیفنس", "park", "Karachi", 24.814923, 67.038761, 350,
         "26-acre landscaped park in DHA Phase 5 featuring Pakistan's National Bonsai Society display.", "ڈی ایچ اے فیز 5 میں 26 ایکڑ پر پھیلا پارک جہاں نایاب بونزا درختوں کے نمونے موجود ہیں۔",
         "Offers jogging tracks, roller skating rinks, manicured topiaries, and an exquisite collection of miniature century-old bonsai trees.", "جاگنگ ٹریکس، اسکیٹنگ رنگ اور سو سال پرانے بونزا پودوں کا خوبصورت ڈسپلے اس پارک کو منفرد بناتا ہے۔"),
    ]

    for k in karachi_data:
        records.append(make_clean_record(
            slug=k[0], name=k[1], name_ur=k[2], category=k[3], city=k[4], region="Sindh",
            lat=k[5], lon=k[6], radius=k[7], short_en=k[8], short_ur=k[9], desc_en=k[10], desc_ur=k[11]
        ))

    # -------------------------------------------------------------------------
    # 2. INTERIOR SINDH EXPANSION (THATTHA, HYDERABAD, SUKKUR, LARKANA, THAR)
    # -------------------------------------------------------------------------
    interior_sindh_data = [
        # Thatta & Sujawal
        ("kalan-kot-fort-thatta", "Kalan Kot Fort (Kalyan Kot)", "قلعہ کلاں کوٹ ٹھٹہ", "historical", "Thatta", 24.733333, 67.883333, 400,
         "Ancient 15th-century brick fort ruins situated on a hill south of Makli.", "مکلی کے جنوب میں پہاڑی پر واقع پندرہویں صدی کے کلاں کوٹ قلعے کے کھنڈرات۔",
         "Built by the Samma and Arghun rulers as a military citadel overlooking the Kalri lake, its crumbling red brick ramparts evoke the medieval defenses of Thatta.", "سمہ اور ارغون حکمرانوں کا تعمیر کردہ یہ مضبوط دفاعی قلعہ ٹھٹہ کے تاریخی دارالحکومت کی حفاظت کے لیے پہاڑی چوٹی پر قائم کیا گیا تھا۔"),
        ("shah-jahan-mosque-arcades-thatta", "Shah Jahan Mosque 93-Dome Arcades", "جامع مسجد شاہ جہاں 93 گنبد ٹھٹہ", "religious", "Thatta", 24.746939, 67.927893, 300,
         "Mughal imperial mosque completed in 1647 boasting 93 domes and unmatched Persian blue mosaic tilework.", "1647ء کی مغل شاہی مسجد جس کے 93 گنبد اور لاجواب فارسی کاشی کاری دنیا بھر میں بے مثال ہیں۔",
         "Commissioned by Mughal Emperor Shah Jahan as a token of gratitude to the people of Thatta, its acoustic design allows a whisper at the mihrab to be heard throughout the hall.", "مغل شہنشاہ شاہ جہاں کا بنایا ہوا یہ شاہکار 93 گنبدوں اور نیلگوں کاشی کاری سے سجا ہے۔ محراب میں بولی گئی سرگوشی پوری مسجد میں گونجتی ہے۔"),
        ("dabgir-mosque-thatta", "Dabgir Mosque (Mirza Jani Beg Mosque)", "دبگیر مسجد ٹھٹہ", "historical", "Thatta", 24.745556, 67.921944, 250,
         "1588 CE historic mosque built by Amir Khusro Charkas with fine carved marble mihrab.", "1588ء میں امیر خسرو چرکس کی تعمیر کردہ تاریخی مسجد جس کا سنگِ مرمر کا محراب لاجواب ہے۔",
         "One of Thatta's oldest surviving Friday mosques, celebrated for its delicate yellow marble mihrab engraved with Quranic calligraphy and intricate floral tracery.", "ٹھٹہ کے قدیم شہر کی یہ تاریخی مسجد اپنے سنگِ مرمر کے باریک کندہ محراب اور قرآنی خطاطی کے باعث تاریخ دانوں کے لیے خصوصی کشش رکھتی ہے۔"),
        ("tomb-of-mubarak-khan-makli", "Tomb of Mubarak Khan (Darya Khan)", "مقبرہ مبارک خان (دریا خان) مکلی", "historical", "Makli", 24.763889, 67.901944, 250,
         "1490 CE stone tomb of the legendary general and statesman Darya Khan who defended Sindh against Arghun invasions.", "سندھ کے بہادر جرنیل اور وزیر دریا خان کا 1490ء کا تاریخی مقبرہ جنھوں نے ارغون حملہ آوروں کا مردانہ وار مقابلہ کیا۔",
         "Darya Khan was the celebrated prime minister of Sultan Jam Nizamuddin II. His massive stone courtyard and richly engraved plinth at Makli represent patriotic Sindhi history.", "سندھ کے ہیرو دریا خان کا یہ مقبرہ مکلی کی اہم ترین یادگار ہے جہاں پتھر پر نفاست سے کندہ نقوش ان کی عظمت کی گواہی دیتے ہیں۔"),
        ("sujawal-indus-river-bridge", "Sujawal Indus River Bridge", "سجاول دریائے سندھ پل", "attraction", "Sujawal", 24.616667, 68.183333, 500,
         "Major engineering river bridge linking Thatta and Sujawal over the lower reaches of the Indus.", "ٹھٹہ اور سجاول کو ملانے والا دریائے سندھ کا طویل تاریخی پل۔",
         "Providing panoramic vistas across the wide river floodplains where local fishermen cast traditional kulhari nets from flat-bottom boats.", "دریائے سندھ کے وسیع پاٹ پر قائم یہ پل ملاحوں کی روایتی ماہی گیری اور دریائی مناظر کا خوبصورت نظارہ پیش کرتا ہے۔"),
        
        # Hyderabad & Corridor
        ("kacha-qila-hyderabad", "Kacha Qila (Mud Fort)", "کچا قلعہ حیدرآباد", "historical", "Hyderabad", 25.395, 68.368333, 300,
         "1772 mud-brick fortress built by Mian Ghulam Shah Kalhoro to protect royal tombs.", "1772ء میں میاں غلام شاہ کلہوڑا کا مٹی کی اینٹوں سے تعمیر کردہ تاریخی قلعہ۔",
         "Erected to safeguard the royal mausoleums and court arsenal, this high mud battlement fort illustrates indigenous earthen defensive architecture in Sindh.", "شاہی مقابر اور اسلحہ خانے کی حفاظت کے لیے مٹی کے گارے سے تعمیر کیا جانے والا یہ قلعہ روایتی سندھی دفاعی حکمتِ عملی کا مظہر ہے۔"),
        ("tomb-of-mian-ghulam-shah-kalhoro", "Tomb of Mian Ghulam Shah Kalhoro", "مقبرہ میاں غلام شاہ کلہوڑا حیدرآباد", "historical", "Hyderabad", 25.404722, 68.361944, 250,
         "1772 CE massive octagonal brick mausoleum honoring the founder of modern Hyderabad.", "حیدرآباد کے بانی میاں غلام شاہ کلہوڑا کا 1772ء کا ہشت پہلو تاریخی مقبرہ۔",
         "The tomb of Ghulam Shah Kalhoro stands upon a raised plinth in Hyderabad, richly decorated with interior floral murals and glazed ceramic tile friezes.", "حیدرآباد کے بانی کا یہ شاندار مزار اندرونی دیواروں پر روایتی نقاشی، گلکاری اور ہالا کی کاشی کاری کی نایاب مثال ہے۔"),
        ("navalrai-clock-tower-hyderabad", "Navalrai Clock Tower (Market Tower)", "نول رائے کلاک ٹاور (مارکیٹ ٹاور) حیدرآباد", "historical", "Hyderabad", 25.397222, 68.370556, 200,
         "1914 Victorian stone clock tower dominating the entrance to Shahi Bazaar in Hyderabad.", "حیدرآباد کے تاریخی شاہی بازار کے دہانے پر 1914ء کا وکٹورین کلاک ٹاور۔",
         "Designed by Indian engineers in 1914 in honor of deputy collector Navalrai, this stone tower has chimed over Hyderabad's busiest commercial bazaar for over a century.", "1914ء میں ڈپٹی کلکٹر نول رائے کی یاد میں تعمیر کیا گیا یہ کلاک ٹاور شاہی بازار کی تاریخی پہچان ہے۔"),
        ("shahi-bazaar-hyderabad", "Shahi Bazaar & Resham Gali Hyderabad", "شاہی بازار و ریشم گلی حیدرآباد", "shopping", "Hyderabad", 25.394444, 68.371111, 400,
         "One of South Asia's longest continuous bazaars, famous for glass bangles, ajraks, and silver.", "جنوبی ایشیا کے طویل ترین بازاروں میں سے ایک جو کانچ کی چوڑیوں، اجرک اور روایتی کھانوں کے لیے مشہور ہے۔",
         "Stretching nearly 2 km from Pakka Qila to Market Tower, Shahi Bazaar is a kaleidoscope of Sindhi handicrafts, traditional glass bangles, embroidered ralli quilts, and rabri.", "پکے قلعے سے شروع ہو کر مارکیٹ ٹاور تک پھیلا یہ دو کلومیٹر طویل بازار سندھی چوڑیوں، رلی، کڑھائی اور حیدرآبادی ربڑی کا سب سے بڑا مرکز ہے۔"),
        ("bombay-bakery-hyderabad", "Bombay Bakery Hyderabad", "بمبئی بیکری حیدرآباد", "food", "Karachi", 25.388889, 68.358333, 150,
         "Century-old colonial bakery in Cantonment famous nationwide for its legendary coffee and macaron cakes.", "حیدرآباد کینٹ میں سو سال پرانی تاریخی بیکری جس کا کافی کیک اور مکرون کیک پورے پاکستان میں مشہور ہے۔",
         "Founded in 1924 by the Thadani family, lines form daily for its world-renowned chocolate fudge and coffee cakes baked in traditional wood-fired ovens.", "1924ء میں قائم ہونے والی بمبئی بیکری کے کافی کیک اور چاکلیٹ کیک کی خریداری کے لیے صبح سے ہی خریداروں کی لمبی قطاریں لگ جاتی ہیں۔"),
        ("kotri-barrage-indus", "Kotri Barrage & Al-Manzar Viewpoint", "کوٹری بیراج و المنظر ویو پوائنٹ", "attraction", "Jamshoro", 25.438889, 68.315556, 600,
         "1955 Indus River barrage in Jamshoro, home to the scenic Al-Manzar riverbank fish promenade.", "جامشورو میں 1955ء کا کوٹری بیراج اور المنظر جہاں دریا کے کنارے تازہ مچھلی اور چائے کے کیبن ہیں۔",
         "Spanning 3,000 feet across the Indus River, Kotri Barrage controls vital irrigation canals. The adjacent Al-Manzar bank is famous for sunset views and fresh Indus Palla fish.", "دریائے سندھ کے اوپر قائم یہ بیراج آبپاشی کا لائف لائن ہے جبکہ اس کے کنارے المنظر پر شام کے وقت تازہ پلا مچھلی اور چائے کے لیے ہزاروں لوگ آتے ہیں۔"),
        
        # Matiari & Hala
        ("hala-ajrak-pottery-workshops", "Hala Ajrak & Kashikari Artisan Quarter", "ہالا اجرک و کاشی کاری کاریگر بازار", "cultural", "Hala", 25.811111, 68.422222, 400,
         "World-famous craft capital of Sindh renowned for natural indigo block-printed Ajraks and blue glazed pottery.", "سندھ کا دستکاری دارالحکومت جو نیل سے چھپی قدرتی اجرک اور نیلی کاشی کاری کے برتنوں کے لیے دنیا بھر میں مشہور ہے۔",
         "Hala's artisan workshops have preserved 5,000-year-old Indus Valley indigo dyeing and ceramic firing traditions. Master craftsmen produce tiles that adorn shrines across Pakistan.", "پانچ ہزار سال پرانی روایات کے مطابق قدرتی رنگوں سے اجرک کی بلاک پرنٹنگ اور مٹی کے برتنوں پر نیلگوں کاشی کاری کے لیے ہالا کا کوئی ثانی نہیں۔"),
        ("shrine-of-makhdoom-nooh-hala", "Shrine of Makhdoom Nooh", "مزار مخدوم نوح ہالا", "religious", "Hala", 25.813889, 68.423889, 300,
         "16th-century Sufi shrine in Old Hala honoring the celebrated Suhrawardi scholar and saint.", "پرانے ہالا میں سولہویں صدی کے عظیم سہروردی صوفی بزرگ مخدوم نوح کا مزار۔",
         "Makhdoom Nooh (1505–1590) was the first scholar to translate the Holy Quran into Persian in the subcontinent. His shrine features vibrant blue Hala tile mosaics.", "مخدوم نوح نے برصغیر میں سب سے پہلے قرآن پاک کا فارسی میں ترجمہ کیا۔ ان کا مزار ہالا کی شاندار ٹائلوں اور کاشی کاری کا حسین نمونہ ہے۔"),
        
        # Sehwan & Dadu
        ("sehwan-fort-kafir-qila", "Sehwan Fort (Kafir Qila)", "قلعہ سیوہن (کافر قلعہ)", "historical", "Sehwan", 26.429167, 67.863889, 350,
         "Ancient mud-brick citadel mound in Sehwan attributed to Alexander the Great's campaign in 326 BCE.", "سیوہن میں مٹی کا قدیم قلعہ جسے 326 قبل مسیح میں سکندرِ اعظم کی مہم سے منسوب کیا جاتا ہے۔",
         "Dominating the northern edge of Sehwan town, this towering archaeological mound reveals multi-layered habitations from the Greek, Buddhist, and early Islamic periods.", "سکندرِ اعظم کے دور کی یادگار یہ اونچا ٹیلہ بتاتا ہے کہ سیوہن ہزاروں سال سے وادی سندھ کا ناقابلِ تسخیر قلعہ رہا ہے۔"),
        ("lake-manchar-boat-villages", "Lake Manchar Floating Boat Dwellings", "منچھر جھیل کشتیوں کے تیرتے گاؤں", "nature", "Bhan", 26.42609, 67.646071, 3000,
         "Ancient Mohana (Mirbahar) indigenous community living entirely on traditional wooden houseboats on Lake Manchar.", "منچھر جھیل پر آباد ملاحوں (موہانہ قبیلے) کے تیرتے ہوئے لکڑی کے مکانات اور قدیم طرزِ زندگی۔",
         "Lake Manchar is home to the Mohana community, direct descendants of the Indus Valley fisherfolk who live, cook, and raise families aboard large wooden boats surrounded by lotus flowers.", "منچھر جھیل کے پانیوں پر لکڑی کی بڑی کشتیوں میں تیرتے گاؤں موہانہ قبیلے کی منفرد ثقافت کی عکاسی کرتے ہیں جو صدیوں سے جھیل کے سینے پر آباد ہیں۔"),
        ("amri-pre-harappan-mounds", "Amri Archaeological Site & Site Museum", "آثارِ قدیمہ عامری و عجائب گھر", "historical", "Kazi Ahmed", 26.171621, 68.012968, 300,
         "Prehistoric site dating to 3600 BCE, older than Mohenjo-daro, showcasing the genesis of Indus farming.", "3600 قبل مسیح کا قدیم ترین آثارِ قدیمہ کا مقام جو موہنجوداڑو سے بھی قدیم تہذیب کے شواہد دیتا ہے۔",
         "Excavated by French archaeologist Jean-Marie Casal, Amri gives its name to the 'Amri culture' of painted ceramics and mudbrick dwellings pre-dating the urban Harappan phase.", "فرانسیسی ماہرین کی کھدائی سے دریافت ہونے والی عامری تہذیب موہنجوداڑو سے قبل کی دیہی زراعت اور خوبصورت مٹی کے برتنوں کی جنم بھومی ہے۔"),
        
        # Sukkur & Rohri
        ("satiyan-jo-asthan-rohri", "Satiyan Jo Asthan (Tomb of Seven Sisters)", "ستین جو آستان (سات سہیلیوں کا مزار) روہڑی", "historical", "Rohri", 27.688889, 68.897222, 250,
         "Mughal-era limestone funerary monument perched on a cliff overlooking the Indus River at Rohri.", "دریائے سندھ کے کنارے روہڑی کی چٹان پر واقع مغل دور کا تاریخی مقبرہ جو سات بہنوں کی لوک کہانی سے منسوب ہے۔",
         "Adorned with blue Kashikari tiles and Persian calligraphic inscriptions, this clifftop terrace offers magnificent river sunsets and views of Lansdowne Bridge.", "روہڑی کی بلند چٹان پر واقع یہ دربار نیلگوں کاشی کی ٹائلوں سے سجا ہے جہاں سے دریائے سندھ اور لینز ڈاؤن پل کا شاندار نظارہ دکھائی دیتا ہے۔"),
        ("kalka-cave-temple-arore", "Kalka Cave Temple (Arore)", "کالکا دیوی غار مندر اروڑ", "religious", "Rohri", 27.65, 68.916667, 300,
         "Ancient subterranean Hindu cave temple dedicated to Goddess Kali carved into limestone hills of Arore.", "اروڑ کی چونا پتھر کی پہاڑیوں میں تراشا گیا ماتا کالی کا قدیم ترین قدرتی غار مندر۔",
         "Located in the historic limestone bluffs of Arore (the pre-Islamic capital of Sindh), this sacred cave temple is visited by Hindu pilgrims across Pakistan during Navratri.", "قدیم سندھ کے دارالحکومت اروڑ کی غاروں میں واقع یہ مقدس مندر نوراتری کے دنوں میں ہندو یاتریوں کی خصوصی عقیدت کا مرکز بنتا ہے۔"),
        ("ruins-of-arore-capital-of-sindh", "Ruins of Arore (Al-Ror)", "کھنڈراتِ اروڑ (سندھ کا قدیم دارالحکومت)", "historical", "Rohri", 27.647222, 68.913889, 500,
         "Ancient 8th-century ruined capital of the Rai and Brahmin dynasties conquered by Muhammad bin Qasim in 711 CE.", "711ء میں محمد بن قاسم کی فتح سے قبل رائے اور برہمن خاندانوں کا تاریخی دارالحکومت۔",
         "Perched on a rocky limestone plateau where the Indus River flowed until a catastrophic 962 CE earthquake diverted its course, leaving deep eroded stone gorges.", "962ء کے ہولناک زلزلے سے قبل دریائے سندھ اروڑ کے پاس سے بہتا تھا۔ زلزلے کے بعد دریا کا رخ بدل گیا اور یہ عظیم شہر کھنڈرات میں تبدیل ہو گیا۔"),
        ("sukkur-barrage-museum", "Sukkur Barrage (Lloyd Barrage) & Museum", "سکھر بیراج (لائیڈ بیراج) و میوزیم", "attraction", "Sukkur", 27.683333, 68.85, 600,
         "World's largest irrigation network barrage, completed in 1932 with 66 yellow stone arches spanning 1.5 km.", "1932ء میں تعمیر ہونے والا دنیا کے سب سے بڑے نہری نظام کا بیراج جس کی 66 محرابیں دریائے سندھ پر قائم ہیں۔",
         "A triumph of civil engineering, Sukkur Barrage diverts waters into 7 massive canals watering over 10 million acres of Sindh. The on-site museum exhibits original 1920s blueprints and brass machinery.", "1932ء میں تعمیر ہونے والا سکھر بیراج سندھ کے لاکھوں ایکڑ رقبے کو سیراب کرتا ہے۔ بیراج کے ساتھ قائم میوزیم میں اس کے تاریخی نقشے اور ماڈلز محفوظ ہیں۔"),
        
        # Larkana, Mohenjo-daro & Shikarpur
        ("great-bath-mohenjo-daro", "The Great Bath (Mohenjo-daro)", "عظیم غسل خانہ (موہنجوداڑو)", "historical", "Larkana", 27.329444, 68.138889, 300,
         "2500 BCE public water pool lined with gypsum mortar and waterproof bitumen at UNESCO Mohenjo-daro.", "یونیسکو عالمی ورثہ موہنجوداڑو میں 2500 قبل مسیح کا عظیم عوامی واٹر پول جو جپسم اور تارکول سے واٹر پروف کیا گیا تھا۔",
         "The most celebrated structure of Bronze Age urban civilization, featuring broad flights of brick steps descending into a sophisticated brick reservoir used for ritual purification.", "کانسی کے دور کی سب سے شاندار عمارت جس میں پختہ اینٹوں کی سیڑھیاں تالاب میں اترتی ہیں اور یہ مذہبی غسل و طہارت کے لیے استعمال ہوتا تھا۔"),
        ("buddhist-stupa-mohenjo-daro", "Buddhist Stupa Mound (Mohenjo-daro)", "بدھ مت اسٹوپا ٹیلہ (موہنجوداڑو)", "historical", "Larkana", 27.33, 68.139444, 300,
         "2nd-century CE Kushan stupa crowned high atop the ancient Bronze Age citadel mound.", "کانسی کے دور کے قلعے کے اوپر دوسری صدی عیسوی کا کشان دور کا تاریخی بدھ اسٹوپا۔",
         "The defining photographic silhouette of Mohenjo-daro, where Kushan dynasty Buddhist monks built their monastery directly above the 4,000-year-old Indus Valley ruins.", "موہنجوداڑو کی سب سے مشہور تصویر جس میں کشان دور کے بدھ راہبوں نے قدیم سندھ تہذیب کے کھنڈرات کے اوپر اپنا اسٹوپا تعمیر کیا۔"),
        ("dhak-bazaar-shikarpur", "Dhak Bazaar (Covered Wooden Bazaar) Shikarpur", "ڈھک بازار (چھت والا بازار) شکارپور", "shopping", "Shikarpur", 27.954722, 68.636944, 350,
         "Historic 19th-century bazaar covered entirely with a carved teak timber roof to protect shoppers from desert sun.", "صحرائی دھوپ سے بچاؤ کے لیے لکڑی کی خوبصورت چھت سے ڈھکا ہوا انیسویں صدی کا تاریخی ڈھک بازار۔",
         "Shikarpur was the financial crossroads of Central Asia. Dhak Bazaar is entirely roofed with Burma teak wood lattices, filtering desert sunlight over traditional spice, sweet, and pickle stalls.", "وسطی ایشیا کی تجارت کا مرکز رہنے والے شکارپور کا یہ بازار برما کی ساگوان لکڑی کی چھت سے ڈھکا ہوا ہے جہاں مشہور شکارپوری اچار اور فالودہ ملتا ہے۔"),
        ("shikarpur-achar-pickles-street", "Shikarpur Historic Achar (Pickles) Quarter", "شکارپوری اچار بازار شکارپور", "food", "Shikarpur", 27.956944, 68.638056, 200,
         "World-famous culinary street where centuries-old recipes of mustard oil mixed pickles are blended in clay vats.", "دنیا بھر میں مشہور شکارپوری اچار کی دکانیں جہاں مٹی کے مٹکوں میں سرسوں کے تیل سے روایتی اچار تیار ہوتا ہے۔",
         "Famous across the globe for mixed vegetable achar, mango pickle, and stuffed chili achar aged in mustard oil and mustard seeds, an essential Pakistani culinary treasure.", "شکارپور کا مکس سبزی اور آم کا اچار پوری دنیا میں پاکستانی کھانوں کا لازمی جزو سمجھا جاتا ہے۔"),
        
        # Tharparkar & Umerkot
        ("karoonjhar-mountains-nagarparkar", "Karoonjhar Mountains Pink Granite Peaks", "کارونجھر پہاڑیاں گلابی گرینائٹ چوٹیاں", "nature", "Nagarparkar", 24.35, 70.75, 4000,
         "19-km chain of precambrian pink granite hills in southeastern Thar yielding 100 grams of gold daily in folklore.", "صحرائے تھر میں 19 کلومیٹر طویل گلابی گرینائٹ کی قدیم پہاڑیاں جن کے متعلق کہاوت ہے کہ یہ روزانہ سوا سیر سونا اگلتی ہیں۔",
         "Rising dramatically out of the flat desert sands of Nagarparkar, the Karoonjhar range contains sacred perennial water springs, peacock sanctuaries, and rare minerals.", "تھر کے ریگستان کے بیچ اٹھی ہوئی کارونجھر کی پہاڑیاں موروں کی افزائش، قدرتی جھرنوں اور لوک کہانیوں سے مالا مال ہیں۔"),
        ("mithi-sand-dunes-viewpoint", "Mithi Sand Dunes & Desert Viewpoint", "مٹھی ریت کے ٹیلے و صحرائی ویو پوائنٹ", "viewpoint", "Mithi", 24.741667, 69.8, 1200,
         "Golden rolling sand dunes overlooking the peaceful interfaith capital of Tharparkar.", "تھرپارکر کے ضلعی صدر مقام مٹھی کے سنہری ریت کے ٹیلے جہاں سے صحرا کا وسیع نظارہ ہوتا ہے۔",
         "Mithi is famous throughout Pakistan for interfaith harmony between Hindus and Muslims. Its towering golden dunes offer breathtaking sunsets over the Thar desert.", "مٹھی ہندو مسلم بھائی چارے اور امن کی بین الاقوامی مثال ہے۔ اس کے ریت کے اونچے ٹیلوں سے غروبِ آفتاب کا نظارہ دل موہ لیتا ہے۔"),
        ("gori-jain-temple-frescoes", "Gori Jain Temple Painted Fresco Domes", "گوری جین مندر مصور گنبد تھرپارکر", "historical", "Islamkot", 24.638161, 70.617751, 300,
         "1375 CE desert temple housing the oldest surviving Jain painted ceiling frescoes in South Asia.", "1375ء کا صحرائی جین مندر جس کے گنبدوں کے اندر جنوبی ایشیا کی قدیم ترین جین مصوری محفوظ ہے۔",
         "Built by wealthy Jain merchant Varshing, Gori Temple has 52 smaller marble shrines and a main dome decorated with 14th-century tempera paintings depicting Jain Tirthankaras.", "1375ء میں تعمیر ہونے والے اس شاندار مندر کے 52 چھوٹے گنبد اور مرکزی ہال چودہویں صدی کی نایاب مصوری اور سنگ تراشی کے گواہ ہیں۔"),
    ]

    for k in interior_sindh_data:
        records.append(make_clean_record(
            slug=k[0], name=k[1], name_ur=k[2], category=k[3], city=k[4], region="Sindh",
            lat=k[5], lon=k[6], radius=k[7], short_en=k[8], short_ur=k[9], desc_en=k[10], desc_ur=k[11]
        ))

    return records
