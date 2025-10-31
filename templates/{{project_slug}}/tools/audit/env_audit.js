#!/usr/bin/env node
/**
 * Environment audit tool - checks development environment setup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runCommand(cmd) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function auditEnvironment() {
  console.log('🔍 Auditing development environment...');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Check Node.js version
  const nodeResult = runCommand('node --version');
  if (nodeResult.success) {
    console.log(`✅ Node.js: ${nodeResult.output}`);
    passed++;
  } else {
    console.error('❌ Node.js not found');
    failed++;
  }

  // Check pnpm version
  const pnpmResult = runCommand('pnpm --version');
  if (pnpmResult.success) {
    console.log(`✅ pnpm: ${pnpmResult.output}`);
    passed++;
  } else {
    console.error('❌ pnpm not found');
    failed++;
  }

  // Check Nx version
  const nxResult = runCommand('npx nx --version');
  if (nxResult.success) {
    console.log(`✅ Nx: ${nxResult.output}`);
    passed++;
  } else {
    console.warn('⚠️  Nx not found globally');
    warnings++;
  }

  // Check if dependencies are installed
  if (fs.existsSync('node_modules')) {
    console.log('✅ Dependencies installed');
    passed++;
  } else {
    console.error('❌ Dependencies not installed - run "pnpm install"');
    failed++;
  }

  // Check environment files
  const envFiles = ['.env', '.env.local', '.env.example'];
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile} exists`);
      passed++;
    } else {
      console.log(`ℹ️  ${envFile} not found (optional)`);
    }
  }

  // Check Git configuration
  const gitResult = runCommand('git --version');
  if (gitResult.success) {
    console.log(`✅ Git: ${gitResult.output}`);
    passed++;
  } else {
    console.error('❌ Git not found');
    failed++;
  }

  // Summary
  console.log('\n📊 Environment Audit Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Some environment checks failed');
    process.exit(1);
  } else {
    console.log('\n✅ Environment audit passed');
  }
}

if (require.main === module) {
  auditEnvironment();
}

module.exports = { auditEnvironment };
