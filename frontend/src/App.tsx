import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import CreateGroup from './pages/CreateGroup';
import Profile from './pages/Profile';
import ExpenseDetail from './pages/ExpenseDetail';
import CreateExpense from './pages/CreateExpense';
import SettlementDetail from './pages/SettlementDetail';
import Friends from './pages/Friends';
import Chat from './pages/Chat';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} /> 
              <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
              
              <Route path="/groups/create" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
              <Route path="/groups/:id" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
              
              <Route path="/expenses/create" element={<PrivateRoute><CreateExpense /></PrivateRoute>} />
              <Route path="/expenses/:id" element={<PrivateRoute><ExpenseDetail /></PrivateRoute>} />
              
              <Route path="/settlements/:id" element={<PrivateRoute><SettlementDetail /></PrivateRoute>} />
              
              <Route path="/chat/:type/:id" element={<PrivateRoute><Chat /></PrivateRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;