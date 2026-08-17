/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainPage from './components/MainPage';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
                Batch Test Codes
              </h1>
              <nav className="flex space-x-4">
                <Link
                  to="/admin"
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Admin Panel
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
