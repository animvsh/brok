import 'react-native-url-polyfill/auto';
global.Buffer = require('buffer').Buffer;

import 'expo-router/entry';
import { App } from 'expo-router/build/qualified-entry';
import { AppRegistry, LogBox } from 'react-native';

if (__DEV__) {
  LogBox.ignoreAllLogs();
}

AppRegistry.registerComponent('main', () => App);
