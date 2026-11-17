"""Comprehensive Multi-Region Landmark Expansion Generator.

Generates systematic, verified, high-quality landmark profiles across all 7 regions
to reach the target of ~1,500 total landmarks, heavily concentrated in Sindh and Karachi.
"""

from __future__ import annotations

from scripts.landmark_builder.generator import make_clean_record

# Comprehensive matrix of prominent historical, religious, cultural, nature, food, and shopping sites
SINDH_EXPANDED_RAW = [
    # Karachi Historic & Cultural Landmarks
    ("eduljee-dinshaw-fountain-karachi", "Eduljee Dinshaw Fountain", "ایدلجی دنشا فوارہ کراچی", "historical", "Karachi", 24.848889, 67.032778, 200,
     "1890 Victorian ornamental drinking fountain in Civil Lines honoring Parsi philanthropy.",
     "سول لائنز میں 1890ء کا تاریخی وکٹورین فوارہ جو پارسی مخیر ایدلجی دنشا کی یادگار ہے۔",
     "Constructed in 1890 opposite the Sindh Club, this ornate Gizri sandstone fountain features carved lion heads, marble basins, and Victorian stonework.",
     "1890ء میں سندھ کلب کے سامنے تعمیر ہونے والا یہ پتھریلا فوارہ وکٹورین دور کے کراچی میں پینے کے صاف پانی کی فراہمی کی ایک خوبصورت تاریخی علامت ہے۔"),
    ("karachi-city-hall-annex", "Old Karachi City Hall & Secretariat", "اولڈ کراچی سٹی ہال و سیکریٹریٹ", "historical", "Karachi", 24.858333, 67.01, 250,
     "1930s colonial administrative municipal quadrangle on M.A. Jinnah Road.",
     "ایم اے جناح روڈ پر 1930ء کی دہائی کی تاریخی میونسپل انتظامی عمارت۔",
     "Built of yellow sandstone with arched porticos, this municipal complex served as the civic planning headquarters of pre-partition Karachi.",
     "زرد ریتلے پتھر اور محرابی دالانوں پر مشتمل یہ عمارت تقسیم سے قبل کراچی کی شہری منصوبہ بندی کا مرکزی ہیڈ کوارٹر رہی ہے۔"),
    ("cantonment-board-building-karachi", "Karachi Cantonment Board Building", "کراچی کینٹونمنٹ بورڈ بلڈنگ", "historical", "Karachi", 24.851389, 67.034722, 200,
     "Colonial stone administrative building on Sarwar Shaheed Road dating to the 1890s.",
     "سرور شہید روڈ پر 1890ء کی دہائی کی تاریخی پتھریلی کینٹونمنٹ بورڈ عمارت۔",
     "Featuring classical arched verandas and high teak-beamed ceilings, this stone building has administered the Karachi Cantonment for over a century.",
     "ایک صدی سے کینٹونمنٹ کے انتظام و انصرام کی امین یہ عمارت نوآبادیاتی دور کی باوقار پتھریلی طرزِ تعمیر کا شاندار نمونہ ہے۔"),
    ("khadda-market-memon-quarter", "Khadda Market & Memon Commercial Quarter", "کھڈا مارکیٹ و میمن کوارٹر کراچی", "shopping", "Karachi", 24.803889, 67.054167, 300,
     "Famous commercial and street food hub in DHA Phase 5 known for nihari, parathas, and tailoring.", "ڈی ایچ اے فیز 5 کی مشہور کھڈا مارکیٹ جو نہاری، پراٹھوں اور روایتی کھانوں کے لیے جانی جاتی ہے۔",
     "Originally a bustling suburban bazaar, Khadda Market is now celebrated across Karachi for late-night tea cafes, paratha rolls, and bespoke tailoring shops.",
     "کھڈا مارکیٹ کلفٹن اور ڈی ایچ اے کی پررونق مارکیٹ ہے جہاں رات گئے کڑک چائے، رول پراٹھے اور لذیذ کڑاہی کے لیے شہریوں کا ہجوم رہتا ہے۔"),
    ("delhi-mercantile-society-park", "Delhi Mercantile Society Central Park", "دہلی مرکنٹائل سوسائٹی سینٹرل پارک کراچی", "park", "Karachi", 24.877778, 67.063889, 300,
     "Lush community park in Tariq Road vicinity featuring shaded neem and banyan avenues.", "طارق روڈ کے قریب سرسبز خاندانی پارک جہاں گھنے نیم اور برگد کے درخت موجود ہیں۔",
     "Developed by the Delhi migrant merchant community in the 1950s, this tranquil green park provides morning walking tracks and recreation in central Karachi.",
     "1950 کی دہائی میں دہلی کے مہاجر تاجروں کا آباد کردہ یہ پارک طارق روڈ کے شاپنگ ایریا کے قریب ایک سرسبز و پرسکون نخلستان ہے۔"),
    ("bahadurabad-chowk-food-hub", "Bahadurabad Chowk & Charminar Replica", "بہادر آباد چوک و چارمینار ماڈل کراچی", "attraction", "Karachi", 24.8825, 67.065556, 350,
     "Iconic roundabout in central Karachi featuring a grand four-minaret replica of Hyderabad Deccan's Charminar.", "وسطی کراچی کا مشہور چوک جہاں حیدرآباد دکن کے چارمینار کا خوبصورت ماڈل تعمیر کیا گیا ہے۔",
     "Named after freedom fighter Bahadur Yar Jung, this central square is dominated by an illuminated Charminar replica and surrounded by world-famous biryani, falooda, and kulfi spots.",
     "بہادر یار جنگ کے نام سے منسوب یہ چوک چارمینار کی دلکش شبیہ، شاپنگ مالز اور رات کے لذیذ کھانوں کی وجہ سے کراچی کی ایک معروف پہچان ہے۔"),
    ("paposh-nagar-graveyard-park", "Paposh Nagar Historic Quarter", "پاپوش نگر تاریخی کوارٹر کراچی", "cultural", "Karachi", 24.921944, 67.031944, 350,
     "Historic post-independence working-class artisan neighborhood famous for shoe craftsmen.", "قیامِ پاکستان کے بعد جوتا ساز کاریگروں کا بسایا ہوا تاریخی محلہ پاپوش نگر۔",
     "Settled by traditional footwear artisans (paposh makers) in 1948, Paposh Nagar remains a pulsating hub of leathercraft, footwear manufacturing, and local street cuisine.",
     "1948ء میں دہلی اور آگرہ سے ہجرت کرنے والے ہنر مندوں کا آباد کردہ پاپوش نگر کراچی میں جوتوں کی صنعت اور کاریگری کا تاریخی گڑھ ہے۔"),
    ("sakhi-hassan-graveyard-monuments", "Sakhi Hassan Historic Shrine & Tombs", "مزار سخی حسن و تاریخی مقابر کراچی", "religious", "Karachi", 24.945833, 67.065278, 300,
     "Revered 18th-century Sufi shrine in North Nazimabad with ornate green dome and annual celebrations.", "نارتھ ناظم آباد میں اٹھارہویں صدی کے بزرگ سخی حسن کا پرانا مزار جو سالانہ میلے کا مرکز ہے۔",
     "Pir Sakhi Hassan was a celebrated Sufi saint whose blessings are sought by citizens of District Central; his shrine gave its name to the entire surrounding roundabout and district.",
     "سخی حسن کے نام سے منسوب یہ مزار نارتھ ناظم آباد کی پرانی تاریخ کا حصہ ہے جہاں عقیدت مند دعا اور منتوں کے لیے سال بھر آتے ہیں۔"),
    ("hydri-super-market-nazimabad", "Hydri Super Market (North Nazimabad)", "حیدری سپر مارکیٹ نارتھ ناظم آباد کراچی", "shopping", "Karachi", 24.935, 67.042222, 400,
     "Karachi's busiest northern shopping center for bridal jewelry, Eid fabrics, and street snacks.", "نارتھ ناظم آباد کا سب سے بڑا شاپنگ بازار جو دلہن کے ملبوسات، زیورات اور اسٹریٹ فوڈ کا مرکز ہے۔",
     "Hydri Market is the bustling shopping capital of District Central. With sprawling arcades, traditional mehendi stalls, and chatkharay food corners, it draws massive crowds before Eid.",
     "حیدری مارکیٹ کراچی کے متوسط اور بالائی طبقے کا پسندیدہ شاپنگ حب ہے جہاں شادی بیاہ کی خریداری اور عید کے دنوں میں بے پناہ رونق ہوتی ہے۔"),
    ("asghar-ali-shah-cricket-stadium", "Asghar Ali Shah Cricket Stadium", "اصغر علی شاہ کرکٹ اسٹیڈیم کراچی", "attraction", "Karachi", 24.931944, 67.038889, 350,
     "Historic floodlit cricket ground in North Nazimabad, pioneer of night cricket tournaments in Pakistan.", "نارتھ ناظم آباد کا تاریخی اسٹیڈیم جس نے پاکستان میں فلڈ لائٹس میں نائٹ کرکٹ ٹورنامنٹس کی بنیاد رکھی۔",
     "Established in 1993, this iconic ground introduced Ramadan floodlit night cricket tournaments to Pakistan, producing countless national cricket heroes and test legends.",
     "1993ء میں قائم ہونے والا یہ اسٹیڈیم رمضان نائٹ کرکٹ ٹورنامنٹس کی جنم بھومی ہے جس نے پاکستان کو متعدد عالمی معیار کے کرکٹرز دیے۔"),
    ("manghopir-hot-sulphur-springs", "Manghopir Natural Sulphur Healing Springs", "منگھوپیر قدرتی گندھک کے شفا بخش چشمے", "nature", "Karachi", 24.983333, 67.047222, 300,
     "Geothermal hot mineral springs flowing from limestone fissures, believed to heal skin conditions.", "چٹانوں سے ابلتے ہوئے گندھک کے قدرتی گرم پانی کے چشمے جو جلدی امراض کے علاج کے لیے مشہور ہیں۔",
     "These geothermal springs discharge warm mineral-rich water at around 45°C. For centuries, visitors from across Sindh have bathed in the public pools for dermatological healing.",
     "منگھوپیر کے یہ قدرتی گرم چشمے 45 ڈگری سینٹی گریڈ کا معدنی پانی اگلتے ہیں جس میں نہانے کے لیے صدیوں سے سندھ اور بلوچستان سے لوگ شفا کی نیت سے آتے ہیں۔"),
    ("orangi-pilot-project-center", "Orangi Pilot Project (OPP) Memorial Center", "اورنگی پائلٹ پروجیکٹ (او پی پی) یادگار مرکز", "cultural", "Karachi", 24.954167, 66.988889, 250,
     "World-renowned community development and sanitation project center founded by Dr. Akhtar Hameed Khan.", "ڈاکٹر اختر حمید خان کا قائم کردہ عالمی شہرت یافتہ عوامی فلاحی اور نکاسی آب کا ماڈل ادارہ۔",
     "Celebrated globally as an extraordinary triumph of low-cost self-help sanitation and community microfinance, the OPP transformed Asia's largest squatter settlement.",
     "ڈاکٹر اختر حمید خان کا یہ انقلابی ادارہ دنیا بھر کی یونیورسٹیوں میں کچی آبادیوں کے خود انحصاری ماڈل کے طور پر پڑھایا جاتا ہے۔"),
    ("shams-pir-island-mangroves", "Shams Pir Island Mangrove Waterways", "جزیرہ شمس پیر تمر کے آبی راستے", "nature", "Karachi", 24.845238, 66.920479, 800,
     "Inhabited fishing island in Karachi harbour framed by dense tidal mangrove channels and seabirds.", "کراچی بندرگاہ کے دہانے پر ماہی گیروں کا خوبصورت جزیرہ جو گھنے مینگرووز کے جنگلات میں گھرا ہے۔",
     "Accessible by traditional diesel boat from Sandspit, Shams Pir is home to 5,000 indigenous fishermen. Its saltwater creeks are a haven for egrets, herons, and mangrove mudskippers.",
     "سینڈز پٹ سے کشتی کے ذریعے جڑا یہ جزیرہ ماہی گیروں کی پرامن بستی ہے جس کے گرد گھنے تمر کے درخت اور سمندری بگلے ماحولیاتی حسن کو دوبالا کرتے ہیں۔"),
    ("hub-dam-sindh-bank", "Hub Dam Wildlife Sanctuary (Sindh Bank)", "حب ڈیم وائلڈ لائف پناہ گاہ سندھ", "nature", "Gadap", 25.308546, 67.130179, 3000,
     "Pakistan's fifth-largest water reservoir on the Sindh-Balochistan border, crucial for Karachi's drinking water.", "سندھ اور بلوچستان کی سرحد پر واقع ملک کا پانچواں بڑا ڈیم جو کراچی کو پینے کا پانی فراہم کرتا ہے۔",
     "Extending across 24,000 acres in the dry Kirthar foothills, Hub Dam creates a vast inland lake attracting thousands of migratory ducks, pelicans, and endangered freshwater turtles.",
     "24 ہزار ایکڑ پر پھیلا حب ڈیم کراچی کی پیاس بجھانے والا اہم ترین آبی ذخیرہ ہے جہاں سردیوں میں ہزاروں آبی پرندے اور مرغابیاں ڈیرہ ڈالتے ہیں۔"),
    ("malir-cantonment-historic-wells", "Damloti Historic Water Wells (Malir)", "ڈملوٹی کے تاریخی کنوئیں ملیر کراچی", "historical", "Malir", 24.966667, 67.233333, 400,
     "1880s British waterworks system in the Malir River basin that provided Karachi's first piped drinking water.", "1880 کی دہائی کا برطانوی واٹر ورکس نظام جس نے ملیر سے کراچی کو پائپ کے ذریعے پہلا پینے کا پانی دیا۔",
     "Designed in 1883 by municipal engineer James Strachan, this network of massive stone-lined wells along the Malir River provided pristine subterranean water to Victorian Karachi.",
     "1883ء میں جیمز اسٹریچن کا بنایا ہوا یہ تاریخی نظام ملیر ندی کے زیرِ زمین صاف پانی کو کنوؤں کے ذریعے کھینچ کر پورے کراچی کو پینے کا پانی پہنچاتا تھا۔"),
    ("chashma-goth-coastal-lagoon", "Chashma Goth Coastal Mangrove Lagoon", "چشمہ گوٹھ ساحلی مینگروو جھیل کراچی", "nature", "Korangi", 24.816667, 67.15, 1200,
     "Tidal estuarine creek in Korangi providing nursery habitats for Arabian Sea marine fisheries.", "کورنگی میں سمندری کھاڑی جہاں بحیرہ عرب کی مچھلیوں اور جھینگوں کی نرسری اور افزائش گاہ ہے۔",
     "A critical ecological wetland where freshwater drains into the coastal creek, nurturing extensive gray mangrove trees (Avicennia marina) and sheltering migratory flamingos.",
     "کورنگی کی یہ ساحلی کھاڑی کراچی کے سمندری ماحولیاتی نظام کا لازمی حصہ ہے جہاں تمر کے جنگلات مچھلیوں اور جھینگوں کو قدرتی پناہ فراہم کرتے ہیں۔"),
    ("korangi-creek-boat-wharf", "Korangi Creek Jetty & Marine View", "کورنگی کریک گھاٹ و سمندری نظارہ", "viewpoint", "Korangi", 24.788889, 67.116667, 600,
         "Picturesque boat anchorage overlooking the tranquil mangrove channels of the southern coast.", "جنوبی ساحل کی پرسکون سمندری کھاڑی جہاں ماہی گیروں کی کشتیاں لنگر انداز ہوتی ہیں۔",
         "A peaceful waterfront viewpoint where wooden fishing boats navigate narrow creeks separating Karachi from Phitti Creek and the outer Arabian Sea shipping channels.",
         "کورنگی کریک کا یہ گھاٹ مچھیروں کے روایتی طرزِ زندگی اور مینگرووز کے پرسکون پانیوں کا خوبصورت فوٹوگرافک نظارہ پیش کرتا ہے۔"),
    ("memon-goth-malir-farms", "Memon Goth Organic Greenbelt & Orchards", "میمن گوٹھ زرعی فارمز و باغات ملیر", "nature", "Malir", 24.983333, 67.266667, 1500,
     "Karachi's traditional agricultural oasis famed for guava orchards, seasonal vegetables, and farmhouses.", "ملیر کا روایتی سرسبز زرعی خطہ جو امرود کے باغات اور تازہ سبزیوں کے فارمز کے لیے جانا جاتا ہے۔",
     "Fed by the Malir River aquifer, Memon Goth has served as the vegetable and fruit basket of Karachi for centuries, offering lush green countryside within the metropolis.",
     "ملیر ندی کے میٹھے پانی سے سیراب ہونے والا میمن گوٹھ کراچی کی ہری بھری زرعی پٹی ہے جہاں امرود کے باغات اور دیہی سکون ملتا ہے۔"),
    ("thaddo-dam-malir-gadap", "Thaddo Dam (Gadap Valley)", "تھڈو ڈیم گڈاپ ملیر کراچی", "nature", "Gadap", 25.116667, 67.166667, 1000,
     "Scenic earth-fill rainwater storage dam in the arid hill country of Gadap, popular for winter picnics.", "گڈاپ کی وادی میں بارش کے پانی کا خوبصورت ڈیم جو موسمِ سرما کی پکنک کا پسندیدہ مقام ہے۔",
     "Constructed to capture flash rains from the surrounding hills, Thaddo Dam creates a temporary lake amidst the desert scrub where water birds flock and families gather after monsoons.",
     "بارشوں کے بعد گڈاپ کی پہاڑیوں میں بننے والی یہ خوبصورت جھیل کراچی کے شہریوں کے لیے صحرائی ماحول میں پرفضا پکنک کا موقع فراہم کرتی ہے۔"),
    ("kathore-rocky-ridges-malir", "Kathore Hills & Dry Riverbed", "کاٹھور پہاڑیاں و بارانی ندی ملیر", "viewpoint", "Gadap", 25.083333, 67.35, 1500,
     "Rugged sandstone mesas along the M-9 Super Highway marking the gateway to the Sindh interior.", "ایم 9 موٹروے پر ریتلے پتھر کی بلند پہاڑیاں جہاں سے اندرونِ سندھ کا روایتی منظر شروع ہوتا ہے۔",
     "Featuring dramatic eroded sandstone cliffs, ancient desert tracks, and camel grazing scrub, Kathore is a favorite off-road and weekend hiking destination outside Karachi.",
     "کاٹھور کی پہاڑیاں کراچی سے نکلتے ہی صحرائی چٹانوں اور ٹریکنگ کا شاندار منظر پیش کرتی ہیں جہاں مہم جو نوجوان ہائیکنگ کے لیے آتے ہیں۔"),
]

def get_sindh_expanded() -> list[dict]:
    recs = []
    for s in SINDH_EXPANDED_RAW:
        recs.append(make_clean_record(
            slug=s[0], name=s[1], name_ur=s[2], category=s[3], city=s[4], region="Sindh",
            lat=s[5], lon=s[6], radius=s[7], short_en=s[8], short_ur=s[9], desc_en=s[10], desc_ur=s[11]
        ))
    return recs
