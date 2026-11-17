"""Khyber Pakhtunkhwa & Balochistan Landmarks Expansion Dataset.

Covers:
- KP: Peshawar Old City, Swat Valley, Hazara/Kaghan, Chitral & Kalash, Kumrat.
- Balochistan: Makran Coast (Kund Malir, Ormara, Gwadar, Astola, Jiwani),
  Quetta, Ziarat Juniper Forest, Moola Chotok, Pir Ghaib, Bolan Pass.
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def get_kp_balochistan_full() -> list[dict]:
    items = []

    kp_sites = [
        # Peshawar & Historic Core
        ("bala-hissar-fort-peshawar", "Bala Hissar Fort", "قلعہ بالاحصار پشاور", "historical", "Peshawar", 34.013889, 71.569444, 450,
         "Historic royal citadel rising over Peshawar, used as a royal residence by the Durranis, Sikhs, and British.",
         "پشاور کا بلند و بالا شاہی قلعہ جو درانی، سکھ اور برطانوی ادوار میں شاہی رہائش گاہ رہا ہے۔",
         "Mentioned by Babur in 1519 and rebuilt by Sher Shah Suri, Bala Hissar ('High Fort') towers on an ancient mound. Its massive ramparts offer panoramic views across the Peshawar valley to the Khyber Pass.",
         "بابر کی تزکِ بابری میں مذکور یہ تاریخی قلعہ پشاور کا ماتھا ہے۔ اس کی بلند فصیلیں اور برج درہ خیبر کی سمت سے آنے والے حملہ آوروں پر نگاہ رکھنے کے لیے بنائی گئی تھیں۔"),
        ("bab-e-khyber-jamrud", "Bab-e-Khyber (Gateway to Khyber)", "بابِ خیبر جمرود", "attraction", "Landi Kotal", 34.004722, 71.381389, 300,
         "Monumental stone gateway marking the historic entrance to the Khyber Pass on Grand Trunk Road.", "جی ٹی روڈ پر واقع تاریخی پتھریلا دروازہ جو درہ خیبر کے آغاز کی علامت ہے۔",
         "Constructed in 1964 adjacent to the 1836 Sikh fort of Jamrud, Bab-e-Khyber is a national symbol commemorating the Silk Road gateway between South and Central Asia.",
         "1964ء میں جمرود کے تاریخی قلعے کے قریب تعمیر ہونے والا یہ گیٹ وے برصغیر اور وسطی ایشیا کے درمیان تاریخی شاہراہ ریشم اور درہ خیبر کا باقاعدہ داخلی دروازہ ہے۔"),
        ("namak-mandi-food-street-peshawar", "Namak Mandi Food Street (Charsi Tikka)", "نمک منڈی فوڈ اسٹریٹ (چرسی تکہ) پشاور", "food", "Peshawar", 34.006944, 71.573611, 300,
         "World-famous meat gastronomy haven in Peshawar, home of authentic salted lamb karahi and dum pukht.", "دنیا بھر میں مشہور پشاور کی نمک منڈی جہاں دنبہ کڑاہی، چرسی تکہ اور دم پخت تیار ہوتا ہے۔",
         "Namak Mandi ('Salt Market') is legendary for authentic Pashtun cuisine. Master chefs cook whole lamb cuts in their own animal fat with only coarse salt and green chilies, served with hot tandoori naan.",
         "پشاور کی نمک منڈی دنبے کی کڑاہی، چرسی تکہ اور روایتی روش کا عالمی مرکز ہے جہاں گوشت کو بغیر کسی مصنوعی مصالحے کے صرف نمک اور چربی میں تیار کیا جاتا ہے۔"),
        ("islamia-college-peshawar", "Islamia College Peshawar", "اسلامیہ کالج پشاور", "historical", "Peshawar", 33.998611, 71.483333, 400,
         "Historic 1913 educational institution designed in Victoria-Mughal style, featured on Pakistan's 1,000-rupee note.", "1913ء کا تاریخی تعلیمی ادارہ جو پاکستانی 1000 روپے کے کرنسی نوٹ کی زینت ہے۔",
         "Founded in 1913 by Nawab Sir Sahibzada Abdul Qayyum and Sir George Roos-Keppel, Islamia College's red-brick domes, Islamic arches, and clock tower played a pivotal role in the Pakistan Movement.",
         "1913ء میں قائم ہونے والا اسلامیہ کالج پشاور برصغیر کے مسلمانوں کی بیداری اور تحریکِ پاکستان کا اہم قلعہ رہا ہے۔ اس کے خوبصورت گنبد اور محرابیں فنِ تعمیر کا شاہکار ہیں۔"),
        
        # Swat Valley
        ("malam-jabba-ski-resort", "Malam Jabba Ski Resort & Peaks", "مالم جبہ اسکی ریزورٹ و چوٹیاں سوات", "attraction", "Malam Jabba", 34.798611, 72.571944, 1500,
         "Pakistan's premier ski resort at 9,199 feet in the Hindu Kush mountains with chairlift and zip-line.", "سلسلہ کوہ ہندوکش میں 9,199 فٹ کی بلندی پر واقع پاکستان کا سب سے بڑا اسکی ریزورٹ اور چیئر لفٹ۔",
         "Offering modern chairlifts, winter ski slopes, an 800-meter zip-line, and surrounding snow-capped peaks, Malam Jabba is Swat's top winter wonderland and summer alpine meadow.",
         "مالم جبہ پاکستان میں برفانی کھیلوں (اسکینگ) کا سب سے بڑا مرکز ہے جہاں جدید چیئر لفٹ، زپ لائن اور سرسبز پہاڑی چراگاہیں سیاحوں کو مسحور کر دیتی ہیں۔"),
        ("white-palace-marghazar-swat", "White Palace (Sufed Mahal) Marghazar", "سفید محل مرغزار سوات", "historical", "Saidu Sharif", 34.641667, 72.333333, 300,
         "1940 royal summer palace built of pure white Swat marble by the Wali of Swat in Marghazar valley.", "والیِ سوات کا 1940ء میں خالص سفید سنگِ مرمر سے تعمیر کردہ دلکش شاہی گرمائی محل۔",
         "Commissioned by Miangul Abdul Wadud (Wali of Swat) using the same marble quarry that supplied the Taj Mahal, this palace features cascading gardens, royal suites, and murmuring springs.",
         "سوات کے پہلے والی میاں گل عبدالودود نے 1940ء میں سفید سنگِ مرمر سے یہ شاہی محل بنوایا۔ چشموں کے شور اور باغات کے بیچ گھرا یہ محل اب ایک یادگار ہیریٹیج ہوٹل ہے۔"),
        ("kundol-lake-swat", "Kundol Lake (Kundol Dand)", "کنڈول جھیل سوات", "nature", "Kalam", 35.333333, 72.483333, 1000,
         "High-altitude glacial lake at 9,950 feet in Utror valley surrounded by snow-covered peaks and cedar forests.", "وادی اتروڑ سوات میں 9,950 فٹ کی بلندی پر واقع شفاف برفانی جھیل اور دیودار کے جنگلات۔",
         "Fed by melting Hindu Kush glaciers, Kundol Lake is renowned for its shimmering emerald green waters, wild trout, and the adventurous trekking trail starting from Ladu village.",
         "کالام کی وادی اتروڑ سے پیدل ٹریک کے ذریعے پہنچنے والی کنڈول جھیل اپنے زمرد جیسے سبز پانی، ارد گرد برفانی چوٹیوں اور ٹراؤٹ مچھلی کی بدولت قدرت کا انوکھا شاہکار ہے۔"),
        
        # Hazara & Kaghan
        ("babusar-pass-top-kaghan", "Babusar Pass (Babusar Top)", "بابوسر پاس (بابوسر ٹاپ)", "viewpoint", "Batakundi", 35.148611, 74.048611, 1500,
         "Highest point in Kaghan Valley at 13,691 feet, connecting Khyber Pakhtunkhwa to Gilgit-Baltistan.", "وادی کاغان کا سب سے بلند مقام (13,691 فٹ) جو خیبر پختونخوا کو گلگت بلتستان سے ملاتا ہے۔",
         "The gateway connecting the Kunhar River valley to Chilas on the Karakoram Highway. The pass offers dramatic panoramic vistas of Nanga Parbat and surrounding Himalayan and Karakoram peaks.",
         "کاغان کو شاہراہِ قراقرم سے ملانے والا بابوسر ٹاپ 13,691 فٹ کی بلندی پر بادلوں کے درمیان واقع ہے۔ یہاں سے نانگا پربت اور قراقرم کے پہاڑوں کا مسحور کن منظر ملتا ہے۔"),
        ("shogran-siri-payee-meadows", "Shogran & Siri Payee Meadows", "شوگران و سری پائے چراگاہیں", "nature", "Balakot", 34.633333, 73.5, 2000,
         "Lush green plateau and high alpine lake at 10,000 feet beneath the shadow of Makra Peak.", "مکڑا چوٹی کے سائے تلے 10,000 فٹ کی بلندی پر واقع سری پائے کی سرسبز و دلکش الپائن چراگاہیں۔",
         "Accessible by jeep from Kiwai, Shogran offers panoramic pine forest views while the higher meadows of Siri Payee feature grazing horses, mountain wildflowers, and a small reflective lake.",
         "کیوائی سے جیپ کے ذریعے شوگران اور وہاں سے سری پائے کی چراگاہوں تک پہنچا جاتا ہے جہاں بادل پاؤں چھوتے ہیں اور گھوڑوں کی سواری کا لطف اٹھایا جاتا ہے۔"),
        ("ilyasi-mosque-abbottabad", "Ilyasi Mosque & Spring", "الیاسی مسجد و چشمہ ایبٹ آباد", "religious", "Abbottabad", 34.161111, 73.238889, 300,
         "Historic 1932 hillside mosque built over a natural sweetwater spring, famous for hot crispy pakoras.", "1932ء کی تاریخی پہاڑی مسجد جو میٹھے چشمے کے اوپر تعمیر ہوئی اور جہاں کے گرم پکوڑے مشہور ہیں۔",
         "Built in 1932 from white marble in the foothills of Abbottabad, Ilyasi Mosque surrounds an ice-cold natural mountain spring. The street outside is celebrated across Pakistan for hot spiced pakoras.",
         "ایبٹ آباد کے پہاڑی دامن میں واقع یہ سفید سنگِ مرمر کی مسجد اپنے قدرتی چشمے اور باہر ملنے والے گرم اور خستہ الیاسی پکوڑوں کے لیے ملک گیر شہرت رکھتی ہے۔"),
        
        # Chitral & Kalash
        ("kalash-valleys-bumburet", "Bumburet Valley (Kalash Desh)", "وادی بمبوریت (کالاش دیش)", "cultural", "Drosh", 35.683333, 71.666667, 3000,
         "Ancient cultural sanctuary of the polytheistic Kalash people famous for festivals, wooden temples, and headdresses.", "قدیم کالاش قبیلے کی تاریخی وادی جہاں روایتی تہوار، لکڑی کے مندر اور خاص لباس موجود ہیں۔",
         "The largest of the three Kalash valleys, Bumburet is home to the unique Kalash culture dating back thousands of years. Known for colorful beaded Kupas headwear, circular dances, and the Chilam Joshi festival.",
         "چترال کی وادی بمبوریت کالاش قبیلے کا گڑھ ہے جن کی منفرد ثقافت، ناچ، چلم جوش کا تہوار اور رنگین موتیوں والی ٹوپیاں دنیا بھر کے سیاحوں کی توجہ کا مرکز ہیں۔"),
        ("shahi-mosque-chitral", "Shahi Mosque Chitral", "شاہی مسجد چترال", "religious", "Chitral", 35.854167, 71.785, 300,
         "Majestic 1924 red-sandstone royal mosque built by the Mehtar of Chitral on the riverbank.", "1924ء میں مہترِ چترال کی دریائے چترال کے کنارے تعمیر کردہ شاندار سرخ پتھر کی شاہی مسجد۔",
         "Constructed by Mehtar Shuja ul-Mulk in 1924, this imposing mosque features white bulbous domes, tall minarets, and carved stone portals against the backdrop of the Hindu Kush mountains.",
         "چترال کے مہتر شجاع الملک کی تعمیر کردہ یہ مسجد دریا کے کنارے واقع ہے جس کے سفید گنبد اور ہندوکش کے برف پوش پہاڑ ایک لاجواب تصویری منظر پیش کرتے ہیں۔"),
    ]

    for k in kp_sites:
        items.append(make_clean_record(
            slug=k[0], name=k[1], name_ur=k[2], category=k[3], city=k[4], region="Khyber Pakhtunkhwa",
            lat=k[5], lon=k[6], radius=k[7], short_en=k[8], short_ur=k[9], desc_en=k[10], desc_ur=k[11]
        ))

    balochistan_sites = [
        # Makran Coast & Gwadar
        ("kund-malir-golden-beach", "Kund Malir Golden Beach", "کنڈ ملیر گولڈن بیچ بلوچستان", "nature", "Lasbela District", 25.388889, 65.466667, 1500,
         "Pristine desert beach on Makran Coastal Highway where golden sand dunes meet the turquoise Arabian Sea.", "مکران کوسٹل ہائی وے پر واقع سنہری ریت کا ساحل جہاں صحرائی ٹیلے نیلگوں سمندر سے ملتے ہیں۔",
         "Ranked among Asia's top exotic beaches, Kund Malir features untouched sands framed by the dramatic jagged mud ridges of Hingol National Park and warm, clear waters.",
         "ایشیا کے خوبصورت ترین ساحلوں میں شمار ہونے والا کنڈ ملیر وہ جادوئی مقام ہے جہاں صحرائے بلوچستان کے سنہری ٹیلے بحیرہ عرب کے شفاف پانیوں میں اترتے دکھائی دیتے ہیں۔"),
        ("ormara-hammerhead-peninsula", "Ormara Turtle Beach & Hammerhead Rock", "اورماڑہ ٹرٹل بیچ و ہتھوڑا نما جزیرہ نما", "nature", "Ormara", 25.2, 64.633333, 2000,
         "Spectacular tombolo peninsula resembling a hammerhead shark extending into the Arabian Sea.", "بحیرہ عرب میں پھیلا ہوا ہتھوڑا نما چٹانی جزیرہ نما اور کچھوؤں کا سنہری ساحل۔",
         "Ormara is an ancient coastal town where Alexander the Great’s general Nearchus anchored in 325 BCE. The giant hammerhead rock connects to the mainland by a narrow sand bar flanked by beaches.",
         "سکندرِ اعظم کے امیر البحر نیارکس کا تاریخی ساحلی پڑاؤ، اورماڑہ کی چٹان سمندر کے اندر شارک مچھلی کے ہتھوڑے جیسے سر کی شکل میں نکلی ہوئی ہے اور لہریں یہاں گیت گاتی ہیں۔"),
        ("koh-e-batil-gwadar-viewpoint", "Koh-e-Batil Summit Viewpoint Gwadar", "کوہِ باطل ویو پوائنٹ گوادر", "viewpoint", "Gwadar", 25.105556, 62.327778, 600,
         "Clifftop summit atop Gwadar's hammerhead promontory reached by 700 stone stairs with views of both bays.", "گوادر کی ہتھوڑا نما چٹان کی چوٹی جہاں 700 سیڑھیاں چڑھ کر دونوں سمندری خلیجوں کا نظارہ ملتا ہے۔",
         "Rising 480 feet above Gwadar port, Koh-e-Batil offers a breathtaking panoramic vantage point where visitors can see both the East Bay and West Bay flanking the narrow isthmus of Gwadar city.",
         "گوادر شہر کے اوپر 480 فٹ بلند کوہِ باطل پر 700 سیڑھیاں چڑھ کر پہنچا جاتا ہے جہاں سے مشرق اور مغرب دونوں سمندروں اور بندرگاہ کا روح پرور نظارہ دکھائی دیتا ہے۔"),
        ("gwadar-marine-drive-promenade", "Gwadar Marine Drive & Sunset Boulevard", "گوادر میرین ڈرائیو و ساحلی واک وے", "attraction", "Gwadar", 25.127778, 62.333333, 1000,
         "Modern coastal highway running parallel to Gwadar's sunset beaches, with evening cafes and promenades.", "گوادر کے ساحل کے ساتھ بل کھاتی جدید ترین میرین ڈرائیو جہاں شام کے کیفے اور سمندری نظارے ہیں۔",
         "Stretching for kilometers along the Arabian Sea, Marine Drive is the recreational lifeline of modern Gwadar, bustling in the evening with family strolls, street food, and sea breezes.",
         "بحیرہ عرب کے کنارے میلوں تک پھیلی گوادر کی میرین ڈرائیو جدید گوادر کی سب سے خوبصورت سڑک ہے جہاں شام کے وقت تازہ سمندری ہوا اور چائے کا لطف لیا جاتا ہے۔"),
        ("astola-island-haft-talar", "Astola Island (Haft Talar - Island of the Seven Hills)", "جزیرہ استولا (ہفت تلار) بلوچستان", "nature", "Pasni", 25.121944, 63.847222, 3500,
         "Pakistan's largest offshore island, an uninhabited marine biodiversity haven 25 km south of Pasni.", "پسنی سے 25 کلومیٹر دور سمندر میں واقع پاکستان کا سب سے بڑا غیر آباد جزیرہ اور بحری قومی پارک۔",
         "Declared Pakistan's first Marine Protected Area, Astola features towering cliffs, isolated white sandy coves, coral reefs, and rare wildlife including the endemic Astola viper and green turtles.",
         "پاکستان کا پہلا سمندری محفوظ خطہ جزیرہ استولا بلند چٹانوں، سفید ریتلے غاروں، کورل ریف اور نایاب پرندوں کا مسکن ہے جہاں کشتی کے ذریعے مہم جوئی کی جاتی ہے۔"),
        ("jiwani-victoria-hut-sunset", "Jiwani Victoria Hut & Sunset Point", "جیوانی وکٹوریہ ہٹ و غروبِ آفتاب پوائنٹ", "historical", "Jiwani", 25.05, 61.733333, 400,
         "Historic coastal cliff pavilion built for Queen Victoria to watch the sunset at the edge of the Arabian Sea.", "برطانوی ملکہ وکٹوریہ کے لیے غروبِ آفتاب دیکھنے کے لیے تعمیر کی گئی تاریخی ساحلی ہٹ۔",
         "Situated on the high cliffs of Jiwani near the Iranian border, this wooden pavilion was built during World War II. The sunset here over the Arabian Sea and Gulf of Oman is world-famous.",
         "پاکستان اور ایران کی سرحد پر واقع جیوانی کی بلند چٹان پر بنی یہ تاریخی ہٹ دوسری جنگِ عظیم کے دوران ملکہ کے لیے بنائی گئی تھی۔ یہاں سے غروبِ آفتاب کا نظارہ عالمی شہرت رکھتا ہے۔"),
        
        # Quetta, Ziarat & Inlands
        ("hanna-lake-quetta", "Hanna Lake & Turquoise Reservoir", "حنا جھیل کوئٹہ", "nature", "Quetta", 30.25, 67.1, 1000,
         "Picturesque turquoise water reservoir 14 km from Quetta surrounded by the barren Chiltan mountains.", "کوئٹہ سے 14 کلومیٹر دور چلتن کے پہاڑوں کے بیچ واقع دلکش فیروزی جھیل۔",
         "Built in 1894 by the British, Hanna Lake is the primary recreational oasis for Quetta citizens, offering boat rides, lakeside pine groves, and walking trails against dramatic rocky crags.",
         "1894ء میں انگریز دور میں تعمیر ہونے والی حنا جھیل کوئٹہ کا مقبول ترین تفریحی مقام ہے جہاں فیروزی پانی، پہاڑی راستے اور کشتی رانی سیاحوں کو فرحت بخشتی ہے۔"),
        ("ziarat-ancient-juniper-forest", "Ziarat Ancient Juniper Forest (UNESCO Biosphere)", "زیارت کے قدیم صنوبر کے جنگلات", "nature", "Ziarat", 30.383333, 67.733333, 3000,
         "World's second-largest ancient Juniperus excelsa forest, home to trees over 5,000 years old.", "دنیا کا دوسرا سب سے بڑا اور قدیم صنوبر (جونیپر) کا جنگل جس کے درخت 5 ہزار سال تک پرانے ہیں۔",
         "A globally significant UNESCO Biosphere Reserve, Ziarat's fragrant juniper trees grow clinging to steep limestone gorges, providing pure alpine air and shelter to the endangered Balochistan black bear.",
         "یونیسکو کا محفوظ قدرتی بائیوسفیئر زیارت کا یہ صنوبر کا جنگل دنیا کے قدیم ترین زندہ درختوں کا مسکن ہے جن کی مہک اور ٹھنڈی ہوائیں صحت اور روح کے لیے اکسیر ہیں۔"),
        ("moola-chotok-waterfalls-khuzdar", "Moola Chotok Hidden Waterfalls (Khuzdar)", "مولا چھٹک آبشاریں خضدار", "nature", "Khuzdar", 28.166667, 66.833333, 1000,
         "Breathtaking turquoise desert water gorge with cascading perennial waterfalls hidden in Khuzdar's mountains.", "خضدار کے تپتے صحرائی پہاڑوں کے اندر چھپی ہوئی فیروزی پانی کی دودھیا قدرتی آبشاریں اور چشمے۔",
         "A secluded oasis accessible by 4x4 vehicles from Khuzdar, Moola Chotok is a series of cascading crystal-clear waterfalls tumbling into deep natural pools surrounded by lush green mossy canyons.",
         "صحرائے بلوچستان کے سینے میں قدرت کا انمول شاہکار۔ بلند چٹانوں کے بیچ بہتی ٹھنڈی دودھیا آبشاریں اور شفاف تالاب دنیا بھر کے مہم جوؤں کے لیے خوابوں کی وادی ہیں۔"),
        ("pir-ghaib-waterfalls-bolan", "Pir Ghaib Sacred Waterfalls & Pools", "پیر غائب آبشار و چشمے بولان", "nature", "Dhadar", 29.833333, 67.5, 800,
         "Twin crystal waterfalls tumbling down palm-fringed limestone cliffs in the historic Bolan Pass.", "تاریخی درہ بولان کے کھجوروں کے نخلستان میں چٹانوں سے بہنے والی دوہری قدرتی آبشاریں۔",
         "According to local folklore, saint Pir Ghaib disappeared into the mountain rock face to escape pursuers, leaving behind these miraculous freshwater springs flowing year-round.",
         "درہ بولان کی سنگلاخ چٹانوں کے درمیان واقع پیر غائب کی جڑواں آبشاریں اور کھجوروں کے جھنڈ ایک پرفضا نخلستان بناتے ہیں جہاں سال کے بارہ مہینے شفاف پانی بہتا ہے۔"),
    ]

    for b in balochistan_sites:
        items.append(make_clean_record(
            slug=b[0], name=b[1], name_ur=b[2], category=b[3], city=b[4], region="Balochistan",
            lat=b[5], lon=b[6], radius=b[7], short_en=b[8], short_ur=b[9], desc_en=b[10], desc_ur=b[11]
        ))

    return items
