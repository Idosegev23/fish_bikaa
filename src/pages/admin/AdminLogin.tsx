import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

interface AdminLoginProps {
  onLogin: (isAdmin: boolean) => void
}

interface LoginForm {
  username: string
  password: string
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoginError('')
    
    // בדיקת פרטי כניסה (admin/123456)
    if (data.username === 'admin' && data.password === '123456') {
      onLogin(true)
      navigate('/admin/dashboard')
    } else {
      setLoginError('שם משתמש או סיסמא שגויים')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16">
              <img 
                src="/logo.png" 
                alt="דגי בקעת אונו" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>
          <Lock className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            כניסת אדמין
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            דגי בקעת אונו - ממשק ניהול
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                שם משתמש
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  {...register('username', { required: 'שם משתמש הוא שדה חובה' })}
                  className="input-field pr-10"
                  placeholder="הכנס שם משתמש"
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                סיסמא
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'סיסמא היא שדה חובה' })}
                  className="input-field pr-10 pl-10"
                  placeholder="הכנס סיסמא"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full btn-primary py-3 text-lg"
            >
              התחבר
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
        className="text-primary-600 hover:text-primary-700 text-sm"
            >
              ← חזרה לאתר הראשי
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 