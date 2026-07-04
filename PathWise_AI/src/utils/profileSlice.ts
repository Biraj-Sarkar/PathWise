import { createSlice } from '@reduxjs/toolkit';

const savedProfile = localStorage.getItem("userProfile");

const initialState = {
  userProfile: savedProfile ? JSON.parse(savedProfile) : {}
};


const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.userProfile = action.payload.userProfile;
      localStorage.setItem("userProfile", JSON.stringify(action.payload.userProfile));
    },
    clearProfile: (state) => {
      state.userProfile = {};
      localStorage.removeItem("userProfile");
    }
  }
});

export const { setProfile, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;