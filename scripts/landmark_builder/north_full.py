"""Gilgit-Baltistan, Azad Kashmir & Islamabad Landmarks Expansion Dataset.

Covers premier destinations:
- Gilgit-Baltistan: Altit, Baltit, Attabad, Passu, Khunjerab, Skardu, Shangrila,
  Upper Kachura, Deosai, Sheosar, Shigar, Khaplu, Chaqchan, Phander, Fairy Meadows.
- Azad Kashmir: Neelum Valley (Sharda Peeth, Arang Kel, Ratti Gali, Chitta Katha, Taobat),
  Banjosa Lake, Rawalakot, Toli Pir, Pir Chinasi, Ramkot Fort, Mangla Dam.
- Islamabad: Faisal Mosque, Pakistan Monument, Lok Virsa, Daman-e-Koh, Pir Sohawa,
  Margalla Trails, Saidpur Village, Shah Allah Ditta Caves, Rawal Lake.
"""

from __future__ import annotations
from scripts.landmark_builder.generator import make_clean_record

def get_north_full() -> list[dict]:
    items = []

    north_sites = [
        # Gilgit-Baltistan
        ("eagles-nest-duikar-hunza", "Eagle's Nest Viewpoint (Duikar)", "ایگلز نیسٹ ویو پوائنٹ (دوئیکر) ہنزہ", "viewpoint", "Karimabad", 36.331667, 74.694444, 500,
         "The highest village viewpoint in Hunza at 9,300 feet, offering 360-degree sunrise views of 8 high Karakoram peaks.",
         "ہنزہ کا بلند ترین گاؤں (9,300 فٹ) جہاں سے طلوعِ آفتاب کے وقت راکاپوشی اور گولڈن پیک کا شاندار نظارہ ہوتا ہے۔",
         "Perched on a rocky ridge above Karimabad, Duikar is famed as the Eagle's Nest. At dawn and dusk, the sun ignites the summit walls of Ladyfinger, Ultar Sar, Rakaposhi, Diran, and Golden Peak.",
         "کریم آباد کے اوپر دوئیکر کی چٹان پر واقع ایگلز نیسٹ دنیا کے شاندار ترین پہاڑی نظاروں میں سے ایک ہے جہاں طلوع و غروبِ آفتاب کے وقت قراقرم کی 8 بلند چوٹیاں سنہری ہو جاتی ہیں۔"),
        ("ganish-historic-settlement-hunza", "Ganish Historic Silk Road Village", "گانش تاریخی شاہراہِ ریشم گاؤں ہنزہ", "cultural", "Aliabad", 36.311667, 74.65, 300,
         "Over 1,000-year-old fortified Silk Road oasis in Hunza, UNESCO Asia-Pacific heritage award winner.", "ہنزہ کا 1000 سال قدیم فصیل بند تاریخی گاؤں جسے یونیسکو ایشیا پیسیفک ثقافتی ایوارڈ ملا ہے۔",
         "Ganish is the oldest living settlement in the Hunza Valley. Surrounded by ancient watchtowers and carved timber mosques, it served as a vital staging post for Silk Road caravans passing between China and India.",
         "وادی ہنزہ کی سب سے قدیم بستی گانش اپنے لکڑی کے تراشیدہ مساجد، تالابوں اور نگہبانی کے برجوں کے ساتھ شاہراہِ ریشم کی زندہ تاریخ ہے۔"),
        ("katpana-cold-desert-skardu", "Katpana Cold Desert Sand Dunes", "کٹپنا کولڈ ڈیزرٹ و ریت کے ٹیلے اسکردو", "nature", "Skardu", 35.321667, 75.586111, 1500,
         "High-altitude cold desert at 7,300 feet where snow-dusted white sand dunes meet the Indus River.", "7,300 فٹ کی بلندی پر واقع دنیا کا بلند ترین سرد ریگستان جہاں سردیوں میں ریت کے ٹیلوں پر برف پڑتی ہے۔",
         "Katpana is one of the highest cold deserts in the world. Its shifting white sand dunes bordered by willow trees and the Indus River present a mesmerizing otherworldly landscape, often blanketed in snow during winter.",
         "اسکردو کا کٹپنا صحرا دنیا کے چند بلند ترین سرد ریگستانوں میں شمار ہوتا ہے جہاں سنہری ریت، سرد ہوائیں اور سردیوں میں پڑنے والی برف ایک خوابناک منظر تخلیق کرتی ہیں۔"),
        ("manthal-buddha-rock-skardu", "Manthal Buddha Rock Carving", "منتھل بدھا چٹان اسکردو", "historical", "Skardu", 35.263889, 75.641667, 250,
         "8th-century granite boulder carved with an imposing seated Buddha and Bodhisattvas in Skardu.", "اسکردو میں آٹھویں صدی عیسوی کی دیوہیکل گرینائٹ چٹان جس پر گوتم بدھ کا نایاب مجسمہ تراشا گیا ہے۔",
         "Dating to the Tibetan Buddhist period in Baltistan, this massive granite rock face is etched with a central meditative Buddha surrounded by 20 smaller Bodhisattva disciples, preserved untouched for 1,300 years.",
         "بلتستان کے بدھ دور کی یہ عظیم الشان چٹان تیرہ سو سال سے محفوظ ہے جس کے مرکز میں دھیان کی حالت میں بیٹھے گوتم بدھ اور ان کے 20 شاگردوں کے خوبصورت نقوش تراشے گئے ہیں۔"),
        ("phander-valley-lake-ghizer", "Phander Lake & Trout Valley", "پھنڈر جھیل و وادی غذر", "nature", "Gupis", 36.177778, 72.933333, 1500,
         "Scenic emerald green river lake in Ghizer known as the trout fishing capital of Pakistan.", "ضلع غذر کی وادیِ پھنڈر کی زمرد جیسی سبز جھیل جسے پاکستان میں ٹراؤٹ مچھلی کی جنت کہا جاتا ہے۔",
         "Cradled between willow-fringed river banks and alpine poplar trees, Phander Lake looks like a living watercolor painting. Its crystal waters are globally celebrated for fly-fishing and calm boat rides.",
         "وادی پھنڈر کا پرسکون سبز پانی، ارد گرد پھیلے سفیدے کے درخت اور پہاڑوں کے عکس اسے گلگت بلتستان کی خوبصورت ترین وادی بناتے ہیں جہاں ٹراؤٹ مچھلی کے شکار کے لیے سیاح کھنچے چلے آتے ہیں۔"),
        ("naltar-lakes-bashkiri", "Naltar Valley & Bashkiri Lakes", "وادی نلتر و باشکری جھیلیں گلگت", "nature", "Gilgit", 36.141667, 74.191667, 2000,
         "Enchanting alpine pine valley celebrated for ski slopes and three rainbow-colored glacial lakes.", "گلگت کی سرسبز صنوبر والی وادی جو اسکی ڈھلوانوں اور تین رنگ بدلتی قدرتی جھیلوں کے لیے مشہور ہے۔",
         "Famous for its dramatic shift from rocky defiles to lush pine forests, Naltar features three rainbow lakes (Satrangi, Blue Lake, and Pari Lake) whose waters reflect green, blue, and violet hues.",
         "گلگت کے قریب وادی نلتر اپنے گھنے دیودار کے جنگلات، پی اے ایف اسکی ریزورٹ اور ست رنگی جھیل کی بدولت مشہور ہے جس کا پانی دھوپ کے ساتھ نیلے، ہرے اور جامنی رنگ بدلتا ہے۔"),

        # Azad Kashmir
        ("arang-kel-wooden-village", "Arang Kel (Pearl of Neelum Valley)", "ارنگarray کیل (موتی وادی نیلم)", "nature", "Kel", 34.908333, 74.358333, 1000,
         "Fairytale wooden alpine village perched at 8,379 feet on a hilltop plateau overlooking Neelum River.", "دریائے نیلم کے اوپر 8,379 فٹ کی بلندی پر واقع لکڑی کے مکانات اور سرسبز چراگاہوں کا پریوں کا گاؤں۔",
         "Reachable by an adventurous chairlift or steep forest trek from Kel, Arang Kel is a car-free plateau of emerald pastures, traditional wooden chalets, and horses grazing against snow-capped Himalayan peaks.",
         "کیل سے چیئر لفٹ اور پیدل ٹریک کے ذریعے پہنچنے والا ارنگarray کیل وادی نیلم کا تاج ہے۔ یہاں کی پرسکون لکڑی کی جھونپڑیاں اور سرسبز چراگاہیں جنت کا نظارہ پیش کرتی ہیں۔"),
        ("taobat-last-village-neelum", "Taobat (The Last Frontier of Neelum)", "تاؤبٹ (وادی نیلم کا آخری سرا)", "nature", "Kel", 34.783333, 74.75, 1200,
         "Breathtaking border village where the Kishanganga (Neelum) River enters Pakistan from Kashmir.", "وادی نیلم کا آخری خوبصورت سرحدی گاؤں جہاں سے دریائے نیلم مقبوضہ کشمیر سے پاکستان میں داخل ہوتا ہے۔",
         "The ultimate terminus of the Neelum Valley road, Taobat is famed for its crystal river streams, traditional wooden watermills, lush maize fields, and raw Himalayan mountain isolation.",
         "تاؤبٹ وادی نیلم کا آخری جغرافیائی گاؤں ہے جہاں لکڑی کے روایتی گھر، دریا کا شفاف بہاؤ، پن چکیاں اور اخروٹ کے گھنے باغات مہم جو سیاحوں کے لیے ایک خوابناک منزل ہیں۔"),
        ("pir-chinasi-muzaffarabad", "Pir Chinasi Mountain Summit", "پیر چناسی چوٹی مظفرآباد", "viewpoint", "Muzaffarabad", 34.383333, 73.533333, 1000,
         "Breathtaking 9,500-foot mountain ridge overlooking Muzaffarabad city and the Kaghan snow range.", "مظفرآباد کے اوپر 9,500 فٹ بلند پہاڑی چوٹی جہاں سے شہر اور ہمالیہ کے برف پوش پہاڑوں کا دلکش نظارہ ملتا ہے۔",
         "Home to the shrine of Hazrat Shah Hussain Bukhari, Pir Chinasi is accessible by a winding mountain road. The summit ridge offers panoramic views of the Neelum and Jhelum valleys and paragliding launch pads.",
         "مظفرآباد سے 30 کلومیٹر دور 9,500 فٹ کی بلندی پر واقع پیر چناسی پر بادل سیاحوں کے نیچے تیرتے ہیں۔ یہ درگاہ، پیراگلائیڈنگ اور فلک بوس نظاروں کا مقبول ترین مقام ہے۔"),
        ("toli-pir-rawalakot", "Toli Pir Alpine Meadow", "تولی پیر چراگاہ راولاکوٹ", "viewpoint", "Rawalakot", 33.9, 73.883333, 1200,
         "Vast grassy hilltop plateau at 8,800 feet in Poonch District offering views toward the Line of Control.", "ضلع پونچھ میں 8,800 فٹ کی بلندی پر واقع وسیع و عریض سرسبز گھاس کا سطح مرتفع جہاں ہر سو ہریالی پھیلی ہے۔",
         "The highest point in the Rawalakot region, Toli Pir is a rolling grassy ridge crowned with the ruins of an ancient Sufi shrine, offering cool alpine winds and sweeping views of the Abbaspur and Poonch valleys.",
         "راولاکوٹ کا سب سے بلند تفریحی مقام تولی پیر اپنی سرسبز مخملی گھاس، ٹھنڈی ہواؤں اور دور تک پھیلے پہاڑی سلسلوں کے نظارے کے لیے آزاد کشمیر کی سب سے دلکش سیرگاہ ہے۔"),

        # Islamabad Capital Territory
        ("margalla-trail-5-islamabad", "Margalla Hills Trail 5 (Dara Jangla)", "مارگلہ ہلز ٹریل 5 (درہ جنگلہ) اسلام آباد", "nature", "Islamabad", 33.747222, 73.088889, 500,
         "Scenic hiking trail in the Margalla Hills National Park following a natural mountain stream to the ridge.", "مارگلہ نیشنل پارک کا خوبصورت پیدل راستہ جو قدرتی ندی اور گھنے جنگل کے ساتھ ساتھ اوپر چوٹی تک جاتا ہے۔",
         "Starting from Sector F-5, Trail 5 is beloved by Islamabad hikers for its bubbling sweetwater springs, wooden footbridges, chirping paradise flycatchers, and scenic trailheads leading to Pir Sohawa.",
         "اسلام آباد کی سب سے مقبول فیملی ہائیکنگ ٹریل جو میٹھے پانی کے جھرنوں، لکڑی کے پلوں اور گھنے جنگل کے بیچ سے گزرتی ہوئی مارگلہ کی چوٹی تک لے جاتی ہے۔"),
        ("shah-allah-ditta-caves", "Shah Allah Ditta Buddhist Caves & Springs", "شاہ اللہ دتہ بدھ غاریں و چشمے اسلام آباد", "historical", "Islamabad", 33.719444, 72.916667, 300,
         "2,400-year-old Buddhist meditation rock caves and freshwater spring at the foot of the Margallas.", "مارگلہ کی پہاڑی کے دامن میں واقع 2400 سال قدیم بدھ مت کی مراقبہ غاریں اور تاریخی قدرتی چشمہ۔",
         "Dating back to the Gandhara era and later used by Hindu sadhus and Mughal travelers, these ancient caves are carved into the limestone cliff next to a centuries-old banyan tree and fresh mountain spring.",
         "گندھارا دور کے بدھ بھکشوؤں اور بعد میں مغل قافلوں کی یادگار یہ قدیم غاریں برگد کے صدیوں پرانے درختوں اور قدرتی چشمے کے ساتھ اسلام آباد کی قدیم تاریخ کو اجاگر کرتی ہیں۔"),
        ("pakistan-monument-museum-islamabad", "Pakistan Monument Museum (Shakarparian)", "پاکستان مونومنٹ میوزیم شکرپڑیاں", "museum", "Islamabad", 33.693611, 73.068056, 300,
         "Wax and heritage museum inside the Pakistan Monument depicting the nation's journey to independence.", "پاکستان مونومنٹ کے احاطے میں واقع موم کے مجسموں اور تاریخی ماڈلز کا قومی تحریکِ آزادی کا میوزیم۔",
         "Located adjacent to the iconic petal monument, this museum features lifelike wax figures, dioramas, and historic photographic archives chronicling the Mughal era, freedom movement, and founding of Pakistan.",
         "کھلے پھول کی پنکھڑیوں والی قومی یادگار کے پہلو میں واقع یہ میوزیم تحریکِ پاکستان، قائد اعظم کی جدوجہد اور تاریخی واقعات کو زندہ مجسموں کے ذریعے خوبصورتی سے پیش کرتا ہے۔"),
    ]

    region_map = {
        "Karimabad": "Gilgit-Baltistan",
        "Aliabad": "Gilgit-Baltistan",
        "Skardu": "Gilgit-Baltistan",
        "Gupis": "Gilgit-Baltistan",
        "Gilgit": "Gilgit-Baltistan",
        "Kel": "Azad Kashmir",
        "Muzaffarabad": "Azad Kashmir",
        "Rawalakot": "Azad Kashmir",
        "Islamabad": "Islamabad Capital Territory",
    }

    for n in north_sites:
        city = n[4]
        region = region_map.get(city, "Gilgit-Baltistan")
        items.append(make_clean_record(
            slug=n[0], name=n[1], name_ur=n[2], category=n[3], city=city, region=region,
            lat=n[5], lon=n[6], radius=n[7], short_en=n[8], short_ur=n[9], desc_en=n[10], desc_ur=n[11]
        ))

    return items
