const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import report generator
const reportGenerator = require('./generate-report');

// Usage instructions
function printUsage() {
  console.log('');
  console.log('HomeHarbor Selenium Test Runner');
  console.log('==============================');
  console.log('');
  console.log('Usage:');
  console.log('  node test-runner.js [options] [test-name]');
  console.log('');
  console.log('Parameters:');
  console.log('  test-name   Optional. Name of specific test file to run (without extension)');
  console.log('              If not provided, all tests will be run');
  console.log('');
  console.log('Options:');
  console.log('  --report    Generate HTML report after tests complete');
  console.log('  --help      Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node test-runner.js             # Run all tests');
  console.log('  node test-runner.js blog        # Run only blog.test.js');
  console.log('  node test-runner.js --report    # Run all tests and generate a report');
  console.log('');
}

// Process command line arguments
const args = process.argv.slice(2);
const options = {
  generateReport: args.includes('--report'),
  showHelp: args.includes('--help')
};

// Show help if requested
if (options.showHelp) {
  printUsage();
  process.exit(0);
}

// Filter out option flags to get the test name
const nonOptionArgs = args.filter(arg => !arg.startsWith('--'));
const specificTest = nonOptionArgs.length > 0 ? nonOptionArgs[0] : null;

// Find all test files
const testDir = path.join(__dirname, 'page-tests');
const allTestFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));

// Determine which tests to run based on command line args
let testFiles = allTestFiles;

if (specificTest) {
  const matchingTest = allTestFiles.find(file => file === `${specificTest}.test.js` || file.includes(specificTest));
  if (matchingTest) {
    testFiles = [matchingTest];
  } else {
    console.log(`Error: Test file matching "${specificTest}" not found.`);
    printUsage();
    process.exit(1);
  }
}

// Results storage
const testResults = {
  suites: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: new Date(),
    endTime: null,
    duration: 0
  }
};

// Results directory
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('HomeHarbor Selenium Tests');
console.log('=========================');
console.log(`Found ${testFiles.length} test file(s) to run: ${testFiles.join(', ')}`);
console.log('-----------------------------------------');

// Make sure the application is running
console.log('Ensure the application is running on http://localhost:3000 before proceeding');
console.log('Waiting 5 seconds before starting tests...');

setTimeout(() => {
  runTests();
}, 5000);

function runTests() {
  let currentTestIndex = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  function runNextTest() {
    if (currentTestIndex >= testFiles.length) {
      // Update summary
      testResults.summary.passed = passedTests;
      testResults.summary.failed = failedTests;
      testResults.summary.total = passedTests + failedTests;
      testResults.summary.endTime = new Date();
      testResults.summary.duration = 
        testResults.summary.endTime.getTime() - testResults.summary.startTime.getTime();
      
      console.log('=========================');
      console.log('All tests completed!');
      console.log(`Results: ${passedTests} passed, ${failedTests} failed`);
      
      // Save results to file
      const resultsPath = path.join(resultsDir, `results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
      fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
      console.log(`Test results saved to: ${resultsPath}`);
      
      // Generate report if requested
      if (options.generateReport) {
        console.log('Generating HTML report...');
        const reportPath = reportGenerator.generateReport();
        if (reportPath) {
          console.log(`Report generated: ${reportPath}`);
        }
      }
      
      return;
    }
    
    const testFile = testFiles[currentTestIndex];
    const testFilePath = path.join(testDir, testFile);
    const suiteName = testFile.replace('.test.js', '');
    
    console.log(`[${currentTestIndex + 1}/${testFiles.length}] Running: ${testFile}`);
    
    // Initialize suite results
    testResults.suites[suiteName] = {
      name: suiteName,
      file: testFile,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      tests: [],
      passed: 0,
      failed: 0
    };
    
    // Run with Mocha
    const mochaProcess = spawn('npx', ['mocha', testFilePath, '--timeout', '30000', '--reporter', 'json'], {
      stdio: ['inherit', 'pipe', 'inherit']
    });
    
    let output = '';
    mochaProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mochaProcess.on('close', (code) => {
      const endTime = new Date();
      testResults.suites[suiteName].endTime = endTime;
      testResults.suites[suiteName].duration = 
        endTime.getTime() - testResults.suites[suiteName].startTime.getTime();
      
      // Try to parse Mocha JSON output
      try {
        const jsonResult = JSON.parse(output);
        
        if (jsonResult.tests && Array.isArray(jsonResult.tests)) {
          jsonResult.tests.forEach(test => {
            const testResult = {
              title: test.title,
              fullTitle: test.fullTitle,
              duration: test.duration,
              passed: test.state === 'passed',
              error: test.err ? test.err.message : null
            };
            
            testResults.suites[suiteName].tests.push(testResult);
            
            if (testResult.passed) {
              testResults.suites[suiteName].passed++;
            } else {
              testResults.suites[suiteName].failed++;
            }
          });
        }
      } catch (e) {
        // If JSON parsing fails, just record basic pass/fail
        if (code === 0) {
          testResults.suites[suiteName].passed++;
        } else {
          testResults.suites[suiteName].failed++;
        }
      }
      
      if (code === 0) {
        console.log(`✓ Test ${testFile} passed`);
        passedTests++;
      } else {
        console.log(`✗ Test ${testFile} failed with exit code: ${code}`);
        failedTests++;
      }
      console.log('-----------------------------------------');
      
      currentTestIndex++;
      runNextTest();
    });
  }
  
  runNextTest();
}

// Print usage if no arguments and it's the main script
if (require.main === module && args.length === 0) {
  printUsage();
}