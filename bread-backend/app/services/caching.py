import time

CACHE = {}

def cache_get(key):
    entry = CACHE.get(key)
    if not entry:
        return None
    value, expires_at = entry
    if time.time() > expires_at:
        del CACHE[key]
        return None
    return value

def cache_set(key, value, ttl_seconds):
    CACHE[key] = (value, time.time() + ttl_seconds)
