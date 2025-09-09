// Get references to the UI elements in the popup
const scrapeButton = document.getElementById('scrapeButton');
const loader = document.getElementById('loader');
const statusDiv = document.getElementById('status');
const statusCard = document.getElementById('statusCard');
const processMessage = document.getElementById('processMessage');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressPercentage = document.querySelector('.progress-percentage');
const progressText = document.querySelector('.progress-text');
const statsContainer = document.getElementById('stats');
const featuresCard = document.querySelector('.features-card');


// Check if current page is a ProductHunt leaderboard
async function isProductHuntLeaderboard() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url && 
           tab.url.includes('www.producthunt.com') && 
           tab.url.includes('/leaderboard');
  } catch (error) {
    console.error('Error checking current tab:', error);
    return false;
  }
}

// Check if current page is the main leaderboard page (not a specific leaderboard)
async function isMainLeaderboardPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url && 
           tab.url.includes('www.producthunt.com') && 
           tab.url === 'https://www.producthunt.com/leaderboard';
  } catch (error) {
    console.error('Error checking current tab:', error);
    return false;
  }
}

// Add warning message for URL collection phase
function addUrlCollectionWarning() {
  // Check if warning already exists
  if (statusCard.querySelector('.process-warning')) {
    return;
  }
  
  const warningDiv = document.createElement('div');
  warningDiv.className = 'process-warning';
  warningDiv.innerHTML = `
    <div class="warning-icon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="warning-text">Do not close this page or the extension while collecting website URLs. This may take a few minutes.</div>
  `;
  statusCard.appendChild(warningDiv);
}


// Show state for main leaderboard page (needs to navigate to specific leaderboard)
function showMainLeaderboardState() {
  statusDiv.innerHTML = `
    <div class="info-indicator">
      <div class="info-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 16V12M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="info-text">Navigate to a specific leaderboard to start scraping</div>
    </div>
  `;
  
  // Update button
  scrapeButton.disabled = false;
  scrapeButton.className = 'primary-button'; // Apply standard primary button style
  const btnText = scrapeButton.querySelector('.btn-text');
  const btnIcon = scrapeButton.querySelector('.btn-icon');
  
  btnText.textContent = 'Open ProductHunt leaderboard page';
  btnIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  // Add click handler for opening leaderboard
  scrapeButton.onclick = () => {
    window.open(getCurrentLeaderboardUrl(), '_blank');
  };
}

// Helper function to generate dynamic leaderboard URL
function getCurrentLeaderboardUrl() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
  return `https://www.producthunt.com/leaderboard/monthly/${year}/${month}/all`;
}

// State management
let currentStep = 'ready';
let totalProducts = 0;
let currentProduct = 0;

// Initialize popup - check if on correct page
document.addEventListener('DOMContentLoaded', async () => {
  const isOnLeaderboard = await isProductHuntLeaderboard();
  const isMainLeaderboard = await isMainLeaderboardPage();
  
  if (!isOnLeaderboard) {
    showMainLeaderboardState();
  } else if (isMainLeaderboard) {
    showMainLeaderboardState();
  }
});

// Add a click event listener to the "Start Extracting Products" button
scrapeButton.addEventListener('click', () => {
  // Hide the features card
  featuresCard.classList.add('hidden');
  
  // Show the status card
  statusCard.classList.remove('hidden');
  
  // Update UI for starting state
  scrapeButton.disabled = true;
  scrapeButton.className = 'primary-button'; // Reset to normal style for scraping
  const btnText = scrapeButton.querySelector('.btn-text');
  const btnIcon = scrapeButton.querySelector('.btn-icon');
  
  btnText.textContent = 'Scraping and Extracting Products';
  btnIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  
  statusDiv.innerHTML = `
    <div class="initializing-container">
      <div class="initializing-text">Fetching products from the leaderboard…</div>
      <div class="initializing-spinner"></div>
    </div>
    <div class="process-warning">
      <div class="warning-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="warning-text">Do not close this page or the extension. This can take up to a few minutes.</div>
    </div>
  `;
  statusDiv.className = 'status-text';
  
  currentStep = 'scraping';

  // Find the active tab and inject the content script into it
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('Injecting scripts into tab:', tabs[0].id);
    
    // First inject the URL analyzer and validator, then the content script
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ['url-analyzer.js', 'content.js'] // Load analyzer first, then content script
    }, () => {
      console.log('Scripts injected successfully, sending start_scraping message');
      // Send message to start scraping after scripts are injected
      chrome.tabs.sendMessage(tabs[0].id, { action: 'start_scraping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
        } else {
          console.log('Message sent successfully');
        }
      });
    });
  });
});

