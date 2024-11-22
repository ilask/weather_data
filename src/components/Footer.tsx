import React from 'react';
import Link from 'next/link';

interface FooterProps {
  copyright?: string;
}

const Footer: React.FC<FooterProps> = ({ 
  copyright = '© 2024 Weather Data Platform'
}) => {
  return (
    <footer className="fixed bottom-0 w-full bg-white border-t px-4 py-3 md:px-6 lg:px-8">
      <div className="flex justify-between items-center" data-testid="footer-content">
        <p className="text-sm text-gray-500">{copyright}</p>
        <Link href="/support" className="text-sm text-blue-500 hover:text-blue-700">
          サポート情報
        </Link>
      </div>
    </footer>
  );
};

export default Footer;