import re

# ---------------------------------------------------------
# UNIT CONVERSION TABLE
# ---------------------------------------------------------

UNIT_CONVERSIONS = {
    "oz": ("g", 28.3495),
    "lb": ("g", 453.592),
    "lbs": ("g", 453.592),
    "g": ("g", 1),
    "kg": ("g", 1000),

    "fl oz": ("ml", 29.5735),
    "floz": ("ml", 29.5735),
    "ml": ("ml", 1),
    "l": ("ml", 1000),

    "cup": ("ml", 240),
    "cups": ("ml", 240),
    "pt": ("ml", 473.176),
    "pint": ("ml", 473.176),
    "qt": ("ml", 946.353),
    "quart": ("ml", 946.353),
    "gal": ("ml", 3785.41),
    "gallon": ("ml", 3785.41),
}

# ---------------------------------------------------------
# PARSE SIZE STRING
# ---------------------------------------------------------

def parse_size(size_str: str):
    """
    Convert size strings like '1 gal', '16 oz', '12 fl oz' into (amount, unit).
    Returns (None, None) if parsing fails.
    """
    if not size_str:
        return None, None

    size_str = size_str.lower().strip()

    match = re.match(r"([\d\.]+)\s*([a-zA-Z ]+)", size_str)
    if not match:
        return None, None

    amount = float(match.group(1))
    unit = match.group(2).strip()

    # Normalize unit variations
    unit = unit.replace(".", "")
    unit = unit.replace("fluid", "fl")
    unit = unit.replace("ounce", "oz")
    unit = unit.replace("ounces", "oz")

    # Handle fl oz variations
    if unit in ["fl oz", "floz", "fl"]:
        unit = "fl oz"

    if unit not in UNIT_CONVERSIONS:
        return None, None

    return amount, unit

# ---------------------------------------------------------
# NORMALIZE UNIT TO BASE UNIT
# ---------------------------------------------------------

def normalize_unit(amount, unit):
    """
    Convert (amount, unit) into base units (g or ml).
    """
    if not amount or not unit:
        return None, None

    base_unit, multiplier = UNIT_CONVERSIONS[unit]
    normalized_amount = amount * multiplier

    return normalized_amount, base_unit

# ---------------------------------------------------------
# PRICE PER UNIT
# ---------------------------------------------------------

def calculate_price_per_unit(price, normalized_amount):
    """
    Compute price per base unit.
    """
    if not price or not normalized_amount:
        return None

    return price / normalized_amount
