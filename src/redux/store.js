import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import accessReducer from './slices/accessSlice';
import directoryReducer from './slices/directorySlice';
import organizationReducer from './slices/organizationSlice';
import assetsReducer from './slices/assetsSlice';
import onboardingReducer from './slices/onboardingSlice';
import tasksReducer from './slices/tasksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    access: accessReducer,
    directory: directoryReducer,
    organization: organizationReducer,
    assets: assetsReducer,
    onboarding: onboardingReducer,
    tasks: tasksReducer,
  },
});

export default store;
