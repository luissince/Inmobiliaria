import {
    RESTORE_TOKEN,
    SIGN_IN,
    SIGN_OUT,
    PROJECT_ACTIVE,
    PROJECT_CLOSE,
    CONFIG,
    CONFIG_SAVE
} from './types';

const initialState = {
    isLoading: true,
    isSignout: false,
    isVisible: false,
    isConfig: true,
    userToken: null,
    project: null,
    empresa: null,
}

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case RESTORE_TOKEN:
            return {
                ...state,
                userToken: action.token,
                empresa: action.empresa,
                project: action.token === null ? null : action.token.project,
                isLoading: false,
                isVisible: true,
                isConfig: false,
            };
        case SIGN_IN:
            return {
                ...state,
                userToken: action.token,
                project: action.project,
                isSignout: false,
                isVisible: true,
                isConfig: false,
            };
        case SIGN_OUT:
            return {
                ...state,
                isSignout: true,
                isVisible: false,
                isConfig: false,
                userToken: null,
                project: null,
            };
        case PROJECT_ACTIVE:
            return {
                ...state,
                project: action.project
            };
        case PROJECT_CLOSE:
            return {
                ...state,
                project: null
            };
        case CONFIG:
            return {
                ...state,
                isLoading: false,
                isVisible: false,
                isConfig: action.isConfig
            }
        case CONFIG_SAVE:
            return {
                ...state,
                isLoading: true,
                isSignout: true,
                isVisible: false,
                isConfig: false,
                userToken: null,
                empresa: null,
                project: null
            }
        default: return state;
    }
}

export default reducer;