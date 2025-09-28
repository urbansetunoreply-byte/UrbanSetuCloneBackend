import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { signInSuccess } from '../redux/user/userSlice.js';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { authenticatedFetch } from '../utils/csrf';

import { API_BASE_URL } from '../config/api.js';

export default function Oauth({ pageType }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleClick = async () => {
        try {
            const provider = new GoogleAuthProvider();
            // Add additional scopes and configuration
            provider.addScope('email');
            provider.addScope('profile');
            
            const auth = getAuth();
            // Configure popup behavior to avoid CORS issues
            const result = await signInWithPopup(auth, provider);
            
            const apiUrl = "/api/auth/google";
            const res = await authenticatedFetch(`${API_BASE_URL}${apiUrl}`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    photo: result.user.photoURL
                })
            });
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            if (data.success === false) {
                throw new Error(data.message || 'Authentication failed');
            }
            
            dispatch(signInSuccess(data));
            
            // Navigate based on user role
            if (data.role === "admin" || data.role === "rootadmin") {
                navigate("/admin");
            } else {
                navigate("/user");
            }
        } catch (error) {
            console.error(`Error with Google ${pageType}:`, error);
            // Handle specific error types
            if (error.code === 'auth/popup-closed-by-user') {
                console.log('User closed the popup');
            } else if (error.code === 'auth/popup-blocked') {
                console.log('Popup was blocked by browser');
            } else {
                console.error('Authentication error:', error.message);
            }
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleClick}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label={`${pageType === "signIn" ? "Sign In" : "Sign Up"} with Google`}
        >
            <FcGoogle className="text-xl" />
            {pageType === "signIn" ? "Sign In with Google" : "Sign Up with Google"}
        </button>
    );
}
