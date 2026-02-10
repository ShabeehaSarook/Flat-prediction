/**
 * Test Script for Node.js Backend
 * 
 * Tests the Node.js backend and its connection to Flask API
 */

const axios = require('axios');

// Configuration
const NODE_API_URL = 'http://localhost:3000';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper functions
function log(message, color = COLORS.reset) {
  console.log(color + message + COLORS.reset);
}

function logSuccess(message) {
  log('✓ ' + message, COLORS.green);
  results.passed++;
  results.total++;
}

function logError(message) {
  log('✗ ' + message, COLORS.red);
  results.failed++;
  results.total++;
}

function logSection(message) {
  console.log('\n' + '='.repeat(70));
  log(message, COLORS.cyan);
  console.log('='.repeat(70));
}

// Test functions
async function testNodeHealth() {
  logSection('TEST 1: Node.js Backend Health Check');
  try {
    const response = await axios.get(`${NODE_API_URL}/api/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      logSuccess('Node.js backend is healthy');
      console.log(`  Service: ${response.data.service}`);
      console.log(`  Uptime: ${Math.round(response.data.uptime)}s`);
      console.log(`  Memory: ${response.data.memory.used}`);
    } else {
      logError('Node.js backend health check failed');
    }
  } catch (error) {
    logError(`Node.js backend is not responding: ${error.message}`);
    log('  Make sure to start the server: npm start', COLORS.yellow);
  }
}

async function testFlaskHealth() {
  logSection('TEST 2: Flask API Health Check (via Node.js)');
  try {
    const response = await axios.get(`${NODE_API_URL}/api/health/flask`);
    
    if (response.data.status === 'success') {
      logSuccess('Flask API is healthy');
      console.log(`  URL: ${response.data.flask.url}`);
      console.log(`  Status: ${response.data.flask.status}`);
    } else {
      logError('Flask API is not responding');
      console.log(`  Error: ${response.data.flask.error}`);
      log('  Make sure Flask API is running: python backend/app.py', COLORS.yellow);
    }
  } catch (error) {
    if (error.response && error.response.status === 503) {
      logError('Flask API is not responding');
      log('  Make sure Flask API is running: python backend/app.py', COLORS.yellow);
    } else {
      logError(`Flask health check failed: ${error.message}`);
    }
  }
}

async function testGetFeatures() {
  logSection('TEST 3: Get Required Features');
  try {
    const response = await axios.get(`${NODE_API_URL}/api/predict/features`);
    
    if (response.status === 200 && response.data.status === 'success') {
      logSuccess('Retrieved required features');
      console.log(`  Total features: ${response.data.totalFeatures}`);
      console.log(`  Numerical: ${response.data.categories.numerical}`);
      console.log(`  Categorical: ${response.data.categories.categorical}`);
    } else {
      logError('Failed to retrieve features');
    }
  } catch (error) {
    logError(`Get features failed: ${error.message}`);
  }
}

async function testGetExample() {
  logSection('TEST 4: Get Example Data');
  try {
    const response = await axios.get(`${NODE_API_URL}/api/predict/example`);
    
    if (response.status === 200 && response.data.example) {
      logSuccess('Retrieved example data');
      console.log(`  Sample property: ${response.data.example.total_area}m², ${response.data.example.rooms_count} rooms`);
    } else {
      logError('Failed to retrieve example');
    }
  } catch (error) {
    logError(`Get example failed: ${error.message}`);
  }
}

async function testValidation() {
  logSection('TEST 5: Input Validation');
  try {
    const incompleteData = {
      total_area: 65.0,
      kitchen_area: 12.0
    };
    
    const response = await axios.post(
      `${NODE_API_URL}/api/predict/validate`,
      incompleteData
    );
    
    logError('Validation should have failed but passed');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Validation correctly detected missing features');
      const missing = error.response.data.missingFeatures;
      console.log(`  Missing features: ${missing ? missing.length : 0}`);
    } else {
      logError(`Validation test failed: ${error.message}`);
    }
  }
}

async function testPrediction() {
  logSection('TEST 6: Make Prediction');
  try {
    const propertyData = {
      kitchen_area: 12.0,
      bath_area: 5.0,
      other_area: 10.0,
      extra_area: 3.0,
      extra_area_count: 1,
      year: 2015,
      ceil_height: 2.7,
      floor_max: 10,
      floor: 5,
      total_area: 65.0,
      bath_count: 1,
      rooms_count: 2,
      gas: 'Yes',
      hot_water: 'Yes',
      central_heating: 'Yes',
      extra_area_type_name: 'balkon',
      district_name: 'Centralnyj'
    };
    
    const response = await axios.post(
      `${NODE_API_URL}/api/predict`,
      propertyData
    );
    
    if (response.status === 200 && response.data.status === 'success') {
      logSuccess('Prediction successful');
      console.log(`  Predicted price: ${response.data.data.priceFormatted}`);
      console.log(`  Price in millions: ${response.data.data.priceInMillions}M RUB`);
      console.log(`  Response time: ${response.data.metadata.responseTime}`);
    } else {
      logError('Prediction failed');
    }
  } catch (error) {
    if (error.response) {
      logError(`Prediction failed: ${error.response.data.message || error.message}`);
      if (error.response.data.suggestion) {
        log(`  Suggestion: ${error.response.data.suggestion}`, COLORS.yellow);
      }
    } else {
      logError(`Prediction request failed: ${error.message}`);
    }
  }
}

async function testMultiplePredictions() {
  logSection('TEST 7: Multiple Predictions (Performance)');
  
  const properties = [
    { total_area: 50, rooms_count: 1 },
    { total_area: 65, rooms_count: 2 },
    { total_area: 90, rooms_count: 3 }
  ];
  
  const baseData = {
    kitchen_area: 12.0,
    bath_area: 5.0,
    other_area: 10.0,
    extra_area: 3.0,
    extra_area_count: 1,
    year: 2015,
    ceil_height: 2.7,
    floor_max: 10,
    floor: 5,
    bath_count: 1,
    gas: 'Yes',
    hot_water: 'Yes',
    central_heating: 'Yes',
    extra_area_type_name: 'balkon',
    district_name: 'Centralnyj'
  };
  
  const times = [];
  let successCount = 0;
  
  for (let i = 0; i < properties.length; i++) {
    try {
      const propertyData = { ...baseData, ...properties[i] };
      const start = Date.now();
      
      const response = await axios.post(
        `${NODE_API_URL}/api/predict`,
        propertyData
      );
      
      const elapsed = Date.now() - start;
      times.push(elapsed);
      
      if (response.status === 200) {
        successCount++;
        console.log(`  Property ${i + 1}: ${response.data.data.priceInMillions}M RUB (${elapsed}ms)`);
      }
    } catch (error) {
      console.log(`  Property ${i + 1}: Failed`);
    }
  }
  
  if (successCount === properties.length) {
    logSuccess(`All ${properties.length} predictions successful`);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
  } else {
    logError(`Only ${successCount}/${properties.length} predictions successful`);
  }
}

async function testRootEndpoint() {
  logSection('TEST 8: Root Endpoint');
  try {
    const response = await axios.get(`${NODE_API_URL}/`);
    
    if (response.status === 200 && response.data.status === 'success') {
      logSuccess('Root endpoint working');
      console.log(`  Service: ${response.data.message}`);
      console.log(`  Version: ${response.data.version}`);
    } else {
      logError('Root endpoint failed');
    }
  } catch (error) {
    logError(`Root endpoint failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(70));
  log('🧪 NODE.JS BACKEND TEST SUITE', COLORS.cyan);
  console.log('='.repeat(70));
  log(`Testing Node.js API at: ${NODE_API_URL}`, COLORS.yellow);
  console.log('');
  
  // Run all tests
  await testRootEndpoint();
  await testNodeHealth();
  await testFlaskHealth();
  await testGetFeatures();
  await testGetExample();
  await testValidation();
  await testPrediction();
  await testMultiplePredictions();
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  log('📊 TEST SUMMARY', COLORS.cyan);
  console.log('='.repeat(70));
  console.log(`Total tests: ${results.total}`);
  log(`Passed: ${results.passed}`, COLORS.green);
  if (results.failed > 0) {
    log(`Failed: ${results.failed}`, COLORS.red);
  } else {
    log(`Failed: ${results.failed}`, COLORS.green);
  }
  
  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Pass rate: ${passRate}%`);
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED!', COLORS.green);
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, COLORS.yellow);
  }
  
  console.log('='.repeat(70) + '\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
