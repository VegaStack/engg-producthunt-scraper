// This function is the main entry point for the content script.
// It scrolls to the bottom of the page to load all products and then scrapes the data.
async function scrollToBottomAndScrape() {
  try {
    let previousHeight = 0;
    let currentHeight = document.body.scrollHeight;
    
    // Keep scrolling until the page height stops increasing
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      window.scrollTo(0, currentHeight);
      // Wait for a couple of seconds to allow new products to be loaded dynamically
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      currentHeight = document.body.scrollHeight;
    }

    // Once scrolling is complete, call the function to scrape the product data
    const products = scrapeProducts();
    
    // Send the scraped data back to the popup script
    if (products.length > 0) {
      chrome.runtime.sendMessage({ 
        action: 'scraping_complete', 
        count: products.length, 
        data: products 
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

// Start the scraping process as soon as the script is injected
scrollToBottomAndScrape();
