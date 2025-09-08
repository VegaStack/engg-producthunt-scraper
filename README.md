# ProductHunt Scraper - Chrome Extension

<div align="center">
  <img src="icons/icon128.png" alt="ProductHunt Scraper Logo" width="128" height="128">
  
  <h3>🚀 Extract ProductHunt Leaderboard Data Effortlessly</h3>
  
  <p>A powerful Chrome extension that automatically scrapes product information from ProductHunt leaderboard pages and exports it to CSV format.</p>
  
  [![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome&logoColor=white)](https://chrome.google.com/webstore)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![GitHub stars](https://img.shields.io/github/stars/VegaStack/engg-producthunt-scraper?style=social)](https://github.com/VegaStack/engg-producthunt-scraper)
</div>

---

## ✨ Features

- **🎯 One-Click Scraping**: Simple interface to start the data extraction process
- **📜 Auto-Scroll**: Automatically scrolls down to capture all dynamically loaded products
- **📊 CSV Export**: Downloads comprehensive data in clean CSV format
- **⚡ High Performance**: Processes 100+ products in under 1 minute
- **🔗 URL Resolution**: Automatically resolves redirects to get final destination URLs
- **📱 Real-time Progress**: Visual feedback with progress indicators and status updates
- **🎨 Modern UI**: Clean, intuitive interface with smooth animations

## 📋 Data Extracted

The extension extracts the following information for each product:

| Field | Description |
|-------|-------------|
| **Product Name** | The name of the product |
| **Description** | Product description from ProductHunt |
| **Categories** | Product categories/tags |
| **ProductHunt URL** | Direct link to the product on ProductHunt |
| **Comments** | Number of comments |
| **Upvotes** | Number of upvotes (pods) |
| **Website URL** | Final resolved website URL |

## 🚀 Installation

### Method 1: Chrome Web Store (Coming Soon)
*The extension will be available on the Chrome Web Store soon.*

### Method 2: Manual Installation (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/VegaStack/engg-producthunt-scraper.git
   cd eng-producthunt-scraper
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)

3. **Load the Extension**
   - Click **Load unpacked**
   - Select the project folder containing `manifest.json`
   - The extension will appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin the "ProductHunt Scraper" extension for easy access

## 📖 Usage

### Step 1: Navigate to ProductHunt
Go to any ProductHunt leaderboard page:
- All-time leaderboards: `https://www.producthunt.com/leaderboard`
- Daily leaderboards:    `https://www.producthunt.com/leaderboard/daily/2025/2/13`
- Monthly leaderboards:  `https://www.producthunt.com/leaderboard/`
- Weekly leaderboards:   `https://www.producthunt.com/leaderboard/monthly/2025/2`


### Step 2: Start Scraping
1. Click the ProductHunt Scraper icon in your Chrome toolbar
2. Click **"Start Extracting Products"** button
3. The extension will automatically:
   - Scroll down to load all products
   - Extract product data
   - Resolve website URLs
   - Show progress in real-time

### Step 3: Download Data
1. Once complete, click **"Download CSV {Count} Products"**
2. The CSV file will be saved to your Downloads folder
3. Open in Excel, Google Sheets, or any CSV-compatible application

## 🛠️ Technical Details

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   popup.html    │    │   content.js     │    │  background.js  │
│   popup.js      │◄──►│   url-analyzer.js│◄──►│                 │
│   styles.css    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration and permissions |
| `popup.html/js` | User interface and interaction logic |
| `content.js` | Main scraping logic and DOM interaction |
| `background.js` | Service worker for CORS handling and badge updates |
| `url-analyzer.js` | URL resolution and validation |
| `styles.css` | UI styling and animations |

### Permissions

- `activeTab`: Access to the current ProductHunt tab
- `scripting`: Inject content scripts
- `tabs`: Query tab information
- `*://*/*`: Host permissions for URL resolution

## 🔧 Development

### Prerequisites
- Google Chrome (latest version)
- Basic knowledge of Chrome extension development

### Setup Development Environment

1. **Clone the Repository**
   ```bash
   git clone https://github.com/VegaStack/engg-producthunt-scraper.git
   cd eng-producthunt-scraper
   ```

2. **Load in Chrome**
   - Follow the manual installation steps above
   - Make changes to the code
   - Reload the extension in `chrome://extensions/`

3. **Debug**
   - Right-click extension icon → "Inspect popup"
   - Use Chrome DevTools for debugging

### Project Structure

```
eng-producthunt-scraper/
├── icons/                 # Extension icons (16px, 32px, 48px, 128px)
├── popup.html            # Main popup interface
├── popup.js              # Popup logic and event handlers
├── styles.css            # UI styling
├── content.js            # Content script for scraping
├── background.js         # Service worker
├── url-analyzer.js       # URL resolution utilities
├── manifest.json         # Extension manifest
└── README.md            # This file
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
- 🐛 **Report Bugs**: Open an issue with detailed bug reports
- 💡 **Feature Requests**: Suggest new features or improvements
- 🔧 **Code Contributions**: Submit pull requests for bug fixes or features
- 📖 **Documentation**: Improve documentation and examples
- 🧪 **Testing**: Test the extension and report issues

### Development Workflow

1. **Fork the Repository**
   ```bash
   git fork https://github.com/VegaStack/engg-producthunt-scraper.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write clean, well-commented code
   - Follow existing code style
   - Test your changes thoroughly

4. **Submit a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots if UI changes

### Code Style Guidelines
- Use meaningful variable and function names
- Add comments for complex logic
- Follow JavaScript ES6+ standards
- Maintain consistent indentation (2 spaces)

## 🐛 Troubleshooting

### Common Issues

**Extension not working on ProductHunt pages**
- Ensure you're on a valid ProductHunt leaderboard page
- Check that the extension is enabled in `chrome://extensions/`
- Try refreshing the page and clicking the extension again

**Download button not appearing**
- Wait for the scraping process to complete
- Check browser console for error messages
- Ensure you have sufficient permissions

**CSV file is empty or incomplete**
- Verify you're on a ProductHunt leaderboard page
- Check your internet connection
- Try scrolling down manually before starting the extension

**Extension crashes or freezes**
- Reload the extension in `chrome://extensions/`
- Clear browser cache and cookies
- Restart Chrome browser

### Getting Help

- 📧 **Email**: [support@vegastack.com](mailto:support@vegastack.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/VegaStack/engg-producthunt-scraper/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/VegaStack/engg-producthunt-scraper/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ProductHunt** for providing the platform and data
- **Chrome Extension API** for the powerful extension framework
- **Open Source Community** for inspiration and contributions
- **VegaStack** for development and maintenance

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/VegaStack/engg-producthunt-scraper?style=social)
![GitHub forks](https://img.shields.io/github/forks/VegaStack/engg-producthunt-scraper?style=social)
![GitHub issues](https://img.shields.io/github/issues/VegaStack/engg-producthunt-scraper)
![GitHub pull requests](https://img.shields.io/github/issues-pr/VegaStack/engg-producthunt-scraper)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://vegastack.com">VegaStack</a></p>
  
  <p>
    <a href="https://github.com/VegaStack/engg-producthunt-scraper/issues">Report Bug</a>
    ·
    <a href="https://github.com/VegaStack/engg-producthunt-scraper/issues">Request Feature</a>
    ·
    <a href="https://vegastack.com">Contact Us</a>
  </p>
</div>