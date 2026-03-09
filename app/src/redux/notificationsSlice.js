import { createSlice } from '@reduxjs/toolkit';
import { closeProject, signOut } from './principalSlice';

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
        extraReducers: (builder) => {
            builder.addCase(signOut, () => initialState);
            builder.addCase(closeProject, () => initialState);
        },
    },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