// Update progress bar
function updateProgress(current, total, message) {
  if (total > 0) {
    const percentage = Math.max(1, Math.round((current / total) * 100)); // Ensure minimum 1%
    
    // Only update if progress is moving forward
    const currentWidth = parseInt(progressBar.style.width) || 1;
    if (percentage > currentWidth) {
      progressBar.style.width = `${percentage}%`;
      
      if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
      }
    }
    
    // Update progress text with the processing message (bottom)
    if (progressText) {
      progressText.textContent = `Processing ${current}/${total}`;
    }
    
    // Keep status div with descriptive message only (top)
    if (!progressContainer.classList.contains('hidden')) {
      statusDiv.textContent = 'Fetching website links for the products...';
    }
  }
}

// Reset UI to initial state
function resetUI() {
  scrapeButton.classList.remove('secondary-button');
  scrapeButton.classList.add('primary-button');
  scrapeButton.textContent = 'Start Extracting Products';
  scrapeButton.disabled = false;
  
  loader.classList.add('hidden');
  progressContainer.classList.add('hidden');
  statsContainer.classList.add('hidden');
  
  progressBar.style.width = '1%';
  if (progressText) {
    progressText.textContent = 'Processing 0/0';
  }
  currentStep = 'ready';
  totalProducts = 0;
  currentProduct = 0;
  
  // Check if we're on the main leaderboard page and apply outline orange style
  if (isMainLeaderboardPage()) {
    showMainLeaderboardState();
  }
}

