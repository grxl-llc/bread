from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables (.env)
load_dotenv()

from bread.database import Base, engine

# Routers
from bread.routers import (
    household,
    ingredients,
    pantry,
    pricing,
    products,
    product_prices,
    recipes,
    stores,
    users,
    walmart,
    instacart,
    basket,
    target,
    kroger,  # ⭐ NEW
)

# Create DB tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bread Backend",
    version="1.0.0",
)

# CORS (allow frontend to call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust later for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(household.router)
app.include_router(ingredients.router)
app.include_router(pantry.router)
app.include_router(pricing.router)
app.include_router(products.router)
app.include_router(product_prices.router)
app.include_router(recipes.router)
app.include_router(stores.router)
app.include_router(users.router)

# Optional / legacy scrapers
app.include_router(walmart.router)
app.include_router(instacart.router)
app.include_router(basket.router)

# Official API integrations
app.include_router(target.router)
app.include_router(kroger.router)  # ⭐ NEW

# Google Shopping
from bread.routers.google_shopping import router as google_router
app.include_router(google_router)

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}
