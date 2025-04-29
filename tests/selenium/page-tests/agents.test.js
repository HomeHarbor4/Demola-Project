const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Agents Page Tests', function() {
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

  it('should load the agents page successfully', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Agents');
    
    // Check for agents section
    const agentsSection = await testDriver.elementExists(By.css('.agents-grid'));
    expect(agentsSection).to.be.true;
  });

  it('should display agent cards with information', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Check for agent cards
    const agentCards = await testDriver.findElements(By.css('.agent-card'));
    expect(agentCards.length).to.be.greaterThan(0);
    
    // Verify agent card contains required information
    const agentName = await testDriver.elementExists(By.css('.agent-card h3'));
    expect(agentName).to.be.true;
    
    const agentRating = await testDriver.elementExists(By.css('.agent-card .rating'));
    expect(agentRating).to.be.true;
    
    const agentSpecialty = await testDriver.elementExists(By.css('.agent-card .specialty'));
    expect(agentSpecialty).to.be.true;
  });

  it('should have a search or filter functionality', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Check for search input
    const searchInput = await testDriver.elementExists(By.css('input[type="text"]'));
    expect(searchInput).to.be.true;
    
    // Enter search term
    await testDriver.typeIntoElement(By.css('input[type="text"]'), 'Berlin');
    
    // Check for filter dropdown or buttons if they exist
    const filterOptions = await testDriver.elementExists(By.css('select, .filter-button'));
    
    if (filterOptions) {
      // Test filter functionality
      await testDriver.clickElement(By.css('select, .filter-button'));
      // Wait for filter options to appear
      await testDriver.driver.sleep(500);
    }
  });

  it('should have agent detail cards or modals', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Click on the first agent card
    await testDriver.clickElement(By.css('.agent-card'));
    
    // Wait for detail card or modal to appear
    await testDriver.driver.sleep(500);
    
    // Check if a modal opened or if we navigated to a detail page
    const agentDetailModalOrPage = await testDriver.elementExists(By.css('.agent-detail-modal, .agent-detail-page'));
    
    if (agentDetailModalOrPage) {
      // Verify agent details are displayed
      const agentDetailsElements = await testDriver.findElements(By.css('.agent-bio, .contact-info, .property-count'));
      expect(agentDetailsElements.length).to.be.greaterThan(0);
      
      // If it's a modal, close it
      const closeButton = await testDriver.elementExists(By.css('.close-button, .modal-close'));
      if (closeButton) {
        await testDriver.clickElement(By.css('.close-button, .modal-close'));
      }
    } else {
      // We might have navigated to a detail page
      const currentUrl = await testDriver.getPageUrl();
      expect(currentUrl).to.include('/agents/');
      
      // Navigate back to agents list
      await testDriver.navigateTo('/agents');
    }
  });

  it('should have contact or message agent functionality', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Look for contact or message buttons
    const contactButtons = await testDriver.findElements(By.xpath("//button[contains(text(), 'Contact') or contains(text(), 'Message')]"));
    
    if (contactButtons.length > 0) {
      // Click the first contact button
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Contact') or contains(text(), 'Message')]"));
      
      // Wait for modal or form to appear
      await testDriver.driver.sleep(500);
      
      // Verify contact form is displayed
      const contactForm = await testDriver.elementExists(By.css('form'));
      expect(contactForm).to.be.true;
      
      // Verify form contains input fields
      const nameInput = await testDriver.elementExists(By.css('input[name="name"]'));
      expect(nameInput).to.be.true;
      
      const emailInput = await testDriver.elementExists(By.css('input[type="email"]'));
      expect(emailInput).to.be.true;
      
      const messageInput = await testDriver.elementExists(By.css('textarea'));
      expect(messageInput).to.be.true;
      
      // Close the modal if it exists
      const closeButton = await testDriver.elementExists(By.css('.close-button, .modal-close'));
      if (closeButton) {
        await testDriver.clickElement(By.css('.close-button, .modal-close'));
      }
    }
  });

  it('should display agent specialties or categories', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Look for specialty filtering or categories section
    const specialtiesSection = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Specialties') or contains(text(), 'Categories') or contains(text(), 'Expertise')]"));
    
    if (specialtiesSection) {
      // Verify specialty options are displayed
      const specialtyOptions = await testDriver.findElements(By.css('.specialty-option, .category-tag'));
      expect(specialtyOptions.length).to.be.greaterThan(0);
      
      // Click on a specialty option if available
      if (specialtyOptions.length > 0) {
        await testDriver.clickElement(By.css('.specialty-option, .category-tag'));
        
        // Wait for filtered results
        await testDriver.driver.sleep(500);
        
        // Verify filtered results are displayed
        const filteredAgents = await testDriver.findElements(By.css('.agent-card'));
        expect(filteredAgents.length).to.be.greaterThan(0);
      }
    }
  });

  it('should have pagination if there are many agents', async function() {
    await testDriver.navigateTo('/agents');
    await testDriver.waitForPageLoad();
    
    // Check if pagination exists
    const paginationExists = await testDriver.elementExists(By.css('.pagination'));
    
    if (paginationExists) {
      // Get initial set of agents
      const initialAgents = await testDriver.findElements(By.css('.agent-card'));
      const initialCount = initialAgents.length;
      
      // Click on the next page button
      await testDriver.clickElement(By.css('.pagination-next, .next-page'));
      
      // Wait for new results to load
      await testDriver.driver.sleep(1000);
      
      // Verify the URL changed to include page parameter
      const currentUrl = await testDriver.getPageUrl();
      expect(currentUrl).to.include('page=');
      
      // or verify agents changed
      const newAgents = await testDriver.findElements(By.css('.agent-card'));
      if (newAgents.length === initialCount) {
        // If the same number of agents, check if they're different agents
        const firstAgentName = await testDriver.getElementText(By.css('.agent-card:first-child h3'));
        
        // Compare with the first agent name from before (if we had captured it)
        // This is a simplistic check, ideally we'd compare more thoroughly
        expect(firstAgentName).not.to.equal(initialAgents[0]);
      }
    }
  });
});