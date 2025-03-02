import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X, User, LogOut, Users, Home, PlusCircle,FlipHorizontal } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
            <FlipHorizontal className="h-8 w-8 text-blue-600" />
              <Link to="/" className="text-xl font-bold text-blue-600">
                SplitMate
              </Link>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
              <Home className="inline-block mr-1 h-5 w-5" />
              Dashboard
            </Link>
            <Link to="/friends" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
              <Users className="inline-block mr-1 h-5 w-5" />
              Friends
            </Link>
            <Link to="/groups/create" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
              <PlusCircle className="inline-block mr-1 h-5 w-5" />
              New Group
            </Link>
            <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
              <User className="inline-block mr-1 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <LogOut className="inline-block mr-1 h-5 w-5" />
              Logout
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              <Home className="inline-block mr-2 h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/friends"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              <Users className="inline-block mr-2 h-5 w-5" />
              Friends
            </Link>
            <Link
              to="/groups/create"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              <PlusCircle className="inline-block mr-2 h-5 w-5" />
              New Group
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              <User className="inline-block mr-2 h-5 w-5" />
              Profile
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600"
            >
              <LogOut className="inline-block mr-2 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;