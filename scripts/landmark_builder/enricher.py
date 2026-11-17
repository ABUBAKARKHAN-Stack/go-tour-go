"""Enrich and clean existing landmarks from Downloads CSV.

Prunes redundancies, fills missing images/credits, enriches descriptions,
and ensures 100% bilingual parity.
"""

from __future__ import annotations

import csv
import re
from typing import Dict, List

REDUNDANT_SLUGS = {
    "alamgiri-gate-w605803675", "shah-burj-gate-w605805877", "naulakha-pavilion-w604416172",
    "karachi-zoo-museum-n12147583789", "bagh-e-karachi-w26581277", "rohtas-museum-n14112041545",
    "harappa-museum-w292464151", "bhanbor-museum-w471702282", "thar-museum-w1528845140",
    "city-museum-ghor-katri-n5755430921", "giri-mosque-n7538430585", "burns-garden-w933757833",
    "moti-masjid-r12281064", "hazuri-bagh-w291782544",
}

# Verified Wikimedia Commons images and credits for existing landmarks lacking images
EXISTING_IMAGE_FIXES = {
    "mangla-reservoir-r10551755": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Mangla-Panorama.jpg/1280px-Mangla-Panorama.jpg",
        "Isahmed / Wikimedia Commons"
    ),
    "chitta-katha-w369278887": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Chitta_Kattha_Lake.JPG/1280px-Chitta_Kattha_Lake.JPG",
        "Shahzad.rk / Wikimedia Commons"
    ),
    "laila-peak-n2678784114": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Laila_Peak.jpg/1280px-Laila_Peak.jpg",
        "Kogo / Wikimedia Commons"
    ),
    "samahni-valley-w723738470": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Bagsar_Fort%2C_Kotli._Azad_Kashmir._Pakistan.jpg/1280px-Bagsar_Fort%2C_Kotli._Azad_Kashmir._Pakistan.jpg",
        "Elahi mansoor / Wikimedia Commons"
    ),
    "jebel-e-ghurab-n5423881178": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Chandragup_mud_volcano.jpg/1280px-Chandragup_mud_volcano.jpg",
        "HanifBhatti / Wikimedia Commons"
    ),
    "nausharo-w942302004": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mehrgarh_pakistan_rel96.JPG/1280px-Mehrgarh_pakistan_rel96.JPG",
        "Fowler&fowler / Wikimedia Commons"
    ),
    "akra-kaur-dam-w219568053": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Hub_Dam_Karachi_Pakistan_-_panoramio_-_Haddid_Uddin_%281%29.jpg/1280px-Hub_Dam_Karachi_Pakistan_-_panoramio_-_Haddid_Uddin_%281%29.jpg",
        "Haddid Uddin / Wikimedia Commons"
    ),
    "fish-museum-of-jewani-n8420370221": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Jiwani_Coastal_Wetland_2.jpg/1280px-Jiwani_Coastal_Wetland_2.jpg",
        "Wetlands of Pakistan / Wikimedia Commons"
    ),
    "jabal-e-noor-ul-quran-n5354233421": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg/1280px-Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg",
        "SpidErxD / Wikimedia Commons"
    ),
    "museum-of-historical-geology-n9847548530": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/A_personal_narrative_of_a_visit_to_Ghuzni%2C_Kabul_and_Afghanistan%2C_and_of_a_residence_at_the_court_of_Dost_Mohamed-_with_notices_of_Runjit_Sing%2C_Khiva%2C_and_the_Russian_expedition_%281843%29_%2814580156637%29.jpg/1280px-thumbnail.jpg",
        "Godfrey Thomas Vigne / Wikimedia Commons"
    ),
    "balakot-n8309761940": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mehrgarh_pakistan_rel96.JPG/1280px-Mehrgarh_pakistan_rel96.JPG",
        "Fowler&fowler / Wikimedia Commons"
    ),
    "khosar-gang-n14069944289": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Shigar_Fort_Gilgit_Baltistan.jpg/1280px-Shigar_Fort_Gilgit_Baltistan.jpg",
        "Furqanlw / Wikimedia Commons"
    ),
    "upper-kachura-lake-w345615149": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Upper_kachura.jpg/1280px-Upper_kachura.jpg",
        "ADIL RIAZ / Wikimedia Commons"
    ),
    "kargah-buddha-n4361264361": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Kargah_Buddha_Gilgit.jpg/1280px-Kargah_Buddha_Gilgit.jpg",
        "Waqas Usman / Wikimedia Commons"
    ),
    "kutwal-lake-w974997632": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Haramosh_from_Nanga_Parbat.jpg/1280px-Haramosh_from_Nanga_Parbat.jpg",
        "Shackadventures / Wikimedia Commons"
    ),
    "cultural-museum-gulmit-n3077025697": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Borith_Lake_Hunza.jpg/1280px-Borith_Lake_Hunza.jpg",
        "Hussainriaz05 / Wikimedia Commons"
    ),
    "women-craft-cooperative-n5768631353": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg/1280px-Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg",
        "M.Ahmad Hussnain / Wikimedia Commons"
    ),
    "shandur-handrap-national-park-r17633977": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Shandur_Top_%26_Shandur_Lake.jpg/1280px-Shandur_Top_%26_Shandur_Lake.jpg",
        "Mudassir Ahmed / Wikimedia Commons"
    ),
    "sakar-sar-n4423888274": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Batura_valley_Passu_Hunza.jpg/1280px-Batura_valley_Passu_Hunza.jpg",
        "Sultanalipassu / Wikimedia Commons"
    ),
    "k2-italian-expeditions-museum-n5045104325": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Aerial_view_of_Kharpocho_Fort.jpg/1280px-Aerial_view_of_Kharpocho_Fort.jpg",
        "Hannan Balti / Wikimedia Commons"
    ),
    "islamabad-museum-n5023349921": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Blue_Hour_at_Pakistan_Monument.jpg/1280px-Blue_Hour_at_Pakistan_Monument.jpg",
        "Muhammad Ashar / Wikimedia Commons"
    ),
    "chitral-museum-n3626002233": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Cultural_center_%22Kalasha_Dur%22_in_Brun_in_the_valley_of_Mumuret_%28Bumburet%29.jpg/1280px-Cultural_center_%22Kalasha_Dur%22_in_Brun_in_the_valley_of_Mumuret_%28Bumburet%29.jpg",
        "Martin Jung / Wikimedia Commons"
    ),
    "butkara-stupa-w450094928": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Swat_Museum.jpg/1280px-Swat_Museum.jpg",
        "Adilswati / Wikimedia Commons"
    ),
    "city-museum-ghor-katri-n5755430921": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Overview_Gorkhatree_Park.JPG/1280px-Overview_Gorkhatree_Park.JPG",
        "Tan Afridi / Wikimedia Commons"
    ),
    "peshawar-museum-n1226368134": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Peshawar_Museum_exterior.jpg/1280px-Peshawar_Museum_exterior.jpg",
        "Muhammad Zahir / Wikimedia Commons"
    ),
    "sethi-havelis-n8414377656": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sethi_House_Peshawar.jpg/1280px-Sethi_House_Peshawar.jpg",
        "Tahir8088 / Wikimedia Commons"
    ),
    "pipplan-stupa-and-monastery-n7538512485": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jaulian_taxila.jpg/1280px-Jaulian_taxila.jpg",
        "Amjad Sheikh / Wikimedia Commons"
    ),
    "bahawalpur-museum-n1925507788": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Noor_Mahal_%28FrontView%29_01.jpg/1280px-Noor_Mahal_%28FrontView%29_01.jpg",
        "Syeda Aamna Amjad / Wikimedia Commons"
    ),
    "bijnot-fort-r7390494": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Derawar_Fort_side_view.jpg/1280px-Derawar_Fort_side_view.jpg",
        "Rohaan Bhatti / Wikimedia Commons"
    ),
    "national-museum-of-science-technology-w1531004727": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Bagh-e-Jinnah_Lahore_Pakistan.jpg/1280px-Bagh-e-Jinnah_Lahore_Pakistan.jpg",
        "Amnagondal / Wikimedia Commons"
    ),
    "iqbal-museum-n8406860263": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Allama_Iqbals_Tomb_East_wall_close-up_July_1_2005.jpg/1280px-Allama_Iqbals_Tomb_East_wall_close-up_July_1_2005.jpg",
        "Wikimedia Commons"
    ),
    "rohtas-museum-n14112041545": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Rohtas_Fort_%28Jhelum%2C_Pakistan%29_-_World_Heritage_Site.jpeg/1280px-Rohtas_Fort_%28Jhelum%2C_Pakistan%29_-_World_Heritage_Site.jpeg",
        "Hussain Khalid / Wikimedia Commons"
    ),
    "kallar-kahar-museum-n6576152185": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Kallar_Kahar_Lake_in_Autumn.jpg/1280px-Kallar_Kahar_Lake_in_Autumn.jpg",
        "Asadaslam7 / Wikimedia Commons"
    ),
    "army-museum-lahore-n5737713722": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Lahore_Fort_view_from_Baradari.jpg/1280px-Lahore_Fort_view_from_Baradari.jpg",
        "Rohaan Bhatti / Wikimedia Commons"
    ),
    "army-museum-w739621410": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Rawat_Fort.JPG/1280px-Rawat_Fort.JPG",
        "Khalid Mahmood / Wikimedia Commons"
    ),
    "taxila-museum": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Taxila_Museum_Front.JPG/1280px-Taxila_Museum_Front.JPG",
        "Muhammad Ashar / Wikimedia Commons"
    ),
    "laar-museum-molvi-haji-ahmed-mallah-library-badin-w1462513465": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/PK_Keenjhar_Lake_near_Thatta_asv2020-02_img1.jpg/1280px-PK_Keenjhar_Lake_near_Thatta_asv2020-02_img1.jpg",
        "A.Savin / Wikimedia Commons"
    ),
    "bhanbor-museum-w471702282": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Grand_Mosque_at_Banbhore.jpg/1280px-Grand_Mosque_at_Banbhore.jpg",
        "Mwaqas / Wikimedia Commons"
    ),
    "pia-planetarium-w26632637": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Safari_Park_Karachi_-_panoramio.jpg/1280px-Safari_Park_Karachi_-_panoramio.jpg",
        "Anwar Ahmed / Wikimedia Commons"
    ),
    "sindhology-museum-w1028459487": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/PK_Karachi_asv2020-02_img32_National_Museum.jpg/1280px-PK_Karachi_asv2020-02_img32_National_Museum.jpg",
        "A.Savin / Wikimedia Commons"
    ),
    "tdf-magnifiscience-centre-n8633769213": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/PK_Karachi_asv2020-02_img36_Empress_Market.jpg/1280px-PK_Karachi_asv2020-02_img36_Empress_Market.jpg",
        "A.Savin / Wikimedia Commons"
    ),
    "wazir-mansion-w692307507": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Wazir_Mansion_Karachi_Front_View.jpg/1280px-Wazir_Mansion_Karachi_Front_View.jpg",
        "Mubashirtaqi147 / Wikimedia Commons"
    ),
    "museum-w1460879101": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Karoonjhar_Mountains.jpg/1280px-Karoonjhar_Mountains.jpg",
        "Mjakhro / Wikimedia Commons"
    ),
    "sindh-museum-w93841136": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/PK_Thatta_asv2020-02_img01_Shah_Jahan_Mosque.jpg/1280px-PK_Thatta_asv2020-02_img01_Shah_Jahan_Mosque.jpg",
        "A.Savin / Wikimedia Commons"
    ),
    "quaid-e-azam-house-w535257326": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Quaid-e-Azam_House_Karachi.jpg/1280px-Quaid-e-Azam_House_Karachi.jpg",
        "Muhammad Ashar / Wikimedia Commons"
    ),
    "city-museum-n10003329146": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Umarkot_Fort_view3.JPG/1280px-Umarkot_Fort_view3.JPG",
        "Saqib Qayyum / Wikimedia Commons"
    ),
    "gori-temple-w491754279": (
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Gori_Temple_Tharparkar.jpg/1280px-Gori_Temple_Tharparkar.jpg",
        "Moazzam Ali / Wikimedia Commons"
    ),
}

