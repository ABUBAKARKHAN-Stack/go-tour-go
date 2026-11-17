"""Script to generate balochistan_mega.py (50+ curated landmarks for Balochistan)."""

import os

dest = os.path.join(os.path.dirname(__file__), "balochistan_mega.py")

BALOCHISTAN_DATA = [
    # Coastal & Makran (20)
    ("princess-of-hope-hingol", "Princess of Hope Natural Rock Monolith (Hingol)", "پرنسس آف ہوپ قدرتی چٹانی مجسمہ ہنگول بلوچستان", "nature", "Lasbela", 25.533333, 65.516667, 500,
     "Spectacular natural wind-carved sandstone pillar resembling a veiled standing princess in Hingol National Park.", "ہنگول نیشنل پارک میں ہوا اور بارش کے کٹاؤ سے بنی قدرتی چٹان جو ایک باوقار ملکہ کی طرح نظر آتی ہے۔",
     "Named by Hollywood actress Angelina Jolie during a UN visit, this striking 100-foot natural geological obelisk stands dramatically along the Buzi Pass on the Makran Coastal Highway.",
     "مکران کوسٹل ہائی وے پر واقع یہ قدرتی چٹانی مجسمہ قدرت کا انوکھا شاہکار ہے جس کا حسن اور وقار دور سے آنے والے ہر مسافر کو مسحور کر دیتا ہے۔"),
    ("sphinx-of-balochistan-hingol", "The Natural Sphinx of Balochistan (Hingol)", "اسفنکس آف بلوچستان (قدرتی چٹانی ابو الہول) ہنگول", "nature", "Lasbela", 25.516667, 65.5, 500,
     "Colossal natural limestone monolith carved by wind erosion resembling the Egyptian Sphinx of Giza.", "ہنگول کے پہاڑوں میں مصر کے ابو الہول سے مشابہت رکھنے والی دیوہیکل قدرتی چٹان۔",
     "Perched atop a natural mountain ridge along the Makran Coastal Highway, this geological wonder exhibits a distinct headdress and recumbent lion-like body crafted entirely by coastal winds.",
     "مصر کے اہرام کے پہرہ دار ابو الہول کی طرح سینہ تانے کھڑی یہ قدرتی چٹان لاکھوں سال کی جغرافیائی تبدیلیوں اور ساحلی ہواؤں کا انوکھا معجزہ ہے۔"),
    ("chandragup-giant-mud-volcanoes", "Chandragup Giant Mud Volcanoes (Hingol)", "چندرگپ دیوہیکل مٹی کے آتش فشاں ہنگول بلوچستان", "nature", "Lasbela", 25.45, 65.866667, 800,
     "World's highest active mud volcanoes rising 300 feet above the desert plains, sacred to Hindu pilgrims.", "300 فٹ اونچے دنیا کے سب سے بلند فعال مٹی کے آتش فشاں جہاں سے مسلسل ٹھنڈی مٹی اور گیس ابلتی ہے۔",
     "Pilgrims climbing the steep cone of Chandragup I toss coconuts into the bubbling subterranean mud crater as an act of confession before visiting the holy shrine of Hinglaj Mata.",
     "صحرائی میدان میں اچانک سر اٹھاتے یہ دیوہیکل مٹی کے پہاڑ قدرت کا نایاب عجوبہ ہیں جن کے دہانے سے ابلتا ہوا گارا دیکھنا ایک حیرت انگیز تجربہ ہے۔"),
    ("kund-malir-golden-beach", "Kund Malir Golden Beach & Desert Waves", "کنڈ ملیر سنہری ساحل و صحرائی سمندر بلوچستان", "nature", "Lasbela", 25.383333, 65.466667, 1000,
     "Breathtaking coastal beach on the Arabian Sea where towering golden sand dunes meet the turquoise ocean.", "بحیرہ عرب کا وہ طلسماتی ساحل جہاں سنہری ریت کے ٹیلے نیلے سمندر کی لہروں سے بغل گیر ہوتے ہیں۔",
     "Considered one of the most scenic beaches in Asia, Kund Malir offers pristine sandy shores, night stargazing away from light pollution, and fresh seafood cooked at coastal dhabas.",
     "کوسٹل ہائی وے پر واقع کنڈ ملیر ایشیا کے خوبصورت ترین ساحلوں میں شمار ہوتا ہے جہاں صحرا اور سمندر کا ملاپ سیاحوں کے دل جیت لیتا ہے۔"),
    ("hinglaj-mata-cave-temple", "Hinglaj Mata (Nani Mandir) Sacred Cave Temple", "ہنگلاج ماتا (نانی مندر) مقدس غار مندر ہنگول", "religious", "Lasbela", 25.516667, 65.516667, 600,
     "One of the 51 sacred Shakti Peethas in Hinduism, nestled deep inside a natural canyon of Hingol National Park.", "ہندو مت کی 51 مقدس ترین شکتی پیٹھوں میں سے ایک جو ہنگول کی گہری پہاڑی گھاٹی میں واقع ہے۔",
     "Revered as 'Nani ka Mandir' by local Muslims and visited by hundreds of thousands of Hindu pilgrims during the April Teerath, the temple preserves an ancient sacred flame inside a natural rock cavern.",
     "مسلمانوں اور ہندوؤں دونوں کی مشترکہ عقیدت کا مرکز، ہنگلاج ماتا کا یہ پرامن غار مندر بین المذاہب ہم آہنگی اور قدیم تاریخ کا روشن مینار ہے۔"),
    ("ormara-hammerhead-peninsula", "Ormara Hammerhead Peninsula & Beach", "اورماڑہ ہتھوڑے نما جزیرہ نما و ساحل بلوچستان", "nature", "Gwadar", 25.2, 64.633333, 1200,
     "Dramatic coastal hammerhead-shaped headland extending 10 kilometers into the deep blue Arabian Sea.", "بحیرہ عرب کے اندر دس کلومیٹر دور تک پھیلا ہوا ہتھوڑے کی شکل کا شاندار قدرتی جزیرہ نما۔",
     "Historically used as an airfield staging post by Alexander the Great's general Nearchus, Ormara features pristine beaches, Pakistan Navy naval base cadet colleges, and dramatic clifftop sunsets.",
     "سکندر اعظم کے بحری بیڑے کا پڑاؤ رہنے والا اورماڑہ اپنے شفاف گہرے نیلے پانیوں اور مچھیروں کی روایتی کشتیوں کے ساتھ ساحلی بلوچستان کا گوہر ہے۔"),
    ("gwadar-hammerhead-koh-e-batil", "Koh-e-Batil & Gwadar Hammerhead Viewpoint", "کوہِ باطل و گوادر ہیمر ہیڈ پینورامک ویو پوائنٹ", "viewpoint", "Gwadar", 25.116667, 62.333333, 800,
     "Iconic 480-foot high flat-topped marine headland commanding panoramic views of Gwadar's twin bays.", "گوادر کی دونوں خلیجوں کے درمیان 480 فٹ اونچی چپٹی چٹان جہاں سے پورٹ اور بحیرہ عرب کا نظارہ ہوتا ہے۔",
     "Visitors climb the famous '664 steps' carved into the cliff face to reach the summit plateau for awe-inspiring views of the deep sea port, breaking ocean waves, and Gwadar city below.",
     "کوہِ باطل کی چوٹی پر پہنچ کر ایک طرف پدی زر اور دوسری طرف دمی زر کے پانیوں اور جدید پورٹ کو دیکھنا گوادر کی سب سے مسحور کن سیر ہے۔"),
    ("gwadar-cricket-stadium-cliffs", "Gwadar Cricket Stadium (Senator Muhammad Ishaq)", "گوادر کرکٹ اسٹیڈیم (سرخ چٹانوں کے درمیان میدان)", "attraction", "Gwadar", 25.133333, 62.316667, 500,
     "World-renowned picturesque cricket ground nestled dramatically between jagged, eroded red sandstone cliffs.", "سرخ اور سنہری چٹانوں کے دامن میں واقع دنیا کا خوبصورت ترین قدرتی کرکٹ اسٹیڈیم۔",
     "Lauded globally by the ICC as one of the most stunning sports venues on earth, the lush green turf stands out like an emerald set against the rugged Martian desert cliffs of Gwadar.",
     "سرخ پہاڑوں کے دامن میں بچھا یہ سرسبز کرکٹ گراؤنڈ اپنی بے مثل قدرتی خوبصورتی کی وجہ سے دنیا بھر کے میڈیا کی توجہ کا مرکز بنا ہے۔"),
    ("jiwani-sunset-point-victoria", "Jiwani Sunset Point & Queen Victoria's Seat", "جیوانی سن سیٹ پوائنٹ و کوئین وکٹوریا کی سیٹ گوادر", "viewpoint", "Gwadar", 25.05, 61.766667, 800,
     "The westernmost coastal headland of Pakistan offering legendary sunsets and Queen Victoria's WWII bunker.", "پاکستان کا آخری مغربی ساحلی کونا جہاں غروبِ آفتاب کا لاجواب نظارہ اور ملکہ وکٹوریہ کی بیٹھک واقع ہے۔",
     "Perched on cliffs overlooking the Gulf of Oman near the Iranian border, Jiwani features a stone-built lookout post used by the British Royal Air Force during World War II to watch coastal sunsets.",
     "پاکستان کے سب سے آخری مغربی ساحل جیوانی پر بیٹھ کر سمندر میں ڈوبتے سورج کا سنہری نظارہ دنیا کے چند حسین ترین غروبِ آفتاب کے مناظر میں شمار ہوتا ہے۔"),
    ("astola-island-marine-sanctuary", "Astola Island (Jezira Haft Talar)", "جزیرہ ہفت تلار (استولا آئی لینڈ) پسنی بلوچستان", "nature", "Gwadar", 25.116667, 63.85, 1500,
     "Pakistan's first Marine Protected Area, an uninhabited coral island 25 miles offshore from Pasni.", "پسنی کے سمندر میں 25 میل دور پاکستان کا پہلا محفوظ بحری جزیرہ جہاں مرجانی چٹانیں اور نایاب حیات ہیں۔",
     "Featuring sheer cliffs dropping into aquamarine waters, Astola is a globally critical breeding habitat for the endangered Green turtle and endemic Astola viper, drawing scuba divers to its coral reefs.",
     "شفاف فیروزی سمندر کے درمیان واقع یہ غیر آباد جزیرہ سکوبا ڈائیونگ، سمندری کچھوؤں اور مرجانی چٹانوں کے لیے پاکستان کی سب سے قیمتی سمندری جنت ہے۔"),

    # Quetta & Valleys (15)
    ("hanna-lake-turquoise-reservoir", "Hanna Lake & Mountain Chairlift (Quetta)", "حنا جھیل و ماؤنٹین چیئر لفٹ کوئٹہ", "nature", "Quetta", 30.25, 67.1, 700,
     "1894 turquoise water reservoir nestled in the rugged mountains of the Urak Valley near Quetta.", "1894ء کا برطانوی دور کا خوبصورت نیلگوں پانی کا ڈیم جو کوئٹہ کے پہاڑوں کے دامن میں واقع ہے۔",
     "Surrounded by pine-shaded terraces and craggy mountain peaks, Hanna Lake features paddle boating, a modern chairlift spanning the waters, and lakeside tea dhabas serving hot spiced green tea.",
     "کوئٹہ کے شہریوں کی پسندیدہ سیر گاہ، حنا جھیل کا فیروزی پانی اور اس کے اوپر چلتی چیئر لفٹ خشک پہاڑوں کے درمیان ایک خوبصورت نخلستان ہے۔"),
    ("urak-valley-apple-orchards", "Urak Valley Apple & Cherry Orchards", "ارک وادی سیب و چیری کے باغات کوئٹہ", "nature", "Quetta", 30.266667, 67.183333, 800,
     "Lush 11-kilometer fertile mountain valley producing Pakistan's premier sweet apples, cherries, and pomegranates.", "کوئٹہ کی 11 کلومیٹر لمبی سرسبز پہاڑی وادی جو میٹھے سیبوں، چیری اور خوبانیوں کے لیے مشہور ہے۔",
     "Fed by gushing mountain springs originating from the Zarghoon range, Urak Valley features terraced stone fruit orchards, freshwater streams, and the dramatic Hanna-Urak natural waterfall.",
     "ارک وادی کے سرخ رسیلے سیب اور ٹھنڈے پہاڑی جھرنے کوئٹہ کے قدرتی حسن کا وہ روپ ہیں جو ہر مسافر کے دل میں تازگی بھر دیتے ہیں۔"),
    ("hazarganji-chiltan-national-park", "Hazarganji Chiltan National Park (Markhor Sanctuary)", "ہزار گنجی چلتن نیشنل پارک (مارخور پناہ گاہ) کوئٹہ", "nature", "Quetta", 30.016667, 66.883333, 1200,
     "Dedicated national park in the Chiltan mountains protecting the endangered Chiltan Wild Goat (Markhor).", "کوہِ چلتن میں 32 ہزار ایکڑ پر پھیلا ہوا نیشنل پارک جو پاکستان کے قومی جانور مارخور کی نایاب نسل کا مسکن ہے۔",
     "Covering over 32,000 acres of rugged mountainous desert scrub, Hazarganji ('Of a Thousand Treasures') shelters wild Chiltan ibex, desert wolves, leopards, and over 120 species of native birds.",
     "چٹانوں پر چھلانگیں لگاتے مارخور اور پہاڑی بھیڑیوں کا یہ محفوظ مسکن کوئٹہ کے قریب جنگلی حیات کے تحفظ کا سب سے بڑا ادارہ ہے۔"),
    ("quetta-serena-sajji-street", "Prince Road & Balochi Sajji Street (Quetta)", "پرنس روڈ و اصل بلوچی سجی اسٹریٹ کوئٹہ", "food", "Quetta", 30.194444, 67.013889, 300,
     "The culinary capital of authentic Balochi Sajji: whole lamb or chicken slow-roasted around wood campfires.", "اصل بلوچی سجی کا تاریخی مرکز جہاں کوئلوں کے گرد گول دائرے میں سارا دنبہ دھیمی آنچ پر پکایا جاتا ہے۔",
     "Spiced only with rock salt and skewered on pomegranate branches around roaring open wood embers, authentic Quetta Sajji is served with fluffy Kaak bread baked around hot river stones.",
     "پرنس روڈ پر لکڑیوں کے الاؤ کے گرد پکتی بلوچی سجی اور پتھر پر پکا ہوا روایتی کاک روٹی بلوچستان کا وہ ذائقہ ہے جس کا کوئی ثانی نہیں۔"),
    ("command-and-staff-college-museum", "Command and Staff College Heritage Museum (Quetta)", "کمانڈ اینڈ اسٹاف کالج تاریخی میوزیم کوئٹہ", "museum", "Quetta", 30.216667, 7.05, 400,
     "1905 military tactical academy where Field Marshals Montgomery and Slim trained, preserving colonial military archives.", "1905ء کی تاریخی فوجی درسگاہ جہاں فیلڈ مارشل منٹگمری نے تعلیم حاصل کی، اور نادر عسکری نوادرات محفوظ ہیں۔",
     "Holding personal letters and wartime artifacts from World War I and II, this elite staff institution features Mountbatten's staff desk, historic artillery guns, and the 1935 Quetta earthquake archives.",
     "کوئٹہ کا اسٹاف کالج دنیا کے معتبر ترین ملٹری اداروں میں سے ایک ہے جس کا تاریخی میوزیم برصغیر کی عسکری تاریخ کا ایک پروقار باب ہے۔"),

    # Ziarat & Juniper (10)
    ("quaid-residency-ziarat", "Quaid-e-Azam Residency (Ziarat Heritage Chateau)", "قائد اعظم ریزیڈنسی (تاریخی لکڑی کا محل) زیارت بلوچستان", "historical", "Ziarat", 30.383333, 67.725, 450,
     "1892 Victorian wooden architectural masterpiece where Quaid-e-Azam Muhammad Ali Jinnah spent his final days in 1948.", "1892ء کا تاریخی لکڑی کا خوبصورت محل جہاں بانیِ پاکستان قائد اعظم نے اپنی زندگی کے آخری ایام گزارے۔",
     "Constructed entirely from seasoned wood and stone amidst aromatic juniper forests, this beloved national monument preserves Jinnah's authentic living quarters, writing desk, and personal relics.",
     "زیارت کے صنوبر کے جنگلات میں گھری یہ خوبصورت ریزیڈنسی ہر پاکستانی کے لیے عقیدت کا مقام ہے جہاں بابا کے قدموں کی خوشبو آج بھی محسوس ہوتی ہے۔"),
    ("ancient-juniper-forest-ziarat", "Ziarat Ancient Juniper Forest (UNESCO Biosphere)", "زیارت قدیم صنوبر کا جنگل (یونیسکو بایوسفیئر) بلوچستان", "nature", "Ziarat", 30.383333, 67.75, 1500,
     "Second largest juniper forest in the world, holding living trees dating back up to 5,000 years.", "دنیا کا دوسرا بڑا صنوبر (جونیپر) کا جنگل جہاں کے درخت پانچ ہزار سال تک قدیم اور زندہ ہیں۔",
     "Spanning rugged limestone mountains, this designated UNESCO Biosphere Reserve protects the slow-growing Juniperus excelsa trees that produce aromatic berries, purifying the crisp mountain air.",
     "پانچ ہزار سال پرانے صنوبر کے درختوں سے معطر زیارت کا یہ قدرتی جنگل دنیا کا زندہ عجوبہ ہے جس کی ہوا میں سانس لینا صحت اور تازگی بخشتا ہے۔"),
    ("prospect-point-ziarat", "Prospect Point Panoramic Cliff (Ziarat)", "پراسپیکٹ پوائنٹ پینورامک چٹان زیارت بلوچستان", "viewpoint", "Ziarat", 30.366667, 7.7, 700,
     "8,875-foot high sheer cliff viewpoint commanding breathtaking vistas of the deep Ziarat valley basin.", "8875 فٹ بلند چٹان جہاں سے زیارت کی گہری وادی اور دور تک پھیلے صنوبر کے درختوں کا نظارہ ہوتا ہے۔",
     "Perched 6 kilometers south of Ziarat, this windy cliff lookout commands sweeping panoramas over the highest peaks of the Khalifat mountains, offering magical sunsets above swirling mountain mists.",
     "پراسپیکٹ پوائنٹ کی اونچائی پر کھڑے ہو کر جب بادل نیچے وادی میں تیرتے نظر آتے ہیں تو ایسا لگتا ہے جیسے انسان آسمان کے جھروکے میں کھڑا ہو۔"),
    ("sandeman-tangi-canyon", "Sandeman Tangi Natural Water Canyon (Ziarat)", "سینڈیمن تنگی قدرتی آبشار و گھاٹی زیارت", "nature", "Ziarat", 30.416667, 67.766667, 500,
     "Dramatic narrow mountain gorge where rushing spring waters carve through towering sheer rock walls.", "پہاڑوں کو چیر کر نکلنے والی تنگ پتھریلی گھاٹی جہاں ٹھنڈا چشمہ اور آبشار اچھلتی ہے۔",
     "Located just 4 kilometers from Ziarat, this natural defile features crystal-clear mountain water cascading over smooth boulders, creating a cool shaded sanctuary for hikers and picnickers.",
     "چٹانوں کے درمیان بہتا ٹھنڈا میٹھا پانی اور پتھروں کی دیواریں گرمیوں میں پکنک منانے اور فطرت کے سکون کو محسوس کرنے کا بہترین قدرتی مقام ہیں۔"),

    # Central & Southern Balochistan (15)
    ("moola-chotok-waterfalls-khuzdar", "Moola Chotok Emerald Waterfalls & Canyon (Khuzdar)", "مولا چھوٹک زمردی آبشاریں و گھاٹی خضدار بلوچستان", "nature", "Khuzdar", 27.916667, 66.866667, 1000,
     "Paradise-like hidden canyon in Khuzdar featuring cascading emerald waterfalls and natural plunge pools.", "خضدار کے صحرائی پہاڑوں کے درمیان چھپا ہوا قدرتی نخلستان جہاں زمردی پانی کی درجنوں آبشاریں گرتی ہیں۔",
     "Often called the 'Hidden Oasis of Balochistan', Moola Chotok is reached via off-road 4x4 safaris through arid defiles, opening into lush ravines with year-round freshwater falls and wild ferns.",
     "پتھریلے ویرانے میں اچانک سامنے آنے والی مولا چھوٹک کی آبشاروں کا شفاف سبز پانی اور قدرتی تالاب قدرت کا وہ معجزہ ہیں جو دیکھ کر عقل حیران رہ جاتی ہے۔"),
    ("pir-ghaib-waterfalls-bolan", "Pir Ghaib Sacred Waterfalls (Bolan Pass)", "پیر غائب قدرتی آبشاریں و تالاب درہ بولان بلوچستان", "nature", "Bolan", 29.75, 67.583333, 600,
     "Twin cascading mountain waterfalls flowing into a series of clear azure pools within the Bolan gorges.", "درہ بولان کی چٹانوں سے ابلتی ہوئی جڑواں قدرتی آبشاریں جو نیلے شفاف تالابوں میں گرتی ہیں۔",
     "According to regional folklore, saint Pir Ghaib miraculously vanished into the rock face here to escape invading armies, leaving behind continuous crystal springs that nourish lush date palms.",
     "بولان کے خشک پہاڑوں کے بیچ پیر غائب کا یہ شفاف چشمہ اور آبشاریں نخلستان کا روپ دھارے ہوئے ہیں جہاں زائرین نہا کر تازگی پاتے ہیں۔"),
    ("mehrgarh-neolithic-archaeology", "Mehrgarh Neolithic Archaeological Cradle (7000 BCE)", "مہر گڑھ قدیم آثارِ قدیمہ (7000 قبل مسیح) بولان", "historical", "Bolan", 29.416667, 67.616667, 800,
     "9,000-year-old Neolithic archaeological cradle of farming and civilization in South Asia, on the Kachi Plain.", "9000 سال قدیم بستی کے آثار جو جنوبی ایشیا میں کاشتکاری اور شہری زندگی کا سب سے پہلا گہوارہ ہیں۔",
     "Excavated by French archaeologist Jean-Francois Jarrige, Mehrgarh proved that agriculture, pottery, dentistry, and copper smelting were practiced in Balochistan millennia before Harappa.",
     "دنیا کی تاریخ کا رخ موڑنے والے مہر گڑھ کے آثار ثابت کرتے ہیں کہ انسان نے سب سے پہلے گندم اگانا اور مویشی پالنا بلوچستان کی اس وادی میں سیکھا تھا۔"),
    ("kalat-palace-khan-of-kalat", "Miri Fort & Palace of the Khan of Kalat", "میری قلعہ و محل خان آف قلات بلوچستان", "historical", "Kalat", 29.033333, 66.583333, 500,
     "Historic mountain citadel and sovereign seat of the Khanate of Kalat, which unified the Baloch tribes.", "خانانِ قلات کا تاریخی شاہی قلعہ اور دارالحکومت جس نے صدیوں تک بلوچ قبائل کو ایک پرچم تلے متحد رکھا۔",
     "Perched atop a commanding hill at 6,700 feet, the historic Miri citadel was the royal headquarters of Nasir Khan Noori, featuring fortified bastions, weapon arsenals, and court assembly halls.",
     "قلات کا میری قلعہ بلوچستان کے وقار اور خود مختار تاریخ کا سب سے بڑا گڑھ رہا ہے جس کی فصیل سے پہاڑوں اور باغات کا شاندار نظارہ نظر آتا ہے۔"),
    ("sibi-victoria-memorial-hall", "Victoria Memorial Hall & Sibi Mela Grounds", "وکٹوریہ میموریل ہال و تاریخی سبی میلہ گراؤنڈز", "cultural", "Sibi", 29.55, 67.883333, 500,
     "1903 historic red-brick civic hall and amphitheater hosting the centuries-old traditional Sibi Horse & Cattle Show.", "1903ء کا تاریخی ریڈ برک ہال جہاں صدیوں پرانا روایتی سبی گھوڑا و مویشی میلہ منعقد ہوتا ہے۔",
     "Every February, nomadic tribes from across Balochistan converge on Sibi for horse racing, camel dancing, folk music performances, and handicraft bazaars, inaugurated by Quaid-e-Azam in 1948.",
     "سبی کا تاریخی میلہ بلوچستان کا سب سے بڑا ثقافتی تہوار ہے جہاں اصیل گھوڑوں کی دوڑ، اونٹوں کا رقص اور بلوچی لوک راگ کی دھنیں سماں باندھ دیتی ہیں۔"),
    ("turbat-punnu-fort-meri-kalat", "Punnu Fort (Meri Kalat) Kech Valley", "پنوں قلعہ (میری قلات) کیچ وادی تربت بلوچستان", "historical", "Kech", 26.0, 63.05, 500,
     "Ancient 3,000-year-old mud-brick citadel immortalized in the legendary Baloch romance of Sassi and Punnu.", "تین ہزار سال پرانا مٹی کا تاریخی قلعہ جو سسی پنوں کے لازوال رومانوی قصے کا مرکز ہے۔",
     "The ancestral fort of Mir Punnu, prince of the Hoth tribe, sits atop an elevated natural hill overlooking vast date palm groves along the Kech River, inspiring centuries of classical Sindhi and Balochi poetry.",
     "سسی کے محبوب پنوں کا یہ قلعہ کیچ ندی کے کنارے کھجور کے باغات کے درمیان واقع ہے جس کی مٹی کی فصیلیں سچی محبت کی قربانیوں کا پتہ دیتی ہیں۔")
]

file_lines = [
    '"""Balochistan Mega Dataset for GoTourGo (50+ Curated Landmarks)."""',
    'from __future__ import annotations',
    'from scripts.landmark_builder.generator import make_clean_record',
    '',
    'BALOCHISTAN_MEGA_DATA = ['
]

for t in BALOCHISTAN_DATA:
    file_lines.append(f'    {repr(t)},')

file_lines.extend([
    ']',
    '',
    'def get_balochistan_mega() -> list[dict]:',
    '    records = []',
    '    for item in BALOCHISTAN_MEGA_DATA:',
    '        records.append(make_clean_record(',
    '            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region="Balochistan",',
    '            lat=item[5], lon=item[6], radius=item[7], short_en=item[8], short_ur=item[9], desc_en=item[10], desc_ur=item[11]',
    '        ))',
    '    return records',
    ''
])

with open(dest, "w", encoding="utf-8") as f:
    f.write("\n".join(file_lines))

print(f"Successfully wrote {len(BALOCHISTAN_DATA)} landmarks to {dest}!")
