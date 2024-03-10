import { createStore, combineReducers } from 'redux';
import reducer from './reducer';
import notiReducer from './notifications';

const rootReducer = combineReducers({
    reducer,
    notiReducer
})

export default createStore(rootReducer);