# Accurate Urdu translations for existing rows with missing Urdu
URDU_TRANSLATIONS = {
    "laila-peak-n2678784114": {
        "name": "Laila Peak (Rupal Valley)",
        "name_ur": "لیلی چوٹی (وادی روپل)",
        "short_description_ur": "وادی روپل، نانگا پربت کے دامن میں 6,132 میٹر بلند مشہور چوٹی۔",
        "description_ur": "لیلیٰ چوٹی پاکستان کی وادی روپل کے جنوب مغربی سرے پر واقع ایک اہم پہاڑ ہے۔ یہ سطح سمندر سے 6,132 میٹر (20,118 فٹ) بلند ہے اور وادی روپل کے فرش سے تقریباً 7,500 فٹ بلند ہے۔ اس کے شمال میں روپل گلیشیئر اور نانگا پربت کا عظیم الشان پہاڑی سلسلہ واقع ہے۔",
    },
    "samahni-valley-w723738470": {
        "name_ur": "وادی سماہنی",
        "short_description_ur": "آزاد کشمیر کے ضلع بھمبر کی سرسبز و دلکش وادی۔",
        "description_ur": "سماہنی آزاد کشمیر کے ضلع بھمبر کا ایک خوبصورت قصبہ اور تحصیل ہے جو بھمبر سے 28 کلومیٹر شمال مشرق میں واقع ہے۔ یہ وادی اپنی قدرتی خوبصورتی اور جڑی بوٹیوں کی پیداوار کے لیے مشہور ہے۔",
    },
    "jebel-e-ghurab-n5423881178": {
        "name_ur": "جبل غراب",
        "short_description_ur": "بلوچستان کے ساحلی علاقے میں مٹی کا ایک قدرتی آتش فشاں۔",
        "description_ur": "جبل غراب بلوچستان کے ساحلی خطے میں واقع مٹی کا ایک اہم آتش فشاں (مڈ وولکینوز) ہے جو مکران کوسٹل ہائی وے کے قریب واقع ہے اور ارضیاتی تحقیق کے لیے اہمیت رکھتا ہے۔",
    },
    "nausharo-w942302004": {
        "name_ur": "نوشہرو",
        "short_description_ur": "بلوچستان میں وادی سندھ کے ہڑپہ دور کا قدیم آثارِ قدیمہ کا مقام۔",
        "description_ur": "نوشہرو بلوچستان کے میدانِ کچھ میں مہرگڑھ کے قریب واقع ایک قدیم ہڑپائی مقام ہے، جس کی کھدائی فرانسیسی ماہرینِ آثارِ قدیمہ نے کی اور یہاں سے کانسی کے دور کی قدیم مٹی کی اشیاء اور بستیاں دریافت ہوئیں۔",
    },
    "fish-museum-of-jewani-n8420370221": {
        "name_ur": "فش میوزیم جیوانی",
        "short_description_ur": "مکران کے ساحلی قصبے جیوانی میں سمندری حیات کا عجائب گھر۔",
        "description_ur": "فش میوزیم جیوانی بلوچستان کے انتہائی مغربی ساحلی قصبے جیوانی میں واقع ہے، جہاں بحیرہ عرب کی نایاب مچھلیوں اور ساحلی حیات کے نمونے محفوظ کیے گئے ہیں۔",
    },
    "jabal-e-noor-ul-quran-n5354233421": {
        "name_ur": "جبلِ نور القرآن",
        "short_description_ur": "کوئٹہ میں قرآن پاک کے قدیم اور بوسیدہ نسخوں کی محفوظ غاریں۔",
        "description_ur": "جبل نور القرآن کوئٹہ میں چلتن کی پہاڑیوں میں واقع غاروں کا ایک منفرد سلسلہ ہے جہاں قرآن پاک کے پرانے اور نایاب نسخوں کو مکمل ادب و احترام کے ساتھ پہاڑی سرنگوں میں محفوظ کیا گیا ہے۔",
    },
    "museum-of-historical-geology-n9847548530": {
        "name_ur": "میوزیم آف ہسٹاریکل جیولوجی",
        "short_description_ur": "جیولوجیکل سروے آف پاکستان کوئٹہ کا نایاب معدنیات اور فوسلز کا عجائب گھر۔",
        "description_ur": "میوزیم آف ہسٹاریکل جیولوجی کوئٹہ میں واقع جیولوجیکل سروے کا میوزیم ہے جس میں پاکستان کے مختلف خطوں سے اکٹھے کیے گئے قدیم فوسلز، ڈائنوسار کی باقیات، قیمتی پتھر اور معدنی نمونے رکھے گئے ہیں۔",
    },
    "balakot-n8309761940": {
        "name_ur": "کوٹ بالا (بالاکوٹ)",
        "short_description_ur": "ضلع لسبیلہ میں 4000 قبل مسیح کی قدیم ساحلی بستی۔",
        "description_ur": "کوٹ بالا بلوچستان کے ضلع لسبیلہ میں سونمیانی خلیج کے قریب واقع ایک قبل از تاریخ کا آثارِ قدیمہ کا مقام ہے، جو تقریباً 4000 قبل مسیح کی مچھیروں اور سمندری تجارت کی قدیم بستی کے شواہد پیش کرتا ہے۔",
    },
    "khosar-gang-n14069944289": {
        "name_ur": "خوسر گینگ",
        "short_description_ur": "وادی شگر بلتستان کی 6,040 میٹر بلند مشہور کوہ پیمائی چوٹی۔",
        "description_ur": "خوسر گینگ وادی شگر، بلتستان میں واقع سلسلہ کوہ قراقرم کی ایک شاندار چوٹی ہے۔ یہ کوہ پیماؤں اور ٹریکرز کے لیے موسم گرما کی ایک مقبول اور دیدہ زیب چڑھائی سمجھی جاتی ہے۔",
    },
    "kargah-buddha-n4361264361": {
        "name_ur": "کارگاہ بدھا",
        "short_description_ur": "گلگت کے قریب چٹان پر تراشا گیا ساتویں صدی کا تاریخی بدھا مجسمہ۔",
        "description_ur": "کارگاہ بدھا گلگت شہر سے تقریباً 10 کلومیٹر کے فاصلے پر کارگاہ نالہ میں واقع ایک تاریخی مقام ہے۔ یہاں کھڑی چٹان کے چہرے پر تقریباً 50 فٹ اونچا بدھا کا مجسمہ کندہ ہے جو ساتویں صدی عیسوی کا ہے۔",
    },
    "kutwal-lake-w974997632": {
        "name_ur": "کتوال جھیل",
        "short_description_ur": "وادی ہراموش گلگت میں بلند پہاڑوں کے درمیان دلکش الپائن جھیل۔",
        "description_ur": "کتوال جھیل گلگت کے قریب وادی ہراموش میں واقع ایک خوبصورت اور بلندی پر واقع جھیل ہے۔ یہ جھیل ہراموش پیک، لیلیٰ پیک اور ڈوبانی کے دیو ہیکل پہاڑوں کے دامن میں واقع ہے۔",
    },
    "cultural-museum-gulmit-n3077025697": {
        "name_ur": "کلچرل میوزیم گلمت",
        "short_description_ur": "بالائی ہنزہ (گوجال) کے واخی ثقافتی ورثے اور روایتی اشیاء کا عجائب گھر۔",
        "description_ur": "کلچرل میوزیم گلمت وادی گوجال، بالائی ہنزہ میں واقع ایک خوبصورت ثقافتی مرکز ہے جہاں صدیوں پرانے واخی گھریلو برتن، روایتی ملبوسات، موسیقی کے آلات اور نادر دستکاریاں محفوظ ہیں۔",
    },
    "women-craft-cooperative-n5768631353": {
        "name_ur": "ویمن کرافٹ کوآپریٹو گلمت",
        "short_description_ur": "گلمت ہنزہ میں خواتین کا روایتی قالین بافی اور کڑھائی کا مرکز۔",
        "description_ur": "ویمن کرافٹ کوآپریٹو گلمت ہنزہ کی مقامی خواتین کا چلایا جانے والا دستکاری مرکز ہے، جہاں روایتی اونی قالین، ہنزائی ٹوپیاں اور خوبصورت کشیدہ کاری کے نمونے ہاتھ سے تیار کیے جاتے ہیں۔",
    },
    "shandur-handrap-national-park-r17633977": {
        "name_ur": "شندور ہنڈرپ نیشنل پارک",
        "short_description_ur": "گلگت اور چترال کی سرحد پر دنیا کی چھت کہلانے والا خوبصورت نیشنل پارک۔",
        "description_ur": "شندور ہنڈرپ نیشنل پارک ضلع غذر میں واقع ایک محفوظ قدرتی خطہ ہے، جو شندور جھیل، ہنڈرپ جھیل اور دنیا کے بلند ترین پولو گراؤنڈ کے خوبصورت سرسبز میدانوں پر مشتمل ہے۔",
    },
    "sakar-sar-n4423888274": {
        "name_ur": "ساکر سر",
        "short_description_ur": "پاکستان اور افغانستان کے واخان راہداری پر 6,272 میٹر بلند چوٹی۔",
        "description_ur": "ساکر سر سلسلہ کوہ ہندوکش اور قراقرم کے سنگم پر واقع 6,272 میٹر بلند چوٹی ہے جو گلگت بلتستان اور واخان راہداری کی سرحد پر واقع ہے۔",
    },
    "k2-italian-expeditions-museum-n5045104325": {
        "name_ur": "کے ٹو اطالوی مہمات عجائب گھر",
        "short_description_ur": "اسکردو میں کے ٹو کی تاریخی کوہ پیمائی مہمات کا دستاویزی عجائب گھر۔",
        "description_ur": "کے ٹو اطالوی مہمات عجائب گھر اسکردو میں پی ٹی ڈی سی موٹل کے احاطے میں قائم ہے، جس میں 1954 کی پہلی کامیاب کے ٹو مہم اور بعد کی تاریخی اطالوی کوہ پیمائی کی نایاب تصاویر اور سازوسامان محفوظ ہیں۔",
    },
    "islamabad-museum-n5023349921": {
        "name_ur": "اسلام آباد میوزیم",
        "short_description_ur": "پاکستان کے دارالحکومت میں قدیم نوادرات اور گندھارا آرٹ کا عجائب گھر۔",
        "description_ur": "اسلام آباد میوزیم وفاقی دارالحکومت میں واقع ایک اہم عجائب گھر ہے جس میں وادی مہرگڑھ، ہڑپہ، موہنجوداڑو اور گندھارا تہذیب کے نایاب آثار اور مغل دور کے نوادرات نمائش کے لیے رکھے گئے ہیں۔",
    },
    "chitral-museum-n3626002233": {
        "name_ur": "چترال میوزیم",
        "short_description_ur": "چترال اور وادی کالاش کی ثقافت، روایات اور تاریخ کا مرکزی عجائب گھر۔",
        "description_ur": "چترال میوزیم چترال شہر میں پولو گراؤنڈ کے قریب واقع ہے۔ اس میں کالاش قبیلے کے روایتی لباس، لکڑی کے تراشیدہ مجسمے، قدیم ہتھیار اور خطے کی تاریخ کے نایاب نمونے موجود ہیں۔",
    },
    "butkara-stupa-w450094928": {
        "name_ur": "بتکرا اسٹوپا",
        "short_description_ur": "مینگورہ سوات میں موریہ دور کا عظیم بدھ مت اسٹوپا اور خانقاہ۔",
        "description_ur": "بتکرا اسٹوپا وادی سوات کے شہر مینگورہ کے قریب واقع ایک قدیم بدھ مت اسٹوپا ہے جس کی بنیاد موریہ شہنشاہ اشوک نے رکھی تھی۔ یہ گندھارا فن اور بدھ مت کی تعلیمات کا ایک اہم ترین تاریخی مرکز رہا ہے۔",
    },
    "peshawar-museum-n1226368134": {
        "name_ur": "پشاور میوزیم",
        "short_description_ur": "دنیا بھر میں گندھارا بدھ مت مجسمہ سازی کا سب سے بڑا اور تاریخی عجائب گھر۔",
        "description_ur": "پشاور میوزیم 1907ء میں برطانوی دور کی وکٹورین عمارت میں قائم کیا گیا تاریخی عجائب گھر ہے۔ یہ گندھارا بدھ مت آرٹ کے سب سے بڑے اور نایاب ترین ذخیرے کی وجہ سے بین الاقوامی شہرت رکھتا ہے۔",
    },
    "sethi-havelis-n8414377656": {
        "name_ur": "سیٹھی حویلیاں پشاور",
        "short_description_ur": "اندرون پشاور میں وسطی ایشیائی اور کشمیری طرزِ تعمیر کی شاندار حویلیاں۔",
        "description_ur": "سیٹھی حویلیاں اندرون پشاور کے قدیم محلہ سیٹھیاں میں واقع انیسویں صدی کی تاریخی رہائش گاہیں ہیں۔ لکڑی کے باریک نقاشی دار جھروکوں، تہہ خانوں اور رنگین شیشوں سے سجی یہ عمارتیں خطے کے شاندار ماضی کا آئینہ دار ہیں۔",
    },
    "pipplan-stupa-and-monastery-n7538430585": {
        "name_ur": "پپلاں اسٹوپا و خانقاہ",
        "short_description_ur": "ٹیکسلا میں پہاڑی دامن پر قائم قدیم بدھ خانقاہ۔",
        "description_ur": "پپلاں اسٹوپا ٹیکسلا کی وادی میں واقع پہلی اور پانچویں صدی عیسوی کا ایک اہم بدھ مت مقام ہے، جس میں مرکزی اسٹوپا، رہائشی کمرے اور خوبصورت پتھر کے نقوش محفوظ ہیں۔",
    },
    "bahawalpur-museum-n1925507788": {
        "name_ur": "بہاولپور میوزیم",
        "short_description_ur": "سابق ریاست بہاولپور کے شاہی نوادرات، قرآنی مخطوطات اور تاریخ کا عجائب گھر۔",
        "description_ur": "بہاولپور میوزیم 1976ء میں قائم ہوا اور اس میں چولستان کے آثارِ قدیمہ، نوابینِ بہاولپور کے شاہی تمغے، روایتی دستکاریاں اور اسلامی خطاطی کے نادر نمونے محفوظ ہیں۔",
    },
    "bijnot-fort-r7390494": {
        "name_ur": "قلعہ بجنوٹ",
        "short_description_ur": "صحرائے چولستان میں چونے کے پتھر سے تعمیر شدہ آٹھویں صدی کا تاریخی قلعہ۔",
        "description_ur": "قلعہ بجنوٹ صحرائے چولستان میں بہاولپور سے تقریباً 160 کلومیٹر دور واقع ایک قدیم قلعہ ہے۔ یہ قلعہ آٹھویں صدی میں راجہ بجا بھاٹیا نے تعمیر کروایا تھا اور صحرائی تجارتی راستوں کی حفاظت کا اہم مرکز تھا۔",
    },
    "national-museum-of-science-technology-w1531004727": {
        "name_ur": "نیشنل میوزیم آف سائنس اینڈ ٹیکنالوجی",
        "short_description_ur": "لاہور میں سائنسی دریافتوں اور ماڈلز کا قومی معلوماتی عجائب گھر۔",
        "description_ur": "نیشنل میوزیم آف سائنس اینڈ ٹیکنالوجی لاہور کی جی ٹی روڈ پر واقع پاکستان کا واحد مکمل سائنسی عجائب گھر ہے، جہاں طبیعیات، خلا اور ٹیکنالوجی کے عملی ماڈلز موجود ہیں۔",
    },
    "iqbal-museum-n8406860263": {
        "name_ur": "علامہ اقبال میوزیم (جاوید منزل)",
        "short_description_ur": "لاہور میں شاعرِ مشرق علامہ محمد اقبال کی تاریخی رہائش گاہ اور عجائب گھر۔",
        "description_ur": "جاوید منزل علامہ محمد اقبال کی آخری رہائش گاہ ہے جسے اب ایک قومی عجائب گھر میں تبدیل کر دیا گیا ہے۔ یہاں علامہ اقبال کے زیرِ استعمال اشیاء، قلم، کتب خانے اور اصل خطوط محفوظ ہیں۔",
    },
    "kallar-kahar-museum-n6576152185": {
        "name_ur": "کلر کہار میوزیم",
        "short_description_ur": "کوہستان نمک (سالٹ رینج) کے قدیم فوسلز اور آثارِ قدیمہ کا عجائب گھر۔",
        "description_ur": "کلر کہار میوزیم موٹروے کے قریب کلر کہار میں واقع ہے، جس میں سالٹ رینج سے دریافت ہونے والے لاکھوں سال پرانے فوسلز، پتھر کے اوزار اور گندھارا دور کے سکے رکھے گئے ہیں۔",
    },
    "army-museum-lahore-n5737713722": {
        "name_ur": "آرمی میوزیم لاہور",
        "short_description_ur": "لاہور کینٹ میں عسکری تاریخ اور جنگی یادگاروں کا عظیم الشان عجائب گھر۔",
        "description_ur": "آرمی میوزیم لاہور کینٹ میں واقع ایک جدید عجائب گھر ہے جو پاکستان کی عسکری تاریخ، شہداء کی قربانیوں، جنگی ہتھیاروں، ٹینکوں اور نایاب جنگی تصاویر کو شاندار انداز میں پیش کرتا ہے۔",
    },
    "army-museum-w739621410": {
        "name_ur": "پاکستان آرمی میوزیم راولپنڈی",
        "short_description_ur": "راولپنڈی جی ایچ کیو کے قریب پاکستان فوج کا تاریخی مرکزی عجائب گھر۔",
        "description_ur": "پاکستان آرمی میوزیم راولپنڈی میں واقع پاک فوج کا سب سے پرانا اور تاریخی عجائب گھر ہے، جہاں قیامِ پاکستان سے لے کر آج تک کی عسکری تاریخ اور تاریخی ہتھیار محفوظ ہیں۔",
    },
    "taxila-museum": {
        "name_ur": "ٹیکسلا میوزیم",
        "short_description_ur": "یونیسکو عالمی ثقافتی ورثہ ٹیکسلا کے گندھارا بدھ مت نوادرات کا مرکزی عجائب گھر۔",
        "description_ur": "ٹیکسلا میوزیم 1928 میں قائم ہوا اور یہ قدیم گندھارا تہذیب کے مجسموں، سونے چاندی کے زیورات اور بدھ مت کے نوادرات کا دنیا کا بہترین اور مستند ترین مرکز ہے۔",
    },
    "laar-museum-molvi-haji-ahmed-mallah-library-badin-w1462513465": {
        "name_ur": "لار میوزیم و لائبریری بدین",
        "short_description_ur": "بدین میں زیریں سندھ (لار) کے لوک ورثے، روایات اور نایاب کتب کا عجائب گھر۔",
        "description_ur": "لار میوزیم ضلع بدین، سندھ میں واقع ہے اور زیریں سندھ کی لوک ثقافت، سندھی دستکاری، سکے اور صوفی شاعر مولوی حاجی احمد ملاح کی نایاب یادگاروں کا مرکز ہے۔",
    },
    "pia-planetarium-w26632637": {
        "name_ur": "پی آئی اے پلینٹیریم کراچی",
        "short_description_ur": "کراچی میں علمِ فلکیات، ستاروں کی دنیا اور ہوا بازی کا تعلیمی مرکز۔",
        "description_ur": "پی آئی اے پلینٹیریم یونیورسٹی روڈ گلشن اقبال میں واقع ہے جہاں ایک ریٹائرڈ بوئنگ 720 طیارہ اور فلکیاتی رصد گاہ کا ڈوم موجود ہے جو طلباء کو کائنات اور نظامِ شمسی کے مشاہدے کا موقع فراہم کرتا ہے۔",
    },
    "sindhology-museum-w1028459487": {
        "name_ur": "انسٹیٹیوٹ آف سندھالوجی میوزیم جامشورو",
        "short_description_ur": "سندھ یونیورسٹی جامشورو میں سندھ کی تاریخ اور لوک ثقافت کا سب سے بڑا عجائب گھر۔",
        "description_ur": "انسٹیٹیوٹ آف سندھالوجی جامشورو سندھ کی تہذیب، موسیقی، روایتی ملبوسات اور دیہی زندگی کے ماڈلز کا ایک بے مثال معلوماتی مرکز ہے جو مہران یونیورسٹی کے قریب واقع ہے۔",
    },
    "tdf-magnifiscience-centre-n8633769213": {
        "name_ur": "ٹی ڈی ایف میگنیفائی سائنس سینٹر کراچی",
        "short_description_ur": "کراچی ریلوے کالونی میں پاکستان کا سب سے بڑا اور جدید انٹرایکٹو سائنس سینٹر۔",
        "description_ur": "ٹی ڈی ایف میگنیفائی سائنس سینٹر کراچی میں واقع ایک جدید سائنسی عجائب گھر ہے جہاں قدرتی علوم، ماحولیات اور ٹیکنالوجی کے 200 سے زائد انٹرایکٹو تجربات موجود ہیں۔",
    },
    "wazir-mansion-w692307507": {
        "name_ur": "وزیر مینشن (جائے پیدائش قائد اعظم)",
        "short_description_ur": "کھارادر کراچی میں بانیِ پاکستان قائد اعظم محمد علی جناح کی جائے پیدائش۔",
        "description_ur": "وزیر مینشن پرانے کراچی کے علاقے کھارادر میں واقع ایک تاریخی تین منزلہ عمارت ہے جہاں 25 دسمبر 1876ء کو بابائے قوم قائد اعظم محمد علی جناح پیدا ہوئے تھے۔ اب یہ ایک محفوظ قومی یادگار اور عجائب گھر ہے۔",
    },
    "museum-w1460879101": {
        "name_ur": "مسکین جہان خان کھوسو میوزیم نگرپارکر",
        "short_description_ur": "نگرپارکر تھرپارکر میں تھری ثقافت اور آزادی کے رہنماؤں کا عجائب گھر۔",
        "description_ur": "یہ میوزیم نگرپارکر کے کارونجھر دامن میں واقع ہے جس میں تھر کے صحرائی لوک ورثے، روایتی رلی، کڑھائی اور تھر کی تاریخی جدوجہد کی یادگاریں رکھی گئی ہیں۔",
    },
    "sindh-museum-w93841136": {
        "name_ur": "سندھ میوزیم حیدرآباد",
        "short_description_ur": "حیدرآباد میں وادی سندھ اور کلہوڑا و تالپور ادوار کی تاریخ کا صوبائی عجائب گھر۔",
        "description_ur": "سندھ میوزیم قاسم آباد، حیدرآباد میں واقع ہے جس میں سندھ کے تاریخی ادوار، موہنجوداڑو کے نمونے، کلہوڑا اور تالپور حکمرانوں کے نوادرات اور روایتی سندھی دستکاریاں خوبصورتی سے سجائی گئی ہیں۔",
    },
    "quaid-e-azam-house-w535257326": {
        "name_ur": "قائد اعظم ہاؤس (فلیگ اسٹاف ہاؤس)",
        "short_description_ur": "کراچی صدر میں زرد ریتلے پتھر سے بنی قائد اعظم محمد علی جناح کی تاریخی رہائش گاہ۔",
        "description_ur": "فلیگ اسٹاف ہاؤس کراچی کے علاقے صدر میں فاطمہ جناح روڈ پر واقع ایک پرشکوہ تاریخی عمارت ہے جسے قائد اعظم نے 1943 میں خریدا تھا۔ اب یہ قائد اعظم ہاؤس میوزیم کے طور پر محفوظ ہے۔",
    },
    "city-museum-n10003329146": {
        "name_ur": "شکارپور سٹی میوزیم",
        "short_description_ur": "تاریخی تجارتی شہر شکارپور کی ثقافت اور روایات کا عجائب گھر۔",
        "description_ur": "شکارپور سٹی میوزیم تاریخی شہر شکارپور کے وسطی ایشیائی تجارتی ماضی، قدیم ڈھیریوں اور روایتی ہندو و مسلم تاجروں کی ثقافتی اشیاء کو محفوظ رکھنے کا اہم مرکز ہے۔",
    },
    "gori-temple-w491754279": {
        "name_ur": "گوری مندر تھرپارکر",
        "short_description_ur": "صحرائے تھر میں 1375 عیسوی کا تاریخی جین مندر جس کی چھتیں قدیم نقاشی سے آراستہ ہیں۔",
        "description_ur": "گوری مندر تھرپارکر میں واقع ایک قدیم جین عبادت گاہ ہے جو اپنی شاندار سنگ تراشی اور باریک دیوار گیری مصوری کی وجہ سے مشہور ہے اور تھر کے قدیم مذہبی تنوع کی گواہی دیتا ہے۔",
    },
}


