import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { EditList } from "./EditList";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input, { Select } from "./Input";
import Part, { ParameterValuePMod, PartTreeItem, SubTree } from "./Part";
import { SiPrefixInput } from "./siPrefix";
import { useBinding } from "./useBinding";
import { post, req, useRefreshTrigger } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";
import AsyncSelect from "react-select/async";
import { Location } from "./Location";

interface PartPageCtx {
  add: (parentId: number | undefined, onModified: () => void) => void;
  edit: (id: number, onModified: () => void) => void;
}

function EditParameterValue({
  url,
  value,
  update,
}: {
  url: string;
  value: ParameterValuePMod;
  update: () => void;
}) {
  const bind = useBinding(value, {
    update: () =>
      post(url)
        .body(value)
        .success(() => {
          toast.success(value.definition.name + " updated");
          update();
        })
        .send(),
  });
  switch (value.definition.type) {
    case "TEXT":
      return <Input {...(bind("value") as any)} />;
    case "NUMBER":
      return <Input type="number" {...(bind("value") as any)} />;
    case "VALUE":
      return (
        <SiPrefixInput
          {...(bind("value") as any)}
          afterElement={
            <InputGroup.Text>{value.definition.unit}</InputGroup.Text>
          }
        />
      );
    case "CHOICE":
      return <span>TODO</span>;
  }
}

