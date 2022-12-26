import { useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import {
  NavigateFunction,
  Route,
  Routes,
  useNavigate,
  useParams,
  useRoutes,
} from "react-router-dom";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input from "./Input";
import { Location } from "./Location";
import { RefreshTrigger, req, useRefreshTrigger } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";

function EditLocation({ trigger, id }: { trigger: () => void; id: string }) {
  const navigate = useNavigate();
  const url = "api/location/" + id;
  return (
    <WithEdit<Location>
      key={id}
      url={url}
      onSuccess={trigger}
      render={({ bind }) => (
        <div>
          <Button variant="secondary" onClick={() => navigate("..")}>
            Close
          </Button>
          <Form>
            <Input label="Name" {...bind("name")} />
          </Form>
          <Card>
            <Card.Body>
              <Card.Title>Parameter Definitions</Card.Title>
              <EditParameterDefinitions
                url={url + "/parameterDefinition"}
                onModified={trigger}
                generateAddValue={() => ({
                  id: 0,
                  name: "",
                  type: "TEXT",
                  values: [],
                })}
              />
            </Card.Body>
          </Card>
        </div>
      )}
    />
  );
}

function LocationsList({
  refresh,
  navigate,
  id,
}: {
  refresh: RefreshTrigger;
  navigate: NavigateFunction;
  id?: string;
}) {
  const [name, setName] = useState("");
  return (
    <WithData<Location[]>
      url="api/location"
      queryParams={{ name }}
      refresh={refresh}
      render={(locations, trigger) => (
        <div style={{ flexGrow: 1 }}>
          <div
            className="mb-3"
            style={{
              display: "flex",
              flexDirection: "row",
              columnGap: "10px",
              alignItems: "baseline",
              position: "sticky",
              top: 0,
            }}
          >
            <input
              style={{ maxWidth: "30em" }}
              type="text"
              className="form-control"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div style={{ flexGrow: 1 }}></div>
          </div>

          <Table bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>
                  {" "}
                  <Button
                    variant="primary"
                    onClick={() => {
                      req("api/location/")
                        .method("POST")
                        .body({})
                        .success((location) => {
                          trigger();
                          navigate("" + location.id);
                        })
                        .send();
                    }}
                  >
                    Add
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  className={
                    id === "" + location.id ? "table-active" : undefined
                  }
                  key={location.id}
                  onClick={() => navigate("" + location.id)}
                >
                  <td>{location.id}</td>
                  <td>{location.name}</td>
                  <td>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        req("api/location/" + location.id)
                          .method("DELETE")
                          .success(trigger)
                          .send();
                      }}
                    >
                      <i className="bi bi-trash"></i>{" "}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    />
  );
}

function SelectedLocation({
  refresh,
  navigate,
}: {
  refresh: RefreshTrigger;
  navigate: NavigateFunction;
}) {
  const { id } = useParams();
  return (
    <div style={{ display: "flex", columnGap: "10px" }}>
      <LocationsList refresh={refresh} navigate={navigate} id={id} />
      <div style={{ flexGrow: 1 }}>
        <EditLocation trigger={refresh.trigger} id={id!} />
      </div>
    </div>
  );
}
export default function LocationsPage() {
  const navigate = useNavigate();
  const refresh = useRefreshTrigger();
  return (
    <Routes>
      <Route
        path=""
        element={<LocationsList refresh={refresh} navigate={navigate} />}
      />
      <Route
        path=":id"
        element={<SelectedLocation refresh={refresh} navigate={navigate} />}
      />
    </Routes>
  );
}
