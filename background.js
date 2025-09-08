// Background script to handle content fetching and bypass CORS restrictions

// Check if URL is a ProductHunt leaderboard page
function isProductHuntLeaderboard(url) {
  return url && 
         url.includes('www.producthunt.com') && 
         url.includes('/leaderboard');
}

// Update extension badge based on current tab
async function updateBadge(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isProductHuntLeaderboard(tab.url)) {
      // Set an orange round dot badge when on leaderboard page
      chrome.action.setBadgeText({ text: '●', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#F97316', tabId: tabId });
      chrome.action.setBadgeTextColor({ color: '#F97316', tabId: tabId });
    } else {
      // Clear badge when not on leaderboard page
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateBadge(tabId);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateBadge(activeInfo.tabId);
});

// Update badge when extension starts
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      updateBadge(tabs[0].id);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetch_content') {
    fetchContentForUrl(request.url)
      .then(content => {
        sendResponse({ success: true, content: content });
      })
      .catch(error => {
        console.error('Background fetch error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

async function fetchContentForUrl(url) {
  try {
    console.log(`Background script fetching content for: ${url}`);
    
    // Use fetch with proper headers to bypass CORS
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    console.log(`Successfully fetched ${content.length} characters from ${url}`);
    
    return content;
    
  } catch (error) {
    console.error(`Failed to fetch content for ${url}:`, error);
    
    // Try alternative approach using a proxy service
    try {
      return await fetchViaProxy(url);
    } catch (proxyError) {
      console.error(`Proxy fetch also failed for ${url}:`, proxyError);
      throw new Error(`CORS blocked and proxy failed: ${error.message}`);
    }
  }
}


