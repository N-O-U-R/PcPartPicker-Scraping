const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = ""; // Your actual ZenRows API key
const baseURL = "https://pcpartpicker.com/products/video-card/";
const outputFile = "gpus_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Model,Part #,Chipset,Memory,Memory Type,Core Clock,Boost Clock,Effective Memory Clock,Interface,Color,Frame Sync,Length,TDP,Case Expansion Slot Width,Total Slot Width,Cooling,External Power,HDMI Outputs,DisplayPort Outputs,DVI-D Dual Link Outputs,HDMI 2.1a Outputs,DisplayPort 1.4 Outputs,DisplayPort 1.4a Outputs,DisplayPort 2.1 Outputs,SLI/CrossFire\n";
    fs.writeFileSync(outputFile, headers);
}

async function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function fetchGPUDetails(url) {
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
                chipset: "",
                memory: "",
                memoryType: "",
                coreClock: "",
                boostClock: "",
                effectiveMemoryClock: "",
                interface: "",
                color: "",
                frameSync: "",
                length: "",
                tdp: "",
                caseExpansionSlotWidth: "",
                totalSlotWidth: "",
                cooling: "",
                externalPower: "",
                hdmiOutputs: "",
                displayPortOutputs: "",
                dviDDualLinkOutputs: "",
                hdmi21aOutputs: "",
                displayPort14Outputs: "",
                displayPort14aOutputs: "",
                displayPort21Outputs: "",
                sliCrossFire: "",
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
                    case "Chipset":
                        details.chipset = value;
                        break;
                    case "Memory":
                        details.memory = value;
                        break;
                    case "Memory Type":
                        details.memoryType = value;
                        break;
                    case "Core Clock":
                        details.coreClock = value;
                        break;
                    case "Boost Clock":
                        details.boostClock = value;
                        break;
                    case "Effective Memory Clock":
                        details.effectiveMemoryClock = value;
                        break;
                    case "Interface":
                        details.interface = value;
                        break;
                    case "Color":
                        details.color = value;
                        break;
                    case "Frame Sync":
                        details.frameSync = value;
                        break;
                    case "Length":
                        details.length = value;
                        break;
                    case "TDP":
                        details.tdp = value;
                        break;
                    case "Case Expansion Slot Width":
                        details.caseExpansionSlotWidth = value;
                        break;
                    case "Total Slot Width":
                        details.totalSlotWidth = value;
                        break;
                    case "Cooling":
                        details.cooling = value;
                        break;
                    case "External Power":
                        details.externalPower = value;
                        break;
                    case "HDMI Outputs":
                        details.hdmiOutputs = value;
                        break;
                    case "DisplayPort Outputs":
                        details.displayPortOutputs = value;
                        break;
                    case "DVI-D Dual Link Outputs":
                        details.dviDDualLinkOutputs = value;
                        break;
                    case "HDMI 2.1a Outputs":
                        details.hdmi21aOutputs = value;
                        break;
                    case "DisplayPort 1.4 Outputs":
                        details.displayPort14Outputs = value;
                        break;
                    case "DisplayPort 1.4a Outputs":
                        details.displayPort14aOutputs = value;
                        break;
                    case "DisplayPort 2.1 Outputs":
                        details.displayPort21Outputs = value;
                        break;
                    case "SLI/CrossFire":
                        details.sliCrossFire = value;
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

            const details = await fetchGPUDetails(productUrl);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.model || 'N/A'}","${details.partNumber || 'N/A'}","${details.chipset || 'N/A'}","${details.memory || 'N/A'}","${details.memoryType || 'N/A'}","${details.coreClock || 'N/A'}","${details.boostClock || 'N/A'}","${details.effectiveMemoryClock || 'N/A'}","${details.interface || 'N/A'}","${details.color || 'N/A'}","${details.frameSync || 'N/A'}","${details.length || 'N/A'}","${details.tdp || 'N/A'}","${details.caseExpansionSlotWidth || 'N/A'}","${details.totalSlotWidth || 'N/A'}","${details.cooling || 'N/A'}","${details.externalPower || 'N/A'}","${details.hdmiOutputs || 'N/A'}","${details.displayPortOutputs || 'N/A'}","${details.dviDDualLinkOutputs || 'N/A'}","${details.hdmi21aOutputs || 'N/A'}","${details.displayPort14Outputs || 'N/A'}","${details.displayPort14aOutputs || 'N/A'}","${details.displayPort21Outputs || 'N/A'}","${details.sliCrossFire || 'N/A'}","${details.specsNum || 'N/A'}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8');
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    for (let i = 52; i <= 61; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
