from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
import requests
import os
import json
import base64


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()


# ==========================================
# CREATE FLASK APP
# ==========================================

app = Flask(__name__)


# ==========================================
# API KEYS
# ==========================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LOYALTYHUB_API_KEY = os.getenv("LOYALTYHUB_API_KEY")


# ==========================================
# GEMINI
# ==========================================

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ==========================================
# LOYALTY HUB
# ==========================================

LOYALTYHUB_URL = (
    "https://loyaltyhub.co.za/api/v1/products"
)


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():

    return render_template("index.html")


# ==========================================
# LOYALTY HUB SEARCH
# ==========================================

def search_loyaltyhub(product_name):

    headers = {

        "Authorization":
            "Bearer " + LOYALTYHUB_API_KEY

    }

    params = {

        "search": product_name

    }

    try:

        response = requests.get(

            LOYALTYHUB_URL,

            headers=headers,

            params=params,

            timeout=15

        )

        if response.status_code != 200:

            return {

                "success": False,

                "error":
                    "Loyalty Hub returned status "
                    + str(response.status_code),

                "offers": []

            }


        data = response.json()


        return {

            "success": True,

            "offers":
                data.get("data", [])

        }


    except requests.exceptions.RequestException as error:

        return {

            "success": False,

            "error": str(error),

            "offers": []

        }


# ==========================================
# MANUAL PRODUCT SEARCH
# ==========================================

@app.route(
    "/compare",
    methods=["POST"]
)
def compare():

    data = request.get_json()


    if not data or "product" not in data:

        return jsonify({

            "success": False,

            "error":
                "Please enter a product."

        }), 400


    product_name = data["product"].strip()


    if not product_name:

        return jsonify({

            "success": False,

            "error":
                "Product name cannot be empty."

        }), 400


    # Search Loyalty Hub
    result = search_loyaltyhub(
        product_name
    )


    if not result["success"]:

        return jsonify({

            "success": False,

            "error":
                result["error"]

        }), 500


    products = result["offers"]


    # ======================================
    # TRY SHORTER SEARCH
    # ======================================

    if not products:

        words = product_name.split()


        if len(words) > 3:

            shorter_search = " ".join(
                words[:3]
            )


            result = search_loyaltyhub(
                shorter_search
            )


            products = result["offers"]


    # ======================================
    # NO PRODUCTS
    # ======================================

    if not products:

        return jsonify({

            "success": False,

            "error":
                "No products were found. "
                "Try a different product name."

        })


    # ======================================
    # PROCESS MULTIPLE PRODUCTS
    # ======================================

    product_results = []


    for product in products:

        offers = product.get(
            "offers",
            []
        )


        retailer_prices = []


        for offer in offers:

            price = offer.get("price")


            if price is None:

                continue


            try:

                price = float(price)

            except:

                continue


            retailer_prices.append({

                "retailer":
                    offer.get(
                        "retailer",
                        "Unknown"
                    ),

                "price":
                    price,

                "currency":
                    offer.get(
                        "currency",
                        "ZAR"
                    ),

                "in_stock":
                    offer.get(
                        "in_stock"
                    ),

                "last_seen_at":
                    offer.get(
                        "last_seen_at"
                    )

            })


        # Skip products without prices
        if not retailer_prices:

            continue


        # Find cheapest retailer
        cheapest = min(

            retailer_prices,

            key=lambda x: x["price"]

        )


        # Find most expensive retailer
        most_expensive = max(

            retailer_prices,

            key=lambda x: x["price"]

        )


        # Calculate saving
        potential_saving = round(

            most_expensive["price"]
            - cheapest["price"],

            2

        )


        product_results.append({

            "name":
                product.get(
                    "name"
                ),

            "barcode":
                product.get(
                    "barcode"
                ),

            "image_url":
                product.get(
                    "image_url"
                ),

            "prices":
                retailer_prices,

            "cheapest":
                cheapest,

            "potential_saving":
                potential_saving

        })


    # ======================================
    # NO PRODUCTS WITH PRICES
    # ======================================

    if not product_results:

        return jsonify({

            "success": False,

            "error":
                "Products were found, "
                "but no retailer prices were available."

        })


    # ======================================
    # RETURN ALL PRODUCTS
    # ======================================

    return jsonify({

        "success": True,

        "products":
            product_results,

        "source":
            "Prices via Loyalty Hub"

    })


# ==========================================
# RECEIPT IMAGE ANALYSIS
# ==========================================

def extract_receipt(image_bytes, mime_type):

    image_base64 = base64.b64encode(
        image_bytes
    ).decode("utf-8")


    prompt = """
You are a receipt-reading assistant.

Read the receipt image and extract the grocery information.

Return ONLY valid JSON in this format:

{
    "store": "store name",
    "items": [
        {
            "name": "product name",
            "price": 0.00,
            "quantity": 1
        }
    ],
    "total": 0.00
}

Rules:

1. Use simple product names.
2. Include the price paid for each product.
3. Include quantity when visible.
4. If quantity is not visible, use 1.
5. Do not include JSON markdown.
6. Do not add explanations.
"""


    response = gemini_client.models.generate_content(

        model="gemini-3.5-flash-lite",

        contents=[

            {
                "inline_data": {

                    "mime_type":
                        mime_type,

                    "data":
                        image_base64

                }

            },

            prompt

        ]

    )


    result = response.text.strip()


    result = result.replace(
        "```json",
        ""
    )


    result = result.replace(
        "```",
        ""
    )


    return json.loads(
        result.strip()
    )


