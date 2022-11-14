import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Table } from "react-bootstrap";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input, { Select } from "./Input";
import Part, { ParameterValuePMod, PartTreeItem, SubTree } from "./Part";
import { SiPrefixInput } from "./siPrefix";
import { Binding, useBinding, useForceUpdate } from "./useBinding";
import { req, useRefreshTrigger } from "./useData";
import WithData from "./WithData";
import { WithEdit } from "./WithEdit";

interface PartPageCtx {
  add: (parentId: number, onClose: () => void) => void;
  edit: (id: number, onClose: () => void) => void;
}

function EditParameterValue({
  value,
  update,
}: {
  value: ParameterValuePMod;
  update: () => void;
}) {
  const bind = useBinding(value, { update });
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
  binding,
}: {
  binding: Binding<ParameterValuePMod[]>;
}) {
  const update = useForceUpdate();
  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {binding.get().map((p, idx) => {
            return (
              <tr key={idx}>
                <td>{p.definition.name}</td>
                <td>
                  {p.id !== null ? (
                    p.inherited ? (
                      <>{p.value}</>
                    ) : (
                      <EditParameterValue value={p} update={update} />
                    )
                  ) : null}
                </td>
                <td>
                  {p.id === null || p.inherited ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        p.id = 0;
                        p.value = null;
                        p.inherited = false;
                        update();
                      }}
                    >
                      <i className="bi bi-pencil"></i>{" "}
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        p.id = null;
                        p.value = null;
                        update();
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
    </>
  );
}

function EditPart({
  close,
  id,
  parentId,
}: {
  close: () => void;
  id?: number;
  parentId?: number;
}) {
  return (
    <WithEdit<Part>
      add={id === undefined}
      addValue={{
        name: "",
        id: 0,
        parentId,
        parameterDefinitions: [],
        parameterValues: [],
        nameSetByParameterDefinition: false,
        childNameParameterDefinitionId: null,
      }}
      url={"api/part" + (id === undefined ? "" : "/" + id)}
      render={({ bind, save, value }) => (
        <div>
          <Button
            variant="primary"
            onClick={() => {
              save(() => {
                close();
              });
            }}
          >
            {id === undefined ? "Add" : "Save"}
          </Button>
          <Button variant="secondary" onClick={() => close()}>
            Cancel
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
            {...bind("parameterDefinitions")}
            generateAddValue={() => ({
              id: 0,
              name: "",
              type: "TEXT",
              values: [],
            })}
          />
          <Form.Label>Parameter Values</Form.Label>
          <EditParameterValues {...bind("parameterValues")} />
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
}: {
  ctx: PartPageCtx;
  subTree: SubTree;
  refreshParent: () => void;
  refreshSubtree: () => void;
}) {
  return (
    <table className="table partTree" style={{ width: "100%" }}>
      <thead>
        <th></th> {/* chevron */}
        <th></th> {/* name */}
        {subTree.columns.map((c) => (
          <th>{c.label}</th>
        ))}
        <th></th> {/* actions */}
      </thead>
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
                refreshSiblings();
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
          {" "}
          <td colSpan={part.cells.length + 3} style={{ borderTopWidth: "1px" }}>
            <WithData<SubTree>
              url={"api/part/" + part.id + "/children"}
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
    id?: number;
    parentId?: number;
    onClose: () => void;
  }>();
  return (
    <WithData<SubTree>
      url="api/part/roots"
      render={(rootTree, trigger) => (
        <div style={{ display: "flex", columnGap: "10px" }}>
          <div style={{ flexGrow: 1 }}>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setEdit({ onClose: trigger });
              }}
            >
              <i className="bi bi-plus-circle"></i>
            </Button>
            <DisplaySubtree
              ctx={{
                add: (parentId, onClose) => setEdit({ parentId, onClose }),
                edit: (id, onClose) => setEdit({ id, onClose }),
              }}
              refreshSubtree={trigger}
              refreshParent={trigger}
              subTree={rootTree}
            />
          </div>
          {edit === undefined ? null : (
            <div style={{ flexGrow: 1 }}>
              <EditPart
                {...edit}
                close={() => {
                  edit.onClose();
                  setEdit(undefined);
                }}
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
