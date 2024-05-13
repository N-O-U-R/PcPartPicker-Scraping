const { ZenRows } = require("zenrows");
const fs = require("fs");
const { parse } = require("node-html-parser");

const apiKey = "";
const baseURL = "https://pcpartpicker.com/products/motherboard/";
const outputFile = "motherboards_detailed.csv";
const client = new ZenRows(apiKey);

if (!fs.existsSync(outputFile)) {
    let headers = "Name,Image URL,Product URL,Price,Manufacturer,Model,Part #,Socket/CPU,Form Factor,Chipset,Memory Max,Memory Type,Memory Slots,Memory Speed,Color,PCIe x16 Slots,PCIe x8 Slots,PCIe x4 Slots,PCIe x1 Slots,PCI Slots,M.2 Slots,Mini-PCIe Slots,Half Mini-PCIe Slots,Mini-PCIe / mSATA Slots,mSATA Slots,SATA 6.0 Gb/s,Onboard Ethernet,Onboard Video,USB 2.0 Headers,USB 2.0 Headers (Single Port),USB 3.2 Gen 1 Headers,USB 3.2 Gen 2 Headers,USB 3.2 Gen 2x2 Headers,Supports ECC,Wireless Networking,RAID Support,Specs Number\n";
    fs.writeFileSync(outputFile, headers);
}

async function fetchMotherboardDetails(url) {
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
            socketCPU: "",
            formFactor: "",
            chipset: "",
            memoryMax: "",
            memoryType: "",
            memorySlots: "",
            memorySpeed: "",
            color: "",
            pcieX16Slots: "",
            pcieX8Slots: "",
            pcieX4Slots: "",
            pcieX1Slots: "",
            pciSlots: "",
            m2Slots: "",
            miniPCIeSlots: "",
            halfMiniPCIeSlots: "",
            miniPCIeMSATASlots: "",
            msataSlots: "",
            sata6Gb: "",
            onboardEthernet: "",
            onboardVideo: "",
            usb2Headers: "",
            usb2HeadersSinglePort: "",
            usb3Gen1Headers: "",
            usb3Gen2Headers: "",
            usb3Gen2x2Headers: "",
            supportsECC: "",
            wirelessNetworking: "",
            raidSupport: "",
            specsNum: specsNum
        };

        // Iterate through each spec group and extract information
        specs.querySelectorAll("div.group").forEach((group, index) => {
            let title = group.querySelector("h3")?.textContent;
            let value = group.querySelector("div > p")?.textContent || Array.from(group.querySelectorAll("div > ul > li")).map(li => li.textContent.trim()).join(', ');

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
                case "Socket / CPU":
                    details.socketCPU = value;
                    break;
                case "Form Factor":
                    details.formFactor = value;
                    break;
                case "Chipset":
                    details.chipset = value;
                    break;
                case "Memory Max":
                    details.memoryMax = value;
                    break;
                case "Memory Type":
                    details.memoryType = value;
                    break;
                case "Memory Slots":
                    details.memorySlots = value;
                    break;
                case "Memory Speed":
                    details.memorySpeed = value;
                    break;
                case "Color":
                    details.color = value;
                    break;
                case "PCIe x16 Slots":
                    details.pcieX16Slots = value;
                    break;
                case "PCIe x8 Slots":
                    details.pcieX8Slots = value;
                    break;
                case "PCIe x4 Slots":
                    details.pcieX4Slots = value;
                    break;
                case "PCIe x1 Slots":
                    details.pcieX1Slots = value;
                    break;
                case "PCI Slots":
                    details.pciSlots = value;
                    break;
                case "M.2 Slots":
                    details.m2Slots = value;
                    break;
                case "Mini-PCIe Slots":
                    details.miniPCIeSlots = value;
                    break;
                case "Half Mini-PCIe Slots":
                    details.halfMiniPCIeSlots = value;
                    break;
                case "Mini-PCIe / mSATA Slots":
                    details.miniPCIeMSATASlots = value;
                    break;
                case "mSATA Slots":
                    details.msataSlots = value;
                    break;
                case "SATA 6.0 Gb/s":
                    details.sata6Gb = value;
                    break;
                case "Onboard Ethernet":
                    details.onboardEthernet = value;
                    break;
                case "Onboard Video":
                    details.onboardVideo = value;
                    break;
                case "USB 2.0 Headers":
                    details.usb2Headers = value;
                    break;
                case "USB 2.0 Headers (Single Port)":
                    details.usb2HeadersSinglePort = value;
                    break;
                case "USB 3.2 Gen 1 Headers":
                    details.usb3Gen1Headers = value;
                    break;
                case "USB 3.2 Gen 2 Headers":
                    details.usb3Gen2Headers = value;
                    break;
                case "USB 3.2 Gen 2x2 Headers":
                    details.usb3Gen2x2Headers = value;
                    break;
                case "Supports ECC":
                    details.supportsECC = value;
                    break;
                case "Wireless Networking":
                    details.wirelessNetworking = value;
                    break;
                case "RAID Support":
                    details.raidSupport = value;
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
    const url = baseURL + `#page=${pageNumber}`;
    let csvContent = "";  // Initialize csvContent for each scrape session

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

            const details = await fetchMotherboardDetails(productUrl);
            csvContent += `"${name}","${imageUrl}","${productUrl}","${price}","${details.manufacturer || 'N/A'}","${details.model || 'N/A'}","${details.partNumber || 'N/A'}","${details.socketCPU || 'N/A'}","${details.formFactor || 'N/A'}","${details.chipset || 'N/A'}","${details.memoryMax || 'N/A'}","${details.memoryType || 'N/A'}","${details.memorySlots || 'N/A'}","${details.memorySpeed || 'N/A'}","${details.color || 'N/A'}","${details.pcieX16Slots || 'N/A'}","${details.pcieX8Slots || 'N/A'}","${details.pcieX4Slots || 'N/A'}","${details.pcieX1Slots || 'N/A'}","${details.pciSlots || 'N/A'}","${details.m2Slots || 'N/A'}","${details.miniPCIeSlots || 'N/A'}","${details.halfMiniPCIeSlots || 'N/A'}","${details.miniPCIeMSATASlots || 'N/A'}","${details.msataSlots || 'N/A'}","${details.sata6Gb || 'N/A'}","${details.onboardEthernet || 'N/A'}","${details.onboardVideo || 'N/A'}","${details.usb2Headers || 'N/A'}","${details.usb2HeadersSinglePort || 'N/A'}","${details.usb3Gen1Headers || 'N/A'}","${details.usb3Gen2Headers || 'N/A'}","${details.usb3Gen2x2Headers || 'N/A'}","${details.supportsECC || 'N/A'}","${details.wirelessNetworking || 'N/A'}","${details.raidSupport || 'N/A'}","${details.specsNum || 'N/A'}"\n`;
        }
        fs.appendFileSync(outputFile, csvContent, 'utf8'); // Make sure to specify the encoding
        console.log(`Page ${pageNumber} scraped successfully.`);
    } catch (error) {
        console.error(`Failed to scrape page ${pageNumber}: ${error.message}`);
    }
}


(async () => {
    for (let i = 1; i <= 2; i++) {
        await scrapePage(i);
    }
    console.log("Data has been written to CSV file.");
})();