// Store data globally
let collectedUrls = null;
let analysisData = null;

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Scraping started and progress (both use same UI)
  if (request.action === 'scraping_started' || request.action === 'scraping_progress') {
    console.log('Scraping message:', request.message);
    statusDiv.innerHTML = `
      <div class="initializing-container">
        <div class="initializing-text">${request.message}</div>
        <div class="initializing-spinner"></div>
      </div>
      <div class="process-warning">
        <div class="warning-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="warning-text">Do not close this page or extension. This can take up to a few minutes.</div>
      </div>
    `;
  }
  
  
  // Scraping error
  else if (request.action === 'scraping_error') {
    console.error('Scraping error:', request.message);
    statusDiv.innerHTML = `
      <div class="error-indicator">
        <div class="error-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="error-text">${request.message}</div>
      </div>
    `;
    scrapeButton.disabled = false;
    scrapeButton.style.display = 'block';
  }
  
  // Phase 1: URLs collected - automatically start analysis
  else if (request.action === 'urls_collected') {
    console.log('URLs collected, starting analysis:', request);
    totalProducts = request.count;
    collectedUrls = request.data;
    currentStep = 'analyzing';
    
    // Hide the original scrape button
    scrapeButton.style.display = 'none';
    
    // Go directly to processing UI
    progressContainer.classList.remove('hidden');
    processMessage.classList.add('hidden'); // Hide the fetching message during processing
    progressBar.style.width = '1%';
    if (progressPercentage) {
      progressPercentage.textContent = '1%';
    }
    if (progressText) {
      progressText.textContent = `Processing 1/${totalProducts}`; // Show correct count with total
    }
    statusDiv.textContent = 'Fetching website links for the products...';
    
    // Add warning message for URL collection phase
    addUrlCollectionWarning();
    
    // Send message to content script to start URL analysis
    console.log('Sending start_url_analysis message to content script');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('Sending message to tab:', tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, { action: 'start_url_analysis' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending start_url_analysis message:', chrome.runtime.lastError);
        } else {
          console.log('start_url_analysis message sent successfully:', response);
        }
      });
    });
  }
  
  // If the initial scraping was successful (keeping for backward compatibility)
  else if (request.action === 'scraping_complete') {
    totalProducts = request.count;
    currentStep = 'analyzing';
    
    statusDiv.textContent = `Found ${request.count} products. Starting URL analysis...`;
    progressContainer.classList.remove('hidden');
    processMessage.classList.add('hidden'); // Hide the fetching message during processing
    progressBar.style.width = '1%';
    if (progressText) {
      progressText.textContent = `Processing 1/${request.count}`; // Show initial count
    }
    
    // Add warning message for URL collection phase
    addUrlCollectionWarning();
  }
  
  
  // Progress updates during analysis
  else if (request.action === 'analysis_progress') {
    console.log('Progress update received:', request);
    
    // Keep the process message hidden during progress updates
    processMessage.classList.add('hidden');
    
    // Show progress container
    progressContainer.classList.remove('hidden');
    
    // Check if we have direct progress percentage
    if (request.progress !== undefined) {
      const percentage = Math.max(1, Math.round(request.progress)); // Ensure minimum 1%
      console.log(`Updating progress to ${percentage}%`);
      
      // Only update if progress is moving forward
      const currentWidth = parseInt(progressBar.style.width) || 1;
      if (percentage > currentWidth) {
        progressBar.style.width = `${percentage}%`;
        
        if (progressPercentage) {
          progressPercentage.textContent = `${percentage}%`;
        }
      }
      
      if (progressText) {
        progressText.textContent = request.message || 'Processing...';
      }
      
      // Keep status div with descriptive message only (top)
      statusDiv.textContent = 'Fetching website links for the products...';
      
    } else {
      // Fallback to parsing message for progress info
      const match = request.message.match(/Processing (\d+)\/(\d+)/);
      if (match) {
        currentProduct = parseInt(match[1]);
        totalProducts = parseInt(match[2]);
        
        // Show progress container and update progress
        progressContainer.classList.remove('hidden');
        updateProgress(currentProduct, totalProducts, `Processing ${currentProduct}/${totalProducts}`);
      } else {
        statusDiv.textContent = 'Processing...';
      }
    }
  }
  
  // If the analysis was successful
  else if (request.action === 'analysis_complete') {
    currentStep = 'complete';
    
    // Hide the loader and show completion state
    loader.classList.add('hidden');
    progressBar.style.width = '100%';
    
    // Ensure progress percentage shows 100%
    if (progressPercentage) {
      progressPercentage.textContent = '100%';
    }
    
    // Update progress text to show completion
    if (progressText) {
      progressText.textContent = 'Analysis Complete';
    }
    
    // Store the analysis data
    analysisData = request.data;
    
    
    // Show success state with validation count
    statusDiv.innerHTML = `
      <div class="success-indicator">
        <div class="success-icon">✓</div>
        Dataset Ready! Processed ${request.count} Products
      </div>
    `;
    
    // Hide the progress container and its title
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) {
      progressContainer.classList.add('hidden');
    }
    
    // Hide the process message and warning when download button is ready
    processMessage.classList.add('hidden');
    
    // Remove any warning messages from status card
    const warningElements = statusCard.querySelectorAll('.process-warning, .warning-icon, .warning-text, .process-warning');
    warningElements.forEach(element => {
      if (element && element.parentNode) {
        element.remove();
      }
    });
    
    // Also remove any warning divs that might be blocking the view
    const allWarnings = document.querySelectorAll('[class*="warning"], [class*="process"]');
    allWarnings.forEach(element => {
      if (element && element.parentNode && element !== statusCard) {
        element.style.display = 'none';
      }
    });
    
    // Reset button state
    scrapeButton.disabled = false;
    const btnText = scrapeButton.querySelector('.btn-text');
    const btnIcon = scrapeButton.querySelector('.btn-icon');
    btnText.textContent = 'Start Extracting Products';
    btnIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/></svg>';
    
    // Hide the main button
    scrapeButton.style.display = 'none';
    
    // Create download CSV button (positioned right after status card)
    const downloadButton = document.createElement('button');
    downloadButton.textContent = `Download CSV (${analysisData.length} Products)`;
    downloadButton.className = 'primary-button';
    downloadButton.style.marginTop = '16px';
    
    // Convert the analysis data into CSV format
    console.log(`Converting ${analysisData.length} results to CSV`);
    if (analysisData.length > 0) {
      console.log(`First item finalUrl before CSV conversion:`, analysisData[0].finalUrl);
    }
    const csvData = convertAnalysisToCSV(analysisData);

    // When the download button is clicked, trigger the download in the active tab
    downloadButton.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: triggerDownload,
          args: [csvData, 'producthunt_scraper_list.csv']
        });
      });
      
      // Show success message after download
      setTimeout(() => {
        statusDiv.innerHTML = `
          <div class="success-indicator">
            <div class="success-icon">✓</div>
            ${analysisData.length} Products are successfully fetched from the leaderboard!
          </div>
        `;
        
        // Hide the download button after successful download
        downloadButton.style.display = 'none';
      }, 500);
    });
    
    // Insert the download button right after the status card
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const statusCard = document.querySelector('.status-card');
      const featuresSection = document.querySelector('.features-card');
      
      if (statusCard) {
        // Ensure the download button is visible
        downloadButton.style.display = 'block';
        downloadButton.style.width = '100%';
        downloadButton.style.marginTop = '16px';
        
        if (featuresSection) {
          statusCard.parentNode.insertBefore(downloadButton, featuresSection);
        } else {
          // If no features section, append after status card
          statusCard.parentNode.appendChild(downloadButton);
        }
        
        // Debug: Log that download button was created
        console.log('Download button created and inserted:', downloadButton.textContent);
        console.log('Download button parent:', downloadButton.parentNode);
      } else {
        console.error('Status card not found for download button insertion');
      }
    }, 100);
  }
  
  // If there was an error during scraping
  else if (request.action === 'scraping_error') {
    statusDiv.textContent = `Error: ${request.message}`;
    resetUI();
  }
  
  // If there was an error during analysis
  else if (request.action === 'analysis_error') {
    statusDiv.textContent = `Analysis failed: ${request.message}`;
    resetUI();
  }
});

