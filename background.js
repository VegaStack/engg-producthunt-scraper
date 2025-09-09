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
      chrome.action.setBadgeBackgroundColor({ color: '#FF5164', tabId: tabId });
      chrome.action.setBadgeTextColor({ color: '#FF5164', tabId: tabId });
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

// Handle URL analysis requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyze_url') {
    analyzeUrl(request.url)
      .then(finalUrl => {
        sendResponse({
          success: true,
          finalUrl: finalUrl
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });
    return true; // Keep message channel open for async response
  }
});

// Clean URL by removing ProductHunt specific parameters
function cleanUrl(url) {
  if (!url) return 'N/A';
  
  // Remove ProductHunt specific parameters
  let cleanedUrl = url;
  
  // Remove ?ref=producthunt parameter
  cleanedUrl = cleanedUrl.replace(/\?ref=producthunt.*$/, '');
  
  // Remove other common tracking parameters
  cleanedUrl = cleanedUrl.replace(/\?utm_source=producthunt.*$/, '');
  cleanedUrl = cleanedUrl.replace(/\?source=producthunt.*$/, '');
  
  // Remove any remaining query parameters that might be tracking
  cleanedUrl = cleanedUrl.replace(/\?ref=.*$/, '');
  
  return cleanedUrl;
}

// Analyze URL using background script (bypasses CORS)
async function analyzeUrl(url) {
  try {
    
    // Use fetch with no-cors mode to bypass CORS restrictions
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      mode: 'no-cors'
    });
    
    // For no-cors mode, we can't access response.url directly
    // So we'll try a different approach
    const corsResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }).catch(() => null);
    
    if (corsResponse && corsResponse.url && !corsResponse.url.includes('producthunt.com')) {
      const cleanedUrl = cleanUrl(corsResponse.url);
      return cleanedUrl;
    }
    
    // If CORS fails, try to extract from the original URL
    const phMatch = url.match(/\/r\/p\/(\d+)/);
    if (phMatch) {
      const productId = phMatch[1];
      const productPageUrl = `https://www.producthunt.com/posts/${productId}`;
      
      try {
        const pageResponse = await fetch(productPageUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (pageResponse.ok) {
          const html = await pageResponse.text();
          
          // Look for website URL in JSON data
          const websiteMatch = html.match(/"website_url":"([^"]+)"/);
          if (websiteMatch) {
            const websiteUrl = cleanUrl(websiteMatch[1]);
            return websiteUrl;
          }
        }
      } catch (error) {
      }
    }
    
    return url; // Return original URL if all methods fail
    
  } catch (error) {
    console.error(`Background script URL analysis failed: ${error.message}`);
    return url;
  }
}

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


