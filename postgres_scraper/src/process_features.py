import os
from dotenv import load_dotenv
from loguru import logger
import sys
import psycopg
from openai import AsyncOpenAI
from typing import List, Optional
from pydantic import BaseModel
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "feature_processing.log",
    rotation="500 MB",
    retention="10 days",
    level="DEBUG"
)

load_dotenv()

class PostgresFeature(BaseModel):
    """Represents a significant PostgreSQL feature from a release."""
    bulletpoint: str

class PostgresReleaseAnalysis(BaseModel):
    """Represents the analysis of a PostgreSQL release."""
    has_significant_features: bool
    features: List[PostgresFeature] | None = None

def get_db_connection():
    try:
        conn = psycopg.connect(os.getenv('DATABASE_URL'))
        logger.info("Successfully connected to database")
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

def create_features_table(conn):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS postgres_features (
                    version VARCHAR(32) PRIMARY KEY,
                    major_version VARCHAR(32),
                    is_first_release BOOLEAN,
                    release_date DATE,
                    features TEXT[],
                    FOREIGN KEY (version) REFERENCES postgres_releases(version)
                );
            """)
        conn.commit()
        logger.info("Successfully created/verified postgres_features table")
    except Exception as e:
        logger.error(f"Failed to create features table: {e}")
        raise

def get_openai_client():
    return AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))

async def analyze_release_content(content: str, is_first_release: bool) -> Optional[List[str]]:
    """Use OpenAI to analyze release notes and extract important features."""
    client = get_openai_client()
    
    prompt = f"""You are an expert PostgreSQL database administrator and historian. Analyze the following PostgreSQL release notes and identify the most significant features that are widely used today.

Focus on:
1. Major architectural changes
2. New data types or significant improvements to existing ones
3. New security features
4. Performance improvements that fundamentally changed how PostgreSQL works
5. New APIs or significant changes to existing ones

Examples of important features:
- Introduction of Row Level Security (RLS)
- Introduction of JSONB data type
- Introduction of Logical Replication
- Introduction of Parallel Query
- Introduction of Point-in-Time Recovery

Examples of insignificant features:
 "Enforces row-level security policies correctly in set-returning functions.",
  "Supports RSA-PSS certificates with SCRAM-SHA-256 channel binding for enhanced security.",
  "Improves logical replication by ignoring dropped columns during updates."
    "Enhancements to Row Level Security (RLS) for tighter data access control.",
  "Improved handling of user permissions in RLS policy expressions.",
  "Tightened validation for SCRAM-SHA-256 and MD5 password formats."
    "Partitioning improvements enhance performance for large partitioned tables.",
  "GSSAPI encryption supports secure TCP/IP connections for better security.",
  "Multi-column statistics improve query optimization for non-uniformly distributed data."
  

Ignore:
- Bug fixes
- Minor performance improvements
- Documentation updates
- Platform-specific changes
- Deprecated features

{'This is a major release, so you most find at least 1 significant feature, but dont feel obliged to return more than 1. It is preferred to return less features.' if is_first_release else 'This is a minor release, \
    so dont hesitate to say no significant features. Please do not return any features that are not significant or widely used today.'}

Here are some good bulletpoint examples:
- Merge command for SQL standard MERGE
- Support for JSONB subscripting
- Just-in-time (JIT) compilation for expressions
- Introduced transaction isolation levels
- Added logical replication 

Keep them short and concise, max 10 words

Release notes:
{content}

PLEASE ONLY RETURN VERY VERY IMPORTANT FEATURES THAT ARE VERY WIDELY USED TODAY.
PLEASE RETURN ONLY FEATURES THE AVERAGE POSTGRESQL USER WOULD CARE ABOUT.
PLEASE RETURN FEW FEATURES, MAX 3 IF THEY ARE ALL IMPORTANT, BUT PREFERABLY LESS.

There are over 500 releases, so please be strict with what you return.

Analyze the release and provide a structured response with:
1. Whether this release contains any significant features that are widely used today
2. If yes, give 1 bulletpoint per feature to briefly describe it but dont explain its use, just the fact that it was added, max of 3 features but you dont have to use all 3, it would be better to return less features (1-2). It's preferred to return less features
3. Each feature description should be 10 words maximum
"""

    try:
        completion = await client.beta.chat.completions.parse(
            model="o3-mini-2025-01-31",
            messages=[
                {"role": "system", "content": "You are a PostgreSQL expert focused on identifying historically significant features."},
                {"role": "user", "content": prompt}
            ],
            response_format=PostgresReleaseAnalysis,
        )
        
        analysis = completion.choices[0].message.parsed
        
        if not analysis.has_significant_features:
            return None
            
        # Convert features to bullet points
        features = [f.bulletpoint for f in analysis.features]
        return features
        
    except Exception as e:
        logger.error(f"Error analyzing content with OpenAI: {e}")
        return None

async def process_release(version: str, major_version: str, is_first_release: bool, release_date: str, content: str, conn):
    """Process a single release asynchronously."""
    logger.info(f"Processing release {version}")
    
    features = await analyze_release_content(content, is_first_release)
    
    if features:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO postgres_features 
                        (version, major_version, is_first_release, release_date, features)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (version) DO UPDATE SET
                        features = EXCLUDED.features
                """, (version, major_version, is_first_release, release_date, features))
            
            conn.commit()
            logger.success(f"Successfully processed features for version {version}")
        except Exception as e:
            logger.error(f"Failed to store features for {version}: {e}")
            conn.rollback()
    else:
        logger.info(f"No significant features found for version {version}")

async def process_releases():
    try:
        with get_db_connection() as conn:
            create_features_table(conn)
            
            # Get all releases
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT version, major_version, is_first_release, release_date, content
                    FROM postgres_releases
                    ORDER BY release_date DESC
                """)
                
                releases = cur.fetchall()
                logger.info(f"Found {len(releases)} releases to process")
                
                # Process releases concurrently with a semaphore to limit concurrent requests
                semaphore = asyncio.Semaphore(5)  # Limit to 5 concurrent requests
                
                async def process_with_semaphore(release):
                    async with semaphore:
                        await process_release(*release, conn)
                
                # Create tasks for all releases
                tasks = [process_with_semaphore(release) for release in releases]
                
                # Wait for all tasks to complete
                await asyncio.gather(*tasks)
                    
    except Exception as e:
        logger.error(f"Error processing releases: {e}")
        raise

async def main():
    logger.info("Starting PostgreSQL feature analysis...")
    try:
        await process_releases()
        logger.success("Feature analysis completed successfully!")
    except Exception as e:
        logger.error(f"Feature analysis failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 