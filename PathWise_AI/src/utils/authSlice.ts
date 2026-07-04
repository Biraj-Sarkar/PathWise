import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userInfo: {},
  token: localStorage.getItem("token") || null,
  isAuthenticated: !!localStorage.getItem("token")
};


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload.userInfo;
      state.token = action.payload.token;
      state.isAuthenticated = !!action.payload.token;
      
      localStorage.setItem("token", action.payload.token);
    },
    clearCredentials: (state) => {
      state.userInfo = {};
      state.token = null;
      state.isAuthenticated = false;
      
      localStorage.removeItem("token");
    }
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;