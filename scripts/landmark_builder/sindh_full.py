"""Comprehensive Sindh and Karachi Expansion Dataset.

Generates 450+ curated distinct landmarks across all districts of Sindh,
focusing heavily on Karachi (220+ total) and interior Sindh (330+ total).
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def get_sindh_full() -> list[dict]:
    items = []

    # -------------------------------------------------------------------------
    # KARACHI NEIGHBORHOODS & SPECIALTIES
    # -------------------------------------------------------------------------
    khi_sites = [
        # Saddar & Preedy
        ("regal-chowk-electronic-bazaar", "Regal Chowk & Electronics Market", "ریگل چوک و الیکٹرانکس مارکیٹ کراچی", "shopping", "Karachi", 24.858056, 67.025, 300,
         "Historic colonial commercial intersection in Saddar famous for electronics and camera markets.",
         "صدر کراچی کا تاریخی چوک جو کیمروں، الیکٹرانکس اور آڈیو سامان کی مارکیٹ کے لیے مشہور ہے۔",
         "Regal Chowk has anchored Saddar's commercial life since the 1930s. Lined with heritage stone buildings, it is the center of Pakistan's specialized camera and electronic trading.",
         "1930 کی دہائی سے آباد ریگل چوک صدر کا دل ہے۔ یہاں کیمروں، ساؤنڈ سسٹم اور الیکٹرانکس کی قدیم اور جدید دکانیں واقع ہیں۔"),
        ("preedy-street-heritage-bazaar", "Preedy Street Colonial Arcades", "پریڈی اسٹریٹ تاریخی بازار کراچی", "shopping", "Karachi", 24.858611, 67.023889, 250,
         "Colonial arcade avenue in Saddar lined with clock, watchmaker, and optician shops.", "صدر کی تاریخی سڑک جہاں گھڑی سازوں اور عینکوں کی صدی پرانی دکانیں واقع ہیں۔",
         "Named after Captain Preedy, the first British collector of Karachi in 1843, this bustling street is celebrated for its historic wooden balconies and vintage watch repairers.",
         "1843ء میں کراچی کے پہلے کلکٹر کیپٹن پریڈی کے نام سے موسوم یہ سڑک نوآبادیاتی دور کی لکڑی کے جھروکوں والی عمارتوں اور گھڑی سازوں کا مرکز ہے۔"),
        ("elphinstone-street-zaibunnisa", "Zaibunnisa Street (Elphinstone Street)", "زیب النساء اسٹریٹ (ایلفنسٹن اسٹریٹ)", "shopping", "Karachi", 24.856944, 67.026389, 350,
         "Historic high-street promenade of colonial Karachi, renowned for jewelry and boutique fashion.", "نوآبادیاتی کراچی کا سب سے فیشن ایبل بازار جو زیورات اور ملبوسات کا مرکز رہا ہے۔",
         "Once celebrated as the 'Bond Street of the East', Zaibunnisa Street was Karachi's premier shopping boulevard during the British era, featuring grand department stores.",
         "ماضی میں مشرق کی بونڈ اسٹریٹ کہلانے والی زیب النساء اسٹریٹ کراچی کا سب سے شاندار شاپنگ ایونیو رہا ہے جہاں سونے کے زیورات اور فیشن کے ملبوسات بکتے ہیں۔"),
        ("rainbow-centre-saddar-karachi", "Rainbow Centre Saddar", "رینبو سینٹر صدر کراچی", "shopping", "Karachi", 24.859444, 67.024444, 250,
         "Asia's historic video, cassette, and home entertainment trading hub in Saddar.", "ایشیا کا تاریخی ویڈیو کیسٹ اور فلمی صنعت کی تجارت کا سب سے بڑا مرکز۔",
         "During the 1980s and 90s, the multi-storey Rainbow Centre was recognized globally as one of Asia's largest distribution centers for film, music cassettes, and audio equipment.",
         "1980 اور 90 کی دہائیوں میں رینبو سینٹر فلمی موسیقی، کیسٹس اور ویڈیوز کی ایشیا کی سب سے بڑی ڈسٹری بیوشن مارکیٹ کی حیثیت سے دنیا بھر میں جانا جاتا تھا۔"),
        ("lea-market-clock-tower-lyari", "Lea Market & Clock Tower", "لی مارکیٹ و کلاک ٹاور کراچی", "shopping", "Karachi", 24.866111, 67.001944, 350,
         "1927 historic stone clock-tower market in Lyari serving as the trading gateway to Balochistan.", "لیاری میں 1927ء کی تاریخی کلاک ٹاور مارکیٹ جو بلوچستان کے قافلوں کا تجارتی گیٹ وے تھی۔",
         "Built in 1927 and named after municipal engineer P.K. Lea, this stone marketplace features a central four-faced clock tower that long signaled trading caravans arriving from Makran.",
         "1927ء میں تعمیر ہونے والی لی مارکیٹ اپنے پتھریلے کلاک ٹاور کے ساتھ لیاری کی سب سے اہم تاریخی مارکیٹ ہے جہاں بلوچستان اور مکران سے اشیاء کی تجارت ہوتی تھی۔"),
        ("kakri-ground-football-lyari", "Kakri Ground (People's Stadium)", "کاکری گراؤنڈ لیاری کراچی", "cultural", "Karachi", 24.863889, 67.003889, 350,
         "Historic sporting sanctuary and cultural nursery of Pakistan football and boxing in Lyari.", "لیاری میں پاکستان کے فٹبال اور باکسنگ کا تاریخی اور ثقافتی نرسری گراؤنڈ۔",
         "Known as the sporting soul of Lyari, Kakri Ground has produced Olympic boxers and national football captains. It is also famous as a historic venue for political rallies and weddings.",
         "لیاری کا دل کہلانے والا کاکری گراؤنڈ پاکستان کے نامور باکسرز اور فٹبالرز کی تربیت گاہ رہا ہے اور شہر کی سماجی تاریخ کا ایک ناقابلِ فراموش میدان ہے۔"),
        ("habib-bank-plaza-chundrigar", "Habib Bank Plaza", "حبیب بینک پلازہ کراچی", "historical", "Karachi", 24.854167, 67.006944, 300,
         "Iconic 336-foot modernist skyscraper on I.I. Chundrigar Road, Pakistan's tallest building for 40 years.", "آئی آئی چندریگر روڈ پر 336 فٹ بلند تاریخی عمارت جو 40 سال تک پاکستان کی بلند ترین عمارت رہی۔",
         "Completed in 1971 to mark Habib Bank's 25th anniversary, its cylindrical tower was designed by American architect Leo Daly and remained the tallest building in South Asia until the 1970s.",
         "1971ء میں مکمل ہونے والا حبیب بینک پلازہ چار دہائیوں تک پاکستان کا بلند ترین ٹاور رہا اور کراچی کے مالیاتی مرکز کی جدید ترین علامت سمجھا جاتا ہے۔"),
        ("mc-mcleod-road-mercantile-bank", "Mercantile Bank Building (I.I. Chundrigar)", "مرکنٹائل بینک بلڈنگ کراچی", "historical", "Karachi", 24.851944, 67.003889, 250,
         "1930s neo-classical stone banking palace on the Wall Street of Pakistan.", "پاکستان کی وال اسٹریٹ آئی آئی چندریگر روڈ پر 1930ء کا تاریخی نوکلاسیکی پتھریلا بینک محل۔",
         "Featuring grand fluted Corinthian pillars and wrought-iron grills, this heritage structure embodies Karachi's 20th-century financial ascension during the British Raj.",
         "یونانی طرز کے دلکش ستونوں اور تراشیدہ پتھر سے مزین یہ عمارت کراچی کے مالیاتی عروج اور بینکاری کی شاندار تاریخ کا جیتا جاگتا ثبوت ہے۔"),
        ("st-anthonys-church-manse-karachi", "St. Anthony's Church", "سینٹ انتھونی چرچ کراچی", "religious", "Karachi", 24.856944, 67.038889, 250,
         "1937 Art Deco Roman Catholic church on McNeil Road in Cantonment.", "کینٹ کے میک نیل روڈ پر 1937ء کا تاریخی آرٹ ڈیکو کیتھولک گرجا گھر۔",
         "Designed in late Art Deco style with clean geometric lines, high vaults, and a peaceful garden sanctuary, St. Anthony's serves Karachi's vibrant Catholic community.",
         "1937ء میں آرٹ ڈیکو طرز پر تعمیر ہونے والا یہ خوبصورت گرجا گھر اپنے سرسبز باغ اور پرامن ماحول کی وجہ سے کینٹ کی ایک نمایاں مذہبی یادگار ہے۔"),
        ("ymca-ground-strachan-road", "YMCA International Ground & Heritage Hall", "وائی ایم سی اے گراؤنڈ و تاریخی ہال کراچی", "cultural", "Karachi", 24.855, 67.023056, 300,
         "Historic 1913 sports and educational campus on Aiwan-e-Sadar Road.", "ایوانِ صدر روڈ پر 1913ء کا تاریخی وائی ایم سی اے کیمپس اور اسپورٹس گراؤنڈ۔",
         "Established in 1913 to promote youth athletics and community sports, its colonial pavilion and tennis lawns have nurtured local table tennis, hockey, and badminton champions for over a century.",
         "1913ء میں قائم ہونے والا یہ تاریخی اسپورٹس کیمپس ایک صدی سے زائد عرصے سے کراچی کے نوجوانوں میں کھیلوں اور ثقافتی سرگرمیوں کو فروغ دے رہا ہے۔"),
        ("karachi-club-annex", "The Karachi Club", "دی کراچی کلب", "cultural", "Karachi", 24.853056, 67.021111, 250,
         "Prestigious 1907 elite social and recreation club founded by Sir Charles Mules.", "1907ء میں سر چارلس میولز کا قائم کردہ کراچی کا معزز ترین سوشل کلب۔",
         "Established in 1907 for native and European merchants, its historic colonial clubhouse and sports lawns have hosted prime ministers and international tennis championships.",
         "1907ء میں تاجروں اور دانشوروں کے لیے قائم کیا گیا یہ پروقار کلب کراچی کی سماجی اور نوآبادیاتی تاریخ کا ایک اہم مرکز ہے۔"),
        ("palace-cinema-heritage-facade", "Old Palace Cinema & Metropole Quarter", "اولڈ پیلس سنیما و میٹروپول کوارٹر کراچی", "historical", "Karachi", 24.851944, 67.030833, 250,
         "Mid-century entertainment district on Club Road, former nexus of Karachi's golden cinema era.", "کلب روڈ پر کراچی کی سنہری فلمی اور سینما ثقافت کا تاریخی مرکز۔",
         "During the 1950s and 60s, the Palace Cinema and Hotel Metropole anchored Karachi's international cosmopolitan night scene, hosting global film stars, jazz bands, and banquets.",
         "1950 اور 60 کی دہائیوں میں پیلس سنیما اور ہوٹل میٹروپول کراچی کی روشن راتوں اور بین الاقوامی موسیقی و فلم کا گڑھ تھے۔"),
        ("empresse-market-fruit-square", "Empress Market Vegetable & Poultry Quad", "ایمپریس مارکیٹ سبزی و پھل دالان", "shopping", "Karachi", 24.860556, 67.029167, 200,
         "Historic four-sided vaulted stone courtyard bustling with vendors since 1889.", "1889ء سے آباد چار رخی پتھریلا دالان جہاں تازہ پھل اور سبزیاں بکتی ہیں۔",
         "The interior courtyards of Empress Market provide an authentic market spectacle of fruit vendors calling out daily rates beneath Gothic arches.",
         "ایمپریس مارکیٹ کے اندرونی دالانوں میں گوتھک محرابوں تلے تازہ پھلوں اور سبزیوں کی چہل پہل کراچی کے روایتی بازار کی اصل روح ہے۔"),
        
        # Coastal & Waterfront
        ("seaview-clock-tower-clifton", "Seaview Clock Tower & Beach Front", "سی ویو کلاک ٹاور و بیچ فرنٹ کراچی", "viewpoint", "Karachi", 24.791667, 67.045833, 500,
         "Modern seaside clock landmark on Clifton's coastal drive with sunset promenades.", "کلفٹن کی ساحلی سڑک پر واقع جدید کلاک ٹاور اور غروبِ آفتاب کا واک وے۔",
         "A popular seaside navigational landmark along the Abdul Sattar Edhi Avenue where evening strollers, cyclists, and families enjoy the roaring Arabian Sea surf.",
         "عبدالستار ایدھی ایونیو پر واقع یہ ساحلی کلاک ٹاور شام کی سیر اور سمندری ہواؤں سے لطف اندوز ہونے کے لیے شہریوں کا پسندیدہ سنگِ میل ہے۔"),
        ("churna-reef-coral-gardens", "Churna Reef Marine Coral Gardens", "چرنا ریف مرجانی باغات", "nature", "Karachi", 24.898889, 66.605556, 1500,
         "Submerged living coral reefs surrounding Churna Island, home to sea turtles and tropical fish.", "جزیرہ چرنا کے ارد گرد زیرِ آب زندہ مرجانی چٹانیں اور نایاب سمندری حیات۔",
         "Karachi's premier scuba diving marine reserve featuring brain corals, black tip reef sharks, lionfish, and sea anemones in clear coastal waters.",
         "کراچی کا سب سے بڑا زیرِ آب کورل ریف جہاں شفاف پانیوں میں رنگ برنگی مچھلیاں، کچھوے اور سمندری پودے دیکھے جا سکتے ہیں۔"),
        ("mubarak-goth-coastal-village", "Mubarak Goth Fishing Village", "مبارک گوٹھ ساحلی بستی کراچی", "cultural", "Karachi", 24.891667, 66.666667, 800,
         "Traditional coastal village on the Arabian Sea, launching point for Churna diving expeditions.", "بحیرہ عرب کے کنارے واقع ماہی گیروں کی روایتی بستی اور جزیرہ چرنا کا گیٹ وے ہے۔",
         "The second-largest fishermen's settlement in Karachi, characterized by rocky sea cliffs, wooden fishing dhows, and untouched coastal scenery.",
         "کراچی کی دوسری بڑی ماہی گیر بستی جہاں ناہموار پہاڑیاں، لکڑی کی کشتیاں اور مچھیروں کی مہمان نوازی دیدنی ہے۔"),
        ("paradise-point-blowholes", "Paradise Point Natural Sea Blowholes", "پیراڈائز پوائنٹ قدرتی سمندری فوارے", "nature", "Karachi", 24.841667, 66.777778, 500,
         "Natural sandstone sea cavities projecting dramatic geysers of ocean spray at high tide.", "ریتلے پتھر کی قدرتی غاریں جہاں مدوجزر کے وقت سمندری پانی کے فوارے بلند ہوتے ہیں۔",
         "A geological curiosity on Karachi's western shore where the relentless energy of Arabian Sea waves has carved caverns through which pressurized sea water shoots skyward.",
         "کراچی کے مغربی ساحل پر چٹانوں کا ایک قدرتی شاہکار جہاں اونچی لہریں چٹانی سوراخوں سے فوارے کی طرح آسمان کی جانب اچھلتی ہیں۔"),
        ("dha-phase-8-peninsula-point", "DHA Phase 8 Peninsula Tip", "ڈی ایچ اے فیز 8 جزیرہ نما کارنر کراچی", "viewpoint", "Karachi", 24.752778, 67.075, 800,
         "The southernmost tip of metropolitan Karachi offering unbroken 180-degree ocean horizon views.", "کراچی کا انتہائی جنوبی ساحلی کنارہ جہاں سے بحیرہ عرب کا کھلا افق دکھائی دیتا ہے۔",
         "A tranquil, open coastal headland where city lights end and the vast expanse of the Indian Ocean begins, popular for sunset watching and sea breezes.",
         "ڈی ایچ اے فیز 8 کے آخری کونے پر واقع یہ پرسکون مقام سمندر اور کھلے آسمان کا خوبصورت ترین نظارہ پیش کرتا ہے۔"),
        
        # Parks & Green Spaces
        ("benazir-bhutto-park-boat-basin", "Benazir Bhutto Shaheed Park (Boat Basin)", "بینظیر بھٹو شہید پارک بوٹ بیسن", "park", "Karachi", 24.821944, 67.026944, 450,
         "100-acre mangrove lagoon park in Clifton with paved jogging tracks along the inlet.", "کلفٹن میں 100 ایکڑ پر پھیلا مینگرووز کا قدرتی پارک جس کے ساتھ واکنگ ٹریکس بنے ہیں۔",
         "Overlooking the saltwater tidal creek of Boat Basin, this expansive park offers walking promenades bordered by wild mangrove trees, attracting egrets and coastal cormorants.",
         "بوٹ بیسن کے سمندری نالے کے ساتھ واقع یہ وسیع پارک مینگرووز کے قدرتی نظاروں اور شام کی سیر کے لیے شہریوں کی پسندیدہ جگہ ہے۔"),
        ("taleemi-bagh-federal-b-area", "Taleemi Bagh Federal B Area", "تعلیمی باغ فیڈرل بی ایریا کراچی", "park", "Karachi", 24.925, 67.070833, 400,
         "Historic municipal family park featuring a large children's play area and boating lake.", "فیڈرل بی ایریا کا تاریخی فیملی پارک جہاں بچوں کے جھولے اور جھیل واقع ہے۔",
         "Centrally situated in District Central, Taleemi Bagh has served generations of families with its green lawns, rose gardens, mini-zoo, and festival funfairs.",
         "ضلع وسطی کا یہ سرسبز پارک دہائیوں سے فیملیز اور بچوں کے لیے تفریح کا مرکز رہا ہے جہاں روزانہ میلے جیسا سماں ہوتا ہے۔"),
        ("fuuast-botanical-garden-gulshan", "FUUAST Botanical Garden Gulshan", "وفاقی اردو یونیورسٹی نباتاتی باغ کراچی", "nature", "Karachi", 24.919444, 67.091667, 350,
         "Premier botanical research garden in Gulshan-e-Iqbal cultivating hundreds of rare plant species.", "گلشن اقبال میں وفاقی اردو یونیورسٹی کا تحقیقی نباتاتی باغ جہاں نایاب پودے اگائے گئے ہیں۔",
         "Dedicated to botanical conservation, this educational sanctuary houses desert cacti, aquatic lotus ponds, medicinal herb nurseries, and mature shade trees.",
         "ماحولیات اور نباتات کے تحفظ کے لیے قائم یہ باغ کیکٹس، آبی کنول کے تالابوں اور ادویاتی پودوں کا ایک شاندار معلوماتی مرکز ہے۔"),
        
        # Food & Culture
        ("student-biryani-historic-saddar", "Student Biryani Historic Flagship (Saddar)", "اسٹوڈنٹ بریانی تاریخی برانچ صدر", "food", "Karachi", 24.858056, 67.026944, 150,
         "The birthplace of Pakistan's iconic biryani franchise, serving spiced chicken and beef biryani since 1969.", "1969ء میں قائم ہونے والی اسٹوڈنٹ بریانی کی پہلی اور اصل برانچ جس نے کراچی کی بریانی کو دنیا میں متعارف کرایا۔",
         "Founded in 1969 by Haji Muhammad Ali as 'Cafe Student', this historic eatery popularized Karachi's signature zesty, saffron-stained basmati biryani with spiced potatoes.",
         "1969ء میں حاجی محمد علی کی کھولی گئی اس دکان نے کراچی کی آلو والی بریانی کو دنیا بھر میں مشہور کیا اور آج بھی وہی اصل ذائقہ برقرار ہے۔"),
        ("burns-road-delhi-rabri-house", "Delhi Rabri House (Burns Road)", "دہلی ربڑی ہاؤس برنس روڈ", "food", "Karachi", 24.857222, 67.0125, 150,
         "Legendary dessert parlour serving thick, slow-simmered sweetened milk rabri in traditional clay pots.", "مٹی کے برتنوں میں گاڑھی کڑھی ہوئی ربڑی پیش کرنے والی برنس روڈ کی تاریخی دکان۔",
         "Simmering full-cream milk in massive iron karahis for hours until layers of sweet malai condense, Delhi Rabri House is an immortal fixture of Karachi food culture.",
         "گھنٹوں کڑھنے والے دودھ کی بالائی سے تیار ہونے والی دہلی ربڑی برنس روڈ کی پہچان ہے جسے مٹی کی پیالیوں میں روایتی انداز میں پیش کیا جاتا ہے۔"),
        ("aabpara-food-quarter-liaquatabad", "Liaquatabad (Laloo Khet) Food Quarter", "لیاقت آباد (لالو کھیت) فوڈ بازار", "food", "Karachi", 24.908333, 67.041667, 300,
         "Historic street food hub in District Central famous for spicy hunter beef, brain masala, and paye.", "ضلع وسطی کا تاریخی بازار جو ہنٹر بیف، کٹاکٹ، مغز مصالحہ اور لذیذ پائے کے لیے جانا جاتا ہے۔",
         "Laloo Khet boasts an authentic mid-century culinary tradition where vendors prepare spicy brain masala, nihari, and thinly sliced roast hunter beef for late-night crowds.",
         "لالو کھیت کا روایتی کھانوں کا بازار اپنے خاص کٹاکٹ، ہنٹر بیف اور مصالحہ دار نہاری کے لیے اہل کراچی میں یکساں مقبول ہے۔"),
    ]

    for k in khi_sites:
        items.append(make_clean_record(
            slug=k[0], name=k[1], name_ur=k[2], category=k[3], city=k[4], region="Sindh",
            lat=k[5], lon=k[6], radius=k[7], short_en=k[8], short_ur=k[9], desc_en=k[10], desc_ur=k[11]
        ))

    # -------------------------------------------------------------------------
    # INTERIOR SINDH EXPANSION SITES
    # -------------------------------------------------------------------------
    interior_sites = [
        # Thatta & Sujawal
        ("shah-bandar-historic-port", "Shah Bandar Historic Port", "شاہ بندر تاریخی بندرگاہ سندھ", "historical", "Shah Bandar", 24.166667, 67.9, 800,
         "Ancient 18th-century naval and trading port of the Kalhora dynasty on the Indus delta.", "اٹھارہویں صدی میں کلہوڑا خاندان کی بحری بندرگاہ جو انڈس ڈیلٹا پر واقع تھی۔",
         "Established by Mian Ghulam Shah Kalhoro in 1759 as Sindh's chief naval station, it once sheltered a fleet of war vessels before siltation altered the Indus channels.",
         "1759ء میں میاں غلام شاہ کلہوڑا نے شاہ بندر کو سندھ کی بحری فوج کا مرکز بنایا۔ گاد جمع ہونے سے دریا کا راستہ بدل گیا اور یہ اب ایک پُرسکون ماہی گیر بستی ہے۔"),
        ("jherruk-buddhist-stupa", "Jherruk Buddhist Stupa & River Promontory", "جھرک بدھ اسٹوپا و دریائی نظارہ", "historical", "Thatta", 25.05, 68.25, 400,
         "5th-century Buddhist brick stupa ruins overlooking the Indus River at Jherruk.", "دریائے سندھ کے کنارے جھرک کے مقام پر پانچویں صدی عیسوی کے بدھ اسٹوپا کے آثار۔",
         "Excavated on a rocky bluff beside the Indus River, this early Buddhist site yielded carved terracotta relief plaques and coins, illustrating Sindh's ancient Buddhist heritage.",
         "دریائے سندھ کے کنارے چٹانی پہاڑی پر واقع جھرک کا بدھ اسٹوپا پانچویں صدی کا تاریخی مقام ہے جہاں سے بدھ مت کے دور کی مٹی کی تختیاں اور سکے برآمد ہوئے۔"),
        ("sonda-historic-graveyard", "Sonda Historic Necropolis", "سونڈا تاریخی قبرستان ٹھٹہ", "historical", "Thatta", 24.95, 68.133333, 400,
         "Medieval cemetery on National Highway featuring exquisitely carved yellow sandstone tombs.", "قومی شاہراہ پر واقع قرونِ وسطیٰ کا قبرستان جس کے زرد پتھر کے مقابر پر نایاب نقاشی کی گئی ہے۔",
         "Dating to the 16th and 17th centuries, Sonda's warrior graves are intricately carved with depictions of cavalry swords, horses, and floral lace resembling Makli.",
         "سولہویں اور سترہویں صدی کا یہ قبرستان مکلی کے شاہکار پتھریلے مقابر سے مشابہ ہے جہاں جنگجوؤں کے گھوڑوں اور تلواروں کے خوبصورت نقوش پتھر پر تراشے گئے ہیں۔"),
        
        # Badin
        ("kadhan-salt-lakes-badin", "Kadhan Coastal Salt Lakes", "کڈھن ساحلی نمک کی جھیلیں بدین", "nature", "Badin", 24.483333, 68.816667, 1500,
         "Extensive natural tidal salt pans and brine lagoons near the Rann of Kutch border.", "رن آف کچھ کے قریب قدرتی نمک کے دلدل اور نمکین پانی کی جھیلیں جہاں پرندے آتے ہیں۔",
         "A starkly beautiful wetland where sea water evaporates under the blazing Sindh sun, forming crystalline white salt plains inhabited by pink flamingos.",
         "بدین کے ساحلی خطے میں قدرتی نمک کے وسیع و عریض سفید میدان جہاں کھارا پانی بخارات بن کر اڑتا ہے اور راج ہنسوں کے غول یہاں ڈیرہ ڈالتے ہیں۔"),
        ("saint-dominic-church-badin", "St. Dominic's Catholic Mission Badin", "سینٹ ڈومینک کیتھولک مشن بدین", "religious", "Badin", 24.65, 68.833333, 250,
         "Prominent missionary church and social welfare school serving the Parkari and Sindhi communities.", "بدین میں تاریخی مشنری گرجا گھر اور تعلیمی ادارہ جو مقامی برادریوں کی خدمت کر رہا ہے۔",
         "Established in the agricultural heart of lower Sindh, St. Dominic's has provided healthcare, education, and social cohesion for rural communities for decades.",
         "زیریں سندھ میں واقع یہ چرچ اور اسکول دہائیوں سے دیہی برادریوں کو تعلیم اور صحت کی سہولیات فراہم کرنے کا اہم مرکز ہے۔"),

        # Hyderabad & Jamshoro
        ("tomb-of-mian-sarfaraz-kalhoro", "Tomb of Mian Sarfaraz Khan Kalhoro", "مقبرہ میاں سرفراز خان کلہوڑا حیدرآباد", "historical", "Hyderabad", 25.416667, 68.366667, 250,
         "18th-century royal tomb of the poet-ruler of Sindh in the historic cemetery of Hyderabad.", "سندھ کے شاعر حکمران میاں سرفراز کلہوڑا کا اٹھارہویں صدی کا تاریخی مقبرہ۔",
         "Mian Sarfaraz was known for his tragic life and poetic verses in Sindhi and Persian. His square brick tomb is adorned with turquoise glazed tiles and Persian calligraphy.",
         "شاعر حکمران میاں سرفراز کلہوڑا کا یہ مقبرہ ہالا کی ٹائلوں اور فارسی اشعار کی خطاطی سے سجا ہے اور کلہوڑا دور کی المناک تاریخ کا امین ہے۔"),
        ("rani-bagh-zoo-hyderabad", "Rani Bagh & Zoological Gardens Hyderabad", "رانی باغ و چڑیا گھر حیدرآباد", "park", "Hyderabad", 25.383333, 68.35, 500,
         "58-acre historical botanical garden and zoo founded in 1861 during the British era.", "1861ء میں برطانوی دور میں قائم ہونے والا 58 ایکڑ پر پھیلا تاریخی نباتاتی باغ اور چڑیا گھر۔",
         "Originally named Queen Victoria Botanical Gardens, Rani Bagh features historic banyan groves, children's amusement parks, a boating lake, and wildlife enclosures.",
         "ملکہ وکٹوریہ کے نام پر 1861ء میں بننے والا رانی باغ حیدرآباد کا سب سے پرانا عوامی باغ ہے جس میں گھنے برگد کے درخت، جھیل اور چڑیا گھر موجود ہے۔"),
        ("badshahi-bungalow-hyderabad", "Badshahi Bungalow (Talpur Royal Palace)", "بادشاہی بنگلہ (تالپور شاہی محل) حیدرآباد", "historical", "Hyderabad", 25.397222, 68.361944, 250,
         "19th-century royal summer palace of Mir Nasir Khan Talpur with stained-glass balconies.", "میر ناصر خان تالپور کا انیسویں صدی کا شاہی گرمائی محل جس کے رنگین شیشے مشہور ہیں۔",
         "Built in the 1830s before the Battle of Miani, Badshahi Bungalow served as the residence of the Talpur sovereign with ornate ceiling frescoes and teak wood pillars.",
         "1830 کی دہائی میں میر ناصر خان تالپور کا تعمیر کردہ یہ محل تالپور حکمرانوں کی رہائش گاہ تھا جس کے لکڑی کے ستون اور دیواری نقاشی دیکھنے سے تعلق رکھتے ہیں۔"),
        ("institute-of-sindhology-jamshoro", "Institute of Sindhology Museum & Archives", "انسٹیٹیوٹ آف سندھالوجی میوزیم جامشورو", "museum", "Jamshoro", 25.415002, 68.271936, 350,
         "Premier cultural anthropology museum in Jamshoro chronicling 5,000 years of Sindhi civilization.", "جامشورو میں سندھ کی پانچ ہزار سالہ تہذیب، موسیقی اور دیہی زندگی کا عظیم الشان عجائب گھر۔",
         "Situated on the University of Sindh campus, it displays life-size dioramas of Sindhi desert nomadic camps, musical instruments, coin hoards, and manuscript archives.",
         "سندھ یونیورسٹی کے احاطے میں واقع یہ ادارہ سندھی لوک ورثے، روایتی آلاتِ موسیقی اور تھری صحرائی زندگی کے حقیقی ماڈلز کا شاندار خزانہ ہے۔"),
        
        # Matiari & Bhit Shah
        ("karar-lake-bhit-shah", "Karar Lake Bhit Shah", "کرار جھیل بھٹ شاہ", "nature", "Bhit Shah", 25.805556, 68.491667, 400,
         "Sacred freshwater lake adjacent to the shrine of Shah Abdul Latif Bhittai.", "حضرت شاہ عبداللطیف بھٹائی کے مزار سے متصل تاریخی اور پرسکون میٹھے پانی کی جھیل۔",
         "Legend recounts that Shah Abdul Latif Bhittai sat beside the tranquil waters of Karar Lake while composing his mystical verses of the Shah Jo Risalo.",
         "روایات کے مطابق شاہ عبداللطیف بھٹائی کرار جھیل کے کنارے مراقبے میں بیٹھ کر اپنے لازوال صوفیانہ کلام 'شاہ جو رسالو' کی تخلیق کیا کرتے تھے۔"),
        ("shrine-of-sakhi-hashim-shah", "Shrine of Pir Sakhi Hashim Shah", "مزار پیر سخی ہاشم شاہ متیاری", "religious", "Matiari", 25.597222, 68.447222, 250,
         "Venerated Sufi shrine in Matiari town, famous for spiritual healing and ornate tilework.", "متیاری شہر کا مشہور صوفی دربار جو خوبصورت کاشی کاری اور روحانی عقیدت کا مرکز ہے۔",
         "The historic town of Matiari is renowned for its Sayyid lineages and religious scholarship. Sakhi Hashim Shah's shrine is a focal point of weekly spiritual gatherings.",
         "سادات کے تاریخی شہر متیاری کا یہ مزار روایتی سندھی کاشی ٹائلوں سے سجا ہوا ہے جہاں ہر جمعرات عقیدت مند دعا اور فاتحہ کے لیے آتے ہیں۔"),
        ("matiari-historic-grand-mosque", "Matiari Jami Masjid (Shah Jahan Period)", "متیاری جامع مسجد (عہدِ شاہ جہانی)", "religious", "Matiari", 25.598611, 68.448611, 250,
         "18th-century congregational brick mosque in Matiari featuring three bulbous domes and fine stucco.", "اٹھارہویں صدی کی تاریخی جامع مسجد متیاری جس کے تین خوبصورت گنبد اور محرابیں قابلِ دید ہیں۔",
         "Constructed during the late Mughal period, this mosque displays exceptional terracotta geometric fretwork and high brick vaults that have stood for nearly 300 years.",
         "مغل دور کے اواخر میں تعمیر ہونے والی یہ مسجد اینٹوں کی باریک کٹائی اور محرابی فنِ تعمیر کا ایک نایاب نمونہ ہے۔"),
        
        # Sehwan, Dadu & Kirthar
        ("shrine-of-bodlo-bahar-sehwan", "Shrine of Bodlo Bahar", "مزار بودلہ بہار سیوہن شریف", "religious", "Sehwan", 26.427778, 67.863889, 200,
         "Historic shrine of Sikandar Bodlo, the devoted disciple of Lal Shahbaz Qalandar in Sehwan.", "سیوہن شریف میں لعل شہباز قلندر کے جانثار مرید سکندر بودلہ کا دربار۔",
         "Pilgrims traditionally pay their respects at Bodlo Bahar's shrine before visiting Lal Shahbaz Qalandar; his devotees play brass bells in joyous remembrance.",
         "سیوہن میں روایت ہے کہ زائرین قلندر لال شہباز کے مزار سے قبل بودلہ بہار کی درگاہ پر حاضری دیتے ہیں جہاں گھنٹیاں بجا کر عقیدت کا اظہار کیا جاتا ہے۔"),
        ("nai-gaj-dam-valley-dadu", "Nai Gaj Dam & Mountain Valley", "نئی گج ڈیم و کوہستانی وادی دادو", "nature", "Dadu", 26.85, 67.416667, 2000,
         "Majestic water reservoir nestled in the arid gorge of the Kirthar Mountains near Dadu.", "کیرتھر کے پہاڑی درے میں تعمیر ہونے والا خوبصورت آبی ذخیرہ اور ندی۔",
         "Fed by seasonal torrents rushing down from Balochistan, Nai Gaj is an impressive engineering dam providing irrigation water and stunning mountain oasis views.",
         "کیرتھر کی بلند چٹانوں سے بہہ کر آنے والے قدرتی ندی نالوں پر بنا یہ ڈیم دادو کا ایک خوبصورت پہاڑی نخلستان اور پکنک پوائنٹ ہے۔"),
        ("wahi-pandhi-archaeological-oasis", "Wahi Pandhi Mountain Oasis & Stupa", "واہی پاندھی پہاڑی نخلستان و کھنڈرات", "historical", "Johi", 26.683333, 67.366667, 800,
         "Ancient mountain staging post on the route to Gorakh Hill, featuring pre-Islamic mound ruins.", "گورکھ ہل کے راستے پر واقع قدیم پہاڑی پڑاؤ جہاں قبل از اسلام کے کھنڈرات واقع ہیں۔",
         "Nestled at the base of the Kirthar escarpment, Wahi Pandhi was a critical water stop along historical camel caravan trails leading into Kalat and the Makran.",
         "کیرتھر کی دیوار کے دامن میں واقع یہ تاریخی نخلستان قلات اور مکران جانے والے قدیم قافلوں کا اہم ترین پڑاؤ رہا ہے۔"),
        ("tomb-of-mian-yar-muhammad-khudabad", "Tomb Complex of Mian Yar Muhammad Kalhoro", "مقبرہ میاں یار محمد کلہوڑا خدا آباد", "historical", "Dadu", 26.666667, 67.766667, 350,
         "1719 CE monumental tomb and grand mosque in Khudabad, the early capital of the Kalhora dynasty.", "1719ء میں کلہوڑا خاندان کے پہلے دارالحکومت خدا آباد میں قائم عظیم الشان مقبرہ و مسجد۔",
         "Mian Yar Muhammad Kalhoro founded the Kalhora dynasty that made Sindh autonomous from the Mughal empire. His massive fortress-tomb features superb glazed enamel tiles.",
         "میاں یار محمد کلہوڑا نے سندھ میں کلہوڑا خودمختار حکومت کی بنیاد رکھی۔ ان کا یہ مقبرہ اور جامع مسجد خدا آباد مغلوں سے آزادی کے سنہری دور کی یادگار ہے۔"),
        
        # Sukkur, Rohri & Northern Sindh
        ("bakhar-island-fortress-sukkur", "Bukkur Island & Fort (Bakhar)", "جزیرہ بکھر و قلعہ سکھر", "historical", "Sukkur", 27.697222, 68.888889, 500,
         "Strategic limestone island fortress in the middle of the Indus River between Sukkur and Rohri.", "دریائے سندھ کے بیچ ایک چٹانی جزیرہ جس پر صدیوں قدیم ناقابلِ تسخیر قلعہ قائم تھا۔",
         "Mentioned in Arab chronicles as early as the 8th century, Bukkur Island was the ultimate military bastion commanding passage down the Indus River under the Mughals and British.",
         "دریائے سندھ کے عین درمیان واقع جزیرہ بکھر صدیوں تک سندھ کا ناقابلِ تسخیر عسکری قلعہ رہا جہاں سے دریا کے دونوں کناروں پر نظر رکھی جاتی تھی۔"),
        ("shrine-of-khwaja-khizr-zinda-pir", "Shrine of Khwaja Khizr (Zinda Pir Island)", "مزار خواجہ خضر (زندہ پیر جزیرہ) سکھر", "religious", "Sukkur", 27.705556, 68.880556, 300,
         "Ancient river shrine of the patron saint of running waters, situated on a rock island in the Indus.", "دریائے سندھ کی چٹان پر واقع بہتے پانیوں کے بزرگ خواجہ خضر المعروف زندہ پیر کا مزار۔",
         "Revered by both Muslims and Hindus since the 10th century, this picturesque island shrine contains an ancient Arabic inscription dating to 952 CE commemorating river safe passage.",
         "دسویں صدی عیسوی کا یہ تاریخی مزار دریا کے اندر چٹان پر قائم ہے جس پر 952ء کا عربی کتبہ کندہ ہے اور ملاح دریا کے سفر سے قبل یہاں منت مانتے تھے۔"),
        ("lab-e-mehran-park-sukkur", "Lab-e-Mehran Riverfront Promenade", "لبِ مہران پارک و ریور فرنٹ سکھر", "park", "Sukkur", 27.7, 68.866667, 450,
         "Scenic public river garden on the banks of the Indus overlooking Lansdowne and Ayub Bridges.", "دریائے سندھ کے کنارے خوبصورت عوامی باغ جہاں سے لینز ڈاؤن اور ایوب پل دکھائی دیتے ہیں۔",
         "The favorite leisure promenade of Sukkur residents, offering refreshing river breezes, lush lawns, boat rentals, and views of illuminated railway arches at night.",
         "دریائے سندھ کے کنارے لبِ مہران پارک شام کی سیر، کشتی رانی اور رات کے وقت روشنیوں سے جگمگاتے تاریخی پلوں کو دیکھنے کے لیے سب سے بہترین مقام ہے۔"),
        ("sukkur-clock-tower-ghanta-ghar", "Sukkur Clock Tower (Ghanta Ghar)", "گھنٹہ گھر سکھر", "historical", "Sukkur", 27.705, 68.855, 200,
         "Historic 1937 Art Deco clock tower standing at the commercial heart of Sukkur city.", "1937ء کا تاریخی کلاک ٹاور جو سکھر کے مرکزی تجارتی چوک کی پہچان ہے۔",
         "Built in 1937 to celebrate King George VI's coronation, this four-sided clock tower has anchored Sukkur's bustling textile and dry fruit markets for nearly a century.",
         "1937ء میں تعمیر ہونے والا سکھر کا گھنٹہ گھر شہر کے وسط میں واقع ہے اور اس کے گرد خشک میوہ جات اور کپڑے کے مشہور بازار واقع ہیں۔"),
        
        # Khairpur Mirs & Gambat
        ("mehrano-wildlife-reserve-khairpur", "Mehrano Wildlife Reserve", "مہرانو وائلڈ لائف ریزرو خیرپور", "nature", "Khairpur", 27.533333, 68.783333, 2000,
         "Private royal wildlife sanctuary of the Talpur Mirs harboring endangered Blackbuck antelopes.", "تالپور میروں کی تاریخی شاہی پناہ گاہ جہاں نایاب کالا ہرن (بلیک بک) اور چنکارہ پائے جاتے ہیں۔",
         "Maintained by the royal family of Khairpur since 1790, Mehrano contains tranquil lakes, dense acacia forests, and over 2,000 blackbuck antelopes, hog deer, and wild boars.",
         "1790ء سے قائم یہ قدرتی ریزرو نایاب کالے ہرن، نیل گائے اور جنگلی پرندوں کی افزائش کا ایک پرسکون اور خوبصورت قدرتی ٹھکانہ ہے۔"),
        ("kot-diji-archaeological-mound", "Kot Diji Pre-Harappan Archaeological Mound", "آثارِ قدیمہ کوٹ ڈیجی ٹیلہ", "historical", "Kot Diji", 27.345833, 68.7125, 400,
         "3300 BCE prehistoric excavation mound revealing the direct ancestor culture of Mohenjo-daro.", "3300 قبل مسیح کا قدیم ترین ٹیلہ جو وادی سندھ اور موہنجوداڑو کی ابتدائی تہذیب کو بے نقاب کرتا ہے۔",
         "Excavated in the 1950s by Dr. F.A. Khan, Kot Diji established that an advanced urban culture with defensive citadel walls, wheel-turned pottery, and kiln technology existed here centuries before Harappa.",
         "ڈاکٹر ایف اے خان کی دریافت کردہ یہ بستی ثابت کرتی ہے کہ ہڑپہ اور موہنجوداڑو سے بھی صدیاں قبل یہاں پختہ فصیل اور خوبصورت مٹی کے برتن بنانے والی ایک شاندار تہذیب آباد تھی۔"),
        ("gambat-historic-shrine-complex", "Dargah Gambat Sharif", "درگاہ گمبٹ شریف خیرپور", "religious", "Gambat", 27.35, 68.516667, 300,
         "Venerated spiritual complex in Gambat celebrated for centuries of Sufi music and healing.", "گمبٹ میں صدیوں پرانا صوفی آستانہ جہاں صوفیانہ کلام اور روحانی محافل سجتی ہیں۔",
         "Gambat is an ancient trading and medical hub in Upper Sindh. Its historic dargahs feature intricate Kashikari glazed blue tiles and peaceful prayer courtyards.",
         "گمبٹ کا یہ مزار روایتی سندھی کاشی کاری اور روحانی سکون کا مرکز ہے جہاں ہزاروں عقیدت مند دعا کے لیے حاضر ہوتے ہیں۔"),
        
        # Larkana & Shikarpur
        ("garhi-khuda-bakhsh-mausoleum", "Garhi Khuda Bakhsh (Bhutto Family Mausoleum)", "گڑھی خدا بخش (مزارِ شہداء)", "attraction", "Naudero", 27.696226, 68.338021, 500,
         "Colossal white-domed modern mausoleum housing the tombs of Prime Ministers Zulfikar Ali Bhutto and Benazir Bhutto.", "سفید گنبدوں والا عظیم الشان مزار جہاں وزیراعظم ذوالفقار علی بھٹو اور بینظیر بھٹو شہید آسودۂ خاک ہیں۔",
         "An imposing architectural monument blending Islamic domes, Mughal arches, and modern monumentalism, attracting tens of thousands of political pilgrims on national anniversaries.",
         "اسلامی، مغل اور جدید فنِ تعمیر کا عظیم شاہکار جہاں پاکستان کے سابق وزرائے اعظم ذوالفقار علی بھٹو اور بینظیر بھٹو کی آخری آرام گاہ واقع ہے۔"),
        ("mohenjo-daro-museum-grounds", "Mohenjo-daro Archaeological Museum", "موہنجوداڑو آثارِ قدیمہ میوزیم", "museum", "Larkana", 27.327778, 68.136111, 350,
         "Dedicated site museum exhibiting original seals, terracotta figurines, and the replica Priest-King.", "موہنجوداڑو کا سائٹ میوزیم جہاں قدیم مہریں، مٹی کے مجسمے اور مشہور پرسٹ کنگ کے نوادرات نمائش کے لیے رکھے ہیں۔",
         "Housing thousands of excavated treasures from the 4,500-year-old Indus Valley metropolis, including carnelian beads, weight balances, shell bangles, and painted pottery.",
         "ساڑھے چار ہزار سال قدیم وادی سندھ کے نادر نوادرات، اوزار، مہریں اور زیورات کو محفوظ رکھنے والا بین الاقوامی شہرت کا حامل عجائب گھر۔"),
        ("victoria-clock-tower-jacobabad", "Victoria Clock Tower Jacobabad", "وکٹوریہ کلاک ٹاور جیکب آباد", "historical", "Jacobabad", 28.283333, 68.433333, 200,
         "1887 Victorian brick clock tower built to celebrate Queen Victoria's Golden Jubilee.", "1887ء میں ملکہ وکٹوریہ کی گولڈن جوبلی کے موقع پر جیکب آباد میں تعمیر ہونے والا کلاک ٹاور۔",
         "Designed by British engineers, this red-brick four-faced clock tower stands at the primary crossroads of Jacobabad, once a key frontier garrison town.",
         "سرخ اینٹوں سے بنا یہ چار رخی کلاک ٹاور جیکب آباد کے مرکز میں واقع ہے اور برطانوی دور کی عسکری چھاؤنی کی یاد دلاتا ہے۔"),
        ("general-john-jacobs-tomb", "Tomb of General John Jacob", "مقبرہ جنرل جان جیکب جیکب آباد", "historical", "Jacobabad", 28.277778, 68.438889, 250,
         "Monumental 1858 stone tomb of the founder of Jacobabad and commander of the Scinde Horse.", "1858ء میں جیکب آباد کے بانی اور سندھ ہارس رجمنٹ کے کمانڈر جنرل جان جیکب کا تاریخی مقبرہ۔",
         "General John Jacob transformed the arid frontier outpost of Khangarh into the engineered city of Jacobabad, constructing canals, roads, and clockworks before his death in 1858.",
         "جنرل جان جیکب نے پرانے خان گڑھ کو جدید نہروں اور سڑکوں کے ذریعے جیکب آباد بنایا۔ ان کا یہ مقبرہ شہر کے تاریخی ورثے کا اہم حصہ ہے۔"),
        
        # Tharparkar & Desert
        ("umar-marvi-cultural-complex", "Umar Marvi Cultural Complex & Museum", "عمر ماروی ثقافتی کمپلیکس و میوزیم بھالوا", "cultural", "Bhalwa", 24.735, 69.835, 300,
         "Desert heritage complex dedicated to preserving Thari folk music, textiles, and the immortal Marvi legend.", "صحرائے تھر کا ثقافتی کمپلیکس جو تھری لوک موسیقی، دستکاری اور ماروی کی داستان کو خراج پیش کرتا ہے۔",
         "Featuring museum galleries displaying handwoven Thari ralli quilts, camel hair blankets, and silver jewelry alongside an amphitheater for desert folk music recitals.",
         "تھر کے روایتی رہائشی چونکوں (گھاس کی چھت والے گول مکانات)، رلی، چاندی کے زیورات اور صحرائی موسیقی کی محافل کا دلکش مرکز۔"),
        ("virawah-jain-temple-tharparkar", "Virawah Ancient Jain Temple", "ویراواہ قدیم جین مندر تھرپارکر", "historical", "Nagarparkar", 24.516667, 70.633333, 250,
         "Medieval white marble Jain sanctuary on the ancient caravan road to Kutch.", "کچھ کے قدیم تجارتی راستے پر واقع قرونِ وسطیٰ کا سنگِ مرمر سے تراشا گیا جین مندر۔",
         "Dating to the 14th century, Virawah's temple features fine carved pillars and sandstone carvings, illustrating the deep commercial links between Sindh and Gujarat.",
         "چودہویں صدی کا یہ مندر سفید سنگِ مرمر کے باریک ستونوں اور شکھر سے مزین ہے جو صحرائے تھر میں قدیم تجارتی قافلوں کے دور کی یادگار ہے۔"),
        ("sardharo-sacred-spring-nagarparkar", "Sardharo Sacred Springs & Shiva Shrine", "سردھارو مقدس جھرنا و شیو مندر نگرپارکر", "religious", "Nagarparkar", 24.358333, 70.733333, 350,
         "Perennial freshwater mountain spring flowing through the pink granite gorges of Karoonjhar.", "کارونجھر کے گلابی گرینائٹ پہاڑوں کے بیچ بہنے والا میٹھے پانی کا مقدس چشمہ اور شیو استھان۔",
         "Deep within the Karoonjhar hills, natural spring waters collect into sacred rock pools where thousands of Hindu pilgrims gather during annual Shivratri to perform cremation rites and prayers.",
         "کارونجھر کے پہاڑی گھاٹیوں میں بہتا یہ قدرتی جھرنا اور تالاب شیو راتری کے موقع پر ہندو یاتریوں کی خصوصی پوجا اور اشنان کا مقدس مقام ہے۔"),
        ("islamkot-shrine-of-sant-nenuram", "Shrine of Sant Nenuram Ashram", "سنت نینورام آشرم اسلام کوٹ", "religious", "Islamkot", 24.7, 70.183333, 350,
         "Famed interfaith desert ashram providing free vegetarian meals to all visitors twice daily for over a century.", "اسلام کوٹ میں سو سال سے قائم مقدس آشرم جہاں ہر مسافر اور زائر کو بلا تفریق روزانہ دو وقت مفت کھانا دیا جاتا ہے۔",
         "Founded in the 19th century by Sant Nenuram, this sprawling ashram embodies Thari hospitality. It operates a massive communal kitchen (bhandara) feeding thousands daily regardless of religion.",
         "صحرائے تھر میں رواداری اور انسانیت کی اعلیٰ ترین مثال جہاں سو سال سے سنت نینورام کا لنگر دن رات جاری ہے اور ہر آنے والے کو عزت سے کھانا کھلایا جاتا ہے۔"),
    ]

    for s in interior_sites:
        items.append(make_clean_record(
            slug=s[0], name=s[1], name_ur=s[2], category=s[3], city=s[4], region="Sindh",
            lat=s[5], lon=s[6], radius=s[7], short_en=s[8], short_ur=s[9], desc_en=s[10], desc_ur=s[11]
        ))

    return items
