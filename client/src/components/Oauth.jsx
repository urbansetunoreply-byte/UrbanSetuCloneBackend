import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { app } from '../firebase';
import { signInSuccess } from '../redux/user/userSlice.js';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { authenticatedFetch } from '../utils/csrf';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Oauth({ pageType }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleClick = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const auth = getAuth();
            const result = await signInWithPopup(auth, provider);
            const apiUrl = "/api/auth/google";
            const res = await authenticatedFetch(`${API_BASE_URL}${apiUrl}`, {
                method: "POST",
                body: JSON.stringify({
                    name: result.user.displayName,
                    email: result.user.email,
                    photo: result.user.photoURL
                })
            });
            const data = await res.json();
            dispatch(signInSuccess(data));
            navigate("/");
        } catch (error) {
            console.log(`Error with Google ${pageType}`, error);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGoogleClick}
            className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition duration-200"
        >
            <FcGoogle className="text-xl" />
            {pageType === "signIn" ? "Sign In with Google" : "Sign Up with Google"}
        </button>
    );
}
