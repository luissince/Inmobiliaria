// import { createStore, combineReducers } from 'redux';
// import reducer from './reducer';
// import notiReducer from './notifications';

// const rootReducer = combineReducers({
//     reducer,
//     notiReducer
// })

// export default createStore(rootReducer);


import { configureStore } from '@reduxjs/toolkit';
import principal from './principal';
import notiReducer from './notifications';
import { combineReducers } from '@reduxjs/toolkit';

const reducer = combineReducers({
    principal,
    notiReducer,
})

const store = configureStore({
    reducer: reducer,
    devTools: import.meta.env.VITE_APP_ENV === "development"
});

export default store;
