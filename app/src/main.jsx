
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store.js';
import './recursos/css/bootstrap.css';
import './recursos/css/sweetalert.css';
import './recursos/css/fontawesome.css';
import './recursos/css/treeone.css';
import './recursos/css/sidebar.css';
import './recursos/css/footerbar.css';

import './recursos/js/bootstrap.js';
import '../node_modules/bootstrap-icons/font/bootstrap-icons.css';
// import '../../node_modules/react-notifications/lib/notifications.css';
import './network/rest/principal.network.js';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  // <React.StrictMode>
  <Provider store={store}>
      <App />
  </Provider>
  // </React.StrictMode>
)

// ReactDOM.render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <App />
//     </Provider>
//   </React.StrictMode>,
//   document.getElementById('root'),
// );
