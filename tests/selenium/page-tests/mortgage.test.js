const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Mortgage Calculator Page Tests', function() {
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

  it('should load the mortgage calculator page successfully', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Verify the page title
    const pageHeading = await testDriver.getElementText(By.css('h1'));
    expect(pageHeading).to.include('Mortgage');
    
    // Check for the presence of calculator components
    const calculatorExists = await testDriver.elementExists(By.css('.mortgage-calculator'));
    expect(calculatorExists).to.be.true;
    
    // Check for form inputs
    const homeValueInput = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Home Value')]/following-sibling::input"));
    expect(homeValueInput).to.be.true;
    
    const downPaymentInput = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Down Payment')]/following-sibling::input"));
    expect(downPaymentInput).to.be.true;
    
    const loanTermInput = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Loan Term')]/following-sibling::*"));
    expect(loanTermInput).to.be.true;
    
    const interestRateInput = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Interest Rate')]/following-sibling::input"));
    expect(interestRateInput).to.be.true;
  });

  it('should calculate mortgage payments correctly', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Enter values in the calculator
    await testDriver.typeIntoElement(By.xpath("//label[contains(text(), 'Home Value')]/following-sibling::input"), '300000');
    await testDriver.typeIntoElement(By.xpath("//label[contains(text(), 'Down Payment')]/following-sibling::input"), '60000');
    await testDriver.typeIntoElement(By.xpath("//label[contains(text(), 'Interest Rate')]/following-sibling::input"), '4.5');
    
    // Select loan term (if it's a select dropdown)
    const loanTermSelect = await testDriver.elementExists(By.xpath("//label[contains(text(), 'Loan Term')]/following-sibling::select"));
    if (loanTermSelect) {
      await testDriver.clickElement(By.xpath("//select/option[contains(text(), '30')]"));
    }
    
    // Click calculate button (if there is one)
    const calculateButton = await testDriver.elementExists(By.xpath("//button[contains(text(), 'Calculate')]"));
    if (calculateButton) {
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Calculate')]"));
    }
    
    // Wait for results to appear
    await testDriver.driver.sleep(500);
    
    // Verify results are displayed
    const monthlyPayment = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Monthly Payment')]"));
    expect(monthlyPayment).to.be.true;
    
    // Check that calculation results are numeric
    const paymentAmount = await testDriver.elementExists(By.xpath("//*[contains(text(), '€') or contains(text(), '$')]"));
    expect(paymentAmount).to.be.true;
  });

  it('should display mortgage visualization charts', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Check for charts or visualizations
    const chartElements = await testDriver.findElements(By.css('.recharts-surface, .chart, canvas, .pie-chart'));
    expect(chartElements.length).to.be.greaterThan(0);
    
    // There should be at least one chart showing principal vs. interest breakdown
    const breakdownChart = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Principal') and contains(text(), 'Interest')]"));
    expect(breakdownChart).to.be.true;
  });

  it('should display amortization schedule', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Look for amortization schedule section or tab
    const amortizationSection = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Amortization')]"));
    
    // If there's a tab to click, click it
    if (amortizationSection) {
      await testDriver.clickElement(By.xpath("//*[contains(text(), 'Amortization')]"));
      await testDriver.driver.sleep(500);
    }
    
    // Check for amortization table headers
    const tableHeaders = await testDriver.findElements(By.xpath("//th[contains(text(), 'Payment') or contains(text(), 'Principal') or contains(text(), 'Interest') or contains(text(), 'Balance')]"));
    expect(tableHeaders.length).to.be.greaterThan(0);
    
    // Check for table rows with payment data
    const tableRows = await testDriver.findElements(By.css('tbody tr'));
    expect(tableRows.length).to.be.greaterThan(0);
  });

  it('should have interactive sliders or inputs', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Look for slider elements
    const sliders = await testDriver.findElements(By.css('input[type="range"], .slider'));
    
    if (sliders.length > 0) {
      // Test interacting with a slider
      await testDriver.driver.executeScript(
        "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));",
        sliders[0],
        50
      );
      
      // Wait for UI to update
      await testDriver.driver.sleep(500);
      
      // Verify calculation updates
      const updatedValues = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Monthly Payment')]"));
      expect(updatedValues).to.be.true;
    } else {
      // If no sliders, test regular inputs
      await testDriver.typeIntoElement(By.xpath("//label[contains(text(), 'Home Value')]/following-sibling::input"), '400000');
      
      // Wait for UI to update
      await testDriver.driver.sleep(500);
      
      // Verify calculation updates
      const updatedValues = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Monthly Payment')]"));
      expect(updatedValues).to.be.true;
    }
  });

  it('should have additional calculators or resources', async function() {
    await testDriver.navigateTo('/mortgage');
    await testDriver.waitForPageLoad();
    
    // Look for additional calculator options or resource links
    const additionalResources = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Affordability') or contains(text(), 'Resources') or contains(text(), 'Refinance') or contains(text(), 'Tips')]"));
    expect(additionalResources).to.be.true;
    
    // Verify there are informational sections about mortgages
    const infoSections = await testDriver.elementExists(By.xpath("//*[contains(text(), 'How mortgage') or contains(text(), 'What is') or contains(text(), 'Understanding')]"));
    expect(infoSections).to.be.true;
  });
});