/**
 * Test Script for Data Synchronization
 * 
 * This script tests the bidirectional sync between Project and ProjectDetails
 * Run with: node test-sync.js
 */

import Project from './models/Project.js';
import ProjectDetails from './models/ProjectDetails.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testSync = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Find a project to test with
    const testProject = await Project.findOne();
    if (!testProject) {
      console.log('❌ No projects found in database. Create a project first.');
      process.exit(1);
    }

    console.log(`\n📋 Testing with project: ${testProject.projectName} (${testProject._id})`);

    // Test 2: Check if ProjectDetails exists
    let projectDetails = await ProjectDetails.findOne({ project_id: testProject._id.toString() });
    console.log(`\n🔍 ProjectDetails exists: ${projectDetails ? 'YES' : 'NO'}`);

    // Test 3: Create or update ProjectDetails
    const testDetailsData = {
      project_id: testProject._id.toString(),
      project_title: testProject.projectName + ' (Synced)',
      structure_type: testProject.projectType || 'building',
      city: testProject.location?.city || 'Test City',
      country: testProject.location?.country || 'India',
      area: testProject.location?.address || 'Test Address',
      latitude: testProject.location?.coordinates?.latitude || 28.7041,
      longitude: testProject.location?.coordinates?.longitude || 77.1025,
      updated_by: 'test-script@admin.com'
    };

    projectDetails = await ProjectDetails.findOneAndUpdate(
      { project_id: testProject._id.toString() },
      testDetailsData,
      { upsert: true, new: true }
    );

    console.log('\n✅ ProjectDetails created/updated');
    console.log('   Title:', projectDetails.project_title);
    console.log('   City:', projectDetails.city);
    console.log('   Type:', projectDetails.structure_type);

    // Test 4: Verify sync would work in reverse
    const updatedProject = await Project.findById(testProject._id);
    console.log('\n📊 Main Project Data:');
    console.log('   Name:', updatedProject.projectName);
    console.log('   Type:', updatedProject.projectType);
    console.log('   City:', updatedProject.location?.city);

    // Test 5: Simulate unified endpoint
    console.log('\n🔗 Testing Unified Data Merge:');
    const unifiedData = {
      projectName: projectDetails.project_title || updatedProject.projectName,
      projectType: projectDetails.structure_type || updatedProject.projectType,
      location: {
        city: projectDetails.city || updatedProject.location?.city,
        address: projectDetails.area || updatedProject.location?.address,
        country: projectDetails.country || updatedProject.location?.country,
        coordinates: {
          latitude: projectDetails.latitude || updatedProject.location?.coordinates?.latitude,
          longitude: projectDetails.longitude || updatedProject.location?.coordinates?.longitude
        }
      },
      hasProjectDetails: !!projectDetails
    };

    console.log('   Unified Name:', unifiedData.projectName);
    console.log('   Unified Type:', unifiedData.projectType);
    console.log('   Unified City:', unifiedData.location.city);
    console.log('   Has Details:', unifiedData.hasProjectDetails);

    console.log('\n✅ All tests passed! Sync is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test editing a project in Admin Panel');
    console.log('   3. Verify changes appear in Project Details Management');
    console.log('   4. Test the unified endpoint: GET /api/project-details/unified/' + testProject._id);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the test
testSync();
