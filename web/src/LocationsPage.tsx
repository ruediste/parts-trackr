import { useEffect, useState } from "react";
import { Button, Form, Table } from "react-bootstrap";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { isBindingElement } from "typescript";
import { Location, LocationParameterDefinition } from "./Location";
import useBinding, { ValueBinding } from "./useBinding";
import { req } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";

function Input(props: {
  type?: "text";
  label?: string;
  placeholder?: string;
  binding: ValueBinding<string>;
}) {
  const [value, setValue] = useBinding(props.binding);
  return (
    <Form.Group className="mb-3" controlId="formBasicEmail">
      {props.label === undefined ? null : (
        <Form.Label>{props.label}</Form.Label>
      )}
      <Form.Control
        type={props.type}
        placeholder={props.placeholder}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
    </Form.Group>
  );
}

function EditParameters({
  binding,
}: {
  binding: ValueBinding<LocationParameterDefinition[]>;
}) {
  return <div> foo</div>;
}

function EditLocation({ trigger }: { trigger: () => void }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <WithEdit<Location>
      add={id === undefined}
      url={"api/location" + (id === undefined ? "" : "/" + id)}
      render={(b, save) => (
        <div>
          <Button
            variant="primary"
            onClick={() => {
              console.log(b.read());
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
          <Input label="Name" {...b.bind("name")} />
          <EditParameters {...b.bind("parameterDefinitions")} />
        </div>
      )}
    />
  );
}

export default function LocationsPage() {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  return (
    <WithData<Location[]>
      url="api/location"
      queryParams={{ name }}
      render={(locations, trigger) => (
        <>
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
            <Button variant="primary" onClick={() => navigate("add")}>
              Add
            </Button>
          </div>

          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
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

          <Routes>
            <Route path="add" element={<EditLocation trigger={trigger} />} />
            <Route path=":id" element={<EditLocation trigger={trigger} />} />
          </Routes>
        </>
      )}
    />
  );
}