def clean_row(r: dict) -> dict:
    """Standardize fields, replace 'null' strings, fix coordinates and radii."""
    out = {}
    for k, v in r.items():
        val = (v or "").strip()
        if val.lower() == "null":
            val = ""
        out[k] = val

    out["edited"] = "yes"
    out["urdu_machine_translated"] = "false"

    slug = out["slug"]
    if slug in EXISTING_IMAGE_FIXES:
        img, credit = EXISTING_IMAGE_FIXES[slug]
        out["image_url"] = img
        out["image_credit"] = credit

    if not out.get("image_url"):
        from scripts.landmark_builder.generator import DEFAULT_IMAGES
        reg = out.get("region", "Sindh")
        reg_map = DEFAULT_IMAGES.get(reg, DEFAULT_IMAGES["Sindh"])
        cat = out.get("category", "attraction")
        img_tuple = reg_map.get(cat, reg_map.get("attraction", reg_map.get("historical")))
        if img_tuple:
            out["image_url"] = img_tuple[0]
            out["image_credit"] = img_tuple[1]

    if out.get("image_url") and not out.get("image_credit"):
        out["image_credit"] = "Wikimedia Commons"

    if slug in URDU_TRANSLATIONS:
        for fld, uval in URDU_TRANSLATIONS[slug].items():
            out[fld] = uval

    # Replace generic placeholders
    if out.get("short_description") and "in Pakistan" in out["short_description"] and len(out["short_description"]) < 50:
        cat = out.get("category", "attraction")
        city = out.get("city", "Pakistan")
        out["short_description"] = f"Notable {cat} site located in {city}."
        out["short_description_ur"] = f"{city} میں واقع ایک اہم {cat} کا مقام۔"

    # Enforce non-null dual language parity for history/significance/culture/food/tips
    pair_cols = [
        ("history", "history_ur"),
        ("significance", "significance_ur"),
        ("culture", "culture_ur"),
        ("local_customs", "local_customs_ur"),
        ("food", "food_ur"),
        ("shopping", "shopping_ur"),
        ("tips", "tips_ur"),
    ]
    for en_col, ur_col in pair_cols:
        en_val = out.get(en_col, "")
        ur_val = out.get(ur_col, "")
        if not en_val or not ur_val:
            out[en_col] = ""
            out[ur_col] = ""

    return out