function EditParameterValues({
  url,
  onModified,
}: {
  url: string;
  onModified: () => void;
}) {
  return (
    <WithData<ParameterValuePMod[]>
      url={url}
      render={(pMods, refresh) => (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {pMods.map((p, idx) => {
              return (
                <tr key={idx}>
                  <td>{p.definition.name}</td>
                  <td>
                    {p.id !== null ? (
                      p.inherited ? (
                        <>{p.value}</>
                      ) : (
                        <EditParameterValue
                          value={p}
                          update={() => {
                            refresh();
                            onModified();
                          }}
                          url={url + "/" + p.id}
                        />
                      )
                    ) : null}
                  </td>
                  <td>
                    {p.id === null || p.inherited ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          post(url)
                            .body({
                              definition: p.definition,
                            } as ParameterValuePMod)
                            .success(() => {
                              refresh();
                              onModified();
                            })
                            .send();
                        }}
                      >
                        <i className="bi bi-pencil"></i>{" "}
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          req(url + "/" + p.id)
                            .method("DELETE")
                            .success(() => {
                              refresh();
                              onModified();
                            })
                            .send();
                        }}
                      >
                        <i className="bi bi-x"></i>{" "}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    />
  );
}

interface LocationOption {
  value: number;
  label: string;
}
interface InventoryEntryPMod {
  id: number;
  locationName: string;
  count: number;
  locationId: number | null;
}
export function EditInventoryEntries({
  url,
  onModified,
}: {
  url: string;
  onModified: () => void;
}) {
  return (
    <EditList<InventoryEntryPMod, InventoryEntryPMod>
      columns={[
        { label: "Location", render: (p) => p.locationName },
        { label: "Count", render: (p) => "" + p.count },
      ]}
      url={url}
      createAddValue={() => ({})}
      renderEdit={({ bind, value }) => {
        const bindLocationId = bind("locationId").binding;
        return (
          <>
            <AsyncSelect<LocationOption>
              loadOptions={(
                inputValue: string,
                callback: (options: LocationOption[]) => void
              ) => {
                req("api/location?name=" + encodeURIComponent(inputValue))
                  .success((data: Location[]) =>
                    callback(data.map((x) => ({ value: x.id, label: x.name })))
                  )
                  .send();
              }}
              value={
                value.locationId == null
                  ? null
                  : { value: value.locationId, label: value.locationName }
              }
              onChange={(option) => bindLocationId.set(option?.value ?? null)}
            />
            <Input type="number" {...bind("count")} />
          </>
        );
      }}
    />
  );
}

function EditPart({
  close,
  id,
  onModified,
}: {
  close: () => void;
  onModified: () => void;
  id: number;
}) {
  const url = "api/part/" + id;
  return (
    <WithEdit<Part>
      url={url}
      onSuccess={onModified}
      render={({ bind, value }) => (
        <div>
          <Button variant="secondary" onClick={() => close()}>
            Close
          </Button>
          <br />
          {value.nameSetByParameterDefinition ? null : (
            <Input label="Name" {...bind("name")} />
          )}
          <Select
            label="Child Name Parameter"
            {...bind("childNameParameterDefinitionId")}
            options={[
              { value: null, label: "<none>" },
              ...value.parameterValues.map((x) => ({
                value: x.definition.id,
                label: x.definition.name,
              })),
            ]}
          />
          <Form.Label>Parameter Definitions</Form.Label>
          <EditParameterDefinitions
            url={url + "/parameterDefinition"}
            onModified={onModified}
            generateAddValue={() => ({
              id: 0,
              name: "",
              type: "TEXT",
              values: [],
            })}
          />
          <Form.Label>Parameter Values</Form.Label>
          <EditParameterValues
            url={url + "/parameterValue"}
            onModified={onModified}
          />
          <Form.Label>Inventory Entries</Form.Label>
          <EditInventoryEntries
            url={url + "/inventoryEntry"}
            onModified={onModified}
          />
        </div>
      )}
    />
  );
}

function DisplaySubtree({
  ctx,
  refreshParent,
  refreshSubtree,
  subTree,
  isRoot = false,
}: {
  ctx: PartPageCtx;
  subTree: SubTree;
  refreshParent: () => void;
  refreshSubtree: () => void;
  isRoot?: boolean;
}) {
  return (
    <table className={"table partTree" + (isRoot ? " root" : "")}>
      {subTree.columns.length === 0 ? null : (
        <thead>
          <tr>
            <th></th>
            {/* chevron */}
            <th></th>
            {/* name */}
            {subTree.columns.map((c, idx) => (
              <th key={idx}>{c.label}</th>
            ))}
            <th></th>
            {/* actions */}
          </tr>
        </thead>
      )}
      <tbody>
        {subTree.items.map((part) => (
          <PartListEntry
            key={part.id}
            part={part}
            ctx={ctx}
            refreshSiblings={refreshSubtree}
            refreshParent={() => {
              refreshParent();
              refreshSubtree();
            }}
          />
        ))}
      </tbody>
    </table>
  );
}

function PartListEntry({
  part,
  ctx,
  refreshSiblings,
  refreshParent,
}: {
  part: PartTreeItem;
  ctx: PartPageCtx;
  refreshSiblings: () => void;
  refreshParent: () => void;
}) {
  const refreshChildren = useRefreshTrigger();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!part.hasChildren) setExpanded(false);
  }, [part.hasChildren]);
  return (
    <>
      <tr
        onClick={
          part.hasChildren
            ? () => setExpanded((x) => !x)
            : () => ctx.edit(part.id, refreshSiblings)
        }
      >
        <td style={{ width: 0 }}>
          {part.hasChildren ? (
            <i
              className={"bi bi-chevron-" + (expanded ? "contract" : "expand")}
            />
          ) : null}
        </td>
        <td style={{ textAlign: "left" }}>{part.name}</td>
        {part.cells.map((cell, idx) => (
          <td key={idx}>{cell}</td>
        ))}
        <td style={{ textAlign: "right" }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              ctx.edit(part.id, refreshSiblings);
            }}
          >
            {" "}
            <i className="bi bi-pencil"></i>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              ctx.add(part.id, () => {
                refreshChildren.trigger();
                setExpanded(true);
              });
            }}
          >
            <i className="bi bi-plus-circle"></i>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              req("api/part/" + part.id)
                .method("DELETE")
                .success(refreshParent)
                .send();
            }}
          >
            <i className="bi bi-trash"></i>
          </Button>
        </td>
      </tr>
      {!expanded ? null : (
        <tr>
          <td colSpan={part.cells.length + 3} style={{ borderTopWidth: "1px" }}>
            <WithData<SubTree>
              url={"api/part/" + part.id + "/children"}
              refresh={refreshChildren}
              render={(subTree, refreshSubtree) => (
                <DisplaySubtree
                  ctx={ctx}
                  refreshSubtree={refreshSubtree}
                  refreshParent={() => {
                    refreshSiblings();
                    refreshSubtree();
                  }}
                  subTree={subTree}
                />
              )}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default function PartsPage() {
  const [edit, setEdit] = useState<{
    id: number;
    onModified: () => void;
  }>();
  const ctx: PartPageCtx = {
    add: (parentId, onModified) => {
      post("api/part")
        .body({ parentId } as Partial<Part>)
        .success((part: Part) => {
          toast.success("Saved");
          if (edit !== undefined) edit.onModified();
          setEdit({
            id: part.id,
            onModified,
          });
        })
        .error("Error while adding part")
        .send();
    },
    edit: (id, onModified) => {
      if (edit !== undefined) edit.onModified();
      setEdit({ id, onModified });
    },
  };

  return (
    <WithData<SubTree>
      url="api/part/roots"
      render={(rootTree, trigger) => (
        <div style={{ display: "flex", columnGap: "10px" }}>
          <div style={{ flexGrow: 1 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                ctx.add(undefined, () => trigger());
              }}
            >
              <i className="bi bi-plus-circle"></i>
            </Button>
            <DisplaySubtree
              ctx={ctx}
              refreshSubtree={trigger}
              refreshParent={trigger}
              subTree={rootTree}
              isRoot
            />
          </div>
          {edit === undefined ? null : (
            <div style={{ flexGrow: 1 }}>
              <EditPart {...edit} close={() => setEdit(undefined)} />
            </div>
          )}
        </div>
      )}
    />
  );
}
