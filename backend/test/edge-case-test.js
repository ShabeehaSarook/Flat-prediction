/**
 * Edge Case Testing
 * Tests various edge cases and potential error scenarios
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const results = { passed: 0, failed: 0 };

function log(msg, color = COLORS.reset) {
  console.log(color + msg + COLORS.reset);
}

function logSuccess(msg) {
  log('✓ ' + msg, COLORS.green);
  results.passed++;
}

function logError(msg) {
  log('✗ ' + msg, COLORS.red);
  results.failed++;
}

function logSection(msg) {
  console.log('\n' + '='.repeat(70));
  log(msg, COLORS.cyan);
  console.log('='.repeat(70));
}

// Base valid data
const validData = {
  kitchen_area: 12.0, bath_area: 5.0, other_area: 10.0,
  extra_area: 3.0, extra_area_count: 1, year: 2015,
  ceil_height: 2.7, floor_max: 10, floor: 5,
  total_area: 65.0, bath_count: 1, rooms_count: 2,
  gas: 'Yes', hot_water: 'Yes', central_heating: 'Yes',
  extra_area_type_name: 'balkon', district_name: 'Centralnyj'
};

async function testEdgeCase(name, data, expectSuccess = true) {
  try {
    const response = await axios.post(`${API_URL}/api/predict`, data);
    
    if (expectSuccess) {
      if (response.status === 200 && response.data.status === 'success') {
        logSuccess(`${name}: ${response.data.data.priceInMillions}M RUB`);
      } else {
        logError(`${name}: Unexpected response`);
      }
    } else {
      logError(`${name}: Should have failed but succeeded`);
    }
  } catch (error) {
    if (!expectSuccess) {
      if (error.response && error.response.status === 400) {
        logSuccess(`${name}: Failed as expected (${error.response.status})`);
      } else {
        logError(`${name}: Wrong error type`);
      }
    } else {
      logError(`${name}: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  log('🧪 EDGE CASE TESTING', COLORS.cyan);
  console.log('='.repeat(70));
  
  // Category 1: Extreme Values
  logSection('CATEGORY 1: Extreme Values');
  await testEdgeCase('Very old building (1950)', {...validData, year: 1950});
  await testEdgeCase('Brand new building (2026)', {...validData, year: 2026});
  await testEdgeCase('Tiny apartment (15m²)', {...validData, total_area: 15, kitchen_area: 4, other_area: 2});
  await testEdgeCase('Huge apartment (300m²)', {...validData, total_area: 300, kitchen_area: 30, other_area: 100});
  await testEdgeCase('Zero extra area', {...validData, extra_area: 0, extra_area_count: 0});
  await testEdgeCase('Ground floor', {...validData, floor: 1});
  await testEdgeCase('Top floor (50th)', {...validData, floor: 50, floor_max: 50});
  
  // Category 2: Data Type Variations
  logSection('CATEGORY 2: Data Type Variations');
  await testEdgeCase('String numbers', {...validData, total_area: '65', year: '2015'});
  await testEdgeCase('Integer values', {...validData, total_area: 65, year: 2015});
  await testEdgeCase('Float with decimals', {...validData, total_area: 65.5, kitchen_area: 12.3});
  
  // Category 3: Boolean to String
  logSection('CATEGORY 3: Boolean Values');
  await testEdgeCase('Boolean gas', {...validData, gas: true, hot_water: false});
  
  // Category 4: Different Districts
  logSection('CATEGORY 4: Different Districts');
  await testEdgeCase('District: Centralnyj', {...validData, district_name: 'Centralnyj'});
  await testEdgeCase('District: Severnoe Izmajlovo', {...validData, district_name: 'Severnoe Izmajlovo'});
  await testEdgeCase('District: Ivanovskoe', {...validData, district_name: 'Ivanovskoe'});
  
  // Category 5: Amenity Variations
  logSection('CATEGORY 5: Amenity Variations');
  await testEdgeCase('No gas', {...validData, gas: 'No'});
  await testEdgeCase('No hot water', {...validData, hot_water: 'No'});
  await testEdgeCase('No heating', {...validData, central_heating: 'No'});
  await testEdgeCase('All amenities No', {...validData, gas: 'No', hot_water: 'No', central_heating: 'No'});
  
  // Category 6: Extra Area Types
  logSection('CATEGORY 6: Extra Area Types');
  await testEdgeCase('Balkon', {...validData, extra_area_type_name: 'balkon'});
  await testEdgeCase('Lodzhija', {...validData, extra_area_type_name: 'lodzhija'});
  await testEdgeCase('Net (none)', {...validData, extra_area_type_name: 'net', extra_area: 0});
  
  // Category 7: Boundary Values
  logSection('CATEGORY 7: Boundary Values');
  await testEdgeCase('Low ceiling (2.0m)', {...validData, ceil_height: 2.0});
  await testEdgeCase('High ceiling (4.5m)', {...validData, ceil_height: 4.5});
  await testEdgeCase('Single room', {...validData, rooms_count: 1});
  await testEdgeCase('Many rooms (10)', {...validData, rooms_count: 10});
  await testEdgeCase('Multiple bathrooms (5)', {...validData, bath_count: 5});
  
  // Category 8: Error Cases
  logSection('CATEGORY 8: Error Cases (Should Fail)');
  await testEdgeCase('Empty object', {}, false);
  await testEdgeCase('Missing all features', {total_area: 65}, false);
  await testEdgeCase('Only 5 features', {
    total_area: 65, kitchen_area: 12, year: 2015, 
    district_name: 'Centralnyj', gas: 'Yes'
  }, false);
  
  // Category 9: Null/Undefined Values
  logSection('CATEGORY 9: Null/Undefined Handling');
  await testEdgeCase('Null value', {...validData, kitchen_area: null}, false);
  await testEdgeCase('Undefined value', {...validData, bath_area: undefined}, false);
  
  // Summary
  console.log('\n' + '='.repeat(70));
  log('📊 EDGE CASE TEST SUMMARY', COLORS.cyan);
  console.log('='.repeat(70));
  console.log(`Total: ${results.passed + results.failed}`);
  log(`Passed: ${results.passed}`, COLORS.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? COLORS.red : COLORS.green);
  
  const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);
  
  if (results.failed === 0) {
    log('\n🎉 ALL EDGE CASES PASSED!', COLORS.green);
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, COLORS.yellow);
  }
  
  console.log('='.repeat(70) + '\n');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
