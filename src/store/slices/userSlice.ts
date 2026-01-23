import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Clinic {
  id: string;
  name: string;
  role: string;
  is_admin: boolean;
}

interface Organization {
  id: string;
  name: string;
  is_owner: boolean;
  clinics: Clinic[];
}

interface UserData {
  user_id: string;
  name: string;
  organization: Organization | null;
}

interface UserState {
  userData: UserData | null;
  currentClinic: Clinic | null;
  currentContext: 'organization' | 'clinic' | 'my-practice';
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userData: null,
  currentClinic: null,
  currentContext: 'my-practice',
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<UserData>) => {
      state.userData = action.payload;
      // Set the first clinic as current if available, otherwise default to my-practice
      if (action.payload.organization?.clinics.length > 0) {
        state.currentClinic = action.payload.organization.clinics[0];
        state.currentContext = 'clinic';
      } else {
        state.currentContext = 'my-practice';
      }
    },
    setCurrentClinic: (state, action: PayloadAction<Clinic | null>) => {
      state.currentClinic = action.payload;
      state.currentContext = action.payload ? 'clinic' : 'organization';
    },
    setCurrentContext: (state, action: PayloadAction<'organization' | 'clinic' | 'my-practice'>) => {
      state.currentContext = action.payload;
      if (action.payload === 'my-practice') {
        state.currentClinic = null;
      }
    },
    clearUserData: (state) => {
      state.userData = null;
      state.currentClinic = null;
      state.currentContext = 'my-practice';
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUserData, setCurrentClinic, setCurrentContext, clearUserData, setLoading, setError } = userSlice.actions;
export { userSlice };
export default userSlice.reducer;