const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Static Pages Tests', function() {
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

  it('should load the Terms of Service page successfully', async function() {
    await testDriver.navigateTo('/terms-of-service');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.equal('Terms of Service');
    
    // Check that content sections are present
    const contentSections = await testDriver.findElements(By.css('h2'));
    expect(contentSections.length).to.be.greaterThan(5); // At least 5 sections
    
    // Check for specific content
    const introductionSectionExists = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Introduction')]"));
    expect(introductionSectionExists).to.be.true;
  });

  it('should load the Privacy Policy page successfully', async function() {
    await testDriver.navigateTo('/privacy-policy');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.equal('Privacy Policy');
    
    // Check that content sections are present
    const contentSections = await testDriver.findElements(By.css('h2'));
    expect(contentSections.length).to.be.greaterThan(5); // At least 5 sections
    
    // Check for specific content
    const dataCollectionSectionExists = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Information We Collect')]"));
    expect(dataCollectionSectionExists).to.be.true;
  });

  it('should load the FAQ page successfully', async function() {
    await testDriver.navigateTo('/faq');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Frequently Asked Questions');
    
    // Check for the search bar
    const searchBarExists = await testDriver.elementExists(By.css('input[placeholder*="Search"]'));
    expect(searchBarExists).to.be.true;
    
    // Check for FAQ categories
    const faqCategories = await testDriver.findElements(By.css('.categories a'));
    expect(faqCategories.length).to.be.greaterThan(0);
    
    // Check for accordion items
    const accordionItems = await testDriver.findElements(By.css('[data-state="closed"]'));
    expect(accordionItems.length).to.be.greaterThan(0);
    
    // Click on an accordion item to expand it
    await testDriver.clickElement(By.css('[data-state="closed"]'));
    
    // Verify the accordion item expanded
    const expandedItemExists = await testDriver.elementExists(By.css('[data-state="open"]'));
    expect(expandedItemExists).to.be.true;
  });

  it('should load the Careers page successfully', async function() {
    await testDriver.navigateTo('/careers');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Join Our Team');
    
    // Check for company values section
    const valuesSectionExists = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Our Values')]"));
    expect(valuesSectionExists).to.be.true;
    
    // Check for job listings
    const jobOpeningsSection = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Open Positions')]"));
    expect(jobOpeningsSection).to.be.true;
    
    // Check for job cards
    const jobCards = await testDriver.findElements(By.css('.job-card'));
    expect(jobCards.length).to.be.greaterThan(0);
    
    // Check for filter functionality
    const filterExists = await testDriver.elementExists(By.css('input[placeholder*="Search positions"]'));
    expect(filterExists).to.be.true;
    
    // Test searching for a position
    await testDriver.typeIntoElement(By.css('input[placeholder*="Search positions"]'), 'Developer');
    
    // Verify filtered results contain "Developer"
    const filteredResults = await testDriver.findElements(By.xpath("//div[contains(text(), 'Developer')]"));
    expect(filteredResults.length).to.be.greaterThan(0);
  });

  it('should have working navigation between static pages', async function() {
    // Start at Terms of Service
    await testDriver.navigateTo('/terms-of-service');
    await testDriver.waitForPageLoad();
    
    // Click on the Privacy Policy link in the footer
    await testDriver.scrollToElement(By.css('footer'));
    await testDriver.clickElement(By.xpath("//footer//a[contains(text(), 'Privacy')]"));
    await testDriver.waitForPageLoad();
    
    // Verify we're on the Privacy Policy page
    const privacyHeading = await testDriver.getElementText(By.css('h1'));
    expect(privacyHeading).to.equal('Privacy Policy');
    
    // Navigate to FAQ page from footer
    await testDriver.scrollToElement(By.css('footer'));
    await testDriver.clickElement(By.xpath("//footer//a[contains(text(), 'FAQ')]"));
    await testDriver.waitForPageLoad();
    
    // Verify we're on the FAQ page
    const faqHeading = await testDriver.getElementText(By.css('h1'));
    expect(faqHeading).to.include('Frequently Asked Questions');
  });
});