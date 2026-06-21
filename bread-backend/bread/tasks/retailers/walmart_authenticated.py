class WalmartAdapter:
    def __init__(self):
        # TODO: initialize with API keys, tokens, etc.
        raise NotImplementedError("Authenticated Walmart API not implemented yet")

    def search_product(self, query: str, zip_code: str):
        raise NotImplementedError("Authenticated Walmart search not implemented yet")

    def get_price(self, product_external_id: str, zip_code: str):
        raise NotImplementedError("Authenticated Walmart price fetch not implemented yet")
