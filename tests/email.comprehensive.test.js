/**
 * Email Service Comprehensive Test
 * 
 * This test demonstrates:
 * 1. Sending a welcome email
 * 2. Sending profile update notification
 * 3. Bulk email sending with duplicate prevention simulation
 * 
 * Run with: node tests/email.comprehensive.test.js
 */

require('dotenv').config();
const { 
  sendWelcomeEmail, 
  sendProfileUpdateEmail, 
  sendBulkWelcomeEmails 
} = require('../services/emailService');

// Test configuration
const TEST_EMAIL = 'meetpatel221@proton.me';
const TEST_NAME = 'Meet Patel';

/**
 * Test 1: Send welcome email
 */
async function testWelcomeEmail() {
  console.log('\n📧 TEST 1: Welcome Email');
  console.log('─'.repeat(50));

  const memberData = {
    name: TEST_NAME,
    email: TEST_EMAIL,
    touristId: 'T1234567890',
  };

  const result = await sendWelcomeEmail(
    memberData,
    'G9876543210',      // guideId
    'ABC123',           // groupAccessCode
    'Test Tour Group',  // groupName
    'Tour Admin'        // adminName
  );

  if (result.success) {
    console.log('✅ Welcome email sent successfully');
    return true;
  } else {
    console.error('❌ Failed:', result.error);
    return false;
  }
}

/**
 * Test 2: Send profile update email
 */
async function testProfileUpdateEmail() {
  console.log('\n📧 TEST 2: Profile Update Email');
  console.log('─'.repeat(50));

  const updatedFields = [
    'Blood Group',
    'Medical Conditions',
    'Emergency Contact'
  ];

  const result = await sendProfileUpdateEmail(
    TEST_EMAIL,
    TEST_NAME,
    updatedFields,
    'Tour Admin'
  );

  if (result.success) {
    console.log('✅ Profile update email sent successfully');
    return true;
  } else {
    console.error('❌ Failed:', result.error);
    return false;
  }
}

/**
 * Test 3: Bulk email sending (simulates duplicate prevention)
 */
async function testBulkEmails() {
  console.log('\n📧 TEST 3: Bulk Email Sending');
  console.log('─'.repeat(50));

  // Simulate multiple members (in real scenario, duplicate check happens in controller)
  const members = [
    {
      name: TEST_NAME,
      email: TEST_EMAIL,
      touristId: 'T1111111111',
      _id: '507f1f77bcf86cd799439011'
    },
    {
      name: 'Test Member 2',
      email: TEST_EMAIL, // Same email for demonstration
      touristId: 'T2222222222',
      _id: '507f1f77bcf86cd799439012'
    }
  ];

  const result = await sendBulkWelcomeEmails(
    members,
    'G9876543210',
    'ABC123',
    'Test Tour Group',
    'Tour Admin'
  );

  console.log(`📊 Results: ${result.successful}/${result.total} sent, ${result.failed} failed`);
  
  if (result.successful > 0) {
    console.log('✅ Bulk email test passed');
    return true;
  } else {
    console.error('❌ No emails were sent successfully');
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   Smart Tourist Safety - Email Service Test  ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log(`\n📬 Target Email: ${TEST_EMAIL}`);
  console.log('⏱️  Running all tests...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Welcome Email
  try {
    const success = await testWelcomeEmail();
    results.tests.push({ name: 'Welcome Email', success });
    if (success) results.passed++; else results.failed++;
    
    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('❌ Exception in Test 1:', error.message);
    results.tests.push({ name: 'Welcome Email', success: false });
    results.failed++;
  }

  // Test 2: Profile Update Email
  try {
    const success = await testProfileUpdateEmail();
    results.tests.push({ name: 'Profile Update Email', success });
    if (success) results.passed++; else results.failed++;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('❌ Exception in Test 2:', error.message);
    results.tests.push({ name: 'Profile Update Email', success: false });
    results.failed++;
  }

  // Test 3: Bulk Emails
  try {
    const success = await testBulkEmails();
    results.tests.push({ name: 'Bulk Email Sending', success });
    if (success) results.passed++; else results.failed++;
  } catch (error) {
    console.error('❌ Exception in Test 3:', error.message);
    results.tests.push({ name: 'Bulk Email Sending', success: false });
    results.failed++;
  }

  // Print summary
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║              TEST SUMMARY                     ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  results.tests.forEach((test, index) => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${test.name}`);
  });

  console.log('\n' + '─'.repeat(50));
  console.log(`Total: ${results.passed + results.failed} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log('─'.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n💔 Some tests failed!\n');
    process.exit(1);
  }
}

// Check environment
if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
  console.error('❌ Missing required environment variables');
  console.error('   Please set RESEND_API_KEY and FROM_EMAIL in .env file');
  process.exit(1);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
