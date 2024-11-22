import { useState, FormEvent } from 'react';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  error: string;
}

const AuthForm = ({ onSubmit, error }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: ''
  });

  const validateForm = () => {
    const errors = {
      email: '',
      password: ''
    };

    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      errors.password = 'パスワードを入力してください';
    } else if (password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }

    setValidationErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearEmail = () => setEmail('');
  const clearPassword = () => setPassword('');

  return (
    <div className="min-h-screen h-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="relative">
              <label htmlFor="email" className="sr-only">メールアドレス</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
              />
              {email && (
                <button
                  type="button"
                  onClick={clearEmail}
                  aria-label="メールアドレスをクリア"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <FaTimes className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">パスワード</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                {password && (
                  <button
                    type="button"
                    onClick={clearPassword}
                    aria-label="パスワードをクリア"
                  >
                    <FaTimes className="text-gray-400" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="パスワードを表示"
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-gray-400" />
                  ) : (
                    <FaEye className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {(validationErrors.email || validationErrors.password || error) && (
            <div className="text-red-500 text-sm">
              {validationErrors.email && <p>{validationErrors.email}</p>}
              {validationErrors.password && <p>{validationErrors.password}</p>}
              {error && <p>{error}</p>}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;