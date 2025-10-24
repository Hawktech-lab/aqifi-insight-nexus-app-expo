const DeviceInfo = require('react-native-device-info');

async function testDeviceFingerprinting() {
  console.log('🧪 Testing Device Fingerprinting...\n');

  try {
    // Test basic device information
    console.log('📱 Basic Device Information:');
    console.log('Device ID:', await DeviceInfo.getUniqueId());
    console.log('Device Name:', await DeviceInfo.getDeviceName());
    console.log('Brand:', await DeviceInfo.getBrand());
    console.log('Model:', await DeviceInfo.getModel());
    console.log('Manufacturer:', await DeviceInfo.getManufacturer());
    console.log('OS Type:', DeviceInfo.getSystemName());
    console.log('OS Version:', DeviceInfo.getSystemVersion());
    console.log('App Version:', DeviceInfo.getVersion());
    console.log('Build Number:', await DeviceInfo.getBuildNumber());
    console.log('');

    // Test hardware information
    console.log('🔧 Hardware Information:');
    console.log('CPU Type:', await DeviceInfo.getCpuType());
    console.log('CPU Cores:', await DeviceInfo.getCpuCores());
    console.log('Architecture:', await DeviceInfo.getArchitecture());
    console.log('Total RAM:', await DeviceInfo.getTotalRam());
    console.log('Available RAM:', await DeviceInfo.getAvailableRam());
    console.log('Total Storage:', await DeviceInfo.getTotalDiskCapacity());
    console.log('Available Storage:', await DeviceInfo.getFreeDiskStorage());
    console.log('');

    // Test device capabilities
    console.log('⚡ Device Capabilities:');
    console.log('Has NFC:', await DeviceInfo.isNFC());
    console.log('Has Fingerprint:', await DeviceInfo.isFingerprint());
    console.log('Has Face ID:', await DeviceInfo.isFaceID());
    console.log('Is Tablet:', await DeviceInfo.isTablet());
    console.log('Is Emulator:', await DeviceInfo.isEmulator());
    console.log('Is Rooted:', await DeviceInfo.isRooted());
    console.log('Is Jailbroken:', await DeviceInfo.isJailBroken());
    console.log('');

    // Test network information
    console.log('🌐 Network Information:');
    console.log('Network Type:', await DeviceInfo.getNetworkType());
    console.log('Carrier:', await DeviceInfo.getCarrier());
    console.log('Carrier Country:', await DeviceInfo.getCarrierCountry());
    console.log('IP Address:', await DeviceInfo.getIpAddress());
    console.log('');

    // Test battery information
    console.log('🔋 Battery Information:');
    console.log('Battery Level:', await DeviceInfo.getBatteryLevel());
    console.log('Is Charging:', await DeviceInfo.isCharging());
    console.log('Battery Health:', await DeviceInfo.getBatteryHealth());
    console.log('');

    // Test screen information
    console.log('📺 Screen Information:');
    console.log('Screen Refresh Rate:', await DeviceInfo.getScreenRefreshRate());
    console.log('Supported ABIs:', await DeviceInfo.supportedAbis());
    console.log('User Agent:', await DeviceInfo.getUserAgent());
    console.log('');

    console.log('✅ Device fingerprinting test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing device fingerprinting:', error);
  }
}

// Run the test
testDeviceFingerprinting();
