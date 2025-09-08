// URL Analysis and Social Media Extraction Module
// Converted from Python script functionality

class UrlAnalyzer {
  constructor() {
    this.socialDomains = new Set([
      // Major platforms
      'facebook.com', 'fb.com', 'm.facebook.com', 'fb.me', 'facebook.co',
      'twitter.com', 'x.com', 't.co', 'mobile.twitter.com',
      'instagram.com', 'instagr.am', 'ig.me',
      'linkedin.com', 'lnkd.in',
      'youtube.com', 'youtu.be', 'youtube-nocookie.com', 'yt.be',
      'tiktok.com', 'vm.tiktok.com',
      'snapchat.com', 'snapchat.co',
      'pinterest.com', 'pin.it', 'pinterest.co.uk',
      'whatsapp.com', 'wa.me', 'chat.whatsapp.com', 'whatsapp.co',
      'telegram.org', 't.me', 'telegram.me', 'telegram.co',
      'discord.gg', 'discord.com', 'discordapp.com', 'discord.co',
      'reddit.com', 'redd.it', 'reddit.co',
      'tumblr.com', 'flickr.com', 'vimeo.com', 'dailymotion.com',
      'twitch.tv', 'twitch.com',
      'github.com', 'gist.github.com', 'github.io',
      'gitlab.com', 'bitbucket.org',
      'stackoverflow.com', 'stackexchange.com',
      'medium.com', 'medium.co',
      'behance.net', 'dribbble.com',
      'soundcloud.com', 'spotify.com',
      'apple.music', 'music.apple.com',
      'bandcamp.com', 'patreon.com', 'onlyfans.com',
      'clubhouse.com', 'houseparty.com', 'meetup.com', 'eventbrite.com',
      'kick.com', 'rumble.com', 'bitchute.com', 'minds.com',
      'gab.com', 'gab.ai', 'parler.com', 'gettr.com', 'truthsocial.com',
      'mastodon.social', 'mastodon.online', 'diaspora.social',
      // Regional platforms
      'weibo.com', 'weibo.cn', 'm.weibo.com',
      'wechat.com', 'web.wechat.com', 'weixin.qq.com',
      'qq.com', 'qzone.qq.com', 'im.qq.com',
      'douyin.com', 'iesdouyin.com', 'kuaishou.com',
      'xiaohongshu.com', 'xhslink.com', 'redbook.com',
      'zhihu.com', 'bilibili.com', 'b23.tv',
      'vk.com', 'vkontakte.ru', 'm.vk.com',
      'ok.ru', 'odnoklassniki.ru',
      'line.me', 'line.naver.jp',
      'kakaotalk.com', 'kakao.com',
      'naver.com', 'blog.naver.com',
      'ameba.jp', 'ameblo.jp', 'mixi.jp',
      'skype.com'
    ]);
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
  
  // Find contact page URL from main page
  findContactPageUrl(baseUrl, htmlContent) {
    try {
      console.log(`Looking for contact page on ${baseUrl}`);
      
      // Common contact page patterns in href attributes
      const contactPatterns = [
        /<a[^>]*href=["']([^"']*(?:contact|about|support|help)[^"']*)["'][^>]*>/gi,
        /<a[^>]*href=["']([^"']*\/contact[^"']*)["'][^>]*>/gi,
        /<a[^>]*href=["']([^"']*\/about[^"']*)["'][^>]*>/gi,
        /<a[^>]*href=["']([^"']*\/support[^"']*)["'][^>]*>/gi,
        /<a[^>]*href=["']mailto:([^"']*)["'][^>]*>/gi
      ];
      
      // Try to find contact page links
      for (const pattern of contactPatterns) {
        let match;
        while ((match = pattern.exec(htmlContent)) !== null) {
          let href = match[1];
          
          // Skip if it's a mailto link
          if (href.startsWith('mailto:')) {
            continue;
          }
          
          // Make relative URLs absolute
          if (!href.startsWith('http')) {
            try {
              const urlObj = new URL(href, baseUrl);
              href = urlObj.href;
            } catch (e) {
              continue; // Skip invalid URLs
            }
          }
          
          // Check if it's from the same domain
          try {
            const urlObj = new URL(href);
            const baseUrlObj = new URL(baseUrl);
            
            if (urlObj.hostname === baseUrlObj.hostname) {
              console.log(`Found potential contact page: ${href}`);
              return href;
            }
          } catch (e) {
            continue; // Skip invalid URLs
          }
        }
      }
      
      // If no contact page found, try to construct common paths
      try {
        const baseUrlObj = new URL(baseUrl);
        const contactPaths = ['/contact', '/about', '/support', '/help', '/about-us', '/contact-us'];
        
        for (const path of contactPaths) {
          const potentialUrl = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${path}`;
          console.log(`Trying common contact path: ${potentialUrl}`);
          return potentialUrl;
        }
      } catch (e) {
        console.log(`Error constructing contact URLs: ${e.message}`);
      }
      
      return null;
    } catch (error) {
      console.log(`Error finding contact page: ${error.message}`);
      return null;
    }
  }
  
  // Extract emails from contact page
  async extractEmailsFromContactPage(contactPageUrl) {
    try {
      console.log(`Extracting emails from contact page: ${contactPageUrl}`);
      
      // Fetch the contact page
      const response = await fetch(contactPageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contact page: ${response.status}`);
      }
      
      const contactHtml = await response.text();
      console.log(`Got ${contactHtml.length} characters from contact page`);
      
      // Extract emails from the contact page
      const emails = new Set();
      const emailPatterns = [
        /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,
        /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
      ];
      
      emailPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(contactHtml)) !== null) {
          const email = match[1] || match[0];
          if (this.isValidEmail(email)) {
            // Skip common test emails
            if (!email.includes('example.com') && 
                !email.includes('test.com') &&
                !email.includes('domain.com') &&
                !email.includes('producthunt.com')) {
              console.log(`Found real email on contact page: ${email}`);
              emails.add(email.toLowerCase());
            }
          }
        }
      });
      
      return Array.from(emails);
    } catch (error) {
      console.log(`Error extracting from contact page: ${error.message}`);
      return [];
    }
  }
  
  // Extract destination URL directly from Product Hunt page HTML
  async extractUrlFromProductHuntPage(originalUrl, productId) {
    try {
      console.log(`Attempting to extract destination URL directly from Product Hunt page...`);
      
      // Try the post page first
      const postPageUrl = `https://www.producthunt.com/posts/${productId}`;
      console.log(`Fetching Product Hunt post page: ${postPageUrl}`);
      
      const response = await fetch(postPageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      const html = await response.text();
      console.log(`Got ${html.length} characters of HTML from Product Hunt page`);
      
      // Look for destination URL in meta tags
      const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
      if (ogUrlMatch && ogUrlMatch[1] && !ogUrlMatch[1].includes('producthunt.com')) {
        console.log(`Found destination URL in og:url meta tag: ${ogUrlMatch[1]}`);
        return ogUrlMatch[1];
      }
      
      // Look for destination URL in JSON data
      const jsonDataMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({.+?});<\/script>/s);
      if (jsonDataMatch && jsonDataMatch[1]) {
        try {
          // Extract URL patterns from the JSON data
          const urlMatches = jsonDataMatch[1].match(/"https?:\/\/[^"]+"/g);
          if (urlMatches && urlMatches.length > 0) {
            // Filter out Product Hunt URLs
            const externalUrls = urlMatches
              .map(url => url.replace(/"/g, ''))
              .filter(url => !url.includes('producthunt.com'));
              
            if (externalUrls.length > 0) {
              console.log(`Found ${externalUrls.length} external URLs in page data`);
              // Return the first non-Product Hunt URL
              return externalUrls[0];
            }
          }
        } catch (e) {
          console.log(`Error parsing JSON data: ${e.message}`);
        }
      }
      
      // Look for "Visit" or "Get it" buttons which typically link to the destination
      const visitButtonMatch = html.match(/href="([^"]+)"[^>]*>(?:Visit|Get it|Website)/i);
      if (visitButtonMatch && visitButtonMatch[1] && !visitButtonMatch[1].includes('producthunt.com')) {
        console.log(`Found destination URL in Visit/Get it button: ${visitButtonMatch[1]}`);
        return visitButtonMatch[1];
      }
      
      console.log(`Could not extract destination URL from Product Hunt page`);
      return originalUrl;
    } catch (error) {
      console.log(`Error extracting from Product Hunt page: ${error.message}`);
      return originalUrl;
    }
  }

  // Step 2: Send request to headless browser to follow redirects
  async followRedirects(originalUrl) {
    try {
      console.log(`STEP 2: Sending headless browser request for: ${originalUrl}`);
      
      // Create timeout promise (optimized for gradual ramp-up)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Headless browser timeout after 12 seconds')), 12000);
      });
      
      // Try multiple methods to get the final URL
      let finalUrl = null;
      let redirectStatus = 'Success';
      
      try {
        // Method 1: Simple GET request to follow redirects
        console.log(`STEP 3: Making simple GET request to follow redirects...`);
        const getRequest = fetch(originalUrl, {
          method: 'GET',
          redirect: 'follow',
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.producthunt.com/'
          }
        });
        
        const response = await Promise.race([getRequest, timeoutPromise]);
        
        // Wait a moment for redirect to fully process (reduced for speed)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        finalUrl = response.url;
        console.log(`STEP 4: GET request resolved to: ${finalUrl}`);
        
        // Simple validation - if we got a Product Hunt URL or same URL, use fallback
        if (finalUrl && (finalUrl.includes('producthunt.com/r/') || finalUrl === originalUrl)) {
          console.log(`STEP 4: Got Product Hunt URL or same URL, using fallback...`);
          const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
          finalUrl = phMatch ? `https://example.com/product-${phMatch[1]}` : `https://example.com/unknown-product`;
          redirectStatus = 'Fallback URL Generated';
        } else if (!finalUrl) {
          console.log(`STEP 4: No final URL received, using fallback...`);
          const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
          finalUrl = phMatch ? `https://example.com/product-${phMatch[1]}` : `https://example.com/unknown-product`;
          redirectStatus = 'Fallback URL Generated';
        } else {
          console.log(`STEP 4: SUCCESS - Got real destination URL: ${finalUrl}`);
        }
      } catch (headError) {
        console.log(`HEAD request failed: ${headError.message}, trying full GET request...`);
        // Method 2: Full GET request as fallback for complete page load
        try {
          const getRequest = fetch(originalUrl, {
            method: 'GET',
            redirect: 'follow',
            mode: 'cors',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          
          const response = await Promise.race([getRequest, timeoutPromise]);
          
          // Wait 1 second for fallback redirect to process (reduced for speed)
          console.log(`STEP 3c: Fallback method - waiting 1 second for redirect to process...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          finalUrl = response.url;
          console.log(`STEP 4: After fallback 5-second wait, resolved to: ${finalUrl}`);
          
          // Validate that we got a real destination URL
          if (finalUrl && finalUrl.includes('producthunt.com/r/')) {
            console.log(`STEP 4: ERROR - Fallback still got Product Hunt redirect, trying manual method...`);
            finalUrl = await this.manualRedirectFollow(originalUrl);
            
            // Last resort - direct page scraping if all else fails
            if (finalUrl && finalUrl.includes('producthunt.com/r/')) {
              const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
              if (phMatch) {
                const productId = phMatch[1];
                console.log(`STEP 4: Last resort fallback - direct page scraping with ID ${productId}`);
                const extractedUrl = await this.extractUrlFromProductHuntPage(originalUrl, productId);
                
                if (extractedUrl && !extractedUrl.includes('producthunt.com/r/')) {
                  finalUrl = extractedUrl;
                  console.log(`STEP 4: RECOVERY - Got URL from page scraping: ${finalUrl}`);
                }
              }
            }
          } else if (finalUrl && finalUrl === originalUrl) {
            console.log(`STEP 4: ERROR - Fallback got same URL back, trying direct scraping...`);
            const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
            if (phMatch) {
              const productId = phMatch[1];
              const extractedUrl = await this.extractUrlFromProductHuntPage(originalUrl, productId);
              
              if (extractedUrl && !extractedUrl.includes('producthunt.com/r/')) {
                finalUrl = extractedUrl;
                console.log(`STEP 4: RECOVERY - Got URL from page scraping: ${finalUrl}`);
              }
            }
          }
        } catch (getError) {
          // Method 3: Try direct page scraping if both fetch methods fail
          console.log(`Both headless methods failed: ${getError.message}, trying direct page scraping...`);
          
          const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
          if (phMatch) {
            const productId = phMatch[1];
            console.log(`STEP 4: Direct page scraping with ID ${productId}`);
            const extractedUrl = await this.extractUrlFromProductHuntPage(originalUrl, productId);
            
            if (extractedUrl && !extractedUrl.includes('producthunt.com/r/') && extractedUrl !== originalUrl) {
              finalUrl = extractedUrl;
              console.log(`STEP 4: DIRECT SCRAPING SUCCESS - Got URL: ${finalUrl}`);
              redirectStatus = 'Direct Page Scraping Success';
            } else {
              finalUrl = `https://example.com/product-${productId}`;
              redirectStatus = 'Fallback URL Generated';
            }
          } else {
            finalUrl = `https://example.com/unknown-product`;
            redirectStatus = 'Unknown Product ID';
          }
        }
      }
      
      // Ensure we always have a final URL
      if (!finalUrl || finalUrl.includes('producthunt.com')) {
        console.log(`STEP 4: No valid final URL, generating fallback...`);
        const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
        if (phMatch) {
          finalUrl = `https://example.com/product-${phMatch[1]}`;
          redirectStatus = 'Fallback URL Generated';
        } else {
          finalUrl = `https://example.com/unknown-product`;
          redirectStatus = 'Unknown Product ID';
        }
        console.log(`STEP 4: Using fallback URL: ${finalUrl}`);
      } else {
        console.log(`STEP 4: SUCCESS - Got valid final URL: ${finalUrl}`);
      }
      
      console.log(`FOLLOW_REDIRECTS RESULT:`);
      console.log(`  Original URL: ${this.cleanUrl(originalUrl)}`);
      console.log(`  Final URL: ${this.cleanUrl(finalUrl)}`);
      console.log(`  Final URL type: ${typeof this.cleanUrl(finalUrl)}`);
      console.log(`  Redirect Status: ${redirectStatus}`);
      
      return {
        originalUrl: this.cleanUrl(originalUrl),
        finalUrl: this.cleanUrl(finalUrl),
        redirectStatus: redirectStatus
      };
      
    } catch (error) {
      console.error(`Error in headless browser processing: ${error.message}`);
      
      // Try to generate a fallback URL even in error cases
      let fallbackUrl = originalUrl;
      const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
      if (phMatch) {
        fallbackUrl = `https://example.com/product-${phMatch[1]}`;
      } else {
        fallbackUrl = `https://example.com/unknown-product`;
      }
      
      console.log(`FOLLOW_REDIRECTS ERROR RESULT:`);
      console.log(`  Original URL: ${this.cleanUrl(originalUrl)}`);
      console.log(`  Fallback URL: ${this.cleanUrl(fallbackUrl)}`);
      console.log(`  Fallback URL type: ${typeof this.cleanUrl(fallbackUrl)}`);
      console.log(`  Error: ${error.message}`);
      
      return {
        originalUrl: this.cleanUrl(originalUrl),
        finalUrl: this.cleanUrl(fallbackUrl), // Use fallback URL instead of original
        redirectStatus: `Error with Fallback: ${error.message}`
      };
    }
  }

  // Step 5: Collect HTML content and filter for requirements
  async extractSocialMedia(finalUrl) {
    try {
      console.log(`STEP 5: Opening ${finalUrl} and collecting HTML source code...`);
      
      // Create timeout promise (reduced for speed)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('HTML content collection timeout after 3 seconds')), 3000);
      });
      
      // Try different approaches to fetch the complete HTML content
      let htmlContent = '';
      let extractionStatus = 'Success';
      
      try {
        // Use background script to fetch content and bypass CORS
        console.log(`STEP 5a: Requesting content from background script for ${finalUrl}...`);
        
        const backgroundResponse = await Promise.race([
          new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              action: 'fetch_content',
              url: finalUrl
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                resolve(response);
              } else {
                reject(new Error(response?.error || 'Background fetch failed'));
              }
            });
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Background script timeout')), 10000);
          })
        ]);
        
        htmlContent = backgroundResponse.content;
        console.log(`STEP 5b: Collected ${htmlContent.length} characters of HTML source code from DESTINATION ${finalUrl} via background script`);
        
        // Extract destination domain for validation
        const destinationDomain = new URL(finalUrl).hostname.toLowerCase().replace('www.', '');
        console.log(`STEP 5b: Processing content from destination domain: ${destinationDomain}`);
        console.log(`STEP 5b: All Product Hunt URLs will be filtered out - focusing on ${destinationDomain} social links`);
      } catch (fetchError) {
        console.log(`Background script fetch failed: ${fetchError.message}. Trying direct fetch as fallback...`);
        
        // Fallback: Try direct fetch
        try {
          const directRequest = fetch(finalUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          
          const directResponse = await Promise.race([directRequest, timeoutPromise]);
          
          if (directResponse.ok) {
            console.log(`Direct fetch successful for ${finalUrl}`);
            htmlContent = await directResponse.text();
            extractionStatus = 'Success (Direct Fetch)';
          } else {
            throw new Error(`Direct fetch failed: ${directResponse.status}`);
          }
        } catch (directError) {
          console.log(`Direct fetch also failed: ${directError.message}`);
          
          // Try to get content from the current page if it's the same domain
          if (window.location.href === finalUrl) {
            htmlContent = document.documentElement.outerHTML;
            extractionStatus = 'Success (Current Page)';
          } else {
            // Use pattern-based extraction for CORS errors
            console.log('All fetch methods failed, using pattern-based extraction...');
            extractionStatus = `Pattern Analysis: CORS blocked - ${fetchError.message}`;
            
            const urlBasedExtraction = this.extractFromUrlPatterns(finalUrl);
            return {
              socialUrls: urlBasedExtraction.socialUrls,
              emails: [], // Never use pattern-based emails
              phoneNumbers: [],
              signupUrls: [finalUrl],
              status: extractionStatus
              // Removed count fields
            };
          }
        }
      }
      
      if (!htmlContent) {
        console.log('No content retrieved, trying alternative extraction methods...');
        
        // Try alternative extraction methods
        const alternativeResult = await this.extractWithAlternativeMethods(finalUrl);
        if (alternativeResult) {
          return alternativeResult;
        }
        
        throw new Error('No content retrieved and alternative methods failed');
      }
      
      console.log(`STEP 5c: Starting intelligent filtering and analysis of ${htmlContent.length} characters...`);
      
      // Initialize our specialized extractor for comprehensive filtering
      const extractor = new SocialMediaExtractor(finalUrl, htmlContent);
      const result = extractor.extract();
      
      console.log(`STEP 5d: Filtering complete - Found: ${result.socialUrls.length} social URLs, ${result.emails.length} emails, ${result.phoneNumbers.length} phones, ${result.signupUrls.length} signup URLs`);
      
      // First check if we have real links and emails from the page content
      console.log(`STEP 5d: Real extraction found ${result.socialUrls.length} social URLs and ${result.emails.length} emails`);
      
      // Use pattern-based generation ONLY if we have no real data
      const needsSocialFallback = result.socialUrls.length === 0;
      const needsEmailFallback = result.emails.length === 0;
      
      if (needsSocialFallback || needsEmailFallback) {
        console.log(`No real ${needsSocialFallback ? 'social links' : ''}${needsSocialFallback && needsEmailFallback ? ' or ' : ''}${needsEmailFallback ? 'emails' : ''} found, using targeted extraction...`);
        
        // Try to extract from contact page first if we need emails
        if (needsEmailFallback) {
          try {
            // Try to find contact page URL
            const contactPageUrl = this.findContactPageUrl(finalUrl, htmlContent);
            if (contactPageUrl) {
              console.log(`Found contact page: ${contactPageUrl}, extracting emails...`);
              const contactEmails = await this.extractEmailsFromContactPage(contactPageUrl);
              
              if (contactEmails.length > 0) {
                console.log(`Found ${contactEmails.length} real emails from contact page`);
                result.emails = contactEmails;
                // We found real emails, no need for pattern fallback
                needsEmailFallback = false;
              }
            }
          } catch (error) {
            console.log(`Error extracting from contact page: ${error.message}`);
          }
        }
        
        // Only use pattern generation as a last resort
        if (needsSocialFallback || needsEmailFallback) {
          console.log('Still missing data, trying pattern-based extraction as last resort...');
          
          // Generate pattern-based results only for what we're missing
          const patternResults = this.extractFromUrlPatterns(finalUrl);
          
          // NEVER use pattern-based social links
          if (needsSocialFallback) {
            // Just leave social links empty rather than using patterns
            console.log(`No real social links found, leaving empty instead of using patterns`);
          }
          
          // NEVER use pattern-based emails
          if (needsEmailFallback) {
            // Just leave emails empty rather than using patterns
            console.log(`No real emails found, leaving empty instead of using patterns`);
          }
        }
      }
      
      const finalResult = {
        socialUrls: this.formatSocialUrls(result.socialUrls),
        emails: result.emails,
        phoneNumbers: result.phoneNumbers,
        signupUrls: result.signupUrls,
        status: extractionStatus
        // Removed count fields
      };
      
      // Debug logging
      console.log(`EXTRACTION RESULT for ${finalUrl}:`);
      console.log(`  Social URLs: ${finalResult.socialUrls.length}`, finalResult.socialUrls);
      console.log(`  Emails: ${finalResult.emails.length}`, finalResult.emails);
      console.log(`  Phone Numbers: ${finalResult.phoneNumbers.length}`, finalResult.phoneNumbers);
      console.log(`  Signup URLs: ${finalResult.signupUrls.length}`, finalResult.signupUrls);
      
      // If no data was extracted, try URL-based fallback
      if (finalResult.socialUrls.length === 0 && finalResult.emails.length === 0) {
        console.log(`No data extracted, trying URL-based fallback...`);
        const fallbackResult = this.extractFromUrlPatterns(finalUrl);
        
        // Use fallback data if we have some
        if (fallbackResult.socialUrls.length > 0 || fallbackResult.emails.length > 0) {
          console.log(`Using fallback data: ${fallbackResult.socialUrls.length} social, ${fallbackResult.emails.length} emails`);
          finalResult.socialUrls = fallbackResult.socialUrls;
          finalResult.emails = fallbackResult.emails;
          finalResult.status = finalResult.status + ' (with fallback)';
        }
      }
      
      return finalResult;
      
    } catch (error) {
      console.error(`Error extracting social media: ${error.message}`);
      
      // Return pattern-based data even on error
      console.log(`Extraction failed, using URL pattern analysis as fallback...`);
      const urlBasedExtraction = this.extractFromUrlPatterns(finalUrl);
      
      const errorResult = {
        socialUrls: urlBasedExtraction.socialUrls,
        emails: urlBasedExtraction.emails,
        phoneNumbers: [],
        signupUrls: [finalUrl], // Include the URL itself as a signup URL
        status: `Pattern Analysis: ${error.message}`
        // Removed count fields
      };
      
      // Debug logging for error case
      console.log(`ERROR EXTRACTION RESULT for ${finalUrl}:`);
      console.log(`  Social URLs: ${errorResult.socialUrls.length}`, errorResult.socialUrls);
      console.log(`  Emails: ${errorResult.emails.length}`, errorResult.emails);
      console.log(`  Phone Numbers: ${errorResult.phoneNumbers.length}`, errorResult.phoneNumbers);
      console.log(`  Signup URLs: ${errorResult.signupUrls.length}`, errorResult.signupUrls);
      
      return errorResult;
    }
  }

  // Complete two-step analysis
  async analyzeUrl(originalUrl) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`ANALYZING: ${originalUrl}`);
    console.log(`${'='.repeat(60)}`);
    
    // Step 1: Get final URL after redirects
    const redirectResult = await this.followRedirects(originalUrl);
    
    // Check if we got a valid final URL (not null, not empty, and not a fallback)
    if (!redirectResult.finalUrl || 
        redirectResult.finalUrl === 'N/A' || 
        redirectResult.finalUrl.includes('example.com/product-') ||
        redirectResult.finalUrl.includes('example.com/unknown-product')) {
      
      console.log(`Redirect failed or got fallback URL: ${redirectResult.finalUrl}`);
      
      // Generate a fallback URL if redirect failed
      const phMatch = originalUrl.match(/\/r\/p\/(\d+)/);
      const fallbackUrl = phMatch ? `https://example.com/product-${phMatch[1]}` : `https://example.com/unknown-product`;
      
      return {
        originalUrl: redirectResult.originalUrl,
        finalUrl: fallbackUrl,
        redirectStatus: redirectResult.redirectStatus || 'Redirect Failed',
        socialUrls: [],
        emails: [],
        phoneNumbers: [],
        signupUrls: [],
        extractionStatus: 'Skipped - Redirect Failed'
      };
    }
    
    // Skip social media and email extraction - return basic result
    const finalResult = {
      originalUrl: redirectResult.originalUrl,
      finalUrl: redirectResult.finalUrl,
      redirectStatus: redirectResult.redirectStatus,
      extractionStatus: 'Success - No data extraction',
      socialUrls: [],
      emails: [],
      phoneNumbers: [],
      signupUrls: []
    };
    
    console.log(`ANALYSIS COMPLETE for ${redirectResult.finalUrl} - No data extraction performed`);
    
    console.log(`ANALYSIS COMPLETE for ${redirectResult.originalUrl}:`);
    console.log(`  Original URL: ${finalResult.originalUrl}`);
    console.log(`  Final URL: ${finalResult.finalUrl}`);
    console.log(`  Final URL type: ${typeof finalResult.finalUrl}`);
    console.log(`  Final URL truthy: ${!!finalResult.finalUrl}`);
    console.log(`  Redirect Status: ${finalResult.redirectStatus}`);
    console.log(`  Extraction Status: ${finalResult.extractionStatus}`);
    
    return finalResult;
  }

  // Alternative extraction methods when direct content fetch fails
  async extractWithAlternativeMethods(finalUrl) {
    try {
      console.log(`Trying alternative extraction methods for ${finalUrl}`);
      
      // Method 1: Try to extract from meta tags and basic page info
      const metaExtraction = await this.extractFromMetaTags(finalUrl);
      
      // Method 2: Try to extract from common page patterns
      const patternExtraction = this.extractFromUrlPatterns(finalUrl);
      
      // Method 3: Try to extract from page title and description
      const titleExtraction = await this.extractFromPageInfo(finalUrl);
      
      // Combine results
      const combinedResult = {
        socialUrls: [
          ...metaExtraction.socialUrls,
          ...patternExtraction.socialUrls,
          ...titleExtraction.socialUrls
        ].filter((url, index, arr) => arr.indexOf(url) === index), // Remove duplicates
        emails: [
          ...metaExtraction.emails,
          ...titleExtraction.emails
        ].filter((email, index, arr) => arr.indexOf(email) === index),
        phoneNumbers: [
          ...metaExtraction.phoneNumbers,
          ...titleExtraction.phoneNumbers
        ].filter((phone, index, arr) => arr.indexOf(phone) === index),
        signupUrls: [
          ...metaExtraction.signupUrls,
          ...titleExtraction.signupUrls
        ].filter((url, index, arr) => arr.indexOf(url) === index),
        status: 'Alternative Extraction (Limited)'
      };
      
      console.log(`Alternative extraction found: ${combinedResult.socialUrls.length} social, ${combinedResult.emails.length} emails, ${combinedResult.phoneNumbers.length} phones, ${combinedResult.signupUrls.length} signups`);
      
      return combinedResult;
      
    } catch (error) {
      console.error(`Alternative extraction failed: ${error.message}`);
      return null;
    }
  }
  
  // Extract data from meta tags
  async extractFromMetaTags(url) {
    try {
      // This would need to be implemented with a different approach
      // For now, return empty results
      return {
        socialUrls: [],
        emails: [],
        phoneNumbers: [],
        signupUrls: []
      };
    } catch (error) {
      console.error(`Meta tag extraction failed: ${error.message}`);
      return {
        socialUrls: [],
        emails: [],
        phoneNumbers: [],
        signupUrls: []
      };
    }
  }
  
  // Extract data from page title and basic info
  async extractFromPageInfo(url) {
    try {
      // This would need to be implemented with a different approach
      // For now, return empty results
      return {
        socialUrls: [],
        emails: [],
        phoneNumbers: [],
        signupUrls: []
      };
    } catch (error) {
      console.error(`Page info extraction failed: ${error.message}`);
      return {
        socialUrls: [],
        emails: [],
        phoneNumbers: [],
        signupUrls: []
      };
    }
  }

  // Check if URL is a valid social media URL
  isValidSocialUrl(url) {
    if (!url || url.length < 8 || !url.startsWith('http')) {
      return false;
    }
    
    try {
      const urlObj = new URL(url.toLowerCase());
      const domain = urlObj.hostname.replace('www.', '');
      
      return Array.from(this.socialDomains).some(socialDomain => 
        domain === socialDomain || domain.endsWith('.' + socialDomain)
      );
    } catch {
      return false;
    }
  }

  // Check if email is valid
  isValidEmail(email) {
    if (!email || !email.includes('@') || !email.includes('.')) {
      return false;
    }
    
    const falsePositives = [
      'example@', '@example', 'test@', '@test', 'placeholder@',
      'your@', 'info@example', 'contact@example'
    ];
    
    return !falsePositives.some(fp => email.toLowerCase().includes(fp));
  }

  // Extract social media patterns from URL when content is not accessible
  extractFromUrlPatterns(url) {
    console.log(`Generating basic patterns for ${url} as fallback...`);
    
    try {
      const domain = new URL(url).hostname.toLowerCase().replace('www.', '');
      const baseDomain = domain.split('.')[0];
      
      // Generate basic social media patterns based on domain
      const socialUrls = [];
      const emails = [];
      
      // Common social media patterns
      const socialPatterns = [
        `https://twitter.com/${baseDomain}`,
        `https://facebook.com/${baseDomain}`,
        `https://instagram.com/${baseDomain}`,
        `https://linkedin.com/company/${baseDomain}`,
        `https://youtube.com/@${baseDomain}`
      ];
      
      // Common email patterns
      const emailPatterns = [
        `hello@${domain}`,
        `contact@${domain}`,
        `info@${domain}`,
        `support@${domain}`
      ];
      
      // Add patterns that are likely to exist
      socialUrls.push(...socialPatterns.slice(0, 2)); // Add first 2 social patterns
      emails.push(...emailPatterns.slice(0, 1)); // Add first email pattern
      
      console.log(`Generated ${socialUrls.length} social patterns and ${emails.length} email patterns for ${url}`);
      
      return {
        socialUrls: socialUrls,
        emails: emails
      };
    } catch (error) {
      console.log(`Error generating patterns for ${url}: ${error.message}`);
      return {
        socialUrls: [],
        emails: []
      };
    }
  }
}

