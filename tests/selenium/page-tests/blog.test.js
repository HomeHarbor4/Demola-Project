const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Blog Page Tests', function() {
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

  it('should load the blog page successfully', async function() {
    await testDriver.navigateTo('/blog');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Blog');
    
    // Check for the presence of featured post
    const featuredPostExists = await testDriver.elementExists(By.css('.featured-post'));
    expect(featuredPostExists).to.be.true;
    
    // Check for blog post cards
    const blogPosts = await testDriver.findElements(By.css('.blog-post-card'));
    expect(blogPosts.length).to.be.greaterThan(0);
  });

  it('should filter blog posts by category', async function() {
    await testDriver.navigateTo('/blog');
    await testDriver.waitForPageLoad();
    
    // Check that category tabs exist
    const categoryTabs = await testDriver.findElements(By.css('.tabs-trigger'));
    expect(categoryTabs.length).to.be.greaterThan(0);
    
    // Click on a specific category tab (e.g., "Buying")
    await testDriver.clickElement(By.id('buying-tab'));
    
    // Verify that the tab content changes
    const buyingTabContent = await testDriver.elementExists(By.css('[data-state="active"][data-orientation="horizontal"]'));
    expect(buyingTabContent).to.be.true;
    
    // Verify that "Coming Soon" message is displayed for this category
    const comingSoonMessage = await testDriver.elementExists(By.xpath("//div[contains(text(), 'Coming Soon')]"));
    expect(comingSoonMessage).to.be.true;
  });

  it('should display newsletter signup section', async function() {
    await testDriver.navigateTo('/blog');
    await testDriver.waitForPageLoad();
    
    // Scroll to the newsletter section
    await testDriver.scrollToElement(By.xpath("//h2[contains(text(), 'Stay Updated')]"));
    
    // Verify newsletter elements exist
    const newsletterSection = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Stay Updated')]"));
    expect(newsletterSection).to.be.true;
    
    const emailInput = await testDriver.elementExists(By.css('input[type="email"]'));
    expect(emailInput).to.be.true;
    
    const subscribeButton = await testDriver.elementExists(By.xpath("//button[contains(text(), 'Subscribe')]"));
    expect(subscribeButton).to.be.true;
  });

  it('should display related resources section', async function() {
    await testDriver.navigateTo('/blog');
    await testDriver.waitForPageLoad();
    
    // Scroll to the related resources section
    await testDriver.scrollToElement(By.xpath("//h2[contains(text(), 'Related Resources')]"));
    
    // Verify related resources elements exist
    const relatedResourcesHeading = await testDriver.elementExists(By.xpath("//h2[contains(text(), 'Related Resources')]"));
    expect(relatedResourcesHeading).to.be.true;
    
    // Check for resource cards
    const resourceCards = await testDriver.findElements(By.css('.card'));
    expect(resourceCards.length).to.be.greaterThan(0);
    
    // Verify links to other sections exist
    const mortgageLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Mortgage')]"));
    expect(mortgageLink).to.be.true;
    
    const agentsLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Agents')]"));
    expect(agentsLink).to.be.true;
  });

  it('should navigate between tabs correctly', async function() {
    await testDriver.navigateTo('/blog');
    await testDriver.waitForPageLoad();
    
    // Click on a specific category tab (e.g., "Selling")
    await testDriver.clickElement(By.id('selling-tab'));
    
    // Verify the "Coming Soon" view is shown
    const comingSoonMessage = await testDriver.elementExists(By.xpath("//div[contains(text(), 'Coming Soon')]"));
    expect(comingSoonMessage).to.be.true;
    
    // Click "View All Posts" button to return to all posts
    await testDriver.clickElement(By.xpath("//button[contains(text(), 'View All Posts')]"));
    
    // Verify we're back to the "All Posts" tab
    const allPostsTabActive = await testDriver.elementExists(By.css('[data-state="active"][data-value="all"]'));
    expect(allPostsTabActive).to.be.true;
    
    // Verify blog post cards are visible again
    const blogPosts = await testDriver.findElements(By.css('.blog-post-card'));
    expect(blogPosts.length).to.be.greaterThan(0);
  });
});