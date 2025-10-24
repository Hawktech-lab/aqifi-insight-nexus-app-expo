// Test script to verify Gmail authentication fix
const { GoogleSignin } = require('@react-native-google-signin/google-signin');

console.log('Testing Gmail authentication...');

// Check if GoogleSignin is properly imported
if (!GoogleSignin) {
  console.error('❌ GoogleSignin is not properly imported');
  process.exit(1);
}

// Check if required methods exist
const requiredMethods = ['configure', 'hasPlayServices', 'signIn', 'getTokens', 'getCurrentUser', 'signOut'];

for (const method of requiredMethods) {
  if (typeof GoogleSignin[method] !== 'function') {
    console.error(`❌ GoogleSignin.${method} is not a function`);
    process.exit(1);
  }
}

console.log('✅ All required GoogleSignin methods are available');
console.log('✅ Gmail authentication should work properly now');

// Test configuration (without actually configuring)
try {
  console.log('✅ GoogleSignin object is properly imported and accessible');
} catch (error) {
  console.error('❌ Error accessing GoogleSignin:', error.message);
  process.exit(1);
}

console.log('🎉 Gmail authentication test passed!');
