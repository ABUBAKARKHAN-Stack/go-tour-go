"""Append final 30 landmarks to punjab_mega.py to reach 350+ total in Punjab."""

import os

dest = os.path.join(os.path.dirname(__file__), "punjab_mega.py")

FINAL_PUNJAB_30 = [
    ("masti-gate-fort-lahore", "Masti Gate Historic Ramparts (Lahore Fort)", "مستی گیٹ تاریخی فصیل و دروازہ لاہور قلعہ", "historical", "Lahore", 31.589444, 74.316667, 300,
     "Historic eastern military gate of Lahore Fort built by Emperor Akbar opposite the Maryam Zamani Mosque.", "شہنشاہ اکبر کا تعمیر کردہ قلعہ لاہور کا مشرقی فوجی دروازہ جو بیگم شاہی مسجد کے سامنے ہے۔",
     "Derived from 'Masjidi Gate' and guarded by heavy semi-circular brick bastions, Masti Gate protected the royal living quarters and emperor's private entrances.",
     "اکبر بادشاہ کے دور کا یہ مضبوط دروازہ مغل قلعے کی مشرقی فصیل کا محافظ تھا جس کے موٹے برج آج بھی پرشکوہ نظر آتے ہیں۔"),
    ("yakki-gate-walled-city", "Yakki Gate (Zaki Gate Walled City Lahore)", "یکی گیٹ (زکی گیٹ) اندرون لاہور", "historical", "Lahore", 31.586111, 74.325, 250,
     "Historic eastern gate of walled Lahore named after saint Pir Zaki who martyred defending the city against Mongols.", "لاہور کا تاریخی مشرقی دروازہ جو منگولوں کے خلاف لڑتے ہوئے شہید ہونے والے درویش پیر زکی کے نام پر ہے۔",
     "Preserving centuries-old neighborhood grain shops, wooden jharokas, and the revered twin shrines of the saint's head and body, Yakki Gate is steeped in ancient urban folklore.",
     "پیر زکی شہید کی یادگار سے منسوب یہ دروازہ پرانے لاہور کی ان گنت کہانیوں اور روایتی محلوں کا تاریخی گواہ ہے۔"),
    ("akbari-gate-spice-market", "Akbari Gate & Imperial Spice Exchange", "اکبری گیٹ و شاہی مصالحہ منڈی اندرون لاہور", "shopping", "Lahore", 31.580556, 74.322222, 350,
     "Asia's historic mega wholesale spice, grain, and herbal medicine market founded by Emperor Akbar.", "ایشیا کی سب سے بڑی تاریخی مصالحہ، اناج اور دیسی ادویات کی ہول سیل منڈی جسے اکبر بادشاہ نے بسایا۔",
     "The primary culinary engine of Pakistan, Akbari Mandi's aromatic lanes trade thousands of tons of turmeric, saffron, cardamom, and mountain herbs every morning.",
     "اکبری منڈی میں قدم رکھتے ہی ہلدی، دار چینی، الائچی اور مرچوں کی تیز خوشبو احساسات پر چھا جاتی ہے اور یہ ایشیا کی سب سے پرانی اور بڑی مصالحہ منڈی ہے۔"),
    ("race-course-park-jilani", "Jilani Park (Race Course Park Lahore)", "جیلانی پارک (ریس کورس پارک) جیل روڈ لاہور", "park", "Lahore", 31.536111, 74.336111, 500,
     "Premier 88-acre civic park on Jail Road famed for annual spring floral exhibitions and riding tracks.", "جیل روڈ پر 88 ایکڑ پر پھیلا ہوا خوبصورت پارک جہاں سالانہ جشنِ بہاراں اور ہارس رائیڈنگ ہوتی ہے۔",
     "Featuring a dramatic artificial lake in the shape of Pakistan's map, landscaped floral clocks, illuminated dancing fountains, and international Chrysanthemum flower shows.",
     "جیلانی پارک کا خوبصورت جاگنگ ٹریک، پاکستان کے نقشے کی طرز پر بنی جھیل اور بہار کے موسم میں لاکھوں رنگ برنگے پھول لاہور کی شان ہیں۔"),
    ("mini-golf-club-gulberg", "Mini Golf & Bowling Club Gulberg", "منی گالف و باؤلنگ کلب گلبرگ لاہور", "attraction", "Lahore", 31.516667, 74.347222, 300,
     "Popular illuminated evening family leisure park in Gulberg featuring 18-hole miniature golf and arcade gaming.", "گلبرگ کا مقبول ترین نائٹ فیملی پارک جہاں منی گالف، ویڈیو گیمز اور کیفے موجود ہیں۔",
     "Surrounded by water features, glowing neon walkways, and fast food dining terraces, this park provides late-night urban recreation for youth and families in central Lahore.",
     "گلبرگ کا منی گالف کلب رات کے وقت فیملیز کے تفریحی لمحوں اور گالف کھیلنے کا ایک پرکشش اور پررونق مقام ہے۔"),
    ("sozo-water-park-jallo", "Sozo Water Park & Wave Pool (Jallo)", "سوزو واٹر پارک و ویو پول جالو لاہور", "attraction", "Lahore", 31.583333, 74.472222, 600,
     "Pakistan's premier mega water theme park featuring giant water slides, lazy rivers, and artificial wave pools.", "پاکستان کا سب سے بڑا واٹر تھیم پارک جہاں دیوہیکل واٹر سلائیڈز اور مصنوعی لہروں کا پول واقع ہے۔",
     "Spanning lush green lawns near Jallo, Sozo offers thrilling water flumes, children's splash pads, and family picnic cabanas providing refreshing summer relief.",
     "سوزو واٹر پارک شدید گرمیوں میں ٹھنڈے پانی میں نہانے اور اونچی سلائیڈز سے پھسلنے کا سنسنی خیز اور پرلطف مقام ہے۔"),
    ("lahore-gymkhana-cricket-ground", "Lahore Gymkhana Historic Cricket Ground (Bagh-e-Jinnah)", "لاہور جمخانہ تاریخی کرکٹ گراؤنڈ باغِ جناح", "historical", "Lahore", 31.55, 74.333333, 400,
     "Historic turf cricket pavilion in Bagh-e-Jinnah where Pakistan played its inaugural home test matches in 1954.", "باغِ جناح میں تاریخی کرکٹ گراؤنڈ جہاں 1954ء میں پاکستان نے اپنا پہلا ہوم ٹیسٹ میچ کھیلا۔",
     "Shaded by majestic century-old oak trees, this historic pitch witnessed legends like Fazal Mahmood, Hanif Mohammad, and Imran Khan, preserving classical colonial pavilion verandas.",
     "فضل محمود کی شاندار باؤلنگ اور حنیف محمد کے ناقابلِ فراموش کھیل کا گواہ یہ تاریخی گراؤنڈ پاکستان کرکٹ کی جنم بھومی مانا جاتا ہے۔"),
    ("model-town-central-library", "Model Town Central Public Library", "ماڈل ٹاؤن سینٹرل پبلک لائبریری لاہور", "cultural", "Lahore", 31.486111, 74.322222, 250,
     "Quiet suburban municipal library holding extensive collections of Urdu literature, newspapers, and archives.", "ماڈل ٹاؤن کی پرسکون عوامی لائبریری جہاں اردو ادب، تاریخ اور اخبارات کا وسیع ریکارڈ موجود ہے۔",
     "Surrounded by tranquil gardens and shaded banyans, this neighborhood library offers quiet research reading desks, children's book sections, and free digital access for scholars.",
     "ماڈل ٹاؤن کی یہ لائبریری طلباء اور ریٹائرڈ شہریوں کا پسندیدہ علمی گوشہ ہے جہاں سکون کے ساتھ مطالعہ کیا جا سکتا ہے۔"),
    ("haram-gate-multan", "Haram Gate Historic Portal & Textile Bazaar (Multan)", "حرم گیٹ تاریخی دروازہ و کپڑا بازار ملتان", "shopping", "Multan", 30.191667, 71.472222, 300,
     "Historic brick gateway of walled Multan opening into traditional cotton Khaddi and embroidery souks.", "فصیل بند ملتان کا تاریخی دروازہ جہاں ہاتھ کی بنی کھاڈی، کڑھائی اور گھریلو کپڑوں کی منڈیاں ہیں۔",
     "Named after the holy ladies (Haram) of the saintly families, this gate leads into lanes filled with hand-block printers, bedspread weavers, and spicy fried street fish stalls.",
     "حرم گیٹ ملتان کے روایتی ہینڈلوم بستروں، اجرک اور روئی کی مصنوعات کی خریداری کا صدیوں پرانا اور مصروف ترین بازار ہے۔"),
    ("bohar-gate-multan", "Bohar Gate (Ancient Banyan Tree Gateway Multan)", "بوہڑ گیٹ (قدیم برگد کا دروازہ) اندرون ملتان", "shopping", "Multan", 30.194444, 71.466667, 300,
     "Historic entry gate of old Multan formerly shaded by an ancient sacred banyan tree, famed for food stalls.", "اندرونِ ملتان کا مشہور دروازہ جو ماضی میں ایک دیوہیکل برگد کے درخت کے سائے میں قائم تھا اور کھانوں کے لیے مشہور ہے۔",
     "Connecting the inner city to the Cantonment, Bohar Gate is packed with traditional jewelers, unstitched fabric stores, and legendary clay-baked tandoori naan bakeries.",
     "بوہڑ گیٹ اندرون ملتان کی رونقوں کا دروازہ ہے جہاں کے خستہ نان، حلوہ پوری اور روایتی کھسے شہریوں میں مقبول ہیں۔"),
    ("pak-gate-multan", "Pak Gate Historic Sufi Quarter (Multan)", "پاک گیٹ تاریخی صوفی محلہ اندرون ملتان", "cultural", "Multan", 30.188889, 71.475, 300,
     "Sacred gateway of walled Multan named after the revered saint Hazrat Sheikh Syed Pir Pak Murrawaj.", "ملتان کا تاریخی دروازہ جو صوفی بزرگ حضرت پیر پاک مروج کے نام سے منسوب ہے۔",
     "Surrounded by ancient brick arches and cobblestone lanes, Pak Gate holds historic madrasas, perfume ateliers, and shrines that have radiated spiritual scholarship for centuries.",
     "پاک گیٹ ملتان کے صوفیانہ تقدس کی علامت ہے جس کی تنگ گلیوں میں عطر کی خوشبو اور ذکر کی صدائیں گونجتی ہیں۔"),
    ("lohari-gate-multan", "Lohari Gate (Ironmongers & Crafts Portal Multan)", "لوہاری گیٹ لوہاروں کا تاریخی دروازہ ملتان", "shopping", "Multan", 30.194444, 71.463889, 300,
     "Historic western gateway of walled Multan housing traditional blacksmiths, copper artisans, and utensils.", "فصیل بند ملتان کا مغربی دروازہ جہاں روایتی لوہار، تانبے اور پیتل کے برتن ساز بیٹھتے ہیں۔",
     "The artisanal metal hub of southern Punjab, Lohari Gate features master metalworkers hand-hammering copper pots, cauldrons (degs), and farming tools using techniques unchanged for centuries.",
     "لوہاری گیٹ کے لوہار اور تانبے کے برتن بنانے والے کاریگر اپنی محنت اور ہنر سے ملتان کی دستکاری کو زندہ رکھے ہوئے ہیں۔"),
    ("multan-arts-council-complex", "Multan Arts Council & Cultural Auditorium", "ملتان آرٹس کونسل و آڈیٹوریم", "cultural", "Multan", 30.194444, 71.455556, 350,
     "Premier cultural and performing arts theater complex of South Punjab near the Multan Cantonment.", "جنوبی پنجاب کا سب سے بڑا ثقافتی و تھیٹر کمپلیکس جہاں ڈرامے، صوفیانہ محافل اور نمائشیں ہوتی ہیں۔",
     "Featuring acoustic theater auditoriums, open-air amphitheatres, and contemporary art galleries, the council hosts the annual National Sufi Festival, Saraiki literature conferences, and artisan exhibitions.",
     "ملتان آرٹس کونسل سرائیکی اور پنجابی ادب، صوفیانہ راگ اور تھیٹر کے ذریعے جنوبی پنجاب کی زرخیز ثقافت کو فروغ دینے کا بنیادی ادارہ ہے۔"),
    ("bibi-pak-daman-multan", "Shrine of Bibi Pak Daman (Multan)", "درگاہ بی بی پاک دامن ملتان", "religious", "Multan", 30.188889, 71.469444, 300,
     "Ancient spiritual resting place of pious women saints of the early Islamic period in Multan.", "ملتان کے ابتدائی اسلامی دور کی نیک اور پردہ دار بزرگ خواتین کا مقدس تاریخی مزار۔",
     "Revered for centuries by women seeking prayers for family blessings, this peaceful whitewashed shrine features a cool shaded courtyard and sacred oil-lamp niches.",
     "بی بی پاک دامن کی درگاہ خواتین کی دعاؤں اور روحانی تسکین کا وہ پرسکون مقام ہے جہاں چراغ جلا کر مرادیں مانگی جاتی ہیں۔"),
    ("chenab-river-bridge-multan", "Chenab River Historic Highway Bridge (Multan)", "دریائے چناب تاریخی ہائی وے پل و نظارہ ملتان", "nature", "Multan", 30.183333, 71.366667, 600,
     "Sweeping river crossing on the Chenab River connecting Multan to Muzaffargarh, famed for river fish.", "دریائے چناب کا وہ وسیع پل جو ملتان کو مظفر گڑھ سے ملاتا ہے اور تازہ مچھلی کے کھانوں کا مرکز ہے۔",
     "Offering dramatic vistas of the wide riverbed during monsoon floods, the bridge promenade is lined with dhabas serving crispy fried Rahu and Singhara fish fresh from river nets.",
     "دریائے چناب پر شام کے وقت ٹھنڈی ہوا کھانے اور کنارے بیٹھ کر دریا کی تازہ تلی ہوئی مچھلی کھانا ملتانیوں کا پسندیدہ مشغلہ ہے۔"),
    ("bijnot-fort-desert-bastions", "Bijnot Fort Ancient Desert Bastions (Cholistan)", "بجنوت قلعہ قدیم صحرائی برج چولستان بہاولپور", "historical", "Bahawalpur", 28.083333, 71.75, 600,
     "Mysterious medieval desert fortress constructed from black and red bricks near the Indian border.", "پاک بھارت سرحد کے قریب سرخ اور سیاہ اینٹوں سے بنا پر اسرار قرونِ وسطیٰ کا صحرائی قلعہ۔",
     "Surrounded by vast sweeping dunes, Bijnot's collapsed circular bastions, lime plaster rooms, and underground rainwater cisterns guard ancient forgotten caravan routes crossing the great desert.",
     "صحرائے چولستان کی دور افتادہ تنہائی میں کھڑا بجنوت قلعہ مہم جو سیاحوں کے لیے ایک سحر انگیز منزل ہے جس کے برج صحرا کی خاموشی میں گم ہیں۔"),
    ("khangarh-fort-ruins-cholistan", "Khangarh Fort Historic Desert Ruins (Cholistan)", "خان گڑھ قلعہ تاریخی صحرائی کھنڈرات چولستان بہاولپور", "historical", "Bahawalpur", 28.383333, 71.55, 500,
     "1783 desert frontier fortress built by Nawab Muhammad Bahawal Khan II to secure caravan water points.", "1783ء میں نواب محمد بہاول خان دوم کا تعمیر کردہ صحرائی قلعہ جو پانی کے کنوؤں کی حفاظت کے لیے بنا۔",
     "Constructed with thick mud and fired-brick walls, Khangarh retains deep arched gates and elevated corner watchtowers that surveyed nomadic movements across the southern Cholistan frontier.",
     "خان گڑھ کا یہ قلعہ چولستان کے ریتلے میدانوں میں نوابین کی عسکری حکمتِ عملی اور صحرائی دفاع کا اہم تاریخی گواہ ہے۔"),
    ("dring-stadium-bahawalpur", "Dring Stadium Olympic Sports Enclave (Bahawalpur)", "ڈرنگ اسٹیڈیم اسپورٹس کمپلیکس بہاولپور", "cultural", "Bahawalpur", 29.394444, 71.691667, 500,
     "Historic 1952 multi-sports complex and athletics stadium gifted by Nawab Sir Sadiq Muhammad Khan V.", "1952ء میں نواب سر صادق محمد خان پنجم کا ریاست کو تحفہ کردہ عظیم ملٹی اسپورٹس اسٹیڈیم۔",
     "One of the first modern sports stadiums built in newly independent Pakistan, Dring Stadium features cycling velodromes, cricket pitches, hockey turf, and swimming pools that nurtured national athletes.",
     "بہاولپور کا ڈرنگ اسٹیڈیم ملکی کھیلوں کی تاریخ کا قابلِ فخر باب ہے جس نے ہاکی اور ایتھلیٹکس کے چیمپئنز پیدا کیے۔"),
    ("farid-gate-bahawalpur", "Farid Gate Historic City Gateway (Bahawalpur)", "فرید گیٹ تاریخی دروازہ و مرکزی بازار بہاولپور", "shopping", "Bahawalpur", 29.394444, 71.677778, 350,
     "The principal historic gateway of walled Bahawalpur named after saint Baba Farid Ganjshakar.", "فصیل بند بہاولپور کا مرکزی دروازہ جو بابا فرید گنج شکر کے نام سے منسوب ہے اور بازار کا دہانہ ہے۔",
     "Leading into Shahi Bazaar, Farid Gate is an architectural portal bustling day and night with stores selling traditional Bahawalpuri chunri dupattas, embroidered khussa shoes, and sweets.",
     "فرید گیٹ بہاولپور کے روایتی بازاروں کا داخلی دروازہ ہے جہاں رنگ برنگی چونری، کڑھائی والے کھسے اور روایتی مٹھائیاں خریداروں کو اپنی طرف کھینچتی ہیں۔"),
    ("shahi-bazaar-bahawalpur-crafts", "Shahi Bazaar Historic Chunri & Khussa Market", "شاہی بازار تاریخی چونری و کھسہ مارکیٹ بہاولپور", "shopping", "Bahawalpur", 29.397222, 71.675, 350,
     "Centuries-old royal market famed for delicate tie-and-dye Chunri silks, hand-embroidered shoes, and brass.", "شاہی دور کا بازار جو ہاتھ کی بنی ٹائی اینڈ ڈائی چونری، کشیدہ کاری والے کھسوں اور پیتل کے برتنوں کا گڑھ ہے۔",
     "The beating artisanal heart of Bahawalpur, where women shop for vibrant bandhani dupattas, pure silver filigree ornaments, and multi-colored velvet slippers made by hereditary palace master shoemakers.",
     "بہاولپور کی چونری اور کھسہ پوری دنیا میں پہچانے جاتے ہیں، اور شاہی بازار ان روایتی دستکاریوں کی خریداری کا سب سے معتبر اور دلکش مقام ہے۔"),
    ("central-library-bahawalpur", "Central Library Bahawalpur (Victorian Gothic Palace)", "سینٹرل لائبریری بہاولپور (وکٹورین گوتھک کتب خانہ)", "cultural", "Bahawalpur", 29.397222, 71.688889, 350,
     "1924 Victorian Gothic stone reading palace holding over 100,000 rare manuscripts and antique newspapers.", "1924ء کا نوآبادیاتی دور کا خوبصورت گوتھک کتب خانہ جہاں نایاب قلمی نسخے اور پرانے اخبارات محفوظ ہیں۔",
     "Constructed with white marble spires and red Agra sandstone by Nawab Sir Sadiq V, this architectural gem holds complete runs of pre-partition newspapers, Quranic manuscripts, and a serene reading rotunda.",
     "بہاولپور کی یہ لائبریری اپنے شاندار گوتھک میناروں اور پرسکون ہالز کے ساتھ پاکستان کے خوبصورت ترین اور امیر ترین کتب خانوں میں شمار ہوتی ہے۔"),
    ("cholistan-desert-jeep-rally-track", "Cholistan Desert International Jeep Rally Track", "صحرائے چولستان بین الاقوامی جیپ ریلی ٹریک بہاولپور", "attraction", "Bahawalpur", 28.766667, 71.35, 1500,
     "World-famous 500-kilometer desert motorsport track centered on Derawar Fort, drawing global off-road racers.", "قلعہ دراوڑ کے گرد 500 کلومیٹر لمبا بین الاقوامی صحرائی موٹر اسپورٹس ٹریک جہاں سالانہ جیپ ریلی ہوتی ہے۔",
     "Every February, hundreds of thousands of spectators camp out in the desert to watch 4x4 off-road racing trucks roar across the sand dunes, accompanied by nightly cultural bonfires and fireworks.",
     "چولستان جیپ ریلی پاکستان کا سب سے بڑا اسپورٹس ایڈونچر فیسٹیول ہے جہاں ریت اڑاتی گاڑیاں اور رات کو صحرا میں جلتے الاؤ ایک مسحور کن میلہ سجاتے ہیں۔"),
    ("sialkot-fort-ramparts", "Sialkot Fort Ancient Ramparts (Raja Salban Citadel)", "سیالکوٹ قلعہ قدیم فصیل (راجہ سالبان کا قلعہ)", "historical", "Sialkot", 32.497222, 74.536111, 400,
     "Ancient 2nd-century CE fortified hill citadel in the center of Sialkot founded by Raja Salban.", "سیالکوٹ کے وسط میں اونچے ٹیلے پر واقع دوسری صدی کا قدیم قلعہ جسے راجہ سالبان نے تعمیر کروایا تھا۔",
     "Perched atop a natural mound commanding 360-degree views over Sialkot, this historic citadel preserves centuries of brick defense walls, ancient watchtowers, and modern public municipal gardens.",
     "راجہ رسالو اور سالبان کی داستانوں سے جڑا یہ تاریخی قلعہ سیالکوٹ کا قدیم ترین سنگِ میل ہے جس کے اوپر سے پورے شہر کا نظارہ نظر آتا ہے۔"),
    ("iqbal-stadium-faisalabad", "Iqbal Stadium (Historic Test Cricket Ground Faisalabad)", "اقبال اسٹیڈیم (تاریخی ٹیسٹ کرکٹ گراؤنڈ) فیصل آباد", "attraction", "Faisalabad", 31.408333, 73.083333, 500,
     "Historic 25,000-seat international test cricket venue in Faisalabad that hosted seminal world cricket battles.", "فیصل آباد کا 25 ہزار تماشائیوں کی گنجائش والا تاریخی کرکٹ گراؤنڈ جہاں سنسنی خیز ٹیسٹ مقابلے ہوئے۔",
     "Host to historic matches including legendary innings by Sachin Tendulkar, Waqar Younis, and Inzamam-ul-Haq, Iqbal Stadium is the sporting pride of District Faisalabad.",
     "وقار یونس کی تباہ کن باؤلنگ اور ٹنڈولکر کے اولین ٹیسٹ میچ کا میزبان یہ گراؤنڈ پاکستان کرکٹ کی تاریخ کا ایک اہم اور یادگار میدان ہے۔")
]

# Read existing lines from punjab_mega.py
with open(dest, "r", encoding="utf-8") as f:
    text = f.read()

# Insert before ']'
marker = "]"
idx = text.rfind(marker)
if idx != -1:
    additional_str = "\n" + "\n".join(f"    {repr(t)}," for t in FINAL_PUNJAB_30) + "\n"
    new_text = text[:idx] + additional_str + text[idx:]
    with open(dest, "w", encoding="utf-8") as f:
        f.write(new_text)
    print(f"Appended {len(FINAL_PUNJAB_30)} final landmarks to punjab_mega.py successfully!")
else:
    print("Marker not found!")
