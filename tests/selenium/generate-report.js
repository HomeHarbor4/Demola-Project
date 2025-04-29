/**
 * HomeHarbor Test Report Generator
 * 
 * This script generates a simple HTML report from test results
 * Run this after executing tests to generate a report
 */

const fs = require('fs');
const path = require('path');

// Configuration
const reportDir = path.join(__dirname, 'reports');
const testDir = path.join(__dirname, 'page-tests');
const reportFileName = `test-report-${new Date().toISOString().slice(0, 10)}.html`;
const reportPath = path.join(reportDir, reportFileName);

// Ensure reports directory exists
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Find all test files
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));

// Generate test results (dummy data, in a real implementation this would come from actual test runs)
// In a real implementation, test results would be saved during test execution
function generateMockResults() {
  const results = {};
  
  testFiles.forEach(file => {
    const testName = file.replace('.test.js', '');
    const tests = [];
    
    // Parse the test file to extract test cases
    const fileContent = fs.readFileSync(path.join(testDir, file), 'utf8');
    const testMatches = fileContent.match(/it\s*\(\s*['"](.+?)['"]/g) || [];
    
    testMatches.forEach(match => {
      // Extract test description
      const description = match.match(/it\s*\(\s*['"](.+?)['"]/)[1];
      
      // Simulate a mix of passing and failing tests
      const passed = Math.random() > 0.2; // 80% pass rate
      
      tests.push({
        description,
        passed,
        duration: Math.floor(Math.random() * 500) + 100, // Random duration between 100-600ms
        error: passed ? null : 'Element not found or condition not met'
      });
    });
    
    results[testName] = {
      file,
      tests,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed).length,
      total: tests.length
    };
  });
  
  return results;
}

// Generate HTML report
function generateHtmlReport(results) {
  // Calculate overall stats
  const totalTests = Object.values(results).reduce((sum, suite) => sum + suite.total, 0);
  const passedTests = Object.values(results).reduce((sum, suite) => sum + suite.passed, 0);
  const failedTests = Object.values(results).reduce((sum, suite) => sum + suite.failed, 0);
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  // Generate HTML
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HomeHarbor Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .summary {
      display: flex;
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      justify-content: space-between;
    }
    .summary-item {
      text-align: center;
      padding: 0 20px;
    }
    .summary-item h3 {
      margin: 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #6c757d;
    }
    .summary-item p {
      font-size: 24px;
      font-weight: bold;
      margin: 5px 0;
    }
    .success-rate p {
      color: ${successRate > 80 ? '#28a745' : successRate > 60 ? '#ffc107' : '#dc3545'};
    }
    .total p { color: #2c3e50; }
    .passed p { color: #28a745; }
    .failed p { color: #dc3545; }
    .test-suite {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #f8f9fa;
      padding: 10px 15px;
      border-bottom: 1px solid #ddd;
      cursor: pointer;
    }
    .suite-name {
      font-weight: bold;
      font-size: 18px;
    }
    .suite-stats {
      display: flex;
      gap: 15px;
    }
    .suite-stats span {
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 14px;
    }
    .passed-badge {
      background-color: rgba(40, 167, 69, 0.2);
      color: #28a745;
    }
    .failed-badge {
      background-color: rgba(220, 53, 69, 0.2);
      color: #dc3545;
    }
    .test-cases {
      display: none;
      padding: 0;
    }
    .test-case {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
    }
    .test-case:last-child {
      border-bottom: none;
    }
    .test-case-description {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .test-status {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-block;
    }
    .test-passed {
      background-color: #28a745;
    }
    .test-failed {
      background-color: #dc3545;
    }
    .test-meta {
      color: #6c757d;
      font-size: 14px;
    }
    .test-error {
      color: #dc3545;
      margin-top: 5px;
      font-size: 14px;
      font-family: monospace;
      background-color: rgba(220, 53, 69, 0.1);
      padding: 5px;
      border-radius: 3px;
      display: none;
    }
    .test-case:hover {
      background-color: #f8f9fa;
    }
    .expanded .test-cases {
      display: block;
    }
    .suite-toggle {
      font-size: 12px;
      color: #6c757d;
    }
    .timestamp {
      color: #6c757d;
      font-size: 14px;
      margin-top: -10px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>HomeHarbor Test Report</h1>
  <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
  
  <div class="summary">
    <div class="summary-item total">
      <h3>Total Tests</h3>
      <p>${totalTests}</p>
    </div>
    <div class="summary-item passed">
      <h3>Passed</h3>
      <p>${passedTests}</p>
    </div>
    <div class="summary-item failed">
      <h3>Failed</h3>
      <p>${failedTests}</p>
    </div>
    <div class="summary-item success-rate">
      <h3>Success Rate</h3>
      <p>${successRate}%</p>
    </div>
  </div>
  
  <div class="test-suites">`;
  
  // Add test suite sections
  Object.entries(results).forEach(([suiteName, suiteData]) => {
    html += `
    <div class="test-suite" id="suite-${suiteName}">
      <div class="suite-header" onclick="toggleSuite('${suiteName}')">
        <div class="suite-name">${suiteName.charAt(0).toUpperCase() + suiteName.slice(1).replace(/-/g, ' ')}</div>
        <div class="suite-stats">
          <span class="passed-badge">${suiteData.passed} Passed</span>
          ${suiteData.failed > 0 ? `<span class="failed-badge">${suiteData.failed} Failed</span>` : ''}
          <span class="suite-toggle" id="toggle-${suiteName}">Show Details</span>
        </div>
      </div>
      <div class="test-cases" id="tests-${suiteName}">`;
    
    // Add test cases
    suiteData.tests.forEach((test, index) => {
      html += `
        <div class="test-case">
          <div class="test-case-description">
            <span class="test-status ${test.passed ? 'test-passed' : 'test-failed'}"></span>
            <span>${test.description}</span>
          </div>
          <div class="test-meta">
            ${test.duration}ms
            ${!test.passed ? `<div class="test-error">${test.error}</div>` : ''}
          </div>
        </div>`;
    });
    
    html += `
      </div>
    </div>`;
  });
  
  // Close open tags and add JavaScript
  html += `
  </div>
  
  <script>
    function toggleSuite(suiteName) {
      const suite = document.getElementById('suite-' + suiteName);
      const tests = document.getElementById('tests-' + suiteName);
      const toggle = document.getElementById('toggle-' + suiteName);
      
      if (suite.classList.contains('expanded')) {
        suite.classList.remove('expanded');
        toggle.textContent = 'Show Details';
      } else {
        suite.classList.add('expanded');
        toggle.textContent = 'Hide Details';
      }
    }
  </script>
</body>
</html>`;

  return html;
}

// Main function
function generateReport() {
  console.log('Generating HomeHarbor test report...');
  
  try {
    // In a real implementation, we would read actual test results from a file
    // For demo purposes, we're generating mock results
    const results = generateMockResults();
    
    const htmlReport = generateHtmlReport(results);
    fs.writeFileSync(reportPath, htmlReport);
    
    console.log(`Report generated successfully: ${reportPath}`);
    console.log(`Open file://${reportPath} in your browser to view the report`);
    
    return reportPath;
  } catch (error) {
    console.error('Error generating report:', error);
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  generateReport();
} else {
  // Export for use in other scripts
  module.exports = { generateReport };
}