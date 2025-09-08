// This function is the main entry point for the content script.
// It scrolls to the bottom of the page to load all products and then scrapes the data.
async function scrollToBottomAndScrape() {
  try {
    let previousHeight = 0;
    let currentHeight = document.body.scrollHeight;
    let noNewContentCount = 0; // Count consecutive attempts with no new content
    const maxNoNewContent = 5; // Increased to 5 attempts before stopping
    let lastProductCount = 0; // Track product count to detect loading
    
    console.log('Starting slow, patient scrolling to load all products...');
    
    // Continuous scrolling strategy: Scroll to 95% of page height (5% gap from bottom) continuously and slowly
    let initialProductCount = document.querySelectorAll('section[data-test^="post-item-"]').length;
    let currentProductCount = initialProductCount;
    let scrollAttempts = 0;
    const maxScrollAttempts = 200; // Increased for continuous scrolling
    let noNewProductsCount = 0; // Count consecutive attempts with no new products
    const maxNoNewProducts = 5; // Stop after 5 consecutive attempts with no new products
    let lastKnownProductCount = initialProductCount;
    
    console.log(`Starting continuous slow scrolling to 95% of page height (5% gap from bottom). Initial products: ${initialProductCount}`);
    
    while (scrollAttempts < maxScrollAttempts && noNewProductsCount < maxNoNewProducts) {
      scrollAttempts++;
      console.log(`\n=== Scroll Attempt ${scrollAttempts}/${maxScrollAttempts} ===`);
      
      // Count products before this scroll attempt
      const productsBeforeScroll = document.querySelectorAll('section[data-test^="post-item-"]');
      const productCountBeforeScroll = productsBeforeScroll.length;
      
      console.log(`Products before scroll ${scrollAttempts}: ${productCountBeforeScroll}`);
      
      // Scroll to 95% of page height (5% gap from bottom)
      const pageHeight = document.body.scrollHeight;
      const scrollTo95Percent = Math.floor(pageHeight * 0.95);
      
      console.log(`Scrolling to 95% of page height (${scrollTo95Percent}px) - 5% gap from bottom...`);
      window.scrollTo({
        top: scrollTo95Percent,
        behavior: 'smooth'
      });
      
      // Wait slowly for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if new products loaded
      const productsAfterScroll = document.querySelectorAll('section[data-test^="post-item-"]');
      const productCountAfterScroll = productsAfterScroll.length;
      
      if (productCountAfterScroll > productCountBeforeScroll) {
        console.log(`✓ Found ${productCountAfterScroll - productCountBeforeScroll} new products! Total: ${productCountAfterScroll}`);
        lastKnownProductCount = productCountAfterScroll;
        noNewProductsCount = 0; // Reset counter since we found new products
        currentProductCount = productCountAfterScroll;
        
        // Continue scrolling since we found new products
        console.log(`Continuing to scroll for more products...`);
      } else {
        noNewProductsCount++;
        console.log(`⚠ No new products found. Total: ${productCountAfterScroll} (${noNewProductsCount}/${maxNoNewProducts})`);
        
        // Try scrolling to actual bottom (100%) to trigger more loading
        if (noNewProductsCount >= 3) {
          console.log(`Trying to scroll to actual bottom (100%) to trigger more loading...`);
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check again after scrolling to actual bottom
          const productsAtBottom = document.querySelectorAll('section[data-test^="post-item-"]');
          const productCountAtBottom = productsAtBottom.length;
          
          if (productCountAtBottom > productCountAfterScroll) {
            console.log(`✓ Found ${productCountAtBottom - productCountAfterScroll} more products at actual bottom!`);
            lastKnownProductCount = productCountAtBottom;
            noNewProductsCount = 0; // Reset counter
            currentProductCount = productCountAtBottom;
          }
        }
      }
      
      // Update page height
      currentHeight = document.body.scrollHeight;
      
      // Check for load more buttons every 10 scroll attempts
      if (scrollAttempts % 10 === 0) {
        console.log(`Checking for load more buttons after scroll ${scrollAttempts}...`);
        
        const loadMoreButtons = document.querySelectorAll('button');
        const hasLoadMore = Array.from(loadMoreButtons).some(button => {
          const text = button.textContent.toLowerCase().trim();
          return (text.includes('load more') || 
                  text.includes('show more') || 
                  text.includes('see more') ||
                  text.includes('load additional') ||
                  text.includes('view more')) && 
                 button.offsetParent !== null;
        });
        
        if (hasLoadMore) {
          console.log('Found load more button, clicking...');
          const loadMoreButton = Array.from(loadMoreButtons).find(button => {
            const text = button.textContent.toLowerCase().trim();
            return (text.includes('load more') || 
                    text.includes('show more') || 
                    text.includes('see more') ||
                    text.includes('load additional') ||
                    text.includes('view more')) && 
                   button.offsetParent !== null;
          });
          
          if (loadMoreButton) {
            loadMoreButton.click();
            console.log('Clicked load more button, waiting for products to load...');
            
            // Wait for products to load after clicking
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const productsAfterClick = document.querySelectorAll('section[data-test^="post-item-"]');
            const productCountAfterClick = productsAfterClick.length;
            
            if (productCountAfterClick > lastKnownProductCount) {
              console.log(`✓ New products loaded after clicking! Products: ${lastKnownProductCount} -> ${productCountAfterClick}`);
              lastKnownProductCount = productCountAfterClick;
              noNewProductsCount = 0; // Reset counter
            }
            
            currentHeight = document.body.scrollHeight;
          }
        }
      }
      
      // Slow delay between scroll attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n=== Scroll Cycles Complete ===`);
    console.log(`Total products found: ${lastProductCount} (started with ${initialProductCount})`);
    console.log(`Final page height: ${currentHeight}`);
    
    // Final verification - scroll to 95% one more time (5% gap from bottom)
    console.log('Performing final verification - scrolling to 95% one more time (5% gap from bottom)...');
    
    const productsBeforeFinal = document.querySelectorAll('section[data-test^="post-item-"]');
    const productCountBeforeFinal = productsBeforeFinal.length;
    
    console.log(`Products before final verification: ${productCountBeforeFinal}`);
    
    // Scroll to 95% of page height (5% gap from bottom) one more time
    const pageHeight = document.body.scrollHeight;
    const scrollTo95Percent = Math.floor(pageHeight * 0.95);
    
    window.scrollTo({
      top: scrollTo95Percent,
      behavior: 'smooth'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check after final scroll to 95%
    const productsAfterFinal = document.querySelectorAll('section[data-test^="post-item-"]');
    const productCountAfterFinal = productsAfterFinal.length;
    
    if (productCountAfterFinal > productCountBeforeFinal) {
      console.log(`✓ Found ${productCountAfterFinal - productCountBeforeFinal} new products after final scroll to 95%!`);
      lastProductCount = productCountAfterFinal;
    } else {
      console.log(`⚠ No new products found after final scroll to 95%.`);
    }
    
    const finalProductCount = document.querySelectorAll('section[data-test^="post-item-"]').length;
    console.log(`Final verification complete. Total products found: ${finalProductCount}, Total height: ${document.body.scrollHeight}`);

    // STEP 1: Collect Product Hunt URLs from the page
    console.log(`STEP 1: Collecting Product Hunt URLs from current page...`);
    const products = scrapeProducts();
    console.log(`STEP 1 Complete: Collected ${products.length} Product Hunt URLs`);
    
    if (products.length > 0) {
      // Store products globally for potential URL analysis
      collectedProducts = products;
      
      // Send initial scraping complete message with basic Product Hunt URLs
      chrome.runtime.sendMessage({ 
        action: 'urls_collected', 
        count: products.length, 
        data: products,
        message: `Collected ${products.length} Product Hunt URLs` 
      });
    } else {
      // If no products were found, send an error message
      chrome.runtime.sendMessage({ 
        action: 'scraping_error', 
        message: 'No products found after scrolling.' 
      });
    }
  } catch (error) {
    // If any other error occurs, send a generic error message
    chrome.runtime.sendMessage({ 
      action: 'scraping_error', 
      message: `An error occurred: ${error.message}` 
    });
  }
}

// Analyze Product Hunt URLs to get final destinations and social media data
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
          // Product Hunt data
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
          // Product Hunt data
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
          // Product Hunt data
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
          // Product Hunt data
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

    // Scrape the Product Hunt URL
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
  if (request.action === 'start_url_analysis' && collectedProducts.length > 0) {
    analyzeProductUrls(collectedProducts);
  }
});

// Start the scraping process as soon as the script is injected
scrollToBottomAndScrape();
