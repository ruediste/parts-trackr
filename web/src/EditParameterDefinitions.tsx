import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import Input, { Select } from "./Input";
import { ParameterDefinitionBase, ParameterType, Unit } from "./Location";
import { Binding, useBinding, useForceUpdate } from "./useBinding";

function EditParameterDefinition<T extends ParameterDefinitionBase>({
  def,
  add,
  onAdd,
  onClose,
  update,
}: {
  def: T;
  add: boolean;
  onAdd: () => void;
  onClose: () => void;
  update: () => void;
}) {
  const bind = useBinding(def, { update });
  //const update = useForceUpdate();
  const bindUpdate = useBinding(def, { update });

  const nameParameter = (
    <>
      {add ? <Button onClick={onAdd}>Add</Button> : null}
      <Button onClick={onClose}>Close</Button>
      <Input label="Name" {...bind("name")} />
      <Select<ParameterType>
        label="Type"
        {...bindUpdate("type")}
        options={[
          { label: "Text", value: "TEXT" },
          { label: "Number", value: "NUMBER" },
          { label: "Value", value: "VALUE" },
          { label: "Choice", value: "CHOICE" },
        ]}
      />
    </>
  );

  switch (def.type) {
    case "VALUE":
      return (
        <>
          {nameParameter}
          <Select<Unit | undefined>
            label="Unit"
            {...bind("unit")}
            options={[
              { label: "Volt", value: "VOLT" },
              { label: "Ampere", value: "AMPERE" },
              { label: "Watt", value: "WATT" },
              { label: "Meter", value: "METER" },
              { label: "Watt Hours", value: "WATT_HOURS" },
              { label: "Ampere Hours", value: "AMPERE_HOURS" },
              { label: "Ohm", value: "OHM" },
              { label: "Farad", value: "FARAD" },
              { label: "Henry", value: "HENRY" },
            ]}
          />
        </>
      );
    case "CHOICE":
      return (
        <>
          {nameParameter}
          TODO
        </>
      );
  }
  return nameParameter;
}

export function EditParameterDefinitions<T extends ParameterDefinitionBase>({
  binding,
  generateAddValue,
}: {
  binding: Binding<T[]>;
  generateAddValue: () => T;
}) {
  const update = useForceUpdate();
  const [selected, setSelected] = useState<T>();
  const [add, setAdd] = useState(false);
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Unit</th>
            <th>Values</th>
            <th>
              {" "}
              <Button
                onClick={() => {
                  setAdd(true);
                  setSelected(generateAddValue());
                }}
              >
                Add
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {binding.get().map((p, idx) => (
            <tr
              key={idx}
              onClick={() => {
                setAdd(false);
                setSelected(p);
              }}
            >
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>{p.unit}</td>
              <td>{p.values?.join(" ")}</td>
              <td>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    binding.get().splice(idx, 1);
                    if (p === selected) setSelected(undefined);
                    update();
                  }}
                >
                  <i className="bi bi-trash"></i>{" "}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {selected === undefined ? null : (
        <EditParameterDefinition
          def={selected}
          add={add}
          update={update}
          onAdd={() => {
            setSelected(undefined);
            binding.get().push(selected);
            update();
          }}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}
