import React, { useEffect } from "react";
import { Nav, Navbar } from "react-bootstrap";
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LocationsPage from "./LocationsPage";
import PartsPage from "./PartsPage";

interface NavEntry {
  title: string;
  path: string;
  component: React.FunctionComponent;
}

let navEntries: NavEntry[] = [
  { title: "Parts", path: "/parts", component: PartsPage },
  { title: "Locations", path: "/locations", component: LocationsPage },
];

function Navigation() {
  let location = useLocation();
  return (
    <Navbar bg="light" expand="lg">
      <Link className="navbar-brand" to="/process">
        Parts Trackr
      </Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          {navEntries.map((e, idx) => (
            <Link
              key={idx}
              className={
                "nav-link" + (location.pathname === e.path ? " active" : "")
              }
              to={e.path}
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
      </Routes>
      <ToastContainer hideProgressBar={true} />
    </Router>
  );
}

export default App;
