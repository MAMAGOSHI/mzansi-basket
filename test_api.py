import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("LOYALTYHUB_API_KEY")

url = "https://loyaltyhub.co.za/api/v1/products"

headers = {
    "Authorization": "Bearer " + API_KEY
}

params = {
    "search": "milk"
}

response = requests.get(
    url,
    headers=headers,
    params=params
)

print("Status:", response.status_code)
print("Response:")
print(response.text)