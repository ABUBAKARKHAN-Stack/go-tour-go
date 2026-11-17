"""Interior Sindh Mega Dataset for GoTourGo (150+ Curated Landmarks).

Covers Thatta, Sujawal, Badin, Hyderabad, Jamshoro, Dadu, Sehwan,
Matiari, Hala, Tando Allahyar, Tando Muhammad Khan, Khairpur, Sukkur,
Rohri, Larkana, Qambar, Shikarpur, Jacobabad, Kashmore, Ghotki,
Tharparkar, Umerkot, Sanghar, and Shaheed Benazirabad.
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

INTERIOR_SINDH_DATA = [
    # =========================================================================
    # THATTA & SUJAWAL (Makli Necropolis, Shah Jahan Mosque, Lakes & Delta)
    # =========================================================================
    ("jam-nizamuddin-tomb-makli", "Tomb of Jam Nizamuddin II (Makli)", "مقبرہ جام نظام الدین ثانی مکلی ٹھٹھہ", "historical", "Thatta", 24.755, 67.901389, 300,
     "1509 masterpiece sandstone mausoleum of the Samma dynasty Sultan at UNESCO Makli Hill.",
     "سندھ کے سما خاندان کے عظیم سلطان جام نظام الدین کا 1509ء کا شاہکار مقبرہ جو مکلی پر واقع ہے۔",
     "Built in 1509, this square sandstone mausoleum features exquisite stone-carved jharoka balconies, Quranic calligraphy bands, and Hindu-Islamic syncretic motifs carved directly into yellow stone without mortar.",
     "1509ء میں تعمیر شدہ یہ مقبرہ سندھ کے عظیم سلطان جام نظام الدین (نندو) کی آخری آرام گاہ ہے۔ اس کے زرد پتھر پر تراشیدہ جھروکے اور خطاطی اسلامی و گجراتی فنِ تعمیر کا بے مثال نمونہ ہیں۔"),

    ("isa-khan-tarkhan-ii-tomb-makli", "Tomb of Isa Khan Tarkhan II (Makli)", "مقبرہ عیسیٰ خان ترخان ثانی مکلی ٹھٹھہ", "historical", "Thatta", 24.756944, 67.902778, 300,
     "Two-storey stone-pillared palatial mausoleum built in 1644 surrounded by pillared stone verandas.",
     "1644ء کا دو منزلہ ستونوں والا پرشکوہ مقبرہ جس کے چاروں طرف زرد پتھر کے تراشیدہ برآمدے ہیں۔",
     "Constructed in 1644 during Mughal rule, this monumental two-storey stone mausoleum features multi-tiered pillared loggias, delicate honeycomb jaali screens, and stone cenotaphs commemorating the Tarkhan governor.",
     "1644ء میں مکمل ہونے والا یہ مقبرہ مکلی کی سب سے شاندار عمارتوں میں سے ہے۔ اس کے دو منزلہ ستون، باریک جالی دار کام اور اونچے گنبد مغلیہ دور کی گورنری کی عظمت ظاہر کرتے ہیں۔"),

    ("jan-baba-mausoleum-makli", "Tomb of Jan Baba (Makli)", "مقبرہ جان بابا مکلی ٹھٹھہ", "historical", "Thatta", 24.7575, 67.902222, 250,
     "1608 intricately carved sandstone tomb featuring delicate mihrabs and Quranic stone calligraphy.",
     "1608ء کا زرد پتھر کا نفیس مقبرہ جس کی محرابوں پر قرآنی خطاطی اور پھول بوٹے کندہ ہیں۔",
     "Erected in 1608 by Isa Khan Tarkhan II for his father Jan Baba, this tomb is famous for its intricate surface relief carving that resembles woodwork carved into solid living limestone.",
     "1608ء میں تعمیر کروایا گیا یہ مقبرہ پتھر پر لکڑی جیسی باریک تراش خراش کی وجہ سے مشہور ہے۔ اس کی محرابیں اور کتبے سندھ کے کاریگروں کے کمال فن کا ثبوت ہیں۔"),

    ("diwan-shurfa-khan-tomb-makli", "Tomb of Diwan Shurfa Khan (Makli)", "مقبرہ دیوان شرفا خان مکلی ٹھٹھہ", "historical", "Thatta", 24.747222, 67.901944, 250,
     "1638 Persian-style blue-glazed tile and red brick mausoleum crowned by a turquoise glazed dome.",
     "1638ء کا سرخ اینٹوں اور نیلے کاشی کے ٹائلوں سے بنا مقبرہ جس پر فیروزی گنبد جگمگاتا ہے۔",
     "A rare example of Persian brick architecture at Makli, featuring vibrant cobalt-blue and turquoise glazed tiles, four round corner towers, and the subterranean burial crypt of the Arghun royal minister.",
     "مکلی کے عام زرد پتھر کے مقابر سے ہٹ کر یہ مقبرہ سرخ اینٹوں اور لاجواب نیلے کاشی ٹائلز سے مزین ہے جس کا فیروزی گنبد دور سے اپنی جھلک دکھاتا ہے۔"),

    ("dabgir-mosque-thatta", "Dabgir Mosque (Amir Khusro Mosque)", "دابگیر مسجد (امیر خسرو مسجد) ٹھٹھہ", "historical", "Thatta", 24.745, 67.925, 200,
     "1588 historic brick congregational mosque in Thatta renowned for an exquisitely carved white marble prayer mihrab.",
     "1588ء کی تاریخی جامع مسجد جو اپنے سفید سنگِ مرمر کے باریک تراشیدہ محرابِ عبادت کے لیے مشہور ہے۔",
     "Constructed in 1588 by Amir Khusro Khan Charkas, this historic mosque served as Thatta's primary congregational center where Mughal Emperor Shah Jahan famously prayed during his royal exile in Sindh.",
     "1588ء میں تعمیر ہونے والی اس مسجد کی خاص بات اس کا خالص سنگِ مرمر کا کندہ شدہ محراب ہے جہاں مغل شہنشاہ شاہجہان نے اپنے ایامِ جلاوطنی میں نماز ادا کی تھی۔"),

    ("sonda-historic-necropolis", "Sonda Historic Graveyard", "سونڈا تاریخی قبرستان ٹھٹھہ", "historical", "Thatta", 24.966667, 68.083333, 400,
     "Ancient 16th-century terraced sandstone necropolis perched on a limestone ridge near Keenjhar Lake.",
     "کینجھر جھیل کے قریب پہاڑی پر واقع 16ویں صدی کا تاریخی قبرستان جہاں زرد پتھر کے مقابر سجے ہیں۔",
     "Located along the National Highway near Sonda village, this necropolis contains richly carved Chawkandi-style tombs featuring motifs of turbans, swords, and female jewelry indicating the gender of the departed.",
     "قومی شاہراہ کے قریب پہاڑی پر واقع یہ قدیم قبرستان چوکنڈی طرز کے زرد پتھروں کی تراشیدہ قبروں پر مشتمل ہے جن پر شمشیر زن گھڑ سوار اور روایتی پگڑیاں کندہ ہیں۔"),

    ("kalan-kot-ruins-thatta", "Kalan Kot (Tughlaqabad) Fort Ruins", "کلان کوٹ (تغلق آباد) قلعہ کے کھنڈرات ٹھٹھہ", "historical", "Thatta", 24.721944, 67.891667, 500,
     "14th-century medieval fortified garrison citadel overlooking the Makli ridge, built by Samma and Arghun kings.",
     "مکلی کی پہاڑی پر 14ویں صدی کا قرونِ وسطیٰ کا مضبوط قلعہ جسے سمہ اور ارغون حکمرانوں نے بنایا۔",
     "Built on an ancient Hindu citadel and fortified with heavy stone ramparts and brick bastions, Kalan Kot served as a defensive military refuge during enemy sieges of the capital city of Thatta.",
     "ایک قدرتی جھیل کے کنارے واقع اس قلعے کو ماضی میں تغلق آباد بھی کہا جاتا تھا، جہاں بیرونی حملوں کے وقت ٹھٹھہ کے حکمران اپنی فوج کے ساتھ پناہ لیتے تھے۔"),

    ("pir-patho-hilltop-shrine", "Pir Patho Hilltop Shrine & Minaret", "پیر پٹھو درگاہ و تاریخی مینار ٹھٹھہ", "religious", "Thatta", 24.683333, 67.95, 400,
     "Ancient 12th-century Sufi pilgrimage shrine and ruined brick watchtower commanding sweeping views of the Indus delta.",
     "12ویں صدی کی قدیم صوفی درگاہ اور اینٹوں کا تاریخی مینار جہاں سے دریائے سندھ کے ڈیلٹا کا شاندار نظارہ ملتا ہے۔",
     "Perched on a solitary limestone outcrop in the lower delta, Pir Patho marks an ancient cultural transition point from Buddhist to early Islamic Sindh, crowned by an 800-year-old circular beacon tower.",
     "مکلی کے جنوب میں واقع پیر پٹھو کی درگاہ اور قدیم مینار سندھ کی ابتدائی اسلامی تاریخ کا اہم سنگ میل ہیں جہاں سے ڈیلٹا کی بنجر زمینیں اور ندیاں دور تک دکھائی دیتی ہیں۔"),

    ("jhimpir-wind-corridor-springs", "Jhimpir Wind Corridor & Natural Springs", "جھمپیر ونڈ کوریڈور و قدرتی چشمے ٹھٹھہ", "nature", "Thatta", 25.016667, 68.016667, 1000,
     "Pakistan's premier green energy wind farm plateau featuring cold mineral freshwater springs and rocky valleys.",
     "پاکستان کا سب سے بڑا ونڈ انرجی کوریڈور جہاں سینکڑوں ونڈ ٹربائنز، میٹھے چشمے اور پتھریلی وادیاں موجود ہیں۔",
     "Home to hundreds of towering modern wind turbines turning in the coastal Arabian Sea gales, Jhimpir also holds historic natural freshwater springs and the revered shrine of Sheikh Jhimpir.",
     "ساحلی ہواؤں سے بجلی پیدا کرنے والے دیوہیکل پنکھوں کا یہ میدان نہ صرف جدید پاکستان کی توانائی کا مرکز ہے بلکہ اپنے ٹھنڈے قدرتی چشموں اور پرسکون فضا کے لیے جانا جاتا ہے۔"),

    ("keenjhar-lake-chilya-fish-point", "Chilya Fish Point (Keenjhar Lake)", "چلیہ فش پوائنٹ کینجھر جھیل ٹھٹھہ", "food", "Thatta", 24.933333, 68.05, 300,
     "Legendary lakeside culinary hub famous for freshly caught Indus catfish and Kuriro fried in spicy Sindhi masala.",
     "کینجھر جھیل کا مشہور فوڈ پوائنٹ جہاں تازہ پکڑی گئی مچھلی دیسی مصالحوں میں تل کر پیش کی جاتی ہے۔",
     "The ultimate roadside food stop on the National Highway, where travelers feast on hot crispy fish steaks, fresh clay oven rotis, and chilled sugarcane juice overlooking the azure waters of Keenjhar.",
     "قومی شاہراہ پر واقع چلیہ فش پوائنٹ کینجھر جھیل کی تازہ کڑاہی مچھلی اور فرائی مچھلی کے شوقین افراد کا سب سے مشہور پڑاؤ ہے۔"),

    ("hadero-lake-wildlife-sanctuary", "Hadero Lake Protected Wetland Reserve", "ہدیرو جھیل جنگلی حیات کی پناہ گاہ ٹھٹھہ", "nature", "Thatta", 24.816667, 67.85, 1200,
     "Pristine brackish wetland sanctuary designated as a national park for flamingos, pelicans, and wintering waders.",
     "نمکین پانی کی محفوظ قدرتی جھیل جہاں موسمِ سرما میں ہزاروں فلیمنگو، پیلیکن اور بگلے بسیرا کرتے ہیں۔",
     "A tranquil haven for ornithologists and nature photographers, Hadero Lake hosts up to 50,000 migratory waterfowl each winter feeding on aquatic crustacea along its quiet reed-fringed shores.",
     "ٹھٹھہ کے قریب یہ خوبصورت جھیل پرندوں کے لیے قدرتی جنت ہے جہاں گلابی فلیمنگو کے غول نیلے پانیوں میں قطار اندر قطار پرواز کرتے نظر آتے ہیں۔"),

    ("shah-bandar-historic-indus-port", "Shah Bandar Historic Ancient Indus Port", "شاہ بندر تاریخی قدیم بندرگاہ سجاول", "historical", "Sujawal", 24.166667, 67.9, 600,
     "Ruins of the famous 18th-century naval and trading port of the Kalhora dynasty on the lower Indus estuary.",
     "18ویں صدی میں کلہوڑا خاندان کی بحری فوج اور تجارت کا عظیم اڈا جو دریائے سندھ کے دہانے پر واقع تھا۔",
     "Established by Mian Ghulam Shah Kalhoro in 1759 to replace earthquake-damaged ports, Shah Bandar once stationed a war fleet of 400 armed vessels before the Indus River shifted its course.",
     "1759ء میں میاں غلام شاہ کلہوڑا کا بسایا ہوا شاہ بندر سندھ کا اہم بحری مرکز تھا جہاں 400 جنگی جہاز لنگر انداز رہتے تھے، اب اس کے تاریخی کھنڈرات دریا کے رخ بدلنے کی کہانی سناتے ہیں۔"),

    ("keti-bandar-delta-mangrove-outpost", "Keti Bandar Indus Delta Coastal Outpost", "کیٹی بندر انڈس ڈیلٹا ساحلی بستی ٹھٹھہ", "nature", "Thatta", 24.144444, 67.45, 1000,
     "Pakistan's southernmost settlement on the active Indus River delta where freshwater branches spill into the Arabian Sea.",
     "دریائے سندھ کے ڈیلٹا پر پاکستان کی سب سے آخری ساحلی بستی جہاں دریا کا میٹھا پانی بحیرہ عرب کے نمکین پانی سے ملتا ہے۔",
     "Surrounded by dense tidal mangrove channels and mudflats, Keti Bandar has survived being rebuilt three times due to coastal sea erosion, providing boat access into the remote mangrove islands.",
     "تیمر کے جنگلات سے گھری یہ قدیم بستی سمندر کے کٹاؤ کا مقابلہ کرتی آئی ہے۔ یہاں سے کشتیوں کے ذریعے انڈس ڈیلٹا کے نایاب سمندری ماحولیاتی نظام کا نظارہ کیا جا سکتا ہے۔"),

    ("sujawal-indus-riverfront-bridge", "Sujawal Indus Riverfront & Bridge", "سجاول دریائے سندھ کا کنارہ و تاریخی پل", "nature", "Sujawal", 24.608333, 68.188889, 500,
     "Wide sweeping riverfront on the Indus River connecting Thatta and Sujawal, famous for fresh Palla fish catch.",
     "دریائے سندھ کے اوپر ٹھٹھہ اور سجاول کو ملانے والا دریا کا وسیع کنارہ جہاں تازہ پلہ مچھلی کا شکار ہوتا ہے۔",
     "A bustling delta river crossing where traditional Sindhi boatmen cast circular fishing nets from wooden boats into the muddy waters of the mighty Indus, accompanied by scenic riverside tea dhabas.",
     "ٹھٹھہ اور سجاول کے درمیان دریائے سندھ کا یہ شاندار پاٹ شام کے وقت ماہی گیروں کی روایتی کشتیوں اور پلہ مچھلی کی خوشبو سے مہک اٹھتا ہے۔"),

    # =========================================================================
    # BADIN & COASTAL WETLANDS
    # =========================================================================
    ("rupa-mari-archaeological-ruins", "Rupa Mari Archaeological Ruins (Badin)", "روپا ماڑی قدیم آثار و کھنڈرات بدین", "historical", "Badin", 24.633333, 68.866667, 500,
     "Ancient 14th-century capital city ruins of the Soomra dynasty, immortalized in the epic love romance of Dodo Chanesar.",
     "14ویں صدی میں سومرہ حکمرانوں کا تاریخی دارالحکومت جس کی داستان دودو چنیسر کے رزم نامے میں امر ہے۔",
     "Excavations reveal extensive brick defense foundations, medieval ceramics, and burial tumuli where heroic Soomra warriors fought to defend Sindh against the invading Delhi Sultanate armies.",
     "بدین کے قریب روپا ماڑی کے کھنڈرات سندھ کی خودداری اور مزاحمت کی علامت ہیں جہاں دودو سومرو نے علاء الدین خلجی کے لشکر کے خلاف لڑتے ہوئے جان قربان کی۔"),

    ("kadhan-wetland-reserves-badin", "Kadhan Wetland Wildlife Reserves", "کڈھن قدرتی جھیلیں و جنگلی حیات بدین", "nature", "Badin", 24.483333, 68.966667, 1200,
     "Interconnected freshwater and brackish natural lakes hosting thousands of migratory ducks, coots, and ibises.",
     "میٹھے اور نمکین پانی کی قدرتی جھیلوں کا سلسلہ جہاں سائبیریا سے آئے ہزاروں آبی پرندے بسیرا کرتے ہیں۔",
     "Spread across southern Badin district near the Rann of Kutch border, these untouched coastal wetlands support rare fishing cat populations, freshwater turtles, and thriving wetland fisheries.",
     "رن آف کچھ کے قریب واقع کڈھن کی جھیلیں قدرتی خوبصورتی اور نایاب جنگلی بلیوں، کچھوؤں اور مرغابیوں کا پرامن مسکن ہیں۔"),

    ("badin-rice-and-sugar-canals", "Badin Irrigation Canals & Rice Fields", "بدین نہری نظام و دھان کے لہلہاتے کھیت", "nature", "Badin", 24.655556, 68.838889, 800,
     "Lush green paddy fields and extensive irrigation canal networks that earn Badin the title of Sindh's Sugar Bowl.",
     "سرسبز دھان کے کھیت اور گنے کی وسیع فصلیں جو بدین کو سندھ کا زرعی اور شکر کا پیالہ بناتی ہیں۔",
     "Fed by the Kotri Barrage canal commands, Badin features emerald landscapes of Basmati rice paddies, towering sugarcane crops, and historic brick water regulators spanning the canal distributors.",
     "نہری پانی سے سیراب ہونے والے بدین کے دور تک پھیلے دھان کے سبزہ زار اور چینی کی ملیں اس خطے کی زرعی خوشحالی کی عکاسی کرتی ہیں۔"),

    ("luari-sharif-shrine-dargah", "Dargah Luari Sharif (Khwaja Muhammad Zaman)", "درگاہ لواری شریف (خواجہ محمد زمان) بدین", "religious", "Badin", 24.783333, 68.816667, 400,
     "Revered 18th-century Naqshbandi Sufi shrine of Khwaja Muhammad Zaman attracting thousands of spiritual seekers.",
     "18ویں صدی کے عظیم نقشبندی بزرگ خواجہ محمد زمان لواری والے کی درگاہ جو روحانی فیض کا مرکز ہے۔",
     "Surrounded by tranquil palm groves, Luari Sharif is a preeminent spiritual center of Sindh renowned for preserving classical Persian mystic manuscripts, communal recitation of dhikr, and an annual Urs.",
     "بدین کے قصبے لواری شریف میں واقع یہ درگاہ سندھ میں نقشبندی سلسلے کا سب سے بڑا گڑھ ہے جہاں ہزاروں زائرین تزکیہ نفس اور ذکرِ الٰہی کے لیے حاضر ہوتے ہیں۔"),

    ("seer-creek-indus-mangrove-delta", "Seer Creek Indus Mangrove Delta", "سیر کریک انڈس مینگروو ڈیلٹا بدین", "nature", "Badin", 24.083333, 68.416667, 1500,
     "Remote tidal mangrove creek at the outer mouth of the Indus River touching the Arabian Sea salt flats.",
     "دریائے سندھ کے بیرونی دہانے پر واقع دور افتادہ سمندری نالہ جہاں گھنے مینگروو اور نمکین دلدلیں ہیں۔",
     "An extreme coastal wilderness reachable by traditional dhows, supporting healthy stands of Avicennia marina mangroves, saltwater mud crabs, and pods of humpback dolphins breaching in the tidal channels.",
     "سمندری ڈولفنز، کیکڑوں اور مینگروو کے سرسبز جزیروں سے گھرا یہ نالہ مہم جوئی اور سمندری ماحولیات کے شائقین کے لیے ایک اچھوتی قدرتی منزل ہے۔"),

    # =========================================================================
    # HYDERABAD & SURROUNDS (Forts, Palaces, Mirs Tombs, Cultural Museums)
    # =========================================================================
    ("pacca-qila-ramparts-hyderabad", "Pacca Qila Ramparts & Mirs Harem", "پکا قلعہ فصیل و حرمِ میران حیدرآباد", "historical", "Hyderabad", 25.394444, 68.375, 400,
     "1768 monumental burnt-brick fortress built by Ghulam Shah Kalhoro on the limestone ridge of historic Nerun Kot.",
     "1768ء میں غلام شاہ کلہوڑا کا تعمیر کردہ اینٹوں کا دیوہیکل قلعہ جو نیرون کوٹ کی پہاڑی پر ایستادہ ہے۔",
     "Rising over 50 feet above Hyderabad, Pacca Qila features massive circular bastions, fortified gateways, the surviving Mirs' Harem palace with carved teakwood ceilings, and historical armory quarters.",
     "1768ء میں حیدرآباد کو دارالحکومت بناتے وقت تعمیر کیا گیا یہ قلعہ سندھ کے کلہوڑا اور تالپور حکمرانوں کا شاہی مسکن تھا۔ اس کے بلند برج اور شاہی حرم کا محل سندھی تاریخ کے گواہ ہیں۔"),

    ("kacha-qila-mud-bastions-hyderabad", "Kacha Qila (Mud Fort)", "کچا قلعہ حیدرآباد", "historical", "Hyderabad", 25.388889, 68.369444, 300,
     "Historic defensive earthen and sun-dried mud brick fortress constructed to shelter camp followers and soldiers.",
     "پکے قلعے کی حفاظت کے لیے مٹی اور گارے سے بنایا گیا تاریخی دفاعی قلعہ۔",
     "Built simultaneously with Pacca Qila to house the military garrisons and weapon forges, its thick mud-rammed walls and arched gates demonstrate medieval passive thermal defense architecture.",
     "پکے قلعے سے کچھ فاصلے پر مٹی کی موٹی دیواروں سے بنایا گیا یہ قلعہ فوج کے گھڑ سواروں اور توپ خانے کی حفاظت کے لیے ایک منفرد تاریخی تعمیر ہے۔"),

    ("tombs-of-kalhora-rulers-hyderabad", "Tombs of the Kalhora Rulers (Ghulam Shah Kalhoro)", "مقابر کلہوڑا حکمران (میاں غلام شاہ کلہوڑا) حیدرآباد", "historical", "Hyderabad", 25.419444, 68.366667, 350,
     "1772 grand square mausoleum of Hyderabad's founder adorned with exquisite glazed kashi tiles and floral frescoes.",
     "حیدرآباد کے بانی میاں غلام شاہ کلہوڑا کا 1772ء کا عظیم الشان مقبرہ جو کاشی ٹائلز اور نقش و نگار سے سجا ہے۔",
     "Constructed atop a fortified platform, this majestic tomb features vibrant azure kashi tiles, an arched domed arcade, and the carved marble cenotaph of Mian Ghulam Shah Kalhoro, the founder of modern Hyderabad.",
     "حیدرآباد کے عظیم بانی میاں غلام شاہ کلہوڑا کا یہ مقبرہ اپنے لاجواب نیلے اور سفید کاشی ٹائلز، بلند گنبد اور سنگِ مرمر کے نفیس تعویز کے باعث سندھ کا فنکارانہ شاہکار ہے۔"),

    ("tombs-of-talpur-mirs-qubbas", "Tombs of the Talpur Mirs (Qubbas)", "مقابر تالپور میران (قبے) حیدرآباد", "historical", "Hyderabad", 25.427778, 68.369444, 400,
     "19th-century royal necropolis of the Talpur rulers featuring carved marble cenotaphs and Persian blue domes.",
     "19ویں صدی کے تالپور حکمرانوں کا شاہی قبرستان جہاں سنگِ مرمر کے مقابر اور فیروزی گنبد واقع ہیں۔",
     "Holding the remains of Mir Karam Ali Khan, Mir Murad Ali, and other rulers of Sindh, these mausoleums feature painted floral interiors, mirrored plasterwork, and carved wooden doors of rare craftsmanship.",
     "حیدرآباد کے شمالی سرے پر واقع تالپور میروں کے یہ مقابر اپنے خوبصورت فیروزی گنبدوں، دیواروں پر بنے پھولدار نقاشیوں اور لکڑی کے تراشیدہ دروازوں کے لیے بے مثال ہیں۔"),

    ("sindh-museum-qasimabad", "Sindh Museum Qasimabad", "سندھ میوزیم قاسم آباد حیدرآباد", "museum", "Hyderabad", 25.405556, 68.341667, 350,
     "Provincial cultural museum in Qasimabad showcasing Indus Valley artifacts, folk musical instruments, and crafts.",
     "قاسم آباد میں صوبائی عجائب گھر جہاں وادی سندھ کے نوادرات، روایتی ساز، اجرک اور ثقافتی ماڈل محفوظ ہیں۔",
     "Featuring life-sized dioramas of Thar desert nomads, Hala pottery workshops, Ajrak block carvers, and rare archaeological relics spanning 5,000 years of civilization along the Indus River basin.",
     "سندھ میوزیم میں قدیم موہنجودڑو کے برتنوں سے لے کر تھر کی روایتی زندگی، سارنگی، تنبورہ اور سندھی ثقافت کے تمام رنگ نہایت خوبصورتی سے سجائے گئے ہیں۔"),

    ("institute-of-sindhology-jamshoro", "Institute of Sindhology Museum (University of Sindh)", "انسٹیٹیوٹ آف سندھالوجی میوزیم یونیورسٹی آف سندھ جامشورو", "museum", "Hyderabad", 25.419444, 68.275, 400,
     "Pakistan's premier anthropological museum celebrating the ethnology, manuscripts, and living heritage of Sindh.",
     "جامشورو میں سندھ کا سب سے بڑا بشریاتی عجائب گھر جہاں سندھی تہذیب، نایاب مخطوطات اور لوک ورثہ جگمگا رہا ہے۔",
     "Located on the university campus across the Indus River, it holds extensive collections of antique weapons, musical archives of Shah Abdul Latif Bhittai, rural village wax models, and research libraries.",
     "سندھ یونیورسٹی جامشورو میں قائم یہ ادارہ سندھی تاریخ و ثقافت کا انسائیکلوپیڈیا ہے جہاں صوفیائے کرام کے تبرکات، نایاب کتب اور دیہی سندھ کے جیتی جاگتی تصویریں محفوظ ہیں۔"),

    ("rani-bagh-botanical-zoo-hyderabad", "Rani Bagh Zoological & Botanical Gardens", "رانی باغ چڑیا گھر و نباتاتی باغ حیدرآباد", "park", "Hyderabad", 25.380556, 68.358333, 450,
     "1861 historic botanical park named after Queen Victoria spanning 53 shaded green acres with a lake and zoo.",
     "1861ء میں ملکہ وکٹوریہ کے نام پر قائم ہونے والا 53 ایکڑ پر پھیلا تاریخی باغ جہاں چڑیا گھر اور جھیل موجود ہے۔",
     "Originally established as an agro-horticultural garden during British rule, Rani Bagh features historic mahogany and banyan trees, an open-air theater named after Abbas College, and family amusement lawns.",
     "حیدرآباد کے شہریوں کی پسندیدہ تفریح گاہ رانی باغ اپنے ڈیڑھ سو سال پرانے درختوں، ہرنوں اور شیروں کے انکلوژرز اور ٹھنڈی ہواؤں کے ساتھ خاندانی پکنک کا مرکز ہے۔"),

    ("resham-gali-historic-bridal-bazaar", "Resham Gali Historic Bridal Silk Bazaar", "ریشم گلی تاریخی برائیڈل بازار حیدرآباد", "shopping", "Hyderabad", 25.394444, 68.369444, 250,
     "Legendary covered bazaar in Hyderabad famed for traditional glass bangles, pure silk embroidery, and wedding trousseaus.",
     "حیدرآباد کی تاریخی تنگ ریشم گلی جو شیشے کی چمکیلی چوڑیوں، بنارسی دوپٹوں اور شادی کی خریداری کے لیے مشہور ہے۔",
     "A mesmerizing narrow pedestrian lane sparkling with thousands of multicolored glass bangles (choorian), gold gota work, Sindhi hand-stitched quilts (rilli), and bridal jewelry ateliers.",
     "حیدرآباد کی کانچ کی چوڑیاں پوری دنیا میں پہچانی جاتی ہیں، اور ریشم گلی ان چوڑیوں اور شادی بیاہ کے زرق برق ملبوسات کی خریداری کا ملک گیر مرکز ہے۔"),

    ("shahi-bazaar-hyderabad-spine", "Shahi Bazaar Historic 2-km Covered Spine", "شاہی بازار تاریخی دو کلومیٹر لمبا بازار حیدرآباد", "shopping", "Hyderabad", 25.397222, 68.372222, 350,
     "One of Asia's longest continuous historic bazaars stretching two kilometers from Pacca Qila to Market Tower.",
     "ایشیا کے طویل ترین روایتی بازاروں میں سے ایک جو پکے قلعے سے نول رائے کلاک ٹاور تک دو کلومیٹر لمبا ہے۔",
     "Laid out by Ghulam Shah Kalhoro in the 18th century, this shaded labyrinth offers silverware, embroidered Sindhi topis, block-printed Ajraks, leather mojari shoes, and street food stalls.",
     "کلہوڑا دور سے آباد یہ پرپیچ تاریخی شاہی بازار سندھی اجرک، کڑھائی والی ٹوپیوں، چاندی کے زیورات اور دستکاریوں کی دکانوں سے بھرا پڑا ہے جہاں قدم رکھنے کی جگہ نہیں ملتی۔"),

    ("bombay-bakery-heritage-hyderabad", "Bombay Bakery (Cantonment Heritage)", "بمبئی بیکری تاریخی کینٹ حیدرآباد", "food", "Hyderabad", 25.391667, 68.361111, 200,
     "Historic 1911 Parsi-Swiss confectionery in the Cantonment famed worldwide for its signature Coffee and Chocolate Cakes.",
     "کینٹ حیدرآباد میں 1911ء کی تاریخی بیکری جس کا کافی کیک اور چاکلیٹ کیک پوری دنیا میں بے مثال مانا جاتا ہے۔",
     "Operating from an atmospheric red-brick bungalow since 1911, this legendary bakery enforces strict batch limits for its rich coffee macaroons, chocolate fudge, and caramel cakes that sell out within minutes daily.",
     "1911ء سے قائم بمبئی بیکری کا کافی کیک اور چاکلیٹ کیک حاصل کرنے کے لیے صبح سویرے لمبی قطاریں لگتی ہیں۔ اس کا ذائقہ گزشتہ ایک صدی سے بالکل ویسا ہی لاجواب ہے۔"),

    ("navalrai-clock-tower-market", "Navalrai Clock Tower (Market Tower)", "نول رائے کلاک ٹاور (مارکیٹ ٹاور) حیدرآباد", "historical", "Hyderabad", 25.402778, 68.375, 300,
     "1914 historic Indo-Saracenic limestone clock tower and wholesale fish and fruit marketplace in central Hyderabad.",
     "حیدرآباد کا 1914ء کا تاریخی کلاک ٹاور جس کے نیچے مچھلی، گوشت اور سبزیوں کی مرکزی مارکیٹ واقع ہے۔",
     "Designed in classical colonial stone architecture and named after civic benefactor Navalrai, this towering clock face has regulated Hyderabad's daily commercial rhythms for over a century.",
     "1914ء میں تعمیر ہونے والا نول رائے کلاک ٹاور حیدرآباد کے وسط میں فخر سے کھڑا ہے اور اس کے گھنٹے کی گونج صدی سے شہر کے تاجروں اور خریداروں کی راہنمائی کر رہی ہے۔"),

    ("kotri-barrage-palla-fish-promenade", "Kotri Barrage Promenade & Palla Fish", "کوٹری بیراج پرومیناڈ و تازہ پلہ مچھلی", "food", "Hyderabad", 25.369444, 68.313889, 600,
     "1955 Indus River barrage on the National Highway famous for sunset river views and authentic river Palla fish.",
     "1955ء کا تاریخی کوٹری بیراج جہاں دریائے سندھ کے کنارے غروبِ آفتاب کا نظارہ اور کوئلوں پر پکی تازہ پلہ مچھلی ملتی ہے۔",
     "Also known as Ghulam Muhammad Barrage, its 44 sluice gates irrigate 2.8 million acres of Sindh. The bridge promenade is lined with dhabas serving the prized migratory Hilsa (Palla) fish grilled with traditional red chilies.",
     "دریائے سندھ کے اوپر بنا کوٹری بیراج سندھ کے کھانوں اور تفریح کا اہم مرکز ہے جہاں دریا کے لہراتے پانیوں کے کنارے اصل سندھی پلہ مچھلی کا لطف لیا جاتا ہے۔"),

    ("al-manzar-indus-river-viewpoint", "Al-Manzar Indus River Viewpoint (Jamshoro)", "المنظر دریائے سندھ ویو پوائنٹ جامشورو", "viewpoint", "Hyderabad", 25.372222, 68.308333, 400,
     "Scenic riverbank cliff viewpoint looking across the mighty Indus waters between Kotri and Jamshoro.",
     "جامشورو کے پل کے قریب دریا کے کنارے بلند و بالا ویو پوائنٹ جہاں سے دریائے سندھ کا مسحور کن نظارہ ہوتا ہے۔",
     "A beloved cultural gathering spot where poets, university students, and families relax on charpoys drinking hot doodh-patti chai while watching fishermen steer wooden boats across the wide river expanse.",
     "المنظر جامشورو کی وہ تاریخی جگہ ہے جہاں سندھی شاعروں نے دریا کی لہروں کو دیکھ کر گیت لکھے۔ شام کے وقت یہاں چارپائیوں پر بیٹھ کر چائے پینا اور ہوا کے جھونکے لینا یادگار تجربہ ہے۔"),

    ("mukhi-house-museum-hyderabad", "Mukhi House Cultural Museum", "مکھی ہاؤس کلچرل میوزیم حیدرآباد", "museum", "Hyderabad", 25.394444, 68.375, 250,
     "1920 grand Italianate mansion of the wealthy Hindu Mukhi family restored as a Sindh cultural heritage museum.",
     "1920ء کا اطالوی طرز کا پرشکوہ تاریخی محل جسے سندھ کے شہری ورثے کے خوبصورت عجائب گھر میں بدلا گیا ہے۔",
     "Featuring carved teakwood staircases, imported Italian marble tiles, stained glass windows, and period furniture showcasing the aristocratic lifestyle of pre-partition Hyderabad's merchant elite.",
     "مکھی جیٹھانند کا یہ محل نوآبادیاتی دور کی ہندو تاجر برادری کی نفاست اور ذوق کا شاہکار ہے جس کے سنگِ مرمر کے فرش اور بیلجیئم کے شیشے حیرت انگیز حالت میں محفوظ ہیں۔"),

    # =========================================================================
    # JAMSHORO, DADU & SEHWAN (Ranikot, Sehwan Sharif, Manchhar Lake, Gorakh)
    # =========================================================================
    ("ranikot-fort-sann-gate-wall", "Ranikot Fort (The Great Wall of Sindh)", "قلعہ رانی کوٹ (دی گریٹ وال آف سندھ) سان گیٹ", "historical", "Jamshoro", 25.897222, 67.905556, 1500,
     "World's largest fort spanning 32 kilometers of fortified stone defense walls meandering across the Kirthar hills.",
     "دنیا کا سب سے بڑا قلعہ جس کی 32 کلومیٹر لمبی فصیل کیرتھر کی پہاڑیوں پر دیوارِ چین کی طرح بل کھاتی ہے۔",
     "Often called the Great Wall of Sindh, Ranikot's monumental stone ramparts, crenellated parapets, and Sann Gate guard a rugged natural canyon containing inner fortified citadels of legendary antiquity.",
     "رانی کوٹ قلعہ دنیا کا سب سے طویل فصیل والا قلعہ ہے۔ اس کے سان گیٹ سے اندر داخل ہو کر اونچی پہاڑیوں پر دوڑتی پتھریلی دیواریں دیکھ کر انسان دنگ رہ جاتا ہے۔"),

    ("ranikot-meeri-fort-citadel", "Meeri Fort (Ranikot Inner Citadel)", "میری قلعہ (رانی کوٹ اندرونی قلعہ)", "historical", "Jamshoro", 25.888889, 67.9, 500,
     "Fortified royal inner redoubt at the heart of Ranikot commanding panoramic views of the entire valley basin.",
     "رانی کوٹ کے بالکل درمیان میں واقع شاہی قلعہ جہاں سے چاروں طرف پھیلی وادی اور فصیل کا شاندار نظارہ ہوتا ہے۔",
     "Serving as the royal residential palace and command post inside Ranikot, Meeri Fort features stone battlements, internal water reservoirs, and elevated sniper bastions designed for impregnable mountain defense.",
     "رانی کوٹ کی وادی کے اندر واقع میری کوٹ شاہی رہائش گاہ تھی جس کے برجوں سے پوری گھاٹی اور دشمن کی نقل و حرکت پر نظر رکھی جاتی تھی۔"),

    ("amri-prehistoric-mounds", "Amri Prehistoric Indus Settlement Mounds", "آمری قبل از تاریخ آثار و قدیم ٹیلے جامشورو", "historical", "Jamshoro", 26.166667, 68.016667, 600,
     "Crucial 3600 BCE pre-Harappan archaeological site giving its name to the famous ancient Amri pottery culture.",
     "3600 قبل مسیح کی قدیم ہڑپائی تہذیب کا اہم ترین مرکز جس کے نام پر آمری ثقافت دنیا بھر میں جانی جاتی ہے۔",
     "Excavations by French archaeologist Jean-Marie Casal proved that advanced urban communities flourished here along the Indus River long before the rise of Mohenjo-daro, producing distinctive geometric painted ceramics.",
     "دریائے سندھ کے کنارے آمری کے یہ ٹیلے ثابت کرتے ہیں کہ موہنجودڑو سے بھی ہزار سال پہلے سندھ کی دھرتی پر اعلیٰ پائے کے انسان اور برتن سازی کی شاندار تہذیب آباد تھی۔"),

    ("lal-shahbaz-qalandar-shrine-sehwan", "Shrine of Hazrat Lal Shahbaz Qalandar (Sehwan)", "مزارِ اقدس حضرت لعل شہباز قلندر سیہون شریف", "religious", "Jamshoro", 26.425, 67.863889, 500,
     "13th-century golden-domed spiritual shrine of the patron Sufi saint of Sindh, revered by millions across South Asia.",
     "13ویں صدی کے عظیم صوفی بزرگ حضرت لعل شہباز قلندر کا سنہری گنبد والا مزار جو لاکھوں دلوں کا مرکز ہے۔",
     "Syed Usman Marwandi, known as Lal Shahbaz Qalandar, preached unconditional divine love and human equality. His magnificent shrine features a massive gilded dome, mirror-work halls, and centuries-old golden doors.",
     "سیہون شریف کی یہ مقدس درگاہ برصغیر میں محبت اور تصوف کی سب سے بڑی علامت ہے۔ اس کا چمکتا ہوا سنہری گنبد اور نوبت کی گونج دلوں کو وجد میں لا دیتی ہے۔"),

    ("dama-dum-mast-qalandar-courtyard", "Dhamaal Courtyard (Sehwan Sharif)", "دھمال کورٹ یارڈ سیہون شریف", "cultural", "Jamshoro", 26.425278, 67.863611, 300,
     "Spiritual open courtyard where the hypnotic, ecstatic Sufi Dhamaal dance is performed nightly to thunderous naqqara drums.",
     "وہ روحانی صحن جہاں روزانہ شام کو نقاروں کی گونجدار تھاپ پر فقراء اور زائرین وجدانی صوفیانہ دھمال ڈالتے ہیں۔",
     "Every evening at sunset, the resonant beat of enormous copper kettle drums (naqqara) and swirling dervishes in red robes create one of the most intense, trance-inducing mystical rituals in the Islamic world.",
     "مغرب کے بعد جب نوبت اور نقارے بجتے ہیں تو درگاہ کا صحن 'دمادم مست قلندر' کے نعروں سے گونج اٹھتا ہے اور عقیدت مند دنیا و مافیہا سے بے خبر ہو کر رقصِ درویشاں کرتے ہیں۔"),

    ("bodlo-bahar-shrine-springs", "Shrine of Bodlo Bahar (Sehwan)", "درگاہ بودلہ بہار سیہون شریف", "religious", "Jamshoro", 26.430556, 67.861111, 250,
     "Historic shrine of Qalandar's devoted disciple Sikandar Bodlo Bahar, surrounded by red flags and natural spring channels.",
     "حضرت لعل شہباز قلندر کے سب سے پیارے مرید حضرت بودلہ بہار کی درگاہ جہاں سرخ پرچم لہراتے ہیں۔",
     "Associated with deep mystic legends of selfless devotion, this shrine is visited by pilgrims who march with red banners and play earthen drums before paying homage at the main Qalandar sanctum.",
     "سیہون شریف میں قلندر پاک کے آستانے کے قریب واقع یہ درگاہ عشق اور ایثار کی علامت سمجھی جاتی ہے جہاں زائرین حاضری دے کر قلندر کی بارگاہ کا رخ کرتے ہیں۔"),

    ("manchhar-lake-boathouse-community", "Manchhar Lake Boathouse Fishing Community", "منچھر جھیل کشتیوں کے گھر و روایتی ماہی گیر جامشورو", "nature", "Jamshoro", 26.416667, 67.65, 2000,
     "South Asia's largest shallow freshwater lake home to the indigenous Mirbahar boat-dwelling water tribe.",
     "جنوبی ایشیا کی سب سے بڑی میٹھے پانی کی قدرتی جھیل جہاں میربحر قبیلہ لکڑی کی تیرتی کشتیوں میں نسلوں سے آباد ہے۔",
     "Covering over 260 square kilometers against the Kirthar foothills, Manchhar features wooden houseboats (boathouses) where fisherfolk cook, sleep, and live on the water, harvesting lotus roots and waterfowl.",
     "کیرتھر کے دامن میں پھیلی منچھر جھیل اپنے تیرتے ہوئے لکڑی کے گھروں اور 'بھن' (کنول کی جڑ) کی پیداوار کے لیے مشہور ہے جہاں پانی پر تیرتی زندگیاں سندھ کا منفرد روپ ہیں۔"),

    ("manchhar-lake-lotus-sanctuary", "Manchhar Lake Lotus & Pelican Sanctuary", "منچھر جھیل کنول باغات و پیلیکن پرندے", "nature", "Jamshoro", 26.433333, 67.666667, 1500,
     "Extensive wild aquatic lotus flower fields providing breeding habitat for Siberian pelicans and herons.",
     "جھیل پر کھلے جنگلی کنول کے پھولوں کا وسیع رقبہ جہاں سائبیریا سے آنے والے پیلیکن اور بگلے بسیرا کرتے ہیں۔",
     "During winter mornings, the calm waters of Manchhar are covered in blooming pink lotus flowers and thousands of migratory flamingos and pelicans diving for lake fish, creating a dreamlike natural spectacle.",
     "سردیوں کی صبح منچھر کے پانیوں پر تیرتے گلابی کنول کے پھول اور ہزاروں سفید پیلیکن پرندوں کی ڈائیو لگانے کے مناظر قدرت کا شاہکار ہیں۔"),

    ("gorakh-hill-station-benazir-point", "Gorakh Hill Station & Benazir Viewpoint", "گورکھ ہل اسٹیشن و بے نظیر ویو پوائنٹ دادو", "viewpoint", "Dadu", 26.866667, 67.15, 1200,
     "The 'Murree of Sindh' perched at 5,688 feet in the Kirthar mountains offering freezing winter nights and stargazing.",
     "کیرتھر کے پہاڑوں میں 5,688 فٹ بلند سندھ کا مری جہاں سردیوں میں درجہ حرارت منفی ہو جاتا ہے اور برف باری بھی ہوتی ہے۔",
     "Sindh's only high-altitude hill station, Gorakh features cool mountain breezes in summer, dramatic cloud inversions, clear milky way skies for astronomy, and a panoramic summit viewpoint looking into Balochistan.",
     "دادو کے پہاڑوں میں واقع گورکھ ہل اسٹیشن سندھ کا واحد سرد ترین تفریحی مقام ہے جہاں بل کھاتی سڑک، ٹھنڈی ہوائیں، بادلوں کے غول اور رات کے وقت ستاروں بھرا آسمان سیاحوں کو مسحور کر دیتا ہے۔"),

    ("gorakh-hill-midnight-ridge-camping", "Gorakh Hill Midnight Ridge Camping Site", "گورکھ ہل مڈنائٹ رج کیمپنگ گراؤنڈ دادو", "nature", "Dadu", 26.861111, 67.147222, 800,
     "Popular high-altitude tent camping ground along the rugged limestone ridges of Gorakh.",
     "گورکھ ہل کی اونچی چٹانی چوٹیوں پر کیمپنگ اور الاؤ کا مقبول ترین میدان جہاں سیاح خیمہ زن ہوتے ہیں۔",
     "Equipped for adventure seekers, visitors pitch tents under freezing night winds, enjoy live charcoal barbecue around campfires, and wake up to dramatic sunrises rising over the Kirthar mountain range.",
     "گورکھ کے اس اونچے مقام پر کیمپ لگا کر رات گزارنا، پہاڑی الاؤ کے گرد بیٹھنا اور صبح سویرے وادیوں سے سورج کو طلوع ہوتے دیکھنا زندگی کا ایک یادگار تجربہ ہے۔"),

    ("nai-gaj-valley-water-gorge", "Nai Gaj Valley & Fresh River Gorge", "نئی گاج وادی و قدرتی پہاڑی گھاٹی دادو", "nature", "Dadu", 26.916667, 67.416667, 1000,
     "A torrential mountain stream from Balochistan cutting through towering Kirthar limestone gorges into Dadu.",
     "بلوچستان کے پہاڑوں سے نکل کر کیرتھر کی دیوہیکل چٹانوں کو چیرتی ہوئی دادو میں گرنے والی نئی گاج کی خوبصورت ندی۔",
     "Renowned for its crystal-clear natural pools, ancient petroglyph rock carvings, and lush date palms clinging to vertical cliff walls, serving as the site of the strategic Nai Gaj Dam water reservoir.",
     "نئی گاج کی گھاٹی میں شفاف پانی کے قدرتی تالاب، کھجوروں کے نخلستان اور چٹانوں پر بنے ہزاروں سال پرانے تاریخی نقوش سیاحوں کو حیرت میں ڈال دیتے ہیں۔"),

    ("dadu-historic-shahi-bazaar", "Dadu Historic Shahi Bazaar & Grain Hub", "دادو تاریخی شاہی بازار و غلہ منڈی", "shopping", "Dadu", 26.733333, 67.783333, 400,
     "Central agricultural trading market and traditional Sindhi handicraft center of northern Dadu district.",
     "شمالی دادو کی مرکزی زرعی تجارتی منڈی اور روایتی سندھی دستکاریوں، کھیس اور اجرک کا بازار۔",
     "Known for its bustling trade in cotton, wheat, and handcrafted camel-leather footwear, the bazaar provides the commercial lifeblood for farming communities between Sehwan and Larkana.",
     "دادو کا شاہی بازار نہ صرف فصلوں کی بڑی تجارتی منڈی ہے بلکہ ہاتھ کے بنے سوتی کھیس، مٹی کے روایتی برتن اور لیدر کے جوتوں کا روایتی مرکز ہے۔"),

    # =========================================================================
    # MATIARI, HALA & TANDO ALLAHYAR (Crafts, Sufi Poetry & Mango Oases)
    # =========================================================================
    ("hala-glazed-kashi-tile-workshops", "Hala Glazed Kashi Tile Craft Workshops", "ہالہ کاشی ٹائلز دستکاری کارخانے مٹیاری", "cultural", "Matiari", 25.816667, 68.416667, 300,
     "World-famous artisanal studios where master craftsmen create blue-and-white hand-painted glazed tiles for Sufi shrines.",
     "دنیا بھر میں مشہور دستکاری کے کارخانے جہاں استاد کاریگر درگاہوں اور مساجد کے لیے نیلے اور سفید کاشی ٹائلز بناتے ہیں۔",
     "Carrying forward a 500-year-old terracotta and ceramic tradition, Hala's Kashigars paint cobalt and turquoise floral motifs onto kiln-fired clay plaques that grace the domes and facades of South Asia's holiest monuments.",
     "ہالہ کا کاشی کا کام سندھ کی دستکاریوں کا تاج ہے۔ خالص مٹی، قدرتی رنگوں اور شیشے کے مرکب سے تیار ہونے والے یہ نیلے ٹائلز پوری دنیا کی درگاہوں اور حویلیوں کی زینت بنتے ہیں۔"),

    ("hala-jandi-lacquered-wood-bazaar", "Hala Jandi Lacquered Wood Furniture Bazaar", "ہالہ جندی لکڑی کا روایتی فرنیچر بازار مٹیاری", "shopping", "Matiari", 25.819444, 68.422222, 250,
     "Centuries-old bazaar of hand-lathed woodcraft known as Jandi, creating vibrant yellow and red lacquer work.",
     "لکڑی کے لیتھ پر تیار ہونے والے خوبصورت سندھی فرنیچر، پنگھوڑوں اور شوپیسز کا صدیوں پرانا جندی بازار۔",
     "Crafted from local babool and shisham timber, master woodturners apply layers of natural colored lacquer, engraving delicate geometric motifs into traditional baby cots (peengho), footstools, and decorative spoons.",
     "ہالہ کا جندی فرنیچر اپنے شوخ پیلے اور سرخ رنگوں اور پائیداری کی وجہ سے ہر سندھی دلہن کے جہیز کا لازمی حصہ سمجھا جاتا ہے۔"),

    ("bhit-shah-shah-abdul-latif-shrine", "Shrine of Hazrat Shah Abdul Latif Bhittai (Bhit Shah)", "مزارِ اقدس حضرت شاہ عبد اللطیف بھٹائی رح بھٹ شاہ", "religious", "Matiari", 25.808333, 68.494444, 500,
     "The spiritual soul of Sindh, resting under a magnificent blue-and-yellow glazed tiled dome at Bhit Shah.",
     "سندھ کی روحانی روح اور عظیم ترین صوفی شاعر حضرت شاہ عبد اللطیف بھٹائی کا نیلے اور پیلے کاشی سے سجا مزار۔",
     "The supreme poet of the Sindhi language and author of Shah Jo Risalo, Bhittai celebrated divine oneness and human compassion. His shrine features vibrant kashi tilework, marble courtyards, and his original tomb.",
     "بھٹ شاہ سندھ کا دل ہے۔ شاہ لطیف کا کلام محبت، امن اور انسانیت کا عالمی منشور ہے۔ ان کے مزار کی فیروزی جھلک اور کمال فن دلوں کو سکون عطا کرتا ہے۔"),

    ("tambura-musical-heritage-bhit-shah", "Tambura Sufi Music Courtyard (Bhit Shah)", "تنبورہ صوفیانہ راگ کورٹ یارڈ بھٹ شاہ", "cultural", "Matiari", 25.808611, 68.494722, 300,
     "The sacred veranda where Faqirs have continuously sung Shah Jo Risalo on the stringed Tambura for over 250 years.",
     "وہ مقدس دالان جہاں بھٹائی کے فقیر گزشتہ ڈھائی سو سال سے دن رات مسلسل تانپورے پر شاہ کا راگ الاپتے ہیں۔",
     "Initiated by Shah Abdul Latif Bhittai himself with his invented string instrument the Danburo, hereditary faqir troupes sing the 30 musical Sur (modes) in continuous unbroken relays day and night.",
     "شاہ لطیف کے اپنے ایجاد کردہ ساز 'تنبورے' پر ان کے کلام کو گانا سندھ کا سب سے معتبر صوفیانہ راگ ہے۔ یہاں بیٹھ کر فقیروں کی سوز و گداز سے بھری تان سننا ایک سحر انگیز تجربہ ہے۔"),

    ("makhdoom-nooh-shrine-hala", "Shrine of Makhdoom Nooh (Old Hala)", "درگاہ مخدوم نوح رح پرانا ہالہ مٹیاری", "religious", "Matiari", 25.811111, 68.411111, 350,
     "16th-century spiritual sanctuary of the Sarwari Suhrawardi Sufi master, featuring towering minarets and kashi facades.",
     "16ویں صدی کے عظیم سہروردی بزرگ مخدوم نوح کا روحانی آستانہ جس کے بلند مینار اور کاشی کی دیواریں قابلِ دید ہیں۔",
     "Makhdoom Nooh translated the Holy Quran into Persian in the 16th century. His grand mausoleum in Old Hala is a major pilgrimage center renowned for its spiritual serenity and historic blue tile architecture.",
     "سندھ میں قرآنِ پاک کا فارسی میں ترجمہ کرنے والے مخدوم نوح کا یہ مزار پرانے ہالہ میں واقع ہے جہاں سالانہ عرس پر لاکھوں عقیدت مند حاضری دیتے ہیں۔"),

    ("tando-allahyar-ramapir-temple", "Shri Rama Pir Historic Hindu Temple (Tando Allahyar)", "شری راما پیر تاریخی ہندو مندر ٹنڈو الہ یار", "religious", "Tando Allahyar", 25.461111, 68.719444, 400,
     "One of South Asia's largest pilgrimage temples dedicated to Baba Ramdev Pir, drawing a million devotees annually.",
     "بابا رام دیو پیر کا جنوبی ایشیا کا سب سے بڑا تاریخی مندر جہاں سالانہ میلے پر دس لاکھ سے زائد یاتری آتے ہیں۔",
     "Built in the early 19th century around a sacred footprint stone, this expansive temple complex hosts one of the largest Hindu gatherings in Pakistan, where pilgrims carry vibrant flags on foot across Sindh.",
     "ٹنڈو الہ یار کا راما پیر مندر بین المذاہب ہم آہنگی کی روشن مثال ہے جہاں ہندو اور مسلمان عقیدت مند مل کر مرادیں مانگتے ہیں اور پیدل چل کر درشن کے لیے پہنچتے ہیں۔"),

    ("mango-orchards-of-mirwah-tando-allahyar", "Mirwah World-Famous Mango Orchards", "میرواہ عالمی شہرت یافتہ آم کے باغات ٹنڈو الہ یار", "nature", "Tando Allahyar", 25.472222, 68.733333, 1000,
     "Pakistan's premier Sindhrri mango capital holding sprawling sweet fruit estates along the Mirwah Canal.",
     "پاکستان کے مشہور ترین 'سندھڑی' آم کا دارالحکومت جہاں میرواہ نہر کے کنارے میٹھے آموں کے وسیع باغات ہیں۔",
     "Renowned internationally for producing the gold-standard 'Sindhri', 'Chunsa', and 'Anwar Ratol' mangoes, Tando Allahyar's climate yields sweet, aromatic fruit exported to gourmet markets worldwide.",
     "ٹنڈو الہ یار کا سندھڑی آم اپنی بے مثل مٹھاس، سنہری رنگت اور خوشبو کی بدولت دنیا کا بہترین آم مانا جاتا ہے، اور اس کے سرسبز باغات سیاحوں کو تازگی بخشتے ہیں۔"),

    ("nasarpur-ceramic-pottery-kilns", "Nasarpur Historic Glazed Pottery Kilns", "نصر پور تاریخی مٹی کے برتن و کاشی کے بھٹے", "cultural", "Tando Allahyar", 25.516667, 68.616667, 300,
     "Ancient 10th-century pottery center celebrated for hand-molded clay urns, water pitchers, and blue tiles.",
     "دسویں صدی کا قدیم برتن سازی کا تاریخی قصبہ جہاں ہاتھ سے بنے مٹی کے خوبصورت گھڑے اور کاشی بنتی ہے۔",
     "A sister city to Hala in ceramic excellence, Nasarpur's master potters use alluvial Indus mud to mold ultra-thin water pitchers (matkas), decorative vases, and enameled plates in wood-fired kilns.",
     "نصر پور کے کمہار دریا کی نرم مٹی سے ایسے ٹھنڈے اور نفیس گھڑے اور شوپیسز بناتے ہیں جن پر رنگ برنگے بیل بوٹے صدیوں کے فن کی گواہی دیتے ہیں۔"),

    ("odero-lal-jhulelal-river-shrine", "Shrine & Temple of Odero Lal (Jhulelal)", "درگاہ و مندر اوڈیرو لال (جھولے لال) مٹیاری", "religious", "Matiari", 25.75, 68.55, 450,
     "Sacred shared syncretic sanctuary where Hindus worship Jhulelal (deity of the Indus) and Muslims venerate Sheikh Tahir.",
     "مشترکہ مقدس زیارت گاہ جہاں ہندو جھولے لال (دریائے سندھ کے دیوتا) اور مسلمان شیخ طاہر کے طور پر عقیدت رکھتے ہیں۔",
     "A shining beacon of Sindh's syncretic interfaith heritage, this grand domed complex holds both an eternal flame (jyoti) and a Muslim prayer hall, celebrating the divine water saint who protected the people of Sindh.",
     "اوڈیرو لال کی درگاہ سندھ کی باہمی محبت اور رواداری کی عظیم مثال ہے جہاں ایک ہی احاطے میں مندر اور مسجد ساتھ ساتھ ہیں اور دریا کی برکتوں کے گیت گائے جاتے ہیں۔"),

    # =========================================================================
    # KHAIRPUR MIRS & KOT DIJI (Faiz Mahal, Kot Diji Fort, Date Oases)
    # =========================================================================
    ("kot-diji-fort-high-battlements", "Kot Diji Fort (Fort Ahmadabad)", "قلعہ کوٹ ڈیجی (قلعہ احمد آباد) خیرپور میرس", "historical", "Khairpur", 27.341667, 68.708333, 600,
     "1790 impregnable Talpur military fortress perched 110 feet high on a sheer limestone ridge overlooking the Rohri hills.",
     "1790ء کا ناقابلِ تسخیر تالپور فوجی قلعہ جو روہڑی کی پہاڑیوں پر 110 فٹ اونچائی پر سینہ تانے کھڑا ہے۔",
     "Built by Mir Sohrab Khan Talpur, Kot Diji features triple-tiered defense walls, 30-foot circular cannon bastions, and the famous 'Maryam' cannon, designed to withstand heavy artillery sieges.",
     "میر سہراب خان تالپور کا تعمیر کردہ یہ قلعہ سندھ کے سب سے محفوظ اور شاندار قلعوں میں شمار ہوتا ہے۔ اس کے بلند برجوں سے خیرپور کے کھجور کے باغات کا حدِ نگاہ نظارہ ملتا ہے۔"),

    ("kot-diji-pre-harappan-excavations", "Kot Diji Pre-Harappan Archaeological Excavations", "کوٹ ڈیجی قبل از ہڑپہ آثارِ قدیمہ خیرپور", "historical", "Khairpur", 27.338889, 68.705556, 400,
     "3300 BCE archaeological citadel proving the pre-Harappan urban roots of the Indus Valley Civilization.",
     "3300 قبل مسیح کی قدیم بستی کے آثار جو وادی سندھ کی تہذیب کے ابتدائی شہری ارتقاء کو ثابت کرتے ہیں۔",
     "Excavated by Dr. F.A. Khan, this site revealed a fortified citadel, defensive stone rubble walls, and the famous 'Kot Diji style' painted pottery featuring horned deities that preceded Mohenjo-daro.",
     "قلعہ کوٹ ڈیجی کے دامن میں واقع یہ قدیم آثار بتاتے ہیں کہ 5300 سال پہلے یہاں فصیل بند بستی آباد تھی جہاں کے برتنوں پر سینگوں والے دیوتا کے نقوش ملے ہیں۔"),

    ("faiz-mahal-royal-palace-khairpur", "Faiz Mahal (The Royal Talpur Palace)", "فیض محل شاہی تالپور محل خیرپور میرس", "historical", "Khairpur", 27.527778, 68.755556, 400,
     "1798 majestic classical pink-and-white palace of the Talpur Mirs set within manicured royal formal gardens.",
     "1798ء میں تالپور میروں کا تعمیر کردہ پرشکوہ گلابی اور سفید محل جو شاہی باغات کے درمیان واقع ہے۔",
     "Serving as the sovereign sovereign seat of the princely State of Khairpur, Faiz Mahal features magnificent carved plaster arcades, stained-glass reception halls, and original royal durbar thrones.",
     "ریاستِ خیرپور کے حکمرانوں کا یہ شاہی دربار ہال فرانسیسی اور مغل طرز کا شاندار سنگم ہے۔ اس کے شیشے کے جھومر اور سنہری تخت ریاست کی شاہی تاریخ کی یاد دلاتے ہیں۔"),

    ("mehrano-wildlife-reserve-khairpur", "Mehrano Wildlife Reserve & Royal Blackbuck Sanctuary", "مہرانو وائلڈ لائف ریزرو و کالا ہرن پناہ گاہ خیرپور", "nature", "Khairpur", 27.466667, 68.766667, 1000,
     "Private royal conservation sanctuary founded by the Talpur Mirs protecting endangered Blackbucks and Hog deer.",
     "تالپور میروں کا قائم کردہ نجی جنگلی حیات کا محفوظ پارک جہاں نایاب کالے ہرن اور پاڑھے آزاد گھومتے ہیں۔",
     "Spanning lush wetlands, dense acacia forests, and desert scrub, Mehrano hosts thriving herds of majestic horned Blackbucks, wild boars, and thousands of migratory ducks wintering on its private lake.",
     "خیرپور کا یہ شاہی ریزرو نایاب کالے ہرنوں کی بقاء کا سب سے محفوظ مسکن ہے جہاں قدرتی جھیل کے کنارے ہرنوں کی چوکڑیاں دل موہ لیتی ہیں۔"),

    ("khairpur-date-palm-oases-orchards", "Khairpur Date Palm Oases & Processing Orchards", "خیرپور کھجور کے وسیع نخلستان و باغات", "nature", "Khairpur", 27.533333, 68.766667, 1200,
     "Pakistan's premier date farming heartland holding millions of lush date palms producing Aseel dates.",
     "پاکستان میں کھجوروں کی پیداوار کا سب سے بڑا گڑھ جہاں لاکھوں کھجور کے درخت اصیل کھجور پیدا کرتے ہیں۔",
     "Spread across thousands of irrigated acres, Khairpur transforms into a golden spectacle during summer harvest, when millions of dates are sun-dried on vast mats to create sweet 'Chhohara' and premium fresh fruit.",
     "خیرپور کے دور دور تک پھیلے کھجور کے نخلستان سندھ کا حسن ہیں۔ گرمیوں میں جب کھجور کی کٹائی ہوتی ہے تو پورے خطے میں چھوہارے سکھانے کا ایک زبردست میلہ نظر آتا ہے۔"),

    ("sachal-sarmast-dargah-daraza-sharif", "Shrine of Hazrat Sachal Sarmast (Daraza Sharif)", "درگاہ حضرت سچل سرمست رح درازا شریف خیرپور", "religious", "Khairpur", 27.316667, 68.516667, 450,
     "18th-century shrine of the ecstatic Sufi poet known as the 'Attar of Sindh', celebrated for universal humanism.",
     "سندھ کے عظیم صوفی شاعر اور 'شاعرِ ہفت زباں' حضرت سچل سرمست کی درگاہ جو درازا شریف میں واقع ہے۔",
     "Abdul Wahab Farooqi, known as Sachal Sarmast ('Truthful Intoxicated One'), composed ecstatic mystic poetry in seven languages. His vibrant blue-and-turquoise tiled mausoleum draws lovers of truth from across the globe.",
     "سچل سرمست نے سات زبانوں میں عشقِ حقیقی کا کلام لکھا۔ درازا شریف میں ان کا خوبصورت مزار سندھ کے صوفیانہ ادب اور انسانی محبت کا درخشاں مینار ہے۔"),

    # =========================================================================
    # SUKKUR & ROHRI (Lansdowne Bridge, Sadhu Bela, Barrage, Rohri Havelis)
    # =========================================================================
    ("lansdowne-bridge-historic-steel-span", "Lansdowne Bridge Historic Steel Railway Span", "لینس ڈاؤن برج تاریخی فولادی ریلوے پل سکھر", "historical", "Sukkur", 27.697222, 68.895833, 500,
     "1889 marvel of Victorian cantilever engineering spanning the Indus River between Sukkur and Rohri.",
     "1889ء کا وکٹورین دور کا دیوہیکل فولادی کینٹی لیور پل جو سکھر اور روہڑی کے درمیان دریائے سندھ پر واقع ہے۔",
     "When completed in 1889, it was the longest cantilever railway span in the world. Built without central river piers, its dramatic steel arched trusses remain a triumphant landmark of civil engineering.",
     "1889ء میں دریائے سندھ پر بغیر کسی ستون کے کھڑا کیا جانے والا یہ عظیم الشان پل دنیا کا سب سے لمبا کینٹی لیور پل تھا اور آج بھی برطانوی انجینئرنگ کا ناقابلِ فراموش شاہکار ہے۔"),

    ("ayub-arch-bridge-sukkur", "Ayub Arch Bridge (Indus Rail Bridge)", "ایوب آرچ برج (ریلوے پل) سکھر", "historical", "Sukkur", 27.696111, 68.895556, 500,
     "1962 monumental steel railway arch bridge rising 207 feet above the Indus River beside Lansdowne Bridge.",
     "1962ء کا عظیم فولادی ریلوے محرابی پل جو لینس ڈاؤن پل کے متوازی 207 فٹ اونچا کمان کی طرح جھکا ہے۔",
     "Designed by world-renowned bridge engineer David B. Steinman, this graceful steel railway arch took over heavy train traffic from the aging Lansdowne Bridge, framing scenic river panoramas.",
     "لینس ڈاؤن پل کے بالکل ساتھ بنا یہ جدید محرابی پل اپنی خوبصورت فولادی کمان کے ساتھ سکھر کی تصویروں کا لازمی حصہ بن چکا ہے۔"),

    ("sadhu-bela-island-hindu-temple", "Sadhu Bela Island Hindu Temple (Menghraj Mandir)", "سادھو بیلا جزیرہ ہندو مندر سکھر", "religious", "Sukkur", 27.688889, 68.883333, 400,
     "1823 sacred island temple on the Indus River featuring white marble carvings, courtyards, and riverside ghats.",
     "دریائے سندھ کے درمیان واقع 1823ء کا مقدس جزیرہ مندر جہاں سفید سنگِ مرمر کے تراشیدہ محراب اور گھاٹ ہیں۔",
     "Founded by Baba Bankhandi Maharaj on an island in the Indus River, Sadhu Bela is one of the most revered Hindu pilgrimage sanctuaries in Pakistan, adorned with marble reliefs depicting mythological epics.",
     "دریائے سندھ کے بہتے پانیوں کے بیچوں بیچ واقع سادھو بیلا مندر اپنے سنگِ مرمر کے شاندار نقوش اور کشتی کے پرسکون سفر کے باعث مذہبی سیاحت کا دلکش مقام ہے۔"),

    ("masoom-shah-minaret-viewpoint", "Masoom Shah Minaret & Panoramic Viewpoint", "معصوم شاہ کا مینار و پینورامک ویو پوائنٹ سکھر", "historical", "Sukkur", 27.702778, 68.858333, 300,
     "1607 iconic 84-foot red brick tower built by historian Mir Masoom Shah offering 360-degree city views.",
     "1607ء کا 84 فٹ اونچا تاریخی سرخ اینٹوں کا مینار جس کی بالائی منزل سے پورے سکھر اور دریا کا نظارہ ہوتا ہے۔",
     "Climbing the 84 winding stone steps of this leaning Mughal-era minaret rewards visitors with magnificent panoramic vistas of Sukkur city, the Indus River bridges, and the sprawling date palm groves.",
     "مغل گورنر اور نامور مورخ میر معصوم شاہ کا تعمیر کردہ یہ تاریخی مینار سکھر کا ماتھے کا جھومر ہے جس کے اوپر چڑھ کر شہر اور دریائے سندھ کا نظارہ دل موہ لیتا ہے۔"),

    ("lab-e-mehran-riverside-promenade", "Lab-e-Mehran Indus Riverside Promenade", "لبِ مہران دریائے سندھ واک وے و پارک سکھر", "park", "Sukkur", 27.691667, 68.869444, 450,
     "Scenic landscaped municipal park on the banks of the Indus River offering shaded boat rides and family tea lawns.",
     "دریائے سندھ کے کنارے پر واقع خوبصورت تفریحی پارک جہاں کشتی رانی، سرسبز باغات اور ٹھنڈی ہوائیں میسر ہیں۔",
     "A cherished leisure promenade for Sukkur families, Lab-e-Mehran features riverside stone walks, boat docks for trips around Sadhu Bela island, and evening tea stalls watching illuminated bridges.",
     "سکھر کا سب سے مقبول عوامی پارک جہاں شام ہوتے ہی شہری دریا کے کنارے واک کرنے، تازہ ہوا کھانے اور بچوں کے ساتھ کشتیوں میں بیٹھنے کے لیے جمع ہوتے ہیں۔"),

    ("satyan-jo-asthan-seven-sisters-rohri", "Satyan-jo-Asthan (Tomb of the Seven Sisters)", "ستین جو آستان (سات سہیلیوں کا آستانہ) روہڑی", "historical", "Sukkur", 27.691667, 68.9, 350,
     "Historic 17th-century clifftop shrine on the Indus River shrouded in legends of seven pious maidens.",
     "دریائے سندھ کے کنارے اونچی چٹان پر واقع 17ویں صدی کا مقبرہ جو سات پردہ دار بہنوں کی روایت سے منسوب ہے۔",
     "Perched on a yellow limestone cliff overlooking the river, this necropolis features richly decorated tile cenotaphs, shady carved stone pavilions, and scenic vistas of Lansdowne Bridge spanning the gorge.",
     "روہڑی کی چٹان پر واقع یہ تاریخی مقام نیلے کاشی ٹائلوں سے سجا ہے جہاں سے لینس ڈاؤن پل اور سکھر شہر کا دلفریب منظر دکھائی دیتا ہے۔"),

    ("rohri-historic-carved-wooden-havelis", "Rohri Historic Carved Wooden Balcony Havelis", "روہڑی تاریخی حویلیاں و لکڑی کے جھروکے", "historical", "Sukkur", 27.675, 68.897222, 350,
     "Labyrinthine medieval streets of Rohri holding 18th-century multi-storey brick havelis with teakwood jharokas.",
     "روہڑی کی قدیم پرپیچ گلیاں جہاں 18ویں صدی کی اینٹوں کی حویلیاں اور لکڑی کے نفیس جھروکے موجود ہیں۔",
     "Rising steeply on limestone hills, Rohri's old quarters preserve magnificent multi-storey merchant homes featuring intricately hand-carved Burmese teak windows, overhanging balconies, and winding cobbled alleys.",
     "روہڑی کا قدیم شہر اپنے پتھریلے راستوں اور صدیوں پرانی حویلیوں کے باعث زندہ عجائب گھر ہے جن کے لکڑی کے بالکونیاں سندھ کی سنہری تجارتی تاریخ کو بیان کرتی ہیں۔"),

    ("aror-rock-formations-mosque-ruins", "Aror (Alor) Rock Formations & Historic Ruins", "اروڑی کی چٹانیں و محمد بن قاسم مسجد کے کھنڈرات سکھر", "historical", "Sukkur", 27.65, 68.95, 600,
     "Ancient Hindu capital of Sindh captured by Muhammad bin Qasim in 711 CE, set amid dramatic limestone cliffs.",
     "سندھ کا قدیم دارالحکومت جسے 711ء میں محمد بن قاسم نے فتح کیا، جو بلند و بالا چٹانوں کے درمیان واقع ہے۔",
     "Featuring towering natural limestone pillars, pre-historic chert quarries, and the stone foundations of Sindh's earliest congregational mosques overlooking the ancient abandoned dry riverbed of the Indus.",
     "راجہ داہر کا یہ تاریخی دارالحکومت حیرت انگیز چٹانی ساختوں کا حامل ہے جہاں محمد بن قاسم کے دور کی قدیم مسجد کی بنیادیں اور تاریخ کے انمٹ نقوش موجود ہیں۔"),

    # =========================================================================
    # LARKANA, SHIKARPUR & UPPER SINDH (Mohenjo-daro, Bazaars, Havelis)
    # =========================================================================
    ("mohenjo-daro-buddhist-stupa-great-bath", "Mohenjo-daro Buddhist Stupa & Great Bath", "موہنجودڑو بدھ اسٹوپا و عظیم حمام لاڑکانہ", "historical", "Larkana", 27.329167, 68.138889, 800,
     "5,000-year-old UNESCO World Heritage bronze-age metropolis featuring the iconic brick Stupa and Great Bath.",
     "5000 سال قدیم عالمی ورثہ وادی سندھ کی تہذیب کا عظیم شہر جہاں تاریخی اسٹوپا اور دیوہیکل حمام موجود ہے۔",
     "The crown jewel of South Asian archaeology, Mohenjo-daro was a master-planned metropolis of baked brick architecture, covered drainage grids, multi-storey houses, and the monumental ritual Great Bath.",
     "موہنجودڑو دنیا کی قدیم ترین شہری تہذیبوں کا شاہکار ہے۔ اس کے پکی اینٹوں کے مکانات، زیرِ زمین نکاسی آب کا نظام اور عظیم اسٹوپا انسان کی اولین سائنسی بصیرت کا ثبوت ہیں۔"),

    ("mohenjo-daro-archaeological-museum", "Mohenjo-daro Archaeological Museum", "موہنجودڑو آثارِ قدیمہ عجائب گھر لاڑکانہ", "museum", "Larkana", 27.327778, 68.136111, 400,
     "Renowned site museum displaying original terracotta figurines, seals, bronze tools, and jewelry from the excavations.",
     "موہنجودڑو کا تاریخی عجائب گھر جہاں کھدائی سے ملنے والی مہریں، زیورات، اوزار اور مٹی کے بت محفوظ ہیں۔",
     "Holding priceless relics including the Priest-King replica, Dancing Girl casts, engraved steatite unicorn seals, standard weights, and stone bead necklaces showcasing the sophisticated lifestyle of the ancient Indus people.",
     "اس میوزیم میں وادی سندھ کے کاریگروں کے بنائے ہوئے مٹی کے کھلونے، ناپ تول کے پتھر، برتن اور مشہور پروہت راجہ اور ناچتی ہوئی لڑکی کے ماڈلز تاریخ کے شائقین کے لیے شاندار خزانہ ہیں۔"),

    ("garhi-khuda-bakhsh-bhutto-mausoleum", "Garhi Khuda Bakhsh Bhutto Family Mausoleum", "گڑھی خدا بخش بھٹو خاندان کا تاریخی مزار لاڑکانہ", "historical", "Larkana", 27.569444, 68.361111, 500,
     "Monumental white marble domed mausoleum holding the tombs of Zulfikar Ali Bhutto and Benazir Bhutto.",
     "سفید سنگِ مرمر کا دیوہیکل گنبد والا مقبرہ جہاں ذوالفقار علی بھٹو اور بینظیر بھٹو شہید کی قبریں واقع ہیں۔",
     "Inspired by Mughal and Islamic architecture, this imposing white edifice features soaring arches, carved calligraphic facades, and vast prayer plazas drawing millions of political pilgrims annually.",
     "مغلیہ طرز پر سفید سنگِ مرمر سے تعمیر شدہ یہ عظیم مقبرہ پاکستان کی جدید سیاسی تاریخ کا اہم ترین مرکز ہے جہاں جمہوریت کے چاہنے والے خراجِ عقیدت پیش کرنے آتے ہیں۔"),

    ("shikarpur-covered-dhak-bazaar", "Shikarpur Covered Bazaar (Dhak Bazaar)", "شکارپور ڈھک بازار (چھت والا تاریخی بازار)", "shopping", "Shikarpur", 27.955556, 68.636111, 400,
     "Legendary historic timber-roofed covered bazaar established in the 17th century as a trans-Eurasian trade hub.",
     "17ویں صدی کا لکڑی کی چھت والا تاریخی ڈھکا ہوا بازار جو وسطی ایشیا اور ہندوستان کی تجارت کا مرکز تھا۔",
     "Constructed with a continuous wooden ceiling to block out the fierce summer sun, this narrow bazaar once financed caravan trade to Bukhara, Samarkand, and Kandahar through Shikarpur's legendary Hundi banking system.",
     "لکڑی کی اونچی چھت سے ڈھکا ہوا یہ انوکھا بازار ایشیا کے تاریخی بازاروں میں سے ایک ہے۔ یہاں کے ساہوکاروں کی ہنڈیاں ماضی میں بخارا، سمرقند اور قندھار تک کیش ہوتی تھیں۔"),

    ("shikarpur-master-pickle-achar-bazaar", "Shikarpur World-Famous Achar & Pickle Bazaar", "شکارپور عالمی شہرت یافتہ اچار مارکیٹ", "food", "Shikarpur", 27.958333, 68.638889, 250,
     "Pakistan's pickle capital celebrated for mustard oil pickles of mango, garlic, mixed vegetable, and stuffed chilies.",
     "پاکستان کے مشہور ترین روایتی شکارپوری اچار کی دکانیں جہاں سرسوں کے تیل اور مصالحوں میں بنے لذیذ اچار ملتے ہیں۔",
     "Famous across South Asia for over a century, Shikarpuri achar combines raw green mangoes, whole garlic cloves, carrots, and secret spiced blends aged in clay jars to create the subcontinent's most piquant condiment.",
     "شکارپور کا اچار اپنے منفرد ذائقے اور دیسی مصالحوں کی بدولت پاکستان کی پہچان ہے۔ ہر آنے والا مسافر یہاں سے اچار اور مٹھائی کا تحفہ ساتھ لے جانا فرض سمجھتا ہے۔"),

    ("shikarpur-traditional-falooda-kulfi", "Shikarpur Historic Falooda & Kulfi Corners", "شکارپور روایتی فالودہ و قلفی مارکیٹ", "food", "Shikarpur", 27.954167, 68.635, 200,
     "Famous dessert shops serving hand-churned frozen cream Kulfi topped with hand-pressed vermicelli and kewra syrup.",
     "شکارپور کے تاریخی حلوائیوں کی دکانیں جہاں مٹکے والی ربڑی قلفی اور کیوڑا عرق سے تیار فالودہ پیش کیا جاتا ہے۔",
     "Generations-old sweetmasters churn pure buffalo milk over ice and rock salt in wooden casks, serving thick slices of decadent saffron kulfi layered with cooling sev noodles that provide the ultimate summer refreshment.",
     "شکارپور کی مٹکے والی خالص دودھ کی قلفی اور کڑک فالودہ گرمیوں کی دوپہر میں تازگی بخشتا ہے اور اپنے روایتی ذائقے کی بدولت سندھ بھر میں مقبول ہے۔"),

    ("shikarpur-heritage-merchant-havelis", "Shikarpur Heritage Merchant Havelis", "شکارپور تاریخی تاجر حویلیاں و جھروکے", "historical", "Shikarpur", 27.952778, 68.633333, 400,
     "Opulent 19th-century mansions featuring carved teakwood jharokas, imported Italian floor tiles, and cast iron grilles.",
     "19ویں صدی کے بین الاقوامی تاجروں کی شاندار حویلیاں جن پر لکڑی کی باریک سنگتراشی اور اطالوی فرش سجے ہیں۔",
     "Testament to Shikarpur's golden era when its merchants controlled finance houses from London to St. Petersburg, these grand multi-storey mansions boast intricate wooden facades and ornate European ironwork.",
     "وسطی ایشیا سے یورپ تک تجارت کرنے والے شکارپوری سیٹھوں کی بنائی گئی یہ بلند و بالا حویلیاں نوآبادیاتی دور کی خوشحالی اور فنِ تعمیر کا بے نظیر نمونہ ہیں۔"),

    # =========================================================================
    # THARPARKAR & UMERKOT (Desert Forts, Jain Temples, Karoonjhar Granite)
    # =========================================================================
    ("umerkot-fort-akbar-birthplace", "Umerkot Fort & Emperor Akbar Birthplace", "عمرکوٹ قلعہ و جائے پیدائش شہنشاہ اکبر", "historical", "Umerkot", 25.361111, 69.741667, 500,
     "Historic medieval desert fortress where Mughal Emperor Akbar the Great was born in 1542 during Humayun's exile.",
     "تاریخی صحرائی قلعہ جہاں 1542ء میں مغل شہنشاہ جلال الدین محمد اکبر پیدا ہوا جب ہمایوں نے یہاں پناہ لی تھی۔",
     "Featuring towering mud and brick ramparts, an ancient cannon battery on an elevated bastion, and an imperial memorial pavilion marking the exact birthplace of Emperor Akbar set within the desert citadel.",
     "رانا پرشاد کی پناہ گاہ میں پیدا ہونے والے عظیم مغل شہنشاہ اکبر کی جائے پیدائش کی یادگار اور عمرکوٹ کا یہ تاریخی قلعہ مغل تاریخ کا ایک ناقابلِ فراموش باب ہے۔"),

    ("marvis-well-bhalwa-tharparkar", "Marvi's Well (Marvi jo Kuan) at Bhalwa", "ماروی جو کھوہ (ماروی کا کنواں) بھالوا تھرپارکر", "cultural", "Tharparkar", 24.883333, 70.183333, 350,
     "Historic desert well celebrated in the immortal Sindhi folktale of Umar and the virtuous rural maiden Marvi.",
     "تھر کا تاریخی کنواں جہاں عمر ماروی کی سچی داستان رقم ہوئی اور ماروی نے اپنے وطن اور دھرتی سے وفاداری نبھائی۔",
     "Immortalized by Shah Abdul Latif Bhittai as the supreme symbol of love for one's homeland, this sweetwater desert well features an open-air cultural museum and amphitheatres honoring Thar's heroic daughter.",
     "عمر سومرو کے محل کی تمام آسائشیں ٹھکرا کر اپنے دیس کی مٹی اور پنھواروں کو ترجیح دینے والی ماروی کی یاد میں بنا یہ کنواں حب الوطنی کا مقدس استعارہ ہے۔"),

    ("mithi-gadhi-bhit-sand-dune-viewpoint", "Gadhi Bhit Giant Sand Dune Viewpoint (Mithi)", "گڈھی بھٹ ریت کا دیوہیکل ٹیلا و ویو پوائنٹ مٹھی تھرپارکر", "viewpoint", "Tharparkar", 24.738889, 69.8, 400,
     "The highest natural sand dune in Mithi offering breathtaking 360-degree sunset panoramas across the Thar Desert.",
     "مٹھی شہر کا سب سے اونچا ریت کا قدرتی ٹیلا جہاں سے تھر کے صحرا اور غروبِ آفتاب کا دلکش 360 ڈگری نظارہ ملتا ہے۔",
     "Overlooking the peaceful desert capital of Mithi where peacocks roam freely and Hindu-Muslim harmony thrives, visitors climb stone steps to the summit pavilion for cool evening breezes and sweeping dune views.",
     "مٹھی شہر کے بیچوں بیچ واقع یہ اونچا ریتلا ٹیلا شام کے وقت ٹھنڈی ہوا کھانے اور ریت کے سمندر میں ڈوبتے سورج کا سنہری نظارہ دیکھنے کی بہترین جگہ ہے۔"),

    ("mithi-sant-nenuram-ashram", "Sant Nenuram Ashram & Langar (Mithi)", "سنت نینورام آشرم و لنگر مٹھی تھرپارکر", "cultural", "Tharparkar", 24.741667, 69.797222, 350,
     "Historic philanthropic ashram serving free hot vegetarian meals to thousands of travelers and birds daily.",
     "تاریخی روحانی آشرم جہاں گزشتہ ایک صدی سے بلا تفریقِ مذہب و ملت روزانہ ہزاروں افراد کو مفت کھانا کھلایا جاتا ہے۔",
     "A testament to Thar's profound culture of humanitarian service, this serene ashram feeds hundreds of wild peacocks at dawn, maintains shaded guest chambers, and serves continuous hot lentils, roti, and sweets.",
     "سنت نینورام کا یہ آشرم انسانیت اور سخاوت کی زندہ مثال ہے جہاں صبح سویرے سینکڑوں مور دانا چگنے آتے ہیں اور ہر مسافر کو محبت سے کھانا پیش کیا جاتا ہے۔"),

    ("karoonjhar-mountains-nagarparkar", "Karoonjhar Mountains Pink Granite Peaks", "کارونجھر پہاڑ گلابی گرینائٹ چٹانیں نگرپارکر تھر", "nature", "Tharparkar", 24.35, 70.75, 2500,
     "Ancient pink and grey granite mountain range in Nagarparkar rich in mineral veins, waterfalls, and folklore.",
     "نگرپارکر میں گلابی اور سرمئی گرینائٹ کا قدیم ترین پہاڑی سلسلہ جہاں بارشوں میں قدرتی آبشاریں اور جھرنے بہتے ہیں۔",
     "Rising dramatically out of the flat desert sands along the Indian border, the sacred Karoonjhar hills yield 100 kilograms of gold daily in local folklore, supporting rare plant species, wild peacocks, and Jain ruins.",
     "'کارونجھر روزانہ سو کلو سونا اگلتا ہے'—یہ مثل تھر کے اس خوبصورت پہاڑ کے لیے مشہور ہے۔ برسات کے موسم میں جب یہ چٹانیں دھل جاتی ہیں تو ان سے بہتے جھرنے جنت کا منظر پیش کرتے ہیں۔"),

    ("gori-temple-52-domes-jain-shrine", "Gori Jain Temple (52-Dome Medieval Shrine)", "گوری جین مندر (52 گنبد والا تاریخی مندر) نگرپارکر", "historical", "Tharparkar", 24.583333, 70.516667, 450,
     "1375 CE medieval Jain temple in Thar featuring 52 domed cupolas and ancient Jain fresco paintings on the ceiling.",
     "1375ء کا قرونِ وسطیٰ کا جین مندر جس کی چھت پر 52 گنبد اور نایاب قدیم مصوری کے نقوش موجود ہیں۔",
     "Constructed from local marble and sandstone, Gori Temple is renowned across South Asia for its intricate domed ceilings adorned with 14th-century Jain religious frescoes depicting Tirthankaras and royal processions.",
     "صحرا کے ریتلے ٹیلوں کے درمیان واقع 52 گنبدوں والا یہ تاریخی مندر جین فنِ تعمیر کا نایاب شاہکار ہے جس کے اندرونی گنبدوں پر بنی صد سالہ پینٹنگز آج بھی دل موہ لیتی ہیں۔"),

    ("bhodesar-mosque-marble-pillars", "Bhodesar Mosque & White Marble Pillars", "بھوڈیسر مسجد و سفید سنگِ مرمر کے ستون نگرپارکر", "historical", "Tharparkar", 24.366667, 70.733333, 300,
     "1505 historic white marble mosque built by Sultan Mahmud Begada of Gujarat at the base of the Karoonjhar hills.",
     "1505ء میں گجرات کے سلطان محمود بیگڑا کی تعمیر کردہ سفید سنگِ مرمر کے ستونوں والی خوبصورت تاریخی مسجد۔",
     "Built in 1505 from sparkling white marble salvaged from regional temples, this compact mosque features arched bays, intricately carved pillars, and an adjacent stone water reservoir overlooking the granite cliffs.",
     "کارونجھر پہاڑ کے دامن میں واقع یہ خوبصورت چھوٹی مسجد اپنے تراشیدہ سنگِ مرمر کے ستونوں اور پرسکون تالاب کے ساتھ اسلامی اور راجستھانی فنِ تعمیر کا دلکش امتزاج ہے۔"),

    ("sardharo-mountain-spring-shiva-temple", "Sardharo Natural Spring & Shiva Temple", "سردھارو قدرتی چشمہ و شیو مندر نگرپارکر", "religious", "Tharparkar", 24.361111, 70.766667, 400,
     "Perennial natural freshwater mountain spring emerging from granite boulders at Karoonjhar, sacred to Lord Shiva.",
     "کارونجھر کی گرینائٹ چٹانوں سے پھوٹنے والا سال بھر بہنے والا میٹھا چشمہ اور شیو بھگوان کا مقدس مندر۔",
     "Nestled in a dramatic rocky canyon of the Karoonjhar hills, Sardharo is a major pilgrimage center where devotees bathe in sacred spring waters and perform funeral rites amidst wild peacocks and granite pools.",
     "پہاڑوں کے بیچ بہتا یہ قدرتی چشمہ نگرپارکر کا روحانی مرکز ہے جہاں ٹھنڈا میٹھا پانی پہاڑ کے سینے سے ابلتا ہے اور چاروں طرف سبزہ اور مور رقص کرتے ہیں۔"),

    ("kasbo-village-peacocks-oasis", "Kasbo Village Desert Oasis & Peacock Sanctuary", "کاسبو گاؤں نخلستان و موروں کا مسکن نگرپارکر", "nature", "Tharparkar", 24.316667, 70.833333, 500,
     "Idyllic agricultural desert village bordered by Indian frontier fences where hundreds of wild peacocks roam freely.",
     "نگرپارکر کی سرحد پر واقع خوبصورت نخلستان جہاں سینکڑوں جنگلی مور گھروں کی چھتوں اور کھیتوں میں گھومتے ہیں۔",
     "Known for its sweet underground water aquifers that nourish lush green onion and vegetable patches in the heart of the desert, Kasbo offers magical encounters with wild peacocks calling from neem trees at sunset.",
     "کاسبو گاؤں صحرائے تھر کا وہ حیرت انگیز نخلستان ہے جہاں میٹھا پانی زمین سے نکلتا ہے اور ہر گھر کے باہر مور انسانوں کے ساتھ گھل مل کر دانا چگتے نظر آتے ہیں۔"),

    ("churrio-jabal-durga-temple", "Churrio Jabal Durga Mata Hilltop Temple", "چوڑیوجبل درگا ماتا مندر نگرپارکر", "religious", "Tharparkar", 24.316667, 70.916667, 500,
     "Spectacular granite hill right on the border crowned by a historic temple dedicated to Hindu Goddess Durga.",
     "پاک بھارت سرحد پر واقع خوبصورت گرینائٹ کا پہاڑ جس کی چوٹی پر ماتا درگا کا تاریخی مندر واقع ہے۔",
     "Named 'Churrio' for the sound of glass bangles, this isolated granite outcrop is mined for premium stone. Pilgrims climb hundreds of steps to the temple sanctum for breathtaking views spanning both Pakistan and India.",
     "چوڑیوں کی کھنک سے منسوب یہ پہاڑ دور سے ایک اہرام کی طرح نظر آتا ہے۔ اس کی چوٹی پر بنے مندر سے صحرا کا لاانتہا نظارہ سرحد کے دونوں طرف دکھائی دیتا ہے۔"),

    ("naukot-fort-gateway-to-thar", "Naukot Fort (Gateway to the Thar Desert)", "قلعہ نوکوٹ (صحرائے تھر کا تاریخی گیٹ وے) میرپور خاص", "historical", "Mirpur Khas", 24.858333, 69.208333, 500,
     "1814 brick fortress built by Mir Karam Ali Khan Talpur to safeguard the desert border and caravan trade.",
     "1814ء میں میر کرم علی خان تالپور کا تعمیر کردہ اینٹوں کا قلعہ جو صحرائے تھر کا تاریخی دروازہ کہلاتا ہے۔",
     "Featuring an impressive arched entrance tunnel, heavy semicircular corner bastions, and high watchtowers, Naukot Fort served as the fortified military staging outpost for caravans entering the Thar Desert.",
     "صحرائے تھر کے دہانے پر واقع یہ قلعہ اینٹوں کی مضبوط فصیل اور سرنگ نما داخلی دروازے کی بدولت تالپوروں کی عسکری صلاحیت کا تاریخی شاہکار ہے۔"),

    # =========================================================================
    # SANGHAR & SHAHEED BENAZIRABAD (Mansura, Chotiari, Hurs, Nawabshah)
    # =========================================================================
    ("mansura-ancient-arab-capital-ruins", "Mansura Ancient Arab Capital Archaeological Ruins", "منصورہ قدیم عرب دارالحکومت کے آثار سانگھڑ", "historical", "Sanghar", 25.866667, 68.783333, 800,
     "Ruins of the legendary 8th-century capital of the Umayyad and Abbasid Caliphates in Sindh, near Shahdadpur.",
     "شہداد پور کے قریب 8ویں صدی میں بنو امیہ اور بنو عباس کے دور میں سندھ کے عظیم دارالحکومت کے کھنڈرات۔",
     "Founded around 730 CE after the conquest of Muhammad bin Qasim, Mansura was a sprawling metropolis of brick mansions, copper coins, and one of the earliest congregational mosques built in South Asia.",
     "تاریخِ اسلام کا یہ عظیم الشان شہر بصرہ اور بغداد کی طرز پر بسایا گیا تھا۔ کھدائی سے ملنے والے سکے، کانسی کے دروازے اور جامع مسجد سندھ کے سنہری عرب دور کی گواہی دیتے ہیں۔"),

    ("chotiari-reservoir-wetland-complex", "Chotiari Reservoir & Wetland Wildlife Complex", "چوٹیاری ریزروائر و قدرتی آبی جھیلیں سانگھڑ", "nature", "Sanghar", 26.15, 69.066667, 2000,
     "Vast 18,000-hectare artificial and natural wetland complex bordering the Thar Desert, home to marsh crocodiles.",
     "صحرائے تھر کے کنارے 18 ہزار ہیکٹر پر پھیلا عظیم آبی ذخیرہ جہاں دلدلی مگرمچھ اور نایاب پرندے پائے جاتے ہیں۔",
     "Created by linking natural depressions with the Nara Canal, Chotiari is a critical ecosystem sheltering one of Pakistan's largest populations of indigenous Mugger Crocodiles, hog deer, and wintering waterbirds.",
     "ریت کے ٹیلوں کے بیچ میں نیلے پانیوں کا یہ دیوہیکل سمندر سندھ کا پوشیدہ قدرتی عجوبہ ہے جہاں خطرناک مگرمچھ اور جنگلی ہرن آزاد گھومتے ہیں۔"),

    ("makhi-forest-hur-resistance-base", "Makhi Forest Historic Hur Resistance Sanctuary", "ماکھی جنگل و حر مجاہدین کی تاریخی پناہ گاہ سانگھڑ", "historical", "Sanghar", 26.25, 69.05, 1200,
     "Dense historic riverine forest and marshland that served as the impregnable base for the anti-colonial Hur uprising.",
     "گھنے جنگلات اور دلدلوں کا تاریخی خطہ جو انگریز سامراج کے خلاف پیر پگارا کے حُر مجاہدین کا ناقابلِ تسخیر گڑھ تھا۔",
     "Led by the heroic Pir Sibghatullah Shah Rashdi (Suriyeh Badshah), the Hur fighters fought guerrilla campaigns against the British Empire from deep within the impenetrable thickets of Makhi Forest in the 1940s.",
     "سوریہ بادشاہ کی قیادت میں آزادی کا علم بلند کرنے والے حُر مجاہدین کا یہ مسکن سندھ کی جدوجہدِ آزادی کی تاریخ کا سب سے جرات مندانہ باب ہے۔"),

    ("nawabshah-central-jamia-mosque", "Nawabshah Central Jamia Mosque & Clock Tower", "نواب شاہ مرکزی جامع مسجد و کلاک ٹاور شہید بینظیر آباد", "religious", "Shaheed Benazirabad", 26.244444, 68.411111, 350,
     "Sprawling congregational mosque in the center of Nawabshah featuring soaring white minarets and arcaded courtyards.",
     "نواب شاہ کے دل میں واقع عظیم مرکزی جامع مسجد جس کے بلند سفید مینار اور کشادہ دالان شہر کی پہچان ہیں۔",
     "The religious centerpiece of Shaheed Benazirabad district, this grand mosque hosts thousands of worshippers for Friday congregations and Eid prayers, anchoring the city's bustling market square.",
     "شہید بینظیر آباد کی یہ پروقار جامع مسجد روایتی اسلامی خطاطی اور محرابوں سے سجی ہے اور شہر کے سماجی و مذہبی میل جول کا محور ہے۔"),
]


def get_interior_sindh_mega() -> list[dict]:
    records = []
    for item in INTERIOR_SINDH_DATA:
        records.append(make_clean_record(
            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region="Sindh",
            lat=item[5], lon=item[6], radius=item[7], short_en=item[8], short_ur=item[9], desc_en=item[10], desc_ur=item[11]
        ))
    return records

