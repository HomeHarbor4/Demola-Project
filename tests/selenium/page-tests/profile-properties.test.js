const { describe, it, before, after } = require('mocha');
const { By } = require('selenium-webdriver');
const { expect } = require('chai');
const TestDriver = require('../test-driver');

describe('Profile and My Properties Pages Tests', function() {
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

  it('should redirect to sign in when accessing profile without authentication', async function() {
    await testDriver.navigateTo('/profile');
    await testDriver.waitForPageLoad();
    
    // Verify we're redirected to sign in or shown a sign in message
    const signInText = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Sign In') or contains(text(), 'sign in')]"));
    expect(signInText).to.be.true;
  });

  it('should redirect to sign in when accessing my properties without authentication', async function() {
    await testDriver.navigateTo('/my-properties');
    await testDriver.waitForPageLoad();
    
    // Verify we're redirected to sign in or shown a sign in message
    const signInText = await testDriver.elementExists(By.xpath("//*[contains(text(), 'Sign In') or contains(text(), 'sign in')]"));
    expect(signInText).to.be.true;
    
    // Verify the sign in link exists
    const signInLink = await testDriver.elementExists(By.xpath("//a[contains(@href, '/signin')]"));
    expect(signInLink).to.be.true;
  });

  describe('Sign In Page Tests', function() {
    it('should load the sign in page successfully', async function() {
      await testDriver.navigateTo('/signin');
      await testDriver.waitForPageLoad();
      
      // Verify the page title
      const pageHeading = await testDriver.getElementText(By.css('h1'));
      expect(pageHeading).to.include('Sign In');
      
      // Check for the presence of sign in form elements
      const emailInput = await testDriver.elementExists(By.css('input[type="email"]'));
      expect(emailInput).to.be.true;
      
      const passwordInput = await testDriver.elementExists(By.css('input[type="password"]'));
      expect(passwordInput).to.be.true;
      
      const signInButton = await testDriver.elementExists(By.xpath("//button[contains(text(), 'Sign In')]"));
      expect(signInButton).to.be.true;
    });

    it('should show sign up link and forgot password option', async function() {
      await testDriver.navigateTo('/signin');
      await testDriver.waitForPageLoad();
      
      // Verify sign up link exists
      const signUpLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Sign Up') or contains(text(), 'Create an account')]"));
      expect(signUpLink).to.be.true;
      
      // Verify forgot password link exists
      const forgotPasswordLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Forgot') or contains(text(), 'Reset')]"));
      expect(forgotPasswordLink).to.be.true;
    });

    it('should validate sign in form inputs', async function() {
      await testDriver.navigateTo('/signin');
      await testDriver.waitForPageLoad();
      
      // Try to submit with empty fields
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Sign In')]"));
      
      // Verify validation error messages appear
      const errorMessage = await testDriver.elementExists(By.xpath("//*[contains(text(), 'required') or contains(text(), 'valid')]"));
      expect(errorMessage).to.be.true;
      
      // Enter invalid email and submit
      await testDriver.typeIntoElement(By.css('input[type="email"]'), 'invalid-email');
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Sign In')]"));
      
      // Verify email validation error message appears
      const emailErrorMessage = await testDriver.elementExists(By.xpath("//*[contains(text(), 'valid email')]"));
      expect(emailErrorMessage).to.be.true;
    });
  });

  describe('Sign Up Page Tests', function() {
    it('should load the sign up page successfully', async function() {
      await testDriver.navigateTo('/signup');
      await testDriver.waitForPageLoad();
      
      // Verify the page title
      const pageHeading = await testDriver.getElementText(By.css('h1'));
      expect(pageHeading).to.include('Sign Up') || expect(pageHeading).to.include('Create an account');
      
      // Check for the presence of sign up form elements
      const nameInput = await testDriver.elementExists(By.css('input[name="name"]'));
      expect(nameInput).to.be.true;
      
      const emailInput = await testDriver.elementExists(By.css('input[type="email"]'));
      expect(emailInput).to.be.true;
      
      const passwordInput = await testDriver.elementExists(By.css('input[type="password"]'));
      expect(passwordInput).to.be.true;
      
      const signUpButton = await testDriver.elementExists(By.xpath("//button[contains(text(), 'Sign Up') or contains(text(), 'Create')]"));
      expect(signUpButton).to.be.true;
    });

    it('should show sign in link for existing users', async function() {
      await testDriver.navigateTo('/signup');
      await testDriver.waitForPageLoad();
      
      // Verify sign in link exists
      const signInLink = await testDriver.elementExists(By.xpath("//a[contains(text(), 'Sign In') or contains(text(), 'Already have an account')]"));
      expect(signInLink).to.be.true;
    });

    it('should validate sign up form inputs', async function() {
      await testDriver.navigateTo('/signup');
      await testDriver.waitForPageLoad();
      
      // Try to submit with empty fields
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Sign Up') or contains(text(), 'Create')]"));
      
      // Verify validation error messages appear
      const errorMessage = await testDriver.elementExists(By.xpath("//*[contains(text(), 'required') or contains(text(), 'valid')]"));
      expect(errorMessage).to.be.true;
      
      // Enter invalid email and submit
      await testDriver.typeIntoElement(By.css('input[type="email"]'), 'invalid-email');
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Sign Up') or contains(text(), 'Create')]"));
      
      // Verify email validation error message appears
      const emailErrorMessage = await testDriver.elementExists(By.xpath("//*[contains(text(), 'valid email')]"));
      expect(emailErrorMessage).to.be.true;
      
      // Enter short password and submit
      await testDriver.typeIntoElement(By.css('input[type="password"]'), '123');
      await testDriver.clickElement(By.xpath("//button[contains(text(), 'Sign Up') or contains(text(), 'Create')]"));
      
      // Verify password validation error message appears
      const passwordErrorMessage = await testDriver.elementExists(By.xpath("//*[contains(text(), 'password') and (contains(text(), 'characters') or contains(text(), 'short'))]"));
      expect(passwordErrorMessage).to.be.true;
    });
  });
});