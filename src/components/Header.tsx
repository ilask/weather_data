import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMenu, FiX, FiUser, FiChevronDown, FiLogOut } from 'react-icons/fi';

interface UserInfo {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface HeaderProps {
  title: string;
  user: UserInfo | null;
  onLogout: () => void;
}

const Header = ({ title, user, onLogout }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <header className="bg-[#2C3E50] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="https://placehold.co/40x40"
                alt="ロゴ"
                width={40}
                height={40}
                className="rounded"
              />
              <span className="ml-2 text-xl font-semibold">{title}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 hover:bg-[#34495E] px-3 py-2 rounded-md"
                  aria-label="ユーザーメニュー"
                >
                  <FiUser className="h-5 w-5" />
                  <span>{user.name}</span>
                  <span className="text-sm text-gray-300">({user.role})</span>
                  <FiChevronDown className="h-4 w-4" />
                </button>

                {isUserMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-md shadow-lg py-1"
                  >
                    <button
                      onClick={onLogout}
                      className="flex items-center w-full px-4 py-2 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-2" />
                      ログアウト
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hover:bg-[#34495E] px-3 py-2 rounded-md"
              >
                ログイン
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md hover:bg-[#34495E]"
              aria-label="メニュー"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav role="navigation" className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="px-3 py-2 text-sm">
                  <div>{user.name}</div>
                  <div className="text-gray-300">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-3 py-2 rounded-md hover:bg-[#34495E]"
                >
                  <FiLogOut className="mr-2" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md hover:bg-[#34495E]"
              >
                ログイン
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;