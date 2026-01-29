'use client';

import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'INVESTOR'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roles: [formData.role]
      });
      toast.success("Account created! Please sign in.");
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="space-y-6">
        <header className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Join TruFund</h2>
            <p className="text-sm text-[var(--text-muted)] font-medium">Start your journey as an innovator or backer today.</p>
        </header>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">First Name</label>
                <input 
                    name="firstName" 
                    type="text" 
                    placeholder="John" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    className="input_field" 
                    required
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Last Name</label>
                <input 
                    name="lastName" 
                    type="text" 
                    placeholder="Doe" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    className="input_field" 
                    required
                />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Email Address</label>
            <input 
                name="email" 
                type="email" 
                placeholder="name@example.com" 
                value={formData.email} 
                onChange={handleChange} 
                className="input_field" 
                required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Create Password</label>
            <div className="relative">
                <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                className="input_field pr-12"
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">Account Role</label>
            <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="input_field appearance-none cursor-pointer"
            >
                <option value="INVESTOR">Investor</option>
                <option value="INNOVATOR">Innovator</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="button_primary w-full flex items-center justify-center gap-3 py-4 mt-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Global Account
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] font-medium pt-2">
            Already have an account? <Link href="/login" className="text-[var(--primary)] font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </AuthCard>
  );
}
