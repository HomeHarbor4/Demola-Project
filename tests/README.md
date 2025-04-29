# HomeHarbor Test Suite

This directory contains automated tests for the HomeHarbor real estate platform application.

## Test Structure

The test suite is organized as follows:

- `selenium/` - Contains Selenium-based end-to-end tests
  - `page-tests/` - Contains test files for individual pages and features
  - `test-driver.js` - Utility class for managing Selenium WebDriver
  - `run-all-tests.js` - Script to run all tests sequentially
  - `test-runner.js` - More versatile test runner with options
  - `generate-report.js` - Creates HTML report from test results
  - `results/` - Directory for storing test results
  - `reports/` - Directory for storing HTML reports

## Running Tests

### Prerequisites

1. Ensure the application is running (`npm run dev`)
2. Make sure you have Chrome or Chromium browser installed

### Running All Tests

```bash
node tests/selenium/test-runner.js
```

### Running with Report Generation

To run all tests and generate an HTML report:

```bash
node tests/selenium/test-runner.js --report
```

### Running Specific Tests

To run tests for a specific page or feature:

```bash
node tests/selenium/test-runner.js blog    # Run only blog.test.js
node tests/selenium/test-runner.js mortgage # Run only mortgage.test.js
```

### Command Line Options

The test runner supports the following options:

- `--report` - Generate HTML report after tests complete
- `--help` - Show help message with usage instructions

## Available Test Suites

1. **Home Page Tests**: `home.test.js`
   - Tests homepage layout, navigation, featured properties, and popular locations

2. **Property Listings Tests**: `property-listings.test.js`
   - Tests property listings, filtering, map view toggling, pagination

3. **Static Pages Tests**: `static-pages.test.js`
   - Tests Terms of Service, Privacy Policy, FAQ, and Careers pages

4. **Blog Tests**: `blog.test.js`
   - Tests blog functionality, categories, and newsletter signup

5. **Profile and Properties Tests**: `profile-properties.test.js`
   - Tests user profile, authentication, and property management

6. **Mortgage Calculator Tests**: `mortgage.test.js`
   - Tests mortgage calculator functionality and visualization

7. **Advanced Search Tests**: `search-test.test.js`
   - Tests property search with various filters and parameters

8. **Agents Tests**: `agents.test.js`
   - Tests agent listings, filtering, and contact functionality

9. **Error Pages Tests**: `error-pages.test.js`
   - Tests 404 page, error handling, and empty search results

## Test Reports

After running tests with the `--report` option, an HTML report will be generated in the `selenium/reports/` directory. This report includes:

- Overall test summary with pass/fail statistics
- Detailed results for each test suite
- Duration and timestamps for each test
- Error messages for failed tests

## Writing New Tests

To create new tests:

1. Create a new file in `selenium/page-tests/` with the `.test.js` extension
2. Use the TestDriver utility for browser interactions
3. Add appropriate assertions using Chai's `expect` syntax

## Test Driver API

The `TestDriver` class provides the following methods:

- `start()` - Starts a new browser session
- `stop()` - Ends the browser session
- `navigateTo(path)` - Navigates to a specific route
- `waitForElement(locator, timeout)` - Waits for an element to appear
- `findElement(locator)` - Finds a single element
- `findElements(locator)` - Finds multiple elements
- `getElementText(locator)` - Gets text content of an element
- `elementExists(locator)` - Checks if an element exists
- `clickElement(locator)` - Clicks an element
- `typeIntoElement(locator, text)` - Types text into an input
- `getPageTitle()` - Gets the current page title
- `getPageUrl()` - Gets the current page URL
- `scrollToElement(locator)` - Scrolls to make an element visible
- `waitForPageLoad()` - Waits for page to fully load
- `takeScreenshot()` - Takes a screenshot for debugging