const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Property Listings Page Tests', function() {
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

  it('should load the property listings page successfully', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Verify the page title or heading
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Properties');
    
    // Check for the presence of key elements
    const filtersExist = await testDriver.elementExists(By.css('.filters-section'));
    expect(filtersExist).to.be.true;
    
    const propertiesListExists = await testDriver.elementExists(By.css('.properties-list'));
    expect(propertiesListExists).to.be.true;
  });

  it('should filter properties by type', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Click on a property type filter (e.g., Apartment)
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Apartment')]"));
    
    // Wait for the page to reload with filtered results
    await testDriver.waitForPageLoad();
    
    // Verify URL contains the filter parameter
    const currentUrl = await testDriver.getPageUrl();
    expect(currentUrl).to.include('type=apartment');
    
    // Verify the property cards are displayed
    const propertyCards = await testDriver.findElements(By.css('.property-card'));
    expect(propertyCards.length).to.be.greaterThan(0);
  });

  it('should toggle between grid and map views', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Initially, the grid view should be active
    const gridViewActive = await testDriver.elementExists(By.css('.grid-view.active'));
    expect(gridViewActive).to.be.true;
    
    // Click on the map view button
    await testDriver.clickElement(By.css('.map-view-button'));
    await testDriver.waitForPageLoad();
    
    // Now the map view should be active
    const mapViewActive = await testDriver.elementExists(By.css('.map-view.active'));
    expect(mapViewActive).to.be.true;
    
    // Verify the map component is displayed
    const mapComponentExists = await testDriver.elementExists(By.css('.leaflet-container'));
    expect(mapComponentExists).to.be.true;
  });

  it('should open advanced filters and apply them', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Click on the advanced filters button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Advanced Filters')]"));
    
    // Verify the advanced filters panel is displayed
    const advancedFiltersPanelExists = await testDriver.elementExists(By.css('.advanced-filters-panel'));
    expect(advancedFiltersPanelExists).to.be.true;
    
    // Set a price range filter
    await testDriver.typeIntoElement(By.id('minPrice'), '100000');
    await testDriver.typeIntoElement(By.id('maxPrice'), '500000');
    
    // Apply the filters
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Apply Filters')]"));
    
    // Wait for the page to reload with filtered results
    await testDriver.waitForPageLoad();
    
    // Verify URL contains the filter parameters
    const currentUrl = await testDriver.getPageUrl();
    expect(currentUrl).to.include('minPrice=100000');
    expect(currentUrl).to.include('maxPrice=500000');
  });

  it('should paginate through property listings', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Get the number of properties on the first page
    const initialPropertyCards = await testDriver.findElements(By.css('.property-card'));
    const initialCount = initialPropertyCards.length;
    
    // Click on the next page button
    await testDriver.clickElement(By.css('.pagination-next'));
    
    // Wait for the page to reload with new results
    await testDriver.waitForPageLoad();
    
    // Verify URL contains the page parameter
    const currentUrl = await testDriver.getPageUrl();
    expect(currentUrl).to.include('page=2');
    
    // Verify the property cards on the second page
    const newPropertyCards = await testDriver.findElements(By.css('.property-card'));
    expect(newPropertyCards.length).to.be.greaterThan(0);
  });

  it('should open property detail modal when clicking on a property', async function() {
    await testDriver.navigateTo('/properties');
    await testDriver.waitForPageLoad();
    
    // Click on the first property card
    await testDriver.clickElement(By.css('.property-card'));
    
    // Wait for the modal to appear
    await testDriver.waitForElement(By.css('.property-detail-modal'));
    
    // Verify the modal contains property details
    const modalTitle = await testDriver.elementExists(By.css('.property-detail-modal h2'));
    expect(modalTitle).to.be.true;
    
    const propertyPrice = await testDriver.elementExists(By.css('.property-detail-modal .price'));
    expect(propertyPrice).to.be.true;
    
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