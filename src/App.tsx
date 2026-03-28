import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Companies from './pages/Companies';
import Categories from './pages/Categories';
import Offers from './pages/Offers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Login from './pages/Login';
import './assets/styles/global.css';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <MainLayout navbar={<Navbar />}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/companies" element={<Companies />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/offers" element={<Offers />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
};

export default App;