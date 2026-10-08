document.addEventListener(
"DOMContentLoaded",
function() {


    /* =========================================
       HELPERS
    ========================================== */

    function formatCurrency(value) {

        const number =
            Number(value) || 0;


        return "R" +
            number.toFixed(2);

    }


    function formatRetailerName(name) {

        if (!name) {
            return "Unknown";
        }


        const names = {

            pnp: "Pick n Pay",

            checkers: "Checkers",

            shoprite: "Shoprite",

            woolworths: "Woolworths",

            clicks: "Clicks",

            dischem: "Dis-Chem",

            makro: "Makro"

        };


        const key =
            String(name)
                .toLowerCase()
                .trim();


        return names[key] ||
            String(name)
                .replace(
                    /\b\w/g,
                    function(letter) {
                        return letter.toUpperCase();
                    }
                );

    }


    function showError(message) {

        const error =
            document.getElementById(
                "error"
            );


        if (error) {

            error.textContent =
                message;

            error.classList.remove(
                "hidden"
            );

        }

    }


    function hideError() {

        const error =
            document.getElementById(
                "error"
            );


        if (error) {

            error.classList.add(
                "hidden"
            );

        }

    }


    /* =========================================
       PRODUCT SEARCH
    ========================================== */

    const productSearchForm =
        document.getElementById(
            "productSearchForm"
        );


    if (productSearchForm) {

        productSearchForm.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                hideError();


                const input =
                    document.getElementById(
                        "productSearch"
                    );


                const button =
                    document.getElementById(
                        "compareButton"
                    );


                const loading =
                    document.getElementById(
                        "compareLoading"
                    );


                const result =
                    document.getElementById(
                        "productResult"
                    );


                const product =
                    input.value.trim();


                if (!product) {
                    return;
                }


                button.disabled = true;

                loading.classList.remove(
                    "hidden"
                );

                result.classList.add(
                    "hidden"
                );


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

                                body:
                                    JSON.stringify({
                                        product: product
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok ||
                        !data.success) {

                        throw new Error(
                            data.error ||
                            "Unable to compare prices."
                        );

                    }


                    displayProductResults(
                        data.products
                    );


                } catch (error) {

                    showError(
                        error.message
                    );

                } finally {

                    button.disabled =
                        false;

                    loading.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }


    /* =========================================
       DISPLAY PRODUCT RESULTS
    ========================================== */

    function displayProductResults(
        products
    ) {

        const result =
            document.getElementById(
                "productResult"
            );


        if (!result) {
            return;
        }


        result.innerHTML = "";


        if (
            !products ||
            products.length === 0
        ) {

            result.innerHTML = `
                <div class="product-results-heading">
                    <h3>No products found</h3>
                    <p>
                        Try a different product name.
                    </p>
                </div>
            `;


            result.classList.remove(
                "hidden"
            );

            return;

        }


        const heading =
            document.createElement(
                "div"
            );


        heading.className =
            "product-results-heading";


        heading.innerHTML = `
            <h3>Products found</h3>
            <p>
                Compare available prices across retailers.
            </p>
        `;


        result.appendChild(
            heading
        );


        products.forEach(
            function(product, index) {

                const card =
                    createProductCard(
                        product,
                        index
                    );


                result.appendChild(
                    card
                );

            }
        );


        result.classList.remove(
            "hidden"
        );

    }


    /* =========================================
       PRODUCT CARD
    ========================================== */

    function createProductCard(
        product,
        index
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "product-card";


        const productName =
            product.name ||
            "Unknown product";


        const prices =
            Array.isArray(
                product.prices
            )
                ? product.prices
                : [];


        const cheapest =
            product.cheapest ||
            {};


        const cheapestRetailer =
            formatRetailerName(
                cheapest.retailer
            );


        const cheapestPrice =
            Number(
                cheapest.price || 0
            );


        const potentialSaving =
            Number(
                product.potential_saving ||
                0
            );


        card.innerHTML = `

            <div class="product-card-header">

                <div>

                    <h3>
                        ${productName}
                    </h3>

                </div>


                <div class="cheapest-badge">

                    Cheapest:
                    <strong>
                        ${cheapestRetailer}
                    </strong>

                </div>

            </div>


            <div class="product-summary">

                <div class="stat-card">

                    <span>
                        Cheapest Price
                    </span>

                    <strong>
                        ${formatCurrency(
                            cheapestPrice
                        )}
                    </strong>

                </div>


                <div class="stat-card saving">

                    <span>
                        Potential Saving
                    </span>

                    <strong>
                        ${formatCurrency(
                            potentialSaving
                        )}
                    </strong>

                </div>

            </div>


            <div class="table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Retailer
                            </th>

                            <th>
                                Price
                            </th>

                            <th>
                                Availability
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            prices.map(
                                function(item) {

                                    return `

                                        <tr>

                                            <td>
                                                ${
                                                    formatRetailerName(
                                                        item.retailer
                                                    )
                                                }
                                            </td>

                                            <td>
                                                ${
                                                    formatCurrency(
                                                        item.price
                                                    )
                                                }
                                            </td>

                                            <td>
                                                ${
                                                    item.in_stock
                                                        ? "Available"
                                                        : "Out of stock"
                                                }
                                            </td>

                                        </tr>

                                    `;

                                }
                            ).join("")
                        }

                    </tbody>

                </table>

            </div>


            <div class="product-chart-section">

                <h4>
                    Retailer price comparison
                </h4>

                <canvas
                    id="productChart-${index}"
                ></canvas>

            </div>


            <p class="price-source">
                Prices via Loyalty Hub
            </p>

        `;


        const canvas =
            card.querySelector(
                `#productChart-${index}`
            );


        setTimeout(
            function() {

                createProductPriceChart(
                    canvas.id,
                    prices
                );

            },
            0
        );


        return card;

    }


    /* =========================================
       PRODUCT PRICE CHART
    ========================================== */

    function createProductPriceChart(
        canvasId,
        prices
    ) {

        const canvas =
            document.getElementById(
                canvasId
            );


        if (!canvas) {
            return;
        }


        if (
            !prices ||
            prices.length === 0
        ) {

            return;

        }


        const retailers = [];

        const priceValues = [];

        const backgroundColors = [];


        let cheapestPrice =
            Infinity;


        prices.forEach(
            function(item) {

                const price =
                    Number(
                        item.price
                    ) || 0;


                if (
                    price > 0 &&
                    price < cheapestPrice
                ) {

                    cheapestPrice =
                        price;

                }

            }
        );


        prices.forEach(
            function(item) {

                const retailer =
                    formatRetailerName(
                        item.retailer
                    );


                const price =
                    Number(
                        item.price
                    ) || 0;


                retailers.push(
                    retailer
                );


                priceValues.push(
                    price
                );


                if (
                    price ===
                    cheapestPrice
                ) {

                    backgroundColors.push(
                        "#2f8f6b"
                    );

                } else {

                    backgroundColors.push(
                        "#4c8fc7"
                    );

                }

            }
        );


        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        retailers,

                    datasets: [

                        {

                            label:
                                "Price",

                            data:
                                priceValues,

                            backgroundColor:
                                backgroundColors,

                            borderRadius:
                                8,

                            borderSkipped:
                                false,

                            barThickness:
                                32

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {
                            display: false
                        },


                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return formatCurrency(
                                            context.raw
                                        );

                                    }

                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            ticks: {

                                color:
                                    "#64756e",

                                font: {
                                    size: 11
                                }

                            }

                        },


                        y: {

                            beginAtZero:
                                true,

                            grid: {

                                color:
                                    "#e8efec"

                            },

                            ticks: {

                                color:
                                    "#71827b",

                                callback:
                                    function(
                                        value
                                    ) {

                                        return "R" +
                                            value;

                                    }

                            }

                        }

                    }

                }

            }
        );

    }


    /* =========================================
       RECEIPT ANALYSIS
    ========================================== */

    const receiptForm =
        document.getElementById(
            "receiptForm"
        );


    if (receiptForm) {

        receiptForm.addEventListener(
            "submit",
            async function(event) {

                event.preventDefault();

                hideError();


                const receipt =
                    document.getElementById(
                        "receipt"
                    );


                const button =
                    document.getElementById(
                        "analyseButton"
                    );


                const loading =
                    document.getElementById(
                        "loading"
                    );


                if (
                    !receipt.files ||
                    receipt.files.length === 0
                ) {

                    showError(
                        "Please select a receipt image."
                    );

                    return;

                }


                const file =
                    receipt.files[0];


                button.disabled =
                    true;


                loading.classList.remove(
                    "hidden"
                );


                try {

                    const reader =
                        new FileReader();


                    const imageData =
                        await new Promise(
                            function(
                                resolve,
                                reject
                            ) {

                                reader.onload =
                                    function() {

                                        resolve(
                                            reader.result
                                        );

                                    };


                                reader.onerror =
                                    reject;


                                reader.readAsDataURL(
                                    file
                                );

                            }
                        );


                    const response =
                        await fetch(
                            "/analyse",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        image:
                                            imageData
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
                            "Unable to analyse receipt."
                        );

                    }


                    displayDashboard(
                        data
                    );


                } catch (error) {

                    showError(
                        error.message
                    );

                } finally {

                    button.disabled =
                        false;

                    loading.classList.add(
                        "hidden"
                    );

                }

            }
        );

    }


    /* =========================================
       DASHBOARD
    ========================================== */

    function displayDashboard(
        data
    ) {

        const dashboard =
            document.getElementById(
                "dashboard"
            );


        if (!dashboard) {
            return;
        }


        const receiptTotal =
            document.getElementById(
                "receiptTotal"
            );


        const possibleSaving =
            document.getElementById(
                "possibleSaving"
            );


        const itemCount =
            document.getElementById(
                "itemCount"
            );


        const cheapestStore =
            document.getElementById(
                "cheapestStore"
            );


        const items =
            data.items ||
            [];


        const totals =
            data.totals ||
            {};


        if (receiptTotal) {

            receiptTotal.textContent =
                formatCurrency(
                    data.receipt_total
                );

        }


        if (possibleSaving) {

            possibleSaving.textContent =
                formatCurrency(
                    data.possible_saving
                );

        }


        if (itemCount) {

            itemCount.textContent =
                items.length;

        }


        if (cheapestStore) {

            cheapestStore.textContent =
                data.cheapest_store ||
                "-";

        }


        displayComparisonTable(
            items
        );


        createStoreChart(
            totals
        );


        createSavingChart(
            items
        );


        dashboard.classList.remove(
            "hidden"
        );

    }


    /* =========================================
       COMPARISON TABLE
    ========================================== */

    function displayComparisonTable(
        items
    ) {

        const table =
            document.getElementById(
                "comparisonTable"
            );


        if (!table) {
            return;
        }


        table.innerHTML = "";


        items.forEach(
            function(item) {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${
                            item.name ||
                            "Unknown"
                        }
                    </td>

                    <td>
                        ${
                            formatCurrency(
                                item.receipt_price
                            )
                        }
                    </td>

                    <td>
                        ${
                            formatRetailerName(
                                item.cheapest_retailer
                            )
                        }
                        ${
                            formatCurrency(
                                item.cheapest_price
                            )
                        }
                    </td>

                    <td>
                        ${
                            formatCurrency(
                                item.saving
                            )
                        }
                    </td>

                `;


                table.appendChild(
                    row
                );

            }
        );

    }


    /* =========================================
       STORE CHART
    ========================================== */

    function createStoreChart(
        totals
    ) {

        const canvas =
            document.getElementById(
                "storeChart"
            );


        if (!canvas) {
            return;
        }


        const labels =
            Object.keys(
                totals
            );


        const values =
            Object.values(
                totals
            );


        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        labels.map(
                            formatRetailerName
                        ),

                    datasets: [

                        {

                            label:
                                "Basket Total",

                            data:
                                values,

                            backgroundColor:
                                "#2f8f6b",

                            borderRadius:
                                8

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return formatCurrency(
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
                                    function(
                                        value
                                    ) {

                                        return "R" +
                                            value;

                                    }

                            }

                        }

                    }

                }

            }
        );

    }


    /* =========================================
       SAVING CHART
    ========================================== */

    function createSavingChart(
        items
    ) {

        const canvas =
            document.getElementById(
                "savingChart"
            );


        if (!canvas) {
            return;
        }


        const labels =
            items.map(
                function(item) {

                    return item.name ||
                        "Unknown";

                }
            );


        const values =
            items.map(
                function(item) {

                    return Number(
                        item.saving
                    ) || 0;

                }
            );


        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels:
                        labels,

                    datasets: [

                        {

                            label:
                                "Potential Saving",

                            data:
                                values,

                            backgroundColor:
                                "#4c8fc7",

                            borderRadius:
                                8

                        }

                    ]

                },


                options: {

                    responsive:
                        true,

                    plugins: {

                        legend: {
                            display: false
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    function(
                                        context
                                    ) {

                                        return formatCurrency(
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
                                    function(
                                        value
                                    ) {

                                        return "R" +
                                            value;

                                    }

                            }

                        }

                    }

                }

            }
        );

    }


    /* =========================================
       SENTIMENT ANALYSIS
    ========================================== */

    const sentimentButton =
        document.getElementById(
            "sentimentButton"
        );


    if (sentimentButton) {

        sentimentButton.addEventListener(
            "click",
            async function() {

                hideError();


                const review =
                    document.getElementById(
                        "review"
                    );


                const result =
                    document.getElementById(
                        "sentimentResult"
                    );


                const text =
                    review.value.trim();


                if (!text) {

                    showError(
                        "Please enter a review first."
                    );

                    return;

                }


                sentimentButton.disabled =
                    true;


                try {

                    const response =
                        await fetch(
                            "/sentiment",
                            {

                                method:
                                    "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        review:
                                            text
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
                            "Unable to analyse sentiment."
                        );

                    }


                    displaySentiment(
                        data.sentiment
                    );


                    if (result) {

                        result.classList.remove(
                            "hidden"
                        );

                    }


                } catch (error) {

                    showError(
                        error.message
                    );

                } finally {

                    sentimentButton.disabled =
                        false;

                }

            }
        );

    }


    /* =========================================
       DISPLAY SENTIMENT
    ========================================== */

    function displaySentiment(
        sentiment
    ) {

        const sentimentLabel =
            document.getElementById(
                "sentimentLabel"
            );


        const sentimentScore =
            document.getElementById(
                "sentimentScore"
            );


        const sentimentSummary =
            document.getElementById(
                "sentimentSummary"
            );


        const qualityNumber =
            document.getElementById(
                "qualityNumber"
            );


        const qualityBarFill =
            document.getElementById(
                "qualityBarFill"
            );


        const sentimentMarker =
            document.getElementById(
                "sentimentMarker"
            );


        const label =
            sentiment.label ||
            "Unknown";


        const score =
            Number(
                sentiment.score
            );


        /* =========================
           SENTIMENT LABEL
        ========================= */

        let emoji =
            "😐";


        if (
            label
                .toLowerCase()
                .includes("positive")
        ) {

            emoji =
                "😊";

        } else if (
            label
                .toLowerCase()
                .includes("negative")
        ) {

            emoji =
                "☹️";

        }


        if (sentimentLabel) {

            sentimentLabel.textContent =
                emoji +
                " " +
                label;

        }


        /* =========================
           SENTIMENT SCORE
        ========================= */

        if (sentimentScore) {

            if (isNaN(score)) {

                sentimentScore.textContent =
                    "0.00";

            } else {

                sentimentScore.textContent =
                    score >= 0
                        ? "+" +
                          score.toFixed(2)
                        : score.toFixed(2);

            }

        }


        /* =========================
           AI SUMMARY
        ========================= */

        if (sentimentSummary) {

            sentimentSummary.textContent =
                sentiment.summary ||
                "No summary available.";

        }


        /* =========================
           QUALITY SCORE
        ========================= */

        let quality =
            (
                (
                    score + 1
                ) / 2
            ) * 100;


        if (isNaN(quality)) {

            quality =
                0;

        }


        quality =
            Math.round(
                quality
            );


        if (qualityNumber) {

            qualityNumber.textContent =
                quality;

        }


        /* =========================
           QUALITY BAR
        ========================= */

        if (qualityBarFill) {

            qualityBarFill.style.width =
                quality +
                "%";

        }


        /* =========================
           SENTIMENT MARKER
        ========================= */

        if (sentimentMarker) {

            let markerPosition =
                (
                    (
                        score + 1
                    ) / 2
                ) * 100;


            if (
                isNaN(
                    markerPosition
                )
            ) {

                markerPosition =
                    50;

            }


            markerPosition =
                Math.max(
                    0,
                    Math.min(
                        100,
                        markerPosition
                    )
                );


            sentimentMarker.style.left =
                markerPosition +
                "%";

        }

    }

}


);
