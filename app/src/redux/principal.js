// import {
//     RESTORE_TOKEN,
//     SIGN_IN,
//     SIGN_OUT,
//     PROJECT_ACTIVE,
//     PROJECT_CLOSE,
//     CONFIG,
//     CONFIG_SAVE
// } from './types';

// const initialState = {
//     isLoading: true,
//     isSignout: false,
//     isVisible: false,
//     isConfig: true,
//     userToken: null,
//     project: null,
//     empresa: null,
// }

// const reducer = (state = initialState, action) => {
//     switch (action.type) {
//         case RESTORE_TOKEN:
//             return {
//                 ...state,
//                 userToken: action.token,
//                 empresa: action.empresa,
//                 project: action.token === null ? null : action.token.project,
//                 isLoading: false,
//                 isVisible: true,
//                 isConfig: false,
//             };
//         case SIGN_IN:
//             return {
//                 ...state,
//                 userToken: action.token,
//                 project: action.project,
//                 isSignout: false,
//                 isVisible: true,
//                 isConfig: false,
//             };
//         case SIGN_OUT:
//             return {
//                 ...state,
//                 isSignout: true,
//                 isVisible: false,
//                 isConfig: false,
//                 userToken: null,
//                 project: null,
//             };
//         case PROJECT_ACTIVE:
//             return {
//                 ...state,
//                 project: action.project
//             };
//         case PROJECT_CLOSE:
//             return {
//                 ...state,
//                 project: null
//             };
//         case CONFIG:
//             return {
//                 ...state,
//                 isLoading: false,
//                 isVisible: false,
//                 isConfig: action.isConfig
//             }
//         case CONFIG_SAVE:
//             return {
//                 ...state,
//                 isLoading: true,
//                 isSignout: true,
//                 isVisible: false,
//                 isConfig: false,
//                 userToken: null,
//                 empresa: null,
//                 project: null
//             }
//         default: return state;
//     }
// }

// export default reducer;

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
