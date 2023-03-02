import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { EditList } from "./EditList";
import EditParameterValues, {
  EditParameterValueNoLoad,
} from "./EditParameterValues";
import Input from "./Input";
import { InventoryEntryPMod } from "./InventoryEntry";
import { LocationParameterDefinition, SelectLocation } from "./Location";
import { LinkToPart } from "./Part";
import { post, useObservable } from "./useData";
import WithData from "./WithData";

interface LocationParameterValues {
  locationId: number | null;
  values: {
    [key: number]: string;
  };
}

function EditLocationParameterValues({
  values,
  setValues,
}: {
  values: LocationParameterValues;
  setValues: (values: LocationParameterValues) => void;
}) {
  return (
    <Form>
      <SelectLocation
        binding={{
          get: () => values.locationId,
          set: (v) => {
            setValues({ locationId: v, values: {} });
            return Promise.resolve();
          },
        }}
      />
      {values.locationId == null ? null : (
        <WithData<LocationParameterDefinition[]>
          url={`api/location/${values.locationId}/parameterDefinition`}
          render={(definitions) => (
            <>
              {definitions.map((definition, idx) => (
                <React.Fragment key={idx}>
                  {definition.name}
                  <EditParameterValueNoLoad
                    definition={definition}
                    value={values.values[definition.id]}
                    setValue={(v) => {
                      let newValues = { ...values.values };
                      if (v === null) delete newValues[definition.id];
                      else newValues[definition.id] = v;
                      setValues({
                        locationId: values.locationId,
                        values: newValues,
                      });
                    }}
                  />
                </React.Fragment>
              ))}
            </>
          )}
        />
      )}
    </Form>
  );
}

export default function InventoryEntriesPage() {
  const [refreshListObservable, refreshList] = useObservable();
  const [refreshParameterValues$, refreshParameterValues] = useObservable();
  const [filter, setFilter] = useState<LocationParameterValues>({
    locationId: null,
    values: {},
  });
  const [multiEditValues, setMultiEditValues] =
    useState<LocationParameterValues>({
      locationId: null,
      values: {},
    });

  return (
    <>
      <EditLocationParameterValues values={filter} setValues={setFilter} />
      <EditList<InventoryEntryPMod, InventoryEntryPMod>
        horizontal
        columns={[
          {
            label: "Path",
            render: (p) => (
              <ol className="breadcrumb">
                {p.path.map((parent) => (
                  <li className="breadcrumb-item" key={parent.id}>
                    <LinkToPart part={parent} />
                  </li>
                ))}
              </ol>
            ),
          },
          {
            label: "Part",
            render: (p) =>
              p.part === null ? null : <LinkToPart part={p.part} />,
          },
          { label: "Location", render: (p) => p.locationName },
          { label: "Count", render: (p) => "" + p.count },
          { label: "Values", render: (p) => p.parameterValuesDescription },
        ]}
        createAddValue={() => ({})}
        url="api/inventoryEntry"
        queryParams={{
          maxCount: "20",
          locationId: filter.locationId,
          parameterValues: JSON.stringify(filter.values),
        }}
        refresh={refreshListObservable}
        onPostSave={() => refreshParameterValues()}
        renderEdit={({ bind, value }) => (
          <Form>
            <Input type="number" label="Count" {...bind("count")} />
            <Form.Label>Location</Form.Label>
            <SelectLocation {...bind("locationId")} />
            <Form.Label>Parameter Values</Form.Label>
            <EditParameterValues
              url={"api/inventoryEntry/" + value.id + "/parameterValue"}
              refresh={refreshParameterValues$}
              onModified={() => refreshList()}
            />
          </Form>
        )}
        renderMultiEdit={({ selection, close, refresh }) => (
          <>
            <Button
              variant="primary"
              onClick={() =>
                post("api/inventoryEntry/updateLocations")
                  .body({
                    selection:
                      selection === "all"
                        ? undefined
                        : Array.from(selection.values()).map((x) => x.id),
                    filter: selection !== "all" ? undefined : filter,
                    values: multiEditValues,
                  })
                  .success(() => {
                    toast.success("Locations Updated");
                    refresh();
                    close();
                  })
                  .send()
              }
            >
              Apply
            </Button>
            <EditLocationParameterValues
              values={multiEditValues}
              setValues={setMultiEditValues}
            />
          </>
        )}
      />
    </>
  );
}
