import httpx


class WalmartAPIAdapter:
    URL = "https://www.walmart.com/orchestra/home/graphql"

    async def search(self, query: str):
        payload = {
            "operationName": "Search",
            "variables": {
                "query": query,
                "page": 1,
                "limit": 20,
                "sort": "relevance",
            },
            "query": """
            query Search($query: String!, $page: Int, $limit: Int, $sort: String) {
              search(query: $query, page: $page, limit: $limit, sort: $sort) {
                items {
                  usItemId
                  name
                  priceInfo {
                    currentPrice {
                      price
                    }
                  }
                }
              }
            }
            """
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            ),
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(self.URL, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
