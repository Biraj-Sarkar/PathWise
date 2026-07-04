import { createSlice } from "@reduxjs/toolkit";

const getInitialIntroState = () => {
  try {
    const saved = localStorage.getItem("showIntro");
    if (!saved) return { showIntro: true, timeout: 0 };

    const { showIntro, timeout } = JSON.parse(saved);
    
    // Check if 24 hours have passed since the timeout was set
    if (!showIntro && Date.now() > timeout) {
      return { showIntro: true, timeout: 0 }; // 24h passed, show it again
    }

    return { showIntro, timeout };
  } catch (error) {
    return { showIntro: true, timeout: 0 };
  }
};

export const introSlice = createSlice({
  name: "intro",
  initialState: getInitialIntroState(),
  reducers: {
    setIntroStatus: (state, action) => {
      state.showIntro = action.payload.showIntro;
      state.timeout = action.payload.timeout;
      localStorage.setItem("showIntro", JSON.stringify(action.payload));
    }
  }
});

export const { setIntroStatus } = introSlice.actions;
export default introSlice.reducer;