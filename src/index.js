import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Import the CSS file
import App from './App'; // Import your App component
import * as serviceWorker from './serviceWorker'; // For PWA capabilities

ReactDOM.render(<App />, document.getElementById('root'));


serviceWorker.unregister();