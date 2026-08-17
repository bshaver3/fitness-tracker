import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const mockAuth = ['1', 'true', 'yes', 'on'].includes(
  (process.env.REACT_APP_MOCK_AUTH || '').trim().toLowerCase()
);

if (!mockAuth) {
  const { Amplify } = require('aws-amplify');
  const awsconfig = require('./aws-exports').default;
  Amplify.configure(awsconfig);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
