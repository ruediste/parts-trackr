import React from "react";
import { Nav, Navbar } from "react-bootstrap";
import {
  BrowserRouter as Router,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InventoryEntriesPage from "./InventoryEntriesPage";
import PartsPage from "./PartsPage";
import PhotoUpload from "./PhotoUpload";
import SettingsPage from "./SettingsPage";

interface NavEntry {
  title: string;
  path: string;
  component: React.FunctionComponent;
}

let navEntries: NavEntry[] = [
  { title: "Parts", path: "/parts", component: PartsPage },
  {
    title: "Inventory Entries",
    path: "/inventoryEntries",
    component: InventoryEntriesPage,
  },
  { title: "Photo", path: "/photo", component: PhotoUpload },
  { title: "Settings", path: "/settings", component: SettingsPage },
];

function Navigation() {
  let location = useLocation();
  return (
    <Navbar bg="light" expand="lg">
      <Link className="navbar-brand" to="/parts">
        Parts Trackr
      </Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav style={{ flexGrow: 1 }}>
          {navEntries.map((e, idx) => (
            <Link
              key={idx}
              className={
                "nav-link" +
                (location.pathname.startsWith(e.path) ? " active" : "")
              }
              to={e.path}
              style={{
                marginLeft: idx === navEntries.length - 1 ? "auto" : undefined,
              }}
            >
              {e.title}
            </Link>
          ))}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        {navEntries.map((e, idx) => (
          <Route key={idx} path={e.path + "/*"} element={<e.component />} />
        ))}
        <Route path="*" element={<Navigate to={navEntries[0].path} />} />
      </Routes>
      <ToastContainer hideProgressBar={true} />
    </Router>
  );
}

export default App;
