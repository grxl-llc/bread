from apscheduler.schedulers.background import BackgroundScheduler
from bread.tasks.walmart_fetcher import fetch_walmart_prices
from bread.tasks.kroger_fetcher import fetch_kroger_prices
from bread.tasks.target_fetcher import fetch_target_prices

scheduler = BackgroundScheduler()

def start_scheduler():
    # Run each fetcher once every 24 hours
    scheduler.add_job(fetch_walmart_prices, "interval", hours=24)
    scheduler.add_job(fetch_kroger_prices, "interval", hours=24)
    scheduler.add_job(fetch_target_prices, "interval", hours=24)

    scheduler.start()
