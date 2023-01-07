import LocationsPage from "./LocationsPage";
import RoutingNav from "./RoutingNav";

export default function SettingsPage() {
  return (
    <RoutingNav
      entries={[
        { path: "locations", label: "Locations", element: LocationsPage },
      ]}
    />
  );
}
