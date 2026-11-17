# GoTourGo Pakistan Landmarks Catalog (1,500 Expansion)

## Executive Summary

- **Total Clean Landmarks**: `1525`
- **Total in Sindh**: `552` (36.2% of catalog)
- **Karachi Focus**: `245` landmarks in Karachi (44.4% of Sindh)
- **Bilingual Parity**: 100% of rows have verified Urdu and English names, descriptions, and paired metadata.
- **Image Coverage**: 100% verified Wikimedia Commons high-resolution photos with proper attribution.
- **Redundancy Cleansing**: 14 internal sub-feature duplicates and 87 nameless glacier/peak stubs removed from original sheet.
- **Status Field**: `edited = 'yes'` set on all rows.

## Regional Distribution

| Region | Landmark Count | Percentage |
| :--- | :--- | :--- |
| **Sindh** | 552 | 36.2% |
| **Punjab** | 336 | 22.0% |
| **Khyber Pakhtunkhwa** | 198 | 13.0% |
| **Gilgit-Baltistan** | 183 | 12.0% |
| **Balochistan** | 149 | 9.8% |
| **Azad Kashmir** | 63 | 4.1% |
| **Islamabad Capital Territory** | 44 | 2.9% |
| **Total** | **1525** | **100.0%** |

## Category Breakdown

| Category | Landmark Count | Percentage |
| :--- | :--- | :--- |
| `nature` | 470 | 30.8% |
| `historical` | 360 | 23.6% |
| `religious` | 158 | 10.4% |
| `cultural` | 99 | 6.5% |
| `shopping` | 95 | 6.2% |
| `attraction` | 79 | 5.2% |
| `viewpoint` | 74 | 4.9% |
| `park` | 73 | 4.8% |
| `museum` | 66 | 4.3% |
| `food` | 51 | 3.3% |

## Sindh & Karachi Highlights

The catalog heavily prioritizes **Sindh** (552 landmarks) and **Karachi** (245 landmarks) across:

1. **Karachi Heritage & Architecture**: Frere Hall, Empress Market, Mohatta Palace, Flagstaff House, St. Patrick's Cathedral, Denso Hall, Wazir Mansion, Merewether Clock Tower, Hindu Gymkhana, Karachi Port Trust Building.
2. **Karachi Coast & Marine**: Clifton Beach, Sea View, Manora Island & Lighthouse, Sandspit Turtle Beach, Hawksbay, French Beach, Cape Monze, Paradise Point, Mubarak Village, Oyster Rocks.
3. **Karachi Culture & Culinary**: Burns Road Food Street, Boat Basin, Port Grand, Empress Market Spices, Bohri Bazaar, Kharadar, Hussainabad Food Street, Karachi Zoo, Pakistan Maritime Museum.
4. **Thatta & Lower Sindh**: Makli Necropolis (UNESCO), Shah Jahan Mosque, Keenjhar Lake (Noori Jam Tamachi), Banbhore (Debal Port), Kalan Kot Fort, Haleji Lake Bird Sanctuary.
5. **Hyderabad & Central Sindh**: Pacco Qillo, Kot Diji Fort, Tombs of Talpur Mirs, Resham Gali, Bombay Bakery, Rani Bagh, Badin shrines, Shah Abdul Latif Bhittai Shrine (Bhit Shah).
6. **Larkana, Sukkur & Indus**: Mohenjo-Daro (UNESCO), Sukkur Barrage, Lansdowne Bridge, Sadh Belo Island Temple, Kot Diji Citadel, Rohri shrines, Aror Rock, Faiz Mahal Khairpur.
7. **Tharparkar & Desert**: Karoonjhar Mountains (Nagarparkar), Gori Jain Temple, Marvi's Well (Bhalwa), Naukot Fort (Gateway to Thar), Mithi viewpoint, Islamkot.

## Deliverables & File Locations

- **Excel Spreadsheet**: `docs/landmarks-import/GoTourGo-Landmarks-1500.xlsx` (Preserves 'How to fill' tab, populates 'Landmarks' with all 35 columns, `edited = 'yes'`)
- **Supabase-Ready CSV**: `docs/landmarks-import/landmarks-1500-final.csv` (UTF-8 BOM encoding for direct import)
- **Audit & Plan**: `docs/landmarks-import/sindh-karachi-summary.md`
