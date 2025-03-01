import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold ">SplitMate</Link>
        
        {isAuthenticated ? (
          <div className="flex items-center">
            <span className="mr-4">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register" className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800 transition">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
