# Debugging Guide for React Native App

## Problem
The app crashes with alerts that disappear too fast to read. This guide helps you see and debug errors.

## Solution: Using Simulator + Error Logger

### Yes, Running on Simulator is Excellent!

**Simulators are the BEST way to see errors** because:
1. ✅ You can see console logs in real-time
2. ✅ You can use React Native Debugger
3. ✅ You can inspect network requests
4. ✅ You can see detailed error stack traces
5. ✅ No need to shake device or use remote debugging

## How to Run on Simulator

### iOS Simulator (Mac only)
```bash
cd /home/balaji/aqifi/aqifi-insight-nexus-app-expo
npm run ios
# or
expo run:ios
```

### Android Emulator
```bash
# Make sure Android emulator is running first
cd /home/balaji/aqifi/aqifi-insight-nexus-app-expo
npm run android
# or
expo run:android
```

## Viewing Console Logs

### Option 1: Terminal (Easiest)
When you run `npm run ios` or `npm run android`, the Metro bundler terminal will show all `console.log()`, `console.error()`, and `console.warn()` messages.

### Option 2: React Native Debugger
1. Install React Native Debugger: https://github.com/jhen0409/react-native-debugger
2. Open the app in simulator
3. Press `Cmd+D` (iOS) or `Cmd+M` (Android) to open Dev Menu
4. Select "Debug" or "Open Debugger"
5. All console logs will appear in the debugger

### Option 3: Chrome DevTools
1. Open app in simulator
2. Press `Cmd+D` (iOS) or `Cmd+M` (Android)
3. Select "Debug" 
4. Chrome will open with DevTools showing console logs

## Using the Error Logger (NEW!)

We've added a persistent error logger that saves all errors to AsyncStorage. You can view them even after the app crashes!

### Accessing Error Logs

1. **Add a button to open Error Log Viewer** in your App.tsx:
   ```tsx
   import { ErrorLogViewer } from './components/ErrorLogViewer';
   
   // In your component:
   const [showErrorLogs, setShowErrorLogs] = useState(false);
   
   // Add a button (maybe in settings or debug menu):
   <Button onPress={() => setShowErrorLogs(true)}>
     View Error Logs
   </Button>
   
   <ErrorLogViewer 
     visible={showErrorLogs} 
     onClose={() => setShowErrorLogs(false)} 
   />
   ```

2. **Or use a gesture** (shake device in development):
   ```tsx
   // In App.tsx, add:
   import { errorLogger } from './utils/errorLogger';
   
   // Add shake gesture handler (development only)
   ```

### What Gets Logged

- ✅ All `errorLogger.logError()` calls
- ✅ All `errorLogger.logDebug()` calls  
- ✅ All `errorLogger.logWarning()` calls
- ✅ All `errorLogger.logInfo()` calls
- ✅ Global unhandled errors (via ErrorUtils)
- ✅ WebView errors
- ✅ Network errors

### Error Log Features

- **Filter by type**: Error, Warning, Info, Debug, or All
- **View full stack traces**: See exactly where errors occurred
- **View context**: See additional data passed with errors
- **Share logs**: Export logs to share with team
- **Clear logs**: Remove old logs

## Quick Debug Steps

1. **Run on simulator**:
   ```bash
   npm run ios  # or android
   ```

2. **Watch the terminal** - all console logs appear there

3. **Trigger the crash** - click the KYC button or whatever causes the crash

4. **Check terminal output** - you'll see all the debug messages and errors

5. **If app crashes before you can read**:
   - Open Error Log Viewer (if you added the button)
   - Or check the terminal - errors are logged there too
   - Or use React Native Debugger to pause execution

## Example: Finding KYC Crash

1. Run: `npm run ios`
2. Terminal shows: `DEBUG: Step 1 - KYC button clicked`
3. Terminal shows: `DEBUG: Step 2 - Starting dynamic import...`
4. Terminal shows: `ERROR: Step 15a - Fetch error...`
5. **You found it!** The error is at Step 15a

## Tips

- **Keep terminal open** - it's your best friend for debugging
- **Use `console.log()` liberally** - it's free and helps a lot
- **Check Error Log Viewer** after crashes - errors are saved there
- **Use React Native Debugger** for advanced debugging (breakpoints, network inspection)

## Common Issues

### "Can't see console logs"
- Make sure Metro bundler is running
- Check that you're looking at the right terminal window
- Try React Native Debugger instead

### "App crashes too fast"
- Errors are saved to Error Log Viewer automatically
- Check terminal output - it persists even after crash
- Use React Native Debugger to pause on errors

### "Simulator is slow"
- This is normal, especially on first run
- Use a physical device if needed, but simulator is better for debugging

## Next Steps

1. Run the app on simulator
2. Watch the terminal for errors
3. If you want, add the Error Log Viewer button to your app
4. All errors are now logged and viewable!

