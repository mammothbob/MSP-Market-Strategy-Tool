"""
ComEd (Commonwealth Edison) service territory definitions.

ComEd serves approximately 4 million customers across northern Illinois,
covering roughly 11,400 square miles. Their territory spans from the
Wisconsin border south to Kankakee/Grundy counties, and from the
Indiana border west to the DeKalb/LaSalle area.

Sources:
- ComEd service territory map: https://www.comed.com
- ICC Exhibit 2: ComEd Service Territory Map
- HIFLD Utility Boundaries dataset
"""

# Counties fully or substantially within ComEd's service territory
COMED_COUNTIES = [
    "Cook",
    "DuPage",
    "Kane",
    "Lake",
    "Will",
    "McHenry",
    "Kendall",
    "Grundy",
    "DeKalb",
    "Boone",
    "Winnebago",
    "Ogle",
    "Lee",
    "LaSalle",
    "Kankakee",
    "Iroquois",
    "Ford",
    "Livingston",
    "Woodford",
    "Marshall",
    "Putnam",
    "Bureau",
    "Whiteside",
    "Carroll",
    "Jo Daviess",
    "Stephenson",
]

# Major cities and suburbs in ComEd territory, organized by region.
# These are used as search locations for LoopNet queries.
COMED_CITIES = {
    # Chicago proper
    "chicago": "Chicago, IL",

    # Cook County suburbs - North
    "evanston": "Evanston, IL",
    "skokie": "Skokie, IL",
    "des-plaines": "Des Plaines, IL",
    "park-ridge": "Park Ridge, IL",
    "niles": "Niles, IL",
    "morton-grove": "Morton Grove, IL",
    "wilmette": "Wilmette, IL",
    "glenview": "Glenview, IL",
    "northbrook": "Northbrook, IL",

    # Cook County suburbs - West
    "oak-park": "Oak Park, IL",
    "cicero": "Cicero, IL",
    "berwyn": "Berwyn, IL",
    "maywood": "Maywood, IL",
    "melrose-park": "Melrose Park, IL",
    "bellwood": "Bellwood, IL",
    "elmhurst": "Elmhurst, IL",
    "franklin-park": "Franklin Park, IL",
    "river-grove": "River Grove, IL",
    "broadview": "Broadview, IL",
    "hillside": "Hillside, IL",
    "westchester": "Westchester, IL",
    "la-grange": "La Grange, IL",
    "brookfield": "Brookfield, IL",

    # Cook County suburbs - South
    "oak-lawn": "Oak Lawn, IL",
    "orland-park": "Orland Park, IL",
    "tinley-park": "Tinley Park, IL",
    "harvey": "Harvey, IL",
    "calumet-city": "Calumet City, IL",
    "lansing": "Lansing, IL",
    "homewood": "Homewood, IL",
    "dolton": "Dolton, IL",
    "blue-island": "Blue Island, IL",
    "alsip": "Alsip, IL",
    "evergreen-park": "Evergreen Park, IL",
    "chicago-heights": "Chicago Heights, IL",
    "park-forest": "Park Forest, IL",

    # Cook County suburbs - Northwest
    "arlington-heights": "Arlington Heights, IL",
    "schaumburg": "Schaumburg, IL",
    "palatine": "Palatine, IL",
    "mount-prospect": "Mount Prospect, IL",
    "rolling-meadows": "Rolling Meadows, IL",
    "hoffman-estates": "Hoffman Estates, IL",
    "elk-grove-village": "Elk Grove Village, IL",
    "streamwood": "Streamwood, IL",
    "hanover-park": "Hanover Park, IL",
    "buffalo-grove": "Buffalo Grove, IL",

    # DuPage County
    "naperville": "Naperville, IL",
    "wheaton": "Wheaton, IL",
    "downers-grove": "Downers Grove, IL",
    "lombard": "Lombard, IL",
    "addison": "Addison, IL",
    "glen-ellyn": "Glen Ellyn, IL",
    "carol-stream": "Carol Stream, IL",
    "wood-dale": "Wood Dale, IL",
    "villa-park": "Villa Park, IL",
    "bensenville": "Bensenville, IL",
    "westmont": "Westmont, IL",
    "lisle": "Lisle, IL",
    "woodridge": "Woodridge, IL",
    "darien": "Darien, IL",
    "oak-brook": "Oak Brook, IL",
    "hinsdale": "Hinsdale, IL",
    "willowbrook": "Willowbrook, IL",
    "bolingbrook": "Bolingbrook, IL",
    "aurora": "Aurora, IL",

    # Kane County
    "elgin": "Elgin, IL",
    "st-charles": "St. Charles, IL",
    "geneva": "Geneva, IL",
    "batavia": "Batavia, IL",
    "south-elgin": "South Elgin, IL",
    "carpentersville": "Carpentersville, IL",
    "north-aurora": "North Aurora, IL",

    # Lake County
    "waukegan": "Waukegan, IL",
    "north-chicago": "North Chicago, IL",
    "highland-park": "Highland Park, IL",
    "lake-forest": "Lake Forest, IL",
    "libertyville": "Libertyville, IL",
    "mundelein": "Mundelein, IL",
    "vernon-hills": "Vernon Hills, IL",
    "gurnee": "Gurnee, IL",
    "zion": "Zion, IL",
    "lake-zurich": "Lake Zurich, IL",
    "round-lake": "Round Lake, IL",
    "deerfield": "Deerfield, IL",
    "lincolnshire": "Lincolnshire, IL",
    "lake-bluff": "Lake Bluff, IL",

    # Will County
    "joliet": "Joliet, IL",
    "plainfield": "Plainfield, IL",
    "romeoville": "Romeoville, IL",
    "lockport": "Lockport, IL",
    "crest-hill": "Crest Hill, IL",
    "new-lenox": "New Lenox, IL",
    "mokena": "Mokena, IL",
    "frankfort": "Frankfort, IL",
    "homer-glen": "Homer Glen, IL",
    "shorewood": "Shorewood, IL",
    "channahon": "Channahon, IL",
    "minooka": "Minooka, IL",

    # McHenry County
    "crystal-lake": "Crystal Lake, IL",
    "mchenry": "McHenry, IL",
    "woodstock": "Woodstock, IL",
    "algonquin": "Algonquin, IL",
    "huntley": "Huntley, IL",
    "lake-in-the-hills": "Lake in the Hills, IL",
    "cary": "Cary, IL",
    "marengo": "Marengo, IL",

    # Kendall County
    "yorkville": "Yorkville, IL",
    "oswego": "Oswego, IL",
    "plano": "Plano, IL",
    "sandwich": "Sandwich, IL",

    # DeKalb County
    "dekalb": "DeKalb, IL",
    "sycamore": "Sycamore, IL",
    "genoa": "Genoa, IL",

    # Winnebago / Boone Counties (Rockford metro)
    "rockford": "Rockford, IL",
    "loves-park": "Loves Park, IL",
    "machesney-park": "Machesney Park, IL",
    "belvidere": "Belvidere, IL",
    "cherry-valley": "Cherry Valley, IL",
    "roscoe": "Roscoe, IL",

    # Grundy County
    "morris": "Morris, IL",
    "coal-city": "Coal City, IL",

    # Kankakee County
    "kankakee": "Kankakee, IL",
    "bourbonnais": "Bourbonnais, IL",
    "bradley": "Bradley, IL",

    # LaSalle County
    "ottawa": "Ottawa, IL",
    "peru": "Peru, IL",
    "lasalle": "LaSalle, IL",
    "streator": "Streator, IL",
    "mendota": "Mendota, IL",

    # Ogle / Lee Counties
    "rochelle": "Rochelle, IL",
    "oregon": "Oregon, IL",
    "dixon": "Dixon, IL",

    # Bureau / Putnam / Marshall Counties
    "princeton": "Princeton, IL",
    "spring-valley": "Spring Valley, IL",
    "henry": "Henry, IL",

    # Whiteside / Carroll Counties
    "sterling": "Sterling, IL",
    "rock-falls": "Rock Falls, IL",
    "morrison": "Morrison, IL",

    # Jo Daviess / Stephenson Counties
    "galena": "Galena, IL",
    "freeport": "Freeport, IL",

    # Livingston / Ford / Iroquois Counties
    "pontiac": "Pontiac, IL",
    "dwight": "Dwight, IL",
    "watseka": "Watseka, IL",
    "paxton": "Paxton, IL",

    # Woodford County
    "eureka": "Eureka, IL",
    "el-paso": "El Paso, IL",
}

