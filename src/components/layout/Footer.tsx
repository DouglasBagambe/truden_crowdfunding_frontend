import React from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">About Us</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Contact</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Careers</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">Blog</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Help Center</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Whitepaper</Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-900">Follow Us</h4>
            <div className="flex gap-4">
              <Link href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 shadow-sm">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 shadow-sm">
                <Instagram className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 bg-white rounded-lg border border-gray-100 text-gray-400 hover:text-blue-600 shadow-sm">
                <Facebook className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 font-medium">© 2024 Truden. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
