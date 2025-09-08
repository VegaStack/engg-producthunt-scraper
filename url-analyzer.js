// URL Analysis and Social Media Extraction Module
// Converted from Python script functionality

class UrlAnalyzer {

  // Main method to analyze a URL and get final destination
  async analyzeUrl(url) {
    try {
      console.log(`Analyzing URL: ${url}`);
      
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
      const finalUrl = await this.followRedirects(cleanedUrl);
      
      return {
        originalUrl: url,
        finalUrl: finalUrl,
        redirectStatus: finalUrl !== cleanedUrl ? 'Redirected' : 'No redirect',
        extractionStatus: 'Success'
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

  // Follow redirects to get final URL
  async followRedirects(url) {
    try {
      console.log(`Following redirects for: ${url}`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const finalUrl = response.url;
      console.log(`Final URL after redirects: ${finalUrl}`);
      
      // If still a Product Hunt URL, try manual redirect
      if (finalUrl.includes('producthunt.com/r/')) {
        console.log(`Still Product Hunt URL, trying manual redirect...`);
        return await this.manualRedirectFollow(url);
      }
      
      return finalUrl;
      
    } catch (error) {
      console.log(`Redirect following failed: ${error.message}`);
      // Try manual redirect as fallback
      return await this.manualRedirectFollow(url);
    }
  }

  // Extract URL from Product Hunt page content
  async extractUrlFromProductHuntPage(originalUrl, productId) {
    try {
      console.log(`Extracting URL from Product Hunt page for ID: ${productId}`);
      
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
        
        // Look for website URL in the page content
        const websiteMatch = html.match(/"website_url":"([^"]+)"/);
        if (websiteMatch) {
          const websiteUrl = websiteMatch[1];
          console.log(`Found website URL in page content: ${websiteUrl}`);
          return websiteUrl;
        }
        
        // Look for external link patterns
        const linkMatch = html.match(/href="(https?:\/\/[^"]+)"[^>]*>Visit website/i);
        if (linkMatch) {
          const externalUrl = linkMatch[1];
          console.log(`Found external link: ${externalUrl}`);
          return externalUrl;
        }
      }
      
      return originalUrl;
      
    } catch (error) {
      console.log(`Page extraction failed: ${error.message}`);
      return originalUrl;
    }
  }

  // Clean URL by removing Product Hunt specific parameters
  cleanUrl(url) {
    if (!url) return 'N/A';
    return url.split('?ref=producthunt')[0];
  }

  // Manual redirect following for stubborn Product Hunt URLs
  async manualRedirectFollow(originalUrl) {
    try {
      console.log(`Manual redirect following for: ${originalUrl}`);
      
      // Extract Product Hunt ID from URL like /r/p/8666828
      const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
      if (phMatch) {
        const productId = phMatch[1];
        console.log(`Extracted Product Hunt ID: ${productId}`);
        
        // Try alternative redirect endpoint
        const alternativeUrl = `https://www.producthunt.com/posts/${productId}/redirect`;
        console.log(`Trying alternative redirect URL: ${alternativeUrl}`);
        
        const response = await fetch(alternativeUrl, {
          method: 'GET',
          redirect: 'follow',
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.producthunt.com/',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });
        
        // Wait 5 seconds for manual redirect to process
        console.log(`Manual redirect - waiting 5 seconds for server processing...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        if (response.url && !response.url.includes('producthunt.com/r/')) {
          console.log(`Manual redirect successful: ${response.url}`);
          return response.url;
        }
        
        // If we still have a Product Hunt URL, try to extract from page content
        console.log(`Manual redirect still returned Product Hunt URL, trying direct page scraping...`);
        const extractedUrl = await this.extractUrlFromProductHuntPage(originalUrl, productId);
        if (extractedUrl && extractedUrl !== originalUrl) {
          console.log(`Successfully extracted destination URL from page: ${extractedUrl}`);
          return extractedUrl;
        }
      }
      
      // If manual redirect fails, return original URL
      console.log(`Manual redirect failed, returning original URL`);
      return originalUrl;
      
    } catch (error) {
      console.log(`Manual redirect error: ${error.message}`);
      return originalUrl;
    }
  }
};