# ==========================================
# RECEIPT PRICE COMPARISON
# ==========================================

def compare_prices(receipt_items):

    comparison = []


    for item in receipt_items:

        product_name = item["name"]


        receipt_price = float(
            item.get(
                "price",
                0
            )
        )


        result = search_loyaltyhub(
            product_name
        )


        products = result["offers"]


        if not products:

            comparison.append({

                "product":
                    product_name,

                "receipt_price":
                    receipt_price,

                "cheapest_retailer":
                    "No price found",

                "cheapest_price":
                    None,

                "saving":
                    0,

                "offers":
                    []

            })

            continue


        product = products[0]


        offers = product.get(
            "offers",
            []
        )


        cheapest = None


        for offer in offers:

            try:

                price = float(
                    offer.get(
                        "price",
                        0
                    )
                )

            except:

                continue


            if price <= 0:

                continue


            if (
                cheapest is None
                or price < cheapest["price"]
            ):

                cheapest = {

                    "retailer":
                        offer.get(
                            "retailer",
                            "Unknown"
                        ),

                    "price":
                        price

                }


        if cheapest:

            saving = max(

                0,

                receipt_price
                - cheapest["price"]

            )


            comparison.append({

                "product":
                    product_name,

                "receipt_price":
                    receipt_price,

                "cheapest_retailer":
                    cheapest["retailer"],

                "cheapest_price":
                    cheapest["price"],

                "saving":
                    round(
                        saving,
                        2
                    ),

                "offers":
                    offers

            })


    return comparison


# ==========================================
# DASHBOARD
# ==========================================

def calculate_dashboard(comparison):

    receipt_total = 0

    potential_saving = 0

    retailer_totals = {}


    for item in comparison:

        receipt_total += (
            item["receipt_price"]
        )


        potential_saving += (
            item["saving"]
        )


        retailer = (
            item["cheapest_retailer"]
        )


        if retailer != "No price found":

            if retailer not in retailer_totals:

                retailer_totals[retailer] = 0


            if item["cheapest_price"] is not None:

                retailer_totals[retailer] += (
                    item["cheapest_price"]
                )


    cheapest_overall = None


    if retailer_totals:

        cheapest_overall = min(

            retailer_totals,

            key=retailer_totals.get

        )


    return {

        "receipt_total":
            round(
                receipt_total,
                2
            ),

        "potential_saving":
            round(
                potential_saving,
                2
            ),

        "items_analysed":
            len(comparison),

        "cheapest_overall":
            cheapest_overall,

        "retailer_totals":
            retailer_totals

    }


# ==========================================
# RECEIPT ROUTE
# ==========================================

@app.route(
    "/analyse",
    methods=["POST"]
)
def analyse():

    if "receipt" not in request.files:

        return jsonify({

            "success": False,

            "error":
                "Please upload a receipt."

        }), 400


    file = request.files["receipt"]


    if file.filename == "":

        return jsonify({

            "success": False,

            "error":
                "No receipt selected."

        }), 400


    try:

        image_bytes = file.read()

        mime_type = file.content_type


        receipt = extract_receipt(

            image_bytes,

            mime_type

        )


        comparison = compare_prices(

            receipt["items"]

        )


        dashboard = calculate_dashboard(

            comparison

        )


        return jsonify({

            "success": True,

            "receipt":
                receipt,

            "comparison":
                comparison,

            "dashboard":
                dashboard,

            "source":
                "Prices via Loyalty Hub"

        })


    except Exception as error:

        return jsonify({

            "success": False,

            "error":
                str(error)

        }), 500


# ==========================================
# SENTIMENT ANALYSIS
# ==========================================

def analyze_sentiment(review):

    prompt = """
Analyse the sentiment of this grocery product review.

Return ONLY valid JSON:

{
    "sentiment": "Positive",
    "score": 0.85,
    "summary": "Short explanation"
}

Sentiment must be one of:

Positive
Neutral
Negative

Score must be between -1 and 1.

Review:
""" + review


    try:

        response = gemini_client.models.generate_content(

            model="gemini-3.5-flash-lite",

            contents=prompt

        )


        result = response.text.strip()


        result = result.replace(
            "```json",
            ""
        )


        result = result.replace(
            "```",
            ""
        )


        return json.loads(
            result.strip()
        )


    except Exception:

        return {

            "sentiment":
                "Neutral",

            "score":
                0,

            "summary":
                "Unable to analyse the review."

        }


@app.route(
    "/sentiment",
    methods=["POST"]
)
def sentiment():

    data = request.get_json()


    if not data or "review" not in data:

        return jsonify({

            "success": False,

            "error":
                "Please provide a review."

        }), 400


    review = data["review"].strip()


    if not review:

        return jsonify({

            "success": False,

            "error":
                "Review cannot be empty."

        }), 400


    result = analyze_sentiment(
        review
    )


    return jsonify({

        "success": True,

        "sentiment":
            result

    })


# ==========================================
# START APP
# ==========================================

if __name__ == "__main__":

    app.run(

        debug=True,

        host="127.0.0.1",

        port=5050

    )