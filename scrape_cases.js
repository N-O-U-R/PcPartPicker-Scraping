const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = ""; // Replace with your actual ZenRows API key
const baseURL = "https://pcpartpicker.com/products/case/";
const outputFile = "cases_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Part #,Type,Color,Power Supply,Side Panel,Power Supply Shroud,Front Panel USB,Motherboard Form Factor,Maximum Video Card Length,Drive Bays,Expansion Slots,Dimensions,Volume,Specs Num\n";
    fs.writeFileSync(outputFile, headers);
}

async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function escapeCSVField(field) {
    if (field) {
        // Convert the field to string (in case it's not), escape quotes, and wrap it in double quotes.
        return `"${field.toString().replace(/"/g, '""')}"`;
    }
    return '""'; // Return empty quotes if field is undefined or null.
}

async function fetchCaseDetails(url) {
    let retries = 3;
    while (retries > 0) {
        try {
            const { data } = await client.get(url, {});

            const root = parse(data);
            const specsSelector = '#product-page > div.main-wrapper.xs-col-12 > div.wrapper.wrapper__pageContent > section > div > div.main-content.col.xs-col-12.md-col-9.lg-col-9 > div.block.xs-block.md-hide.specs';
            const specs = root.querySelector(specsSelector);
            if (!specs) {
                console.error(`Specs section not found for ${url}`);
                return {};
            }

            const specsNum = specs.querySelectorAll("div.group").length;

            let details = {
                manufacturer: "",
                partNumber: "",
                type: "",
                color: "",
                powerSupply: "",
                sidePanel: "",
                powerSupplyShroud: "",
                frontPanelUSB: "",
                motherboardFormFactor: "",
                maximumVideoCardLength: "",
                driveBays: "",
                expansionSlots: "",
                dimensions: "",
                volume: "",
                specsNum: specsNum
            };

            for (const group of specs.querySelectorAll("div.group")) {
                let title = group.querySelector("h3")?.textContent.trim();
                let value = group.querySelector("div > p")?.textContent.trim() || Array.from(group.querySelectorAll("div > ul > li")).map(li => li.textContent.trim()).join(', ');

                switch (title) {
                    case "Manufacturer":
                        details.manufacturer = value;
                        break;
                    case "Part #":
                        details.partNumber = value;
                        break;
                    case "Type":
                        details.type = value;
                        break;
                    case "Color":
                        details.color = value;
                        break;
                    case "Power Supply":
                        details.powerSupply = value;
                        break;
                    case "Side Panel":
                        details.sidePanel = value;
                        break;
                    case "Power Supply Shroud":
                        details.powerSupplyShroud = value;
                        break;
                    case "Front Panel USB":
                        details.frontPanelUSB = value;
                        break;
                    case "Motherboard Form Factor":
                        details.motherboardFormFactor = value;
                        break;
                    case "Maximum Video Card Length":
                        details.maximumVideoCardLength = value;
                        break;
                    case "Drive Bays":
                        details.driveBays = value;
                        break;
                    case "Expansion Slots":
                        details.expansionSlots = value;
                        break;
                    case "Dimensions":
                        details.dimensions = value;
                        break;
                    case "Volume":
                        details.volume = value;
                        break;
                    default:
                        break;
                }
            }
            return details;
        } catch (error) {
            console.log(`Error fetching details for ${url}: ${error.message}`);
            if (retries === 1 || !error.response || error.response.status !== 422) {
                console.error(`Final fail for ${url}`);
                return {};
            }
            console.log(`${retries} retries left for ${url}, retrying in 3 seconds...`);
            await delay(3000); // Retry after 3 seconds
        }
        retries--;
    }
}

async function scrapePage(pageNumber) {
    const url = baseURL + `#page=${pageNumber}`;
    let csvContent = "";

    try {
        const { data } = await client.get(url, { js_render: true, wait: 3000 });
        const root = parse(data);
        const rows = root.querySelectorAll("#category_content > tr");

        for (const row of rows) {
            const name = row.querySelector('td.td__name > a > div.td__nameWrapper > p')?.innerText.trim();
            const imageUrl = row.querySelector('td.td__name > a > div.td__imageWrapper > div > img')?.getAttribute('src');
            const productUrl = "https://pcpartpicker.com" + row.querySelector('td.td__name > a')?.getAttribute('href');
            const priceElement = row.querySelector('td.td__price');
            let price = priceElement ? priceElement.innerText.trim().split('Add')[0].trim() : 'N/A';

            const details = await fetchCaseDetails(productUrl);
            csvContent += [
                escapeCSVField(name),
                escapeCSVField(imageUrl),
                escapeCSVField(productUrl),
                escapeCSVField(price),
                escapeCSVField(details.manufacturer),
                escapeCSVField(details.partNumber),
                escapeCSVField(details.type),
                escapeCSVField(details.color),
                escapeCSVField(details.powerSupply),
                escapeCSVField(details.sidePanel),
                escapeCSVField(details.powerSupplyShroud),
                escapeCSVField(details.frontPanelUSB),
                escapeCSVField(details.motherboardFormFactor),
                escapeCSVField(details.maximumVideoCardLength),
                escapeCSVField(details.driveBays),
                escapeCSVField(details.expansionSlots),
                escapeCSVField(details.dimensions),
                escapeCSVField(details.volume),
                escapeCSVField(details.specsNum)
            ].join(",") + "\n";
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8');
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    for (let i = 52; i <= 60; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
