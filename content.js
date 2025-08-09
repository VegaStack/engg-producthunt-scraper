async function scrollToBottomAndScrape() {
  try {
    let previousHeight = 0;
    let currentHeight = document.body.scrollHeight;
    
    while (previousHeight < currentHeight) {
      previousHeight = currentHeight;
      window.scrollTo(0, currentHeight);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for content to load
      currentHeight = document.body.scrollHeight;
    }

    const products = scrapeProducts();
    
    if (products.length > 0) {
      chrome.runtime.sendMessage({ 
        action: 'scraping_complete', 
        count: products.length, 
        data: products 
      });
    } else {
      chrome.runtime.sendMessage({ 
        action: 'scraping_error', 
        message: 'No products found after scrolling.' 
      });
    }
  } catch (error) {
    chrome.runtime.sendMessage({ 
      action: 'scraping_error', 
      message: `An error occurred: ${error.message}` 
    });
  }
}

function scrapeProducts() {
  const products = [];
  const productCards = document.querySelectorAll('section[data-test^="post-item-"]');

  productCards.forEach(card => {
    const nameElement = card.querySelector('a[data-test^="post-name-"]');
    const name = nameElement ? nameElement.innerText.trim() : 'N/A';

    const descriptionElement = card.querySelector('a.text-secondary');
    const description = descriptionElement ? descriptionElement.innerText.trim() : 'N/A';

    const categoryElements = card.querySelectorAll('a[href*="/topics/"]');
    const categories = Array.from(categoryElements).map(el => el.innerText.trim()).join(', ');

    const linkElement = card.querySelector('a[data-test^="post-name-"]');
    const productHuntUrl = linkElement ? `https://www.producthunt.com${linkElement.getAttribute('href')}` : 'N/A';

    const allButtons = Array.from(card.querySelectorAll('button'));
    const commentButton = allButtons.find(btn => btn.querySelector('p') && !btn.matches('[data-test="vote-button"]'));
    const comments = commentButton ? commentButton.querySelector('p').innerText.trim() : 'N/A';

    const podsElement = card.querySelector('button[data-test="vote-button"] p');
    const pods = podsElement ? podsElement.innerText.trim() : 'N/A';

    const productIdUrlElement = card.querySelector('a[data-test^="post-name-"]');
    const productId = productIdUrlElement ? productIdUrlElement.getAttribute('data-test').split('-').pop() : null;
    const productIdUrl = productId ? `https://www.producthunt.com/r/p/${productId}` : 'N/A';

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

scrollToBottomAndScrape();
