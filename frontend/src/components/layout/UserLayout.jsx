import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

// UserLayout no longer has a sidebar — Navbar handles all user navigation.
// This wrapper simply composes Navbar + page content + Footer.
export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
