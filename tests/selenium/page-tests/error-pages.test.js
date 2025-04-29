const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Error and Not Found Pages Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds
  let driver;
  let testDriver;

  before(async function() {
    testDriver = new TestDriver();
    driver = await testDriver.start();
  });

  after(async function() {
    await testDriver.stop();
  });

  it('should display 404 page for non-existent routes', async function() {
    // Navigate to a non-existent route
    await testDriver.navigateTo('/this-page-does-not-exist');
    await testDriver.waitForPageLoad();
    
    // Verify 404 page elements
    const notFoundHeading = await testDriver.elementExists(By.xpath("//*[contains(text(), '404') or contains(text(), 'Not Found')]"));
    expect(notFoundHeading).to.be.true;
    
    // Check for home link to return to safety
    const homeLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Home') or contains(text(), 'Go back')]"));
    expect(homeLink).to.be.true;
  });

  it('should have working links on the 404 page', async function() {
    await testDriver.navigateTo('/this-page-does-not-exist');
    await testDriver.waitForPageLoad();
    
    // Click on the home link or button
    await testDriver.clickElement(By.xpath("//a[contains(text(), 'Home') or contains(text(), 'Go back')]"));
    
    // Wait for navigation to complete
    await testDriver.waitForPageLoad();
    
    // Verify we're back on the home page
    const currentUrl = await testDriver.getPageUrl();
    expect(currentUrl).to.not.include('this-page-does-not-exist');
    
    // Additional verification we're on home page
    const heroSection = await testDriver.elementExists(By.css('.hero-section'));
    expect(heroSection).to.be.true;
  });

  it('should handle invalid property IDs gracefully', async function() {
    // Navigate to a property detail page with an invalid ID
    await testDriver.navigateTo('/properties/99999999');
    await testDriver.waitForPageLoad();
    
    // Check if either proper error message or 404 is shown
    const errorOrNotFoundElement = await testDriver.elementExists(By.xpath("//*[contains(text(), 'not found') or contains(text(), 'doesn't exist') or contains(text(), '404')]"));
    expect(errorOrNotFoundElement).to.be.true;
    
    // Check if there's a link to all properties
    const propertiesLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'properties') or contains(text(), 'Browse')]"));
    
    if (propertiesLink) {
      // Click the link to properties
      await testDriver.clickElement(By.xpath("//a[contains(text(), 'properties') or contains(text(), 'Browse')]"));
      
      // Wait for navigation to complete
      await testDriver.waitForPageLoad();
      
      // Verify we're on the properties page
      const propertiesUrl = await testDriver.getPageUrl();
      expect(propertiesUrl).to.include('/properties');
    }
  });

  it('should handle access to unauthorized pages properly', async function() {
    // Try to access a page that requires authentication
    await testDriver.navigateTo('/my-properties');
    await testDriver.waitForPageLoad();
    
    // Check if we're redirected to sign in or shown an unauthorized message
    const signInOrUnauthorizedElement = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Sign In') or contains(text(), 'Login') or contains(text(), 'Unauthorized')]"));
    expect(signInOrUnauthorizedElement).to.be.true;
    
    // Check if there's a sign in link or button
    const signInLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Sign In') or contains(text(), 'Login')]"));
    
    if (signInLink) {
      // Click the sign in link
      await testDriver.clickElement(By.xpath("//a[contains(text(), 'Sign In') or contains(text(), 'Login')]"));
      
      // Wait for navigation to complete
      await testDriver.waitForPageLoad();
      
      // Verify we're on the sign in page
      const signInUrl = await testDriver.getPageUrl();
      expect(signInUrl).to.include('/signin');
    }
  });

  it('should handle server API errors gracefully', async function() {
    // Navigate to a page that makes API calls
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Check if the page loaded basic structure (even if API call might fail)
    const pageStructure = await testDriver.elementExists(By.css('nav, .page-container, footer'));
    expect(pageStructure).to.be.true;
    
    // NOTE: This test is limited without the ability to mock API responses
    // Ideally, we would simulate API errors and check for error messages
  });

  it('should display proper message for empty search results', async function() {
    // Navigate to search page with query that should yield no results
    await testDriver.navigateTo('/properties?query=zzzzzzzzzzzzzzzzzzzzzz');
    await testDriver.waitForPageLoad();
    
    // Check if "no results" message is displayed
    const noResultsElement = await testDriver.elementExists(By.xpath("//*[contains(text(), 'No results') or contains(text(), 'No properties') or contains(text(), 'found 0')]"));
    
    // If no results message is shown, test passes
    if (noResultsElement) {
      expect(noResultsElement).to.be.true;
    } else {
      // Alternative: check if zero property cards are displayed
      const propertyCards = await testDriver.findElements(By.css('.property-card'));
      expect(propertyCards.length).to.equal(0);
    }
    
    // Check if there's a "clear search" or "reset filters" option
    const clearSearchElement = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Clear') or contains(text(), 'Reset')]"));
    
    if (clearSearchElement) {
      // Click to clear search
      await testDriver.clickElement(By.xpath("//*[contains(text(), 'Clear') or contains(text(), 'Reset')]"));
      
      // Wait for results to update
      await testDriver.waitForPageLoad();
      
      // Verify some properties are now shown
      const propertyCards = await testDriver.findElements(By.css('.property-card'));
      expect(propertyCards.length).to.be.greaterThan(0);
    }
  });
});