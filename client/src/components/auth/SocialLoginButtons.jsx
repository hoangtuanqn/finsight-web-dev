import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function SocialLoginButtons({ setError }) {
  const { loginWithGoogle, loginWithFacebook, googleClientId, facebookAppId } = useAuth();
  const navigate = useNavigate();
  const [dark] = useDarkMode();

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

  if (!googleClientId || !facebookAppId) {
    return (
      <div className="mb-6 w-full flex justify-center">
        <button 
          type="button"
          onClick={() => setError('Vui lòng thêm GOOGLE_CLIENT_ID và FACEBOOK_APP_ID vào server/.env và bật lại Server')}
          className="flex items-center justify-center gap-3 w-full max-w-[400px] py-3 rounded-[4px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition opacity-80"
        >
          Tiếp tục với Google / Facebook (Chưa cấu hình)
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 w-full flex justify-center items-center gap-4 max-w-[400px] mx-auto">
      <GoogleOAuthProvider clientId={googleClientId}>
        <div>
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

      <div>
        <FacebookLogin
          appId={facebookAppId}
          autoLoad={false}
          fields="name,email,picture"
          callback={handleFacebookSuccess}
          render={renderProps => (
            <button
              type="button"
              onClick={renderProps.onClick}
              className="w-[40px] h-[40px] flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-[4px] shadow-sm transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          )}
        />
      </div>
    </div>
  );
}
