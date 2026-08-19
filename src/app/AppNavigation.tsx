import { NavLink } from 'react-router-dom'

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 12h16.4M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5S14.3 18.2 12 20.5M12 3.5C9.7 5.8 8.5 8.6 8.5 12s1.2 6.2 3.5 8.5" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.2c2.9-.7 5.5-.2 8 1.5v12c-2.5-1.7-5.1-2.2-8-1.5zM20 5.2c-2.9-.7-5.5-.2-8 1.5v12c2.5-1.7 5.1-2.2 8-1.5z" />
    </svg>
  )
}

export function AppNavigation() {
  return (
    <nav className="app-navigation" aria-label="My Geo 主导航">
      <div className="app-navigation-brand" aria-hidden="true">
        <span>M</span>
      </div>
      <NavLink
        to="/explore"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="探索地球"
      >
        <GlobeIcon />
        <span>探索</span>
      </NavLink>
      <NavLink
        to="/knowledge"
        className={({ isActive }) =>
          isActive ? 'app-navigation-link is-active' : 'app-navigation-link'
        }
        aria-label="知识体系"
      >
        <BookIcon />
        <span>知识</span>
      </NavLink>
    </nav>
  )
}