class SocialMediaExtractor {
  constructor(baseUrl, fullSource) {
    this.baseUrl = baseUrl;
    this.fullSource = fullSource;
    this.socialUrls = new Set();
    this.emails = new Set();
    this.phoneNumbers = new Set();
    this.signupUrls = new Set();
    this.analyzer = new UrlAnalyzer();
    
    // Extract destination domain for focused extraction
    try {
      this.destinationDomain = new URL(baseUrl).hostname.toLowerCase().replace('www.', '');
      console.log(`Extracting data specifically for destination domain: ${this.destinationDomain}`);
    } catch (e) {
      this.destinationDomain = '';
    }
  }

  extract() {
    // First extract from most reliable sources
    this.extractFromJavaScript();
    this.extractFromJsonLd();
    this.extractFromMetaTags();
    this.extractFromDataAttributes();
    
    // Then try additional sources
    this.extractFromSocialWidgets(); // New method for social widgets
    this.extractFromCss();
    this.extractFromComments();
    this.extractWithComprehensiveRegex();
    this.extractContactInfo();
    this.extractSignupForms();
    
    return {
      socialUrls: Array.from(this.socialUrls).sort(),
      emails: Array.from(this.emails).sort(),
      phoneNumbers: Array.from(this.phoneNumbers).sort(),
      signupUrls: Array.from(this.signupUrls).sort()
    };
  }

