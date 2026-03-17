import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pay from './pages/Pay';
import Transactions from './pages/Transactions';
import ExamFee from './pages/ExamFee';
import AddMoney from './pages/AddMoney';
import EventFee from './pages/EventFee';
import Transport from './pages/Transport';
import CanteenPanel from './pages/CanteenPanel';
import Canteen from './pages/Canteen';
import Settings from './pages/Settings';
import AdminManage from './pages/AdminManage';
import AdminDashboard from './pages/AdminDashboard';
import QRScanner from './pages/QRScanner';
import Statement from './pages/Statement';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/canteen-panel" element={<CanteenPanel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pay" element={<PrivateRoute><Pay /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="/campus-fee" element={<PrivateRoute><ExamFee /></PrivateRoute>} />
          <Route path="/add-money" element={<PrivateRoute><AddMoney /></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><EventFee /></PrivateRoute>} />
          <Route path="/transport" element={<PrivateRoute><Transport /></PrivateRoute>} />
          <Route path="/canteen" element={<PrivateRoute><Canteen /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/admin-manage" element={<PrivateRoute><AdminManage /></PrivateRoute>} />
          <Route path="/admin-dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
          <Route path="/qr-scanner" element={<PrivateRoute><QRScanner /></PrivateRoute>} />
          <Route path="/statement" element={<PrivateRoute><Statement /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
