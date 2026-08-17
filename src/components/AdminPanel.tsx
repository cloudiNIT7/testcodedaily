import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { BatchTime, TestCodes } from '../types';

const BATCHES: BatchTime[] = ['7:30 am', '9:00 am', '10:30 am', '7:30 pm'];

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [testCodes, setTestCodes] = useState<TestCodes>({
    '7:30 am': '',
    '9:00 am': '',
    '10:30 am': '',
    '7:30 pm': ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch('/api/test-codes')
      .then((res) => res.json())
      .then((data: Record<string, any>) => {
        const formCodes: Record<string, string> = {};
        Object.keys(data).forEach(key => {
          formCodes[key] = typeof data[key] === 'object' ? data[key].code : data[key];
        });
        setTestCodes(formCodes as TestCodes);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load test codes', err);
        setLoading(false);
      });
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  const handleChange = (batch: BatchTime, value: string) => {
    setTestCodes(prev => ({
      ...prev,
      [batch]: value
    }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch('/api/test-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testCodes)
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Session expired');
        }
        throw new Error('Failed to save');
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-neutral-600" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Admin Access
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Please enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 mt-6"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{isLoggingIn ? 'Verifying...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Admin Panel
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Update the test codes for all batches below.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-3 py-2"
            >
              Sign out
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center space-x-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {saveStatus === 'success' && (
            <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-4 rounded-xl border border-green-200">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium text-sm">Changes saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-2 text-red-700 bg-red-50 p-4 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-sm">Failed to save changes. Please try again.</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
            </div>
          ) : (
            <div className="space-y-4">
              {BATCHES.map((batch) => (
                <div key={batch} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
                  <div className="w-32 font-medium text-neutral-700 flex-shrink-0">
                    {batch} Batch
                  </div>
                  <input
                    type="text"
                    value={testCodes[batch] || ''}
                    onChange={(e) => handleChange(batch, e.target.value)}
                    placeholder="Enter test code (e.g. TC-4092)"
                    className="flex-1 w-full bg-white border border-neutral-300 rounded-lg px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
