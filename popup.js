const scrapeButton = document.getElementById('scrapeButton');
const loader = document.getElementById('loader');
const statusDiv = document.getElementById('status');

scrapeButton.addEventListener('click', () => {
  scrapeButton.style.display = 'none';
  loader.style.display = 'block';
  statusDiv.textContent = 'Scrolling and scraping...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['content.js']
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scraping_complete') {
    loader.style.display = 'none';
    statusDiv.textContent = `Scraped ${request.count} products.`;
    
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download CSV';
    
    const csvData = convertToCSV(request.data);

    downloadButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: triggerDownload,
          args: [csvData]
        });
      });
    });
    
    document.body.appendChild(downloadButton);
  } else if (request.action === 'scraping_error') {
    loader.style.display = 'none';
    statusDiv.textContent = request.message;
    scrapeButton.style.display = 'block';
  }
});

// This function is injected into the page to trigger the download
function triggerDownload(csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'product_hunt_leaderboard.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// This function runs in the popup's context
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
