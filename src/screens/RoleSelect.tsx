import { Link } from 'react-router-dom';

export function RoleSelect() {
  return (
    <div className="role-select">
      <h1>Molofu4</h1>
      <p className="tagline">管理負擔 — Manage the Burden</p>
      <div className="role-cards">
        <Link to="/commander" className="role-card">
          <span className="role-icon">👩‍💼</span>
          <h3>Sarah</h3>
          <p>Commander</p>
        </Link>
        <Link to="/helper" className="role-card">
          <span className="role-icon">👩‍🍳</span>
          <h3>Maria</h3>
          <p>Helper</p>
        </Link>
        <Link to="/observer" className="role-card">
          <span className="role-icon">✈️</span>
          <h3>David</h3>
          <p>Observer</p>
        </Link>
      </div>
    </div>
  );
}
