import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from '../redux/user/userSlice';
import { persistor } from '../redux/store';
import { reconnectSocket } from '../utils/socket';
import { socket } from '../utils/socket';
import { toast } from 'react-toastify';

export const useSignout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signout = async (options = {}) => {
    const { 
      showToast = true, 
      navigateTo = "/", 
      delay = 50,
      onSuccess,
      onError,
      preventEvent = false
    } = options;

    try {
      setIsSigningOut(true);
      dispatch(signoutUserStart());
      const res = await fetch(`${API_BASE_URL}/api/auth/signout`, { credentials: 'include' });
      const data = await res.json();
      
      if (data.success === false) {
        dispatch(signoutUserFailure(data.message));
        if (onError) onError(data.message);
        return;
      }
      
      dispatch(signoutUserSuccess(data));
      
      // Clear persisted state
      await persistor.purge();
      
      // Clear all tokens and cookies
      localStorage.removeItem('accessToken');
      document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=None; Secure';
      document.cookie = 'refresh_token=; Max-Age=0; path=/; SameSite=None; Secure';
      document.cookie = 'session_id=; Max-Age=0; path=/; SameSite=None; Secure';
      
      // Disconnect socket completely before reconnecting
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      // Reconnect socket with cleared auth
      reconnectSocket();
      
      if (showToast) {
        toast.info("You have been signed out.");
      }
      
      if (onSuccess) onSuccess();
      
      await new Promise(resolve => setTimeout(resolve, delay));
      setIsSigningOut(false);
      navigate(navigateTo, { replace: true });
      
    } catch (error) {
      dispatch(signoutUserFailure(error.message));
      
      // Clear all authentication state even on error
      dispatch(signoutUserSuccess());
      await persistor.purge();
      
      // Clear all tokens and cookies
      localStorage.removeItem('accessToken');
      document.cookie = 'access_token=; Max-Age=0; path=/; SameSite=None; Secure';
      document.cookie = 'refresh_token=; Max-Age=0; path=/; SameSite=None; Secure';
      document.cookie = 'session_id=; Max-Age=0; path=/; SameSite=None; Secure';
      
      // Disconnect socket completely before reconnecting
      if (socket && socket.connected) {
        socket.disconnect();
      }
      
      // Reconnect socket with cleared auth
      reconnectSocket();
      
      if (showToast) {
        toast.info("You have been signed out.");
      }
      
      if (onError) onError(error.message);
      setIsSigningOut(false);
      navigate(navigateTo, { replace: true });
    }
  };

  return { signout, isSigningOut };
};
