#!/usr/bin/env python3
"""
ComEd service territory ZIP codes.

ComEd publishes an official spreadsheet of all accounts by premise ZIP code:
https://www.comed.com/SiteCollectionDocuments/ComEdAccountsbyPremiseZipCode.xls

This module provides:
  1. A hardcoded fallback list of known ComEd ZIP codes (Chicago metro area)
  2. A downloader that fetches and parses the official ComEd XLS file for
     the complete, authoritative list
  3. A loader that uses the downloaded file if available, else the fallback

Usage:
    # Download the official ZIP code list (saves to data/comed_zipcodes.json)
    python comed_zipcodes.py --download

    # Just print the ZIP codes
    python comed_zipcodes.py --print
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

log = logging.getLogger("comed_zipcodes")

DATA_DIR = Path(__file__).parent / "data"
ZIPCODES_JSON = DATA_DIR / "comed_zipcodes.json"
COMED_XLS_URL = "https://www.comed.com/SiteCollectionDocuments/ComEdAccountsbyPremiseZipCode.xls"

# Hardcoded fallback: well-known ZIP code prefixes in ComEd territory.
# These cover the major areas but may not be exhaustive.
# The official XLS file is the authoritative source.
FALLBACK_ZIP_PREFIXES = [
    "600",  # North/northwest suburbs
    "601",  # North-central IL (LaSalle, Peru, Ottawa, Streator)
    "604",  # West suburbs (Aurora, Naperville, Wheaton)
    "605",  # South/southwest suburbs (Joliet, Bolingbrook)
    "606",  # Chicago proper
    "610",  # Western territory (Sterling, Rock Falls, Dixon)
    "611",  # Far northwest (Rockford, Freeport, Galena)
    "609",  # Kankakee area
]

# Comprehensive fallback list of known ComEd ZIP codes.
# Generated from publicly available ComEd service territory data.
FALLBACK_ZIPCODES = sorted([
    # 606xx - Chicago
    "60601", "60602", "60603", "60604", "60605", "60606", "60607", "60608",
    "60609", "60610", "60611", "60612", "60613", "60614", "60615", "60616",
    "60617", "60618", "60619", "60620", "60621", "60622", "60623", "60624",
    "60625", "60626", "60627", "60628", "60629", "60630", "60631", "60632",
    "60633", "60634", "60636", "60637", "60638", "60639", "60640", "60641",
    "60642", "60643", "60644", "60645", "60646", "60647", "60649", "60651",
    "60652", "60653", "60654", "60655", "60656", "60657", "60659", "60660",
    "60661", "60707",

    # 600xx - North/northwest suburbs
    "60002", "60004", "60005", "60006", "60007", "60008", "60009", "60010",
    "60011", "60012", "60013", "60014", "60015", "60016", "60017", "60018",
    "60019", "60020", "60021", "60022", "60025", "60026", "60029", "60030",
    "60031", "60033", "60034", "60035", "60037", "60038", "60039", "60040",
    "60041", "60042", "60043", "60044", "60045", "60046", "60047", "60048",
    "60049", "60050", "60051", "60053", "60055", "60056", "60060", "60061",
    "60062", "60064", "60067", "60068", "60069", "60070", "60071", "60072",
    "60073", "60074", "60075", "60076", "60077", "60078", "60079", "60081",
    "60082", "60083", "60084", "60085", "60086", "60087", "60088", "60089",
    "60090", "60091", "60093", "60094", "60095", "60096", "60097", "60098",
    "60099",

    # 601xx - North-central IL
    "60101", "60102", "60103", "60104", "60105", "60106", "60107", "60108",
    "60110", "60111", "60112", "60113", "60115", "60118", "60119", "60120",
    "60121", "60122", "60123", "60124", "60126", "60128", "60129", "60130",
    "60131", "60132", "60133", "60134", "60135", "60136", "60137", "60138",
    "60139", "60140", "60141", "60142", "60143", "60144", "60145", "60146",
    "60147", "60148", "60150", "60151", "60152", "60153", "60154", "60155",
    "60156", "60157", "60159", "60160", "60161", "60162", "60163", "60164",
    "60165", "60168", "60169", "60171", "60172", "60173", "60174", "60175",
    "60176", "60177", "60178", "60179", "60180", "60181", "60184", "60185",
    "60186", "60187", "60188", "60189", "60190", "60191", "60192", "60193",
    "60194", "60195",

    # 604xx - Western suburbs
    "60401", "60402", "60403", "60404", "60406", "60407", "60408", "60409",
    "60410", "60411", "60415", "60416", "60417", "60419", "60420", "60421",
    "60422", "60423", "60424", "60425", "60426", "60428", "60429", "60430",
    "60431", "60432", "60433", "60434", "60435", "60436", "60437", "60438",
    "60439", "60440", "60441", "60442", "60443", "60444", "60445", "60446",
    "60447", "60448", "60449", "60450", "60451", "60452", "60453", "60455",
    "60456", "60457", "60458", "60459", "60460", "60461", "60462", "60463",
    "60464", "60465", "60466", "60467", "60468", "60469", "60471", "60472",
    "60473", "60474", "60475", "60476", "60477", "60478", "60480", "60481",
    "60482", "60484", "60487", "60490", "60491",

    # 605xx - South suburbs / Will County
    "60501", "60502", "60503", "60504", "60505", "60506", "60510", "60511",
    "60512", "60513", "60514", "60515", "60516", "60517", "60518", "60519",
    "60520", "60521", "60522", "60523", "60525", "60526", "60527", "60530",
    "60531", "60532", "60534", "60536", "60538", "60539", "60540", "60541",
    "60542", "60543", "60544", "60545", "60546", "60548", "60550", "60551",
    "60552", "60553", "60554", "60555", "60556", "60557", "60558", "60559",
    "60560", "60561", "60563", "60564", "60565",

    # 609xx - Kankakee area
    "60901", "60911", "60912", "60913", "60914", "60915", "60917", "60919",
    "60921", "60922", "60924", "60926", "60927", "60929", "60930", "60931",
    "60932", "60933", "60934", "60935", "60936", "60938", "60940", "60941",
    "60942", "60944", "60945", "60946", "60948", "60949", "60950", "60951",
    "60952", "60953", "60954", "60955", "60957", "60958", "60959", "60960",
    "60961", "60962", "60963", "60964", "60966", "60967", "60968", "60969",
    "60970",

    # 610xx - Western IL (Sterling, Dixon, Rock Falls)
    "61006", "61007", "61008", "61010", "61011", "61012", "61013", "61014",
    "61015", "61016", "61019", "61020", "61021", "61024", "61025", "61028",
    "61030", "61031", "61032", "61036", "61038", "61039", "61041", "61042",
    "61043", "61044", "61046", "61047", "61048", "61049", "61050", "61051",
    "61052", "61053", "61054", "61057", "61059", "61060", "61061", "61062",
    "61063", "61064", "61065", "61067", "61068", "61070", "61071", "61072",
    "61073", "61074", "61075", "61078", "61079", "61080", "61081", "61084",
    "61085", "61087", "61088", "61089",

    # 611xx - Rockford area
    "61101", "61102", "61103", "61104", "61105", "61106", "61107", "61108",
    "61109", "61110", "61111", "61112", "61114", "61115",

    # 613xx - LaSalle/Bureau/Putnam
    "61301", "61310", "61311", "61312", "61313", "61314", "61315", "61316",
    "61317", "61318", "61319", "61320", "61321", "61322", "61323", "61324",
    "61325", "61326", "61327", "61328", "61329", "61330", "61331", "61332",
    "61333", "61334", "61335", "61336", "61337", "61338", "61340", "61341",
    "61342", "61344", "61345", "61346", "61348", "61349", "61350", "61354",
    "61356", "61358", "61360", "61361", "61362", "61363", "61364", "61367",
    "61368", "61369", "61370", "61371", "61372", "61373", "61374", "61375",
    "61376", "61377", "61378", "61379",

    # 617xx - Livingston/Pontiac area
    "61701", "61704", "61720", "61721", "61722", "61724", "61725", "61726",
    "61727", "61728", "61729", "61730", "61731", "61732", "61733", "61734",
    "61736", "61737", "61738", "61739", "61740", "61741", "61742", "61743",
    "61744", "61745", "61747", "61748", "61749", "61750", "61751", "61752",
    "61753", "61754", "61755", "61759", "61760", "61761", "61764", "61769",
    "61770", "61771", "61772", "61773", "61774", "61775", "61776", "61777",
    "61778",
])


def download_comed_zipcodes():
    """
    Download and parse ComEd's official ZIP code spreadsheet.
    Returns a sorted list of unique ZIP codes.
    """
    try:
        import requests
    except ImportError:
        log.error("requests library required: pip install requests")
        return None

    log.info("Downloading ComEd ZIP code file from %s ...", COMED_XLS_URL)
    try:
        r = requests.get(COMED_XLS_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        log.error("Failed to download: %s", e)
        return None

    # Try to parse XLS with openpyxl or xlrd
    zipcodes = set()

    try:
        import xlrd
        workbook = xlrd.open_workbook(file_contents=r.content)
        sheet = workbook.sheet_by_index(0)
        for row_idx in range(sheet.nrows):
            for col_idx in range(sheet.ncols):
                cell = sheet.cell_value(row_idx, col_idx)
                cell_str = str(cell).strip()
                # Match 5-digit ZIP codes starting with 6 (Illinois)
                if len(cell_str) == 5 and cell_str.startswith("6") and cell_str.isdigit():
                    zipcodes.add(cell_str)
                # Handle float ZIPs like 60601.0
                elif isinstance(cell, float):
                    int_val = str(int(cell))
                    if len(int_val) == 5 and int_val.startswith("6"):
                        zipcodes.add(int_val)
        log.info("Parsed %d ZIP codes from XLS (xlrd)", len(zipcodes))
    except ImportError:
        log.warning("xlrd not installed. Trying regex fallback on raw content...")
        import re
        # Try to extract ZIP codes from raw bytes
        text = r.content.decode("latin-1", errors="ignore")
        for match in re.finditer(r'\b(6\d{4})\b', text):
            zipcodes.add(match.group(1))
        log.info("Extracted %d potential ZIP codes via regex", len(zipcodes))

    if not zipcodes:
        log.warning("No ZIP codes found in download. Using fallback list.")
        return None

    result = sorted(zipcodes)

    # Save to JSON
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(ZIPCODES_JSON, "w") as f:
        json.dump({"source": COMED_XLS_URL, "count": len(result), "zipcodes": result}, f, indent=2)
    log.info("Saved %d ZIP codes to %s", len(result), ZIPCODES_JSON)

    return result


def load_comed_zipcodes():
    """
    Load ComEd ZIP codes. Tries the downloaded JSON first, falls back to hardcoded list.
    Returns a sorted list of ZIP code strings.
    """
    if ZIPCODES_JSON.exists():
        with open(ZIPCODES_JSON) as f:
            data = json.load(f)
        zips = data.get("zipcodes", [])
        if zips:
            log.info("Loaded %d ZIP codes from %s", len(zips), ZIPCODES_JSON)
            return zips

    log.info("Using fallback ZIP code list (%d codes)", len(FALLBACK_ZIPCODES))
    return FALLBACK_ZIPCODES


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="ComEd ZIP code utility")
    parser.add_argument("--download", action="store_true",
                        help="Download official ComEd ZIP code spreadsheet")
    parser.add_argument("--print", action="store_true", dest="print_zips",
                        help="Print all ZIP codes")
    parser.add_argument("--prefix", type=str, default=None,
                        help="Filter by prefix (e.g. '606' for Chicago)")
    args = parser.parse_args()

    if args.download:
        result = download_comed_zipcodes()
        if not result:
            log.info("Download failed or no data. Install xlrd for best results: pip install xlrd")
            sys.exit(1)
    elif args.print_zips:
        zips = load_comed_zipcodes()
        if args.prefix:
            zips = [z for z in zips if z.startswith(args.prefix)]
        for z in zips:
            print(z)
        print(f"\nTotal: {len(zips)} ZIP codes")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
