# LoopNet Commercial Real Estate Scraper — ComEd Territory

Scrapes commercial real estate listings from [LoopNet](https://www.loopnet.com) for properties within [ComEd's](https://www.comed.com) (Commonwealth Edison) service territory in northern Illinois.

## Setup

```bash
cd scraper

# Install Python dependencies
pip install -r requirements.txt

# Install Playwright's Chromium browser
playwright install chromium
```

## Usage

```bash
# Scrape all ComEd territory (for-sale, all property types)
python loopnet_scraper.py

# Scrape Chicago metro area only
python loopnet_scraper.py --region metro

# Scrape only vacant land (useful for BESS site prospecting)
python loopnet_scraper.py --property-type land

# Scrape only industrial properties
python loopnet_scraper.py --property-type industrial-space

# Include for-lease listings
python loopnet_scraper.py --include-lease

# Quick test run (5 cities, show browser)
python loopnet_scraper.py --limit 5 --headful

# Full run with detail pages and JSON output
python loopnet_scraper.py --details --json

# --- ZIP code mode (more granular, uses ComEd's official ZIP list) ---

# Download ComEd's official ZIP code spreadsheet first
python comed_zipcodes.py --download

# Search by ZIP code instead of city name
python loopnet_scraper.py --use-zipcodes

# Search only Chicago ZIP codes (606xx)
python loopnet_scraper.py --use-zipcodes --zip-prefix 606

# Search Rockford area ZIPs only
python loopnet_scraper.py --use-zipcodes --zip-prefix 611
```

## Regions

| Region | Description |
|--------|-------------|
| `chicago` | Chicago proper only |
| `cook` | All of Cook County |
| `collar` | Collar counties (DuPage, Kane, Lake, Will, McHenry, Kendall) |
| `metro` | Chicago metro (Cook + collar counties) |
| `rockford` | Rockford metro area |
| `downstate` | ComEd territory outside Chicago/Rockford metros |
| *(omit)* | Full ComEd territory (~150 cities) |

## Property Types

| Type | Description |
|------|-------------|
| `commercial-real-estate` | All commercial (default) |
| `industrial-space` | Warehouses, manufacturing, flex |
| `office-space` | Office buildings |
| `retail-space` | Retail, storefronts, restaurants |
| `land` | Vacant land parcels |

## Output

Results are saved to `scraper/output/` as CSV (and optionally JSON).

### CSV Columns

| Column | Description |
|--------|-------------|
| `scrape_timestamp` | When the listing was scraped |
| `city_slug` / `city_name` | Search city used |
| `listing_url` | LoopNet listing URL |
| `property_name` | Property title |
| `address`, `city`, `state`, `zip_code` | Location |
| `property_type` / `property_subtype` | Classification |
| `price` / `price_raw` | Numeric and raw price |
| `square_feet` / `square_feet_raw` | Building size |
| `lot_size` / `lot_size_raw` | Land area |
| `cap_rate` | Capitalization rate |
| `year_built` | Construction year |
| `broker_name` / `broker_company` | Listing agent |
| `listing_id` | LoopNet listing ID |
| `latitude` / `longitude` | Coordinates (detail pages only) |
| `description` | Property description (detail pages only) |

## ComEd Service Territory

ComEd serves ~4 million customers across northern Illinois, spanning ~11,400 square miles. The territory includes:

- **Chicago** and all Cook County suburbs
- **Collar counties**: DuPage, Kane, Lake, Will, McHenry, Kendall
- **Rockford metro**: Winnebago, Boone counties
- **Northern IL**: DeKalb, Ogle, Lee, LaSalle, Bureau, Grundy, Kankakee, and more

The full list of ~150 cities is defined in `comed_territory.py`.

## Notes

- LoopNet uses Akamai WAF protection — the scraper uses Playwright (headless Chromium) to render pages like a real browser
- Rate-limited with random delays (2-5 seconds between requests) to be respectful
- Intermediate results are saved every 10 cities in case of interruption
- Ctrl+C saves partial results before exiting
- Use `--headful` to watch the browser and debug selector issues
- LoopNet may change their HTML structure; check `output/debug/` for saved HTML if selectors stop working
