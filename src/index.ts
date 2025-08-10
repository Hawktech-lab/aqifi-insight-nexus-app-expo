import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the main application component
AppRegistry.registerComponent(appName, () => App);

// Note: This is the React Native equivalent of ReactDOM.render() from React web apps
// In React web, you might have had:
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './index.css';
//
// const root = ReactDOM.createRoot(document.getElementById('root')!);
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
