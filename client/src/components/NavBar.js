import { Link, useMatch, useResolvedPath } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="nav">
      <Link to="/" className="site-title">
        Lockout OJ
      </Link>
      <ul>
        <CustomLink to="/problem-recommendation">Problem Recommendation</CustomLink>
      </ul>
      <ul>
        <CustomLink to="/room-list">Join Room</CustomLink>
      </ul>
      <ul>
        <CustomLink to="/matchmaking">Ranked Duel</CustomLink>
      </ul>
      <ul>
        <CustomLink to="/duel-history">Duel History</CustomLink>
      </ul>
    </nav>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = useMatch({ path: resolvedPath.pathname, end: true });

  return (
    <li className={isActive ? "active" : ""}>
      <Link to={to} {...props}>
        {children}
      </Link>
    </li>
  );
}
