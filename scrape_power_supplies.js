const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = ""; // Your actual ZenRows API key
const baseURL = "https://pcpartpicker.com/products/power-supply/";
const outputFile = "power_supplies_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Model,Part #,Type,Efficiency Rating,Wattage,Length,Modular,Color,Fanless,ATX 4-Pin Connectors,EPS 8-Pin Connectors,PCIe 12+4-Pin 12VHPWR Connectors,PCIe 12-Pin Connectors,PCIe 8-Pin Connectors,PCIe 6+2-Pin Connectors,PCIe 6-Pin Connectors,SATA Connectors,Molex 4-Pin Connectors,Specs Number\n";
    fs.writeFileSync(outputFile, headers);
}

async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchPowerSupplyDetails(url) {
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
                model: "",
                partNumber: "",
                type: "",
                efficiencyRating: "",
                wattage: "",
                length: "",
                modular: "",
                color: "",
                fanless: "",
                atx4PinConnectors: "",
                eps8PinConnectors: "",
                pcie12plus4Pin12VHPWRConnectors: "",
                pcie12PinConnectors: "",
                pcie8PinConnectors: "",
                pcie6plus2PinConnectors: "",
                pcie6PinConnectors: "",
                sataConnectors: "",
                molex4PinConnectors: "",
                specsNum: specsNum
            };

            for (const group of specs.querySelectorAll("div.group")) {
                let title = group.querySelector("h3")?.textContent.trim();
                let value = group.querySelector("div > p")?.textContent.trim() || Array.from(group.querySelectorAll("div > ul > li")).map(li => li.textContent.trim()).join(', ');

                switch (title) {
                    case "Manufacturer":
                        details.manufacturer = value;
                        break;
                    case "Model":
                        details.model = value;
                        break;
                    case "Part #":
                        details.partNumber = value;
                        break;
                    case "Type":
                        details.type = value;
                        break;
                    case "Efficiency Rating":
                        details.efficiencyRating = value;
                        break;
                    case "Wattage":
                        details.wattage = value;
                        break;
                    case "Length":
                        details.length = value;
                        break;
                    case "Modular":
                        details.modular = value;
                        break;
                    case "Color":
                        details.color = value;
                        break;
                    case "Fanless":
                        details.fanless = (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true');
                        break;
                    case "ATX 4-Pin Connectors":
                        details.atx4PinConnectors = value;
                        break;
                    case "EPS 8-Pin Connectors":
                        details.eps8PinConnectors = value;
                        break;
                    case "PCIe 12+4-Pin 12VHPWR Connectors":
                        details.pcie12plus4Pin12VHPWRConnectors = value;
                        break;
                    case "PCIe 12-Pin Connectors":
                        details.pcie12PinConnectors = value;
                        break;
                    case "PCIe 8-Pin Connectors":
                        details.pcie8PinConnectors = value;
                        break;
                    case "PCIe 6+2-Pin Connectors":
                        details.pcie6plus2PinConnectors = value;
                        break;
                    case "PCIe 6-Pin Connectors":
                        details.pcie6PinConnectors = value;
                        break;
                    case "SATA Connectors":
                        details.sataConnectors = value;
                        break;
                    case "Molex 4-Pin Connectors":
                        details.molex4PinConnectors = value;
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

            const details = await fetchPowerSupplyDetails(productUrl);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.model || 'N/A'}","${details.partNumber || 'N/A'}","${details.type || 'N/A'}","${details.efficiencyRating || 'N/A'}","${details.wattage || 'N/A'}","${details.length || 'N/A'}","${details.modular || 'N/A'}","${details.color || 'N/A'}","${details.fanless ? 'Yes' : 'No'}","${details.atx4PinConnectors || 'N/A'}","${details.eps8PinConnectors || 'N/A'}","${details.pcie12plus4Pin12VHPWRConnectors || 'N/A'}","${details.pcie12PinConnectors || 'N/A'}","${details.pcie8PinConnectors || 'N/A'}","${details.pcie6plus2PinConnectors || 'N/A'}","${details.pcie6PinConnectors || 'N/A'}","${details.sataConnectors || 'N/A'}","${details.molex4PinConnectors || 'N/A'}","${details.specsNum || 'N/A'}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8');
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    for (let i = 22; i <= 31; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
