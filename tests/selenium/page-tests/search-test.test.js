const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Advanced Search Test Page Tests', function() {
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

  it('should load the search test page successfully', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Advanced Search Test');
    
    // Check for the presence of search form
    const searchFormExists = await testDriver.elementExists(By.css('form'));
    expect(searchFormExists).to.be.true;
    
    // Check for filter inputs
    const cityInput = await testDriver.elementExists(By.id('city'));
    expect(cityInput).to.be.true;
    
    const propertyTypeSelect = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Property Type')]/following-sibling::*"));
    expect(propertyTypeSelect).to.be.true;
    
    const listingTypeSelect = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Listing Type')]/following-sibling::*"));
    expect(listingTypeSelect).to.be.true;
  });

  it('should apply basic filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Enter city filter
    await testDriver.typeIntoElement(By.id('city'), 'Berlin');
    
    // Click on property type dropdown and select Apartment
    await testDriver.clickElement(By.xpath("//label[contains(text(), 'Property Type')]/following-sibling::*"));
    await testDriver.clickElement(By.xpath("//div[contains(text(), 'Apartment')]"));
    
    // Click on listing type dropdown and select Buy
    await testDriver.clickElement(By.xpath("//label[contains(text(), 'Listing Type')]/following-sibling::*"));
    await testDriver.clickElement(By.xpath("//div[contains(text(), 'Buy')]"));
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
    
    // Verify property cards are displayed
    const propertyCards = await testDriver.findElements(By.css('.property-card'));
    expect(propertyCards.length).to.be.greaterThan(0);
  });

  it('should apply price range filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Enter min and max price
    await testDriver.typeIntoElement(By.id('minPrice'), '100000');
    await testDriver.typeIntoElement(By.id('maxPrice'), '500000');
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
    
    // Verify property cards are displayed
    const propertyCards = await testDriver.findElements(By.css('.property-card'));
    expect(propertyCards.length).to.be.greaterThan(0);
  });

  it('should apply bedrooms and bathrooms filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Click on bedrooms dropdown and select 2
    await testDriver.clickElement(By.xpath("//label[contains(text(), 'Bedrooms')]/following-sibling::*"));
    await testDriver.clickElement(By.xpath("//div[contains(text(), '2')]"));
    
    // Click on bathrooms dropdown and select 2
    await testDriver.clickElement(By.xpath("//label[contains(text(), 'Bathrooms')]/following-sibling::*"));
    await testDriver.clickElement(By.xpath("//div[contains(text(), '2')]"));
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
  });

  it('should apply area range filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Enter min and max area
    await testDriver.typeIntoElement(By.id('minArea'), '500');
    await testDriver.typeIntoElement(By.id('maxArea'), '2000');
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
  });

  it('should apply amenities filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Toggle some amenity checkboxes
    await testDriver.clickElement(By.xpath("//input[@id='amenity-Swimming Pool']"));
    await testDriver.clickElement(By.xpath("//input[@id='amenity-Gym']"));
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
  });

  it('should apply geolocation filters correctly', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Click on "Use Bangalore" button to set geolocation
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Use Bangalore')]"));
    
    // Verify lat/lng fields are populated
    const latValue = await testDriver.driver.findElement(By.id('lat')).getAttribute('value');
    expect(latValue).to.not.be.empty;
    
    const lngValue = await testDriver.driver.findElement(By.id('lng')).getAttribute('value');
    expect(lngValue).to.not.be.empty;
    
    // Adjust radius using the slider if available
    const slider = await testDriver.findElement(By.id('radius'));
    await testDriver.driver.executeScript(
      "arguments[0].value = 10; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
      slider
    );
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Verify results are displayed
    const resultsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Properties Found')]"));
    expect(resultsHeading).to.be.true;
  });

  it('should open property detail modal when clicking on a property', async function() {
    await testDriver.navigateTo('/search-test');
    await testDriver.waitForPageLoad();
    
    // Click search button to load properties
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search Properties')]"));
    
    // Wait for results to load
    await testDriver.waitForPageLoad();
    
    // Click on the first property card
    await testDriver.clickElement(By.css('.property-card'));
    
    // Wait for the modal to appear
    await testDriver.waitForElement(By.css('.property-detail-modal'));
    
    // Verify the modal contains property details
    const modalTitle = await testDriver.elementExists(By.css('.property-detail-modal h2'));
    expect(modalTitle).to.be.true;
    
    // Close the modal
    await testDriver.clickElement(By.css('.modal-close-button'));
    
    // Verify the modal is closed
    const modalClosed = await testDriver.driver.wait(
      async () => !(await testDriver.elementExists(By.css('.property-detail-modal'))),
      5000
    );
    expect(modalClosed).to.be.true;
  });
});