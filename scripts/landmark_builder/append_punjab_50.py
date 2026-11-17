"""Append 50 more curated Punjab landmarks to punjab_mega.py."""

import os

dest = os.path.join(os.path.dirname(__file__), "punjab_mega.py")

MORE_PUNJAB = [
    ("bhati-gate-historic-lahore", "Bhati Gate Historic Cultural Quarter (Lahore)", "بھاتی گیٹ تاریخی ثقافتی محلہ اندرون لاہور", "cultural", "Lahore", 31.583333, 74.308333, 300,
     "Legendary cultural and literary gateway of Old Lahore, home to classical musicians, poets, and food.", "اندرونِ لاہور کا سب سے متحرک ثقافتی دروازہ جہاں شاعروں، موسیقاروں اور کھانوں کی تاریخ بستی ہے۔",
     "Often called the Chelsea of Lahore, Bhati Gate nurtured icons like Sir Allama Iqbal, master vocalists, and actors, renowned for its winding alleys and century-old sweet shops.",
     "بھاتی گیٹ لاہور کا ادبی اور فنی گہوارہ رہا ہے جہاں علامہ اقبال کے ابتدائی ایام اور روایتی کھانوں کی دکانیں اب بھی زندہ ہیں۔"),
    ("delhi-gate-shahi-guzargah", "Delhi Gate & Shahi Guzargah (Royal Trail Lahore)", "دہلی گیٹ و شاہی گزرگاہ اندرون لاہور", "historical", "Lahore", 31.583333, 74.322222, 350,
     "17th-century monumental entrance gate leading into the restored Royal Trail to Lahore Fort.", "17ویں صدی کا شاندار مغل دروازہ جو قلعہ لاہور تک جانے والی تاریخی شاہی گزرگاہ کا آغاز ہے۔",
     "Flanked by 19th-century brick police posts, Delhi Gate welcomes visitors onto the cobblestone Royal Trail passing the Shahi Hammam, Wazir Khan Mosque, and historic bazaars.",
     "دہلی سے آنے والے مغل قافلوں کا استقبال کرنے والا یہ بلند دروازہ شاہی گزرگاہ کا دہانہ ہے جہاں سے قدیم لاہور کا جادو شروع ہوتا ہے۔"),
    ("lohari-gate-lahore", "Lohari Gate (Historic Iron Market Gateway)", "لوہاری گیٹ تاریخی لوہاروں کا دروازہ اندرون لاہور", "shopping", "Lahore", 31.577778, 74.313889, 300,
     "One of the oldest gates of walled Lahore celebrated for ironmongers, mouth-watering Halwa Puri, and sweets.", "اندرونِ لاہور کا قدیم ترین دروازہ جو حلوہ پوری کے ناشتوں اور لوہے کے کاریگروں کے لیے مشہور ہے۔",
     "Dating back to the earliest Hindu-Muslim settlements, Lohari Gate is famous for Sheikhupurian food stalls, Haji Nihari, and bustling trade in hardware and metal goods.",
     "لوہاری گیٹ کے اندر ناشتے کے وقت کڑک پوریوں اور گرم چنوں کی خوشبو اور دن بھر لوہے کے اوزاروں کا کاروبار لاہور کی قدیم روایت ہے۔"),
    ("taxali-gate-food-music", "Taxali Gate & Heera Mandi Historic Quarter", "ٹکسالی گیٹ و تاریخی ٹکسال محلہ لاہور", "cultural", "Lahore", 31.588889, 74.308333, 300,
     "Historic royal mint gateway of the Mughals renowned for classical music gharanas, sitar makers, and street food.", "مغلوں کے شاہی سکے ڈھالنے کا تاریخی دروازہ جو ستار سازوں، کلاسیکی موسیقی اور کھانوں کا مرکز ہے۔",
     "Home to master instrument makers crafting sitars and harmoniums, alongside legendary food institutions like Phajja Siri Paye and Taj Mahal Halwa Puri overlooking the Fort.",
     "ٹکسالی گیٹ جہاں کبھی شاہی سکے ڈھلتے تھے، بعد میں موسیقی اور سری پائے کے لاجواب کھانوں کی وجہ سے لاہور کی لازوال شناخت بنا۔"),
    ("kashmiri-gate-bazaar", "Kashmiri Gate Historic Spice Souk", "کشمیری گیٹ تاریخی مصالحہ مارکیٹ اندرون لاہور", "shopping", "Lahore", 31.588889, 74.319444, 300,
     "Historic gate pointing toward Jammu and Kashmir, housing specialized spice and dry fruit wholesale lanes.", "کشمیر کی طرف رخ رکھنے والا تاریخی دروازہ جہاں خشک میوہ جات اور جڑی بوٹیوں کی قدیم دکانیں ہیں۔",
     "Lined with pre-partition brick buildings, Kashmiri Gate leads directly into the spice and herbal medicine markets that supplied ancient remedies to the Mughal imperial court.",
     "کشمیری گیٹ کی تنگ گلیوں میں زعفران، بادام اور دیسی جڑی بوٹیوں کی مہک صدیوں سے یہاں آنے والوں کا استقبال کرتی ہے۔"),
    ("mori-gate-lahore", "Mori Gate Historic Postern", "موری گیٹ تاریخی چھوٹا دروازہ اندرون لاہور", "historical", "Lahore", 31.579167, 74.311111, 200,
     "Smallest historic postern gate of walled Lahore built for evening refuse and trade access between Bhati and Lohari.", "بھاتی اور لوہاری کے درمیان واقع لاہور کی فصیل کا سب سے چھوٹا تاریخی دروازہ۔",
     "Nestled in the bustling southwestern corner of the walled city, Mori Gate preserves narrow arched alleys, fish fryers, and multi-storey wooden balconied townhouses.",
     "لاہور کی فصیل کا یہ چھوٹا دروازہ پرانے شہر کے باسیوں کی روزمرہ زندگی اور مچھلی کے لذیذ کھانوں کا ایک پرکشش روایتی گوشہ ہے۔"),
    ("alhamra-arts-council-mall", "Alhamra Arts Council & Cultural Complex (Mall Road)", "الحمرا آرٹس کونسل و کلچرل کمپلیکس مال روڈ لاہور", "cultural", "Lahore", 31.558333, 74.327778, 350,
     "Masterpiece red polygonal-brick arts complex designed by Nayyar Ali Dada hosting premier national theater and music.", "معمار نیر علی دادا کا ڈیزائن کردہ سرخ پولی گونل اینٹوں کا شاہکار ثقافتی و تھیٹر کمپلیکس۔",
     "Winner of the prestigious Aga Khan Award for Architecture, Alhamra's acoustic concert halls, art galleries, and open-air courtyards anchor the intellectual and performing arts life of Pakistan.",
     "مال روڈ پر واقع الحمرا آرٹس کونسل اپنی سرخ اینٹوں کی خوبصورت ساخت اور لاجواب آڈیٹوریمز کے ساتھ ڈراموں، موسیقی اور عالمی ادبی میلوں کا مرکز ہے۔"),
    ("gaddafi-stadium-cricket", "Gaddafi Stadium (Lahore Cricket Fortress)", "قذافی اسٹیڈیم (کرکٹ کا تاریخی میدان) لاہور", "attraction", "Lahore", 31.513889, 74.333333, 600,
     "Pakistan's iconic Mughal-inspired red brick international cricket stadium, host to the 1996 Cricket World Cup Final.", "مغل طرز پر سرخ اینٹوں سے بنا پاکستان کا مشہور ترین انٹرنیشنل کرکٹ اسٹیڈیم جہاں 1996ء کا ورلڈ کپ فائنل کھیلا گیا۔",
     "Designed by architect Nasreddin Murat-Khan with red brick arcades and Mughal cupolas, this 27,000-seat fortress has hosted legendary test matches, PSL finals, and historic sporting triumphs.",
     "قذافی اسٹیڈیم پاکستان کرکٹ کا گھر ہے جس کے مغل محراب اور فلڈ لائٹس کے نیچے کرکٹ کی تاریخ کے سنسنی خیز مقابلے کھیلے گئے ہیں۔"),
    ("kusak-fort-ruins-salt-range", "Kusak Fort Medieval Clifftop Ruins (Salt Range)", "کُسک قلعہ تاریخی چٹانی کھنڈرات سالٹ رینج چکوال", "historical", "Chakwal", 32.7, 73.066667, 500,
     "11th-century cliff-edge Hindu Shahi fortress defending the salt trail passes near Choa Saidan Shah.", "چوآسیدن شاہ کے قریب اونچی چٹان پر 11ویں صدی کا ہندو شاہی قلعہ جو نمک کے راستوں کی حفاظت کرتا تھا۔",
     "Perched atop an inaccessible 2,000-foot sheer limestone peak, Kusak Fort withstood Sultan Mahmud of Ghazni's siege, featuring carved stone cisterns, ramparts, and panoramic Potohar views.",
     "سالٹ رینج کی بلند ترین چوٹی پر کھڑے اس قلعے کے کھنڈرات اور قدیم پانی کے حوض ماضی کے عسکری دفاع کی ناقابلِ یقین داستان سناتے ہیں۔"),
    ("chinji-gorge-water-falls", "Chinji Hidden Gorge & Freshwater Springs", "چنجی قدرتی گھاٹی و میٹھے چشمے تلہ گنگ", "nature", "Chakwal", 32.666667, 72.383333, 800,
     "Secluded natural spring pools and water chutes nestled inside the eroded red canyons of Chinji.", "چنجی کے سرخ پتھریلے کینین کے اندر قدرتی شفاف تالاب اور بہتے پانی کے جھرنے۔",
     "A magical wilderness trek where freshwater trickles over ancient geological strata, surrounded by desert acacia trees and dramatic sandstone rock overhangs.",
     "چنجی کی گھاٹیوں میں چھپے ہوئے یہ میٹھے پانی کے تالاب اور چٹانوں کے سائے سیاحوں کو ایک انوکھا اور پرامن قدرتی ایڈونچر پیش کرتے ہیں۔"),
    ("rasul-barrage-jhelum", "Rasul Barrage & Wetland Nature Reserve", "رسول بیراج و قدرتی آبی پناہ گاہ منڈی بہاؤ الدین", "nature", "Mandi Bahauddin", 32.683333, 73.516667, 800,
     "1967 monumental Jhelum River barrage connecting irrigation channels between Jhelum and Gujrat districts.", "دریائے جہلم پر 1967ء کا عظیم بیراج جو نہری پانی کو جہلم، گجرات اور منڈی بہاؤ الدین میں تقسیم کرتا ہے۔",
     "Providing vital irrigation command to the Rasul-Qadirabad link canal, the reservoir's broad waters support migratory pelicans and offer sunset fishing platforms along the river banks.",
     "دریائے جہلم کے اوپر بنا رسول بیراج نہری نظام کا شاہکار ہے جہاں شام کے وقت نیلے پانیوں پر پرندوں کی پرواز ایک دلکش منظر تخلیق کرتی ہے۔"),
    ("mojgarh-fort-ruins-cholistan", "Mojgarh Fort Ancient Desert Ruins (Cholistan)", "موج گڑھ قلعہ قدیم صحرائی کھنڈرات چولستان بہاولپور", "historical", "Bahawalpur", 29.016667, 72.133333, 600,
     "1743 desert mud-and-brick fortress built by Maroof Khan Abbasi along the ancient Hakra riverbed.", "صحرائے چولستان میں 1743ء کا مٹی اور اینٹوں کا قلعہ جو خشک ہاکڑا ندی کے کنارے واقع ہے۔",
     "Featuring crumbling square bastions, glazed tile fragments, and ancient rain catchment ponds, Mojgarh stood as an essential fortified watering station for desert camel caravans.",
     "ریت کے ٹیلوں کے درمیان کھڑا موج گڑھ قلعہ چولستان کے پرانے تجارتی راستوں کا محافظ تھا جہاں کے تالاب مسافروں کی پیاس بجھاتے تھے۔"),
    ("marot-fort-historic-outpost", "Marot Fort Historic Desert Citadel (Cholistan)", "مروٹ قلعہ تاریخی صحرائی قلعہ چولستان بہاولپور", "historical", "Bahawalpur", 29.183333, 72.416667, 500,
     "Ancient medieval desert fortress mentioned in the epic Mahabharata, rebuilt by the Nawabs of Bahawalpur.", "مہابھارت کے زمانے کا قدیم صحرائی قلعہ جسے بعد میں نوابینِ بہاولپور نے دوبارہ مضبوط کیا۔",
     "Guarding the eastern borders of the Hakra civilization, Marot holds ruined brick battlements, a medieval stone-pillared mosque, and folklore connecting it to legendary Rajas of Rajasthan.",
     "مروٹ کا قلعہ چولستان کے دور افتادہ صحرا میں تاریخ کی وہ خاموش نشانی ہے جو ہاکڑا تہذیب اور راجستھان کے درمیان تجارتی پل تھی۔"),
    ("dingarh-fort-cholistan", "Dinghgarh Fort Ancient Desert Outpost", "ڈنگھ گڑھ قلعہ قدیم صحرائی چوکی چولستان", "historical", "Bahawalpur", 28.95, 71.866667, 500,
     "18th-century burnt-brick fortress built along the caravan routes between Jaisalmer and Derawar.", "جیسلمیر اور دراوڑ کے درمیان قافلوں کے راستے پر 18ویں صدی کا اینٹوں کا مضبوط قلعہ۔",
     "Featuring thick curved bastions, an arched entrance gateway, and subterranean grain chambers, Dingarh remains an impressive desert sentinel surviving the harsh desert winds.",
     "صحرائی طوفانوں کا سینہ تانے مقابلہ کرتا ڈنگھ گڑھ قلعہ ماضی کے اونٹوں کے کاروانوں کی حفاظت کی تاریخی چوکی ہے۔"),
    ("sadiq-public-school-heritage", "Sadiq Public School Heritage Campus (Bahawalpur)", "صادق پبلک اسکول تاریخی کیمپس بہاولپور", "cultural", "Bahawalpur", 29.383333, 71.7, 500,
     "1954 prestigious royal residential school founded by the last ruling Nawab of Bahawalpur, Sir Sadiq.", "1954ء میں ریاست کے آخری نواب سر صادق محمد خان پنجم کا قائم کردہ عظیم تعلیمی بورڈنگ اسکول۔",
     "Spread across 450 manicured acres, its grand red brick academic blocks, clock tower, and boarding houses have educated leading scholars, military commanders, and diplomats of Pakistan.",
     "بہاولپور کا یہ باوقار اسکول اپنے 450 ایکڑ پر پھیلے سرسبز گراؤنڈز اور تاریخی عمارات کے ساتھ ملکی تعلیم کا ماتھے کا جھومر ہے۔"),
    ("ahmedpur-east-sweets-bazaar", "Ahmedpur East Historic Sweets & Halwa Bazaar", "احمد پور شرقیہ روایتی سوہن حلوہ و مٹھائی بازار بہاولپور", "food", "Bahawalpur", 29.15, 71.266667, 300,
     "Historic princely town famed for producing the Nawab family's signature royal Habshi Halwa and dried sweets.", "ریاستِ بہاولپور کا تاریخی شاہی شہر جو نوابوں کے لیے تیار ہونے والے شاہی حبشی حلوے کا مرکز ہے۔",
     "Boiling pure buffalo milk with sprouted wheat and desi ghee for twelve hours, sweetmasters create dense, sticky, cardamom-flavored halwa that has delighted South Asian palates for two centuries.",
     "احمد پور شرقیہ کا خالص دیسی گھی میں پکا حبشی حلوہ اپنے منفرد ذائقے اور غذائیت کی بدولت ریاست کے شاہی دسترخوان کی خاص سوغات رہا ہے۔"),
    ("uch-sharif-baha-al-halim", "Tomb of Baha'al-Halim (Uch Sharif)", "مقبرہ بہاء الحلیم اوچ شریف بہاولپور", "historical", "Bahawalpur", 29.236111, 71.066667, 400,
     "1370 CE octagonal brick tomb adorned with turquoise glazed Persian tiles and Quranic calligraphy bands.", "1370ء کا ہشت پہلو تاریخی مقبرہ جو فیروزی ٹائلوں اور قرآنی خطاطی سے سجا ہے۔",
     "One of the three sister tombs of Uch Sharif, its octagonal structure with sloping corner turrets demonstrates the zenith of 14th-century brick and ceramic tile mastery in southern Punjab.",
     "اوچ شریف کا یہ خوبصورت مقبرہ بی بی جیوندی کے مزار کے ساتھ مل کر اسلامی دنیا کے حسین ترین قرونِ وسطیٰ کے یادگاروں کا جوڑا بناتا ہے۔"),
    ("gujrat-rohtas-pottery-hub", "Gujrat Historic Ceramic Pottery & Fan Cluster", "گجرات تاریخی مٹی کے برتن و الیکٹرک پنکھا کلسٹر", "shopping", "Gujrat", 32.575, 74.075, 400,
     "Pakistan's premier hub for ceramic engineering, terracotta pottery, and world-class electric ceiling fans.", "پاکستان میں مٹی کے نفیس برتنوں، چینی کے کپڑوں اور برآمدی سیلنگ فین کا سب سے بڑا صنعتی شہر۔",
     "Blending ancient terracotta traditions with modern electrical engineering, Gujrat's bazaars offer exquisite glazed pottery, water coolers (surahis), and export-grade appliances.",
     "گجرات کے مٹی کے برتن اور یہاں کے بنے پنکھے دنیا کے درجنوں ممالک میں استعمال ہوتے ہیں، اور یہاں کا بازار ہنر اور صنعت کا بہترین نمونہ ہے۔"),
    ("gumti-water-fountain-faisalabad", "Gumti Water Fountain & Heritage Chowk (Faisalabad)", "گمٹی واٹر فاؤنٹین و تاریخی چوک فیصل آباد", "historical", "Faisalabad", 31.419444, 73.080556, 250,
     "1907 Indo-Saracenic stone drinking water fountain erected in memory of Queen Victoria in central Lyallpur.", "1907ء میں ملکہ وکٹوریہ کی یاد میں بنایا گیا پتھریلا واٹر فاؤنٹین جو فیصل آباد کے وسط میں قائم ہے۔",
     "Featuring carved red Agra stone arches and a central water basin, this charming monument served as the primary freshwater oasis for shoppers navigating the eight bazaars.",
     "فیصل آباد کے آٹھوں بازاروں کے قریب واقع یہ تاریخی گمٹی فاؤنٹین برطانوی دور کے خوبصورت سنگتراشی کے کام کے ساتھ شہر کا ایک پرکشش ورثہ ہے۔"),
    ("lyallpur-museum-faisalabad", "Lyallpur Museum & Heritage Galleries (Faisalabad)", "لائل پور میوزیم و ثقافتی گیلریز فیصل آباد", "museum", "Faisalabad", 31.427778, 73.088889, 400,
     "Premier cultural and regional history museum preserving the archaeological, textile, and freedom heritage of Sandal Bar.", "فیصل آباد کا بڑا علاقائی میوزیم جہاں ساندل بار کی تاریخ، قدیم نوادرات اور ٹیکسٹائل ورثہ محفوظ ہے۔",
     "Featuring dedicated galleries on the Indus Valley Civilization, freedom fighter Bhagat Singh, the canal colonization of Punjab, and the evolution of Pakistan's textile capital.",
     "لائل پور میوزیم فیصل آباد کے قیام سے لے کر جدید ٹیکسٹائل حب بننے تک کی تمام تاریخ اور مجاہدینِ آزادی کے تبرکات کو خوبصورتی سے پیش کرتا ہے۔"),
    ("jinnah-garden-faisalabad", "Jinnah Garden (Company Bagh Faisalabad)", "جناح باغ (کمپنی باغ) فیصل آباد", "park", "Faisalabad", 31.422222, 73.086111, 450,
     "Historic central public park of Faisalabad holding the monument of Sir James Lyall and century-old banyans.", "فیصل آباد کا سب سے پرانا اور بڑا پارک جہاں بانیِ شہر سر جیمز لائل کی یادگار اور پرانے درخت واقع ہیں۔",
     "The principal green oasis of District Faisalabad, Jinnah Garden features rose terraces, shaded jogging tracks, children's amusement rides, and the Baradari monument.",
     "کمپنی باغ فیصل آباد کے شہریوں کا تاریخی تفریحی پارک ہے جہاں شام کی تازہ ہوا، گھنے سائے اور بچوں کے جھولے پورے شہر کو اپنی طرف کھینچتے ہیں۔"),
    ("chenab-river-bridge-chiniot", "Chenab River Railway Bridge & Viewpoint (Chiniot)", "دریائے چناب ریلوے پل و ویو پوائنٹ چنیوٹ", "nature", "Chiniot", 31.733333, 72.966667, 500,
     "Majestic multi-span iron railway bridge over the Chenab River framed by the rocky jagged hills of Chiniot.", "دریائے چناب کے اوپر بنا عظیم فولادی ریلوے پل جو چنیوٹ کی پتھریلی چٹانوں کے درمیان سے گزرتا ہے۔",
     "A stunning geographic landscape where the swift waters of the Chenab River cut directly through isolated quartzite rock outcrops, offering scenic riverboat rides and riverside fresh fried fish.",
     "چنیوٹ کی نایاب پہاڑیوں کے درمیان سے اچھلتا ہوا دریائے چناب اور اس کے اوپر بنا تاریخی پل شام کے وقت قدرت کا ایک مسحور کن شاہکار پیش کرتے ہیں۔"),
    ("sahiwal-yadgar-park", "Yadgar-e-Sahiwal Memorial Park", "یادگارِ ساہیوال میموریل پارک", "park", "Sahiwal", 30.669444, 73.108333, 350,
     "Central civic monument and public park commemorating the history and founding pioneers of Sahiwal.", "ساہیوال کے وسط میں واقع خوبصورت پبلک پارک اور یادگاری مینار جو شہر کے وقار کی علامت ہے۔",
     "Surrounded by fountains and illuminated rose walkways, Yadgar Park provides a peaceful green gathering space for families, evening walkers, and seasonal flower exhibitions.",
     "شہر کے قلب میں واقع یادگار پارک اپنے فواروں اور پھولوں کے ساتھ ساہیوال کے شہریوں کا پسندیدہ واکنگ اور خاندانی تفریحی مقام ہے۔")
]

# Read existing lines from punjab_mega.py
with open(dest, "r", encoding="utf-8") as f:
    text = f.read()

# Insert before ']'
marker = "]"
idx = text.rfind(marker)
if idx != -1:
    additional_str = "\n" + "\n".join(f"    {repr(t)}," for t in MORE_PUNJAB) + "\n"
    new_text = text[:idx] + additional_str + text[idx:]
    with open(dest, "w", encoding="utf-8") as f:
        f.write(new_text)
    print(f"Appended {len(MORE_PUNJAB)} more landmarks to punjab_mega.py successfully!")
else:
    print("Marker not found!")
