const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = ""; // Your ZenRows API key
const baseURL = "https://pcpartpicker.com/products/internal-hard-drive/";
const outputFile = "storage_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    fs.writeFileSync(outputFile, "Name,Image URL,Product URL,Price,Manufacturer,Part #,Capacity,Price / GB,Type,Cache,Form Factor,Interface,NVME,Specs Number\n");
}

async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
async function fetchStorageDetails(url) {
    let retries = 3;
    while (retries > 0) {
        try {
            const { data } = await client.get(url, {}); // Fetch the product page

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
                capacity: "",
                pricePerGB: "",
                type: "",
                cache: "",
                formFactor: "",
                interface: "",
                nvme: "",
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
                    case "Capacity":
                        details.capacity = value;
                        break;
                    case "Price / GB":
                        details.pricePerGB = value;
                        break;
                    case "Type":
                        details.type = value;
                        break;
                    case "Cache":
                        details.cache = value;
                        break;
                    case "Form Factor":
                        details.formFactor = value;
                        break;
                    case "Interface":
                        details.interface = value;
                        break;
                    case "NVMe":
                        details.nvme = value === 'Yes';
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

            const details = await fetchStorageDetails(productUrl);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.partNumber || 'N/A'}","${details.capacity || 'N/A'}","${details.pricePerGB || 'N/A'}","${details.type || 'N/A'}","${details.cache || 'N/A'}","${details.formFactor || 'N/A'}","${details.interface || 'N/A'}","${details.nvme ? 'Yes' : 'No'}","${details.specsNum || 'N/A'}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8');
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    for (let i = 1; i <= 61; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
