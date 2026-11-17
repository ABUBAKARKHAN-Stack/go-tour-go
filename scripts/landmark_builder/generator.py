"""Main Landmark Generator for GoTourGo.

Generates 1,100+ new verified landmarks with primary focus on Sindh (550+ total)
and Karachi (220+ total), as well as Punjab, KP, Balochistan, GB, AJK, and ICT.
"""

from __future__ import annotations

import csv
import json
import os
import re
from typing import Dict, List, Tuple

from scripts.landmark_builder.catalog_sindh import SINDH_ADDITIONS
from scripts.landmark_builder.data_karachi import KARACHI_LANDMARKS
from scripts.landmark_builder.enricher import get_cleaned_existing
from scripts.landmark_builder.validator import validate_row

# Curated Wikimedia image map for consistent, high-res photos & credits
DEFAULT_IMAGES = {
    "Sindh": {
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/View_of_Makli_by_Usman_Ghani_%28cropped%29.jpg/1280px-View_of_Makli_by_Usman_Ghani_%28cropped%29.jpg",
            "Usman.pg / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/PK_Thatta_asv2020-02_img01_Shah_Jahan_Mosque.jpg/1280px-PK_Thatta_asv2020-02_img01_Shah_Jahan_Mosque.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/PK_Keenjhar_Lake_near_Thatta_asv2020-02_img1.jpg/1280px-PK_Keenjhar_Lake_near_Thatta_asv2020-02_img1.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Karoonjhar_Mountains.jpg/1280px-Karoonjhar_Mountains.jpg",
            "Mjakhro / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/PK_Karachi_asv2020-02_img08_Bagh_Ibne_Qasim.jpg/1280px-PK_Karachi_asv2020-02_img08_Bagh_Ibne_Qasim.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Hill_Park_02%2C_Karachi%2C_Pakistan.jpg/1280px-Hill_Park_02%2C_Karachi%2C_Pakistan.jpg",
            "Adnanrail / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/PK_Karachi_asv2020-02_img36_Empress_Market.jpg/1280px-PK_Karachi_asv2020-02_img36_Empress_Market.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/PK_Karachi_asv2020-02_img36_Empress_Market.jpg/1280px-PK_Karachi_asv2020-02_img36_Empress_Market.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/PK_Karachi_asv2020-02_img32_National_Museum.jpg/1280px-PK_Karachi_asv2020-02_img32_National_Museum.jpg",
            "A.Savin / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Manora_Beach%2C_Karachi_Pakistan.jpg/1280px-Manora_Beach%2C_Karachi_Pakistan.jpg",
            "AleenaBinyameen / Wikimedia Commons"
        )
    },
    "Punjab": {
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Lahore_Fort_view_from_Baradari.jpg/1280px-Lahore_Fort_view_from_Baradari.jpg",
            "Rohaan Bhatti / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Badshahi_Mosque_July_1_2005_pic32_by_Ali_Imran_%281%29.jpg/1280px-Badshahi_Mosque_July_1_2005_pic32_by_Ali_Imran_%281%29.jpg",
            "Ali Imran / Wikimedia Commons"
        ),
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Kallar_Kahar_Lake_in_Autumn.jpg/1280px-Kallar_Kahar_Lake_in_Autumn.jpg",
            "Asadaslam7 / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/A_Pakistani_Gate.jpg/1280px-A_Pakistani_Gate.jpg",
            "Khalid Mahmood / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Minar_e_Pakistan.jpg/1280px-Minar_e_Pakistan.jpg",
            "Irfan0552007 / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Hayat_Baksh_%28Bestower_of_life%29_terrace_-_Shalimar_Gardens.jpg/1280px-Hayat_Baksh_%28Bestower_of_life%29_terrace_-_Shalimar_Gardens.jpg",
            "Muhammad Ashar / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Badshahi_Mosque_July_1_2005_pic32_by_Ali_Imran_%281%29.jpg/1280px-Badshahi_Mosque_July_1_2005_pic32_by_Ali_Imran_%281%29.jpg",
            "Ali Imran / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Tomb_of_Anar_Kali_Lahore.jpg/1280px-Tomb_of_Anar_Kali_Lahore.jpg",
            "Junaidahmadj / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Taxila_Museum_Front.JPG/1280px-Taxila_Museum_Front.JPG",
            "Muhammad Ashar / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Faisal_Masjid_seen_from_Margalla_Hills.jpg/1280px-Faisal_Masjid_seen_from_Margalla_Hills.jpg",
            "Obaid747 / Wikimedia Commons"
        )
    },
    "Khyber Pakhtunkhwa": {
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Takht-e-bahi.jpg/1280px-Takht-e-bahi.jpg",
            "Asif Nawaz / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/MKmosque.jpg/1280px-MKmosque.jpg",
            "US Embassy Pakistan / Wikimedia Commons"
        ),
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Saiful_muluk_during_June.JPG/1280px-Saiful_muluk_during_June.JPG",
            "Almazi / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Cultural_center_%22Kalasha_Dur%22_in_Brun_in_the_valley_of_Mumuret_%28Bumburet%29.jpg/1280px-Cultural_center_%22Kalasha_Dur%22_in_Brun_in_the_valley_of_Mumuret_%28Bumburet%29.jpg",
            "Martin Jung / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/KhyberPassPakistan.jpg/1280px-KhyberPassPakistan.jpg",
            "James Mollison / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Ayubia_National_Park_-_a_view_of_hills_and_trees_in_daylight.jpg/1280px-Ayubia_National_Park_-_a_view_of_hills_and_trees_in_daylight.jpg",
            "Sbutt76 / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/MKmosque.jpg/1280px-MKmosque.jpg",
            "US Embassy Pakistan / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Sethi_House_Peshawar.jpg/1280px-Sethi_House_Peshawar.jpg",
            "Tahir8088 / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Peshawar_Museum_exterior.jpg/1280px-Peshawar_Museum_exterior.jpg",
            "Muhammad Zahir / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Shandur_Top_%26_Shandur_Lake.jpg/1280px-Shandur_Top_%26_Shandur_Lake.jpg",
            "Mudassir Ahmed / Wikimedia Commons"
        )
    },
    "Balochistan": {
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg/1280px-Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg",
            "Furqanlw / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pakistan_Natural_Sphinx%2C_Balochistan_-_%281%29.jpg/1280px-Pakistan_Natural_Sphinx%2C_Balochistan_-_%281%29.jpg",
            "Bilal Mirza / Wikimedia Commons"
        ),
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg/1280px-Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg",
            "SpidErxD / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Nani_ki_Mandir2.jpg/1280px-Nani_ki_Mandir2.jpg",
            "Bilal Mirza / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Mehrgarh_pakistan_rel96.JPG/1280px-Mehrgarh_pakistan_rel96.JPG",
            "Fowler&fowler / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg/1280px-Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg",
            "Furqanlw / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg/1280px-Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg",
            "SpidErxD / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg/1280px-Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg",
            "SpidErxD / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg/1280px-Princes_of_Hope%2C_Hingol_National_Park%2C_Pakistan.jpg",
            "Furqanlw / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg/1280px-Quaid_e_Azam_Residency%2C_Ziarat%2CPakistan.jpg",
            "SpidErxD / Wikimedia Commons"
        )
    },
    "Gilgit-Baltistan": {
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Baltit_fort_Karimabad_Hunza.jpg/1280px-Baltit_fort_Karimabad_Hunza.jpg",
            "Jamalhunzokuz / Wikimedia Commons"
        ),
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Landslide_Lake_in_Northwest_Pakistan.jpg/1280px-Landslide_Lake_in_Northwest_Pakistan.jpg",
            "Jesse Allen / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Bridge_near_passu.JPG/1280px-Bridge_near_passu.JPG",
            "Sultanalipassu / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Side_view_of_Chaqchan_Mosque.jpg/1280px-Side_view_of_Chaqchan_Mosque.jpg",
            "Muhammad Ashar / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg/1280px-Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg",
            "M.Ahmad Hussnain / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg/1280px-Hussaini_Bridge_in_Gilgit%2C_Pakistan.jpg",
            "M.Ahmad Hussnain / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/The_Land_of_Giants%2C_Deosai.jpg/1280px-The_Land_of_Giants%2C_Deosai.jpg",
            "Qammer Wazir / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Khaplu_Fort%21.jpg/1280px-Khaplu_Fort%21.jpg",
            "Qammer Wazir / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Baltit_fort_Karimabad_Hunza.jpg/1280px-Baltit_fort_Karimabad_Hunza.jpg",
            "Jamalhunzokuz / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Baltit_fort_Karimabad_Hunza.jpg/1280px-Baltit_fort_Karimabad_Hunza.jpg",
            "Jamalhunzokuz / Wikimedia Commons"
        )
    },
    "Azad Kashmir": {
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Chitta_Kattha_Lake.JPG/1280px-Chitta_Kattha_Lake.JPG",
            "Shahzad.rk / Wikimedia Commons"
        ),
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg/1280px-Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg",
            "Umar Jamshaid / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ramkot_Fort_view.jpg/1280px-Ramkot_Fort_view.jpg",
            "Muhammad umair wazir / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg/1280px-Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg",
            "Umar Jamshaid / Wikimedia Commons"
        ),
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg/1280px-Sharda_Fort%2C_Azad_Jammu_%26_Kashmir.jpg",
            "Umar Jamshaid / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Banjosa%2C_AJK.JPG/1280px-Banjosa%2C_AJK.JPG",
            "Amjadmoughal / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Banjosa%2C_AJK.JPG/1280px-Banjosa%2C_AJK.JPG",
            "Amjadmoughal / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Ramkot_Fort_view.jpg/1280px-Ramkot_Fort_view.jpg",
            "Muhammad umair wazir / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Banjosa%2C_AJK.JPG/1280px-Banjosa%2C_AJK.JPG",
            "Amjadmoughal / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Banjosa%2C_AJK.JPG/1280px-Banjosa%2C_AJK.JPG",
            "Amjadmoughal / Wikimedia Commons"
        )
    },
    "Islamabad Capital Territory": {
        "religious": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg/1280px-Ali_Mujtaba_WLM2015_FAISAL_MOSQUE_m_10.jpg",
            "Ali Mujtaba / Wikimedia Commons"
        ),
        "cultural": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Blue_Hour_at_Pakistan_Monument.jpg/1280px-Blue_Hour_at_Pakistan_Monument.jpg",
            "Muhammad Ashar / Wikimedia Commons"
        ),
        "nature": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Faisal_Masjid_seen_from_Margalla_Hills.jpg/1280px-Faisal_Masjid_seen_from_Margalla_Hills.jpg",
            "Obaid747 / Wikimedia Commons"
        ),
        "historical": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Rawat_Fort.JPG/1280px-Rawat_Fort.JPG",
            "Khalid Mahmood / Wikimedia Commons"
        ),
        "park": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Islamabad_F9_Park_%283875031085%29.jpg/1280px-Islamabad_F9_Park_%283875031085%29.jpg",
            "Ahmed Sajjad Zaidi / Wikimedia Commons"
        ),
        "attraction": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Lake_View_Park_Islamabad_Entrance_2.jpg/1280px-Lake_View_Park_Islamabad_Entrance_2.jpg",
            "Syed Fahad Wasti / Wikimedia Commons"
        ),
        "viewpoint": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Faisal_Masjid_seen_from_Margalla_Hills.jpg/1280px-Faisal_Masjid_seen_from_Margalla_Hills.jpg",
            "Obaid747 / Wikimedia Commons"
        ),
        "museum": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/A_Pakistani_Gate.jpg/1280px-A_Pakistani_Gate.jpg",
            "Khalid Mahmood / Wikimedia Commons"
        ),
        "food": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Blue_Hour_at_Pakistan_Monument.jpg/1280px-Blue_Hour_at_Pakistan_Monument.jpg",
            "Muhammad Ashar / Wikimedia Commons"
        ),
        "shopping": (
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/A_Pakistani_Gate.jpg/1280px-A_Pakistani_Gate.jpg",
            "Khalid Mahmood / Wikimedia Commons"
        )
    }
}


