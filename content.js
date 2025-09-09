// This function is the main entry point for the content script.
// It scrolls to the bottom of the page to load all products and then scrapes the data.
async function scrollToBottomAndScrape() {
  try {
    console.log('🚀 Starting ProductHunt scraping process...');
    
    let initialProductCount = document.querySelectorAll('section[data-test^="post-item-"]').length;
    
    // Send initial message to popup
    chrome.runtime.sendMessage({ 
      action: 'scraping_started', 
      message: `Fetching product links... Found ${initialProductCount} products so far` 
    });
    let currentProductCount = initialProductCount;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // Reduced for faster processing
    let noNewProductsCount = 0;
    const maxNoNewProducts = 3; // Stop after 3 consecutive attempts with no new products
    
    console.log(`📊 Initial products found: ${initialProductCount}`);
    
    // Simple scrolling strategy
    while (scrollAttempts < maxScrollAttempts && noNewProductsCount < maxNoNewProducts) {
      scrollAttempts++;
      console.log(`\n🔄 Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`);
      
      // Count products before scroll
      const productsBeforeScroll = document.querySelectorAll('section[data-test^="post-item-"]');
      const productCountBeforeScroll = productsBeforeScroll.length;
      
      // Scroll to bottom
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Count products after scroll
      const productsAfterScroll = document.querySelectorAll('section[data-test^="post-item-"]');
      const productCountAfterScroll = productsAfterScroll.length;
      
      if (productCountAfterScroll > productCountBeforeScroll) {
        console.log(`✅ Found ${productCountAfterScroll - productCountBeforeScroll} new products! Total: ${productCountAfterScroll}`);
        currentProductCount = productCountAfterScroll;
        noNewProductsCount = 0; // Reset counter
        
        // Send progress update
        chrome.runtime.sendMessage({ 
          action: 'scraping_progress', 
          count: productCountAfterScroll,
          message: `Fetching product links... Found ${productCountAfterScroll} products so far` 
        });
      } else {
        noNewProductsCount++;
        console.log(`⚠️ No new products found. Total: ${productCountAfterScroll} (${noNewProductsCount}/${maxNoNewProducts})`);
      }
      
      // Check for load more buttons
      const loadMoreButtons = document.querySelectorAll('button');
      const loadMoreButton = Array.from(loadMoreButtons).find(button => {
        const text = button.textContent.toLowerCase().trim();
        return (text.includes('load more') || 
                text.includes('show more') || 
                text.includes('see more')) && 
               button.offsetParent !== null;
      });
      
      if (loadMoreButton) {
        console.log('🔘 Found load more button, clicking...');
        loadMoreButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const productsAfterClick = document.querySelectorAll('section[data-test^="post-item-"]');
        const productCountAfterClick = productsAfterClick.length;
        
        if (productCountAfterClick > currentProductCount) {
          console.log(`✅ New products loaded after clicking! Total: ${productCountAfterClick}`);
          currentProductCount = productCountAfterClick;
          noNewProductsCount = 0;
        }
      }
      
      // Short delay between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🏁 Scrolling complete! Final products found: ${currentProductCount}`);
    
    // Collect products
    console.log('📋 Collecting product data...');
    const products = scrapeProducts();
    console.log(`✅ Collected ${products.length} products`);
    
    if (products.length > 0) {
      // Store products globally
      collectedProducts = products;
      
      // Send success message
      chrome.runtime.sendMessage({ 
        action: 'urls_collected', 
        count: products.length, 
        data: products,
        message: `Fetching product links... Found ${products.length} products so far` 
      });
    } else {
      // Send error message
      chrome.runtime.sendMessage({ 
        action: 'scraping_error', 
        message: 'No products found after scrolling' 
      });
    }
  } catch (error) {
    console.error('❌ Scraping error:', error);
    chrome.runtime.sendMessage({ 
      action: 'scraping_error', 
      message: `Scraping failed: ${error.message}` 
    });
  }
}

// Analyze ProductHunt URLs to get final destinations and social media data
async function analyzeProductUrls(products) {
  try {
    chrome.runtime.sendMessage({ 
      action: 'analysis_started', 
      message: 'Starting high-speed URL analysis...' 
    });

    // Initialize URL analyzer only
    const analyzer = new UrlAnalyzer();
    const analysisResults = [];
    
    // Configuration for optimized concurrent processing with gradual ramp-up
    const MAX_WORKERS = 50; // Reduced to prevent server overload
    const MAX_TIMEOUT = 15000; // 15 seconds timeout per URL for better success rate
    const INITIAL_DELAY = 2000; // 2 seconds delay for first few workers 
    const RAMP_UP_DELAY = 500; // 500ms delay between workers after ramp-up
    const RAMP_UP_COUNT = 10; // First 10 workers get longer delays
    
    // Filter valid URLs
    const validProducts = products.filter(product => 
      product['Product Id Url'] && product['Product Id Url'] !== 'N/A'
    );
    
    console.log(`Starting optimized processing with gradual ramp-up for ${validProducts.length} URLs`);
    console.log(`Configuration: ${MAX_WORKERS} max workers, ${RAMP_UP_COUNT} ramp-up workers`);
    console.log(`Ramp-up: First ${RAMP_UP_COUNT} workers with ${INITIAL_DELAY}ms delays`);
    console.log(`Normal: Remaining workers with ${RAMP_UP_DELAY}ms delays`);
    
    // ThreadPoolExecutor-like concurrent processing with gradual ramp-up
    // Create worker promises (similar to ThreadPoolExecutor.submit())
    const workerPromises = validProducts.map(async (product, index) => {
      // Gradual ramp-up: first 10 workers get longer delays, then faster
      let delay;
      if (index < RAMP_UP_COUNT) {
        // First 10 workers: 2 seconds each (20 seconds total)
        delay = index * INITIAL_DELAY;
        console.log(`RAMP-UP Worker ${index + 1}: Starting after ${delay}ms delay`);
      } else {
        // Remaining workers: 500ms each after ramp-up
        delay = (RAMP_UP_COUNT * INITIAL_DELAY) + ((index - RAMP_UP_COUNT) * RAMP_UP_DELAY);
        console.log(`NORMAL Worker ${index + 1}: Starting after ${delay}ms delay`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const productIdUrl = product['Product Id Url'];
      
      try {
        // Add individual timeout for each URL with retry mechanism
        let analysisResult;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            const analysisPromise = analyzer.analyzeUrl(productIdUrl);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Timeout after ${MAX_TIMEOUT}ms`)), MAX_TIMEOUT);
            });
            
            analysisResult = await Promise.race([analysisPromise, timeoutPromise]);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`Worker ${index + 1} retry ${retryCount}/${maxRetries} for ${productIdUrl}: ${error.message}`);
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
            } else {
              throw error; // Max retries reached, throw error
            }
          }
        }
        
        // Update progress periodically (every 10 URLs)
        if (index % 10 === 0) {
          const progress = Math.round(((index + 1) / validProducts.length) * 100);
          chrome.runtime.sendMessage({
            action: 'analysis_progress',
            progress: progress,
            message: `Processing ${index + 1}/${validProducts.length}`
          });
        }
        
        // Debug logging for this URL
        console.log(`WORKER ${index + 1} - Analysis result for ${productIdUrl}:`);
        console.log(`  Final URL: ${analysisResult.finalUrl}`);
        console.log(`  Final URL type: ${typeof analysisResult.finalUrl}`);
        console.log(`  Final URL truthy: ${!!analysisResult.finalUrl}`);
        
        // Combine product data with analysis result - simplified
        return {
          // ProductHunt data
          productName: product['Product Name'] || 'N/A',
          description: product['Description'] || 'N/A',
          categories: product['Categories'] || 'N/A',
          productHuntUrl: product['ProductHunt URL'] || 'N/A',
          comments: product['Comments'] || 'N/A',
          pods: product['Pods'] || 'N/A',
          // Analysis data
          originalUrl: analysisResult.originalUrl,
          finalUrl: analysisResult.finalUrl || 'N/A',
          redirectStatus: analysisResult.redirectStatus,
          extractionStatus: analysisResult.extractionStatus,
          socialUrls: [],
          emails: [],
          phoneNumbers: [],
          signupUrls: []
        };
        
      } catch (error) {
        console.error(`Worker ${index + 1} error analyzing ${productIdUrl}:`, error);
        
        // Return error result - simplified
        return {
          // ProductHunt data
          productName: product['Product Name'] || 'N/A',
          description: product['Description'] || 'N/A',
          categories: product['Categories'] || 'N/A',
          productHuntUrl: product['ProductHunt URL'] || 'N/A',
          comments: product['Comments'] || 'N/A',
          pods: product['Pods'] || 'N/A',
          // Analysis data
          originalUrl: productIdUrl,
          finalUrl: 'N/A',
          redirectStatus: `Error: ${error.message}`,
          extractionStatus: 'Failed',
          socialUrls: [],
          emails: [],
          phoneNumbers: [],
          signupUrls: []
        };
      }
    });
    
    // Wait for all workers to complete (like executor.shutdown(wait=True))
    console.log(`Waiting for all ${MAX_WORKERS} workers to complete...`);
    const allResults = await Promise.allSettled(workerPromises);
    
    // Collect successful results
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        analysisResults.push(result.value);
      } else {
        // Handle rejected promises
        analysisResults.push({
          // ProductHunt data
          productName: 'Unknown',
          description: 'N/A',
          categories: 'N/A',
          productHuntUrl: 'N/A',
          comments: 'N/A',
          pods: 'N/A',
          // Analysis data
          originalUrl: 'Unknown',
          finalUrl: 'N/A',
          redirectStatus: `Worker Error: ${result.reason}`,
          extractionStatus: 'Failed',
          socialUrls: [],
          emails: [],
          phoneNumbers: [],
          signupUrls: []
        });
      }
    });
    
    // Add skipped products (those without valid URLs)
    products.forEach(product => {
      const productIdUrl = product['Product Id Url'];
      if (!productIdUrl || productIdUrl === 'N/A') {
        analysisResults.push({
          // ProductHunt data
          productName: product['Product Name'] || 'N/A',
          description: product['Description'] || 'N/A',
          categories: product['Categories'] || 'N/A',
          productHuntUrl: product['ProductHunt URL'] || 'N/A',
          comments: product['Comments'] || 'N/A',
          pods: product['Pods'] || 'N/A',
          // Analysis data
          originalUrl: productIdUrl || 'N/A',
          finalUrl: 'N/A',
          redirectStatus: 'Skipped - No URL',
          extractionStatus: 'Skipped',
          socialUrls: [],
          emails: [],
          phoneNumbers: [],
          signupUrls: []
          // Removed count fields
        });
      }
    });
    
    // STEP 6: Generate CSV file with all collected data
    console.log(`STEP 6: Preparing CSV file with ${analysisResults.length} analyzed URLs...`);
    
    // Debug log analysis results before sending
    console.log(`Sending ${analysisResults.length} analysis results to popup`);
    if (analysisResults.length > 0) {
      console.log(`First result:`, analysisResults[0]);
      console.log(`First result finalUrl:`, analysisResults[0].finalUrl);
    }
    
    // No validation needed
    
    // Send final analysis results for CSV generation
    chrome.runtime.sendMessage({ 
      action: 'analysis_complete', 
      count: analysisResults.length,
      data: analysisResults,
      message: `Analysis complete! Processed ${analysisResults.length} URLs.`
    });
    
    console.log(`STEP 6 Complete: CSV file ready for download with comprehensive data`);
    
  } catch (error) {
    chrome.runtime.sendMessage({ 
      action: 'analysis_error', 
      message: `Analysis failed: ${error.message}` 
    });
  }
}

// This function scrapes the product data from the page's HTML.
function scrapeProducts() {
  const products = [];
  // Select all product card elements using a data-test attribute
  const productCards = document.querySelectorAll('section[data-test^="post-item-"]');

  // Iterate over each product card to extract the required information
  productCards.forEach(card => {
    // Scrape the product name
    const nameElement = card.querySelector('a[data-test^="post-name-"]');
    const name = nameElement ? nameElement.innerText.trim() : 'N/A';

    // Scrape the product description
    const descriptionElement = card.querySelector('a.text-secondary');
    const description = descriptionElement ? descriptionElement.innerText.trim() : 'N/A';

    // Scrape the product categories
    const categoryElements = card.querySelectorAll('a[href*="/topics/"]');
    const categories = Array.from(categoryElements).map(el => el.innerText.trim()).join(', ');

    // Scrape the ProductHunt URL
    const linkElement = card.querySelector('a[data-test^="post-name-"]');
    const productHuntUrl = linkElement ? `https://www.producthunt.com${linkElement.getAttribute('href')}` : 'N/A';

    // Scrape the number of comments
    const allButtons = Array.from(card.querySelectorAll('button'));
    const commentButton = allButtons.find(btn => btn.querySelector('p') && !btn.matches('[data-test="vote-button"]'));
    const comments = commentButton ? commentButton.querySelector('p').innerText.trim() : 'N/A';

    // Scrape the number of pods (upvotes)
    const podsElement = card.querySelector('button[data-test="vote-button"] p');
    const pods = podsElement ? podsElement.innerText.trim() : 'N/A';

    // Scrape the direct product ID URL
    const productIdUrlElement = card.querySelector('a[data-test^="post-name-"]');
    const productId = productIdUrlElement ? productIdUrlElement.getAttribute('data-test').split('-').pop() : null;
    const productIdUrl = productId ? `https://www.producthunt.com/r/p/${productId}` : 'N/A';

    // Add the scraped data as an object to the products array
    products.push({
      'Product Name': name,
      'Description': description,
      'Categories': categories,
      'ProductHunt URL': productHuntUrl,
      'Comments': comments,
      'Pods': pods,
      'Product Id Url': productIdUrl
    });
  });

  return products;
}


// Global variables to store collected data
let collectedProducts = [];

// Listen for messages from popup to determine which phase to run
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'start_scraping') {
    console.log('Starting scraping process...');
    // Start the scraping process when popup requests it
    scrollToBottomAndScrape();
  } else if (request.action === 'start_url_analysis') {
    console.log('Received start_url_analysis message');
    console.log('Collected products count:', collectedProducts.length);
    if (collectedProducts.length > 0) {
      console.log('Starting URL analysis...');
      analyzeProductUrls(collectedProducts);
    } else {
      console.error('No products collected, cannot start URL analysis');
      chrome.runtime.sendMessage({ 
        action: 'analysis_error', 
        message: 'No products collected for analysis' 
      });
    }
  }
  
  // Send response back to popup
  sendResponse({ received: true });
});
