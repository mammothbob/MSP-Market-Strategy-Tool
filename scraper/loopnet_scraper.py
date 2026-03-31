#!/usr/bin/env python3
"""
LoopNet Commercial Real Estate Scraper for ComEd Service Territory

Scrapes commercial real estate listings from LoopNet for cities within
ComEd's (Commonwealth Edison) service territory in northern Illinois.

LoopNet uses Akamai WAF protection, so this scraper uses Playwright
(headless Chromium browser) to render pages like a real user.

Usage:
    # Scrape all ComEd territory (all property types, for-sale only)
    python loopnet_scraper.py

    # Scrape only Chicago metro area
    python loopnet_scraper.py --region metro

    # Scrape only land listings (useful for BESS site prospecting)
    python loopnet_scraper.py --property-type land

    # Scrape for-lease listings too
    python loopnet_scraper.py --include-lease

    # Limit to first N cities (for testing)
    python loopnet_scraper.py --limit 5

    # Custom output file
    python loopnet_scraper.py --output my_listings.csv

Requirements:
    pip install -r requirements.txt
    playwright install chromium
"""

import argparse
import csv
import json
import logging
import os
import re
import sys
import time
import random
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

from comed_territory import (
    COMED_CITIES,
    PROPERTY_TYPES,
    LISTING_TYPES,
    get_search_locations,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LOOPNET_BASE = "https://www.loopnet.com"
SEARCH_URL_TEMPLATE = "{base}/search/{property_type}/{city}-il/{listing_type}/"
LISTING_URL_TEMPLATE = "{base}/Listing/{path}"

# Rate limiting: random delay between requests (seconds)
MIN_DELAY = 2.0
MAX_DELAY = 5.0

# Max pages to paginate through per city/property-type combo
MAX_PAGES = 20

# Output directory
OUTPUT_DIR = Path(__file__).parent / "output"

# CSV columns for output
CSV_COLUMNS = [
    "scrape_timestamp",
    "city_slug",
    "city_name",
    "search_property_type",
    "listing_type",
    "listing_url",
    "property_name",
    "address",
    "city",
    "state",
    "zip_code",
    "property_type",
    "property_subtype",
    "price",
    "price_raw",
    "square_feet",
    "square_feet_raw",
    "lot_size",
    "lot_size_raw",
    "cap_rate",
    "year_built",
    "num_units",
    "broker_name",
    "broker_company",
    "listing_id",
    "latitude",
    "longitude",
    "description",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("loopnet_scraper")


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_price(text):
    """Extract numeric price from text like '$1,250,000' or '$12.50/SF'."""
    if not text:
        return None, text
    text = text.strip()
    match = re.search(r'\$[\d,]+(?:\.\d+)?', text)
    if match:
        num_str = match.group().replace('$', '').replace(',', '')
        try:
            return float(num_str), text
        except ValueError:
            pass
    return None, text


def parse_sqft(text):
    """Extract numeric square footage from text like '15,000 SF'."""
    if not text:
        return None, text
    text = text.strip()
    match = re.search(r'([\d,]+(?:\.\d+)?)\s*(?:SF|sq\s*ft|square\s*feet)', text, re.IGNORECASE)
    if match:
        num_str = match.group(1).replace(',', '')
        try:
            return float(num_str), text
        except ValueError:
            pass
    return None, text


def parse_lot_size(text):
    """Extract lot size from text like '2.5 AC' or '10,000 SF'."""
    if not text:
        return None, text
    text = text.strip()
    match = re.search(r'([\d,]+(?:\.\d+)?)\s*(?:AC|acres?)', text, re.IGNORECASE)
    if match:
        num_str = match.group(1).replace(',', '')
        try:
            return float(num_str), text
        except ValueError:
            pass
    return parse_sqft(text)


def parse_address_parts(full_address):
    """Split a full address into city, state, zip."""
    if not full_address:
        return None, None, None
    # Try to match "City, ST 60601" pattern
    match = re.search(r'([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?', full_address)
    if match:
        return match.group(1).strip(), match.group(2), match.group(3)
    return None, None, None


# ---------------------------------------------------------------------------
# Scraper class
# ---------------------------------------------------------------------------

class LoopNetScraper:
    """Scrapes LoopNet listings using Playwright (headless browser)."""

    def __init__(self, headless=True):
        if not HAS_PLAYWRIGHT:
            raise RuntimeError(
                "Playwright is required. Install with:\n"
                "  pip install playwright\n"
                "  playwright install chromium"
            )
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.listings = []
        self.seen_urls = set()

    def start(self):
        """Launch the browser."""
        log.info("Launching browser (headless=%s)...", self.headless)
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
            ],
        )
        self.context = self.browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="America/Chicago",
        )
        # Block images/fonts to speed up loading
        self.context.route(
            re.compile(r"\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$"),
            lambda route: route.abort(),
        )
        self.page = self.context.new_page()
        log.info("Browser ready.")

    def stop(self):
        """Close the browser."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        log.info("Browser closed.")

    def random_delay(self):
        """Sleep a random amount to avoid detection."""
        delay = random.uniform(MIN_DELAY, MAX_DELAY)
        time.sleep(delay)

    def scrape_search_page(self, url, city_slug, city_name, property_type, listing_type):
        """
        Scrape a single LoopNet search results page.
        Returns the number of listings found and whether there's a next page.
        """
        try:
            self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            # Wait for listing cards to appear
            try:
                self.page.wait_for_selector(
                    'article[class*="placard"], div[class*="placard"], '
                    '[data-testid="property-card"], .csg-placard',
                    timeout=10000,
                )
            except PlaywrightTimeout:
                # Maybe no results or page structure changed
                pass
        except PlaywrightTimeout:
            log.warning("Page load timeout for %s", url)
            return 0, False
        except Exception as e:
            log.warning("Error loading %s: %s", url, e)
            return 0, False

        html = self.page.content()
        soup = BeautifulSoup(html, "lxml") if HAS_BS4 else None
        if not soup:
            log.error("BeautifulSoup not available - cannot parse HTML")
            return 0, False

        # Try multiple selectors for listing cards (LoopNet changes markup)
        cards = (
            soup.select('article.placard')
            or soup.select('div.csg-placard')
            or soup.select('[class*="placard-pseudo-link"]')
            or soup.select('article[class*="placard"]')
            or soup.select('[data-testid="property-card"]')
        )

        if not cards:
            # Try to detect "no results" message
            no_results = soup.find(string=re.compile(r'no results|0 results|no properties', re.I))
            if no_results:
                log.info("  No listings found for %s", city_name)
            else:
                log.warning("  Could not find listing cards on page (may need selector update)")
                # Save debug HTML
                debug_dir = OUTPUT_DIR / "debug"
                debug_dir.mkdir(parents=True, exist_ok=True)
                debug_file = debug_dir / f"debug_{city_slug}_{property_type}.html"
                debug_file.write_text(html[:50000], encoding="utf-8")
                log.warning("  Saved debug HTML to %s", debug_file)
            return 0, False

        count = 0
        timestamp = datetime.utcnow().isoformat() + "Z"

        for card in cards:
            listing = self._parse_card(card, timestamp, city_slug, city_name,
                                       property_type, listing_type)
            if listing and listing["listing_url"] not in self.seen_urls:
                self.seen_urls.add(listing["listing_url"])
                self.listings.append(listing)
                count += 1

        # Check for next page
        has_next = bool(
            soup.select_one('a[class*="next"], a[aria-label="Next"], '
                            'button[aria-label="Next page"]')
        )

        log.info("  Found %d new listings on page (total: %d)", count, len(self.listings))
        return count, has_next

    def _parse_card(self, card, timestamp, city_slug, city_name,
                    search_property_type, listing_type):
        """Parse a single listing card element into a dict."""
        listing = {col: None for col in CSV_COLUMNS}
        listing["scrape_timestamp"] = timestamp
        listing["city_slug"] = city_slug
        listing["city_name"] = city_name
        listing["search_property_type"] = search_property_type
        listing["listing_type"] = listing_type

        # Property name / title
        title_el = (
            card.select_one('h4 a, h3 a, [class*="title"] a, '
                            '[class*="header"] a, a[class*="placard-pseudo-link"]')
        )
        if title_el:
            listing["property_name"] = title_el.get_text(strip=True)
            href = title_el.get("href", "")
            if href:
                listing["listing_url"] = urljoin(LOOPNET_BASE, href)
        else:
            # Try any link in the card
            link = card.select_one('a[href*="/Listing/"]')
            if link:
                listing["listing_url"] = urljoin(LOOPNET_BASE, link["href"])
                listing["property_name"] = link.get_text(strip=True) or None

        if not listing["listing_url"]:
            return None

        # Extract listing ID from URL
        id_match = re.search(r'/(\d+)/?$', listing["listing_url"])
        if id_match:
            listing["listing_id"] = id_match.group(1)

        # Address
        addr_el = card.select_one(
            '[class*="address"], [class*="location"], '
            '[class*="subtitle"], .csg-placard-address'
        )
        if addr_el:
            listing["address"] = addr_el.get_text(strip=True)
            city, state, zipcode = parse_address_parts(listing["address"])
            listing["city"] = city
            listing["state"] = state
            listing["zip_code"] = zipcode

        # Property type
        type_el = card.select_one('[class*="type"], [class*="property-type"]')
        if type_el:
            listing["property_type"] = type_el.get_text(strip=True)

        # Price
        price_el = card.select_one(
            '[class*="price"], [class*="Price"], '
            '[class*="asking"], [class*="cost"]'
        )
        if price_el:
            price_text = price_el.get_text(strip=True)
            listing["price"], listing["price_raw"] = parse_price(price_text)
            if not listing["price_raw"]:
                listing["price_raw"] = price_text

        # Square footage
        size_el = card.select_one(
            '[class*="size"], [class*="sqft"], [class*="area"]'
        )
        if size_el:
            size_text = size_el.get_text(strip=True)
            listing["square_feet"], listing["square_feet_raw"] = parse_sqft(size_text)
            if not listing["square_feet_raw"]:
                listing["square_feet_raw"] = size_text

        # Cap rate
        cap_el = card.select_one('[class*="cap"]')
        if cap_el:
            cap_text = cap_el.get_text(strip=True)
            cap_match = re.search(r'([\d.]+)\s*%', cap_text)
            if cap_match:
                listing["cap_rate"] = cap_match.group(1)

        # Lot size (especially for land)
        lot_el = card.select_one('[class*="lot"]')
        if lot_el:
            lot_text = lot_el.get_text(strip=True)
            listing["lot_size"], listing["lot_size_raw"] = parse_lot_size(lot_text)

        # Broker info
        broker_el = card.select_one('[class*="broker"], [class*="agent"]')
        if broker_el:
            listing["broker_name"] = broker_el.get_text(strip=True)
        company_el = card.select_one('[class*="company"], [class*="firm"]')
        if company_el:
            listing["broker_company"] = company_el.get_text(strip=True)

        # Try to get all text content for data we might have missed
        all_text = card.get_text(separator=" | ", strip=True)

        # Look for year built
        year_match = re.search(r'(?:built|year)\s*:?\s*((?:19|20)\d{2})', all_text, re.I)
        if year_match:
            listing["year_built"] = year_match.group(1)

        # Look for unit count
        unit_match = re.search(r'(\d+)\s*(?:units?|spaces?)', all_text, re.I)
        if unit_match:
            listing["num_units"] = unit_match.group(1)

        # Fallback: if we didn't get price from a specific element, search all text
        if not listing["price"]:
            listing["price"], listing["price_raw"] = parse_price(all_text)
        if not listing["square_feet"]:
            listing["square_feet"], listing["square_feet_raw"] = parse_sqft(all_text)

        return listing

    def scrape_listing_detail(self, listing):
        """
        Optionally scrape the individual listing page for more detail.
        This is slower but gets lat/lng, description, and more fields.
        """
        url = listing.get("listing_url")
        if not url:
            return listing

        try:
            self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(1)
        except Exception as e:
            log.warning("  Error loading detail page %s: %s", url, e)
            return listing

        html = self.page.content()
        soup = BeautifulSoup(html, "lxml")

        # Look for lat/lng in embedded scripts/data
        for script in soup.find_all("script"):
            script_text = script.string or ""
            lat_match = re.search(r'"latitude"\s*:\s*([-\d.]+)', script_text)
            lng_match = re.search(r'"longitude"\s*:\s*([-\d.]+)', script_text)
            if lat_match and lng_match:
                listing["latitude"] = lat_match.group(1)
                listing["longitude"] = lng_match.group(1)
                break

        # Description
        desc_el = soup.select_one(
            '[class*="description"], [class*="overview"], '
            '#propertyDescription, .property-description'
        )
        if desc_el:
            listing["description"] = desc_el.get_text(strip=True)[:1000]

        # Property subtype
        subtype_el = soup.select_one('[class*="subtype"], [class*="sub-type"]')
        if subtype_el:
            listing["property_subtype"] = subtype_el.get_text(strip=True)

        return listing

    def scrape_city(self, city_slug, city_name, property_types, listing_types,
                    scrape_details=False):
        """Scrape all listings for a single city across given property/listing types."""
        for prop_type in property_types:
            for list_type in listing_types:
                url = SEARCH_URL_TEMPLATE.format(
                    base=LOOPNET_BASE,
                    property_type=prop_type,
                    city=city_slug,
                    listing_type=list_type,
                )
                log.info("Searching: %s / %s / %s", city_name, prop_type, list_type)
                log.info("  URL: %s", url)

                page_num = 1
                while page_num <= MAX_PAGES:
                    page_url = url if page_num == 1 else f"{url}{page_num}/"
                    count, has_next = self.scrape_search_page(
                        page_url, city_slug, city_name, prop_type, list_type
                    )
                    if count == 0 or not has_next:
                        break
                    page_num += 1
                    self.random_delay()

                self.random_delay()

        # Optionally scrape detail pages
        if scrape_details:
            new_listings = [l for l in self.listings
                           if l["city_slug"] == city_slug and not l.get("latitude")]
            log.info("Scraping %d detail pages for %s...", len(new_listings), city_name)
            for i, listing in enumerate(new_listings):
                if i > 0 and i % 10 == 0:
                    log.info("  Detail page %d/%d", i, len(new_listings))
                self.scrape_listing_detail(listing)
                self.random_delay()

    def save_csv(self, filepath):
        """Save all scraped listings to CSV."""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(self.listings)

        log.info("Saved %d listings to %s", len(self.listings), filepath)

    def save_json(self, filepath):
        """Save all scraped listings to JSON."""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.listings, f, indent=2, default=str)

        log.info("Saved %d listings to %s", len(self.listings), filepath)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Scrape LoopNet commercial listings in ComEd service territory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                              # All ComEd territory, for-sale only
  %(prog)s --region metro               # Chicago metro area only
  %(prog)s --region chicago             # Chicago proper only
  %(prog)s --property-type land         # Land listings only (BESS sites)
  %(prog)s --property-type industrial-space  # Industrial only
  %(prog)s --include-lease              # Include for-lease listings
  %(prog)s --limit 5 --details          # Test run: 5 cities with detail pages
  %(prog)s --headful                    # Show the browser window (debugging)

Regions:
  chicago    Chicago proper only
  cook       All of Cook County
  collar     Collar counties (DuPage, Kane, Lake, Will, McHenry, Kendall)
  metro      Chicago metro (Cook + collar counties)
  rockford   Rockford metro area
  downstate  ComEd territory outside Chicago/Rockford metros
  (omit)     Full ComEd territory
        """,
    )
    parser.add_argument(
        "--region", type=str, default=None,
        help="Geographic region to scrape (default: all ComEd territory)",
    )
    parser.add_argument(
        "--property-type", type=str, default=None,
        choices=PROPERTY_TYPES,
        help="Specific property type to search (default: all types)",
    )
    parser.add_argument(
        "--include-lease", action="store_true",
        help="Include for-lease listings (default: for-sale only)",
    )
    parser.add_argument(
        "--details", action="store_true",
        help="Also scrape individual listing detail pages (slower, gets lat/lng)",
    )
    parser.add_argument(
        "--headful", action="store_true",
        help="Show the browser window (useful for debugging)",
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Limit number of cities to scrape (for testing)",
    )
    parser.add_argument(
        "--output", type=str, default=None,
        help="Output CSV file path (default: output/loopnet_comed_YYYYMMDD_HHMMSS.csv)",
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Also save output as JSON",
    )
    args = parser.parse_args()

    # Determine search parameters
    locations = get_search_locations(args.region)
    if args.limit:
        locations = dict(list(locations.items())[:args.limit])

    prop_types = [args.property_type] if args.property_type else PROPERTY_TYPES
    list_types = LISTING_TYPES if args.include_lease else ["for-sale"]

    log.info("=" * 70)
    log.info("LoopNet ComEd Territory Scraper")
    log.info("=" * 70)
    log.info("Region: %s", args.region or "ALL ComEd territory")
    log.info("Cities to scrape: %d", len(locations))
    log.info("Property types: %s", ", ".join(prop_types))
    log.info("Listing types: %s", ", ".join(list_types))
    log.info("Total search combinations: %d",
             len(locations) * len(prop_types) * len(list_types))
    log.info("Scrape detail pages: %s", args.details)
    log.info("=" * 70)

    # Set up output path
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    if args.output:
        csv_path = Path(args.output)
    else:
        csv_path = OUTPUT_DIR / f"loopnet_comed_{now}.csv"

    # Run the scraper
    scraper = LoopNetScraper(headless=not args.headful)
    try:
        scraper.start()

        for i, (slug, name) in enumerate(locations.items()):
            log.info("-" * 50)
            log.info("[%d/%d] Scraping %s (%s)", i + 1, len(locations), name, slug)
            log.info("-" * 50)
            scraper.scrape_city(
                slug, name, prop_types, list_types,
                scrape_details=args.details,
            )

            # Save intermediate results every 10 cities
            if (i + 1) % 10 == 0:
                intermediate_path = OUTPUT_DIR / f"loopnet_comed_{now}_partial.csv"
                scraper.save_csv(intermediate_path)

        # Save final results
        scraper.save_csv(csv_path)
        if args.json:
            json_path = csv_path.with_suffix(".json")
            scraper.save_json(json_path)

    except KeyboardInterrupt:
        log.warning("Interrupted! Saving partial results...")
        scraper.save_csv(csv_path.with_stem(csv_path.stem + "_partial"))
    finally:
        scraper.stop()

    # Summary
    log.info("=" * 70)
    log.info("SCRAPE COMPLETE")
    log.info("Total unique listings: %d", len(scraper.listings))
    log.info("Output: %s", csv_path)

    # Quick stats
    if scraper.listings:
        by_type = {}
        by_city = {}
        for l in scraper.listings:
            t = l.get("search_property_type", "unknown")
            c = l.get("city_name", "unknown")
            by_type[t] = by_type.get(t, 0) + 1
            by_city[c] = by_city.get(c, 0) + 1

        log.info("By property type:")
        for t, n in sorted(by_type.items(), key=lambda x: -x[1]):
            log.info("  %-30s %d", t, n)

        log.info("Top 20 cities by listing count:")
        for c, n in sorted(by_city.items(), key=lambda x: -x[1])[:20]:
            log.info("  %-30s %d", c, n)

    log.info("=" * 70)


if __name__ == "__main__":
    main()
