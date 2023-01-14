import { useState } from "react";
import { Form } from "react-bootstrap";
import { EditList } from "./EditList";
import EditParameterValues, {
  EditParameterValueNoLoad,
} from "./EditParameterValues";
import Input from "./Input";
import { InventoryEntryPMod } from "./InventoryEntry";
import { LocationParameterDefinition, SelectLocation } from "./Location";
import { LinkToPart } from "./Part";
import { useStateAndBind } from "./useBinding";
import { useObservable } from "./useData";
import WithData from "./WithData";

export default function InventoryEntriesPage() {
  const [refreshListObservable, refreshList] = useObservable();
  const [locationId, , { binding: bindLocationId }] = useStateAndBind<
    number | null
  >(null);
  const [parameterValues, setParameterValues] = useState<{
    [key: number]: string;
  }>({});

  return (
    <>
      <Form>
        <SelectLocation
          binding={{
            get: bindLocationId.get,
            set: (v) => {
              setParameterValues({});
              return bindLocationId.set(v);
            },
          }}
        />
        {locationId == null ? null : (
          <WithData<LocationParameterDefinition[]>
            url={`api/location/${locationId}/parameterDefinition`}
            render={(definitions) => (
              <>
                {definitions.map((definition, idx) => (
                  <>
                    {definition.name}
                    <EditParameterValueNoLoad
                      definition={definition}
                      value={parameterValues[definition.id]}
                      setValue={(v) =>
                        setParameterValues((x) => {
                          if (v === null) {
                            const tmp = { ...x };
                            delete tmp[definition.id];
                            return tmp;
                          }
                          return {
                            ...x,
                            [definition.id]: v,
                          };
                        })
                      }
                    />
                  </>
                ))}
              </>
            )}
          />
        )}
      </Form>
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
          locationId,
          parameterValues: JSON.stringify(parameterValues),
        }}
        refresh={refreshListObservable}
        renderEdit={({ bind, value }) => (
          <Form>
            <Input type="number" label="Count" {...bind("count")} />
            <Form.Label>Location</Form.Label>
            <SelectLocation {...bind("locationId")} />
            <Form.Label>Parameter Values</Form.Label>
            <EditParameterValues
              url={"api/inventoryEntry/" + value.id + "/parameterValue"}
              onModified={() => refreshList()}
            />
          </Form>
        )}
      />
    </>
  );
}
