import os
from dotenv import load_dotenv
import httpx

load_dotenv()

client_id = os.getenv("KROGER_CLIENT_ID")
client_secret = os.getenv("KROGER_CLIENT_SECRET")

print("Loaded ID:", client_id)
print("Loaded SECRET:", client_secret)

data = {
    "grant_type": "client_credentials",
    "scope": "product.compact"
}

auth = (client_id, client_secret)

response = httpx.post(
    "https://api.kroger.com/v1/connect/oauth2/token",
    data=data,
    auth=auth,
    headers={"Content-Type": "application/x-www-form-urlencoded"}
)

print("STATUS:", response.status_code)
print("BODY:", response.text)
