import LocationsPage from "./LocationsPage";
import OperationsPage from "./OperationsPage";
import RoutingNav from "./RoutingNav";

export default function SettingsPage() {
  return (
    <RoutingNav
      entries={[
        { path: "locations", label: "Locations", element: LocationsPage },
        { path: "operations", label: "Operations", element: OperationsPage },
      ]}
    />
  );
}
