import React from 'react';

const statCards = [
    { label: 'TOTAL ORDERS', value: '1,284', icon: '📦', tone: 'blue' },
    { label: 'COMPANIES', value: '78', icon: '🏢', tone: 'red' },
    { label: 'CATEGORIES', value: '42', icon: '🏷️', tone: 'purple' },
    { label: 'USERS', value: '986', icon: '👤', tone: 'yellow' },
    { label: 'GROUPS', value: '16', icon: '📋', tone: 'cyan' },
    { label: 'ACTIVE ORDERS', value: '367', icon: '🔄', tone: 'orange' },
    { label: 'COMPLETED', value: '812', icon: '✅', tone: 'green' },
    { label: 'PENDING', value: '105', icon: '⏳', tone: 'gold' },
];

const Dashboard: React.FC = () => {
    return (
        <section className="cyber-dashboard">
            <div className="cyber-page-header">
                <div>
                    <p className="cyber-page-kicker">Live Overview</p>
                    <h2 className="cyber-page-title">Dark Operations Dashboard</h2>
                </div>
                <div className="cyber-page-chip">Realtime Node Matrix</div>
            </div>

            <div className="stat-grid">
                {statCards.map((card) => (
                    <article key={card.label} className={`stat-card stat-card-${card.tone}`}>
                        <div className="stat-card-icon" aria-hidden="true">
                            {card.icon}
                        </div>
                        <p className="stat-card-label">{card.label}</p>
                        <h3 className="stat-card-value">{card.value}</h3>
                    </article>
                ))}
            </div>

            {/* <div className="dashboard-panel-grid">
                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h3>Order Activity (Real-time)</h3>
                        <span>Live feed</span>
                    </div>
                    <div className="activity-bars" aria-hidden="true">
                        <span style={{ height: '58%' }} />
                        <span style={{ height: '84%' }} />
                        <span style={{ height: '67%' }} />
                        <span style={{ height: '92%' }} />
                        <span style={{ height: '54%' }} />
                        <span style={{ height: '76%' }} />
                        <span style={{ height: '61%' }} />
                        <span style={{ height: '88%' }} />
                    </div>
                </section>

                <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                        <h3>Order Distribution</h3>
                        <span>Segment map</span>
                    </div>
                    <div className="distribution-shell">
                        <div className="distribution-ring">
                            <div className="distribution-ring-center">72%</div>
                        </div>
                        <div className="distribution-legend">
                            <div>
                                <span className="legend-dot legend-dot-purple" />
                                Priority Orders
                            </div>
                            <div>
                                <span className="legend-dot legend-dot-cyan" />
                                Standard Orders
                            </div>
                            <div>
                                <span className="legend-dot legend-dot-gold" />
                                Pending Review
                            </div>
                        </div>
                    </div>
                </section>
            </div> */}
        </section>
    );
};

export default Dashboard;