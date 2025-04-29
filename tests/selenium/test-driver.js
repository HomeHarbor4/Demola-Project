const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

class TestDriver {
  constructor() {
    this.driver = null;
    this.baseUrl = 'http://localhost:3000';
  }

  async start() {
    // Set up Chrome options
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    // Create the WebDriver instance
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    
    // Set implicit wait timeout
    await this.driver.manage().setTimeouts({ implicit: 10000 });
    
    return this.driver;
  }

  async stop() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async navigateTo(path) {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    await this.driver.get(url);
  }

  async waitForElement(locator, timeout = 10000) {
    return this.driver.wait(until.elementLocated(locator), timeout);
  }

  async findElement(locator) {
    return this.driver.findElement(locator);
  }

  async findElements(locator) {
    return this.driver.findElements(locator);
  }

  async getElementText(locator) {
    const element = await this.findElement(locator);
    return element.getText();
  }

  async elementExists(locator) {
    try {
      await this.findElement(locator);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clickElement(locator) {
    const element = await this.findElement(locator);
    await element.click();
  }

  async typeIntoElement(locator, text) {
    const element = await this.findElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getPageTitle() {
    return this.driver.getTitle();
  }

  async getPageUrl() {
    return this.driver.getCurrentUrl();
  }

  async scrollToElement(locator) {
    const element = await this.findElement(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView(true);", element);
    // Small pause to let the scrolling complete and any animations settle
    await this.driver.sleep(500);
  }

  async waitForPageLoad() {
    return this.driver.wait(() => {
      return this.driver.executeScript('return document.readyState === "complete"');
    }, 10000);
  }

  async takeScreenshot() {
    return this.driver.takeScreenshot();
  }
}

module.exports = TestDriver;