# LoopNet property types to search
PROPERTY_TYPES = [
    "commercial-real-estate",     # All commercial (default)
    "industrial-space",           # Industrial/warehouse
    "office-space",               # Office buildings
    "retail-space",               # Retail/storefronts
    "land",                       # Vacant land (important for BESS sites)
]

# LoopNet listing types
LISTING_TYPES = [
    "for-sale",
    "for-lease",
]


def get_search_locations(region=None):
    """
    Get search locations filtered by region.

    Args:
        region: Optional filter. One of:
            'chicago' - Chicago proper only
            'cook' - Cook County (Chicago + suburbs)
            'collar' - Collar counties (DuPage, Kane, Lake, Will, McHenry, Kendall)
            'metro' - Chicago metro (Cook + collar counties)
            'rockford' - Rockford metro area
            'downstate' - Everything outside Chicago metro + Rockford
            None - All ComEd territory

    Returns:
        dict of {slug: display_name} for matching cities
    """
    if region is None:
        return COMED_CITIES.copy()

    region_map = {
        "chicago": ["chicago"],
        "cook": [
            "chicago", "evanston", "skokie", "des-plaines", "park-ridge",
            "niles", "morton-grove", "wilmette", "glenview", "northbrook",
            "oak-park", "cicero", "berwyn", "maywood", "melrose-park",
            "bellwood", "elmhurst", "franklin-park", "river-grove",
            "broadview", "hillside", "westchester", "la-grange", "brookfield",
            "oak-lawn", "orland-park", "tinley-park", "harvey",
            "calumet-city", "lansing", "homewood", "dolton", "blue-island",
            "alsip", "evergreen-park", "chicago-heights", "park-forest",
            "arlington-heights", "schaumburg", "palatine", "mount-prospect",
            "rolling-meadows", "hoffman-estates", "elk-grove-village",
            "streamwood", "hanover-park", "buffalo-grove",
        ],
        "collar": [
            "naperville", "wheaton", "downers-grove", "lombard", "addison",
            "glen-ellyn", "carol-stream", "wood-dale", "villa-park",
            "bensenville", "westmont", "lisle", "woodridge", "darien",
            "oak-brook", "hinsdale", "willowbrook", "bolingbrook", "aurora",
            "elgin", "st-charles", "geneva", "batavia", "south-elgin",
            "carpentersville", "north-aurora",
            "waukegan", "north-chicago", "highland-park", "lake-forest",
            "libertyville", "mundelein", "vernon-hills", "gurnee", "zion",
            "lake-zurich", "round-lake", "deerfield", "lincolnshire",
            "lake-bluff",
            "joliet", "plainfield", "romeoville", "lockport", "crest-hill",
            "new-lenox", "mokena", "frankfort", "homer-glen", "shorewood",
            "channahon", "minooka",
            "crystal-lake", "mchenry", "woodstock", "algonquin", "huntley",
            "lake-in-the-hills", "cary", "marengo",
            "yorkville", "oswego", "plano", "sandwich",
        ],
        "rockford": [
            "rockford", "loves-park", "machesney-park", "belvidere",
            "cherry-valley", "roscoe",
        ],
    }
    region_map["metro"] = region_map["cook"] + region_map["collar"]
    region_map["downstate"] = [
        k for k in COMED_CITIES
        if k not in region_map["metro"] and k not in region_map["rockford"]
    ]

    slugs = region_map.get(region, [])
    return {k: COMED_CITIES[k] for k in slugs if k in COMED_CITIES}
