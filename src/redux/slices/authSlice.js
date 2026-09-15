import { createSlice } from '@reduxjs/toolkit';

// Safely read initial user and auth state from localStorage
const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

const initialState = {
  user: initialUser,
  role: initialUser?.roleCode || initialUser?.roleName || null,
  permissions: [],
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      const { user, role, permissions } = action.payload || {};
      state.user = user || null;
      state.role = role || user?.roleCode || user?.roleName || null;
      state.permissions = Array.isArray(permissions) ? permissions : [];
      state.isAuthenticated = Boolean(user);
    },
    clearAuth: (state) => {
      state.user = null;
      state.role = null;
      state.permissions = [];
      state.isAuthenticated = false;
    },
    setPermissions: (state, action) => {
      state.permissions = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { setAuth, clearAuth, setPermissions } = authSlice.actions;

export default authSlice.reducer;
