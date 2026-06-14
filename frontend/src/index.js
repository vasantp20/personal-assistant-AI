import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import ManageAuth from './services/admin/ManageAuth';

let auth = ManageAuth.getInstance()





ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);



