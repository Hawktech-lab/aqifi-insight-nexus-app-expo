# Error Logger Format

## Server Endpoint
`POST https://diax.in:8080/log`

## Request Format

### Single Log
```json
{
  "detail": {
    "id": "1703123456789-0.123456789",
    "timestamp": "2023-12-21T10:30:45.123Z",
    "type": "error|warning|info|debug",
    "message": "Error message or log message",
    "stack": "Error stack trace (if error) or string representation",
    "context": "{\n  \"key\": \"value\",\n  \"nested\": {\n    \"data\": \"value\"\n  }\n}",
    "deviceInfo": {
      "platform": "ios|android",
      "version": "17.0",
      "deviceId": "unique-device-id",
      "deviceName": "iPhone 15 Pro",
      "brand": "Apple",
      "model": "iPhone",
      "manufacturer": "Apple",
      "systemVersion": "17.0",
      "appVersion": "1.0.0",
      "bundleId": "com.yourapp.bundle",
      "isTablet": false,
      "isEmulator": false
    }
  }
}
```

### Batch Logs (Multiple logs sent together)
```json
{
  "detail": [
    {
      "id": "1703123456789-0.123456789",
      "timestamp": "2023-12-21T10:30:45.123Z",
      "type": "error",
      "message": "First error",
      "stack": "...",
      "context": "...",
      "deviceInfo": {...}
    },
    {
      "id": "1703123456790-0.987654321",
      "timestamp": "2023-12-21T10:30:46.123Z",
      "type": "info",
      "message": "Second log",
      "stack": null,
      "context": "...",
      "deviceInfo": {...}
    }
  ]
}
```

## Field Descriptions

- **id**: Unique identifier for the log entry (timestamp-random)
- **timestamp**: ISO 8601 timestamp when log was created
- **type**: Log type - `error`, `warning`, `info`, or `debug`
- **message**: The log message string
- **stack**: Error stack trace (for errors) or string representation of error object
- **context**: JSON stringified context object (can be null/undefined)
- **deviceInfo**: Device information object (may be partial if device info initialization fails)

## Headers
```
Content-Type: application/json
```

## Response
- **200 OK**: Log received successfully
- **Other status codes**: Log send failed (will retry or be lost)

## Storage

Logs are also stored locally in AsyncStorage under key `@error_logs` before being sent to server. This ensures logs are available even if:
- Network is unavailable
- Server is down
- App crashes before sending

## Batch Behavior

- Logs are batched and sent every 5 seconds (`BATCH_INTERVAL`)
- Batch size is 10 logs (`BATCH_SIZE`)
- If batch is full, logs are sent immediately
- Critical errors (FATAL, crash, Global Error) are sent immediately without batching

## Example Log Messages

### Error Log
```json
{
  "detail": {
    "id": "1703123456789-0.123456789",
    "timestamp": "2023-12-21T10:30:45.123Z",
    "type": "error",
    "message": "Global Error Handler: FATAL",
    "stack": "Error: Something went wrong\n    at App.tsx:123\n    at ...",
    "context": "{\n  \"isFatal\": true\n}",
    "deviceInfo": {...}
  }
}
```

### Info Log
```json
{
  "detail": {
    "id": "1703123456790-0.987654321",
    "timestamp": "2023-12-21T10:30:46.123Z",
    "type": "info",
    "message": "[MAIN APP] MainApp: Component rendering...",
    "stack": null,
    "context": null,
    "deviceInfo": {...}
  }
}
```

### Warning Log
```json
{
  "detail": {
    "id": "1703123456791-0.555555555",
    "timestamp": "2023-12-21T10:30:47.123Z",
    "type": "warning",
    "message": "[CONFIG] getAppConfigs: No active configuration found in database. Using empty config.",
    "stack": null,
    "context": null,
    "deviceInfo": {...}
  }
}
```

