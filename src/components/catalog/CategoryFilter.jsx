import { NavLink } from 'react-router-dom';
import { CATEGORIES, EVENT_TYPES } from '../../lib/constants.js';
import { logEvent } from '../../lib/analytics.js';

const pillClass = (isActive) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-500 text-white'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
  }`;

export default function CategoryFilter() {
  return (
    <div className="flex flex-wrap gap-2">
      <NavLink to="/catalog" end className={({ isActive }) => pillClass(isActive)}>
        All Prints
      </NavLink>
      {CATEGORIES.map((cat) => (
        <NavLink
          key={cat.id}
          to={`/catalog/${cat.id}`}
          className={({ isActive }) => pillClass(isActive)}
          onClick={() =>
            logEvent(EVENT_TYPES.CATEGORY_CLICK, {
              targetId: cat.id,
              targetName: cat.name,
              category: cat.id,
              metadata: { location: 'catalog_filter' },
            })
          }
        >
          {cat.name}
        </NavLink>
      ))}
    </div>
  );
}
