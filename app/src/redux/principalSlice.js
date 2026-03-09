import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoading: true,
    isSignout: false,
    isVisible: false,
    isConfig: true,
    userToken: null,
    project: null,
    empresa: null,
};

const principalSlice = createSlice({
    name: 'principal',
    initialState,
    reducers: {
        restoreToken: (state, action) => {
            state.userToken = action.payload.token;
            state.empresa = action.payload.empresa;
            state.project = action.payload.token === null ? null : action.payload.token.project;
            state.isLoading = false;
            state.isVisible = true;
            state.isConfig = false;
        },
        signIn: (state, action) => {
            state.userToken = action.payload.token;
            state.project = action.payload.project;
            state.isSignout = false;
            state.isVisible = true;
            state.isConfig = false;
        },
        signOut: (state) => {
            state.isSignout = true;
            state.isVisible = false;
            state.isConfig = false;
            state.userToken = null;
            state.project = null;
        },
        selectProject: (state, action) => {
            state.project = action.payload.project;
        },
        closeProject: (state) => {
            state.project = null;
        },
        config: (state, action) => {
            state.isLoading = false;
            state.isVisible = false;
            state.isConfig = action.payload.isConfig;
        },
        configSave: (state) => {
            state.isLoading = true;
            state.isSignout = true;
            state.isVisible = false;
            state.isConfig = false;
            state.userToken = null;
            state.empresa = null;
            state.project = null;
        },
    },
});

export const { restoreToken, signIn, signOut, selectProject, closeProject, config, configSave } = principalSlice.actions;
export default principalSlice.reducer;
