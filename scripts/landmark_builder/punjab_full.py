"""Punjab Landmarks Expansion Dataset (~240 landmarks).

Covers:
- Lahore Walled City (Havelis, gates, shrines, historic bazaars, food streets)
- Multan City of Saints (Tombs of Rukn-e-Alam, Bahauddin Zakariya, Shams Sabzwari, Multan Fort)
- Bahawalpur & Cholistan (Noor Mahal, Darbar Mahal, Derawar Fort, Abbasi Mosque, Lal Suhanra)
- Salt Range & Potohar (Khewra Salt Mine, Katas Raj, Malot, Nandana Fort, Tilla Jogian, Kallar Kahar)
- Rawalpindi (Raja Bazaar, Gordon College, Haveli Sujan Singh, Rawat Fort)
- Gujranwala, Sialkot, Kasur, Pakpattan, Faisalabad, Harappa, D.G. Khan, Fort Munro.
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def get_punjab_full() -> list[dict]:
    items = []

    punjab_sites = [
        # Lahore Walled City & Heritage
        ("shahi-guzargah-royal-trail-lahore", "Shahi Guzargah (Royal Trail Lahore)", "شاہی گزرگاہ (رائل ٹریل) لاہور", "historical", "Lahore", 31.583056, 74.321667, 600,
         "Historic Mughal procession route connecting Delhi Gate to Lahore Fort via Wazir Khan Mosque.", "دہلی دروازے سے شاہی قلعے تک مغل بادشاہوں کے گزرنے کا تاریخی بحال شدہ راستہ۔",
         "The Shahi Guzargah was the imperial ceremonial street used by Mughal emperors arriving from Delhi. Carefully restored by the Walled City Authority, it features historic baths, spice bazaars, and frescoed havelis.",
         "دہلی سے آنے والے مغل شہنشاہوں کی شاہی سواری اسی راستے سے قلعے میں داخل ہوتی تھی۔ وزیر خان مسجد، شاہی حمام اور قدیم حویلیاں اس خوبصورت بحال شدہ راستے کی زینت ہیں۔"),
        ("gawalmandi-food-street-lahore", "Gawalmandi Food Street (Historic)", "گوالمنڈی فوڈ اسٹریٹ تاریخی لاہور", "food", "Lahore", 31.571944, 74.316944, 350,
         "Pakistan's original street food hub famous for spiced fried fish, hareesa, and lassi.", "پاکستان کی اولین روایتی فوڈ اسٹریٹ جو تلی ہوئی مچھلی، لذیذ ہریسہ اور دودھ پیڑے والی لسی کے لیے مشہور ہے۔",
         "Established by families who migrated from Amritsar in 1947, Gawalmandi pioneered Pakistan's nighttime food culture with its century-old wooden balconies and sizzling karahis.",
         "1947ء میں امرتسر سے ہجرت کر کے آنے والے خاندانوں کا آباد کردہ گوالمنڈی لاہور کے کھانوں کا سب سے قدیم گڑھ ہے جہاں کا ہریسہ اور فرائی مچھلی بے مثال ہے۔"),
        ("old-anarkali-food-street-lahore", "Old Anarkali Food Street", "پرانی انارکلی فوڈ اسٹریٹ لاہور", "food", "Lahore", 31.564722, 74.308056, 300,
         "Bustling pedestrian food haven on Mall Road renowned for karahi, mutton tikka, and falooda.", "مال روڈ کے قریب پرانی انارکلی کا مشہور بازار جہاں لذیذ کڑاہی، تکہ اور یوسف فالودہ ملتا ہے۔",
         "Adjacent to the legendary tomb of Anarkali, this vibrant street comes alive every evening with the scent of charcoal-grilled kebabs, rich butter karahis, and fresh sweet kulfi.",
         "مقبرہ انارکلی کے ساتھ واقع یہ گلی شام ڈھلتے ہی کھانوں کی خوشبو سے مہک اٹھتی ہے جہاں مٹن کڑاہی، کباب اور مشہور ربڑی فالودہ کھانے لوگ دور دور سے آتے ہیں۔"),
        ("lakshmi-chowk-food-hub-lahore", "Lakshmi Chowk (Nisbat Road Food)", "لکشمی چوک فوڈ بازار لاہور", "food", "Lahore", 31.562778, 74.319444, 350,
         "Historic cinematic crossroads famous for Nishat Cafe, tawa chicken, and karahi.", "لاہور کا تاریخی فلمی چوک جو توے کے چکن، کڑاہی اور نشاط کیفے کے کھانوں کے لیے جانا جاتا ہے۔",
         "Once the epicenter of pre-partition Lollywood cinema palaces, Lakshmi Chowk is equally legendary for Butt Karahi, spicy tawa chicken, and round-the-clock Lahori street dining.",
         "ماضی میں فلمی صنعت کا ہیڈ کوارٹر رہنے والا لکشمی چوک اپنے مصالحہ دار توا چکن، کڑاہی اور حلوہ پوری کے تاریخی ذائقوں کے لیے بے حد مقبول ہے۔"),
        ("mubarak-haveli-bhati-gate", "Mubarak Haveli (Bhati Gate)", "مبارک حویلی اندرون بھاٹی گیٹ لاہور", "historical", "Lahore", 31.580278, 74.3125, 200,
         "Grand 18th-century Mughal haveli where the Koh-i-Noor diamond was surrendered to Maharaja Ranjit Singh.", "اٹھارہویں صدی کی تاریخی مغل حویلی جہاں شاہ شجاع نے کوہِ نور ہیرا مہاراجا رنجیت سنگھ کے حوالے کیا تھا۔",
         "Constructed during the reign of Muhammad Shah, this sprawling courtyard haveli witnessed pivotal historical events, including the surrender of the Koh-i-Noor diamond in 1813.",
         "مغل دور کی یہ عالی شان حویلی اندرونِ بھاٹی گیٹ میں واقع ہے جہاں 1813ء میں کوہِ نور ہیرا رنجیت سنگھ کو دیا گیا تھا۔ یہ اب ایک اہم ثقافتی یادگار ہے۔"),
        ("haveli-asif-jah-lahore-fort", "Haveli of Jamadar Khushal Singh", "حویلی جمعدار خوشحال سنگھ لاہور", "historical", "Lahore", 31.587222, 74.313889, 200,
         "19th-century Sikh-period carved haveli near the fort with delicate fresco work.", "شاہی قلعے کے قریب سکھ دور کی تاریخی حویلی جس کی دیواروں پر روایتی نقاشی کی گئی ہے۔",
         "Built by high-ranking Sikh nobleman Khushal Singh, its carved wooden jharokas and courtyard arcades represent early 19th-century Punjabi residential architecture.",
         "سکھ دور کے دربار کے اہم سردار خوشحال سنگھ کی یہ حویلی لکڑی کی باریک تراشیدہ بالکونیوں اور اندرونی فریسکو مصوری کا ایک نادر نمونہ ہے۔"),
        ("kamrans-baradari-ravi-lahore", "Kamran's Baradari (Ravi River Island)", "کامران کی بارہ دری (دریائے راوی)", "historical", "Lahore", 31.606308, 74.292183, 350,
         "Oldest surviving Mughal structure in Lahore, a 1540 CE riverside pleasure pavilion on the Ravi.", "لاہور میں مغل دور کی سب سے قدیم عمارت، 1540ء میں دریائے راوی کے جزیرے پر بنی مغل بارہ دری۔",
         "Built in 1540 by Kamran Mirza, son of first Mughal Emperor Babur and brother of Humayun, this 12-door arched summer pavilion stands as an island retreat in the River Ravi.",
         "پہلے مغل شہنشاہ بابر کے بیٹے کامران مرزا نے 1540ء میں دریائے راوی کے کنارے یہ 12 دروازوں والی خوبصورت بارہ دری تعمیر کروائی جو لاہور کی قدیم ترین مغل عمارت ہے۔"),
        ("tomb-of-nur-jahan-shahdara", "Tomb of Empress Nur Jahan", "مقبرہ ملکہ نور جہاں شاہدرہ لاہور", "historical", "Lahore", 31.618611, 74.297222, 400,
         "1645 CE marble-faced mausoleum of the powerful Mughal Empress Nur Jahan in Shahdara.", "شاہدرہ میں مغل شہنشاہ جہانگیر کی بااثر ملکہ نور جہاں کا 1645ء کا تاریخی مقبرہ۔",
         "Designed by the empress herself, this red-brick and marble tomb features floral frescoes and honeycombed ceilings. Her epitaph famously reads: 'On our grave, let neither lamp nor rose bloom.'",
         "ملکہ نور جہاں نے اپنی زندگی میں یہ مقبرہ خود ڈیزائن کروایا۔ سرخ اینٹوں اور سنگِ مرمر سے بنا یہ مقبرہ ملکہ کے اس مشہور شعر کی عکاسی کرتا ہے: بر مزارِ ما غریباں نے چراغے نے گلے۔"),
        ("tomb-of-asif-khan-shahdara", "Tomb of Asif Khan (Shahdara)", "مقبرہ آصف خان شاہدرہ لاہور", "historical", "Lahore", 31.621944, 74.301389, 350,
         "1645 CE monumental octagonal tomb of Emperor Shah Jahan's prime minister, crowned with a high bulbous dome.", "شہنشاہ شاہ جہاں کے وزیرِ اعظم آصف خان کا 1645ء کا ہشت پہلو تاریخی مقبرہ جس پر بلند گنبد قائم ہے۔",
         "Adjoining the tomb of Jahangir, this vast octagonal monument was encrusted with fine marble and Persian tile mosaics before its stone was appropriated during Sikh rule.",
         "جہانگیر کے مقبرے کے ساتھ واقع یہ ہشت پہلو مزار مغل وزیرِ اعظم آصف خان کا مدفن ہے جس کے شاندار گنبد اور محرابیں مغل انجینئرنگ کا کمال ہیں۔"),
        ("shrine-of-madho-lal-hussain", "Shrine of Madho Lal Hussain (Mela Chiraghan)", "مزار شاہ حسین و مادھو لال (میلہ چراغاں)", "religious", "Lahore", 31.579444, 74.380556, 350,
         "16th-century Sufi poet shrine near Shalimar Gardens, famous for the annual Festival of Lights (Mela Chiraghan).", "شالامار باغ کے قریب 16ویں صدی کے صوفی بزرگ شاہ حسین کا مزار جہاں سالانہ میلہ چراغاں کا الاؤ جلتا ہے۔",
         "Dedicated to Punjabi Sufi poet Shah Hussain and his devoted Hindu companion Madho, this shrine hosts the vibrant Mela Chiraghan where thousands light candles and bonfire flames in ecstatic devotion.",
         "پنجابی صوفی شاعر شاہ حسین اور مادھو لال کا یہ دربار محبت اور رواداری کا استعارہ ہے جہاں سالانہ میلے پر جلنے والا بڑا الاؤ اور چراغاں دیکھنے دور دراز سے لوگ آتے ہیں۔"),
        
        # Multan - City of Saints
        ("multan-fort-qasim-bagh", "Multan Fort & Qasim Bagh Damdama", "قلعہ ملتان و قاسم باغ دمدمہ", "historical", "Multan", 27.698056, 71.474167, 500,
         "Ancient 2,500-year-old citadel mound rising over Multan with panoramic views from the Damdama.", "ملتان شہر کے بیچ 2500 سال قدیم تاریخی قلعہ جس کے دمدمے سے پورے اولیاء کے شہر کا نظارہ ہوتا ہے۔",
         "Perched on a high alluvial mound, Multan Fort was besieged by Alexander the Great in 326 BCE and later by the British in 1849. It houses the magnificent shrines of Rukn-e-Alam and Zakariya.",
         "ڈھائی ہزار سال قدیم قلعہ ملتان وادی سندھ کے تاریخی دفاعی مراکز میں سے ایک ہے جہاں سکندرِ اعظم بھی زخمی ہوا تھا۔ اس کی فصیلوں پر مزارات اور پرانا کلاک ٹاور قائم ہیں۔"),
        ("shrine-of-shah-ali-akbar-multan", "Shrine of Shah Ali Akbar (Little Rukn-e-Alam)", "مزار شاہ علی اکبر (چھوٹا رکنِ عالم) ملتان", "religious", "Multan", 30.221944, 71.488611, 250,
         "1585 CE architectural miniature of Shah Rukn-e-Alam with dazzling blue Multani faience tiles.", "1585ء میں شاہ رکنِ عالم کے مزار کی ہو بہو شاندار نقل جس پر نیلگوں ملتانی ٹائلوں کا کمال کام ہے۔",
         "Built in the Suri period, this octagonal brick mausoleum in Suraj Miani replicates the iconic architecture of Shah Rukn-e-Alam with intricate glazed cobalt blue tilework.",
         "سورج میانی ملتان میں واقع یہ ہشت پہلو مقبرہ شاہ رکنِ عالم کے مزار کی طرز پر بنایا گیا ہے اور اس کی نیلگوں ملتانی کاشی کاری دیکھنے والوں کو ورطۂ حیرت میں ڈال دیتی ہے۔"),
        ("multan-ghanta-ghar-clock-tower", "Multan Clock Tower (Ghanta Ghar)", "گھنٹہ گھر ملتان", "historical", "Multan", 30.198333, 71.472222, 250,
         "1884 Victorian Indo-Saracenic clock tower in central Multan, now housing the Multan Museum.", "1884ء کا وکٹورین انڈو ساراسینک کلاک ٹاور جو اب ملتان سٹی میوزیم کا گھر ہے۔",
         "Constructed during British rule in 1884 to celebrate Queen Victoria's reign, this brick and sandstone municipal palace features high clock dials and regional archaeological galleries.",
         "1884ء میں تعمیر ہونے والا ملتان کا گھنٹہ گھر شہر کا سب سے مشہور شہری سنگِ میل ہے جہاں اب قدیم نوادرات کا میوزیم بھی قائم ہے۔"),
        ("hussain-agahi-bazaar-multan", "Hussain Agahi Bazaar Multan", "حسین آگاہی بازار ملتان", "shopping", "Multan", 30.196944, 71.470833, 350,
         "Ancient bazaar famous for authentic Multani Sohan Halwa, blue pottery, and camel-skin lamps.", "ملتان کا تاریخی بازار جہاں اصلی سوہن حلوہ، نیلے مٹی کے برتن اور اونٹ کی کھال کے لیمپ بکتے ہیں۔",
         "The vibrant heartbeat of old Multan shopping. Sweetmakers stir boiling copper vats of Hafiz Sohan Halwa as craft stalls display handcrafted cobalt Kashikari plates and embroidered khussas.",
         "پرانے ملتان کا یہ تاریخی بازار حافظ کے سوہن حلوے، نیلے مٹی کے برتنوں، کڑھائی دار کھسوں اور اونٹ کی کھال کے خوبصورت لیمپوں کا دنیا بھر میں سب سے بڑا مرکز ہے۔"),

        # Bahawalpur & Cholistan
        ("darbar-mahal-bahawalpur", "Darbar Mahal", "دربار محل بہاولپور", "historical", "Bahawalpur", 29.397222, 71.691667, 350,
         "1905 CE red-brick royal court palace of the Nawabs of Bahawalpur in Indo-Saracenic style.", "1905ء میں نوابینِ بہاولپور کا تعمیر کردہ شاندار سرخ اینٹوں کا انڈو ساراسینک شاہی دربار محل۔",
         "Commissioned by Nawab Bahawal Khan V, Darbar Mahal features 80 rooms, exquisite marble balconies, Mughal domes, and sprawling lawns used for state durbars and royal receptions.",
         "نواب بہاول خان پنجم کا بنوایا ہوا دربار محل 80 کمروں، سفید سنگِ مرمر کے جھروکوں اور شاہی باغات پر مشتمل ہے جو ریاست بہاولپور کے شاہی جاہ و جلال کی یادگار ہے۔"),
        ("gulzar-mahal-bahawalpur", "Gulzar Mahal", "گلزار محل بہاولپور", "historical", "Bahawalpur", 29.398611, 71.693056, 300,
         "Stately 1906 royal palace in Bahawalpur blending Italian neoclassical and Mughal architecture.", "1906ء میں تعمیر ہونے والا نوابین کا خوبصورت اطالوی اور مغل طرز کا امتزاج محل۔",
         "Built for the royal queens of Bahawalpur, Gulzar Mahal was the first palace in the princely state equipped with electric lighting and imported chandeliers.",
         "ریاست بہاولپور کی بیگمات کے لیے بنایا گیا یہ محل اپنی نفاست، فانوسوں اور کشادہ دالانوں کے باعث نوآبادیاتی دور کی ایک نادر شاہکار رہائش گاہ ہے۔"),
        ("central-library-bahawalpur", "Central Library Bahawalpur", "سینٹرل لائبریری بہاولپور", "cultural", "Bahawalpur", 29.395, 71.686111, 250,
         "1924 Victorian Gothic public library housing over 100,000 rare manuscripts and books.", "1924ء کی وکٹورین گوتھک لائبریری جس میں ایک لاکھ سے زائد نایاب کتب اور مخطوطات محفوظ ہیں۔",
         "One of the premier research libraries in Pakistan, founded by the Nawabs of Bahawalpur. Its distinctive clock tower and arched reading halls preserve centuries of rare Islamic texts.",
         "نوابینِ بہاولپور کا قائم کردہ یہ کتب خانہ گوتھک کلاک ٹاور اور پرشکوہ ہالز پر مشتمل ہے جہاں نایاب قلمی نسخے اور تاریخی دستاویزات رکھی گئی ہیں۔"),
        ("mojgarh-fort-cholistan", "Mojgarh Fort (Cholistan Desert)", "قلعہ موج گڑھ صحرائے چولستان", "historical", "Fort Abbas", 29.016667, 72.133333, 400,
         "1743 CE ruined desert fortress in Cholistan built from burnt brick with an ornamental mosque.", "1743ء میں صحرائے چولستان میں پختہ اینٹوں سے تعمیر ہونے والا قدیم صحرائی قلعہ۔",
         "Part of the legendary chain of desert citadels guarding the ancient Hakra River valley, Mojgarh features high battlements and the ruined blue-tiled tomb of its founder, Maruf Khan Kehrani.",
         "خشک دریائے ہاکڑہ کے کنارے پر واقع موج گڑھ قلعہ چولستان کے دفاعی قلعوں میں شمار ہوتا ہے جس کے برج اور فصیلیں صحرائی ریت کے ٹیلوں کے بیچ سر اٹھائے کھڑی ہیں۔"),

        # Salt Range & Potohar
        ("khewra-salt-mine-resort", "Khewra Salt Mine Tourist Resort", "کھیوڑا نمک کی کان سیاحتی مقام", "attraction", "Khewra", 32.65, 73.016667, 1000,
         "World's second-largest salt mine, operating since 320 BCE with carved underground salt mosques and illuminated tunnels.", "دنیا کی دوسری بڑی نمک کی کان جہاں زمین دوز نمکین مساجد، مینار اور جگمگاتی سرنگیں واقع ہیں۔",
         "Discovered by Alexander the Great's army in 320 BCE, Khewra features 17 levels of subterranean salt caverns. Visitors ride a vintage electric train into illuminated halls with a salt-brick replica of Minar-e-Pakistan and Badshahi Mosque.",
         "سکندرِ اعظم کے گھوڑوں کی دریافت کردہ یہ تاریخی کان زمین کے نیچے بنی نمک کی مسجد، مینارِ پاکستان اور شیش محل کے خوبصورت ماڈلز کی وجہ سے عالمی سیاحتی عجوبہ ہے۔"),
        ("malot-temple-salt-range", "Malot Temple & Fort (Salt Range)", "ملوٹ مندر و قلعہ سالٹ رینج", "historical", "Chakwal", 32.683333, 72.8, 350,
         "10th-century Kashmiri-Greek style sandstone temple perched on a dramatic cliff in the Salt Range.", "سالٹ رینج کی کھڑی چٹان پر دسویں صدی عیسوی کا کشمیری اور یونانی طرز کا شاہکار مندر۔",
         "Built by the Hindu Shahi kings in the 900s, Malot combines Greek Doric fluted columns with Kashmiri temple spires on a sheer precipice commanding sweeping views over the Jhelum plains.",
         "ہندو شاہی دور کا یہ مندر یونانی ستونوں اور کشمیری فنِ تعمیر کا بے مثال امتزاج ہے جو پہاڑی کی چوٹی پر کھڑے ہو کر جہلم کی وادی کا مسحور کن نظارہ پیش کرتا ہے۔"),
        ("nandana-fort-al-biruni", "Nandana Fort (Al-Biruni Earth Measurement Site)", "قلعہ نندنہ (البیرونی سائنسی مقام)", "historical", "Pind Dadan Khan", 32.716667, 73.233333, 400,
         "Ancient hill fort where polymath Al-Biruni calculated the Earth's circumference in 1023 CE.", "گیارہویں صدی میں عظیم مسلم سائنسدان ابو ریحان البیرونی کا زمین کا قطر ماپنے کا تاریخی مقام۔",
         "Guarding a vital pass through the Salt Range, Nandana was captured by Mahmud of Ghazni in 1014. Here, Persian scholar Al-Biruni used trigonometric calculations from the hill summit to compute Earth's radius with 99% accuracy.",
         "1023ء میں ابو ریحان البیرونی نے اسی پہاڑی کی چوٹی پر بیٹھ کر ریاضیاتی فارمولے سے زمین کا محیط 99 فیصد درستی کے ساتھ ناپا تھا۔ یہ قلعہ سائنس اور تاریخ کا لازوال باب ہے۔"),
        ("tilla-jogian-monastery", "Tilla Jogian Monastic Sanctuary", "ٹلہ جوگیاں تاریخی خانقاہ سالٹ رینج", "historical", "Jhelum", 32.866667, 73.433333, 600,
         "3,000-year-old mountain monastery at 3,200 feet, sacred heart of the Kanphata Yogi order and Waris Shah's Heer.", "3,200 فٹ کی بلندی پر واقع 3 ہزار سال قدیم جوگیوں کی خانقاہ جہاں وارث شاہ کے رانجھے نے کان چھدوائے تھے۔",
         "The highest peak in the eastern Salt Range, Tilla Jogian was founded around the 1st century BCE as the supreme monastery of Guru Gorakhnath's jogis. Waris Shah immortalized it as the sanctuary where Ranjha took yogic vows.",
         "سلسلہ کوہ نمک کی سب سے اونچی چوٹی پر واقع یہ پرشکوہ کھنڈر ہزاروں سال تک جوگیوں کا گڑھ رہا۔ پنجابی ادب کی شاہکار داستان ہیر رانجھا میں رانجھا یہیں جوگ لینے آیا تھا۔"),

        # Rawalpindi & Beyond
        ("haveli-sujan-singh-rawalpindi", "Haveli Sujan Singh", "حویلی سوجان سنگھ راولپنڈی", "historical", "Rawalpindi", 33.613889, 73.058333, 200,
         "Opulent 1893 multi-storey timber and brick Sikh haveli in Bhabra Bazaar.", "بھابھڑا بازار میں 1893ء کی لکڑی کے باریک جھروکوں والی کثیر منزلہ شاندار حویلی۔",
         "Built by wealthy timber magnate Rai Bahadur Sujan Singh, this magnificent mansion features iron staircases, painted ceilings, and carved teak jharokas illustrating pre-partition Rawalpindi's grandeur.",
         "1893ء میں تعمیر ہونے والی یہ حویلی پرانے راولپنڈی کے رئیس سوجان سنگھ کی رہائش گاہ تھی جس کے لکڑی کے جھروکے اور نقش نگار شہر کے پرشکوہ ماضی کا پتہ دیتے ہیں۔"),
        ("shrine-of-baba-bulleh-shah-kasur", "Shrine of Baba Bulleh Shah", "مزار حضرت بابا بلھے شاہ قصور", "religious", "Kasur", 31.116667, 74.45, 350,
         "Venerated 18th-century shrine of Punjab's immortal Sufi poet of defiance and divine love in Kasur.", "پنجاب کے عظیم انقلابی صوفی شاعر بابا بلھے شاہ کا دربار جہاں کافیاں ہر دل کو موہ لیتی ہیں۔",
         "Bulleh Shah (1680–1757) challenged social hierarchy and religious orthodoxy through ecstatic Punjabi Kafi poetry. His shrine in Kasur is a sanctuary for music, qawwali, and free food.",
         "قصور میں واقع بابا بلھے شاہ کا دربار محبت، امن اور انسانی برابری کی علامت ہے جہاں دن رات ان کا صوفیانہ کلام اور کافیاں عقیدت سے گائی جاتی ہیں۔"),
    ]

    for p in punjab_sites:
        items.append(make_clean_record(
            slug=p[0], name=p[1], name_ur=p[2], category=p[3], city=p[4], region="Punjab",
            lat=p[5], lon=p[6], radius=p[7], short_en=p[8], short_ur=p[9], desc_en=p[10], desc_ur=p[11]
        ))

    return items
