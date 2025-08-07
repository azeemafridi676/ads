import {
  sendResetPasswordEmail,
  sendOtpEmail,
  sendNewChatMessageToAdmin,
  sendNewChatMessageToUser,
  sendCampaignStatusUpdate,
  sendCampaignCycleComplete,
  sendWelcomeEmail,
  sendCampaignCycleRunning,
  sendSubscriptionCompletionEmail
} from './services/emailService';

async function testAllEmails() {
  try {
    console.log('Starting email tests...\n');

    // Test 1: Reset Password Email
    console.log('Testing Reset Password Email...');
    await sendResetPasswordEmail({
      email: 'test@example.com',
      resetToken: 'test-reset-token-123'
    });
    console.log('✓ Reset Password Email sent successfully\n');

    // Test 2: OTP Email
    console.log('Testing OTP Email...');
    await sendOtpEmail({
      email: 'test@example.com',
      otp: '123456',
      userName: 'Test User'
    });
    console.log('✓ OTP Email sent successfully\n');

    // Test 3: New Chat Message to Admin
    console.log('Testing New Chat Message to Admin...');
    await sendNewChatMessageToAdmin({
      email: 'test@example.com',
      userName: 'Test User',
      messagePreview: 'This is a test message preview'
    });
    console.log('✓ New Chat Message to Admin sent successfully\n');

    // Test 4: New Chat Message to User
    console.log('Testing New Chat Message to User...');
    await sendNewChatMessageToUser({
      email: 'test@example.com',
      userName: 'Test User',
      messagePreview: 'This is a test message preview'
    });
    console.log('✓ New Chat Message to User sent successfully\n');

    // Test 5: Campaign Status Update
    console.log('Testing Campaign Status Update...');
    await sendCampaignStatusUpdate({
      email: 'test@example.com',
      userName: 'Test User',
      campaignName: 'Test Campaign',
      status: 'Active',
      reason: 'Test reason'
    });
    console.log('✓ Campaign Status Update sent successfully\n');

    // Test 6: Campaign Cycle Complete
    console.log('Testing Campaign Cycle Complete...');
    await sendCampaignCycleComplete({
      email: 'test@example.com',
      userName: 'Test User',
      campaignName: 'Test Campaign',
      displayTime: '2 hours',
      location: 'Test Location',
      truckId: 'TRUCK123'
    });
    console.log('✓ Campaign Cycle Complete sent successfully\n');

    // Test 7: Welcome Email
    console.log('Testing Welcome Email...');
    await sendWelcomeEmail('test@example.com', 'Test User');
    console.log('✓ Welcome Email sent successfully\n');

    // Test 8: Campaign Cycle Running
    console.log('Testing Campaign Cycle Running...');
    await sendCampaignCycleRunning({
      email: 'test@example.com',
      userName: 'Test User',
      campaignName: 'Test Campaign',
      startTime: new Date().toLocaleString(),
      campaignId: 'CAMP123'
    });
    console.log('✓ Campaign Cycle Running sent successfully\n');

    // Test 9: Subscription Completion
    console.log('Testing Subscription Completion...');
    await sendSubscriptionCompletionEmail({
      email: 'test@example.com',
      userName: 'Test User',
      subscriptionName: 'Premium Plan',
      completedAt: new Date()
    });
    console.log('✓ Subscription Completion sent successfully\n');

    console.log('All email tests completed successfully! 🎉');
  } catch (error) {
    console.error('Error during email testing:', error);
  }
}

// Run the tests
testAllEmails(); 