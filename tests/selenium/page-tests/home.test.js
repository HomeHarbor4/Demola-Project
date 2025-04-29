const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Home Page Tests', function() {
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

  it('should load the home page successfully', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Verify navbar is present
    const navbar = await testDriver.elementExists(By.css('nav'));
    expect(navbar).to.be.true;
    
    // Verify hero section is present
    const heroSection = await testDriver.elementExists(By.css('.hero-section'));
    expect(heroSection).to.be.true;
    
    // Verify search form is present
    const searchForm = await testDriver.elementExists(By.css('form'));
    expect(searchForm).to.be.true;
  });

  it('should display featured properties', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Verify featured properties section is present
    const featuredPropertiesHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Featured Properties')]"));
    expect(featuredPropertiesHeading).to.be.true;
    
    // Verify property cards are displayed
    const propertyCards = await testDriver.findElements(By.css('.property-card'));
    expect(propertyCards.length).to.be.greaterThan(0);
  });

  it('should display popular locations', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Verify popular locations section is present
    const locationsHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Popular Locations') or contains(text(), 'Explore Locations')]"));
    expect(locationsHeading).to.be.true;
    
    // Verify location cards are displayed
    const locationCards = await testDriver.findElements(By.css('.location-card'));
    expect(locationCards.length).to.be.greaterThan(0);
  });

  it('should navigate to properties page when clicking on search', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Type in search input
    const searchInput = await testDriver.elementExists(By.css('input[type="text"]'));
    if (searchInput) {
      await testDriver.typeIntoElement(By.css('input[type="text"]'), 'Berlin');
    }
    
    // Click search button
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'Search') or contains(@type, 'submit')]"));
    
    // Wait for navigation to complete
    await testDriver.waitForPageLoad();
    
    // Verify we're on the properties page
    const currentUrl = await testDriver.getPageUrl();
    expect(currentUrl).to.include('/properties');
  });

  it('should display testimonials or stats section', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Look for testimonials or stats section
    const testimonialsOrStats = await testDriver.elementExists(By.xpath("//section[contains(@class, 'testimonials') or contains(@class, 'stats')]"));
    expect(testimonialsOrStats).to.be.true;
    
    // Verify content in the section
    const sectionContent = await testDriver.elementExists(By.xpath("//section[contains(@class, 'testimonials') or contains(@class, 'stats')]//h2"));
    expect(sectionContent).to.be.true;
  });

  it('should display call-to-action section', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Scroll to bottom of page to ensure CTA is loaded
    await testDriver.scrollToElement(By.css('footer'));
    
    // Look for CTA section
    const ctaSection = await testDriver.elementExists(By.xpath("//section[contains(@class, 'cta')]"));
    expect(ctaSection).to.be.true;
    
    // Verify CTA button
    const ctaButton = await testDriver.elementExists(By.xpath("//section[contains(@class, 'cta')]//a[contains(@href, '/properties') or contains(@href, '/signup')]"));
    expect(ctaButton).to.be.true;
  });

  it('should have working navigation links in the navbar', async function() {
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Click on the Properties link
    await testDriver.clickElement(By.xpath("//nav//a[contains(text(), 'Properties')]"));
    
    // Wait for navigation to complete
    await testDriver.waitForPageLoad();
    
    // Verify we're on the properties page
    const propertiesUrl = await testDriver.getPageUrl();
    expect(propertiesUrl).to.include('/properties');
    
    // Navigate back to home
    await testDriver.navigateTo('/');
    await testDriver.waitForPageLoad();
    
    // Click on the Agents link if it exists
    const agentsLink = await testDriver.elementExists(By.xpath("//nav//a[contains(text(), 'Agents')]"));
    if (agentsLink) {
      await testDriver.clickElement(By.xpath("//nav//a[contains(text(), 'Agents')]"));
      
      // Wait for navigation to complete
      await testDriver.waitForPageLoad();
      
      // Verify we're on the agents page
      const agentsUrl = await testDriver.getPageUrl();
      expect(agentsUrl).to.include('/agents');
    }
  });
});