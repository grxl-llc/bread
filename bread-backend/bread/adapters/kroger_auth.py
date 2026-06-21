import os
import httpx
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class KrogerAuth:
    TOKEN_URL = "https://api.kroger.com/v1/connect/oauth2/token"

    def __init__(self):
        self.client_id = os.getenv("KROGER_CLIENT_ID")
        self.client_secret = os.getenv("KROGER_CLIENT_SECRET")

    async def get_token(self):
        if not self.client_id or not self.client_secret:
            raise ValueError("Kroger client ID or secret missing from environment variables.")

        data = {
            "grant_type": "client_credentials",
            "scope": "product.compact"
        }

        auth = (self.client_id, self.client_secret)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data=data,
                auth=auth,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            response.raise_for_status()
            token_data = response.json()
            return token_data["access_token"]
