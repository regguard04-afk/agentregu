"""
Regulatory source scraper — RSS feeds and website scraping.

Hardcodes 5 live regulatory sources and saves raw content to data/raw/.
"""

import json
import re
import traceback
from datetime import datetime
from pathlib import Path
from typing import Optional

import feedparser
import requests
from bs4 import BeautifulSoup

from backend.models.schemas import RawScrapedItem

RAW_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    )
}

# ─── Source Definitions ───────────────────────────────────────────────

RSS_SOURCES = [
    {
        "name": "RBI",
        "url": "https://www.rbi.org.in/rss/RBINotificationsAndCirculars.xml",
        "jurisdiction": "India",
        "source_type": "rss",
    },
    {
        "name": "SEC",
        "url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=&dateb=&owner=include&count=10&search_text=&output=atom",
        "jurisdiction": "USA",
        "source_type": "rss",
    },
    {
        "name": "EUR-Lex",
        "url": "https://eur-lex.europa.eu/rss/legisMain.xml",
        "jurisdiction": "EU",
        "source_type": "rss",
    },
    {
        "name": "FATF",
        "url": "https://www.fatf-gafi.org/rss/fatf-publications.xml",
        "jurisdiction": "Global",
        "source_type": "rss",
    },
    {
        "name": "FCA",
        "url": "https://www.fca.org.uk/news/rss.xml",
        "jurisdiction": "EU",
        "source_type": "rss",
    },
]

WEBSITE_SOURCES = [
    {
        "name": "SEBI",
        "url": (
            "https://www.sebi.gov.in/sebiweb/other/"
            "OtherAction.do?doNewsandEvents=yes"
        ),
        "jurisdiction": "India",
        "source_type": "website",
    },
    {
        "name": "MCA",
        "url": "https://www.mca.gov.in/content/mca/global/en/home.html",
        "jurisdiction": "India",
        "source_type": "website",
    },
]


# ─── RSS Scraping ─────────────────────────────────────────────────────


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Attempt to parse a date string from an RSS entry."""
    if not date_str:
        return None
    try:
        from dateutil.parser import parse as dateparse
        return dateparse(date_str)
    except Exception:
        return None


def _scrape_rss(source: dict) -> list[RawScrapedItem]:
    """Parse an RSS/Atom feed and return structured items."""
    items: list[RawScrapedItem] = []
    try:
        # Fetch with User-Agent headers (some gov sites block default)
        try:
            resp = requests.get(source["url"], headers=HEADERS, timeout=15)
            feed = feedparser.parse(resp.content)
        except Exception:
            feed = feedparser.parse(source["url"])
        for entry in feed.entries[:10]:  # limit to latest 10
            title = entry.get("title", "Untitled")
            link = entry.get("link", source["url"])
            published = _parse_date(
                entry.get("published") or entry.get("updated")
            )
            summary = entry.get("summary", "")
            # Strip HTML from summary
            if summary:
                summary = BeautifulSoup(summary, "html.parser").get_text(
                    separator=" ", strip=True
                )

            items.append(
                RawScrapedItem(
                    source=source["name"],
                    source_type=source["source_type"],
                    title=title,
                    url=link,
                    published_at=published,
                    raw_content=summary[:2000],
                    jurisdiction=source["jurisdiction"],
                )
            )
        print(f"  ✅ {source['name']} RSS: {len(items)} items")
    except Exception as e:
        print(f"  ❌ {source['name']} RSS error: {e}")
        traceback.print_exc()

    return items


# ─── Website Scraping ─────────────────────────────────────────────────


def _scrape_sebi() -> list[RawScrapedItem]:
    """Scrape the SEBI news/events page."""
    items: list[RawScrapedItem] = []
    source = WEBSITE_SOURCES[0]
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # SEBI lists news in table rows or divs
        rows = soup.select("tr") or soup.select("div.news-item")
        for row in rows[:10]:
            link_tag = row.find("a", href=True)
            if not link_tag:
                continue
            title = link_tag.get_text(strip=True)
            if len(title) < 10:
                continue
            href = link_tag["href"]
            if not href.startswith("http"):
                href = "https://www.sebi.gov.in" + href

            # Try to find a date
            date_text = None
            td_cells = row.find_all("td")
            for td in td_cells:
                text = td.get_text(strip=True)
                if re.match(r"\d{1,2}[\-/]\w+[\-/]\d{2,4}", text):
                    date_text = text
                    break

            items.append(
                RawScrapedItem(
                    source="SEBI",
                    source_type="website",
                    title=title[:300],
                    url=href,
                    published_at=_parse_date(date_text),
                    raw_content=title[:2000],
                    jurisdiction="India",
                )
            )
        print(f"  ✅ SEBI website: {len(items)} items")
    except Exception as e:
        print(f"  ❌ SEBI scrape error: {e}")
        traceback.print_exc()

    return items


def _scrape_mca() -> list[RawScrapedItem]:
    """Scrape the MCA India homepage for recent updates."""
    items: list[RawScrapedItem] = []
    source = WEBSITE_SOURCES[1]
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 403:
            print(f"  ⚠️ MCA website: 403 Forbidden (blocked by server, skipping)")
            return items
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # MCA homepage typically has recent updates in list items or divs
        links = soup.find_all("a", href=True)
        seen_titles: set[str] = set()
        for link in links:
            title = link.get_text(strip=True)
            if len(title) < 20 or title in seen_titles:
                continue
            # Filter for likely regulatory content
            keywords = [
                "circular", "notification", "order", "amendment",
                "rule", "act", "regulation", "guideline", "gazette",
                "companies", "compliance",
            ]
            if not any(kw in title.lower() for kw in keywords):
                continue

            seen_titles.add(title)
            href = link["href"]
            if not href.startswith("http"):
                href = "https://www.mca.gov.in" + href

            items.append(
                RawScrapedItem(
                    source="MCA",
                    source_type="website",
                    title=title[:300],
                    url=href,
                    published_at=None,
                    raw_content=title[:2000],
                    jurisdiction="India",
                )
            )
            if len(items) >= 10:
                break

        print(f"  ✅ MCA website: {len(items)} items")
    except Exception as e:
        print(f"  ❌ MCA scrape error: {e}")
        traceback.print_exc()

    return items


# ─── Public API ───────────────────────────────────────────────────────


def scrape_all_sources() -> list[RawScrapedItem]:
    """
    Scrape all 5 regulatory sources and return a combined list.
    Saves raw content to data/raw/ as JSON files.
    """
    print("\n🔍 Scraping regulatory sources...\n")
    all_items: list[RawScrapedItem] = []

    # RSS sources
    for source in RSS_SOURCES:
        items = _scrape_rss(source)
        all_items.extend(items)

    # Website sources
    all_items.extend(_scrape_sebi())
    all_items.extend(_scrape_mca())

    # Save raw data
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    for item in all_items:
        filename = f"{timestamp}_{item.source}.json"
        filepath = RAW_DIR / filename
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(item.model_dump(mode="json"), f, indent=2, default=str)
        except Exception:
            pass  # Non-critical: raw archiving failure

    print(f"\n📦 Total scraped items: {len(all_items)}\n")
    return all_items


def deduplicate(
    items: list[RawScrapedItem], existing_urls: set[str]
) -> list[RawScrapedItem]:
    """Remove items whose URL already exists in the database."""
    seen: set[str] = set()
    unique: list[RawScrapedItem] = []
    for item in items:
        if item.url not in existing_urls and item.url not in seen:
            seen.add(item.url)
            unique.append(item)
    deduped = len(items) - len(unique)
    if deduped:
        print(f"  🔁 Deduplicated {deduped} items")
    return unique
