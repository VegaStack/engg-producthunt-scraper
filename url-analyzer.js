// URL Analysis and Social Media Extraction Module
// Converted from Python script functionality

class UrlAnalyzer {

  // Main method to analyze a URL and get final destination
  async analyzeUrl(url) {
    try {
      
      // Clean the URL first
      const cleanedUrl = this.cleanUrl(url);
      if (cleanedUrl === 'N/A') {
        return {
          originalUrl: url,
          finalUrl: 'N/A',
          redirectStatus: 'Invalid URL',
          extractionStatus: 'Failed'
        };
      }

      // Try to follow redirects
      let finalUrl = await this.followRedirects(cleanedUrl);
      
      // If we still got a ProductHunt URL, try background script method
      if (finalUrl.includes('producthunt.com')) {
        try {
          const backgroundResult = await this.analyzeWithBackgroundScript(cleanedUrl);
          if (backgroundResult && !backgroundResult.includes('producthunt.com')) {
            finalUrl = backgroundResult;
          }
        } catch (error) {
        }
      }
      
      // Always clean the final URL to remove any tracking parameters
      finalUrl = this.cleanUrl(finalUrl);
      
      return {
        originalUrl: url,
        finalUrl: finalUrl,
        redirectStatus: finalUrl !== cleanedUrl ? 'Redirected' : 'No redirect',
        extractionStatus: finalUrl.includes('producthunt.com') ? 'Partial' : 'Success'
      };
      
    } catch (error) {
      console.error(`Error analyzing URL ${url}:`, error);
      return {
        originalUrl: url,
        finalUrl: 'N/A',
        redirectStatus: `Error: ${error.message}`,
        extractionStatus: 'Failed'
      };
    }
  }

  // Use background script to handle CORS issues
  async analyzeWithBackgroundScript(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'analyze_url',
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.finalUrl);
        } else {
          reject(new Error(response?.error || 'Unknown error'));
        }
      });
    });
  }

  // Follow redirects to get final URL
  async followRedirects(url) {
    try {
      
      // First try with GET method to get the actual redirect
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const finalUrl = response.url;
      
      // Check if we got a valid external URL
      if (finalUrl && !finalUrl.includes('producthunt.com')) {
        const cleanedUrl = this.cleanUrl(finalUrl);
        return cleanedUrl;
      }
      
      // If still a ProductHunt URL, try manual redirect
      if (finalUrl.includes('producthunt.com')) {
        return await this.manualRedirectFollow(url);
      }
      
      return finalUrl;
      
    } catch (error) {
      // Try manual redirect as fallback
      return await this.manualRedirectFollow(url);
    }
  }

  // Extract URL from ProductHunt page content
  async extractUrlFromProductHuntPage(originalUrl, productId) {
    try {
      
      // Try to get the product page
      const productPageUrl = `https://www.producthunt.com/posts/${productId}`;
      const response = await fetch(productPageUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Multiple patterns to find the website URL
        const patterns = [
          // Pattern 1: JSON data with website_url
          /"website_url":"([^"]+)"/,
          // Pattern 2: Visit website link
          /href="(https?:\/\/[^"]+)"[^>]*>Visit website/i,
          // Pattern 3: External link button
          /href="(https?:\/\/[^"]+)"[^>]*class="[^"]*external[^"]*"/i,
          // Pattern 4: Website link in product details
          /href="(https?:\/\/[^"]+)"[^>]*>Website/i,
          // Pattern 5: Direct external link
          /href="(https?:\/\/[^"]+)"[^>]*target="_blank"/i,
          // Pattern 6: Product website in meta
          /<meta[^>]*property="og:url"[^>]*content="([^"]+)"/i,
          // Pattern 7: Canonical URL
          /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i
        ];
        
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const match = html.match(pattern);
          if (match) {
            const extractedUrl = match[1];
            
            // Validate that it's not a ProductHunt URL
            if (extractedUrl && !extractedUrl.includes('producthunt.com')) {
              const cleanedUrl = this.cleanUrl(extractedUrl);
              return cleanedUrl;
            }
          }
        }
        
        // If no patterns matched, try to find any external URL
        const allLinks = html.match(/href="(https?:\/\/[^"]+)"/g);
        if (allLinks) {
          for (const link of allLinks) {
            const urlMatch = link.match(/href="(https?:\/\/[^"]+)"/);
            if (urlMatch) {
              const url = urlMatch[1];
              if (!url.includes('producthunt.com') && !url.includes('twitter.com') && !url.includes('facebook.com')) {
                const cleanedUrl = this.cleanUrl(url);
                return cleanedUrl;
              }
            }
          }
        }
      }
      
      return originalUrl;
      
    } catch (error) {
      return originalUrl;
    }
  }

  // Clean URL by removing ProductHunt specific parameters
  cleanUrl(url) {
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

  // Manual redirect following for stubborn ProductHunt URLs
  async manualRedirectFollow(originalUrl) {
    try {
      
      // Extract ProductHunt ID from URL like /r/p/8666828
      const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
      if (phMatch) {
        const productId = phMatch[1];
        
        // Try multiple approaches to get the final URL
        const approaches = [
          // Approach 1: Direct redirect endpoint
          `https://www.producthunt.com/posts/${productId}/redirect`,
          // Approach 2: Alternative redirect format
          `https://www.producthunt.com/posts/${productId}`,
          // Approach 3: Original URL with different method
          originalUrl
        ];
        
        for (let i = 0; i < approaches.length; i++) {
          const testUrl = approaches[i];
          
          try {
            const response = await fetch(testUrl, {
          method: 'GET',
          redirect: 'follow',
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.producthunt.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
            const finalUrl = response.url;
            
            // Check if we got a valid external URL
            if (finalUrl && !finalUrl.includes('producthunt.com')) {
              const cleanedUrl = this.cleanUrl(finalUrl);
              return cleanedUrl;
            }
            
            // If this is the product page, try to extract from content
            if (testUrl.includes(`/posts/${productId}`) && !testUrl.includes('/redirect')) {
        const extractedUrl = await this.extractUrlFromProductHuntPage(originalUrl, productId);
              if (extractedUrl && !extractedUrl.includes('producthunt.com')) {
                const cleanedUrl = this.cleanUrl(extractedUrl);
                return cleanedUrl;
              }
            }
            
          } catch (error) {
            continue;
          }
        }
      }
      
      // If all approaches fail, return original URL
      return originalUrl;
      
    } catch (error) {
      return originalUrl;
    }
  }
};