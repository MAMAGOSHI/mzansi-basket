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
    "search": "bread"
}

response = requests.get(
    url,
    headers=headers,
    params=params
)

print("Status:", response.status_code)

data = response.json()

products = data.get("data", [])

print()
print("PRODUCT RESULTS")
print("============================")

for product in products:

    print()
    print("Product:", product.get("name"))
    print("Barcode:", product.get("barcode"))

    offers = product.get("offers", [])

    for offer in offers:

        retailer = offer.get("retailer")
        price = offer.get("price")

        print(
            "   ",
            retailer,
            "→ R" + str(price)
        )

    print(
        "Cheapest:",
        product.get("cheapest_retailer")
    )

    print(
        "Lowest price: R",
        product.get("min_price")
    )