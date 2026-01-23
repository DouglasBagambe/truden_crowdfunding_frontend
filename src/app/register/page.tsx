'use client';

import React, { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { authService } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    surname: '',
    givenName: '',
    middleName: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.givenName,
        lastName: formData.surname,
        // Optional middle name handling if backend supports it
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 italic">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <FormInput name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />
          <FormInput name="surname" type="text" placeholder="Surname" value={formData.surname} onChange={handleChange} />
          <FormInput name="givenName" type="text" placeholder="Given name" value={formData.givenName} onChange={handleChange} />
          <FormInput name="middleName" type="text" placeholder="Middle name (Optional)" value={formData.middleName} onChange={handleChange} />
          
          <div className="relative group">
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-[#f1f5f9] border-none rounded-xl py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group">
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-[#f1f5f9] border-none rounded-xl py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
            />
            <button type="button" className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Eye className="w-5 h-5" />
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition-all mt-6 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Sign Up
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-gray-500 font-medium">
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Or, Sign In here.
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  );
}

const FormInput = ({ name, type, placeholder, value, onChange }: any) => (
  <div className="relative group">
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={name !== 'middleName'}
      className="w-full bg-[#f1f5f9] border-none rounded-xl py-4 px-6 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
    />
  </div>
);
