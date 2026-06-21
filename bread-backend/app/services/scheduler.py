"""
Background price-fetch scheduler using APScheduler.
Runs Kroger, Walmart, and Target adapters on a 24-hour cycle.
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler

log = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

SAMPLE_QUERIES = [
    "chicken breast", "ground beef", "salmon", "eggs", "milk",
    "butter", "flour", "sugar", "olive oil", "pasta",
    "tomatoes", "onions", "garlic", "potatoes", "bread",
]

SAMPLE_ZIP = "27576"


def _run_kroger_fetch():
    """Sync wrapper — APScheduler doesn't support async jobs directly."""
    import asyncio
    from app.database import SessionLocal
    from bread.tasks.kroger_fetcher import fetch_kroger_prices

    db = SessionLocal()
    try:
        for query in SAMPLE_QUERIES:
            try:
                asyncio.run(fetch_kroger_prices(query, db, SAMPLE_ZIP))
            except Exception as e:
                log.warning("Kroger fetch failed for %s: %s", query, e)
    finally:
        db.close()


def _run_target_fetch():
    import asyncio
    from app.database import SessionLocal
    from bread.tasks.target_fetcher import fetch_target_prices

    db = SessionLocal()
    try:
        for query in SAMPLE_QUERIES:
            try:
                asyncio.run(fetch_target_prices(query, db, SAMPLE_ZIP))
            except Exception as e:
                log.warning("Target fetch failed for %s: %s", query, e)
    finally:
        db.close()


def _run_walmart_fetch():
    import asyncio
    from bread.tasks.walmart_fetcher import fetch_walmart_prices
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        for query in SAMPLE_QUERIES:
            try:
                asyncio.run(fetch_walmart_prices(query, db))
            except Exception as e:
                log.warning("Walmart fetch failed for %s: %s", query, e)
    finally:
        db.close()


def start_scheduler():
    if scheduler.running:
        return

    scheduler.add_job(_run_kroger_fetch, "interval", hours=24, id="kroger_fetch",
                      max_instances=1, misfire_grace_time=3600)
    scheduler.add_job(_run_target_fetch, "interval", hours=24, id="target_fetch",
                      max_instances=1, misfire_grace_time=3600)
    scheduler.add_job(_run_walmart_fetch, "interval", hours=24, id="walmart_fetch",
                      max_instances=1, misfire_grace_time=3600)

    scheduler.start()
    log.info("Price fetch scheduler started (24h interval)")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