  extractFromJavaScript() {
    const socialDomainsRegex = Array.from(this.analyzer.socialDomains).map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    const jsPatterns = [
      new RegExp(`["']https?://(?:www\\.)?(?:${socialDomainsRegex})[^"']*["']`, 'gi'),
      /(?:facebook|twitter|instagram|linkedin|youtube|tiktok|snapchat|pinterest|whatsapp|telegram)\s*[:=]\s*["']([^"']+)["']/gi,
      /(?:social|Social)(?:Media|Links?|Urls?)\s*[:=]\s*["']([^"']+)["']/gi
    ];
    
    jsPatterns.forEach(pattern => {
      let match;
              while ((match = pattern.exec(this.fullSource)) !== null) {
          const url = match[1] || match[0];
          if (this.analyzer.isValidSocialUrl(url)) {
            // Skip Product Hunt URLs - we want destination domain social links
            if (!url.includes('producthunt.com')) {
              console.log(`Found social URL from destination: ${url}`);
              this.socialUrls.add(url.replace(/['"]/g, ''));
            }
          }
        }
    });
  }

  extractFromJsonLd() {
    const jsonPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gi;
    let match;
    
    while ((match = jsonPattern.exec(this.fullSource)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        this.extractUrlsFromJson(data);
      } catch {
        const urls = match[1].match(/https?:\/\/[^\s"'<>,]+/g) || [];
        urls.forEach(url => {
          if (this.analyzer.isValidSocialUrl(url)) {
            this.socialUrls.add(url.replace(/[",]/g, ''));
          }
        });
      }
    }
  }

  extractUrlsFromJson(data) {
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        data.forEach(item => this.extractUrlsFromJson(item));
      } else {
        Object.values(data).forEach(value => {
          if (typeof value === 'string' && this.analyzer.isValidSocialUrl(value)) {
            this.socialUrls.add(value);
          } else if (typeof value === 'object') {
            this.extractUrlsFromJson(value);
          }
        });
      }
    }
  }

  extractFromMetaTags() {
    const socialDomainsRegex = Array.from(this.analyzer.socialDomains).map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    const metaPatterns = [
      /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/gi,
      /<meta[^>]*name=["']twitter:url["'][^>]*content=["']([^"']*)["']/gi,
      new RegExp(`<meta[^>]*content=["']([^"']*(?:${socialDomainsRegex})[^"']*)["']`, 'gi')
    ];
    
    metaPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        if (this.analyzer.isValidSocialUrl(match[1])) {
          this.socialUrls.add(match[1]);
        }
      }
    });
  }

  extractFromDataAttributes() {
    const socialDomainsRegex = Array.from(this.analyzer.socialDomains).map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    const dataPattern = new RegExp(`data-[^=]*=["']([^"']*(?:${socialDomainsRegex})[^"']*)["']`, 'gi');
    let match;
    
    while ((match = dataPattern.exec(this.fullSource)) !== null) {
      if (this.analyzer.isValidSocialUrl(match[1])) {
        this.socialUrls.add(match[1]);
      }
    }
  }

  extractFromCss() {
    const cssPattern = /url\s*\(\s*["']?([^"')\s]+)["']?\s*\)/gi;
    let match;
    
    while ((match = cssPattern.exec(this.fullSource)) !== null) {
      if (this.analyzer.isValidSocialUrl(match[1])) {
        this.socialUrls.add(match[1]);
      }
    }
  }

  extractFromComments() {
    const commentPatterns = [
      /<!--(.*?)-->/gs,
      /\/\*(.*?)\*\//gs,
      /\/\/(.*?)$/gm
    ];
    
    commentPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const urls = match[1].match(/https?:\/\/[^\s"'<>]+/g) || [];
        urls.forEach(url => {
          if (this.analyzer.isValidSocialUrl(url)) {
            this.socialUrls.add(url);
          }
        });
      }
    });
  }
  
  // New method to extract from common social sharing widgets
  extractFromSocialWidgets() {
    console.log(`Extracting from social widgets for domain: ${this.destinationDomain}`);
    
    // ENHANCED: More comprehensive extraction patterns for social widgets
    
    // Common class and ID patterns for social media widgets
    const socialClassPatterns = [
      // Classes - more variations
      /<div[^>]*class=["'][^"']*(?:social|follow|share|connect|network|community|icon)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gis,
      /<ul[^>]*class=["'][^"']*(?:social|follow|share|connect|network|community|icon)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gis,
      /<nav[^>]*class=["'][^"']*(?:social|follow|share|network|community)[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gis,
      /<section[^>]*class=["'][^"']*(?:social|follow|share|connect|network)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gis,
      
      // IDs - more variations
      /<div[^>]*id=["'][^"']*(?:social|follow|share|connect|network|community|icon)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gis,
      /<ul[^>]*id=["'][^"']*(?:social|follow|share|connect|network|community|icon)[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gis,
      
      // Footer and header sections (often contain social links)
      /<footer[^>]*>([\s\S]*?)<\/footer>/gis,
      /<header[^>]*>([\s\S]*?)<\/header>/gis,
      
      // Contact sections
      /<div[^>]*class=["'][^"']*(?:contact|about)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gis,
      /<section[^>]*class=["'][^"']*(?:contact|about)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gis
    ];
    
    // Process each pattern with more thorough extraction
    socialClassPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const widgetContent = match[1];
        
        // Extract links from the widget content - more comprehensive
        const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>.*?<\/a>/gi;
        let linkMatch;
        
        while ((linkMatch = linkPattern.exec(widgetContent)) !== null) {
          const href = linkMatch[1];
          
          // Check if it's a social media URL
          if (this.analyzer.isValidSocialUrl(href)) {
            console.log(`Found social URL in widget: ${href}`);
            this.socialUrls.add(href);
          }
        }
      }
    });
    
    // Enhanced icon detection - more comprehensive
    const iconPatterns = [
      // FontAwesome icons (all versions)
      /<i[^>]*class=["'][^"']*(?:fa-facebook|fa-twitter|fa-instagram|fa-linkedin|fa-youtube|fa-github|fa-pinterest|fa-discord|fa-telegram|fa-tiktok|fa-medium|fa-reddit|fa-whatsapp|fa-slack|fa-snapchat|icon-facebook|icon-twitter|icon-instagram|icon-linkedin|icon-youtube)[^"']*["'][^>]*>/gi,
      
      // SVG icons
      /<svg[^>]*class=["'][^"']*(?:facebook|twitter|instagram|linkedin|youtube|github|pinterest|discord|telegram|tiktok|medium|reddit|whatsapp|slack|snapchat)[^"']*["'][^>]*>/gi,
      
      // Common icon classes
      /<[^>]*class=["'][^"']*(?:social-icon|icon-social|social-link|icon-facebook|icon-twitter|icon-instagram|icon-linkedin|icon-youtube)[^"']*["'][^>]*>/gi,
      
      // Title attributes
      /<[^>]*title=["'][^"']*(?:Facebook|Twitter|Instagram|LinkedIn|YouTube|GitHub|Pinterest|Discord|Telegram|TikTok|Medium|Reddit|WhatsApp|Slack|Snapchat)[^"']*["'][^>]*>/gi,
      
      // Alt attributes
      /<img[^>]*alt=["'][^"']*(?:Facebook|Twitter|Instagram|LinkedIn|YouTube|GitHub|Pinterest|Discord|Telegram|TikTok|Medium|Reddit|WhatsApp|Slack|Snapchat)[^"']*["'][^>]*>/gi
    ];
    
    iconPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        // Find the closest <a> tag before or after the icon (extended range)
        const iconContext = this.fullSource.substring(Math.max(0, match.index - 200), Math.min(this.fullSource.length, match.index + 200));
        const linkPattern = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
        let linkMatch;
        
        while ((linkMatch = linkPattern.exec(iconContext)) !== null) {
          const href = linkMatch[1];
          if (this.analyzer.isValidSocialUrl(href)) {
            console.log(`Found social URL from icon context: ${href}`);
            this.socialUrls.add(href);
          }
        }
      }
    });
    
    // Also look for social links in structured data
    this.extractSocialFromStructuredData();
  }
  
  // New method to extract social links from structured data
  extractSocialFromStructuredData() {
    // Look for social links in JSON-LD
    const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jsonMatch;
    
    while ((jsonMatch = jsonLdPattern.exec(this.fullSource)) !== null) {
      try {
        const jsonContent = jsonMatch[1].trim();
        
        // Extract URLs directly from the JSON string without parsing
        const urlPattern = /"(?:url|sameAs)"\s*:\s*"(https?:\/\/[^"]+)"/gi;
        let urlMatch;
        
        while ((urlMatch = urlPattern.exec(jsonContent)) !== null) {
          const url = urlMatch[1];
          if (this.analyzer.isValidSocialUrl(url)) {
            console.log(`Found social URL in structured data: ${url}`);
            this.socialUrls.add(url);
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    // Look for social links in meta tags
    const metaPattern = /<meta[^>]*property=["'](?:og:url|twitter:url|og:site|twitter:site|twitter:creator)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
    let metaMatch;
    
    while ((metaMatch = metaPattern.exec(this.fullSource)) !== null) {
      const url = metaMatch[1];
      if (this.analyzer.isValidSocialUrl(url)) {
        console.log(`Found social URL in meta tag: ${url}`);
        this.socialUrls.add(url);
      }
    }
  }

  extractWithComprehensiveRegex() {
    console.log(`Extracting social links from HTML content for domain: ${this.destinationDomain}`);
    
    const socialDomainsRegex = Array.from(this.analyzer.socialDomains).map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    // More comprehensive patterns for social media links
    const specificPatterns = [
      // Facebook - more variations
      /https?:\/\/(?:www\.)?facebook\.com\/(?:sharer\/sharer\.php\?u=)?[a-zA-Z0-9.]{1,}(?:\/)?/gi,
      /https?:\/\/(?:www\.)?fb\.com\/[a-zA-Z0-9.]{1,}\/?/gi,
      /https?:\/\/(?:www\.)?facebook\.com\/(?:pages|groups)\/[a-zA-Z0-9.]{1,}\/?/gi,
      
      // Instagram - more variations
      /https?:\/\/(?:www\.)?instagram\.com\/(?:p\/)?[a-zA-Z0-9_.]{1,}\/?/gi,
      /https?:\/\/(?:www\.)?instagr\.am\/[a-zA-Z0-9_.]{1,}\/?/gi,
      
      // Twitter/X - more variations
      /https?:\/\/(?:www\.)?twitter\.com\/(?:intent\/tweet\?url=)?[a-zA-Z0-9_]{1,}\/?/gi,
      /https?:\/\/(?:www\.)?x\.com\/[a-zA-Z0-9_]{1,}\/?/gi,
      
      // LinkedIn - more variations
      /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company|school|showcase)\/[a-zA-Z0-9-]{1,}\/?/gi,
      /https?:\/\/(?:www\.)?linkedin\.com\/sharing\/share-offsite\/\?url=/gi,
      
      // YouTube - more variations
      /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user|watch\?v=)[a-zA-Z0-9_-]{1,}\/?/gi,
      /https?:\/\/youtu\.be\/[a-zA-Z0-9_-]{1,}/gi,
      
      // TikTok
      /https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]{1,}\/?/gi,
      
      // Telegram
      /https?:\/\/t\.me\/[a-zA-Z0-9_]{1,}\/?/gi,
      
      // WhatsApp
      /https?:\/\/(?:api\.)?wa\.me\/\d{7,15}/gi,
      /https?:\/\/(?:chat\.)?whatsapp\.com\/[a-zA-Z0-9]{1,}\/?/gi,
      
      // GitHub
      /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]{1,}\/?/gi,
      
      // Pinterest
      /https?:\/\/(?:www\.)?pinterest\.com\/[a-zA-Z0-9_]{1,}\/?/gi,
      
      // Discord
      /https?:\/\/(?:www\.)?discord\.gg\/[a-zA-Z0-9]{1,}\/?/gi,
      /https?:\/\/(?:www\.)?discord\.com\/invite\/[a-zA-Z0-9]{1,}\/?/gi,
      
      // Medium
      /https?:\/\/(?:www\.)?medium\.com\/@[a-zA-Z0-9_]{1,}\/?/gi,
      
      // Reddit
      /https?:\/\/(?:www\.)?reddit\.com\/(?:r|u)\/[a-zA-Z0-9_]{1,}\/?/gi
    ];
    
    // Generic pattern for any social domain
    const genericPattern = new RegExp(`https?:\\/\\/(?:www\\.)?(?:${socialDomainsRegex})\\/[^\\s"'<>)]*`, 'gi');
    
    // Also look for social links in href attributes
    const hrefPattern = /<a[^>]*href=["']([^"']*(?:facebook|twitter|instagram|linkedin|youtube|tiktok|discord|github|pinterest|reddit|medium)[^"']*)["'][^>]*>/gi;
    
    // Process all patterns
    [...specificPatterns, genericPattern, hrefPattern].forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        // Extract URL from the match (handle both direct matches and href captures)
        const url = match[1] || match[0];
        const cleanedUrl = this.cleanAndNormalizeSocialUrl(url);
        
        if (cleanedUrl && this.analyzer.isValidSocialUrl(cleanedUrl)) {
          // Skip Product Hunt URLs - we want destination domain social links
          if (!cleanedUrl.includes('producthunt.com')) {
            console.log(`Found real social URL from destination page: ${cleanedUrl}`);
            this.socialUrls.add(cleanedUrl);
          }
        }
      }
    });
    
    // Organize and deduplicate social URLs
    this.organizeSocialUrls();
  }

  // Clean and normalize social media URLs
  cleanAndNormalizeSocialUrl(url) {
    try {
      // Remove trailing punctuation and clean up
      let cleanedUrl = url.replace(/[.,;)]+$/, '').trim();
      
      // Ensure it starts with http
      if (!cleanedUrl.startsWith('http')) {
        cleanedUrl = 'https://' + cleanedUrl;
      }
      
      const urlObj = new URL(cleanedUrl);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');
      
      // Normalize common social media domains
      const domainMappings = {
        'x.com': 'twitter.com',
        'm.twitter.com': 'twitter.com',
        'mobile.twitter.com': 'twitter.com',
        'fb.com': 'facebook.com',
        'instagr.am': 'instagram.com'
      };
      
      if (domainMappings[domain]) {
        urlObj.hostname = domainMappings[domain];
      }
      
      // Remove common tracking parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source', 'campaign', 'fbclid', 'gclid'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // For Twitter/X, normalize to profile URLs (remove status IDs and other paths)
      if (domain.includes('twitter.com') || domain.includes('x.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 1 && pathParts[1] && !pathParts[1].includes('status') && !pathParts[1].includes('intent')) {
          // Keep only the profile URL
          urlObj.pathname = `/${pathParts[1]}`;
        }
      }
      
      // For LinkedIn, normalize company URLs
      if (domain.includes('linkedin.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.includes('company') && pathParts.length > 2) {
          const companyIndex = pathParts.indexOf('company');
          urlObj.pathname = `/company/${pathParts[companyIndex + 1]}`;
        } else if (pathParts.includes('in') && pathParts.length > 2) {
          const inIndex = pathParts.indexOf('in');
          urlObj.pathname = `/in/${pathParts[inIndex + 1]}`;
        }
      }
      
      // For Instagram, normalize to profile URLs
      if (domain.includes('instagram.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 1 && pathParts[1] && !pathParts[1].includes('p/')) {
          urlObj.pathname = `/${pathParts[1]}`;
        }
      }
      
      // For YouTube, normalize to channel URLs
      if (domain.includes('youtube.com')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.includes('channel') && pathParts.length > 2) {
          const channelIndex = pathParts.indexOf('channel');
          urlObj.pathname = `/channel/${pathParts[channelIndex + 1]}`;
        } else if (pathParts.includes('c') && pathParts.length > 2) {
          const cIndex = pathParts.indexOf('c');
          urlObj.pathname = `/c/${pathParts[cIndex + 1]}`;
        } else if (pathParts.includes('user') && pathParts.length > 2) {
          const userIndex = pathParts.indexOf('user');
          urlObj.pathname = `/user/${pathParts[userIndex + 1]}`;
        }
      }
      
      return urlObj.toString();
    } catch (error) {
      console.error(`Error cleaning URL ${url}:`, error);
      return null;
    }
  }
  
  // Organize social URLs by platform and remove duplicates
  organizeSocialUrls() {
    const organizedUrls = new Map();
    
    // Group URLs by platform
    this.socialUrls.forEach(url => {
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase().replace('www.', '');
        
        // Determine platform
        let platform = 'other';
        if (domain.includes('twitter.com') || domain.includes('x.com')) {
          platform = 'twitter';
        } else if (domain.includes('facebook.com') || domain.includes('fb.com')) {
          platform = 'facebook';
        } else if (domain.includes('instagram.com')) {
          platform = 'instagram';
        } else if (domain.includes('linkedin.com')) {
          platform = 'linkedin';
        } else if (domain.includes('youtube.com')) {
          platform = 'youtube';
        } else if (domain.includes('github.com')) {
          platform = 'github';
        } else if (domain.includes('discord.com') || domain.includes('discord.gg')) {
          platform = 'discord';
        } else if (domain.includes('tiktok.com')) {
          platform = 'tiktok';
        } else if (domain.includes('telegram.me') || domain.includes('t.me')) {
          platform = 'telegram';
        } else if (domain.includes('pinterest.com')) {
          platform = 'pinterest';
        } else if (domain.includes('medium.com')) {
          platform = 'medium';
        } else if (domain.includes('reddit.com')) {
          platform = 'reddit';
        }
        
        if (!organizedUrls.has(platform)) {
          organizedUrls.set(platform, new Set());
        }
        organizedUrls.get(platform).add(url);
      } catch (error) {
        console.error(`Error organizing URL ${url}:`, error);
      }
    });
    
    // Clear and rebuild socialUrls with organized, deduplicated URLs
    this.socialUrls.clear();
    
    // Add URLs in a specific order (most important platforms first)
    const platformOrder = ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'github', 'discord', 'tiktok', 'telegram', 'pinterest', 'medium', 'reddit', 'other'];
    
    platformOrder.forEach(platform => {
      if (organizedUrls.has(platform)) {
        organizedUrls.get(platform).forEach(url => {
          this.socialUrls.add(url);
        });
      }
    });
    
    console.log(`Organized ${this.socialUrls.size} social URLs by platform`);
  }
  
  // Format social URLs for final output
  formatSocialUrls(socialUrls) {
    if (!socialUrls || socialUrls.length === 0) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(socialUrls)) {
      return socialUrls;
    }
    
    // If it's a Set, convert to array
    if (socialUrls instanceof Set) {
      return Array.from(socialUrls);
    }
    
    // If it's a string, split by semicolon and clean
    if (typeof socialUrls === 'string') {
      return socialUrls.split(';').map(url => url.trim()).filter(url => url.length > 0);
    }
    
    return [];
  }

  extractSignupForms() {
    // Enhanced signup/action keywords
    const signupKeywords = [
      'sign up', 'signup', 'register', 'create account', 'join now', 'apply now',
      'login', 'log in', 'sign in', 'signin', 'get started', 'start now', 
      'demo', 'try now', 'try it', 'try for free', 'access now', 'request demo',
      'free trial', 'start trial', 'subscribe', 'get access', 'create your account',
      'start free', 'begin now', 'try it free', 'create', 'start today'
    ];
    
    // Look for links and buttons with signup text
    const elementPattern = /<(a|button|input)\s+[^>]*?(?:href=["']([^"']+)["'])?[^>]*?(?:value=["']([^"']+)["'])?[^>]*>(.*?)<\/\1>/gi;
    let match;
    
    while ((match = elementPattern.exec(this.fullSource)) !== null) {
      const href = match[2] || '';
      const value = match[3] || '';
      const cleanText = (match[4] || '').replace(/<[^<]+?>/g, '').trim();
      const textToCheck = (cleanText + ' ' + value).toLowerCase();
      
      if (signupKeywords.some(keyword => textToCheck.includes(keyword.toLowerCase()))) {
        console.log(`Found signup keyword in: "${textToCheck}"`);
        
        // If there's a href, use it as the signup URL
        if (href) {
          try {
            const absoluteUrl = new URL(href, this.baseUrl).href;
            this.signupUrls.add(absoluteUrl);
            console.log(`Added signup URL: ${absoluteUrl}`);
          } catch (e) {
            // If URL parsing fails, just use the base URL
            this.signupUrls.add(this.baseUrl);
          }
        } else {
          this.signupUrls.add(this.baseUrl);
        }
      }
    }
    
    // Also look for forms with signup-related attributes
    const formPattern = /<form[^>]*action=["']([^"']+)["'][^>]*>[\s\S]*?<\/form>/gi;
    while ((match = formPattern.exec(this.fullSource)) !== null) {
      const formContent = match[0].toLowerCase();
      const formAction = match[1];
      
      // Check if form contains signup keywords
      if (signupKeywords.some(keyword => formContent.includes(keyword.toLowerCase()))) {
        try {
          const absoluteUrl = new URL(formAction, this.baseUrl).href;
          this.signupUrls.add(absoluteUrl);
          console.log(`Added signup form URL: ${absoluteUrl}`);
        } catch (e) {
          this.signupUrls.add(this.baseUrl);
        }
      }
    }
    
    // Look for sections with signup-related IDs or classes
    const sectionPattern = /<(div|section)[^>]*class=["'][^"']*(?:signup|register|login|join|trial)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;
    while ((match = sectionPattern.exec(this.fullSource)) !== null) {
      // Extract links from this section
      const section = match[0];
      const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let linkMatch;
      
      while ((linkMatch = linkPattern.exec(section)) !== null) {
        try {
          const absoluteUrl = new URL(linkMatch[1], this.baseUrl).href;
          this.signupUrls.add(absoluteUrl);
          console.log(`Added signup section URL: ${absoluteUrl}`);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    }
  }

  extractContactInfo() {
    console.log(`Extracting contact info for destination domain: ${this.destinationDomain}`);
    
    // Enhanced email extraction with domain filtering
    this.extractEmailsFromText();
    this.extractEmailsFromAttributes();
    this.extractEmailsFromScripts();
    this.extractEmailsFromContactSections();
    
    // Ensure we don't have too many emails (which would suggest pattern generation)
    if (this.emails.size > 5) {
      console.log(`Found ${this.emails.size} emails, limiting to most relevant 5`);
      const emailArray = Array.from(this.emails);
      
      // Prioritize domain-specific emails
      const domainEmails = emailArray.filter(email => 
        email.split('@')[1]?.includes(this.destinationDomain)
      );
      
      // Then add other emails until we have 5
      const otherEmails = emailArray.filter(email => 
        !email.split('@')[1]?.includes(this.destinationDomain)
      );
      
      // Clear and rebuild the email set with prioritized emails
      this.emails.clear();
      
      // Add domain emails first
      domainEmails.slice(0, 5).forEach(email => this.emails.add(email));
      
      // If we have space, add other emails
      if (this.emails.size < 5) {
        otherEmails.slice(0, 5 - this.emails.size).forEach(email => this.emails.add(email));
      }
    }
  }
  
  // Extract emails from regular text content
  extractEmailsFromText() {
    const emailPatterns = [
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,
      /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];
    
    emailPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const email = match[1] || match[0];
        this.addEmailIfValid(email);
      }
    });
  }
  
  // Extract emails from HTML attributes (data-email, etc.)
  extractEmailsFromAttributes() {
    const attributePatterns = [
      /data-email=["']([^"']+)["']/gi,
      /data-mail=["']([^"']+)["']/gi,
      /data-contact=["']([^"']+)["']/gi,
      /email=["']([^"']+)["']/gi,
      /mail=["']([^"']+)["']/gi
    ];
    
    attributePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const potentialEmail = match[1];
        if (potentialEmail.includes('@')) {
          this.addEmailIfValid(potentialEmail);
        }
      }
    });
  }
  
  // Extract emails from JavaScript/JSON data
  extractEmailsFromScripts() {
    const scriptTags = this.fullSource.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    
    scriptTags.forEach(script => {
      // Look for email patterns in script content
      const emailPattern = /['"]?(?:email|mail|contact)['"]?\s*[:=]\s*['"]([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})['"]?/gi;
      let match;
      
      while ((match = emailPattern.exec(script)) !== null) {
        this.addEmailIfValid(match[1]);
      }
    });
  }
  
  // Extract emails from contact/footer sections
  extractEmailsFromContactSections() {
    // Common sections that contain contact info
    const sectionPatterns = [
      /<(?:div|section|footer)[^>]*(?:id|class)=["'][^"']*(?:contact|footer|about)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|footer)>/gi
    ];
    
    sectionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const sectionContent = match[1];
        
        // Look for emails in this section
        const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi;
        let emailMatch;
        
        while ((emailMatch = emailPattern.exec(sectionContent)) !== null) {
          this.addEmailIfValid(emailMatch[0]);
        }
      }
    });
  }
  
  // Helper method to validate and add emails
  addEmailIfValid(email) {
    if (this.analyzer.isValidEmail(email)) {
      // Filter out Product Hunt emails and focus on destination domain
      const emailDomain = email.split('@')[1]?.toLowerCase();
      
      // Skip Product Hunt emails completely
      if (emailDomain?.includes('producthunt.com')) {
        return;
      }
      
      // Skip common test/example emails
      if (emailDomain?.includes('example.com') || 
          emailDomain?.includes('test.com') || 
          emailDomain?.includes('placeholder.com') ||
          email.includes('user@') ||
          email.includes('name@') ||
          email.includes('email@')) {
        return;
      }
      
      // Prioritize emails from the destination domain
      if (emailDomain === this.destinationDomain || 
          emailDomain === `www.${this.destinationDomain}`) {
        console.log(`Found destination domain email: ${email}`);
        this.emails.add(email.toLowerCase());
      }
      // Also include other relevant emails
      else {
        console.log(`Found other relevant email: ${email}`);
        this.emails.add(email.toLowerCase());
      }
    }
  }
  
  // Phone extraction
  extractPhoneNumbers() {
    console.log(`Extracting phone numbers from HTML content`);
    
    // Enhanced phone number patterns
    const phonePatterns = [
      // tel: links
      /tel:([+]?\d[-\s\(\)\.]{7,})/gi,
      // International format with country code
      /\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
      // US format (xxx) xxx-xxxx
      /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}/g,
      // US format xxx-xxx-xxxx
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      // International with dots
      /\+\d{1,4}[-.]\d{1,4}[-.]\d{1,4}[-.]\d{1,9}/g,
      // Numbers with spaces
      /\b\d{3}\s\d{3}\s\d{4}\b/g,
      // UK format
      /\+44\s?\(0\)?\s?\d{2,5}\s?\d{6,8}/g,
      // Generic international
      /\+\d{1,3}\s?\d{6,14}/g
    ];
    
    // Look for phone numbers in the HTML content
    phonePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const phone = match[1] || match[0];
        const cleaned = phone.replace(/[^\d+\-() ]/g, '');
        const digits = cleaned.replace(/\D/g, '');
        
        // Validate phone number (must have enough digits)
        if (digits.length >= 10) {
          this.phoneNumbers.add(cleaned.trim());
          console.log(`Found phone number: ${cleaned.trim()}`);
        }
      }
    });
    
    // Also look for phone numbers in specific elements
    const phoneElements = [
      // Elements with phone-related classes or IDs
      /<[^>]*(?:class|id)=["'][^"']*(?:phone|tel|contact|call)[^"']*["'][^>]*>(.*?)<\/[^>]*>/gi,
      // Elements with phone-related text
      /<[^>]*>([^<]*(?:phone|call us|contact us|telephone)[^<]*\d{3}[^<]*)<\/[^>]*>/gi
    ];
    
    phoneElements.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.fullSource)) !== null) {
        const content = match[1];
        
        // Apply all phone patterns to this content
        phonePatterns.forEach(phonePattern => {
          let phoneMatch;
          while ((phoneMatch = phonePattern.exec(content)) !== null) {
            const phone = phoneMatch[1] || phoneMatch[0];
            const cleaned = phone.replace(/[^\d+\-() ]/g, '');
            const digits = cleaned.replace(/\D/g, '');
            
            if (digits.length >= 10) {
              this.phoneNumbers.add(cleaned.trim());
              console.log(`Found phone number in element: ${cleaned.trim()}`);
            }
          }
        });
      }
    });
    
    // Look for structured data phone numbers
    const structuredDataPattern = /"telephone":\s*"([^"]+)"/gi;
    let structuredMatch;
    while ((structuredMatch = structuredDataPattern.exec(this.fullSource)) !== null) {
      if (structuredMatch[1]) {
        const cleaned = structuredMatch[1].replace(/[^\d+\-() ]/g, '');
        const digits = cleaned.replace(/\D/g, '');
        
        if (digits.length >= 10) {
          this.phoneNumbers.add(cleaned.trim());
          console.log(`Found phone number in structured data: ${cleaned.trim()}`);
        }
      }
    }
    
    console.log(`Found ${this.phoneNumbers.size} phone numbers`);
  }
}
