import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Lock, User, Eye, EyeOff, Waves } from 'lucide-react'

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
    
    if (data.username === 'admin' && data.password === '123456') {
      onLogin(true)
      navigate('/admin/dashboard')
    } else {
      setLoginError('שם משתמש או סיסמא שגויים')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F9FA] to-[#B4D2D9]/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="דגי בקעת אונו" 
              className="h-20 w-auto"
            />
          </div>
          <div className="w-16 h-16 bg-[#023859] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-[#023859]">
            כניסת מנהל
          </h2>
          <p className="mt-2 text-[#013440]/60">
            דגי בקעת אונו - ממשק ניהול
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-ocean p-8 border border-[#B4D2D9]/30">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#023859] mb-2">
                  שם משתמש
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#6FA8BF]" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    {...register('username', { required: 'שם משתמש הוא שדה חובה' })}
                    className="w-full px-4 py-3 pr-10 bg-white rounded-lg transition-all duration-200 border-2 border-[#B4D2D9] focus:border-[#026873] focus:outline-none focus:ring-2 focus:ring-[#026873]/20"
                    placeholder="הכנס שם משתמש"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#023859] mb-2">
                  סיסמא
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#6FA8BF]" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: 'סיסמא היא שדה חובה' })}
                    className="w-full px-4 py-3 pr-10 pl-10 bg-white rounded-lg transition-all duration-200 border-2 border-[#B4D2D9] focus:border-[#026873] focus:outline-none focus:ring-2 focus:ring-[#026873]/20"
                    placeholder="הכנס סיסמא"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#6FA8BF] hover:text-[#026873]" />
                    ) : (
                      <Eye className="h-5 w-5 text-[#6FA8BF] hover:text-[#026873]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#026873] hover:bg-[#013440] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-ocean hover:shadow-lg"
            >
              התחבר
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-[#026873] hover:text-[#013440] text-sm font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <Waves className="w-4 h-4" />
                חזרה לאתר הראשי
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
