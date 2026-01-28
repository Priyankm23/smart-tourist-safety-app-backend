/**
 * Email Service Test
 * 
 * This test sends a welcome email to verify the email service is working correctly.
 * Run with: node tests/email.test.js
 */

require('dotenv').config();
const { sendWelcomeEmail } = require('../services/emailService');

/**
 * Test sending welcome email to a specific address
 */
async function testSendWelcomeEmail() {
  console.log('=================================');
  console.log('📧 Email Service Test');
  console.log('=================================\n');

  // Test data
  const memberData = {
    name: 'Meet Patel',
    email: 'meetpatel221@proton.me',
    touristId: 'T1234567890',
  };

  const guideId = 'G9876543210';
  const groupAccessCode = 'ABC123';
  const groupName = 'Test Tour Group';
  const adminName = 'Tour Admin';

  console.log('📤 Sending test welcome email...');
  console.log(`   To: ${memberData.email}`);
  console.log(`   Name: ${memberData.name}`);
  console.log(`   Tourist ID: ${memberData.touristId}`);
  console.log(`   Guide ID: ${guideId}`);
  console.log(`   Group Access Code: ${groupAccessCode}`);
  console.log(`   Group Name: ${groupName}\n`);

  try {
    const result = await sendWelcomeEmail(
      memberData,
      guideId,
      groupAccessCode,
      groupName,
      adminName
    );

    if (result.success) {
      console.log('✅ SUCCESS: Email sent successfully!');
      console.log(`   Message ID: ${result.messageId || 'N/A'}`);
      console.log('\n📬 Check your inbox at meetpatel221@proton.me');
      console.log('🎉 Test Passed!');
      console.log('=================================\n');
      process.exit(0);
    } else {
      console.error('❌ FAILED: Email sending failed');
      console.error(`   Error: ${result.error}`);
      console.log('\n💔 Test Failed!');
      console.log('=================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ EXCEPTION: Unexpected error occurred');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    console.log('\n💔 Test Failed!');
    console.log('=================================\n');
    process.exit(1);
  }
}

// Check if required environment variables are set
function checkEnvironment() {
  console.log('🔍 Checking environment variables...\n');
  
  const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL'];
  const missing = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`   ❌ ${varName}: NOT SET`);
    } else {
      // Mask the API key for security
      const value = varName === 'RESEND_API_KEY' 
        ? `${process.env[varName].substring(0, 10)}...` 
        : process.env[varName];
      console.log(`   ✅ ${varName}: ${value}`);
    }
  });

  console.log('');

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Please set them in your .env file\n');
    console.log('=================================\n');
    process.exit(1);
  }

  console.log('✅ All environment variables are set\n');
}

// Run the test
console.log('\n');
checkEnvironment();
testSendWelcomeEmail();
