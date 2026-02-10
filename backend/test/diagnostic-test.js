/**
 * Comprehensive Diagnostic Test
 * 
 * Tests all aspects of the backend system and identifies any errors
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const NODE_API_URL = 'http://localhost:3000';
const FLASK_API_URL = 'http://127.0.0.1:5000';

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Diagnostic results
const diagnostics = {
  errors: [],
  warnings: [],
  info: [],
  tests: { passed: 0, failed: 0 }
};

function log(message, color = COLORS.reset) {
  console.log(color + message + COLORS.reset);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, COLORS.cyan + COLORS.bright);
  console.log('='.repeat(70));
}

function logError(message, details = null) {
  log('✗ ERROR: ' + message, COLORS.red);
  diagnostics.errors.push({ message, details });
  diagnostics.tests.failed++;
  if (details) {
    console.log('  Details:', details);
  }
}

function logWarning(message) {
  log('⚠ WARNING: ' + message, COLORS.yellow);
  diagnostics.warnings.push(message);
}

function logSuccess(message) {
  log('✓ ' + message, COLORS.green);
  diagnostics.tests.passed++;
}

function logInfo(message) {
  console.log('  ' + message);
  diagnostics.info.push(message);
}

// ============================================================================
// DIAGNOSTIC 1: Check File Structure
// ============================================================================
async function checkFileStructure() {
  logSection('DIAGNOSTIC 1: File Structure Check');
  
  const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'routes/health.routes.js',
    'routes/prediction.routes.js',
    'services/flask-api.service.js',
    'middleware/validation.middleware.js',
    'config/features.config.js'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      logSuccess(`File exists: ${file}`);
    } else {
      logError(`File missing: ${file}`);
    }
  }
}

// ============================================================================
// DIAGNOSTIC 2: Check Dependencies
// ============================================================================
async function checkDependencies() {
  logSection('DIAGNOSTIC 2: Dependencies Check');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = ['express', 'cors', 'axios', 'dotenv', 'helmet', 'morgan'];
    
    logInfo('Checking required dependencies...');
    for (const dep of requiredDeps) {
      if (packageJson.dependencies[dep]) {
        logSuccess(`${dep}: ${packageJson.dependencies[dep]}`);
      } else {
        logError(`Missing dependency: ${dep}`);
      }
    }
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      logSuccess('node_modules directory exists');
    } else {
      logError('node_modules missing - run: npm install');
    }
  } catch (error) {
    logError('Cannot read package.json', error.message);
  }
}

// ============================================================================
// DIAGNOSTIC 3: Check Configuration
// ============================================================================
async function checkConfiguration() {
  logSection('DIAGNOSTIC 3: Configuration Check');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    if (fs.existsSync(envPath)) {
      logSuccess('.env file exists');
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = ['PORT', 'FLASK_API_URL', 'NODE_ENV'];
      
      for (const varName of requiredVars) {
        if (envContent.includes(varName)) {
          const match = envContent.match(new RegExp(`${varName}=(.*)`));
          if (match) {
            logSuccess(`${varName} = ${match[1]}`);
          }
        } else {
          logWarning(`${varName} not configured in .env`);
        }
      }
    } else {
      logError('.env file missing');
    }
  } catch (error) {
    logError('Cannot read .env file', error.message);
  }
}

// ============================================================================
// DIAGNOSTIC 4: Test Flask API Directly
// ============================================================================
async function testFlaskAPIDirect() {
  logSection('DIAGNOSTIC 4: Flask API Direct Test');
  
  try {
    logInfo('Testing Flask API health...');
    const response = await axios.get(FLASK_API_URL, { timeout: 5000 });
    
    if (response.status === 200) {
      logSuccess('Flask API is responding');
      logInfo(`Response: ${response.data}`);
    } else {
      logError(`Flask API returned status ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Flask API is not running', 'Connection refused');
      logInfo('Start Flask API with: python backend_flask_api.py');
    } else if (error.code === 'ETIMEDOUT') {
      logError('Flask API timeout', 'Request timed out');
    } else {
      logError('Flask API error', error.message);
    }
  }
  
  // Test Flask prediction endpoint
  try {
    logInfo('Testing Flask API prediction endpoint...');
    const testData = {
      kitchen_area: 12.0, bath_area: 5.0, other_area: 10.0,
      extra_area: 3.0, extra_area_count: 1, year: 2015,
      ceil_height: 2.7, floor_max: 10, floor: 5,
      total_area: 65.0, bath_count: 1, rooms_count: 2,
      gas: 'Yes', hot_water: 'Yes', central_heating: 'Yes',
      extra_area_type_name: 'balkon', district_name: 'Centralnyj'
    };
    
    const response = await axios.post(FLASK_API_URL + '/predict', testData, { timeout: 10000 });
    
    if (response.status === 200 && response.data.predicted_price) {
      logSuccess('Flask API prediction working');
      logInfo(`Predicted price: ${(response.data.predicted_price / 1_000_000).toFixed(2)}M RUB`);
    } else {
      logError('Flask API prediction returned unexpected response');
    }
  } catch (error) {
    logError('Flask API prediction failed', error.message);
  }
}

// ============================================================================
// DIAGNOSTIC 5: Test Node.js Backend
// ============================================================================
async function testNodeBackend() {
  logSection('DIAGNOSTIC 5: Node.js Backend Test');
  
  try {
    logInfo('Testing Node.js backend health...');
    const response = await axios.get(NODE_API_URL + '/api/health', { timeout: 5000 });
    
    if (response.status === 200 && response.data.status === 'healthy') {
      logSuccess('Node.js backend is healthy');
      logInfo(`Uptime: ${Math.round(response.data.uptime)}s`);
      logInfo(`Memory: ${response.data.memory.used}`);
    } else {
      logError('Node.js backend health check failed');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Node.js backend is not running', 'Connection refused');
      logInfo('Start Node.js backend with: cd backend && npm start');
    } else {
      logError('Node.js backend error', error.message);
    }
  }
}

// ============================================================================
// DIAGNOSTIC 6: Test Flask Connection via Node.js
// ============================================================================
async function testFlaskViaNode() {
  logSection('DIAGNOSTIC 6: Flask Connection via Node.js');
  
  try {
    logInfo('Testing Flask health check via Node.js...');
    const response = await axios.get(NODE_API_URL + '/api/health/flask', { timeout: 10000 });
    
    if (response.data.status === 'success') {
      logSuccess('Node.js can connect to Flask API');
      logInfo(`Flask URL: ${response.data.flask.url}`);
    } else {
      logError('Node.js cannot connect to Flask API', response.data.flask.error);
    }
  } catch (error) {
    logError('Flask health check via Node.js failed', error.message);
  }
}

// ============================================================================
// DIAGNOSTIC 7: Test Prediction via Node.js
// ============================================================================
async function testPredictionViaNode() {
  logSection('DIAGNOSTIC 7: Prediction Test via Node.js');
  
  const testData = {
    kitchen_area: 12.0, bath_area: 5.0, other_area: 10.0,
    extra_area: 3.0, extra_area_count: 1, year: 2015,
    ceil_height: 2.7, floor_max: 10, floor: 5,
    total_area: 65.0, bath_count: 1, rooms_count: 2,
    gas: 'Yes', hot_water: 'Yes', central_heating: 'Yes',
    extra_area_type_name: 'balkon', district_name: 'Centralnyj'
  };
  
  try {
    logInfo('Making prediction via Node.js backend...');
    const startTime = Date.now();
    const response = await axios.post(NODE_API_URL + '/api/predict', testData, { timeout: 15000 });
    const elapsed = Date.now() - startTime;
    
    if (response.status === 200 && response.data.status === 'success') {
      logSuccess('Prediction successful');
      logInfo(`Price: ${response.data.data.priceFormatted}`);
      logInfo(`Response time: ${elapsed}ms`);
      
      // Validate response structure
      if (response.data.data.predictedPrice && 
          response.data.data.priceInMillions && 
          response.data.metadata) {
        logSuccess('Response structure is correct');
      } else {
        logWarning('Response structure may be incomplete');
      }
    } else {
      logError('Prediction returned unexpected response');
    }
  } catch (error) {
    if (error.response) {
      logError(`Prediction failed with status ${error.response.status}`, error.response.data.message);
    } else {
      logError('Prediction request failed', error.message);
    }
  }
}

// ============================================================================
// DIAGNOSTIC 8: Test Error Handling
// ============================================================================
async function testErrorHandling() {
  logSection('DIAGNOSTIC 8: Error Handling Test');
  
  // Test 1: Missing features
  try {
    logInfo('Testing missing features error handling...');
    const incompleteData = { total_area: 65.0, kitchen_area: 12.0 };
    
    await axios.post(NODE_API_URL + '/api/predict', incompleteData);
    logError('Should have failed with missing features but succeeded');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Missing features error handled correctly');
      logInfo(`Missing features detected: ${error.response.data.missingFeatures?.length || 'unknown'}`);
    } else {
      logError('Unexpected error response', error.message);
    }
  }
  
  // Test 2: Invalid endpoint
  try {
    logInfo('Testing 404 error handling...');
    await axios.get(NODE_API_URL + '/invalid/endpoint');
    logError('Should have returned 404 but succeeded');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logSuccess('404 error handled correctly');
    } else {
      logError('Unexpected 404 response', error.message);
    }
  }
}

// ============================================================================
// DIAGNOSTIC 9: Code Quality Check
// ============================================================================
async function checkCodeQuality() {
  logSection('DIAGNOSTIC 9: Code Quality Check');
  
  try {
    // Check server.js for common issues
    const serverPath = path.join(__dirname, '..', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Check for require statements
    if (serverContent.includes("require('dotenv')")) {
      logSuccess('Environment variables loaded');
    } else {
      logWarning('dotenv not loaded in server.js');
    }
    
    // Check for error handlers
    if (serverContent.includes('app.use((err, req, res, next)')) {
      logSuccess('Global error handler present');
    } else {
      logWarning('No global error handler found');
    }
    
    // Check for CORS
    if (serverContent.includes('cors')) {
      logSuccess('CORS configured');
    } else {
      logWarning('CORS not configured');
    }
    
    // Check for graceful shutdown
    if (serverContent.includes('SIGTERM') || serverContent.includes('SIGINT')) {
      logSuccess('Graceful shutdown handlers present');
    } else {
      logWarning('No graceful shutdown handlers');
    }
  } catch (error) {
    logError('Code quality check failed', error.message);
  }
}

// ============================================================================
// Main Diagnostic Runner
// ============================================================================
async function runDiagnostics() {
  console.log('\n' + '='.repeat(70));
  log('🔍 COMPREHENSIVE DIAGNOSTIC TEST', COLORS.magenta + COLORS.bright);
  console.log('='.repeat(70));
  log('Analyzing Node.js backend and Flask API integration...', COLORS.yellow);
  console.log('');
  
  // Run all diagnostics
  await checkFileStructure();
  await checkDependencies();
  await checkConfiguration();
  await testFlaskAPIDirect();
  await testNodeBackend();
  await testFlaskViaNode();
  await testPredictionViaNode();
  await testErrorHandling();
  await checkCodeQuality();
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  log('📊 DIAGNOSTIC SUMMARY', COLORS.cyan + COLORS.bright);
  console.log('='.repeat(70));
  
  console.log(`\nTests Run: ${diagnostics.tests.passed + diagnostics.tests.failed}`);
  log(`Passed: ${diagnostics.tests.passed}`, COLORS.green);
  log(`Failed: ${diagnostics.tests.failed}`, diagnostics.tests.failed > 0 ? COLORS.red : COLORS.green);
  log(`Warnings: ${diagnostics.warnings.length}`, diagnostics.warnings.length > 0 ? COLORS.yellow : COLORS.green);
  
  if (diagnostics.errors.length > 0) {
    console.log('\n' + '─'.repeat(70));
    log('❌ ERRORS FOUND:', COLORS.red + COLORS.bright);
    console.log('─'.repeat(70));
    diagnostics.errors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.message}`);
      if (error.details) {
        console.log(`   Details: ${error.details}`);
      }
    });
  }
  
  if (diagnostics.warnings.length > 0) {
    console.log('\n' + '─'.repeat(70));
    log('⚠️  WARNINGS:', COLORS.yellow + COLORS.bright);
    console.log('─'.repeat(70));
    diagnostics.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  
  if (diagnostics.errors.length === 0) {
    log('✅ NO ERRORS FOUND - SYSTEM IS OPERATIONAL!', COLORS.green + COLORS.bright);
  } else {
    log('❌ ERRORS DETECTED - REVIEW ABOVE FOR DETAILS', COLORS.red + COLORS.bright);
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Exit code
  process.exit(diagnostics.errors.length > 0 ? 1 : 0);
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(error => {
    console.error('Diagnostic test error:', error);
    process.exit(1);
  });
}

module.exports = { runDiagnostics };
