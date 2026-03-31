import React from 'react';
import { NavLink } from 'react-router-dom';

const navigationGroups = [

    {
        label: 'Inside Board',
        items: [
            { label: 'Bookings', path: '/bookings', icon: '📦' },
            { label: 'Companies', path: '/companies', icon: '🏢' },
            { label: 'Categories', path: '/categories', icon: '🏷' },
            { label: 'Users', path: '/users', icon: '👤' },
            { label: 'Offers', path: '/offers', icon: '🎁' },
            { label: 'Transactions', path: '/transactions', icon: '💸' },
        ],
    }
];

const Sidebar: React.FC = () => {
    return (
        <aside className="sidebar">
            <div>
                <h2 className="sidebar-brand">
                    Cleany<span> Admin</span>
                </h2>

                <nav aria-label="Sidebar Navigation" className="sidebar-nav">
                    {navigationGroups.map((group) => (
                        <div key={group.label} className="sidebar-group">
                            <p className="sidebar-group-label">{group.label}</p>
                            <ul className="sidebar-list">
                                {group.items.map((item) => (
                                    <li key={item.path} className="sidebar-item">
                                        <NavLink
                                            to={item.path}
                                            end={item.path === '/'}
                                            className={({ isActive }) =>
                                                isActive
                                                    ? 'sidebar-link sidebar-link-active'
                                                    : 'sidebar-link'
                                            }
                                        >
                                            <span>{item.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>

        </aside>
    );
};

export default Sidebar;