const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = ""; // Replace 'your_api_key' with your actual ZenRows API key
const baseURL = "https://pcpartpicker.com/products/memory/";
const outputFile = "memory_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Part #,Speed,Form Factor,Modules,Price / GB,Color,First Word Latency,CAS Latency,Voltage,Timing,ECC / Registered,Heat Spreader,Specs Number\n";
    fs.writeFileSync(outputFile, headers);
}

async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchMemoryDetails(url) {
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
            speed: "",
            formFactor: "",
            modules: "",
            pricePerGB: "",
            color: "",
            firstWordLatency: "",
            casLatency: "",
            voltage: "",
            timing: "",
            eccRegistered: "",
            heatSpreader: "",
            specsNum: specsNum
        };

        for (const group of specs.querySelectorAll("div.group")) {
            let title = group.querySelector("h3")?.textContent;
            let value = group.querySelector("div > p")?.textContent || Array.from(group.querySelectorAll("div > ul > li")).map(li => li.textContent.trim()).join(', ');

            switch (title) {
                case "Manufacturer":
                    details.manufacturer = value;
                    break;
                case "Part #":
                    details.partNumber = value;
                    break;
                case "Speed":
                    details.speed = value;
                    break;
                case "Form Factor":
                    details.formFactor = value;
                    break;
                case "Modules":
                    details.modules = value;
                    break;
                case "Price / GB":
                    details.pricePerGB = value;
                    break;
                case "Color":
                    details.color = value;
                    break;
                case "First Word Latency":
                    details.firstWordLatency = value;
                    break;
                case "CAS Latency":
                    details.casLatency = value;
                    break;
                case "Voltage":
                    details.voltage = value;
                    break;
                case "Timing":
                    details.timing = value;
                    break;
                case "ECC / Registered":
                    details.eccRegistered = value;
                    break;
                case "Heat Spreader":
                    details.heatSpreader = value;
                    break;
                default:
                    break;
            }
        }

        return details;
    } catch (error) {
        console.error(`Error fetching details for ${url}: ${error.message}`);
        return {};
    }
}

async function scrapePage(pageNumber) {
    const url = baseURL + `#page=${pageNumber}`;
    let csvContent = "";

    try {
        const { data } = await client.get(url, {
            "js_render": "true",
            "wait": "3000"
        });

        const root = parse(data);
        const rows = root.querySelectorAll("#category_content > tr");

        for (const row of rows) {
            const name = row.querySelector('td.td__name > a > div.td__nameWrapper > p')?.innerText.trim();
            const imageUrl = row.querySelector('td.td__name > a > div.td__imageWrapper > div > img')?.getAttribute('src');
            const productUrl = "https://pcpartpicker.com" + row.querySelector('td.td__name > a')?.getAttribute('href');
            const priceElement = row.querySelector('td.td__price');
            let price = priceElement ? priceElement.innerText.trim().split('Add')[0].trim() : 'N/A';

            const details = await fetchMemoryDetails(productUrl);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.partNumber || 'N/A'}","${details.speed || 'N/A'}","${details.formFactor || 'N/A'}","${details.modules || 'N/A'}","${details.pricePerGB || 'N/A'}","${details.color || 'N/A'}","${details.firstWordLatency || 'N/A'}","${details.casLatency || 'N/A'}","${details.voltage || 'N/A'}","${details.timing || 'N/A'}","${details.eccRegistered || 'N/A'}","${details.heatSpreader || 'N/A'}","${details.specsNum || 'N/A'}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8');
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    for (let i = 13; i <= 21; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
