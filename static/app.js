
document.addEventListener(
    "DOMContentLoaded",
    function () {


        console.log(
            "Mzansi Basket JavaScript loaded successfully."
        );


        // =====================================================
        // HELPER FUNCTIONS
        // =====================================================

        function formatCurrency(value) {

            const number =
                Number(value) || 0;

            return "R" +
                number.toFixed(2);

        }


        function formatRetailerName(name) {

            const retailers = {

                "pnp": "Pick n Pay",

                "picknpay": "Pick n Pay",

                "pick n pay": "Pick n Pay",

                "checkers": "Checkers",

                "shoprite": "Shoprite",

                "woolworths": "Woolworths",

                "makro": "Makro",

                "clicks": "Clicks",

                "dischem": "Dis-Chem",

                "dis-chem": "Dis-Chem"

            };


            const key =
                String(name || "")
                    .trim()
                    .toLowerCase();


            return retailers[key] ||
                String(name || "Unknown Retailer");
        }


        function showError(elementId, message) {

            const element =
                document.getElementById(
                    elementId
                );


            if (!element) {
                return;
            }


            element.textContent =
                message;


            element.classList.remove(
                "hidden"
            );
        }


        function hideError(elementId) {

            const element =
                document.getElementById(
                    elementId
                );


            if (!element) {
                return;
            }


            element.textContent = "";

            element.classList.add(
                "hidden"
            );
        }



        // =====================================================
        // MANUAL PRODUCT SEARCH
        // =====================================================

        const searchButton =
            document.getElementById(
                "searchButton"
            );


        const productSearch =
            document.getElementById(
                "productSearch"
            );


        if (searchButton) {

            searchButton.addEventListener(
                "click",
                searchProduct
            );

        }


        if (productSearch) {

            productSearch.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        searchProduct();

                    }

                }
            );

        }


        async function searchProduct() {

            const query =
                productSearch
                ? productSearch.value.trim()
                : "";


            hideError(
                "searchError"
            );


            const results =
                document.getElementById(
                    "productResults"
                );


            if (!query) {

                showError(
                    "searchError",
                    "Please enter a grocery product."
                );

                return;
            }


            searchButton.disabled = true;

            searchButton.textContent =
                "Searching...";


            if (results) {

                results.innerHTML = "";

            }


            try {

                const response =
                    await fetch(
                        "/compare",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                product: query
                            })

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to compare prices."
                    );

                }


                displayProductResults(
                    data
                );


            } catch (error) {

                console.error(
                    "Product search error:",
                    error
                );


                showError(
                    "searchError",
                    error.message ||
                    "Something went wrong while searching."
                );


            } finally {

                searchButton.disabled = false;

                searchButton.textContent =
                    "Compare Prices";

            }

        }



        function displayProductResults(data) {

            const results =
                document.getElementById(
                    "productResults"
                );


            if (!results) {
                return;
            }


            results.innerHTML = "";


            const products =
                Array.isArray(data.products)
                ? data.products
                : [];


            if (products.length === 0) {

                showError(
                    "searchError",
                    "No matching products were found."
                );

                return;

            }


            products.forEach(
                function (product, index) {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "product-card";


                    const prices =
                        Array.isArray(
                            product.prices
                        )
                        ? product.prices
                        : [];


                    const cleanPrices =
                        prices
                            .map(function (item) {

                                return {

                                    retailer:
                                        item.retailer,

                                    price:
                                        Number(
                                            item.price
                                        ) || 0

                                };

                            })
                            .filter(function (item) {

                                return item.price > 0;

                            });


                    if (
                        cleanPrices.length === 0
                    ) {

                        return;

                    }


                    const lowest =
                        Math.min(
                            ...cleanPrices.map(
                                function (item) {
                                    return item.price;
                                }
                            )
                        );


                    const highest =
                        Math.max(
                            ...cleanPrices.map(
                                function (item) {
                                    return item.price;
                                }
                            )
                        );


                    let imageHtml = "";


                    if (
                        product.image_url
                    ) {

                        imageHtml =

                            '<div class="product-image-wrapper">' +

                                '<img ' +

                                    'src="' +
                                    product.image_url +
                                    '" ' +

                                    'alt="' +
                                    (product.name || "Product") +
                                    '" ' +

                                    'class="product-image" ' +

                                    'loading="lazy"' +

                                '>' +

                            '</div>';

                    } else {

                        imageHtml =

                            '<div class="product-image-wrapper">' +

                                '<span>🛒</span>' +

                            '</div>';

                    }


                    let priceRows = "";


                    cleanPrices.forEach(
                        function (item) {

                            const isCheapest =
                                item.price === lowest;


                            priceRows +=

                                '<div class="price-row">' +

                                    '<div class="price-row-left">' +

                                        '<strong>' +

                                            formatRetailerName(
                                                item.retailer
                                            ) +

                                        '</strong>' +

                                        (
                                            isCheapest
                                            ?
                                            '<span class="cheapest-badge">CHEAPEST</span>'
                                            :
                                            ''
                                        ) +

                                    '</div>' +

                                    '<span class="price-value">' +

                                        formatCurrency(
                                            item.price
                                        ) +

                                    '</span>' +

                                '</div>';

                        }
                    );


                    const saving =
                        Math.max(
                            0,
                            highest - lowest
                        );


                    card.innerHTML =

                        '<div class="product-top">' +

                            imageHtml +

                            '<div class="product-info">' +

                                '<h4>' +

                                    (
                                        product.name ||
                                        "Product"
                                    ) +

                                '</h4>' +

                                '<div class="product-meta">' +

                                    (
                                        product.barcode
                                        ?
                                        "Barcode: " +
                                        product.barcode
                                        :
                                        "Loyalty Hub match"
                                    ) +

                                '</div>' +

                            '</div>' +

                        '</div>' +


                        '<div class="price-list">' +

                            priceRows +

                        '</div>' +


                        '<div class="product-saving">' +

                            (
                                saving > 0
                                ?
                                "Potential saving: " +
                                formatCurrency(saving)
                                :
                                "Prices are currently the same across available retailers."
                            ) +

                        '</div>' +


                        '<div class="product-chart-section">' +

                            '<h5>Retailer price comparison</h5>' +

                            '<div class="product-chart-container">' +

                                '<canvas id="productChart' +
                                index +
                                '"></canvas>' +

                            '</div>' +

                        '</div>';


                    results.appendChild(
                        card
                    );


                    createProductPriceChart(
                        "productChart" + index,
                        cleanPrices
                    );

                }
            );


            results.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }



        // =====================================================
        // PRODUCT PRICE CHART
        // =====================================================

        function createProductPriceChart(
            canvasId,
            prices
        ) {

            const canvas =
                document.getElementById(
                    canvasId
                );


            if (
                !canvas ||
                !window.Chart
            ) {

                return;

            }


            const labels = [];

            const values = [];


            prices.forEach(
                function (price) {

                    labels.push(
                        formatRetailerName(
                            price.retailer
                        )
                    );


                    values.push(
                        Number(price.price) || 0
                    );

                }
            );


            if (
                labels.length === 0
            ) {

                return;

            }


            const sortedValues =
                [...values].sort(
                    function (a, b) {
                        return a - b;
                    }
                );


            const backgroundColors =
                values.map(
                    function (value) {

                        const rank =
                            sortedValues.indexOf(
                                value
                            );


                        if (
                            rank === 0
                        ) {

                            // Cheapest
                            return "#2f8f6b";

                        }


                        if (
                            rank ===
                            sortedValues.length - 1
                        ) {

                            // Most expensive
                            return "#d9534f";

                        }


                        if (
                            rank ===
                            sortedValues.length - 2
                        ) {

                            // Expensive
                            return "#e58f3a";

                        }


                        // Moderate
                        return "#4c8fc7";

                    }
                );


            new Chart(
                canvas,
                {

                    type: "bar",

                    data: {

                        labels: labels,

                        datasets: [

                            {

                                label:
                                    "Price",

                                data:
                                    values,

                                backgroundColor:
                                    backgroundColors,

                                borderRadius: 7,

                                borderSkipped:
                                    false

                            }

                        ]

                    },


                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {
                                display: false
                            },

                            tooltip: {

                                callbacks: {

                                    label:
                                        function (
                                            context
                                        ) {

                                            return " " +
                                                formatCurrency(
                                                    context.raw
                                                );

                                        }

                                }

                            }

                        },


                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    callback:
                                        function (
                                            value
                                        ) {

                                            return "R" +
                                                value;

                                        }

                                }

                            },

                            x: {

                                grid: {
                                    display: false
                                }

                            }

                        }

                    }

                }
            );

        }



        // =====================================================
        // RECEIPT UPLOAD
        // =====================================================

        const receipt =
            document.getElementById(
                "receipt"
            );


        const selectedReceipt =
            document.getElementById(
                "selectedReceipt"
            );


        if (receipt) {

            receipt.addEventListener(
                "change",
                function () {

                    if (
                        receipt.files &&
                        receipt.files.length > 0
                    ) {

                        const file =
                            receipt.files[0];


                        if (
                            selectedReceipt
                        ) {

                            selectedReceipt.textContent =
                                "Selected receipt: " +
                                file.name;


                            selectedReceipt.classList.remove(
                                "hidden"
                            );

                        }

                    }

                }
            );

        }


        const receiptForm =
            document.getElementById(
                "receiptForm"
            );


        if (receiptForm) {

            receiptForm.addEventListener(
                "submit",
                analyseReceipt
            );

        }


        async function analyseReceipt(
            event
        ) {

            event.preventDefault();


            hideError(
                "receiptError"
            );


            if (
                !receipt ||
                !receipt.files ||
                receipt.files.length === 0
            ) {

                showError(
                    "receiptError",
                    "Please choose a receipt image first."
                );

                return;

            }


            const formData =
                new FormData();


            formData.append(
                "receipt",
                receipt.files[0]
            );


            const analyseButton =
                document.getElementById(
                    "analyseButton"
                );


            analyseButton.disabled =
                true;


            analyseButton.textContent =
                "Analysing receipt...";


            try {

                const response =
                    await fetch(
                        "/analyse",
                        {

                            method: "POST",

                            body:
                                formData

                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to analyse the receipt."
                    );

                }


                displayReceiptDashboard(
                    data
                );


            } catch (error) {

                console.error(
                    "Receipt error:",
                    error
                );


                showError(
                    "receiptError",
                    error.message ||
                    "Something went wrong while analysing the receipt."
                );


            } finally {

                analyseButton.disabled =
                    false;


                analyseButton.textContent =
                    "Analyse Receipt";

            }

        }



        function displayReceiptDashboard(
            data
        ) {

            const dashboard =
                document.getElementById(
                    "dashboard"
                );


            if (!dashboard) {
                return;
            }


            dashboard.classList.remove(
                "hidden"
            );


            const items =
                Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.receipt_items)
                ? data.receipt_items
                : [];


            const totalItems =
                document.getElementById(
                    "totalItems"
                );


            if (totalItems) {

                totalItems.textContent =
                    items.length;

            }


            const currentTotal =
                document.getElementById(
                    "currentTotal"
                );


            const total =
                Number(
                    data.current_total ??
                    data.total ??
                    data.receipt_total ??
                    0
                );


            if (currentTotal) {

                currentTotal.textContent =
                    formatCurrency(
                        total
                    );

            }


            const potentialSavings =
                document.getElementById(
                    "potentialSavings"
                );


            const savings =
                Math.max(
                    0,
                    Number(
                        data.potential_savings ??
                        data.savings ??
                        0
                    )
                );


            if (potentialSavings) {

                potentialSavings.textContent =
                    formatCurrency(
                        savings
                    );

            }


            displayComparisonTable(
                data
            );


            createStoreChart(
                data
            );


            createSavingChart(
                data
            );


            dashboard.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }



        // =====================================================
        // RECEIPT COMPARISON TABLE
        // =====================================================

        function displayComparisonTable(
            data
        ) {

            const tableContainer =
                document.getElementById(
                    "comparisonTable"
                );


            if (!tableContainer) {
                return;
            }


            const comparisons =
                Array.isArray(
                    data.comparisons
                )
                ? data.comparisons
                : Array.isArray(
                    data.items
                )
                ? data.items
                : [];


            if (
                comparisons.length === 0
            ) {

                tableContainer.innerHTML =
                    "<p class='product-meta'>No comparison details were returned.</p>";

                return;

            }


            let rows = "";


            comparisons.forEach(
                function (item) {

                    const name =
                        item.name ||
                        item.product ||
                        item.item ||
                        "Product";


                    const currentPrice =
                        Number(
                            item.current_price ??
                            item.receipt_price ??
                            item.price ??
                            0
                        );


                    const cheapest =
                        Number(
                            item.cheapest_price ??
                            item.lowest_price ??
                            item.best_price ??
                            0
                        );


                    const retailer =
                        item.cheapest_retailer ||
                        item.best_retailer ||
                        "";


                    rows +=

                        "<tr>" +

                            "<td>" +
                                name +
                            "</td>" +

                            "<td>" +
                                formatCurrency(
                                    currentPrice
                                ) +
                            "</td>" +

                            "<td class='table-cheapest'>" +

                                (
                                    cheapest > 0
                                    ?
                                    formatCurrency(
                                        cheapest
                                    )
                                    :
                                    "—"
                                ) +

                            "</td>" +

                            "<td>" +

                                (
                                    retailer
                                    ?
                                    formatRetailerName(
                                        retailer
                                    )
                                    :
                                    "—"
                                ) +

                            "</td>" +

                        "</tr>";

                }
            );


            tableContainer.innerHTML =

                "<div style='overflow-x:auto;'>" +

                    "<table class='comparison-table'>" +

                        "<thead>" +

                            "<tr>" +

                                "<th>Product</th>" +

                                "<th>Paid</th>" +

                                "<th>Best price</th>" +

                                "<th>Best retailer</th>" +

                            "</tr>" +

                        "</thead>" +

                        "<tbody>" +

                            rows +

                        "</tbody>" +

                    "</table>" +

                "</div>";

        }



        // =====================================================
        // RECEIPT STORE CHART
        // =====================================================

        function createStoreChart(
            data
        ) {

            const canvas =
                document.getElementById(
                    "storeChart"
                );


            if (
                !canvas ||
                !window.Chart
            ) {

                return;

            }


            if (
                window.mzansiStoreChart
            ) {

                window.mzansiStoreChart.destroy();

            }


            const retailers =
                data.retailer_totals ||
                data.store_totals ||
                data.retailer_comparison ||
                {};


            let labels = [];

            let values = [];


            if (
                retailers &&
                typeof retailers === "object" &&
                !Array.isArray(retailers)
            ) {

                Object.keys(
                    retailers
                ).forEach(
                    function (retailer) {

                        const value =
                            Number(
                                retailers[retailer]
                            );


                        if (
                            !isNaN(value)
                        ) {

                            labels.push(
                                formatRetailerName(
                                    retailer
                                )
                            );

                            values.push(
                                value
                            );

                        }

                    }
                );

            }


            if (
                labels.length === 0 &&
                Array.isArray(
                    data.retailer_totals
                )
            ) {

                data.retailer_totals.forEach(
                    function (item) {

                        labels.push(
                            formatRetailerName(
                                item.retailer
                            )
                        );

                        values.push(
                            Number(
                                item.total
                            ) || 0
                        );

                    }
                );

            }


            if (
                labels.length === 0
            ) {

                return;

            }


            window.mzansiStoreChart =
                new Chart(
                    canvas,
                    {

                        type: "bar",

                        data: {

                            labels: labels,

                            datasets: [

                                {

                                    label:
                                        "Basket total",

                                    data:
                                        values,

                                    backgroundColor:
                                        "#4c8fc7",

                                    borderRadius:
                                        7,

                                    borderSkipped:
                                        false

                                }

                            ]

                        },


                        options: {

                            responsive: true,

                            maintainAspectRatio:
                                false,

                            plugins: {

                                legend: {
                                    display: false
                                },

                                tooltip: {

                                    callbacks: {

                                        label:
                                            function (
                                                context
                                            ) {

                                                return " " +
                                                    formatCurrency(
                                                        context.raw
                                                    );

                                            }

                                    }

                                }

                            },


                            scales: {

                                y: {

                                    beginAtZero:
                                        true,

                                    ticks: {

                                        callback:
                                            function (
                                                value
                                            ) {

                                                return "R" +
                                                    value;

                                            }

                                    }

                                },

                                x: {

                                    grid: {
                                        display: false
                                    }

                                }

                            }

                        }

                    }
                );

        }



        // =====================================================
        // SAVINGS CHART
        // =====================================================

        function createSavingChart(
            data
        ) {

            const canvas =
                document.getElementById(
                    "savingChart"
                );


            if (
                !canvas ||
                !window.Chart
            ) {

                return;

            }


            if (
                window.mzansiSavingChart
            ) {

                window.mzansiSavingChart.destroy();

            }


            const current =
                Number(
                    data.current_total ??
                    data.total ??
                    data.receipt_total ??
                    0
                );


            const savings =
                Math.max(
                    0,
                    Number(
                        data.potential_savings ??
                        data.savings ??
                        0
                    )
                );


            if (
                current <= 0
            ) {

                return;

            }


            const best =
                Math.max(
                    0,
                    current - savings
                );


            window.mzansiSavingChart =
                new Chart(
                    canvas,
                    {

                        type: "doughnut",

                        data: {

                            labels: [
                                "Best possible total",
                                "Potential savings"
                            ],

                            datasets: [

                                {

                                    data: [
                                        best,
                                        savings
                                    ],

                                    backgroundColor: [
                                        "#2f8f6b",
                                        "#e58f3a"
                                    ],

                                    borderWidth: 0

                                }

                            ]

                        },


                        options: {

                            responsive: true,

                            maintainAspectRatio:
                                false,

                            cutout:
                                "68%",

                            plugins: {

                                legend: {
                                    position: "bottom"
                                }

                            }

                        }

                    }
                );

        }



        // =====================================================
        // STAR RATING
        // =====================================================

        const ratingStars =
            document.querySelectorAll(
                ".rating-star"
            );


        const selectedRating =
            document.getElementById(
                "selectedRating"
            );


        const ratingHelper =
            document.getElementById(
                "ratingHelper"
            );


        ratingStars.forEach(
            function (star) {

                star.addEventListener(
                    "mouseenter",
                    function () {

                        const rating =
                            Number(
                                star.dataset.rating
                            );


                        highlightRating(
                            rating
                        );

                    }
                );


                star.addEventListener(
                    "click",
                    function () {

                        const rating =
                            Number(
                                star.dataset.rating
                            );


                        if (
                            selectedRating
                        ) {

                            selectedRating.value =
                                rating;

                        }


                        highlightRating(
                            rating
                        );


                        if (
                            ratingHelper
                        ) {

                            ratingHelper.textContent =
                                "You selected " +
                                rating +
                                " out of 5 stars.";

                        }

                    }
                );

            }
        );


        const ratingContainer =
            document.getElementById(
                "reviewStars"
            );


        if (ratingContainer) {

            ratingContainer.addEventListener(
                "mouseleave",
                function () {

                    const current =
                        Number(
                            selectedRating
                            ? selectedRating.value
                            : 0
                        );


                    highlightRating(
                        current
                    );

                }
            );

        }


        function highlightRating(
            rating
        ) {

            ratingStars.forEach(
                function (star) {

                    const starNumber =
                        Number(
                            star.dataset.rating
                        );


                    if (
                        starNumber <= rating
                    ) {

                        star.textContent =
                            "★";

                        star.classList.add(
                            "active"
                        );

                    } else {

                        star.textContent =
                            "☆";

                        star.classList.remove(
                            "active"
                        );

                    }

                }
            );

        }



        // =====================================================
        // SENTIMENT ANALYSIS
        // =====================================================

        const sentimentButton =
            document.getElementById(
                "sentimentButton"
            );


        if (sentimentButton) {

            sentimentButton.addEventListener(
                "click",
                analyseSentiment
            );

        }


        async function analyseSentiment() {

            const review =
                document.getElementById(
                    "review"
                );


            const text =
                review
                ? review.value.trim()
                : "";


            hideError(
                "sentimentError"
            );


            if (!text) {

                showError(
                    "sentimentError",
                    "Please enter a grocery review first."
                );

                return;

            }


            sentimentButton.disabled =
                true;


            sentimentButton.textContent =
                "Analysing...";


            try {

                const response =
                    await fetch(
                        "/sentiment",
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({
                                    review: text
                                })

                        }
                    );


                const data =
                    await response.json();


                console.log(
                    "Sentiment response:",
                    data
                );


                if (
                    !response.ok ||
                    !data.success
                ) {

                    throw new Error(
                        data.error ||
                        "Unable to analyse sentiment."
                    );

                }


                displaySentiment(
                    data
                );


            } catch (error) {

                console.error(
                    "Sentiment error:",
                    error
                );


                showError(
                    "sentimentError",
                    error.message ||
                    "Something went wrong while analysing the review."
                );


            } finally {

                sentimentButton.disabled =
                    false;


                sentimentButton.textContent =
                    "Analyse Sentiment";

            }

        }



        // =====================================================
        // DISPLAY SENTIMENT
        // =====================================================

        function displaySentiment(
            data
        ) {

            const result =
                document.getElementById(
                    "sentimentResult"
                );


            if (!result) {
                return;
            }


            result.classList.remove(
                "hidden"
            );


            // -------------------------------------------------
            // SENTIMENT LABEL
            // -------------------------------------------------

            let rawLabel =
                data.label ??
                data.sentiment ??
                data.classification ??
                "Neutral";


            if (
                typeof rawLabel === "object" &&
                rawLabel !== null
            ) {

                rawLabel =
                    rawLabel.label ??
                    rawLabel.sentiment ??
                    rawLabel.name ??
                    "Neutral";

            }


            let sentimentLabel =
                String(
                    rawLabel
                );


            // -------------------------------------------------
            // SCORE
            // -------------------------------------------------

            let rawScore =
                data.score ??
                data.sentiment_score ??
                data.sentimentScore ??
                0;


            if (
                typeof rawScore === "object" &&
                rawScore !== null
            ) {

                rawScore =
                    rawScore.score ??
                    rawScore.value ??
                    rawScore.sentiment_score ??
                    0;

            }


            let cleanScore =
                parseFloat(
                    rawScore
                );


            if (
                isNaN(cleanScore)
            ) {

                cleanScore = 0;

            }


            cleanScore =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        cleanScore
                    )
                );


            // -------------------------------------------------
            // EMOJI
            // -------------------------------------------------

            const lower =
                sentimentLabel
                    .toLowerCase();


            let emoji =
                "😐";


            if (
                lower.includes(
                    "positive"
                ) ||
                lower.includes(
                    "pos"
                )
            ) {

                emoji =
                    "😊";

            } else if (
                lower.includes(
                    "negative"
                ) ||
                lower.includes(
                    "neg"
                )
            ) {

                emoji =
                    "☹️";

            }


            const labelElement =
                document.getElementById(
                    "sentimentLabel"
                );


            if (labelElement) {

                labelElement.textContent =
                    emoji +
                    " " +
                    sentimentLabel;

            }


            // -------------------------------------------------
            // SCORE DISPLAY
            // -------------------------------------------------

            const scoreElement =
                document.getElementById(
                    "sentimentScore"
                );


            if (scoreElement) {

                scoreElement.textContent =

                    (
                        cleanScore >= 0
                        ? "+"
                        : ""
                    ) +

                    cleanScore.toFixed(2);

            }


            // -------------------------------------------------
            // SUMMARY
            // -------------------------------------------------

            let summary =
                data.summary ??
                data.explanation ??
                data.reason ??
                data.message ??
                "No summary available.";


            if (
                typeof summary === "object" &&
                summary !== null
            ) {

                summary =
                    summary.text ??
                    summary.summary ??
                    summary.explanation ??
                    summary.reason ??
                    "No summary available.";

            }


            const summaryElement =
                document.getElementById(
                    "sentimentSummary"
                );


            if (summaryElement) {

                summaryElement.textContent =
                    String(
                        summary
                    );

            }


            // -------------------------------------------------
            // QUALITY SCORE
            // -------------------------------------------------

            const quality =
                Math.round(
                    (
                        (cleanScore + 1) /
                        2
                    ) * 100
                );


            const qualityNumber =
                document.getElementById(
                    "qualityNumber"
                );


            if (qualityNumber) {

                qualityNumber.textContent =
                    quality;

            }


            const qualityBar =
                document.getElementById(
                    "qualityBarFill"
                );


            if (qualityBar) {

                qualityBar.style.width =
                    quality +
                    "%";

            }


            // -------------------------------------------------
            // SENTIMENT MARKER
            // -------------------------------------------------

            const marker =
                document.getElementById(
                    "sentimentMarker"
                );


            if (marker) {

                const position =
                    (
                        (cleanScore + 1) /
                        2
                    ) * 100;


                marker.style.left =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            position
                        )
                    ) +
                    "%";

            }


            // -------------------------------------------------
            // USER STAR RATING
            // IMPORTANT:
            // This is kept separate from AI sentiment.
            // -------------------------------------------------

            const ratingResult =
                document.getElementById(
                    "ratingResult"
                );


            const userRating =
                Number(
                    selectedRating
                    ? selectedRating.value
                    : 0
                );


            if (
                ratingResult &&
                userRating > 0
            ) {

                ratingResult.classList.remove(
                    "hidden"
                );


                ratingResult.textContent =
                    "Your rating: " +

                    "★".repeat(
                        userRating
                    ) +

                    "☆".repeat(
                        5 - userRating
                    );

            }


            result.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        }



        // =====================================================
        // CURATED GROCERY INSIGHT RATINGS
        // =====================================================

        const insightCards =
            document.querySelectorAll(
                ".insight-card"
            );


        insightCards.forEach(
            function (card) {

                const rating =
                    Number(
                        card.dataset.rating
                    ) || 0;


                const stars =
                    card.querySelectorAll(
                        ".insight-star"
                    );


                stars.forEach(
                    function (
                        star,
                        index
                    ) {

                        const starNumber =
                            index + 1;


                        if (
                            starNumber <= rating
                        ) {

                            star.classList.add(
                                "filled"
                            );

                        } else {

                            star.classList.remove(
                                "filled"
                            );

                        }

                    }
                );


                const ratingText =
                    document.createElement(
                        "span"
                    );


                ratingText.className =
                    "insight-rating-number";


                ratingText.textContent =
                    rating.toFixed(1) +
                    " / 5";


                const starsContainer =
                    card.querySelector(
                        ".insight-stars"
                    );


                if (
                    starsContainer
                ) {

                    starsContainer.appendChild(
                        ratingText
                    );

                }

            }
        );


        console.log(
            "Mzansi Basket interactions initialised."
        );


    }
);

