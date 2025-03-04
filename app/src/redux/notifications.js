// import {
//     ADD_NOTIFICATION
// } from './types';

// const initialState = {
//     notification: []
// }

// const notiReducer = (state = initialState, action) => {
//     switch (action.type) {
//         case ADD_NOTIFICATION:
//             return {
//                 ...state,
//                 notification: [...state.notification, action.value]
//             };
//         default: return state;
//     }
// }

// export default notiReducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    notification: []
};

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            state.notification.push(action.payload);
        },
    },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
