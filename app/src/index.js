import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Provider } from 'react-redux';
import store from './redux/store';
import './recursos/css/bootstrap.css';
import './recursos/css/sweetalert.css';
import './recursos/css/fontawesome.css';
import './recursos/css/treeone.css';
import './recursos/css/sidebar.css';
import './recursos/css/footerbar.css';

import './recursos/js/bootstrap.js';
import '../../node_modules/bootstrap-icons/font/bootstrap-icons.css';
import '../../node_modules/react-notifications/lib/notifications.css';
import './network/rest/principal.network';

ReactDOM.render(
    <Provider store={store}>
        <React.StrictMode>
            <App />
        </React.StrictMode>
    </Provider>,
    document.getElementById('root')
);