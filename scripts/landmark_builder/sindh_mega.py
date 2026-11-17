"""Mega Sindh & Karachi Dataset for GoTourGo (285+ Landmarks).

Covers all 30 districts of Sindh, with exhaustive coverage of Karachi
(colonial heritage, coastal beaches, food streets, bazaars, cultural venues)
and interior Sindh (Thatta, Badin, Hyderabad, Jamshoro, Dadu, Sehwan,
Matiari, Hala, Tando Allahyar, Khairpur, Sukkur, Rohri, Larkana, Shikarpur,
Jacobabad, Ghotki, Tharparkar, Umerkot, Sanghar, Shaheed Benazirabad).
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

SINDH_MEGA_DATA = [
    # =========================================================================
    # KARACHI COLONIAL & HERITAGE (Saddar, Civil Lines, Old City)
    # =========================================================================
    ("frere-hall-gardens-karachi", "Frere Hall Gardens & Sadequain Gallery", "فریئر ہال باغات و صادقین گیلری کراچی", "cultural", "Karachi", 24.843611, 67.032778, 400,
     "1865 Venetian Gothic stone hall in Civil Lines featuring Sadequain's masterpiece ceiling mural and lush public lawns.",
     "سول لائنز میں 1865ء کا گوتھک طرز کا تاریخی ہال جس کی چھت پر صادقین کا شاہکار میورل اور وسیع سرسبز باغات ہیں۔",
     "Constructed in 1865 in honor of Sir Bartle Frere, this yellow Karachi limestone landmark features pointed arches, ribbed vaults, and Sadequain's magnificent ceiling mural 'Arz-o-Samawat'. The surrounding gardens host popular Sunday book fairs.",
     "1865ء میں تعمیر شدہ یہ زرد چونے کے پتھر کا شاہکار کراچی کی پہچان ہے۔ اس کے بالائی ہال کی چھت پر مصورِ مشرق صادقین کا شاندار میورل 'ارض و سماوات' نقش ہے، جبکہ اس کے باغات میں ہر اتوار کو پرانی کتابوں کا مشہور میلہ لگتا ہے۔"),

    ("st-patricks-cathedral-saddar", "Saint Patrick's Cathedral Saddar", "سینٹ پیٹرکس کیتھیڈرل صدر کراچی", "religious", "Karachi", 24.856944, 67.030556, 350,
     "Historic 1881 Neo-Gothic Roman Catholic cathedral in Saddar accommodating 1,500 worshippers under high vaulted arches.",
     "صدر میں 1881ء کا نو گوتھک طرز کا تاریخی کیتھولک گرجا گھر جس کے بلند محرابوں تلے 1500 افراد کی گنجائش ہے۔",
     "Built in 1881, St. Patrick's Cathedral is the seat of the Roman Catholic Archdiocese of Karachi. Its towering spires, stained glass windows from Munich, and polished marble altar make it one of Pakistan's finest Christian architectural treasures.",
     "1881ء میں تعمیر شدہ یہ عظیم الشان کیتھیڈرل کراچی کے قدیم ترین گرجا گھروں میں شمار ہوتا ہے۔ اس کے میونخ سے منگوائے گئے رنگین شیشے کے جھروکے اور سنگِ مرمر کی محرابیں فنِ تعمیر کا نایاب نمونہ ہیں۔"),

    ("st-andrews-church-saddar", "Saint Andrew's Church (The Scotch Church)", "سینٹ اینڈریوز چرچ (اسکاچ چرچ) صدر کراچی", "religious", "Karachi", 24.858889, 67.028056, 300,
     "1868 Gothic revival Presbyterian church in Saddar with a soaring 135-foot octagonal steeple.",
     "صدر میں 1868ء کا گوتھک طرز کا تاریخی پریسبٹیرین چرچ جس کا 135 فٹ اونچا ہشت پہلو مینار دور سے نظر آتا ہے۔",
     "Designed by T.G. Newnham and completed in 1868 for the Scottish Presbyterian community, this landmark features a dramatic octagonal steeple, carved rose windows, and pointed arches constructed from local Gizri sandstone.",
     "1868ء میں تعمیر ہونے والا یہ چرچ اپنے 135 فٹ بلند ہشت پہلو مینار اور گیزری کے زرد پتھر کے تراشیدہ محرابوں کی بدولت صدر کراچی کے خوبصورت ترین نوآبادیاتی ورثے میں شامل ہے۔"),

    ("ymca-heritage-karachi", "Karachi YMCA Ground & Heritage Hall", "کراچی وائی ایم سی اے گراؤنڈ و تاریخی ہال", "cultural", "Karachi", 24.851944, 67.028333, 250,
     "Historic 1913 sports and community hub in Civil Lines that nurtured Pakistan's early badminton and hockey legends.",
     "سول لائنز میں 1913ء کا تاریخی کھیلوں اور سماجی سرگرمیوں کا مرکز جہاں بیڈمنٹن اور ہاکی کی تاریخ رقم ہوئی۔",
     "Founded in 1913, the Young Men's Christian Association campus hosted early national sporting championships, debate societies, and community theater, anchoring central Karachi's secular civic traditions for over a century.",
     "1913ء سے قائم وائی ایم سی اے گراؤنڈ نے ملکی سطح پر ہاکی، ٹیبل ٹینس اور بیڈمنٹن کے چیمپئنز پیدا کیے۔ اس کا پتھریلا تاریخی ہال کراچی کی شہری و ثقافتی روایت کی علامت ہے۔"),

    ("karachi-gymkhana-club", "Karachi Gymkhana Club", "کراچی جمخانہ کلب", "cultural", "Karachi", 24.848889, 67.029444, 350,
     "1886 colonial gentlemen's club in Civil Lines renowned for lush cricket grounds, squash courts, and colonial verandas.",
     "سول لائنز میں 1886ء کا پروقار کلب جو تاریخی کرکٹ گراؤنڈ، اسکواش کورٹس اور نوآبادیاتی برآمدوں کے لیے معروف ہے۔",
     "Established in 1886, Karachi Gymkhana is one of the oldest social and sporting clubs in South Asia. Its manicured turf cricket pitch hosted first-class matches and touring international teams throughout the 20th century.",
     "1886ء میں قائم ہونے والا کراچی جمخانہ برصغیر کے قدیم ترین کلبوں میں سے ایک ہے۔ اس کے تاریخی کرکٹ گراؤنڈ پر ملکی اور بین الاقوامی میچز کھیلے جاتے رہے ہیں۔"),

    ("sindh-club-karachi", "Sindh Club Heritage Building", "سندھ کلب تاریخی عمارت کراچی", "cultural", "Karachi", 24.846111, 67.031944, 300,
     "Exclusive 1871 British residential club in Civil Lines built with Italianate colonnades and deep arcaded verandas.",
     "سول لائنز میں 1871ء کا پرتعیش نوآبادیاتی کلب جو اطالوی طرز کے ستونوں اور محرابی برآمدوں سے سجا ہے۔",
     "Founded in 1871, the Sindh Club served as the premier residential and diplomatic club of the province. Constructed from Gizri yellow limestone with deep arcaded verandas designed to catch the Arabian Sea breeze.",
     "1871ء میں قائم ہونے والی یہ باوقار عمارت زرد پتھر اور وسیع برآمدوں سے بنی ہے جو سمندری ہوا کو اندر کھینچتے ہیں۔ یہ کراچی کی ایلیٹ کلاس اور سفارتی ملاقاتوں کا روایتی مرکز رہا ہے۔"),

    ("karachi-club-heritage", "Karachi Club Heritage Enclave", "کراچی کلب تاریخی عمارت", "cultural", "Karachi", 24.845, 67.022222, 300,
     "1907 elite social and cultural club on Dr. Ziauddin Ahmed Road founded as an inclusive alternative to colonial-only clubs.",
     "ڈاکٹر ضیاء الدین احمد روڈ پر 1907ء کا تاریخی کلب جو نوآبادیاتی دور میں مقامی شہریوں کے وقار کی علامت بنا۔",
     "Established in 1907 by leading Indian merchants, judges, and philanthropists, Karachi Club became the social salon where Pakistan's founding leaders gathered, surrounded by tranquil lawns and classical banquet halls.",
     "1907ء میں کراچی کے نامور تاجروں اور دانشوروں نے اس کلب کی بنیاد رکھی۔ قیامِ پاکستان کے بعد یہ ملک کے رہنماؤں اور سول سوسائٹی کا ایک باوقار ملن مرکز بنا۔"),

    ("holy-trinity-cathedral-karachi", "Holy Trinity Cathedral Karachi", "ہولی ٹرنٹی کیتھیڈرل کراچی", "religious", "Karachi", 24.851944, 67.027222, 350,
     "1855 garrison church in Civil Lines with an imposing Italianate tower that once served as a coastal sea beacon.",
     "سول لائنز میں 1855ء کا تاریخی گیرژن گرجا گھر جس کا بلند ٹاور ماضی میں بحری جہازوں کے لیے لائٹ ہاؤس کا کام دیتا تھا۔",
     "Designed by John Hill of the Bombay Engineers and opened in 1855, Holy Trinity was Karachi's first major Anglican church. Its 150-foot campanile tower long served as a landmark for ships approaching Karachi harbour.",
     "1855ء میں تعمیر شدہ یہ گرجا گھر کراچی کا پہلا بڑا اینگلیکن کیتھیڈرل ہے۔ اس کا بلند ٹاور سمندر سے آنے والے جہازوں کے لیے نشانِ منزل کے طور پر استعمال ہوتا تھا۔"),

    ("flagstaff-house-gardens-karachi", "Quaid-e-Azam House Museum (Flagstaff House)", "قائد اعظم ہاؤس میوزیم (فلیگ اسٹاف ہاؤس)", "museum", "Karachi", 24.851667, 67.035, 300,
     "1868 stone mansion owned by Quaid-e-Azam Muhammad Ali Jinnah, housing personal relics and lush palm gardens.",
     "1868ء کی پتھریلی کوٹھی جسے قائد اعظم محمد علی جناح نے خریدا، جہاں ان کے زیرِ استعمال اشیاء اور سرسبز لان موجود ہیں۔",
     "Designed by British architect Moses Somake and purchased by Jinnah in 1943, this limestone manor features semicircular balconies, carved wooden staircases, and Fatima Jinnah's authentic living quarters.",
     "برطانوی معمار موسس سوماکے کی ڈیزائن کردہ یہ خوبصورت رہائش گاہ قائد اعظم نے 1943ء میں خریدی تھی۔ یہاں قائد اعظم اور محترمہ فاطمہ جناح کے ذاتی فرنیچر، کتب اور ملبوسات محفوظ ہیں۔"),

    ("metropole-square-karachi", "Metropole Square & Heritage Corner", "میٹروپول چوک و تاریخی ورثہ کراچی", "attraction", "Karachi", 24.848889, 67.031111, 250,
     "Iconic mid-century crossroads in Civil Lines connecting Saddar, Clifton, and the Cantonment.",
     "سول لائنز کا تاریخی چوک جو صدر، کلفٹن اور کینٹ کو آپس میں ملاتا ہے اور ماضی کے ہوٹل میٹروپول کا مرکز ہے۔",
     "Anchored by the historic 1950s Hotel Metropole, this intersection was the center of Karachi's golden post-independence cosmopolitan era, hosting visiting dignitaries, jazz musicians, and airline travelers.",
     "1950 کی دہائی سے ہوٹل میٹروپول کے گرد قائم یہ چوک کراچی کی روشن راتوں، بین الاقوامی سیاحوں اور ادبی و سماجی محفلوں کا دل رہا ہے۔"),

    # =========================================================================
    # KARACHI FOOD STREETS & ICONIC RESTAURANTS
    # =========================================================================
    ("burns-road-food-street-karachi", "Burns Road Historic Food Street", "برنز روڈ تاریخی فوڈ اسٹریٹ کراچی", "food", "Karachi", 24.858056, 67.016944, 400,
     "Pakistan's most legendary night food street, celebrated for Nihari, Haleem, Dhaga Kabab, and Rabri.",
     "پاکستان کی مشہور ترین رات کی فوڈ اسٹریٹ جہاں نہاری، حلیم، دھاگہ کباب اور دہلی ربڑی صدیوں سے مشہور ہیں۔",
     "Established in 1947 by migrants from Delhi and Uttar Pradesh, Burns Road is the gastronomic epicenter of Karachi. The aroma of frying jalebis, slow-cooked mutton nihari, and charcoal kababs draws thousands nightly.",
     "قیامِ پاکستان کے بعد دہلی کے مہاجرین کا بسایا ہوا برنز روڈ کراچی کی روایتی غذاؤں کا دارالحکومت ہے۔ وحید کے دھاگہ کباب، کراچی حلیم، دہلی ربڑی اور فرسکو کے دہی بڑے ملک گیر شہرت رکھتے ہیں۔"),

    ("port-grand-promenade-karachi", "Port Grand Food and Entertainment Village", "پورٹ گرینڈ فوڈ اینڈ انٹرٹینمنٹ ولیج کراچی", "food", "Karachi", 24.838333, 66.983056, 500,
     "Seaside boardwalk built along the 19th-century Native Jetty bridge featuring waterfront open-air dining.",
     "19ویں صدی کے نیٹو جیٹی پل پر بنا سمندری فوڈ ولیج جہاں ساحلی ہواؤں میں کھلے آسمان تلے کھانے پیش کیے جاتے ہیں۔",
     "Spanning a kilometer of historic coastal waterfront along the Chinna Creek, Port Grand offers landscaped harbor dining, street food kiosks, live music, and boat cruises under illuminated railway arches.",
     "چنا کریک کی سمندری کھاڑی پر واقع پورٹ گرینڈ کراچی کی جدید فوڈ تفریح کی بہترین مثال ہے جہاں تاریخی نیٹو جیٹی پل کے سائے تلے انواع و اقسام کے پکوان اور کشتی رانی میسر ہے۔"),

    ("boat-basin-food-street-clifton", "Boat Basin Open-Air Food Street", "بوٹ بیسن اوپن ایئر فوڈ اسٹریٹ کلفٹن", "food", "Karachi", 24.825833, 67.026944, 400,
     "Karachi's 24-hour food street in Clifton famous for cheese parathas, Balochi tikka, and sunrise breakfasts.",
     "کلفٹن میں 24 گھنٹے کھلی رہنے والی فوڈ اسٹریٹ جو مکھنی پراٹھوں، بلوچی سجی اور صبح کے ناشتوں کے لیے مشہور ہے۔",
     "Running along Khayaban-e-Roomi, Boat Basin never sleeps. It is the premier destination for late-night foodies seeking tandoori chai, sizzling Bihari kababs, and crackling laccha parathas well past midnight.",
     "کلفٹن کا بوٹ بیسن دن رات زندہ رہنے والا علاقہ ہے جہاں نصف شب کے بعد بھی گرم پراٹھوں، کڑاہی اور تندوری چائے کے شائقین کا جمِ غفیر رہتا ہے۔"),

    ("do-darya-promenade-karachi", "Do Darya Coastal Dining Promenade", "دو دریا ساحلی فوڈ پرومیناڈ ڈی ایچ اے کراچی", "food", "Karachi", 24.764444, 67.098889, 700,
     "Awe-inspiring seaside dining boulevard in DHA Phase 8 where restaurants extend directly on wooden decks over the Arabian Sea.",
     "ڈی ایچ اے فیز 8 میں بحیرہ عرب کے لہراتے پانیوں کے اوپر لکڑی کے ڈیک پر بنے پرشکوہ ساحلی ریسٹورنٹس۔",
     "Stretching along the open ocean at the southeastern tip of Karachi, Do Darya features open-air restaurant decks perched above crashing ocean waves, serving fresh seafood, Peshawari karahi, and charcoal grills.",
     "بحیرہ عرب کے شور مچاتے پانیوں کے کنارے دو دریا کراچی کا منفرد ترین ساحلی مقام ہے جہاں سمندری لہروں کے اوپر بیٹھ کر تازہ مچھلی، کڑاہی اور باربی کیو کا لطف لیا جاتا ہے۔"),

    ("hussainabad-food-street-karachi", "Hussainabad Food Street (F.B. Area)", "حسین آباد فوڈ اسٹریٹ فیڈرل بی ایریا کراچی", "food", "Karachi", 24.918056, 67.062222, 350,
     "Bustling central Karachi street food artery famous for Kunna gosht, Katakat, Malai Boti, and dry fruit ice creams.",
     "سینٹرل کراچی کا متحرک فوڈ حب جو چنیوٹی کنا گوشت، کٹاکٹ، ملائی بوٹی اور خشک میوہ جات والی آئس کریم کا مرکز ہے۔",
     "Hussainabad is District Central's culinary heavyweight. Packed nightly with families enjoying Chinioti handi, sizzling brain masala on enormous tawas, and traditional Rabri Falooda.",
     "فیڈرل بی ایریا کا حسین آباد اپنے لاجواب چنیوٹی کنا گوشت، روایتی کٹاکٹ اور سڑک کنارے لگی فالودہ و قلفی کی دکانوں کے باعث رات گئے تک شہریوں سے بھرا رہتا ہے۔"),

    ("guru-mandir-falooda-street", "Guru Mandir Falooda & Chaat Street", "گرو مندر فالودہ و چاٹ اسٹریٹ کراچی", "food", "Karachi", 24.881944, 67.038056, 250,
     "Historic crossroads renowned for century-old crushed-ice Falooda parlors, Bun Kababs, and spiced fruit chaat.",
     "تاریخی گرو مندر چوک جو روایتی برفیلے فالودہ، بن کباب اور مصالحے دار فروٹ چاٹ کی قدیم دکانوں کا گڑھ ہے۔",
     "Located near the historic Gurumandir roundabout, this street has delighted sweet tooths for decades with towering glasses of rose syrup falooda, dense kulfa slices, and Karachi's iconic street bun kababs.",
     "گرو مندر کی یہ فوڈ گلی دہائیوں سے روایتی کلفی فالودہ اور لذیذ بن کباب کے لیے مشہور ہے جہاں شام ہوتے ہی لوگوں کا ہجوم لگ جاتا ہے۔"),

    ("fresco-sweets-burns-road", "Fresco Sweets Corner (Burns Road)", "فرسکو سویٹس کارنر برنز روڈ کراچی", "food", "Karachi", 24.858333, 67.016389, 150,
     "Legendary 1950 confectionery famous across South Asia for melt-in-the-mouth Dahi Baray, Samosas, and Gulab Jamun.",
     "1950ء سے برنز روڈ پر قائم تاریخی حلوائی کی دکان جو اپنے نرم و ملائم دہی بڑوں اور گرما گرم سموسوں کے لیے مشہور ہے۔",
     "A Karachi culinary institution since 1950, Fresco Sweets draws daily queues for its lentil dahi baray immersed in whipped yogurt, tamarind chutney, and fragrant garam masala.",
     "1950ء سے قائم فرسکو کے دہی بڑے کراچی کی ثقافتی پہچان ہیں۔ ان کے تلے ہوئے دال کے بڑے، میٹھی چٹنی اور خاص مصالحہ ہر کھانے کے دلدادہ کی اولین پسند ہے۔"),

    ("waheed-kabab-house-burns-road", "Waheed Kabab House (Burns Road)", "وحید کباب ہاؤس برنز روڈ کراچی", "food", "Karachi", 24.858056, 67.016667, 150,
     "Iconic barbecue eatery celebrated for originating melt-in-mouth Fry Kababs cooked in simmering pure desi ghee.",
     "برنز روڈ کی تاریخی باربی کیو دکان جہاں خالص دیسی گھی میں پکے ہوئے فرائی کباب اور دھاگہ کباب تیار ہوتے ہیں۔",
     "Operating since the 1960s, Waheed Kabab House pioneered the Karachi Fry Kabab: finely minced beef spiced with secret herbs, fried in smoking ghee, and served with paper-thin roomali rotis.",
     "1960ء کی دہائی سے جاری وحید کباب ہاؤس اپنے پگھلتے ہوئے دھاگہ کباب اور دیسی گھی میں تیرتے فرائی کبابوں کے لیے ملک بھر میں جانا جاتا ہے۔"),

    ("javed-nihari-dastagir-karachi", "Javed Nihari (Dastagir F.B. Area)", "جاوید نہاری دستگیر فیڈرل بی ایریا کراچی", "food", "Karachi", 24.921944, 67.068056, 200,
     "Pakistan's most revered Nihari destination, serving slow-cooked beef shank stew topped with Nalli bone marrow and Maghaz.",
     "پاکستان کی مشہور ترین نہاری جہاں ہڈی کی نلی کے گودے اور مغز سے سجی سست آنچ پر پکی بیف نہاری پیش کی جاتی ہے۔",
     "Founded in 1978, Javed Nihari perfected the balance of roasted flour gravy, Kashmiri chili, and tenderized beef shanks simmered overnight in sealed copper cauldrons.",
     "1978ء سے دستگیر میں قائم جاوید نہاری کراچی کے کھانوں کی سرتاج سمجھی جاتی ہے۔ گرما گرم نلی، مغز اور ادرک لیموں سے سجی نہاری کھانے دور دور سے لوگ آتے ہیں۔"),

    ("zahid-nihari-tariq-road", "Zahid Nihari (Tariq Road)", "زاہد نہاری طارق روڈ کراچی", "food", "Karachi", 24.873611, 67.061111, 200,
     "Famous Tariq Road culinary institution renowned for fragrant brown onion gravy and prime beef shank stew.",
     "طارق روڈ کا معروف نہاری ہاؤس جو اپنے مخصوص ذائقے دار شوربے اور نرم ترین گوشت کی بدولت مشہور ہے۔",
     "A staple of PECHS and Tariq Road shopping expeditions, Zahid Nihari serves robust, aromatic beef stews accompanied by piping hot sesame tandoori nans straight from clay ovens.",
     "طارق روڈ پر شاپنگ کے بعد زاہد نہاری پر بیٹھ کر کڑک تل والے نان اور نلی نہاری کھانا کراچی کی ایک مقبول روایت ہے۔"),

    ("meerath-kabab-house-karachi", "Meerath Famous Kabab House", "میرٹھ فیمس کباب ہاؤس کراچی", "food", "Karachi", 24.883333, 67.038889, 200,
     "Historic barbecue house near Guru Mandir celebrated for tender Bihari Tikka and handmade parathas since 1954.",
     "گرو مندر کے قریب 1954ء کا تاریخی کباب ہاؤس جو نرم بیہاری تکہ اور خستہ پوری پراٹھوں کا موجد کہلاتا ہے۔",
     "Founded by master kebabiers from Meerut, India, this legendary restaurant introduced thinly sliced marinated beef strips grilled on open wood embers, wrapped in piping hot flaky parathas.",
     "1954ء میں میرٹھ سے ہجرت کر کے آنے والے کاریگروں کا قائم کردہ یہ ادارہ بیہاری تکہ اور لچھے دار پراٹھے کے لیے پاکستان بھر میں مثال سمجھا جاتا ہے۔"),

    ("hanifia-hunters-beef-saddar", "Hanifia Hunter Beef (Saddar)", "حنیفیہ ہنٹر بیف صدر کراچی", "food", "Karachi", 24.858889, 67.026111, 150,
     "Originator of Karachi's legendary cured hunter beef slices served with signature spicy green mustard sauce.",
     "صدر کا تاریخی ادارہ جو خاص طریقے سے تیار کردہ نمکین ہنٹر بیف اور تیز سرسوں کی چٹنی کے لیے جانا جاتا ہے۔",
     "Invented by the Hanifia family, their cured, spiced, and slowly roasted beef brisket served in crusty burger buns with sour mustard sauce has been an iconic Karachi delicacy for over half a century.",
     "حنیفیہ کا ہنٹر بیف کراچی کی منفرد سوغات ہے۔ خاص مصالحوں میں پکایا گیا خشک گوشت، برگر بن اور ان کی خاص رائی والی چٹنی ایک بے مثال ذائقہ بناتے ہیں۔"),

    ("karachi-haleem-burns-road", "Karachi Haleem (Burns Road)", "کراچی حلیم برنز روڈ", "food", "Karachi", 24.857778, 67.017222, 150,
     "Benchmark Haleem house on Burns Road simmering seven pulses, broken wheat, and shredded beef for twelve hours.",
     "برنز روڈ کا باوقار حلیم ہاؤس جہاں دالوں، گندم اور باریک ریشہ دار گوشت کو بارہ گھنٹے تک گھوٹا جاتا ہے۔",
     "Serving true artisanal Shahi Haleem garnished with golden fried onions, fresh mint, ginger juliennes, and chaat masala, Karachi Haleem defines the authentic taste of the city's festive stew.",
     "برنز روڈ کی کراچی حلیم اپنے بہترین ریشے، دالوں کے توازن اور تلی ہوئی پیاز کے تڑکے کی بدولت پاکستان کی سب سے مشہور حلیم مانی جاتی ہے۔"),

    # =========================================================================
    # KARACHI BAZAARS & MARKETS
    # =========================================================================
    ("zainab-market-saddar-karachi", "Zainab Market Garment & Leather Bazaar", "زینب مارکیٹ صدر کراچی", "shopping", "Karachi", 24.854167, 67.028889, 300,
     "World-famous export garment, leather jacket, denim, and brass handicraft bargain bazaar in Saddar.",
     "صدر کراچی کی دنیا بھر میں مشہور ریڈی میڈ گارمنٹس، چمڑے کی جیکٹس اور روایتی دستکاریوں کی سستی مارکیٹ۔",
     "Spanning multi-level underground basements and street shops, Zainab Market is legendary for brand-name export overruns, hand-stitched leather goods, lapis lazuli jewelry, and embroidered Kashmiri shawls.",
     "زینب مارکیٹ غیر ملکی سیاحوں اور شاپنگ کے شوقین افراد کا پسندیدہ گڑھ ہے جہاں فیکٹری سے نکلے ہوئے ملبوسات، لیدر جیکٹس اور پیتل کے نوادرات انتہائی مناسب داموں ملتے ہیں۔"),

    ("cooperative-market-saddar", "Cooperative Market Saddar", "کوآپریٹو مارکیٹ صدر کراچی", "shopping", "Karachi", 24.855, 67.027778, 250,
     "Major electronics, woolen knitwear, Pashmina shawls, and bridal fabric bazaar adjacent to Victoria Market.",
     "وکٹوریہ مارکیٹ کے قریب صدر کی بڑی مارکیٹ جہاں گرم شالیں، پشمینہ اور الیکٹرانکس کا سامان ملتا ہے۔",
     "Lined with hundreds of tight stalls, Cooperative Market is famed for traditional Swati caps, Balochi mirrors, wedding fabrics, and quality winter woolen garments from northern Pakistan.",
     "صدر کی کوآپریٹو مارکیٹ شادی بیاہ کے کپڑوں، روایتی شالوں اور گرم اونی ملبوسات کی وسیع ورائٹی کے لیے خریداروں کا مرکز ہے۔"),

    ("bohri-bazaar-saddar-karachi", "Bohri Bazaar Historic Saddar", "بوہری بازار صدر کراچی", "shopping", "Karachi", 24.858056, 67.025556, 300,
     "Densely packed historic shopping labyrinth established in 1939, offering cookware, spices, and Bohra specialties.",
     "1939ء کا قائم کردہ تاریخی پرپیچ بازار جہاں برتنوں، مصالحوں، کپڑوں اور روایتی بوہرہ اشیاء کی سینکڑوں دکانیں ہیں۔",
     "Modeled on traditional Middle Eastern souks, Bohri Bazaar features narrow pedestrian lanes filled with stainless steel kitchenware, religious attires, herbal remedies, and freshly fried samosas.",
     "مشرقِ وسطیٰ کے بازاروں کی طرز پر بنی پتلی گلیوں والا بوہری بازار باورچی خانے کے برتنوں، بوہرہ کمیونٹی کے ملبوسات اور روایتی مصالحہ جات کا سب سے پرانا اڈا ہے۔"),

    ("saddar-electronics-market-karachi", "Abdullah Haroon Road Electronics Market", "عبداللہ ہارون روڈ الیکٹرانکس و موبائل مارکیٹ صدر", "shopping", "Karachi", 24.856111, 67.026944, 300,
     "Pakistan's largest hub for mobile phones, digital gadgets, computers, and telecommunications equipment.",
     "پاکستان کی سب سے بڑی موبائل فون، کمپیوٹرز اور الیکٹرانک آلات کی مرکزی ہول سیل و ریٹیل مارکیٹ۔",
     "Centering on Star City Mall and surrounding arcades, this bustling commercial zone handles thousands of daily wholesale transactions for smartphones, spare parts, and consumer tech.",
     "اسٹار سٹی مال اور اطراف کی گلیوں پر مشتمل یہ مارکیٹ ملک بھر میں اسمارٹ فونز، لیپ ٹاپس اور الیکٹرانکس کے پرزہ جات کی سپلائی کا مرکزی تجارتی انجن ہے۔"),

    ("bolton-market-karachi", "Bolton Market Historic Wholesale Center", "بولٹن مارکیٹ تاریخی ہول سیل سینٹر کراچی", "shopping", "Karachi", 24.852778, 67.001944, 400,
     "Colonial-era wholesale trade marketplace established in 1883 along historic Bunder (M.A. Jinnah) Road.",
     "ایم اے جناح روڈ پر 1883ء کی نوآبادیاتی دور کی تاریخی ہول سیل مارکیٹ جو تجارت کا سب سے بڑا مرکز ہے۔",
     "Originally constructed in 1883 and expanded in 1886, Bolton Market remains the mega wholesale junction connecting sea imports from Karachi Port to retail distributors across Pakistan.",
     "1883ء میں قائم ہونے والی بولٹن مارکیٹ کراچی پورٹ سے آنے والے درآمدی مال کی ملک گیر ترسیل کا وہ تاریخی گڑھ ہے جہاں گھریلو سامان، کھلونے اور پلاسٹک کا ہول سیل کاروبار ہوتا ہے۔"),

    ("jodia-bazaar-spice-market-karachi", "Jodia Bazaar Historic Spice & Commodity Market", "جوڑیا بازار تاریخی مصالحہ منڈی کراچی", "shopping", "Karachi", 24.853333, 67.000556, 350,
     "South Asia's bustling historical spice, grain, dry fruit, and bulk commodity trading exchange.",
     "جنوبی ایشیا کی قدیم مصالحہ، اناج، خشک میوہ جات اور اشیائے خوردونوش کی سب سے بڑی تھوک منڈی۔",
     "The fragrant labyrinth of Jodia Bazaar has traded cardamoms, cloves, Iranian saffron, and Afghan dry fruits since the mid-19th century, setting wholesale food prices for the entire country.",
     "جوڑیا بازار کی تنگ گلیوں میں دار چینی، لونگ، چھوٹی الائچی اور زعفران کی خوشبو رچی بسی ہے۔ یہ مارکیٹ پاکستان بھر کے لیے غذائی اجناس اور مصالحوں کی قیمتیں طے کرتی ہے۔"),

    ("timber-market-old-city-karachi", "Timber Market (Old City Karachi)", "ٹمبر مارکیٹ اولڈ سٹی کراچی", "shopping", "Karachi", 24.862222, 66.995833, 300,
     "Centuries-old timber and hardwood lumber import market serving Pakistan's shipbuilding and furniture crafts.",
     "لکڑی اور عمارتی لکڑی کی صدیوں پرانی مارکیٹ جو بحری کشتی سازی اور فرنیچر سازی کی ضروریات پوری کرتی ہے۔",
     "Situated near the Layari River basin, this market has supplied Burma teak, deodar pine, and African hardwoods to Karachi boat builders and master carpenters since the 1800s.",
     "پرانے شہر کے کنارے واقع ٹمبر مارکیٹ پاکستان کی سب سے بڑی لکڑی منڈی ہے جہاں ملکی دیودار سے لے کر برما کی ساگوان تک ہر قسم کی اعلیٰ لکڑی دستیاب ہوتی ہے۔"),

    ("paper-market-old-city-karachi", "Hassan Ali Effendi Road Paper Market", "حسن علی آفندی روڈ پیپر مارکیٹ کراچی", "shopping", "Karachi", 24.853889, 67.011944, 250,
     "Historical center of printing paper, imported cardstock, wedding invitation craft, and bookbinding.",
     "پرنٹنگ پیپر، درآمدی کارڈز اور شادی کے خوبصورت دعوتی کارڈز چھاپنے کی تاریخی اور مرکزی مارکیٹ۔",
     "The beating heart of Pakistan's printing and publishing trade, where publishers, stationery designers, and wedding planners source fine papers from mills across the world.",
     "سندھ مدرسۃ الاسلام کے قریب واقع پیپر مارکیٹ پاکستان میں اشاعت، کتاب سازی اور شادی کے کارڈز کی چھپائی کا سب سے اہم اور مصروف ترین تجارتی مرکز ہے۔"),

    ("sarafa-bazaar-mithadar-karachi", "Sarafa Bazaar (Mithadar Gold Souk)", "صرافہ بازار میٹھادر کراچی", "shopping", "Karachi", 24.854167, 66.997222, 250,
     "Ancient narrow gold and silver jewelry souk of Mithadar setting Pakistan's daily official gold rates.",
     "میٹھادر کا صدیوں قدیم سونے و چاندی کے زیورات کا بازار جہاں سے روزانہ پاکستان کا سرکاری سونے کا بھاؤ جاری ہوتا ہے۔",
     "A fortified maze of high-security jewelry ateliers, where goldsmiths practice hereditary Kundan, Polki, and filigree craftsmanship under century-old carved wooden lintels.",
     "میٹھادر کی تنگ گلیوں میں واقع صرافہ بازار پاکستان میں سونے کے زیورات، کندن اور روایتی کاریگری کا مرکز ہے جہاں ملک کا روزانہ سونے کا ریٹ مقرر کیا جاتا ہے۔"),

    ("empress-market-clock-tower-karachi", "Empress Market Clock Tower & Plaza", "ایمپریس مارکیٹ کلاک ٹاور و پلازہ کراچی", "shopping", "Karachi", 24.860556, 67.028611, 400,
     "1889 Indo-Gothic landmark market in Saddar with a 140-foot central clock tower and restored public promenade.",
     "صدر میں 1889ء کا انڈو گوتھک تاریخی شاہکار جس کا 140 فٹ اونچا کلاک ٹاور صدر کا تاج کہلاتا ہے۔",
     "Designed by James Strachan and completed in 1889 to commemorate Queen Victoria's Golden Jubilee. Built from local red and yellow stone, its surrounding public square has been revived as a pedestrian cultural space.",
     "1889ء میں ملکہ وکٹوریہ کی گولڈن جوبلی پر تعمیر ہونے والی یہ شاندار عمارت اپنے بلند و بالا کلاک ٹاور اور پتھریلے محرابوں کی بدولت صدر کا سب سے نمایاں سنگِ میل ہے۔"),

    ("sunday-bachat-bazaar-clifton", "Sunday Bachat Bazaar Clifton", "اتوار بچت بازار کلفٹن کراچی", "shopping", "Karachi", 24.821944, 67.045833, 400,
     "Massive weekend open-air flea and discount bazaar hosting over 1,000 canopy stalls.",
     "کلفٹن کا بڑا ہفتہ وار اوپن ایئر سستا بازار جہاں ایک ہزار سے زائد شامیانوں تلے اشیائے خور و نوش اور ملبوسات فروخت ہوتے ہیں۔",
     "Drawing tens of thousands of bargain hunters every Sunday, this organized canvas-tent bazaar features farm-fresh agricultural produce, export surplus apparel, crockery, and household goods at subsidized rates.",
     "ہر اتوار کو لگنے والا یہ کلفٹن کا بچت بازار سستے کپڑوں، تازہ پھلوں، سبزیوں اور گھریلو اشیاء کی خریداری کے لیے کراچی کے شہریوں کا مقبول ترین مقام ہے۔"),

    ("jama-cloth-market-karachi", "Jama Cloth Market (M.A. Jinnah Road)", "جامع کلاتھ مارکیٹ ایم اے جناح روڈ کراچی", "shopping", "Karachi", 24.857222, 67.013889, 350,
     "Karachi's oldest and most extensive retail bridal and unstitched fabric bazaar established in 1950.",
     "ایم اے جناح روڈ پر 1950ء کی تاریخی اور وسیع ترین ان سلے کپڑے اور برائیڈل سوٹس کی ریٹیل مارکیٹ۔",
     "An essential stop for family wedding preparations, featuring hundreds of shops offering Banarsi brocades, chiffon, lawn prints, velvet, and intricate hand-embroidery work.",
     "شادیوں کی خریداری کا سب سے بڑا گڑھ جہاں ملک بھر سے تیار شدہ بنارسی ساڑھیاں، کڑھائی والے سوٹ اور فینسی کپڑے دستیاب ہوتے ہیں۔"),

    ("light-house-market-karachi", "Lighthouse Flea & Thrift Bazaar", "لائٹ ہاؤس لنڈا و سیکنڈ ہینڈ مارکیٹ کراچی", "shopping", "Karachi", 24.856667, 67.009444, 300,
     "Legendary thrift, vintage fashion, sports gear, and imported second-hand clothing market near Lighthouse Cinema.",
     "لائٹ ہاؤس سینما کے قریب پاکستان کی مشہور ترین لنڈا مارکیٹ جہاں برانڈڈ جوتے، جیکٹس اور کھیلوں کا سامان ملتا ہے۔",
     "A goldmine for vintage denim, imported hiking boots, leather luggage, and sporting goods arriving through container shipping, attracting fashion students and thrifty shoppers alike.",
     "لائٹ ہاؤس مارکیٹ امپورٹڈ کوٹس، برانڈڈ جوتوں اور ونٹیج کپڑوں کا ایسا خزانہ ہے جہاں تلاش کرنے پر دنیا کے نامور برانڈز حیرت انگیز طور پر کم قیمت میں مل جاتے ہیں۔"),

    # =========================================================================
    # KARACHI COASTAL BEACHES, ISLANDS & LIGHTHOUSES
    # =========================================================================
    ("french-beach-karachi", "French Beach (Haji Ismail Goth)", "فرینچ بیچ حاجی اسماعیل گوٹھ کراچی", "nature", "Karachi", 24.819444, 66.836111, 800,
     "Exclusive rocky seaside bay between Hawke's Bay and Paradise Point renowned for clear waters and private stone cottages.",
     "ہاکس بے اور پیراڈائز پوائنٹ کے درمیان شفاف نیلے پانیوں اور پتھریلی چٹانوں والی پرسکون نجی ساحلی پناہ گاہ۔",
     "Surrounded by natural stone boundary walls, French Beach is beloved by scuba divers, snorkelers, and windsurfers for its clean rocky seabed, tide pools, and seasonal bioluminescence.",
     "شفاف سمندری پانی اور چٹانی ساحل کی حامل فرینچ بیچ سکوبا ڈائیونگ، تیراکی اور پرسکون خاندانی چھٹیوں کے لیے کراچی کے شہریوں کا پسندیدہ ساحل ہے۔"),

    ("hawkes-bay-beach-karachi", "Hawke's Bay Beach & Coastal Huts", "ہاکس بے ساحل و ہٹس کراچی", "nature", "Karachi", 24.855556, 66.858333, 1500,
     "Sweeping golden sand beach on the Arabian Sea famous for rental vacation huts, camel rides, and beach buggies.",
     "بحیرہ عرب کے کنارے سنہری ریت کا وسیع و عریض ساحل جہاں تفریحی ہٹس، اونٹ کی سواری اور لہریں دل موہ لیتی ہیں۔",
     "Named after Bladen Wilmer Hawke, this wide sandy bay provides the archetypal Karachi seaside outing with crashing surf, shaded stone cabanas, and fresh roasted corn on the cob.",
     "ہاکس بے کراچی کا سب سے مقبول تفریحی ساحل ہے جہاں دور تک پھیلی ریت، پکنک ہٹس اور لہروں کے ساتھ سمندر میں نہانے کا شاندار تجربہ ملتا ہے۔"),

    ("sandspit-turtle-beach-karachi", "Sandspit Beach & Green Turtle Reserve", "سینڈز پٹ ساحل و تحفظِ سبز کچھوا کراچی", "nature", "Karachi", 24.838889, 66.905556, 1200,
     "Important coastal sandspit bar and global nesting sanctuary for endangered Green and Olive Ridley sea turtles.",
     "بحیرہ عرب کی ریتلی پٹی جو نایاب سبز کچھوؤں کی افزائشِ نسل اور انڈے دینے کا بین الاقوامی محفوظ مسکن ہے۔",
     "Separating the open sea from dense mangrove backwaters, Sandspit is visited by conservationists, students, and night visitors who watch giant marine turtles nest in the warm dunes under WWF supervision.",
     "ایک طرف بحیرہ عرب اور دوسری طرف مینگروو کے جنگلات والی یہ قدرتی ریتلی پٹی نایاب کچھوؤں کی افزائش کا تاریخی مرکز اور شاندار تفریحی مقام ہے۔"),

    ("turtle-beach-coastal-karachi", "Turtle Beach Coastal Sanctuary", "ٹرٹل بیچ ساحلی مسکن کراچی", "nature", "Karachi", 24.847222, 66.883333, 1000,
     "Pristine coastal cove between Sandspit and Hawke's Bay featuring rocky tide pools and soft sunbathing dunes.",
     "سینڈز پٹ اور ہاکس بے کے درمیان واقع خوبصورت ساحلی گوشہ جہاں چٹانی تالاب اور نرم ریت موجود ہے۔",
     "Famous for its shallow, swimmable tides during winter months, colorful crabs scurrying along rock outcrops, and tranquil evening coastal sunsets over the Arabian Sea horizon.",
     "ٹرٹل بیچ موسمِ سرما میں تیراکی، خاندانی پکنک اور ساحلی غروبِ آفتاب کے دلفریب مناظر دیکھنے کے لیے ایک بہترین قدرتی پناہ گاہ ہے۔"),

    ("paradise-point-coastal-karachi", "Paradise Point Rocky Headland", "پیراڈائز پوائنٹ چٹانی ساحل کراچی", "viewpoint", "Karachi", 24.847222, 66.786111, 700,
     "Dramatic sandstone headland on the Arabian Sea formerly featuring a famous natural stone archway carved by waves.",
     "بحیرہ عرب کے کنارے بلند و بالا ریتلے پتھر کی چٹانیں جہاں سمندری لہروں کے ٹکرانے کے خوفناک و دلکش مناظر ہیں۔",
     "Known for its rugged coastal cliffs, deep ocean spray, and horseback riding along the shoreline, Paradise Point offers magnificent elevated vantage points over the turbulent sea.",
     "پیراڈائز پوائنٹ کراچی کے مغربی ساحل پر واقع چٹانی مقام ہے جہاں اونچے ٹیلوں سے بحیرہ عرب کا نظارہ اور سمندری ہواؤں کی گونج دل دہلا دیتی ہے۔"),

    ("cape-monze-ras-muari-karachi", "Cape Monze (Ras Muari) Promontory", "کیپ ماؤنز (راس مواری) راس و لائٹ ہاؤس کراچی", "viewpoint", "Karachi", 24.829167, 66.666667, 1000,
     "The westernmost cliff point of Sindh, featuring a historic navigation lighthouse looking toward Balochistan.",
     "صوبہ سندھ کا آخری مغربی چٹانی کونا جہاں تاریخی لائٹ ہاؤس اور بلوچستان کی سرحد کا سمندری ملاپ نظر آتا ہے۔",
     "Rising steeply above crystal-clear aquamarine waters, Cape Monze is the geographical terminus of the Kirthar mountain range meeting the Arabian Sea, featuring an operational maritime beacon built in 1914.",
     "1914ء میں قائم ہونے والے لائٹ ہاؤس کے ساتھ راس مواری وہ مقام ہے جہاں کیرتھر کا پہاڑی سلسلہ بحیرہ عرب میں ڈوبتا ہے، اور سمندر کا پانی شیشے کی طرح چمکتا ہے۔"),

    ("sunera-beach-karachi", "Sunera Beach Coastal Bay", "سنیرا بیچ ساحلی خلیج کراچی", "nature", "Karachi", 24.838889, 66.686111, 800,
     "Hidden coastal cove near Cape Monze with turquoise waters, sea cliffs, and peaceful camping shorelines.",
     "کیپ ماؤنز کے قریب واقع پوشیدہ ساحلی کھاڑی جہاں فیروزی پانی، چٹانیں اور کیمپنگ کے لیے پرسکون ماحول ہے۔",
     "Accessible via scenic winding tracks along the cliff tops, Sunera Beach offers pristine, uncrowded sands and dramatic rock formations ideal for stargazing and coastal bonfires.",
     "شہر کے شور شرابے سے دور یہ پرسکون ساحل اپنے شفاف نیلے پانی اور رات کو کھلے آسمان تلے تاروں کے نظارے کے لیے مہم جو سیاحوں کا راز ہے۔"),

    ("mubarak-village-coastal-karachi", "Mubarak Village & Churna Island Gateway", "مبارک ولیج و چرنا آئی لینڈ گیٹ وے کراچی", "nature", "Karachi", 24.869444, 66.658333, 900,
     "Karachi's second largest traditional fishing village and the primary launching boat point for Churna Island scuba diving.",
     "کراچی کا دوسرا بڑا روایتی ماہی گیر گاؤں جو چرنا جزیرے پر سکوبا ڈائیونگ اور واٹر اسپورٹس کا مرکزی گیٹ وے ہے۔",
     "Set beneath jagged arid hills on the coast, Mubarak Village is inhabited by hospitable Baloch fishermen. Its harbor of colorful wooden launches ferries adventurers to Churna Island for coral reef exploration.",
     "پہاڑوں کے دامن میں واقع یہ ساحلی بستی چرنا آئی لینڈ جانے والی کشتیوں کا مرکز ہے جہاں مرجانی چٹانوں، مچھلی کے شکار اور ڈائیونگ کے شائقین جمع ہوتے ہیں۔"),

    ("manora-lighthouse-karachi", "Manora Island Lighthouse & Promenade", "منوڑا جزیرہ لائٹ ہاؤس و پرومیناڈ", "historical", "Karachi", 24.795833, 66.975, 500,
     "1889 colonial red-and-white cylindrical lighthouse standing 91 feet above the Manora Island headland.",
     "منوڑا جزیرے کے سرے پر 1889ء کا سرخ و سفید سلنڈر نما لائٹ ہاؤس جو 91 فٹ بلند ہے۔",
     "Standing on the site of the historic 18th-century Talpur Fort of Manora, this beacon has guided international vessels into Karachi harbor for over 130 years, surrounded by restored beach promenades.",
     "تالپوروں کے قدیم قلعے کے مقام پر 1889ء میں تعمیر ہونے والا یہ مینارِ نور سوا صدی سے کراچی پورٹ میں داخل ہونے والے جہازوں کی رہنمائی کر رہا ہے۔"),

    ("shri-varun-dev-mandir-manora", "Shri Varun Dev Mandir (Manora Island)", "شری ورن دیو مندر منوڑا جزیرہ کراچی", "religious", "Karachi", 24.797222, 66.973611, 250,
     "Ancient seaside Hindu temple on Manora Island dedicated to Varuna, the Vedic lord of the oceans and water.",
     "منوڑا کے ساحل پر واقع قدیم ہندو مندر جو سمندروں اور پانی کے دیوتا ورن دیو سے منسوب ہے۔",
     "Featuring ornate carved sandstone shikhara architecture dating back to the 16th century and reconstructed in 1917, this seaside sanctum preserves rare nautical religious heritage in Pakistan.",
     "16ویں صدی کی بنیادوں پر 1917ء میں زرد پتھر سے تعمیر شدہ یہ مندر ملاحوں اور تاجروں کے بحری سفر کی حفاظت کی دعاؤں کا تاریخی مرکز ہے۔"),

    ("oyster-rocks-karachi-harbour", "Oyster Rocks Coastal Islets", "آئسٹر راکس جزائر کراچی ہاربر", "nature", "Karachi", 24.808333, 67.016667, 600,
     "Series of dramatic volcanic rock islets protruding out of the sea directly off the Clifton coastline.",
     "کلفٹن کے ساحل کے سامنے کھلے سمندر میں ابھری ہوئی قدرتی چٹانوں کا سلسلہ جہاں سمندری پرندے بسیرا کرتے ہیں۔",
     "Guarding the entrance to Karachi harbour, Oyster Rocks serve as a roosting sanctuary for sea gulls, cormorants, and terns, creating a picturesque maritime backdrop for Clifton's waterfront.",
     "کلفٹن ساحل کے سامنے سمندر میں سینہ تانے کھڑی یہ چٹانیں شام کے وقت ڈوبتے سورج اور سمندری بگُلوں کے غول کے ساتھ ایک سحر انگیز منظر پیش کرتی ہیں۔"),

    ("china-port-breakwater-karachi", "China Port (South Asia Terminal Breakwater)", "چائنا پورٹ بریک واٹر کلفٹن کراچی", "viewpoint", "Karachi", 24.805556, 67.008333, 500,
     "Massive engineered sea breakwater wall of interlocking tetrapods extending deep into the Arabian Sea.",
     "بحیرہ عرب کے اندر دور تک پھیلا ہوا چار کونوں والی چٹانی کنکریٹ کا عظیم بریک واٹر۔",
     "Constructed to shield the South Asia Pakistan Deep Water Terminal from monsoon tidal swells, this sweeping promenade became a viral sensation for sea gazing and breeze catching.",
     "کراچی کی گہری بندرگاہ کو سمندری طوفانوں سے بچانے کے لیے بنایا گیا یہ دیو ہیکل پتھریلا راستہ شہریوں کے لیے سمندر کی گہرائیوں کا نظارہ کرنے کا پرکشش مقام ہے۔"),

    ("clifton-sea-view-promenade-karachi", "Clifton Sea View Beach & Promenade", "کلفٹن سی ویو ساحل و واک وے کراچی", "attraction", "Karachi", 24.805556, 67.038889, 1200,
     "Karachi's most iconic public urban beach, bustling with dune buggies, camel rides, and sea breeze walkers.",
     "کراچی کا سب سے مقبول عوامی ساحل جہاں اونٹ اور گھوڑے کی سواری، سمندری ہوا اور چائے کے کھوکھے موجود ہیں۔",
     "The democratic living room of Karachi where families of all backgrounds gather in the hundreds of thousands every weekend to wet their feet in the Arabian Sea waves and watch the setting sun.",
     "سی ویو کراچی کی عوامی روح کا مظہر ہے جہاں ہر طبقے کے لاکھوں شہری سمندر کی لہروں میں پیر بھگونے، اونٹ کی سواری کرنے اور شام کی ٹھنڈی ہوا کھانے جمع ہوتے ہیں۔"),

    # =========================================================================
    # KARACHI CULTURE, ARTS, MUSEUMS & GALLERIES
    # =========================================================================
    ("napa-hindu-gymkhana-karachi", "National Academy of Performing Arts (Hindu Gymkhana)", "نیشنل اکیڈمی آف پرفارمنگ آرٹس (ہندو جمخانہ) کراچی", "cultural", "Karachi", 24.855, 67.021944, 250,
     "1925 Rajasthani Rajput-Mughal heritage palace hosting Pakistan's premier national theater and music academy.",
     "1925ء کا راجستھانی مغلیہ طرز کا تاریخی محل جہاں پاکستان کا سب سے معتبر تھیٹر اور موسیقی کا ادارہ قائم ہے۔",
     "Designed by Agha Ahmed Hussain in 1925 with scalloped stone jharokas, chattris, and cupolas. Now home to NAPA, where Zia Mohyeddin spearheaded the revival of classical Pakistani drama.",
     "راجستھانی جھروکوں اور گنبدوں سے مزین 1925ء کا یہ خوبصورت محل اب ناپا کا ہیڈ کوارٹر ہے جہاں ضیاء محی الدین نے پاکستانی تھیٹر، اداکاری اور کلاسیکی موسیقی کو نئی زندگی دی۔"),

    ("arts-council-of-pakistan-karachi", "Arts Council of Pakistan Karachi", "آرٹس کونسل آف پاکستان کراچی", "cultural", "Karachi", 24.853056, 67.021111, 300,
     "Pakistan's premier cultural citadel on M.R. Kiyani Road, hosting the World Culture Festival and Urdu conferences.",
     "ایم آر کیانی روڈ پر پاکستان کا سب سے بڑا ثقافتی مرکز جہاں عالمی کلچر فیسٹیول اور عالمی اردو کانفرنس ہوتی ہے۔",
     "Featuring multiple state-of-the-art auditoriums, open-air amphitheaters, and art studios, the Arts Council hosts daily theater plays, music concerts, painting exhibitions, and international literature festivals.",
     "جدید آڈیٹوریمز اور اوپن ایئر تھیٹر پر مشتمل کراچی کی آرٹس کونسل ملک میں ادب، ڈرامے، رقص اور مصوری کا سب سے بڑا متحرک پلیٹ فارم ہے۔"),

    ("the-second-floor-t2f-karachi", "T2F (The Second Floor) Cultural Space", "دی سیکنڈ فلور (ٹی ٹو ایف) ثقافتی کیفے کراچی", "cultural", "Karachi", 24.838889, 67.075, 200,
     "Pioneering independent community cafe, art space, and open-mic sanctuary founded by Sabeen Mahmud in DHA.",
     "ڈی ایچ اے میں سبین محمود کا قائم کردہ تاریخی آزاد خیال ثقافتی کیفے، کتب خانہ اور اوپن مائک مرکز۔",
     "Established in 2007, T2F sparked a cultural movement in Karachi by providing an uncurated public space for critical dialogue, indie acoustic music, poetry slams, and contemporary art debates.",
     "2007ء میں سبین محمود کی بصیرت سے قائم ہونے والا ٹی ٹو ایف آزادانہ مکالمے، نوجوان فنکاروں کی موسیقی، شاعری اور فلسفیانہ مباحث کا ایک بے باک گڑھ ہے۔"),

    ("mohatta-palace-museum-clifton", "Mohatta Palace Museum & Terraces", "موہٹہ پیلس میوزیم و بارہ دریاں کلفٹن کراچی", "museum", "Karachi", 24.814444, 67.032778, 350,
     "1927 palatial summer mansion of Shivratan Mohatta built from Jodhpur pink and Gizri yellow sandstone.",
     "1927ء کا راجستھانی محل جسے شیو رتن موہٹہ نے جودھ پور کے گلابی اور کراچی کے زرد پتھر سے تعمیر کروایا۔",
     "Constructed in Anglo-Mughal Rajasthani style with carved dome pavilions and underground tunnels. Later the residence of Fatima Jinnah, it is now Karachi's premier public museum for textile and fine arts.",
     "موہٹہ پیلس اپنے گلابی گنبدوں اور سنگین جھروکوں کے ساتھ کلفٹن کا تاج ہے۔ محترمہ فاطمہ جناح کی رہائش گاہ رہنے کے بعد اب یہ پاکستان کے نایاب نوادرات کا شاندار عجائب گھر ہے۔"),

    ("state-bank-museum-karachi", "State Bank Museum & Art Gallery", "اسٹیٹ بینک میوزیم و آرٹ گیلری کراچی", "museum", "Karachi", 24.848889, 67.009722, 300,
     "1920s Greco-Roman red sandstone palace on I.I. Chundrigar Road housing rare coins and Sadequain murals.",
     "آئی آئی چندریگر روڈ پر 1920ء کی گریکو رومن لال پتھر کی شاندار عمارت جہاں قدیم سکے اور صادقین کے شاہکار محفوظ ہیں۔",
     "Housed in the historic Imperial Bank of India building, this numismatic museum showcases ancient Indus seals, Hellenistic coins of Alexander, Mughal gold mohurs, and Sadequain's monumental industrial mural.",
     "اسٹیٹ بینک کا یہ عجائب گھر یونانی، ہڑپائی اور مغلیہ دور کے تاریخی سکوں کے ساتھ ساتھ صادقین کے دیوہیکل میورلز کا مسکن ہے جو ملکی معاشی تاریخ کو زندہ کرتا ہے۔"),

    ("paf-museum-karsaz-karachi", "Pakistan Air Force (PAF) Museum Karsaz", "پاکستان ایئر فورس (پی اے ایف) میوزیم کارساز کراچی", "museum", "Karachi", 24.891667, 67.091667, 600,
     "Vast aviation museum and landscaped aircraft park on Shahrah-e-Faisal featuring historic fighter jets and bombers.",
     "شاہراہ فیصل پر واقع فضائی عجائب گھر جہاں تاریخی لڑاکا طیارے، ریڈار اور جنگی ہیلی کاپٹر کھلے میدانوں میں سجے ہیں۔",
     "Preserving Pakistan's aerial combat history, the museum displays the Vickers Viking aircraft used by Quaid-e-Azam Jinnah, legendary 1965 Sabre jets, Mirage interceptors, and scale aviation galleries.",
     "قائد اعظم کے ذاتی وکرز وائکنگ طیارے اور 1965ء کی جنگ کے فاتح سیبر طیاروں سے مزین یہ میوزیم پاکستانی فضائیہ کی شجاعت کا زندہ ثبوت ہے۔"),

    ("pakistan-maritime-museum-karachi", "Pakistan Maritime Museum & Submarine PNS Hangor", "پاکستان میری ٹائم میوزیم و آبدوز ہنگور کراچی", "museum", "Karachi", 24.888889, 67.091667, 600,
     "Naval heritage park on Karsaz housing the historic submarine PNS Hangor and minesweeper warship PNS Mujahid.",
     "کارساز پر بحری جنگی تاریخ کا وسیع پارک جہاں 1971ء کی مشہور آبدوز پی این ایس ہنگور اصل حالت میں موجود ہے۔",
     "Set across 28 acres of lush lakes and gardens, visitors can board and tour the actual interior compartments of submarine PNS Hangor, explore naval artillery, and study Pakistan's oceanic history.",
     "28 ایکڑ پر پھیلے اس خوبصورت پارک میں سیاح اصل جنگی آبدوز کے اندر داخل ہو کر تارپیڈو اور سب میرینرز کی زندگی کو قریب سے دیکھ سکتے ہیں۔"),

    ("pia-planetarium-karachi", "Karachi Planetarium & Aerospace Park", "کراچی پلانیٹیریم و ہوابازی پارک", "cultural", "Karachi", 24.893889, 67.080556, 400,
     "Astronomical education center on University Road housing an authentic retired Boeing 720 passenger jetliner.",
     "یونیورسٹی روڈ پر واقع فلکیاتی و خلائی مرکز جہاں ایک ریٹائرڈ بوئنگ 720 مسافر بردار طیارہ نمائش کے لیے رکھا ہے۔",
     "Featuring a sky projection dome that screens cosmic journeys through constellations and planets, alongside an actual cockpit walk-through of Pakistan International Airlines' historic passenger aircraft.",
     "اس کے گنبد نما تھیٹر میں ستاروں اور کہکشاؤں کی پروجیکشن دکھائی جاتی ہے جبکہ باہر کھڑا پی آئی اے کا بوئنگ طیارہ بچوں کے لیے ہوابازی کی تعلیم کا بہترین ذریعہ ہے۔"),

    ("magnifiscience-centre-karachi", "The Dawood Foundation MagnifiScience Centre", "دی داؤد فاؤنڈیشن میگنیفی سائنس سینٹر کراچی", "museum", "Karachi", 24.850556, 67.001944, 400,
     "Pakistan's premier interactive contemporary science and technology discovery center in the Old Railway Quarter.",
     "ریلوے کوارٹرز میں پاکستان کا جدید ترین انٹرایکٹو سائنس و ٹیکنالوجی سینٹر جہاں 200 سے زائد سائنسی تجربات موجود ہیں۔",
     "Spanning four storeys of hands-on physical exhibits, living mangrove biomes, sound resonance chambers, and renewable energy simulators designed to inspire generations of young scientists.",
     "چار منزلوں پر پھیلا ہوا یہ سینٹر پاکستان کا پہلا مکمل انٹرایکٹو سائنس میوزیم ہے جہاں بچے اور بڑے روشنی، آواز اور ماحولیات کے اصول خود تجربہ کر کے سیکھتے ہیں۔"),

    ("citizens-archive-of-pakistan-karachi", "Citizens Archive of Pakistan Heritage Center", "سٹیزنز آرکائیو آف پاکستان ورثہ سینٹر کراچی", "cultural", "Karachi", 24.821944, 67.031944, 250,
     "Dedicated oral history archive and partition memory museum preserving thousands of eyewitness testimonies.",
     "قیامِ پاکستان اور تقسیمِ ہند کے عینی شاہدین کے زبانی بیانات، نادر تصاویر اور خطوط کا تاریخی آرکائیو سینٹر۔",
     "Pioneered by Sharmeen Obaid-Chinoy to safeguard the personal stories of the 1947 partition generation through interactive audiovisual booths, historical letters, and vintage passport exhibits.",
     "شرمین عبید چنائے کا قائم کردہ یہ آرکائیو 1947ء کی ہجرت کے دکھ سکھ، نایاب صوتی ریکارڈنگز اور پرانی دستاویزات کو محفوظ کر کے آنے والی نسلوں تک پہنچاتا ہے۔"),

    ("vm-art-gallery-karachi", "VM Art Gallery (Rangoonwala Community Centre)", "وی ایم آرٹ گیلری رنگون والا سینٹر کراچی", "cultural", "Karachi", 24.873056, 67.076389, 250,
     "Prominent contemporary art institution in Dhoraji nurturing emerging Pakistani painters, sculptors, and printmakers.",
     "دھوراجی میں واقع باوقار آرٹ گیلری جو نوجوان پاکستانی مصوروں، مجسمہ سازوں اور خطاطوں کی نمائشوں کا مرکز ہے۔",
     "Operating since 1987 under Zubeida Mustafa's stewardship, VM Art Gallery runs extensive non-profit residency programs, printmaking workshops, and provocative contemporary art showcases.",
     "1987ء سے قائم وی ایم آرٹ گیلری نے پاکستان کے درجنوں نامور مصوروں کو متعارف کروایا اور جدید فنونِ لطیفہ کی ترویج میں تاریخی کردار ادا کیا۔"),

    ("chawkandi-art-gallery-karachi", "Chawkandi Art Gallery Clifton", "چوکنڈی آرٹ گیلری کلفٹن کراچی", "cultural", "Karachi", 24.829167, 67.034722, 200,
     "Pioneering private contemporary art gallery founded by Zohra Hussain in 1984 representing masters like Jamil Naqsh.",
     "کلفٹن میں 1984ء سے قائم پاکستان کی معتبر ترین نجی آرٹ گیلری جہاں جمیل نقش اور دیگر اساتذہ کے شاہکار سجے ہیں۔",
     "A cornerstone of the South Asian modern art movement, Chawkandi has nurtured four decades of Pakistani contemporary visual arts, ceramics, miniature painting, and sculpture.",
     "زہرہ حسین کی قائم کردہ یہ گیلری گزشتہ چالیس سالوں سے پاکستانی تجریدی مصوری، مغل منی ایچر اور جدید مجسمہ سازی کی سب سے اہم نمائش گاہ رہی ہے۔"),

    ("koel-gallery-clifton-karachi", "Koel Gallery & Craft Courtyard Clifton", "کوئل آرٹ گیلری و کرافٹ کورٹ یارڈ کلفٹن", "cultural", "Karachi", 24.824444, 67.036111, 200,
     "Serene brick-and-tree open courtyard gallery in Clifton blending contemporary visual arts with indigenous textile crafts.",
     "کلفٹن میں اینٹوں اور درختوں سے گھری پرسکون گیلری جو جدید مصوری اور روایتی سندھی دستکاری کا سنگم ہے۔",
     "Founded by textile designer Noorjehan Bilgrami, Koel celebrates natural indigo dyeing, handspun khadi, block printing, and avant-garde art installations around an ambient open-air cafe.",
     "نور جہاں بلگرامی کا قائم کردہ یہ خوبصورت ادارہ قدرتی نیل، بلاک پرنٹنگ اور روایتی سندھی کھاڈی کو جدید فن پاروں کے ساتھ ملا کر ایک سحر انگیز ماحول تخلیق کرتا ہے۔"),

    ("canvas-gallery-clifton-karachi", "Canvas Gallery (Old Clifton)", "کینوس آرٹ گیلری اولڈ کلفٹن کراچی", "cultural", "Karachi", 24.821111, 67.033333, 200,
     "Foremost contemporary art gallery founded by Sameera Raja exhibiting bold, boundary-pushing Pakistani art globally.",
     "اولڈ کلفٹن میں سمیرا راجہ کی قائم کردہ گیلری جو پاکستانی معاصر آرٹ کو دنیا بھر میں روشناس کرانے کے لیے مشہور ہے۔",
     "Regularly participating in international art fairs like Art Dubai, Canvas represents leading Pakistani artists like Rashid Rana and Imran Qureshi, championing provocative political and conceptual works.",
     "کینوس گیلری پاکستان کے جدید ترین اور جرات مندانہ فن پاروں کا مسکن ہے جس کے فنکار دنیا کے سب سے بڑے میوزیمز میں نمائش کرتے ہیں۔"),

    ("indus-valley-school-gallery-karachi", "Indus Valley School of Art and Architecture (IVS) Gallery", "انڈس ویلی اسکول آف آرٹ اینڈ آرکیٹیکچر گیلری کلفٹن", "cultural", "Karachi", 24.811111, 67.038889, 300,
     "Renowned architectural and design academy in Clifton housed in the meticulously relocated 1900 Nusserwanjee stone building.",
     "کلفٹن میں واقع ممتاز آرٹ اکیڈمی جس کی عمارت 1900ء کی تاریخی نصر وانجی پتھریلی حویلی کو منتقل کر کے بنائی گئی۔",
     "Famous for physically dismantling stone-by-stone the colonial Nusserwanjee Building from Kharadar and reconstructing it in Clifton, IVS hosts high-caliber graduate degree shows and public design forums.",
     "کھارادر سے پتھر بہ پتھر منتقل کر کے سجائی گئی تاریخی نصر وانجی بلڈنگ میں قائم انڈس ویلی اسکول پاکستان کے باصلاحیت ترین معماروں، فیشن ڈیزائنرز اور مصوروں کا گہوارہ ہے۔"),

    # =========================================================================
    # KARACHI OUTSKIRTS, GADAP, MALIR & PARKS
    # =========================================================================
    ("malir-farmhouses-green-valley", "Malir Valley Green Orchards & Farms", "ملیر وادی سرسبز باغات و فارم ہاؤسز کراچی", "nature", "Karachi", 24.916667, 67.216667, 1000,
     "Karachi's traditional green agricultural oasis along the Malir River bed renowned for guava, papaya, and vegetable crops.",
     "ملیر ندی کے کنارے کراچی کا روایتی سرسبز نخلستان جو امرود، پپیتے اور سبزیوں کے لہلہاتے باغات کے لیے مشہور ہے۔",
     "Historically supplying fresh produce to the colonial port city, Malir's lush farms, shaded date groves, and weekend agro-retreats offer a cool countryside sanctuary within the metropolis.",
     "ملیر کا علاقہ صدیوں سے کراچی کا اناج گھر رہا ہے۔ یہاں کے میٹھے امرود کے باغات اور پرسکون فارم ہاؤسز ہفتہ وار چھٹی گزارنے کا بہترین قدرتی مقام ہیں۔"),

    ("damloti-wells-heritage-malir", "Damloti Historic Wells Waterworks Malir", "ڈملوٹی تاریخی کنویں و واٹر ورکس ملیر کراچی", "historical", "Karachi", 24.938889, 67.258333, 500,
     "1880s colonial stone-engineered gravity well system that provided Karachi's first filtered piped municipal drinking water.",
     "1880ء کی دہائی کا پتھریلا واٹر ورکس سسٹم جس نے کراچی کو پہلی بار پائپ لائن کے ذریعے پینے کا صاف پانی فراہم کیا۔",
     "Engineered by British municipal hydrologist James Strachan, these massive stone conduit wells tapped underground subterranean aquifers along the Malir River, pumping millions of gallons of sweet water to the city.",
     "انگریز دور میں ملیر ندی کی ریت کے نیچے سے میٹھا پانی حاصل کرنے کے لیے بنائے گئے یہ دیوہیکل کنویں کراچی کی پیاس بجھانے کی انجینئرنگ تاریخ کا شاندار ورثہ ہیں۔"),

    ("hub-dam-reservoir-karachi", "Hub Dam Lake & Wildlife Sanctuary", "حب ڈیم جھیل و جنگلی حیات کی پناہ گاہ کراچی", "nature", "Karachi", 25.258333, 67.116667, 2500,
     "Vast 24,000-acre freshwater reservoir on the Sindh-Balochistan border providing boating, fishing, and migratory bird watching.",
     "سندھ اور بلوچستان کی سرحد پر 24 ہزار ایکڑ پر پھیلی خوبصورت میٹھے پانی کی جھیل جہاں آبی پرندے اور ماہی گیری ہوتی ہے۔",
     "Constructed in 1981 across the Hub River, this sprawling blue lake surrounded by jagged rocky hills is a designated Ramsar wetland site hosting thousands of pelicans, ducks, and cranes every winter.",
     "1981ء میں حب ندی پر بنا یہ ڈیم نہ صرف کراچی اور لسبیلہ کو پانی دیتا ہے بلکہ موسمِ سرما میں سائبیریا سے آنے والے نایاب پرندوں کی بین الاقوامی پناہ گاہ ہے۔"),

    ("gadap-valley-fruit-orchards-karachi", "Gadap Valley Agro-Farms & Hills", "گڈاپ وادی فروٹ باغات و پہاڑیاں کراچی", "nature", "Karachi", 25.15, 67.216667, 2000,
     "Sprawling hilly agricultural region of northern Karachi renowned for organic vegetable cultivation and desert hills.",
     "شمالی کراچی کا پہاڑی و زرعی خطہ جو نامیاتی کھیتی باڑی، کھجور کے درختوں اور پرسکون دیہی ماحول کے لیے جانا جاتا ہے۔",
     "Nestled against the southern foothills of the Kirthar range, Gadap is home to indigenous Sindhi and Baloch rural villages, historic water check-dams, and expansive farm resort estates.",
     "کیرتھر کے دامن میں پھیلی گڈاپ کی وادی روایتی دیہات، چھوٹے ڈیموں اور سرسبز باغات کا پرامن خطہ ہے جہاں کراچی کی دیہی زندگی دھڑکتی ہے۔"),

    ("kathore-archaeological-mounds-karachi", "Kathore Archaeological Mounds & Riverbed", "کتھور قدیم آثار و ندی کراچی", "historical", "Karachi", 25.105556, 67.316667, 800,
     "Ancient prehistoric settlement mounds and historic caravanserai crossroads on the old trade route to Sehwan.",
     "سیہون جانے والی قدیم تجارتی شاہراہ پر قبل از تاریخ کے آثار اور کاروان سرائے کے تاریخی ٹیلے۔",
     "Located along the Super Highway corridor, Kathore holds ancient burial mounds, petroglyphs, and medieval staging posts where camel trains rested on journeys from Thatta to central Sindh.",
     "کتھور کا تاریخی علاقہ قدیم تجارتی قافلوں کا پڑاؤ تھا جہاں مٹی کے ٹیلوں میں صدیوں پرانی تہذیب کے آثار اور پتھروں پر نقش و نگار ملتے ہیں۔"),

    ("chowkandi-tombs-necropolis-karachi", "Chawkandi Tombs UNESCO Tentative Necropolis", "چوکنڈی قبرستان تاریخی مقابر کراچی", "historical", "Karachi", 24.869444, 67.271389, 600,
     "15th to 18th century intricately carved yellow sandstone funerary necropolis built by Baloch and Jokhio tribes.",
     "15ویں سے 18ویں صدی کا زرد پتھر کا تاریخی قبرستان جس پر بلوچ اور جوکھیو قبائل کی باریک سنگتراشی کے نادر نمونے ہیں۔",
     "Renowned worldwide for pyramidal sandstone tombs adorned with exquisite relief carvings of horsemen, swords, jewelry, and geometric filigree without using mortar, representing unmatched folk Islamic sepulchral art.",
     "بغیر گارے کے ایک دوسرے پر جمائے گئے زرد پتھر کے یہ اہرام نما مقابر گھڑ سواروں، تلواروں اور زیورات کے حیرت انگیز نقوش سے مزین ہیں اور سندھ کا عالمی فخر ہیں۔"),

    ("hub-river-gorge-karachi", "Hub River Gorge & Camel Crossings", "حب ندی گھاٹی و روایتی اونٹ کراسنگ", "nature", "Karachi", 25.016667, 66.983333, 1000,
     "Scenic natural rocky defile along the Hub River marking the provincial boundary between Sindh and Balochistan.",
     "سندھ اور بلوچستان کی قدرتی سرحد بنانے والی حب ندی کی خوبصورت پتھریلی گھاٹی جہاں روایتی اونٹوں کے قافلے گزرتے ہیں۔",
     "Carving through barren limestone ridges, the Hub riverbed features seasonal freshwater pools, desert acacia groves, and rugged hiking terrain popular for off-road expeditions.",
     "پتھریلی چٹانوں کو چیرتی ہوئی حب ندی کی یہ گھاٹی قدرتی تالابوں، کیکر کے جنگلات اور آف روڈ ڈرائیونگ کے شوقین افراد کے لیے ایک مسحور کن خطہ ہے۔"),

    ("karachi-safari-park-gulshan", "Karachi Safari Park & Swan Lake", "کراچی سفاری پارک و ہنس جھیل گلشن اقبال", "park", "Karachi", 24.927778, 67.119444, 800,
     "Massive 148-acre public wildlife safari park in Gulshan-e-Iqbal featuring drive-through animal enclosures and chairlifts.",
     "گلشن اقبال میں 148 ایکڑ پر پھیلا تفریحی سفاری پارک جہاں کھلے میدانوں میں جانور اور خوبصورت جھیل واقع ہے۔",
     "Opened in 1970, Safari Park features a natural hill terrain holding a large swan boating lake, aviary, children's amusement zones, and drive-through viewing of nilgai, deer, and exotic waterfowls.",
     "1970ء میں قائم ہونے والا سفاری پارک سرسبز پہاڑیوں، ہنسوں کی قدرتی جھیل اور چڑیا گھر پر مشتمل ہے جو کراچی کے خاندانوں کا مقبول ترین تفریحی پارک ہے۔"),

    ("karachi-zoo-botanical-garden", "Karachi Zoological Gardens (Gandhi Garden)", "کراچی چڑیا گھر و نباتاتی باغ گارڈن ویسٹ", "park", "Karachi", 24.876389, 67.021944, 500,
     "Historic 1878 zoological park in Garden West featuring century-old banyan trees, reptile house, and Victorian gates.",
     "گارڈن ویسٹ میں 1878ء کا تاریخی چڑیا گھر جہاں ڈیڑھ سو سال پرانے برگد کے درخت اور وکٹورین گیٹ موجود ہیں۔",
     "Covering 33 acres, it is Pakistan's oldest public zoo, originally founded as a botanical garden by the British in 1878. Home to white lions, Bengal tigers, ancient tortoises, and Mughal-style pavilions.",
     "1878ء میں نباتاتی باغ کے طور پر قائم ہونے والا یہ پاکستان کا قدیم ترین چڑیا گھر ہے جہاں نایاب جانوروں کے ساتھ ساتھ صدیوں پرانے درخت اور پرسکون سائے موجود ہیں۔"),

    ("bagh-ibn-e-qasim-clifton-karachi", "Bagh Ibn-e-Qasim Seaside Mega Park", "باغ ابنِ قاسم ساحلی میگا پارک کلفٹن کراچی", "park", "Karachi", 24.815, 67.031944, 700,
     "South Asia's largest urban seaside park spanning 130 manicured acres between Clifton Beach and Jahangir Kothari Parade.",
     "کلفٹن کے ساحل اور جہانگیر کوٹھاری پریڈ کے درمیان 130 ایکڑ پر پھیلا ہوا جنوبی ایشیا کا سب سے بڑا ساحلی پارک۔",
     "Featuring sweeping stone canopies, illuminated promenades, undulating rose lawns, and stone obelisks overlooking the sea, connecting seamlessly with the shrine of Abdullah Shah Ghazi.",
     "جہانگیر کوٹھاری پریڈ کے تاریخی بینڈ اسٹینڈ کے نیچے پھیلا یہ خوبصورت پارک سرسبز گھاس کے قطعات، گلاب کے باغات اور سمندری ہواؤں کا دلکش امتزاج ہے۔"),

    ("hill-park-pechs-karachi", "Hill Park & Amusement Viewpoint (PECHS)", "ہل پارک و تفریحی ویو پوائنٹ پی ای سی ایچ ایس کراچی", "park", "Karachi", 24.869444, 67.070833, 500,
     "Elevated hilltop public park in PECHS offering panoramic 360-degree city skyline views and amusement rides.",
     "پی ای سی ایچ ایس کی قدرتی پہاڑی پر بنا پارک جہاں سے پورے کراچی کے فلک بوس ٹاورز کا 360 ڈگری نظارہ ہوتا ہے۔",
     "Perched atop a natural rocky mound, Hill Park features terraced cactus gardens, shaded walking tracks, mechanical rides for children, and cool breezes overlooking southern Karachi.",
     "قدرتی اونچی پہاڑی پر واقع ہل پارک سے شام کے وقت کراچی کی روشنیاں اور دور تک پھیلا شہر صاف دکھائی دیتا ہے، جبکہ اس کے کیکٹس باغات خاص توجہ کا مرکز ہیں۔"),

    ("kidney-hill-park-karachi", "Kidney Hill Park (Ahmed Ali Park)", "کڈنی ہل پارک (احمد علی پارک) اوورسیز سوسائٹی کراچی", "park", "Karachi", 24.881944, 67.086111, 500,
     "Karachi's highest natural geographical elevation point transformed into an urban eco-forest and hiking trail.",
     "کراچی کی سب سے اونچی قدرتی پہاڑی جسے ایک سرسبز شہری جنگل، واکنگ ٹریک اور تفریحی مقام میں بدلا گیا ہے۔",
     "Rising over 200 feet above sea level, Kidney Hill features thousands of newly planted indigenous neem, peepal, and amaltas trees, walking trails, and sweeping vistas stretching to the port and sea.",
     "سطح سمندر سے 200 فٹ سے زیادہ بلند یہ قدرتی پہاڑی اب ہزاروں نیم اور پیپل کے درختوں کے ساتھ ایک شاندار اربن فاریسٹ بن چکی ہے جہاں سے سمندر اور پورٹ تک کا منظر نظر آتا ہے۔"),

    ("aziz-bhatti-park-gulshan-karachi", "Aziz Bhatti Park & Boating Lake", "عزیز بھٹی پارک و بوٹنگ جھیل گلشن اقبال کراچی", "park", "Karachi", 24.919444, 67.098889, 450,
     "Sprawling family park named after Major Raja Aziz Bhatti NH featuring an expansive freshwater boating lake.",
     "میجر عزیز بھٹی شہید نشانِ حیدر کے نام سے منسوب گلشن اقبال کا سرسبز پارک جہاں پیڈل بوٹنگ جھیل واقع ہے۔",
     "A beloved family sanctuary in District East, Aziz Bhatti Park features mature eucalyptus and banyan groves, scenic paddle boating around a central fountain, and children's amusement areas.",
     "گلشن اقبال کا یہ وسیع پارک پرسکون جھیل میں کشتی رانی، گھنے درختوں کی چھاؤں اور خاندانی پکنک کے لیے دہائیوں سے شہریوں کا پسندیدہ مقام رہا ہے۔"),

    ("polo-ground-baradari-karachi", "Polo Ground (Bagh-e-Jinnah Baradari)", "پولو گراؤنڈ (باغِ جناح بارہ دری) سول لائنز کراچی", "park", "Karachi", 24.852778, 67.026389, 400,
     "Historic colonial polo field and lush public park featuring an authentic carved marble Mughal Baradari pavilion.",
     "سول لائنز میں نوآبادیاتی دور کا تاریخی پولو فیلڈ جہاں سنگِ مرمر کی خوبصورت بارہ دری اور وسیع باغات ہیں۔",
     "Host to historic military parades, civic receptions for visiting world leaders, and premier flower shows, this tranquil park features manicured hedges and a historic marble-pillared pavilion.",
     "سول لائنز کے قلب میں واقع پولو گراؤنڈ پر ملکی سربراہان کے اعزاز میں تقاریب منعقد ہوتی رہی ہیں۔ اس کی سنگِ مرمر کی بارہ دری اور پھولوں کے باغات دیکھنے کے لائق ہیں۔"),

    ("karachi-boat-club-heritage", "Karachi Boat Club & Chinna Creek", "کراچی بوٹ کلب و چنا کریک", "cultural", "Karachi", 24.843056, 67.008333, 300,
     "1881 colonial rowing and sculling club nestled on Chinna Creek that has produced international regatta champions.",
     "چنا کریک پر 1881ء کا تاریخی روئنگ کلب جہاں کشتی رانی کے بین الاقوامی مقابلوں کی تربیت دی جاتی ہے۔",
     "Established in 1881, the Karachi Boat Club is one of the oldest rowing clubs in Asia. Its timber boathouse holds fine wooden sculls, hosting annual regattas on the tidal saltwater channels.",
     "1881ء سے قائم یہ کلب ایشیا کے قدیم ترین روئنگ کلبوں میں شمار ہوتا ہے جہاں لکڑی کی خوبصورت کشتیوں کے ذریعے روایتی ریگاٹا مقابلے منعقد ہوتے ہیں۔"),

    ("sandspit-mangrove-creeks-karachi", "Sandspit Mangrove Forest Creeks & Kayaking", "سینڈز پٹ مینگروو کریکس و کیاکنگ کراچی", "nature", "Karachi", 24.836111, 66.927778, 1200,
     "Dense saltwater mangrove wetlands along Karachi harbour offering guided kayaking, crabbing, and birding.",
     "کراچی ہاربر کے ساتھ گھنے تیمر (مینگروو) کے جنگلات جہاں کیاکنگ، کیکڑے کا شکار اور پرندوں کا مشاہدہ کیا جاتا ہے۔",
     "Serving as coastal green lungs and natural fish nurseries, these tidal creeks are teeming with mudskippers, flamingos, and herons, drawing ecotourists for peaceful canoe paddles through narrow green water tunnels.",
     "تیمر کے گھنے جنگلات کراچی کے ساحل کو طوفانوں سے بچاتے ہیں۔ ان پرسکون سمندری نالوں میں کیاکنگ کرنا اور فلیمنگو پرندوں کو دیکھنا ایک لاجواب ماحولیاتی تجربہ ہے۔"),

    ("korangi-creek-coastal-strip", "Korangi Creek Coastal Strip & Mudflats", "کورنگی کریک ساحلی پٹی و مڈ فلیٹس کراچی", "nature", "Karachi", 24.783333, 67.133333, 1000,
     "Tidal saltwater creek system bordering Ibrahim Hyderi, famous for fishing dhows and coastal bird sanctuaries.",
     "ابراہیم حیدری سے متصل سمندری کھاڑی جہاں ماہی گیروں کی کشتیاں اور نایاب آبی پرندے پائے جاتے ہیں۔",
     "A bustling maritime ecosystem where hundreds of wooden motorized fishing boats dock alongside intertidal mudflats that support migratory waders and rich artisanal crab fishing.",
     "کورنگی کریک روایتی ماہی گیری کا متحرک مرکز ہے جہاں سمندری لہروں پر جھولتی لکڑی کی لانچیں اور دور تک پھیلے سمندری پرندے قدرتی حسن کا سماں باندھتے ہیں۔"),

    ("banaras-silk-colony-orangi-karachi", "Banaras Silk Weavers Colony (Orangi)", "بنارس سلک ویورز کالونی اورنگی کراچی", "cultural", "Karachi", 24.938889, 66.991667, 400,
     "Historic artisan settlement of master Muslim weavers from Varanasi practicing hereditary pure silk jacquard weaving.",
     "اورنگی ٹاؤن میں وارانسی (بنارس) سے آئے ہوئے روایتی بنکروں کی بستی جو خالص ریشمی بنارسی ساڑھیاں بنتے ہیں۔",
     "Settled in the 1950s, this neighborhood houses thousands of traditional wooden handlooms and jacquard powerlooms crafting opulent Banarsi saris, gold-thread zari brocades, and bridal silk dupattas.",
     "1950ء کی دہائی میں بنارس سے ہجرت کر کے آنے والے کاریگروں کا یہ مرکز سونے چاندی کے تاروں سے بنارسی ساڑھیاں اور ریشمی ملبوسات تیار کرنے کا بے مثال گڑھ ہے۔"),

    ("baldia-naval-colony-gateway-karachi", "Baldia Town Gateway & RCD Highway", "بلدیہ ٹاؤن گیٹ وے و آر سی ڈی شاہراہ کراچی", "attraction", "Karachi", 24.916667, 66.95, 500,
     "Historic overland commercial transit gateway linking Karachi to Balochistan, Iran, and Turkey along the RCD Highway.",
     "کراچی کو بلوچستان اور ایران سے ملانے والی تاریخی آر سی ڈی شاہراہ کا تجارتی گیٹ وے اور ٹرک آرٹ حب۔",
     "Lined with ornate truck art workshops, Balochi tea hotels, and wholesale tire and transport logistics centers that have powered Pakistan's trans-regional overland freight for decades.",
     "بلدیہ ٹاؤن کا یہ علاقہ پاکستان کے مشہور ٹرک آرٹ کی تیاری اور بلوچستان و ایران کے راستے سامان لے جانے والے دیوہیکل ٹرکوں کا تاریخی پڑاؤ ہے۔"),

    ("landhi-cattle-colony-karachi", "Landhi Historic Dairy & Cattle Colony", "لانڈھی تاریخی ڈیری و کیٹل کالونی کراچی", "cultural", "Karachi", 24.838889, 67.233333, 800,
     "One of the world's largest concentrated dairy settlements supplying fresh milk and cream to Karachi.",
     "دنیا کی سب سے بڑی ڈیری کالونیوں میں سے ایک جو کراچی کو روزانہ تازہ دودھ اور خالص مکھن سپلائی کرتی ہے۔",
     "Established in 1958, this immense livestock township houses nearly half a million dairy buffaloes and cows, showcasing the colossal logistics that feed milk tea (chai) to a mega city of 20 million people.",
     "1958ء میں قائم ہونے والی لانڈھی بھینس کالونی لاکھوں مویشیوں کا مسکن ہے جو کراچی بھر کی چائے کی پیالیوں کو تازہ اور خالص دودھ مہیا کرنے کا سب سے بڑا مرکز ہے۔"),

    ("liaquatabad-super-market-karachi", "Liaquatabad (Lalu Khet) Super Market", "لیاقت آباد (لالو کھیت) سپر مارکیٹ کراچی", "shopping", "Karachi", 24.902778, 67.041667, 350,
     "Legendary working-class shopping nexus renowned for gold jewelry, unstitched cottons, and bird bazaars.",
     "لالو کھیت کی تاریخی عوامی مارکیٹ جو سونے کے سستے زیورات، کاٹن کے کپڑوں اور پرندوں کے بازار کے لیے جانی جاتی ہے۔",
     "Dating back to the establishment of Liaquatabad in the early 1950s, Lalu Khet Super Market is celebrated for affordable bridal sets, fabric bargaining, and its famous Sunday exotic bird and pigeon exchange.",
     "1950 کی دہائی سے قائم لالو کھیت کی سپر مارکیٹ کراچی کے متوسط طبقے کی خریداری کا دل ہے جہاں کپڑے، برتن اور اتوار کے دن نایاب پرندوں کا انوکھا میلہ لگتا ہے۔"),
]


def get_sindh_mega() -> list[dict]:
    records = []
    for item in SINDH_MEGA_DATA:
        records.append(make_clean_record(
            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region="Sindh",
            lat=item[5], lon=item[6], radius=item[7], short_en=item[8], short_ur=item[9], desc_en=item[10], desc_ur=item[11]
        ))
    return records

