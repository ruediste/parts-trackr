import { useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { useNavigate, useParams, useRoutes } from "react-router-dom";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input from "./Input";
import { Location } from "./Location";
import { req, useRefreshTrigger } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";

function EditLocation({ trigger }: { trigger: () => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <WithEdit<Location>
      key={id}
      add={id === undefined}
      addValue={{ parameterDefinitions: [], name: "", id: 0 }}
      url={"api/location" + (id === undefined ? "" : "/" + id)}
      render={({ bind, save }) => (
        <div>
          <Button
            variant="primary"
            onClick={() => {
              save(() => {
                trigger();
                navigate("..");
              });
            }}
          >
            {id === undefined ? "Add" : "Save"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("..")}>
            Cancel
          </Button>
          <Input label="Name" {...bind("name")} />
          <Form.Label>Parameter Definitions</Form.Label>
          <EditParameterDefinitions
            {...bind("parameterDefinitions")}
            generateAddValue={() => ({
              id: 0,
              name: "",
              type: "TEXT",
              values: [],
            })}
          />
        </div>
      )}
    />
  );
}

export default function LocationsPage() {
  const [name, setName] = useState("");
  const refresh = useRefreshTrigger();
  const navigate = useNavigate();

  const details = useRoutes([
    {
      path: "add",
      element: <EditLocation trigger={() => refresh.trigger()} />,
    },
    {
      path: ":id",
      element: <EditLocation trigger={() => refresh.trigger()} />,
    },
  ]);
  return (
    <WithData<Location[]>
      url="api/location"
      queryParams={{ name }}
      refresh={refresh}
      render={(locations, trigger) => (
        <div style={{ display: "flex", columnGap: "10px" }}>
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

            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>
                    {" "}
                    <Button variant="primary" onClick={() => navigate("add")}>
                      Add
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {locations.map((location) => (
                  <tr
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
          {details !== null ? (
            <div style={{ flexGrow: 1 }}>{details}</div>
          ) : null}
        </div>
      )}
    />
  );
}
