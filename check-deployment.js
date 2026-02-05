#!/usr/bin/env node

/**
 * Pre-Deployment Checker for Dashboard SPPL
 * This script checks for common issues before deployment to Hostinger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHECKS = {
  backend: [],
  frontend: [],
  warnings: [],
  errors: []
};

console.log('🔍 Dashboard SPPL - Pre-Deployment Checker\n');
console.log('=' .repeat(60));

// ===== BACKEND CHECKS =====
console.log('\n📦 BACKEND CHECKS');
console.log('-'.repeat(60));

// Check if .env.production exists
if (fs.existsSync(path.join(__dirname, '.env.production'))) {
  CHECKS.backend.push('✅ .env.production file exists');
  
  // Read and validate .env.production
  const envContent = fs.readFileSync(path.join(__dirname, '.env.production'), 'utf8');
  
  if (envContent.includes('YOUR_USERNAME') || envContent.includes('YOUR_PASSWORD')) {
    CHECKS.errors.push('❌ .env.production contains placeholder values for MONGODB_URI');
  } else {
    CHECKS.backend.push('✅ MONGODB_URI appears to be configured');
  }
  
  if (envContent.includes('CHANGE_TO_STRONG_RANDOM_STRING')) {
    CHECKS.errors.push('❌ JWT secrets not changed from default');
  } else {
    CHECKS.backend.push('✅ JWT secrets appear to be configured');
  }
  
  if (envContent.includes('yourdomain.com')) {
    CHECKS.warnings.push('⚠️  CORS URLs still contain yourdomain.com placeholder');
  } else {
    CHECKS.backend.push('✅ CORS URLs configured');
  }
} else {
  CHECKS.errors.push('❌ .env.production file missing in backend folder');
}

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  CHECKS.warnings.push('⚠️  Created uploads directory');
} else {
  CHECKS.backend.push('✅ Uploads directory exists');
}

// Check if all route files exist
const routes = ['auth.js', 'projects.js', 'sensors.js', 'admin.js', 'alerts.js', 'panelConfig.js', 'panelReports.js', 'projectDetails.js'];
const routesDir = path.join(__dirname, 'routes');
routes.forEach(route => {
  if (fs.existsSync(path.join(routesDir, route))) {
    CHECKS.backend.push(`✅ Route file ${route} exists`);
  } else {
    CHECKS.errors.push(`❌ Route file ${route} missing`);
  }
});

// Check package.json
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  CHECKS.backend.push('✅ package.json exists');
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  if (pkg.type === 'module') {
    CHECKS.backend.push('✅ ES modules enabled (type: module)');
  } else {
    CHECKS.warnings.push('⚠️  package.json not set to use ES modules');
  }
} else {
  CHECKS.errors.push('❌ package.json missing');
}

// ===== FRONTEND CHECKS =====
console.log('\n🎨 FRONTEND CHECKS');
console.log('-'.repeat(60));

const frontendDir = path.join(__dirname, '..', 'frontend');

// Check if .env.production exists
if (fs.existsSync(path.join(frontendDir, '.env.production'))) {
  CHECKS.frontend.push('✅ .env.production file exists');
  
  const envContent = fs.readFileSync(path.join(frontendDir, '.env.production'), 'utf8');
  
  if (envContent.includes('yourdomain.com')) {
    CHECKS.warnings.push('⚠️  Frontend .env.production contains yourdomain.com placeholder');
  } else {
    CHECKS.frontend.push('✅ API URLs configured in .env.production');
  }
} else {
  CHECKS.errors.push('❌ .env.production file missing in frontend folder');
}

// Check if build directory can be created
if (!fs.existsSync(path.join(frontendDir, 'dist'))) {
  CHECKS.warnings.push('⚠️  No dist folder found - remember to run "npm run build"');
} else {
  CHECKS.frontend.push('✅ Build directory exists');
}

// Check if .htaccess exists
if (fs.existsSync(path.join(frontendDir, '.htaccess'))) {
  CHECKS.frontend.push('✅ .htaccess file exists for Apache configuration');
} else {
  CHECKS.warnings.push('⚠️  No .htaccess file found - create one for proper routing');
}

// Check if config file exists
if (fs.existsSync(path.join(frontendDir, 'src', 'config', 'api.config.js'))) {
  CHECKS.frontend.push('✅ API configuration file exists');
} else {
  CHECKS.errors.push('❌ API configuration file missing at src/config/api.config.js');
}

// ===== PRINT RESULTS =====
console.log('\n📊 SUMMARY');
console.log('='.repeat(60));

console.log('\n✅ Backend Checks:');
CHECKS.backend.forEach(check => console.log(`  ${check}`));

console.log('\n✅ Frontend Checks:');
CHECKS.frontend.forEach(check => console.log(`  ${check}`));

if (CHECKS.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  CHECKS.warnings.forEach(warning => console.log(`  ${warning}`));
}

if (CHECKS.errors.length > 0) {
  console.log('\n❌ Errors (Must Fix Before Deployment):');
  CHECKS.errors.forEach(error => console.log(`  ${error}`));
  console.log('\n❌ DEPLOYMENT BLOCKED - Fix errors above');
  process.exit(1);
} else {
  console.log('\n✅ ALL CRITICAL CHECKS PASSED');
  
  if (CHECKS.warnings.length > 0) {
    console.log('⚠️  Some warnings detected - review before deployment');
  } else {
    console.log('🎉 Ready for deployment!');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('  1. Review and fix any warnings');
console.log('  2. Update .env.production files with production values');
console.log('  3. Run "npm run build" in frontend folder');
console.log('  4. Follow DEPLOYMENT_GUIDE.md for detailed instructions');
console.log('\n');
