// Simple test script to verify email metadata functionality
const EmailMetadataService = require('./src/services/EmailMetadataService.ts');

async function testEmailMetadata() {
  console.log('Testing Email Metadata Service...');
  
  try {
    const service = EmailMetadataService.default.getInstance();
    console.log('✓ Service instance created successfully');
    
    // Test mock user ID
    const testUserId = 'test-user-123';
    
    // Test collection
    console.log('Testing email collection...');
    const result = await service.collectEmailMetadata(testUserId);
    console.log('Collection result:', result);
    
    // Test stats
    console.log('Testing stats retrieval...');
    const stats = await service.getEmailMetadataStats(testUserId);
    console.log('Stats:', stats);
    
    console.log('✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

// Run the test
testEmailMetadata();
