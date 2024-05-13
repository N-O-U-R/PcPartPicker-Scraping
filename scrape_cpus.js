const { ZenRows } = require("zenrows");
const axios = require("axios");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = "";
const baseURL = "https://pcpartpicker.com/products/cpu/";
const outputFile = "cpus_detailed.csv";
const client = new ZenRows(apiKey);
const maxCPUDetails = 99;  // Maximum number of CPU details to fetch
let cpuDetailsCount = 0;

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Core Count,Performance Core Clock,Performance Core Boost Clock,Efficiency Core Clock,Efficiency Core Boost Clock,TDP,Manufacturer,Part #,Integrated Graphics,Maximum Supported Memory,ECC Support,Includes Cooler,Packaging,Lithography,Includes CPU Cooler,Simultaneous Multithreading,Specs Number\n";
    fs.writeFileSync(outputFile, headers);
}

async function fetchCPUDetails(url, cpuName) {
    try {
        const { data } = await client.get(url, {
            "js_render": "true",
        });

        const root = parse(data);
        let specSelector = cpuName.includes("Intel") ? 
            '#product-page > div.main-wrapper.xs-col-12 > div.wrapper.wrapper__pageContent > section > div > div.main-content.col.xs-col-12.md-col-9.lg-col-9 > div.block.xs-block.md-hide.specs' : 
            '#product-page > div.main-wrapper.xs-col-12 > div.wrapper.wrapper__pageContent > section > div > div.sidebar-content.col.xs-col-12.md-col-3.lg-col-3 > div.block.xs-hide.md-block.specs';
        
        const specs = root.querySelector(specSelector);
        if (!specs) {
            console.error(`Specs section not found for ${url}`);
            return {};  // Return empty object if specs section is not found
        }
        const specsNum = specs.querySelectorAll("div.group.group--spec").length;
        
        let manufacturer, partNumber, series, microarchitecture, coreFamily, socket, coreCount, perfCoreClock, boostClock, effCoreClock,effBoostClock, l2Cache, l3Cache, tdp, integratedGraphics, maximumSupportedMemory, eccSupport, includesCooler, packaging, lithography, includesCPUCooler, simultaneousMultithreading;

        for(let i = 0; i <= specsNum; i++)
        {
            if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Manufacturer")
                manufacturer = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Part #")
                partNumber = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Series")
                series = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Microarchitecture")
                microarchitecture = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Core Family")
                coreFamily = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Socket")
                socket = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Core Count")
                coreCount = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Performance Core Clock")
                perfCoreClock = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Performance Core Boost Clock")
                boostClock = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Efficiency Core Clock")
                effCoreClock = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Efficiency Core Boost Clock")
                effBoostClock = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "L2 Cache")
                l2Cache = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "L3 Cache")
                l3Cache = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "TDP")
                tdp = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Integrated Graphics")
                integratedGraphics = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Maximum Supported Memory")
                maximumSupportedMemory = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "ECC Support")
                eccSupport = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Includes Cooler")
                includesCooler = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Packaging")
                packaging = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Lithography")
                lithography = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Includes CPU Cooler")
                includesCPUCooler = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
            else if( specs.querySelector(`div:nth-child(${i+1}) > h3`)?.innerText == "Simultaneous Multithreading")
                simultaneousMultithreading = specs.querySelector(`div:nth-child(${i+1}) > div > p`)?.innerText;
        }
        
        if (cpuDetailsCount < maxCPUDetails) {
            cpuDetailsCount++;
        } else {
            return {};  // If we reached the limit, return an empty object
        }

        return { manufacturer, partNumber, series, microarchitecture, socket, coreCount, perfCoreClock, boostClock, effCoreClock,effBoostClock, l2Cache, l3Cache, tdp, integratedGraphics, maximumSupportedMemory, eccSupport, includesCooler, packaging, lithography, includesCPUCooler, simultaneousMultithreading, specsNum };
    } catch (error) {
        console.error(`Error fetching details for ${url}: ${error.message}`);
        return {};  // Return empty object on failure
    }
}

async function scrapePage(pageNumber) {
    const url = baseURL + `#page=${pageNumber}`;
    let csvContent = "";  // Initialize csvContent for each scrape session

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

            if (cpuDetailsCount < maxCPUDetails) {
                const details = await fetchCPUDetails(productUrl, name);
                csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.coreCount || 'N/A'}","${details.perfCoreClock || 'N/A'}","${details.boostClock || 'N/A'}","${details.effCoreClock || 'N/A'}","${details.effBoostClock || 'N/A'}","${details.tdp || 'N/A'}","${details.manufacturer || 'N/A'}","${details.partNumber || 'N/A'}","${details.integratedGraphics || 'N/A'}","${details.maximumSupportedMemory || 'N/A'}","${details.eccSupport || 'N/A'}","${details.includesCooler || 'N/A'}","${details.packaging || 'N/A'}","${details.lithography || 'N/A'}","${details.includesCPUCooler || 'N/A'}","${details.simultaneousMultithreading || 'N/A'}","${details.specsNum || 'N/A'}"\n`;
            }
        }
        fs.appendFileSync(outputFile, csvContent);  // Append the accumulated csvContent to the file
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}

(async () => {
    await scrapePage(14);
    console.log("Data has been written to CSV file.");
})();
