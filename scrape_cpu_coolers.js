const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKeys = [];
const baseURL = "https://pcpartpicker.com/products/cpu-cooler/";
const outputFile = "cpu_coolers_detailed.csv";

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Model,Part #,Fan RPM,Noise Level,Color,Height,CPU Socket,Water Cooled,Fanless,Specs Number\n";
    fs.writeFileSync(outputFile, headers);
}

async function fetchCPUCoolerDetails(url, apiKey) {
    const client = new ZenRows(apiKey);
    try {
        const { data } = await client.get(url, {
            "js_render": "true",
        });

        const root = parse(data);
        const specsSelector = '#product-page > div.main-wrapper.xs-col-12 > div.wrapper.wrapper__pageContent > section > div > div.main-content.col.xs-col-12.md-col-9.lg-col-9 > div.block.xs-block.md-hide.specs';
        const specs = root.querySelector(specsSelector);
        if (!specs) {
            console.error(`Specs section not found for ${url}`);
            return {};  // Return empty object if specs section is not found
        }
        const specsNum = specs.querySelectorAll("div.group").length;

        let details = {
            manufacturer: "",
            model: "",
            partNumber: "",
            fanRPM: "",
            noiseLevel: "",
            color: "",
            height: "",
            cpuSocket: "",
            waterCooled: "",
            fanless: "",
            specsNum: specsNum,
        };

        specs.querySelectorAll("div.group").forEach((group, index) => {
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
                case "Fan RPM":
                    details.fanRPM = value;
                    break;
                case "Noise Level":
                    details.noiseLevel = value;
                    break;
                case "Color":
                    details.color = value;
                    break;
                case "Height":
                    details.height = value;
                    break;
                case "CPU Socket":
                    details.cpuSocket = value;
                    break;
                case "Water Cooled":
                    details.waterCooled = value;
                    break;
                case "Fanless":
                    details.fanless = value;
                    break;
                default:
                    break;
            }
        });

        return details;
    } catch (error) {
        console.error(`Error fetching details for ${url}: ${error.message}`);
        return {};  // Return empty object on failure
    }
}

async function scrapePage(pageNumber) {
    //let apiKeyIndex = Math.floor((pageNumber - 1) / 2) % apiKeys.length;  // Get the index for the API key
    let apiKey = "71be0ed3280206ab0354db216ee47c0df7bcafe8";
    const client = new ZenRows(apiKey);  // Define the client here with the correct API key
    const url = baseURL + `#page=${pageNumber}`;
    let csvContent = "";

    try {
        const { data } = await client.get(url, {
            "js_render": "true",
            "wait": "4000"
        });

        const root = parse(data);
        const rows = root.querySelectorAll("#category_content > tr");

        for (const row of rows) {
            const name = row.querySelector('td.td__name > a > div.td__nameWrapper > p')?.innerText.trim();
            const imageUrl = row.querySelector('td.td__name > a > div.td__imageWrapper > div > img')?.getAttribute('src');
            const productUrl = "https://pcpartpicker.com" + row.querySelector('td.td__name > a')?.getAttribute('href');
            const priceElement = row.querySelector('td.td__price');
            let price = priceElement ? priceElement.innerText.trim().split('Add')[0].trim() : 'N/A';

            const details = await fetchCPUCoolerDetails(productUrl, apiKey);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.model || 'N/A'}","${details.partNumber || 'N/A'}","${details.fanRPM || 'N/A'}","${details.noiseLevel || 'N/A'}","${details.color || 'N/A'}","${details.height || 'N/A'}","${details.cpuSocket || 'N/A'}","${details.waterCooled || 'N/A'}","${details.fanless || 'N/A'}","${details.specsNum || "N/A"}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8'); // Ensure proper encoding
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    const totalPages = 13;  // Adjust the total number of pages as necessary
    for (let i = 12; i <= totalPages; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
