import { useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import {
  NavigateFunction,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input from "./Input";
import { Location } from "./Location";
import { Observable, req, useObservable } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";

function EditLocation({
  onSuccess,
  id,
}: {
  onSuccess: () => void;
  id: string;
}) {
  const navigate = useNavigate();
  const url = "api/location/" + id;
  return (
    <WithEdit<Location>
      key={id}
      url={url}
      onSuccess={onSuccess}
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
                onModified={onSuccess}
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
  refresh: Observable;
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
  onChange,
}: {
  refresh: Observable;
  navigate: NavigateFunction;
  onChange: () => void;
}) {
  const { id } = useParams();
  return (
    <div style={{ display: "flex", columnGap: "10px" }}>
      <LocationsList refresh={refresh} navigate={navigate} id={id} />
      <div style={{ flexGrow: 1 }}>
        <EditLocation onSuccess={onChange} id={id!} />
      </div>
    </div>
  );
}
export default function LocationsPage() {
  const navigate = useNavigate();
  const [refreshObservable, refresh] = useObservable();
  return (
    <Routes>
      <Route
        path=""
        element={
          <LocationsList refresh={refreshObservable} navigate={navigate} />
        }
      />
      <Route
        path=":id"
        element={
          <SelectedLocation
            refresh={refreshObservable}
            navigate={navigate}
            onChange={refresh}
          />
        }
      />
    </Routes>
  );
}
