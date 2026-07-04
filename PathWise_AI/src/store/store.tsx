import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../utils/authSlice';
import profileReducer from '../utils/profileSlice';
import sidebarReducer from '../utils/sidebarSlice';
import introReducer from '../utils/introSlice';
import chatReducer from '../utils/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    sidebar: sidebarReducer,
    intro: introReducer,
    chat: chatReducer,
  }
});