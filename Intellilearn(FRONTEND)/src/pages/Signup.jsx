import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const roleTitles = {
  student: 'Student',
  admin: 'Admin',
};

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('intellilearn_role');
    const isLoggedIn = localStorage.getItem('intellilearn_isLoggedIn') === 'true';
    if (!savedRole) {
      navigate('/select-role');
      return;
    }
    setRole(savedRole);
    // If already logged in, redirect to dashboard
    if (isLoggedIn) {
      if (savedRole === 'student') navigate('/dashboard/student', { replace: true });
      else if (savedRole === 'admin') navigate('/dashboard/admin', { replace: true });
      else navigate('/dashboard/student', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.confirm) return 'All fields are required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Invalid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Save auth state
      localStorage.setItem('intellilearn_signedup', 'true');
      localStorage.setItem('intellilearn_role', role);
      localStorage.setItem('intellilearn_isLoggedIn', 'true');
      localStorage.setItem('intellilearn_user', JSON.stringify({
        name: form.name,
        email: form.email,
        role: role
      }));
      setSuccess('Account created! Redirecting to your dashboard...');
      setTimeout(() => {
        if (role === 'student') navigate('/dashboard/student', { replace: true });
        else if (role === 'admin') navigate('/dashboard/admin', { replace: true });
        else navigate('/dashboard/student', { replace: true });
      }, 900);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f2c] to-[#2d1a4a] p-4">
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 w-full max-w-2xl border border-blue-900/30 shadow-xl flex flex-col gap-4"
        autoComplete="off"
      >
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-blue-200">Sign Up as {roleTitles[role]}</h2>
          <p className="text-slate-400 text-xs">Fill in your details to create your academic account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {['name', 'email', 'password', 'confirm'].map((field) => (
            <div key={field} className="relative">
              <input
                type={field.includes('password') ? 'password' : 'text'}
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="w-full px-4 pt-5 pb-1.5 bg-transparent border-b-2 border-blue-800/50 text-white focus:outline-none focus:border-blue-400 transition-all peer placeholder-transparent text-sm"
                placeholder={field === 'confirm' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                autoComplete="off"
              />
              <label
                className="absolute left-4 top-1 text-blue-300/70 text-[10px] uppercase tracking-wider font-bold pointer-events-none transition-all peer-focus:text-blue-400 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-blue-300"
              >
                {field === 'confirm' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-xs text-center font-medium bg-red-400/10 py-2 rounded-lg">{error}</div>}
        {success && <div className="text-green-400 text-xs text-center font-medium bg-green-400/10 py-2 rounded-lg">{success}</div>}
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <button 
            type="button"
            onClick={() => navigate('/select-role')}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Change Role
          </button>
          
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto px-10 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="animate-pulse">Creating Account...</span> : 'Create Account'}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
