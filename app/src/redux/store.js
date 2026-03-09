// import { createStore, combineReducers } from 'redux';
// import reducer from './reducer';
// import notiReducer from './notifications';

// const rootReducer = combineReducers({
//     reducer,
//     notiReducer
// })

// export default createStore(rootReducer);


import { configureStore } from '@reduxjs/toolkit';
import principalReducer from './principalSlice';
import notifacionReducer from './notificationsSlice';
import ventasReducer from './ventasSlice'
import lotesReducer from './lotesSlice'
import cobrosReducer from './cobrosSlice'
import creditosReducer from './creditosSlice'
import clientesReducer from './clientesSlice'
import { combineReducers } from '@reduxjs/toolkit';

const reducer = combineReducers({
    principal: principalReducer,
    notiReducer: notifacionReducer,
    ventas: ventasReducer,
    lotes: lotesReducer,
    cobros: cobrosReducer,
    creditos: creditosReducer,
    clientes: clientesReducer
})

const store = configureStore({
    reducer: reducer,
    devTools: import.meta.env.VITE_APP_ENV === "development"
});

export default store;
