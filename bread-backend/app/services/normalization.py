import re
from typing import Optional, Tuple
from app.schemas import NormalizedPrice


# -----------------------------
# PRICE PARSING
# -----------------------------
def parse_price(price_raw: str) -> Optional[float]:
    """
    Convert raw price strings like "$3.49" or "USD 3.49" into a float.
    """
    if not price_raw:
        return None

    cleaned = re.sub(r"[^0-9\.,]", "", price_raw)
    cleaned = cleaned.replace(",", ".")

    try:
        return float(cleaned)
    except ValueError:
        return None


# -----------------------------
# SIZE PARSING
# -----------------------------
def parse_size(size_raw: str) -> Tuple[Optional[float], Optional[str]]:
    """
    Extract numeric amount + unit type from strings like:
    "16 oz", "1 lb", "12 fl oz", "500 g", "1 kg", "2 ct"
    """
    if not size_raw:
        return None, None

    s = size_raw.lower().strip()

    patterns = [
        (r"(\d+(\.\d+)?)\s*fl\s*oz", "fl_oz"),
        (r"(\d+(\.\d+)?)\s*oz", "oz"),
        (r"(\d+(\.\d+)?)\s*lb", "lb"),
        (r"(\d+(\.\d+)?)\s*g", "g"),
        (r"(\d+(\.\d+)?)\s*kg", "kg"),
        (r"(\d+(\.\d+)?)\s*ml", "ml"),
        (r"(\d+(\.\d+)?)\s*l", "l"),
        (r"(\d+(\.\d+)?)\s*(ct|count)", "count"),
    ]

    for pattern, unit in patterns:
        m = re.search(pattern, s)
        if m:
            amount = float(m.group(1))
            return amount, unit

    return None, None


# -----------------------------
# UNIT CONVERSION → BASE UNITS
# -----------------------------
def to_base_units(amount: float, unit_type: str) -> Tuple[Optional[float], Optional[str]]:
    """
    Convert to base units:
    - g for weight
    - ml for volume
    - count for items
    """
    if amount is None or unit_type is None:
        return None, None

    unit_type = unit_type.lower()

    if unit_type == "g":
        return amount, "g"
    if unit_type == "kg":
        return amount * 1000.0, "g"
    if unit_type == "oz":
        return amount * 28.3495, "g"
    if unit_type == "lb":
        return amount * 453.592, "g"

    if unit_type == "ml":
        return amount, "ml"
    if unit_type == "l":
        return amount * 1000.0, "ml"
    if unit_type == "fl_oz":
        return amount * 29.5735, "ml"

    if unit_type == "count":
        return amount, "count"

    return None, None


# -----------------------------
# PRICE PER BASE UNIT
# -----------------------------
def compute_price_per_base_unit(price: float, base_amount: float, base_unit: str) -> Optional[float]:
    """
    Compute normalized price per 100g or per 100ml.
    """
    if price is None or base_amount is None or base_unit is None:
        return None

    if base_unit in ("g", "ml"):
        if base_amount == 0:
            return None
        return price / (base_amount / 100.0)

    if base_unit == "count":
        if base_amount == 0:
            return None
        return price / base_amount

    return None


# -----------------------------
# GLUE FUNCTION
# -----------------------------
def normalize_price_record(
    retailer: str,
    retailer_product_id: str,
    name: str,
    price_raw: str,
    size_raw: str,
    source: str,
    bread_sku: Optional[str] = None,
    retailer_product_url: Optional[str] = None,
) -> NormalizedPrice:
    """
    Convert raw scraped/API data into a NormalizedPrice object.
    """
    price = parse_price(price_raw)
    amount, unit_type = parse_size(size_raw)
    base_amount, base_unit = to_base_units(amount, unit_type)
    price_per_base_unit = compute_price_per_base_unit(price, base_amount, base_unit)

    return NormalizedPrice(
        bread_sku=bread_sku,
        retailer=retailer,
        retailer_product_id=retailer_product_id,
        retailer_product_url=retailer_product_url,
        name=name,
        size_raw=size_raw,
        unit_amount=base_amount,
        unit_type=base_unit,
        price_raw=price_raw,
        price=price,
        price_per_base_unit=price_per_base_unit,
        source=source,
    )
