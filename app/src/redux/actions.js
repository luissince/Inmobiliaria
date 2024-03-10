import { RESTORE_TOKEN, SIGN_IN, SIGN_OUT, PROJECT_ACTIVE, PROJECT_CLOSE, CONFIG, CONFIG_SAVE, ADD_NOTIFICATION } from './types';

export const restoreToken = (user, empresa) => (
    {
        type: RESTORE_TOKEN,
        token: user,
        empresa: empresa
    }
)

export const signIn = (user, project = null) => (
    {
        type: SIGN_IN,
        token: user,
        project: project
    }
)

export const signOut = () => (
    {
        type: SIGN_OUT
    }
)

export const selectProject = (project) => (
    {
        type: PROJECT_ACTIVE,
        project: project
    }
)

export const closeProject = () => (
    {
        type: PROJECT_CLOSE
    }
)

export const config = () => (
    {
        type: CONFIG,
        isConfig: true
    }
)

export const configSave = () => (
    {
        type: CONFIG_SAVE,
    }
)

export const addNotification = (value) => (
    {
        type: ADD_NOTIFICATION,
        value: value
    }
);

