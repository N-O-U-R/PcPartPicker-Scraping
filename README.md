# PCPartPicker Site Scraper

## Overview
This repository contains the source code for a detailed web scraper designed to extract comprehensive data from the PCPartPicker site. It not only retrieves basic data from listings but also delves into each product's specifications page to fetch detailed attributes. The scraper targets various PC component categories such as GPUs, power supplies, cases, CPUs, CPU coolers, memory, storage, and motherboards. Implemented in Node.js, this tool uses the ZenRows API to circumvent site security measures, ensuring efficient data extraction.

## Technical Details
The PCPartPicker website employs robust security features that can block typical scraping efforts. To address this, we utilize ZenRows, which renders JavaScript and circumvents basic anti-bot protections. The HTML content fetched is parsed, and data is systematically extracted and stored into CSV files. The setup currently achieves about 90% accuracy in data extraction, proving invaluable for educational and research applications.

### Components Scraped
- **Graphics Cards (GPUs)**
- **Power Supplies**
- **Computer Cases**
- **CPUs**
- **CPU Coolers**
- **Memory**
- **Storage (SSDs and HDDs)**
- **Motherboards**

Each category is processed by its dedicated script that extracts detailed specifications like manufacturer, model, part number, and technical specifications, storing this data in CSV files named accordingly (e.g., `gpus_detailed.csv`, `cpus_detailed.csv`).

## Usage
To use the scraper:
1. Ensure Node.js is installed on your system.
2. Clone this repository.
3. Install dependencies with `npm install`.
4. Configure your ZenRows API key in the scripts.
5. Run the script corresponding to the component you wish to scrape, e.g., `node scrape_cpus.js`.

## Output
Data is output in CSV format, with files named according to the component type. Headers in each CSV correspond to the data fields extracted, providing a structured and comprehensive dataset.

## Educational Purpose
This project is strictly for educational purposes, demonstrating advanced web scraping techniques and the handling of anti-scraping technologies. Users should comply with the terms of service of PCPartPicker and use the data responsibly.

## Contributing
Contributions are welcomed, particularly those that enhance scraping efficiency or expand the range of components covered. Feel free to fork the repository and submit pull requests

---

For detailed instructions on how the scripts operate and setup guidance, refer to the specific script files within this repository.
