// Get references to the UI elements in the popup
const scrapeButton = document.getElementById('scrapeButton');
const loader = document.getElementById('loader');
const statusDiv = document.getElementById('status');

// Add a click event listener to the "Scrape Products" button
scrapeButton.addEventListener('click', () => {
  // Hide the scrape button and show the loader to indicate work is in progress
  scrapeButton.style.display = 'none';
  loader.style.display = 'block';
  statusDiv.textContent = 'Scrolling and scraping...';

  // Find the active tab and inject the content script into it
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js'] // The script that will perform the scraping
    });
  });
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // If the scraping was successful
  if (request.action === 'scraping_complete') {
    // Hide the loader and update the status message with the number of products found
    loader.style.display = 'none';
    statusDiv.textContent = `Scraped ${request.count} products.`;
    
    // Create a "Download CSV" button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download CSV';
    
    // Convert the scraped data into CSV format
    const csvData = convertToCSV(request.data);

    // When the download button is clicked, trigger the download in the active tab
    downloadButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: triggerDownload, // This function is defined below and will be injected
          args: [csvData]
        });
      });
    });
    
    // Add the download button to the popup's body
    document.body.appendChild(downloadButton);
  // If there was an error during scraping
  } else if (request.action === 'scraping_error') {
    // Hide the loader, display the error message, and show the scrape button again
    loader.style.display = 'none';
    statusDiv.textContent = request.message;
    scrapeButton.style.display = 'block';
  }
});

// This function is injected into the active tab to trigger the file download.
// It creates a temporary link with the CSV data and simulates a click.
function triggerDownload(csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'product_hunt_leaderboard.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Clean up the temporary link
}

// This function converts an array of objects into a CSV-formatted string.
// It runs in the popup's context.
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }
  // Use the keys from the first object as the CSV headers
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')]; // Start with the header row

  // Iterate over each product object to create a CSV row
  for (const row of data) {
    const values = headers.map(header => {
      // Escape double quotes within the data to prevent breaking the CSV format
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`; // Wrap each value in double quotes
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n'); // Join all rows with a newline character
}