// This function is injected into the active tab to trigger the file download.
// It creates a temporary link with the CSV data and simulates a click.
function triggerDownload(csvContent, filename = 'producthunt_scraper_list.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // Clean up the temporary link
}

// This function converts analysis data to CSV format matching the Python script output
function convertAnalysisToCSV(data) {
  if (!data || data.length === 0) {
    console.log("No data to convert to CSV");
    return "";
  }
  
  console.log("First row in CSV conversion:", data[0]);
  console.log("Final URL in first row:", data[0].finalUrl);
  
  // Define headers including ProductHunt data, analysis results, and validation data
  const headers = [
    'Product Name',
    'Description',
    'Categories',
    'ProductHunt URL',
    'Comments',
    'Upvotes',
    'ProductHunt URLS',
    'Website URL'
  ];
  
  const csvRows = [headers.join(',')]; // Start with the header row

  // Iterate over each analysis result to create a CSV row
  for (const row of data) {
    console.log(`Processing row with finalUrl: ${row.finalUrl}`);
    
    const values = headers.map(header => {
      let value = '';
      
      // Map CSV headers to actual data field names
      switch(header) {
        case 'Product Name':
          value = row.productName || 'N/A';
          break;
        case 'Description':
          value = row.description || 'N/A';
          break;
        case 'Categories':
          value = row.categories || 'N/A';
          break;
        case 'ProductHunt URL':
          value = row.productHuntUrl || 'N/A';
          break;
        case 'Comments':
          value = row.comments || 'N/A';
          break;
        case 'Upvotes':
          value = row.pods || 'N/A';
          break;
        case 'ProductHunt URLS':
          value = row.originalUrl || 'N/A';
          break;
        case 'Website URL':
          value = row.finalUrl || '';
          console.log(`Setting Website URL to: ${value}`);
          break;
        // No data extraction columns needed
        default:
          value = row[header] || '';
      }
      
      // Escape double quotes within the data to prevent breaking the CSV format
      const escaped = ('' + value).replace(/"/g, '\\"');
      return `"${escaped}"`; // Wrap each value in double quotes
    });
    csvRows.push(values.join(','));
  }

  const finalCsv = csvRows.join('\n');
  
  // Debug log to check CSV output
  console.log(`CSV generation complete. First 200 chars: ${finalCsv.substring(0, 200)}...`);
  console.log(`CSV contains Final URL column: ${finalCsv.includes('Final URL')}`);
  
  return finalCsv; // Join all rows with a newline character
}