def make_clean_record(
    slug: str,
    name: str,
    name_ur: str,
    category: str,
    city: str,
    region: str,
    lat: float,
    lon: float,
    radius: int,
    short_en: str,
    short_ur: str,
    desc_en: str,
    desc_ur: str,
    history_en: str = "",
    history_ur: str = "",
    sig_en: str = "",
    sig_ur: str = "",
    cul_en: str = "",
    cul_ur: str = "",
    food_en: str = "",
    food_ur: str = "",
    tips_en: str = "",
    tips_ur: str = "",
    hours: str = "",
    fee: str = "",
    best_time: str = "",
    image_url: str = "",
    image_credit: str = "",
    wikipedia_url: str = ""
) -> dict:
    """Construct a fully-paired, schema-compliant landmark row."""
    # Lookup default fallback image if empty
    if not image_url:
        reg_map = DEFAULT_IMAGES.get(region, DEFAULT_IMAGES["Sindh"])
        img_tuple = reg_map.get(category, reg_map.get("historical"))
        image_url, image_credit = img_tuple

    # Enforce pair invariants
    if bool(history_en) != bool(history_ur):
        history_en, history_ur = "", ""
    if bool(sig_en) != bool(sig_ur):
        sig_en, sig_ur = "", ""
    if bool(cul_en) != bool(cul_ur):
        cul_en, cul_ur = "", ""
    if bool(food_en) != bool(food_ur):
        food_en, food_ur = "", ""
    if bool(tips_en) != bool(tips_ur):
        tips_en, tips_ur = "", ""

    return {
        "edited": "yes",
        "slug": slug.strip().lower(),
        "name": name.strip(),
        "name_ur": name_ur.strip(),
        "category": category.strip().lower(),
        "city": city.strip(),
        "region": region.strip(),
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "radius_m": int(radius),
        "short_description": short_en.strip(),
        "short_description_ur": short_ur.strip(),
        "description": desc_en.strip(),
        "description_ur": desc_ur.strip(),
        "history": history_en.strip(),
        "history_ur": history_ur.strip(),
        "significance": sig_en.strip(),
        "significance_ur": sig_ur.strip(),
        "culture": cul_en.strip(),
        "culture_ur": cul_ur.strip(),
        "local_customs": "",
        "local_customs_ur": "",
        "food": food_en.strip(),
        "food_ur": food_ur.strip(),
        "shopping": "",
        "shopping_ur": "",
        "tips": tips_en.strip(),
        "tips_ur": tips_ur.strip(),
        "opening_hours": hours.strip(),
        "entry_fee": fee.strip(),
        "best_time": best_time.strip(),
        "image_url": image_url.strip(),
        "image_credit": image_credit.strip(),
        "wikipedia_url": wikipedia_url.strip(),
        "urdu_machine_translated": "false",
    }
