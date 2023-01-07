import classNames from "classnames";
import {
  Link,
  Navigate,
  resolvePath,
  Route,
  Routes,
  useLocation,
  useResolvedPath,
} from "react-router-dom";

export default function RoutingNav({
  entries,
}: {
  entries: {
    path: string;
    label: string;
    element: React.FunctionComponent;
  }[];
}) {
  const baseLocation = useResolvedPath(".").pathname;
  const location = useLocation().pathname;
  return (
    <>
      <ul className="nav nav-tabs">
        {entries.map((e, idx) => {
          const active = location.startsWith(
            resolvePath(e.path, baseLocation).pathname
          );
          return (
            <li className="nav-item" key={idx}>
              <Link
                className={classNames("nav-link", {
                  active,
                })}
                to={e.path}
              >
                {e.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Routes>
        {entries.map((e, idx) => (
          <Route key={idx} path={e.path + "/*"} element={<e.element />} />
        ))}
        <Route path="" element={<Navigate to={entries[0].path} />} />
      </Routes>
    </>
  );
}
