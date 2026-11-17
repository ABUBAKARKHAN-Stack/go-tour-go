"""Script to generate north_mega.py (AJK, GB, and ICT landmarks)."""

import os

dest = os.path.join(os.path.dirname(__file__), "north_mega.py")

NORTH_DATA = [
    # Azad Kashmir (30)
    ("muzaffarabad-red-fort-neelum", "Muzaffarabad Red Fort (Rutta Qila)", "مظفر آباد لال قلعہ (رتا قلعہ) دریائے نیلم", "historical", "Muzaffarabad", "Azad Kashmir", 34.372222, 73.472222, 450,
     "16th-century red stone fortress built by Sultan Muzaffar Khan on a bend of the Neelum River.", "16ویں صدی کا لال پتھر کا تاریخی قلعہ جو دریائے نیلم کے موڑ پر واقع ہے۔",
     "Constructed in 1559 by the founder of Muzaffarabad to defend against Mughal invasions, this fortress is surrounded on three sides by the roaring Neelum River, featuring circular bastions and terraced ramparts.",
     "سلطان مظفر خان کا تعمیر کردہ یہ قلعہ کشمیر کی آزادی کی علامت رہا ہے جس کے سرخ برج دریا کے شفاف پانیوں کے اوپر فخر سے کھڑے ہیں۔"),
    ("pir-chinasi-mountain-shrine", "Pir Chinasi Mountain Shrine & Summit (9,500 ft)", "پیر چناسی مزار و پہاڑی چوٹی (9500 فٹ) مظفر آباد", "viewpoint", "Muzaffarabad", "Azad Kashmir", 34.383333, 73.533333, 800,
     "Exhilarating 9,500-foot mountain ridge shrine offering 360-degree views across the Kashmir Himalayas.", "9500 فٹ بلند پہاڑی چوٹی جہاں صوفی بزرگ حضرت شاہ حسین بخاری کا مزار اور کشمیر کے پہاڑوں کا نظارہ ہے۔",
     "Perched atop a windy grassy summit above Muzaffarabad, Pir Chinasi offers sweeping panoramas of snow-bound peaks, paragliding launches, and swirling mountain clouds.",
     "مظفر آباد کے سر پر تاج کی طرح سجی پیر چناسی کی چوٹی بادلوں کے دیس کا احساس دلاتی ہے جہاں ٹھنڈی ہوائیں اور وادی کا نظارہ مسحور کن ہے۔"),
    ("sharda-peeth-ancient-temple", "Sharda Peeth Ancient Temple & University Ruins", "شاردہ پیٹھ قدیم مندر و یونیورسٹی کھنڈرات وادیِ نیلم", "historical", "Neelum", "Azad Kashmir", 34.791667, 74.183333, 400,
     "Ancient 6th-century CE sandstone university and temple dedicated to the Hindu goddess of knowledge, Sharda.", "چھٹی صدی عیسوی کی قدیم علم و حکمت کی بین الاقوامی یونیورسٹی اور شاردا دیوی کا مقدس مندر۔",
     "One of the foremost centers of higher learning in ancient South Asia where the Sharada script was developed, its monumental stone walls and stepped plinths stand along the Neelum River.",
     "وادیِ نیلم میں واقع شاردہ پیٹھ برصغیر کے قدیم ترین علمی مراکز میں سے ایک ہے جہاں بدھ اور ہندو فلسفی علم کی پیاس بجھانے آتے تھے۔"),
    ("arang-kel-fairy-meadow", "Arang Kel (The Pearl of Neelum Valley 8,300 ft)", "ارنگ کھیل (وادیِ نیلم کا ہیرا 8300 فٹ) آزاد کشمیر", "nature", "Neelum", "Azad Kashmir", 34.816667, 74.35, 800,
     "Breathtaking fairy tale alpine village plateau perched 1,500 feet directly above Kel and the Neelum River.", "دریائے نیلم سے 1500 فٹ بلندی پر واقع خوابوں جیسا سرسبز پہاڑی گاؤں جو لکڑی کے خوبصورت مکانات سے سجا ہے۔",
     "Reached via a cable car car-lift or a steep 1-hour pine forest hike from Kel, Arang Kel features rolling emerald meadows, wooden Swiss-style chalets, and close views of surrounding glaciers.",
     "ارنگ کھیل کی وادی میں قدم رکھتے ہی ایسا لگتا ہے جیسے انسان کسی کہانی کی کتاب کے دیس میں آ گیا ہو جہاں گھاس کے میدانوں پر لکڑی کے گھر جگمگاتے ہیں۔"),
    ("ratti-gali-lake-alpine-jewel", "Ratti Gali Glacial Lake (Turquoise Alpine Jewel)", "رتی گلی جھیل (فیروزی الپائن نگینہ 12,130 فٹ) وادیِ نیلم", "nature", "Neelum", "Azad Kashmir", 34.833333, 74.05, 1000,
     "Awe-inspiring 12,130-foot red-cliff glacial lake fed by glacial meltwaters, blanketed in alpine wildflowers.", "12,130 فٹ بلندی پر واقع سرخ چٹانوں اور گلیشیئرز سے گھری ہوئی مسحور کن فیروزی جھیل۔",
     "Accessible via a rugged 4x4 jeep track from Dowarian followed by a scenic hike, Ratti Gali is framed by dramatic crimson peaks, vibrant yellow flower carpets, and floating glacial ice floes.",
     "سرخ پہاڑوں کے دامن میں نیلے شیشے کی طرح چمکتی رتی گلی جھیل آزاد کشمیر کا سب سے شاندار قدرتی عجوبہ ہے جس کا حسن دیکھ کر دل دھڑکنا بھول جاتا ہے۔"),
    ("taobat-neelum-border-gateway", "Taobat (The Final Frontier of Neelum Valley)", "تاؤبٹ (وادیِ نیلم کی آخری خوبصورت سرحدی بستی)", "nature", "Neelum", "Azad Kashmir", 34.716667, 74.75, 800,
     "Idyllic wooden log-cabin village right at the Line of Control where the Kishanganga river enters Azad Kashmir.", "پاک بھارت سرحد پر واقع خوبصورت لکڑی کے مکانات والی بستی جہاں کشن گنگا دریا نیلم بن جاتا ہے۔",
     "Surrounded by emerald green hills, traditional log farmhouses, and walnut orchards, Taobat is the extreme eastern terminus of the Neelum Valley, offering pure mountain serenity.",
     "نیلم وادی کا آخری گاؤں تاؤبٹ اپنی خاموشی، لکڑی کے نفاست سے بنے گھروں اور سرسبز کھیتوں کے ساتھ زمین پر جنت کی تصویر پیش کرتا ہے۔"),
    ("banjosa-lake-pine-reservoir", "Banjosa Lake & Pine Forest Resort (Rawalakot)", "بنجوسہ جھیل و چیڑ کا جنگل راولاکوٹ آزاد کشمیر", "nature", "Poonch", "Azad Kashmir", 33.805556, 73.816667, 600,
     "Picturesque artificial lake nestled at 6,500 feet inside dense pine forests near Rawalakot.", "راولاکوٹ کے قریب 6500 فٹ بلندی پر واقع خوبصورت جھیل جو گھنے چیڑ کے درختوں سے گھری ہوئی ہے۔",
     "Surrounded by cedar ridges and colorful wooden red-roofed tourist cottages, Banjosa offers paddle boating on calm waters that reflect the deep green pine canopies.",
     "بنجوسہ جھیل کا پرسکون سبز پانی اور اس کے گرد بنے سرخ چھتوں والے کاٹیجز فیملی پکنک اور کشتی رانی کے لیے کشمیر کا سب سے مقبول مقام ہیں۔"),
    ("toli-pir-360-ridge-summit", "Toli Pir (The 360-Degree Grassy Ridge Summit)", "تولی پیر (360 ڈگری گھاس کا پہاڑی مرغزار 8800 فٹ)", "viewpoint", "Poonch", "Azad Kashmir", 33.883333, 73.866667, 800,
     "Breathtaking 8,800-foot open grassy mountain plateau commanding unobstructed views across Poonch.", "8800 فٹ بلندی پر دور تک پھیلا سرسبز پہاڑی میدان جہاں سے آزاد کشمیر کی وادیوں کا 360 ڈگری نظارہ ہوتا ہے۔",
     "The highest viewpoint in Poonch, Toli Pir features sweeping alpine meadows covered in wildflowers, cool mountain gales, and vistas stretching to the snow peaks of Abbaspur and Pir Panjal.",
     "تولی پیر کی اونچی پہاڑی پر کھڑے ہو کر ٹھنڈی ہواؤں کے جھونکے لینا اور چاروں طرف نیچے گہری وادیوں کا نظارہ کرنا سیاحوں کو آزاد فضا کا لطف دیتا ہے۔"),
    ("ramkot-fort-mangla-lake", "Ramkot Fort (Water-Bound Fortress of Mangla Lake)", "قلعہ رام کوٹ (منگلا جھیل کے پانیوں میں گھرا قلعہ) میرپور", "historical", "Mirpur", "Azad Kashmir", 33.25, 73.716667, 600,
     "16th-century medieval water-locked fortress situated on an elevated ridge inside Mangla Dam reservoir.", "16ویں صدی کا تاریخی قلعہ جو منگلا ڈیم کے وسیع نیلے پانیوں کے درمیان اونچی چٹان پر واقع ہے۔",
     "Accessible primarily via a 30-minute scenic boat ride across Mangla Lake from Dadyal, Ramkot Fort features heavy stone bastions, ancient Hindu temple foundations, and sweeping water views.",
     "منگلا جھیل کے درمیان کشتی کا سفر کر کے رام کوٹ قلعے تک پہنچنا ایک سنسنی خیز مہم ہے جس کے برج پانی کے اوپر شان سے کھڑے ہیں۔"),
    ("ganga-choti-alpine-cone", "Ganga Choti Alpine Cone Peak (Bagh)", "گنگا چوٹی الپائن مخروطی پہاڑ (9989 فٹ) باغ آزاد کشمیر", "nature", "Bagh", "Azad Kashmir", 34.116667, 73.766667, 800,
     "Majestic 9,989-foot cone-shaped alpine mountain peak situated at the boundary between Bagh and Muzaffarabad.", "9989 فٹ بلند مخروطی برف پوش چوٹی جو ضلع باغ اور مظفر آباد کی سرحد پر واقع ہے۔",
     "Rising gracefully above Sudhan Gali, Ganga Choti offers exhilarating summer hiking across green flower-covered ridges, rewarding climbers with panoramic vistas of the Pir Panjal range.",
     "سدھن گلی سے گنگا چوٹی کی طرف ہائیکنگ کرنا اور چوٹی سے آزاد کشمیر کی وادیوں کا نظارہ کرنا ہر کوہ پیما کے لیے ایک دلفریب منزل ہے۔"),

    # Islamabad Capital Territory (7)
    ("margalla-trail-3-ridge-hike", "Margalla Hills Trail 3 (The Steeps Ridge)", "مارگلہ ہلز ٹریل 3 (پہاڑی ہائیکنگ ٹریک) اسلام آباد", "nature", "Islamabad", "Islamabad Capital Territory", 33.741667, 73.066667, 600,
     "Islamabad's most iconic steep mountain hiking track ascending from Sector F-6 to the Monal ridge (3,500 ft).", "سیکٹر ایف 6 سے مونا ل تک چڑھنے والا اسلام آباد کا سب سے مقبول اور چیلنجنگ پہاڑی واکنگ ٹریک۔",
     "Climbing nearly 1,500 vertical feet through sub-tropical pine woods, Trail 3 rewards hikers with panoramic views of the Faisal Mosque, Rawal Lake, and the planned grid of Islamabad.",
     "اسلام آباد کے شہریوں کی من پسند مارننگ واک، ٹریل 3 پر چڑھ کر نیچے پھیلتے دارالحکومت کی روشنیاں اور ہریالی دیکھنا ایک بہترین ورزش اور سیر ہے۔"),
    ("margalla-trail-5-stream-track", "Margalla Hills Trail 5 (Freshwater Stream Track)", "مارگلہ ہلز ٹریل 5 (قدرتی چشمہ ٹریک) اسلام آباد", "nature", "Islamabad", "Islamabad Capital Territory", 33.747222, 73.083333, 600,
     "Scenic hiking trail featuring running natural mountain freshwater springs, bamboo groves, and birds.", "مارگلہ کا خوبصورت ہائیکنگ ٹریک جہاں میٹھے پانی کے قدرتی چشمے اور بانس کے باغات بہتے ہیں۔",
     "A favorite nature walk for families and birdwatchers, Trail 5 meanders alongside a bubbling mountain creek before ascending into pine forests toward the scenic Pir Sohawa ridge.",
     "چشموں کے کنارے بنی ٹریل 5 پر پرندوں کی چہچہاہٹ اور بہتے پانی کی موسیقی کے ساتھ واک کرنا اسلام آباد کا ایک پرامن قدرتی تجربہ ہے۔"),
    ("shah-allah-ditta-caves", "Shah Allah Ditta Buddhist Caves & Banyan Trees", "شاہ اللہ دتہ قدیم بدھ غاریں و برگد کے درخت اسلام آباد", "historical", "Islamabad", "Islamabad Capital Territory", 33.716667, 72.916667, 400,
     "2,500-year-old archaeological caves and freshwater springs set beneath colossal ancient banyan trees.", "ڈھائی ہزار سال قدیم تاریخی غاریں اور چشمے جو صدیوں پرانے برگد کے دیوہیکل درختوں تلے واقع ہیں۔",
     "Preserving Buddhist meditation murals and stone relics from the Gandhara period, this peaceful village at the base of the Margalla hills offers rustic traditional tea cafes and heritage strolls.",
     "مارگلہ کے دامن میں واقع یہ قدیم غاریں جہاں کبھی بدھ بھکشو مراقبہ کرتے تھے، آج اسلام آباد کے شہریوں کے لیے پرسکون چائے اور تاریخ کا حسین سنگم ہیں۔"),
    ("saidpur-village-artisan-heritage", "Saidpur Historic Artisan Village & Hindu Temple", "سید پور تاریخی ورثہ گاؤں و ہندو مندر اسلام آباد", "cultural", "Islamabad", "Islamabad Capital Territory", 33.744444, 73.066667, 400,
     "Centuries-old Mughal-era village featuring restored stone Hindu temples, gurdwara, and artisan restaurants.", "مارگلہ کی پہاڑی پر واقع مغل دور کا تاریخی گاؤں جہاں بحال شدہ قدیم مندر اور روایتی ریسٹورنٹس ہیں۔",
     "Laid out by Raja Man Singh in the 16th century, Saidpur features cobblestone walkways, a traditional pottery craft kiln, art galleries, and rooftop dining looking up into the Margalla ridges.",
     "سید پور گاؤں اسلام آباد کے دامن میں پرانے زمانے کی جھلک پیش کرتا ہے جس کے سنگین مندر اور خوبصورت ہوٹل سیاحوں کو اپنی طرف کھینچتے ہیں۔"),
    ("lotus-lake-shakarparian", "Lotus Lake & Cultural Enclave (Shakarparian)", "لوٹس لیک و ثقافتی انکلیو شکر پڑیاں اسلام آباد", "park", "Islamabad", "Islamabad Capital Territory", 33.691667, 73.072222, 350,
     "Restored natural lotus flower lake and family park nestled in the forested hills of Shakarparian.", "شکر پڑیاں کے سرسبز جنگل میں واقع بحال شدہ قدرتی کنول کے پھولوں کی جھیل اور فیملی پارک۔",
     "Featuring blooming pink lotus blossoms, wooden garden pavilions, and peaceful stone walking paths just minutes from the Pakistan Monument, offering an urban wildlife sanctuary.",
     "پاکستان مانومنٹ کے قریب واقع لوٹس لیک پر کھلے ہوئے گلابی کنول کے پھول اور پرسکون واک وے دارالحکومت میں ایک خوبصورت نخلستان ہیں۔"),
    ("rose-and-jasmine-garden", "Rose & Jasmine Garden (Shakarparian)", "روز اینڈ جیسمین گارڈن (گلاب و چنبیلی باغ) اسلام آباد", "park", "Islamabad", "Islamabad Capital Territory", 33.697222, 73.080556, 400,
     "Expansive 50-acre floral park holding over 250 varieties of roses and dozens of jasmine species.", "50 ایکڑ پر پھیلا ہوا پھولوں کا خوبصورت باغ جہاں گلاب کی 250 سے زائد اور چنبیلی کی درجنوں اقسام ہیں۔",
     "Renowned for the annual National Spring Flower Show, this fragrant park features illuminated fountains, walking boulevards, and quiet gazebos that celebrate Pakistan's national flower, the Jasmine.",
     "قومی پھول چنبیلی اور ہزاروں سرخ گلابوں سے مہکتا یہ باغ اسلام آباد کی سب سے رومانوی اور خوبصورت فیملی تفریح گاہ ہے۔"),
    ("lake-view-bird-aviary", "Lake View Park Bird Aviary & Marina (Rawal Lake)", "لیک ویو پارک برڈ ایویری و واٹر اسپورٹس (راول جھیل) اسلام آباد", "attraction", "Islamabad", "Islamabad Capital Territory", 33.713889, 73.125, 600,
     "Sprawling lakeside recreation park on Rawal Lake featuring South Asia's largest walk-through bird aviary.", "راول جھیل کے کنارے واقع تفریحی پارک جہاں جنوبی ایشیا کی سب سے بڑی واک تھرو پرندوں کی ایویری ہے۔",
     "Home to hundreds of exotic macaws, swans, and peacocks flying freely under high netting, alongside jet-ski boating, rock-climbing walls, and sunset picnic lawns overlooking Rawal Dam.",
     "راول ڈیم کے کنارے لیک ویو پارک میں پرندوں کے ساتھ چہل قدمی، بوٹنگ اور سرسبز لانز اسلام آباد کی سب سے مقبول ہفتہ وار تفریح گاہ ہیں۔"),

    # Gilgit-Baltistan (10)
    ("rakaposhi-view-point-nagar", "Rakaposhi View Point & Glacier Cafe (Ghulmet Nagar)", "راکا پوشی ویو پوائنٹ و گلیشیئر کیفے غلمت نگر گلگت", "viewpoint", "Nagar", "Gilgit-Baltistan", 36.216667, 74.483333, 800,
     "Direct roadside viewpoint on the Karakoram Highway looking up the sheer 25,551-foot face of Mount Rakaposhi.", "شاہراہِ قراقرم کے بالکل ساتھ واقع ویو پوائنٹ جہاں سے 25,551 فٹ بلند راکا پوشی چوٹی کا نظارہ ہوتا ہے۔",
     "Rising unbroken over 19,000 feet directly from the road valley, the glistening white ice pyramid of Rakaposhi ('Mother of Mists') offers travelers riverside mountain dining directly beneath glacial moraines.",
     "دنیا کے خوبصورت ترین برفیلے پہاڑ راکا پوشی کو روڈ پر کھڑے ہو کر دیکھنا اور دریا کے کنارے بیٹھ کر چائے پینا شاہراہِ قراقرم کا لازوال سحر ہے۔"),
    ("altit-fort-and-royal-orchard", "Altit Fort & 900-Year-Old Shikari Tower (Hunza)", "قلعہ التیت و 900 سال قدیم شکاری ٹاور ہنزہ", "historical", "Hunza", 36.316667, 74.683333, 400,
     "900-year-old stone and timber fortress perched on a 1,000-foot sheer cliff above the Hunza River.", "دریائے ہنزہ سے ایک ہزار فٹ بلند عمودی چٹان پر واقع 900 سال پرانا پتھر اور لکڑی کا تاریخی قلعہ۔",
     "Ancient ancestral seat of the Mirs of Hunza predating Baltit Fort, Altit features the famous Shikari watchtower, royal apricot orchards, and UNESCO-awarded wood and mud preservation.",
     "ہنزہ کا قدیم ترین قلعہ التیت لکڑی کے تراشیدہ ستونوں اور اونچے شکاری ٹاور کے ساتھ قراقرم کی قدیم بادشاہت کا زندہ گواہ ہے۔"),
    ("hussaini-suspension-bridge-passu", "Hussaini Suspension Bridge (Passu Hunza)", "حسینی معلق پل (دنیا کا سنسنی خیز جھولتا پل) پسو ہنزہ", "attraction", "Hunza", 36.425, 74.883333, 500,
     "World-famous historic rope and wooden plank suspension bridge swaying over the rushing Hunza River.", "دریائے ہنزہ کے اوپر رسیوں اور لکڑی کے تختوں پر جھولتا ہوا دنیا کا مشہور ترین سنسنی خیز پل۔",
     "Widely considered one of the most adventurous pedestrian bridges on earth, daring travelers cross wide wooden plank gaps suspended high above roaring glacial waters beneath the Passu Cones.",
     "پسو کی نوکیلی چوٹیوں کے سائے تلے اچھلتے دریا کے اوپر لٹکتے حسینی پل پر قدم رکھنا بہادری اور ایڈونچر کا ایک ناقابلِ فراموش امتحان ہے۔"),
    ("attabad-lake-boating-terminal", "Attabad Lake Boating & Jet-Ski Terminal (Hunza)", "عطا آباد جھیل بوٹنگ و واٹر اسپورٹس ٹرمینل ہنزہ", "nature", "Hunza", 36.333333, 74.866667, 1000,
     "Dramatic 13-kilometer turquoise alpine lake created by a 2010 mountain landslide, flanked by sheer cliffs.", "2010ء میں پہاڑ گرنے سے بننے والی 13 کلومیٹر لمبی گہرے نیلے فیروزی پانی کی خوبصورت جھیل۔",
     "Now a world-famous adventure destination, Attabad offers colorful boat cruises, thrilling jet ski rides, and floating restaurants set against towering barren Karakoram canyon cliffs.",
     "قراقرم کے خشک پہاڑوں کے درمیان نیلم کی طرح چمکتی عطا آباد جھیل پر اسپیڈ بوٹنگ کرنا سیاحوں کے لیے ایک مسحور کن اور نیا قدرتی تجربہ ہے۔"),
    ("katpana-cold-desert-skardu", "Katpana Cold Desert & High-Altitude Sand Dunes (Skardu)", "کتپناہ سرد صحرا و بلند ریتلے ٹیلے اسکردو بلتستان", "nature", "Skardu", "Gilgit-Baltistan", 35.333333, 75.583333, 1000,
     "One of the world's highest cold deserts perched at 7,300 feet, covered in snow during freezing winter.", "7300 فٹ کی بلندی پر دنیا کے بلند ترین سرد ترین صحراؤں میں سے ایک جہاں سردیوں میں ریت پر برف جم جاتی ہے۔",
     "Surrounded by jagged snow-covered granite mountains, the undulating white and grey dunes of Katpana offer surreal sunset camel rides, bonfires, and stargazing in the heart of Baltistan.",
     "اسکردو کے پہاڑوں کے بیچوں بیچ پھیلے ہوئے کتپناہ کے سرد ریتلے ٹیلے دنیا کا ایک انوکھا منظر پیش کرتے ہیں جہاں صحرا اور برف ساتھ ساتھ نظر آتے ہیں۔"),
    ("sarfaranga-cold-desert-shigar", "Sarfaranga Cold Desert & Sand Dunes (Shigar)", "سرفرنگا سرد صحرا و ریتلے ٹیلے شگر بلتستان", "nature", "Shigar", "Gilgit-Baltistan", 35.433333, 75.666667, 1200,
     "Expansive high-altitude sand dune desert situated at the entrance of the Shigar Valley beneath granite peaks.", "وادیِ شگر کے دہانے پر واقع دیوہیکل سرد صحرا جہاں سالانہ بین الاقوامی جیپ ریلی اور موٹر اسپورٹس ہوتی ہے۔",
     "Famous for its dramatic wide sand dunes kissed by glacier winds and host to the annual Sarfaranga Desert Rally, attracting thousands of motorsport enthusiasts to the Karakoram.",
     "سرفرنگا کا سرد صحرا قراقرم کے دامن میں ریت کے سمندر جیسا لگتا ہے جہاں جیپ ریلی اور پیرا گلائیڈنگ سیاحوں کو حیرت زدہ کر دیتی ہے۔"),
    ("shangrila-resort-lower-kachura", "Shangrila Resort & Lower Kachura Lake (Skardu)", "شنگریلا ریزارٹ و زیریں کچورا جھیل اسکردو بلتستان", "attraction", "Skardu", "Gilgit-Baltistan", 35.416667, 75.45, 600,
     "Famous heart-shaped mountain lake surrounded by pagoda chalets and apple orchards, the 'Heaven on Earth'.", "دل کی شکل کی خوبصورت پہاڑی جھیل جس کے کنارے سرخ چینی پگوڈا ریسارٹ اور سیب کے باغات ہیں۔",
     "Established in 1983 around an authentic crash-landed DC-3 aircraft turned into a cafe, Shangrila's calm waters mirror towering rocky peaks, setting the gold standard for romantic mountain travel.",
     "اسکردو کی شنگریلا جھیل اپنے پرسکون نیلے پانی، خوبصورت کاٹیجز اور ہوائی جہاز کیفے کے ساتھ پاکستان کا سب سے مشہور رومانوی ریزارٹ ہے۔"),
    ("upper-kachura-lake-emerald", "Upper Kachura Lake (The Pristine Emerald Lake)", "بالائی کچورا جھیل (شفاف زمردی جھیل) اسکردو", "nature", "Skardu", "Gilgit-Baltistan", 35.45, 75.45, 800,
     "Pristine, uncommercialized deep emerald glacial lake surrounded by wild apricot orchards and granite cliffs.", "خالص قدرتی حالت میں واقع گہرے زمردی پانی کی جھیل جو خوبانی کے درختوں اور چٹانوں سے گھری ہے۔",
     "Surrounded by vertical mountain walls, Upper Kachura offers rowboat rentals on crystal waters so clear that underwater boulders and swimming wild trout are visible at depths of thirty feet.",
     "شنگریلا سے تھوڑا آگے واقع بالائی کچورا جھیل کا گہرا شفاف سبز پانی اتنا صاف ہے کہ نیچے چٹانیں اور مچھلیاں تیرتی نظر آتی ہیں۔"),
    ("sheosar-lake-deosai-plains", "Sheosar Lake (The Heart of Deosai Plains 13,580 ft)", "شاؤسر جھیل (دیوسائی کا دل 13,580 فٹ) گلگت بلتستان", "nature", "Astore", "Gilgit-Baltistan", 34.983333, 75.25, 1200,
     "Highest deep-alpine lake in the world sitting at 13,580 feet in the 'Land of the Giants' (Deosai National Park).", "13,580 فٹ بلندی پر دیوسائی کے دیو ہیکل میدان میں واقع دنیا کی بلند ترین اور خوبصورت ترین الپائن جھیل۔",
     "Set amidst the vast undulating alpine plateau of Deosai, Sheosar Lake's deep blue waters mirror the distant snowy crest of Nanga Parbat, surrounded by blooming wildflowers and Himalayan brown bears.",
     "دیوسائی کے نہ ختم ہونے والے سرسبز میدانوں کے بیچ شاؤسر جھیل کا نیلا پانی اور سامنے نانگا پربت کا ماتھا قدرت کی عظمت کا سب سے بڑا مظہر ہے۔"),
    ("chaqchan-mosque-khaplu-heritage", "Chaqchan Mosque (14th-Century Wooden Marvel Khaplu)", "چقچن مسجد (14ویں صدی کا لکڑی کا شاہکار) خپلو بلتستان", "historical", "Ghanche", "Gilgit-Baltistan", 35.15, 76.333333, 400,
     "1370 CE historic Tibetan-Islamic wooden mosque in Khaplu, one of the oldest Islamic monuments in Baltistan.", "1370ء کی تبتی اور اسلامی طرز کی تاریخی لکڑی کی مسجد جو بلتستان کی قدیم ترین مسجد ہے۔",
     "Built by Sufi preacher Mir Sayyid Ali Hamadani, this multi-tiered pagoda-style cedar wood masterpiece features intricate hand-carved floral lattices, Tibetan eaves, and painted geometric ceilings.",
     "خپلو میں واقع چقچن مسجد دیودار کی تراشیدہ لکڑی کا ایسا انوکھا شاہکار ہے جس میں تبتی بدھ اور اسلامی فنِ تعمیر کا 700 سال پرانا ملاپ نظر آتا ہے۔")
]

file_lines = [
    '"""North Mega Dataset for GoTourGo (AJK, GB, and ICT Landmarks)."""',
    'from __future__ import annotations',
    'from scripts.landmark_builder.generator import make_clean_record',
    '',
    'NORTH_MEGA_DATA = ['
]

for t in NORTH_DATA:
    file_lines.append(f'    {repr(t)},')

file_lines.extend([
    ']',
    '',
    'def get_north_mega() -> list[dict]:',
    '    records = []',
    '    for item in NORTH_MEGA_DATA:',
    '        records.append(make_clean_record(',
    '            slug=item[0], name=item[1], name_ur=item[2], category=item[3], city=item[4], region=item[5],',
    '            lat=item[6], lon=item[7], radius=item[8], short_en=item[9], short_ur=item[10], desc_en=item[11], desc_ur=item[12]',
    '        ))',
    '    return records',
    ''
])

with open(dest, "w", encoding="utf-8") as f:
    f.write("\n".join(file_lines))

print(f"Successfully wrote {len(NORTH_DATA)} landmarks to {dest}!")