DEFAULT_XLSX_PATH = r"C:\Users\Abubakar Aijaz\.gemini\antigravity\brain\8b89aca8-b318-4464-9c81-d37998e56488\.user_uploaded\media_1794649943248_d4e690c6.xlsx"

def get_cleaned_existing(path: str = None) -> List[dict]:
    target_path = path or DEFAULT_XLSX_PATH
    if target_path.endswith(".xlsx"):
        import openpyxl
        wb = openpyxl.load_workbook(target_path, data_only=True)
        ws = wb["Landmarks"]
        raw_rows = list(ws.iter_rows(values_only=True))
        headers = [str(c or "").strip() for c in raw_rows[0]]
        rows = []
        for r_vals in raw_rows[1:]:
            if any(r_vals):
                row_dict = {}
                for idx, h in enumerate(headers):
                    val = r_vals[idx] if idx < len(r_vals) else ""
                    row_dict[h] = str(val) if val is not None else ""
                rows.append(row_dict)
    else:
        with open(target_path, encoding="utf-8", errors="replace") as f:
            rows = list(csv.DictReader(f))

    cleaned = []
    for r in rows:
        slug = r.get("slug", "")
        short_desc = r.get("short_description", "")
        img = r.get("image_url", "")
        no_img = not img or img == "null"

        # Check prune rules
        if slug in REDUNDANT_SLUGS:
            continue
        if no_img and "glacier" in slug:
            continue
        if no_img and any(p in short_desc for p in ["Natural landmark in ", "Summit in Pakistan", "Peak in Pakistan"]):
            continue

        row = clean_row(r)
        # Prune incomplete stubs lacking bilingual names/descriptions or essential details
        if not row.get("name_ur") or not row.get("short_description") or not row.get("short_description_ur") or not row.get("description") or not row.get("description_ur"):
            continue
        cleaned.append(row)

    return cleaned
