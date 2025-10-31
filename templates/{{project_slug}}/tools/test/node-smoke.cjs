#!/usr/bin/env node
/**
 * Node.js smoke test - basic node functionality verification
 */

const fs = require('fs');
const path = require('path');

function runSmokeTests() {
  console.log('🧪 Running Node.js smoke tests...');

  let passed = 0;
  let failed = 0;

  // Test 1: Check if package.json exists and is valid
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json exists and is valid');
    passed++;
  } catch (error) {
    console.error('❌ package.json test failed:', error.message);
    failed++;
  }

  // Test 2: Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules directory exists');
    passed++;
  } else {
    console.error('❌ node_modules directory not found - run "pnpm install"');
    failed++;
  }

  // Test 3: Check if nx.json exists (for Nx projects)
  if (fs.existsSync('nx.json')) {
    console.log('✅ nx.json exists');
    passed++;
  } else {
    console.log('⚠️  nx.json not found - this is not an Nx project');
  }

  // Test 4: Check if key directories exist
  const keyDirs = ['apps', 'libs', 'tools'];
  for (const dir of keyDirs) {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir}/ directory exists`);
      passed++;
    } else {
      console.log(`⚠️  ${dir}/ directory not found`);
    }
  }

  // Test 5: Check if .github directory exists
  if (fs.existsSync('.github')) {
    console.log('✅ .github directory exists');
    passed++;
  } else {
    console.log('⚠️  .github directory not found');
  }

  // Test 6: Check if docs directory exists
  if (fs.existsSync('docs')) {
    console.log('✅ docs directory exists');
    passed++;
  } else {
    console.log('⚠️  docs directory not found');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Some smoke tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All smoke tests passed');
  }
}

if (require.main === module) {
  runSmokeTests();
}

module.exports = { runSmokeTests };
