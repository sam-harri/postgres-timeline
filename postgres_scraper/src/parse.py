import requests
from bs4 import BeautifulSoup
import psycopg
from urllib.parse import urljoin
import re
from typing import Optional, Tuple, List, Dict
import os
from dotenv import load_dotenv
from loguru import logger
import sys

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "postgres_scraper.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG"
)

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg.connect(os.getenv('DATABASE_URL'))
        logger.info("Successfully connected to database")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

def create_tables(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS postgres_releases (
                    version VARCHAR(32) PRIMARY KEY,
                    major_version VARCHAR(32),
                    is_first_release BOOLEAN,
                    release_date DATE,
                    content TEXT
                );
            """)
        conn.commit()
        logger.info("Successfully created/verified postgres_releases table")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        raise

def get_release_content(url: str) -> Tuple[str, str]:
    """Scrape release notes page and return release date and content."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the release date by looking for any text containing "Release date:"
        release_date = None
        logger.debug(f"Searching for release date in URL: {url}")
        date_elements = soup.find_all(string=re.compile(r'Release date:', re.IGNORECASE))
        logger.debug(f"Found {len(date_elements)} elements containing 'Release date:'")

        if len(date_elements) != 1:
            logger.error(f"Expected exactly 1 'Release date:' element, found {len(date_elements)}")
            return None, None

        # release date is the next sibling of the element containing "Release date:"
        element = date_elements[0]
        parent = element.parent
        next_sibling = parent.next_sibling

        date_match = re.search(r'\d{4}-\d{2}-\d{2}', next_sibling)
        if not date_match:
            logger.error(f"No date found in release date text: {next_sibling}")
            return None, None
        release_date = date_match.group(0)
        
        # Get all text content from the div
        content_div = soup.find('div', id='pgContentWrap')
        if not content_div:
            logger.warning(f"No content div found for URL: {url}")
            return None, None
        content = content_div.get_text(separator='\n', strip=True)
        
        return release_date, content
    except requests.RequestException as e:
        logger.error(f"Failed to fetch URL {url}: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Error processing content for URL {url}: {e}")
        return None, None

def get_major_versions(soup: BeautifulSoup) -> Dict[str, List[str]]:
    """Extract major version information from the page and create a dictionary mapping major versions to their minor versions."""
    version_dict = {}
    
    # Find the main release notes list
    release_list = soup.find('ul', class_='release-notes-list fa-ul')
    if not release_list:
        logger.error("Could not find release notes list")
        return version_dict
    
    # Find all major version sections (direct li children of the release list)
    major_sections = release_list.find_all('li', recursive=False)
    
    for section in major_sections:
        # Get the major version text from the first anchor tag
        major_link = section.find('a')
        if not major_link:
            continue
            
        major_text = major_link.get_text().strip()
        logger.info(f"Found major version: '{major_text}'")
        
        # Find the nested ul containing minor versions
        minor_list = section.find('ul', class_='release-notes-list')
        if not minor_list:
            logger.warning(f"No minor versions found for {major_text}")
            continue
            
        # Get all minor versions from the nested list
        full_versions = []
        minor_links = minor_list.find_all('a')
        
        for link in minor_links:
            version_text = link.get_text().strip()
            if version_text and not version_text.startswith('PostgreSQL'):
                full_versions.append(version_text)
                logger.info(f"  - Found minor version: '{version_text}'")
        
        # Add to dictionary
        version_dict[major_text] = full_versions
    return version_dict

def scrape_releases():
    base_url = "https://www.postgresql.org/docs/release/"
    try:
        response = requests.get(base_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get version dictionary
        version_dict = get_major_versions(soup)
        logger.info(f"Found {len(version_dict)} major versions to process")
        
        with get_db_connection() as conn:
            create_tables(conn)
            
            for major_version, full_versions in version_dict.items():
                logger.info(f"Processing major version {major_version}")
                
                for full_version in full_versions:
                    release_url = f"https://www.postgresql.org/docs/release/{full_version}/"
                    logger.debug(f"Exploring PostgreSQL {full_version}, with URL: {release_url}")
                    
                    release_date, content = get_release_content(release_url)
                    
                    if not release_date or not content:
                        logger.warning(f"Missing required data for {full_version}")
                        continue
                    
                    # Determine if this is a first release (ends in .0)
                    is_first_release = full_version.endswith('.0')
                    
                    # Store in database
                    try:
                        with conn.cursor() as cur:
                            cur.execute("""
                                INSERT INTO postgres_releases 
                                    (version, major_version, is_first_release, release_date, content)
                                VALUES (%s, %s, %s, %s, %s)
                                ON CONFLICT (version) DO UPDATE SET
                                    major_version = EXCLUDED.major_version,
                                    is_first_release = EXCLUDED.is_first_release,
                                    release_date = EXCLUDED.release_date,
                                    content = EXCLUDED.content
                            """, (full_version, major_version, is_first_release, release_date, content))
                        
                        conn.commit()
                        logger.success(f"Successfully processed PostgreSQL {full_version}")
                    except Exception as e:
                        logger.error(f"Failed to store data for {full_version}: {e}")
                        conn.rollback()
                        continue
                    
                logger.info(f"Completed processing all minor versions for {major_version}")
                    
    except requests.RequestException as e:
        logger.error(f"Failed to fetch base URL: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during scraping: {e}")
        raise

def main():
    logger.info("Starting PostgreSQL release notes scraper...")
    try:
        scrape_releases()
        logger.success("Scraping completed successfully!")
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 