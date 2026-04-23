import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useEffect, useState } from 'react';

const GoogleFallback = ({ setError, dark }) => (
  <button 
    type="button"
    onClick={() => setError('Google chưa được cấu hình. ID bị thiếu.')}
    className={`flex items-center justify-center w-[40px] h-[40px] bg-slate-100 dark:bg-slate-800 border ${dark ? 'border-none' : 'border-slate-300'} rounded-[4px] cursor-pointer opacity-70 hover:opacity-100 transition`}
  >
    <svg className="w-[18px] h-[18px] grayscale" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  </button>
);

const FacebookFallback = ({ setError, dark }) => (
  <button 
    type="button"
    onClick={() => setError('Facebook chưa được cấu hình. ID bị thiếu.')}
    className={`flex items-center justify-center w-[40px] h-[40px] bg-slate-100 dark:bg-slate-800 border ${dark ? 'border-none' : 'border-slate-300'} rounded-[4px] cursor-pointer opacity-70 hover:opacity-100 transition`}
  >
    <svg className="w-[18px] h-[18px] grayscale" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  </button>
);

export default function SocialLoginButtons({ setError }) {
  const { loginWithGoogle, loginWithFacebook, googleClientId, facebookAppId } = useAuth();
  const navigate = useNavigate();
  const [dark] = useDarkMode();
  const [isFbLoaded, setIsFbLoaded] = useState(false);

  useEffect(() => {
    if (!facebookAppId) return;

    if (!document.getElementById('facebook-jssdk')) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : facebookAppId,
          cookie     : true,
          xfbml      : true,
          version    : 'v19.0'
        });
        setIsFbLoaded(true);
      };

      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.appendChild(js);
    } else if (window.FB) {
      setIsFbLoaded(true);
    }
  }, [facebookAppId]);

  const handleFacebookSuccess = async (response) => {
    try {
      if (response.accessToken) {
        await loginWithFacebook(response.accessToken);
        navigate('/home');
      } else {
        setError('Đăng nhập Facebook bị hủy hoặc lỗi.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng nhập Facebook thất bại');
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK chưa được tải.');
      return;
    }
    
    window.FB.login((response) => {
      if (response.authResponse) {
        handleFacebookSuccess(response.authResponse);
      } else {
        setError('Đăng nhập Facebook bị hủy hoặc lỗi.');
      }
    }, { scope: 'email,public_profile' });
  };

  return (
    <div className="mb-6 w-full flex justify-center items-center gap-4 max-w-[400px] mx-auto">
      {/* Google Container */}
      <div className="flex-1 flex justify-end">
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            <div className="h-[40px] overflow-hidden rounded-[4px] shadow-sm">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    await loginWithGoogle(credentialResponse.credential);
                    navigate('/home');
                  } catch (err) {
                    setError(err?.response?.data?.error || 'Đăng nhập Google thất bại');
                  }
                }}
                onError={() => setError('Đăng nhập Google thất bại')}
                theme={dark ? "filled_black" : "outline"}
                size="large"
                type="icon"
                shape="square"
              />
            </div>
          </GoogleOAuthProvider>
        ) : (
          <GoogleFallback setError={setError} dark={dark} />
        )}
      </div>

      {/* Facebook Container */}
      <div className="flex-1 flex justify-start">
        {facebookAppId ? (
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={!isFbLoaded}
            className={`w-[40px] h-[40px] flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-[4px] shadow-sm transition border-none ${!isFbLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        ) : (
          <FacebookFallback setError={setError} dark={dark} />
        )}
      </div>
    </div>
  );
}
