import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, InputGroup, Table } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import { EditList } from "./EditList";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import Input, { Select } from "./Input";
import { Location } from "./Location";
import Part, { ParameterValuePMod, PartTreeItem, SubTree } from "./Part";
import { SiPrefixInput } from "./siPrefix";
import { useBinding } from "./useBinding";
import { Observable, post, req, useObservable } from "./useData";
import WithData from "./WithData";
import { RenderEdit, WithEdit } from "./WithEdit";

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
  refresh,
}: {
  url: string;
  onModified: () => void;
  refresh?: Observable;
}) {
  return (
    <WithData<ParameterValuePMod[]>
      url={url}
      refresh={refresh}
      render={(pMods, refresh) => (
        <Table bordered hover>
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
  parameterValuesDescription: string;
}
export function EditInventoryEntries({
  url,
  onModified,
}: {
  url: string;
  onModified: () => void;
}) {
  const [refreshObservable, refresh] = useObservable();
  const [refreshListObservable, refreshList] = useObservable();
  return (
    <EditList<InventoryEntryPMod, InventoryEntryPMod>
      columns={[
        { label: "Location", render: (p) => p.locationName },
        { label: "Count", render: (p) => "" + p.count },
        { label: "Values", render: (p) => p.parameterValuesDescription },
      ]}
      url={url}
      createAddValue={() => ({})}
      onPostSave={() => {
        refresh();
        onModified();
      }}
      refresh={refreshListObservable}
      renderEdit={({ bind, value }) => {
        const bindLocationId = bind("locationId").binding;
        return (
          <Form>
            <Input type="number" label="Count" {...bind("count")} />
            <Form.Label>Location</Form.Label>
            <AsyncSelect<LocationOption>
              defaultOptions
              loadOptions={(
                inputValue: string,
                callback: (options: LocationOption[]) => void
              ) => {
                req(
                  "api/location?name=" +
                    encodeURIComponent(inputValue) +
                    "&maxCount=10"
                )
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

            <Form.Label>Parameter Values</Form.Label>
            <EditParameterValues
              url={"api/inventoryEntry/" + value.id + "/parameterValue"}
              onModified={() => refreshList()}
              refresh={refreshObservable}
            />
          </Form>
        );
      }}
    />
  );
}

function EditPart({
  close,
  id,
  onModified,
  refreshDocuments,
}: {
  close: () => void;
  onModified: () => void;
  id: number;
  refreshDocuments: Observable;
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
          <Input
            label="Comment"
            type="textarea"
            rows={3}
            {...bind("comment")}
          />
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
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Parameter Definitions</Card.Title>
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
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Parameter Values</Card.Title>
              <EditParameterValues
                url={url + "/parameterValue"}
                onModified={onModified}
              />
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Inventory Entries</Card.Title>
              <EditInventoryEntries
                url={url + "/inventoryEntry"}
                onModified={onModified}
              />
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Card.Title>Documents</Card.Title>
              <EditDocuments
                url={url + "/document"}
                refresh={refreshDocuments}
              />
            </Card.Body>
          </Card>
        </div>
      )}
    />
  );
}

interface UploadingFile {
  name: string;
  progress: number;
}

interface PartDocument {
  id: number;
  name: string;
  fileName: string;
  mimeType: string;
}

function EditDocuments({ url, refresh }: { url: string; refresh: Observable }) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  return (
    <WithData<PartDocument[]>
      refresh={refresh}
      url={url}
      render={(documents, refresh) => (
        <>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Upload Document</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => {
                  const files: FileList | null = (e.target as any).files;
                  if (files == null) return;
                  const tmp: UploadingFile[] = [];
                  for (var i = 0; i < files.length; i++) {
                    const file = files.item(i);
                    if (file == null) continue;
                    const uploadingFile = { name: file.name, progress: 0 };
                    tmp.push(uploadingFile);
                    post(url)
                      .bodyRaw(file)
                      .query({ name: file.name })
                      .success((data) => {
                        toast.success(file.name + " uploaded");
                        setUploadingFiles((old) =>
                          old.filter((x) => x !== uploadingFile)
                        );
                        refresh();
                      })
                      .upload(({ loaded, total }) => {
                        console.log(loaded, total);
                        uploadingFile.progress = Math.round(
                          (100 * loaded) / total
                        );
                        setUploadingFiles((old) => [...old]);
                      });
                  }
                  setUploadingFiles((old) => [...old, ...tmp]);

                  // clear the selected files
                  e.target.value = "";
                }}
              />
            </Form.Group>
          </Form>
          <Table bordered hover style={{ height: "1px" /* ignored */ }}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Mime Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <RenderEdit<PartDocument>
                  value={doc}
                  url={"api/document/" + doc.id}
                  onSuccess={refresh}
                  onError={() => {
                    refresh();
                    toast("Error updating document");
                  }}
                  render={({ bind }) => (
                    <tr style={{ height: "100%" }}>
                      <td style={{ height: "100%", padding: 0 }}>
                        <a
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                          }}
                          href={"/api/document/" + doc.id + "/" + doc.fileName}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="bi bi-download"></i>
                        </a>
                      </td>
                      <td>
                        <Input noMarginBottom {...bind("name")} />{" "}
                      </td>
                      <td>
                        <Input noMarginBottom {...bind("mimeType")} />{" "}
                      </td>
                      <td>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            req("api/document/" + doc.id)
                              .method("DELETE")
                              .success(refresh)
                              .send();
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  )}
                />
              ))}
            </tbody>
          </Table>
          {uploadingFiles.map((file, idx) => (
            <div key={idx} className="d-flex align-items-center">
              <span>{file.name}</span>
              <div className="progress flex-fill">
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: file.progress + "%" }}
                  aria-valuenow={file.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            {documents
              .filter((doc) => doc.mimeType === "image/jpeg")
              .map((doc) => (
                <div key={doc.id} className="card" style={{ width: "18rem" }}>
                  <img
                    alt=""
                    className="card-img-top"
                    src={"/api/document/" + doc.id + "/" + doc.fileName}
                  />
                  <div className="card-body">
                    <p className="card-text">{doc.name}</p>
                  </div>
                </div>
              ))}
          </div>
        </>
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
            <th>{/* chevron */}</th>
            <th>{/* name */}</th>

            {subTree.columns.map((c, idx) => (
              <th key={idx}>{c.label}</th>
            ))}
            <th>{/* inventory */}</th>
            <th>{/* actions */}</th>
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
  const [refreshChildrenObservable, refreshChildren] = useObservable();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!part.hasChildren) setExpanded(false);
  }, [part.hasChildren]);
  const editRefresh = () => {
    refreshSiblings();
  };
  return (
    <>
      <tr
        onClick={
          part.hasChildren
            ? () => setExpanded((x) => !x)
            : () => ctx.edit(part.id, editRefresh)
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
        <td style={{ textAlign: "right", width: "0px" }}>
          {part.inventorySum > 0 ? "" + part.inventorySum : null}
        </td>
        <td style={{ textAlign: "right", width: "0px", whiteSpace: "nowrap" }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              ctx.edit(part.id, editRefresh);
            }}
          >
            {" "}
            <i className="bi bi-pencil"></i>
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              ctx.add(part.id, () => {
                refreshChildren();
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
          <td colSpan={part.cells.length + 4} style={{ borderTopWidth: "1px" }}>
            <WithData<SubTree>
              url={"api/part/" + part.id + "/children"}
              refresh={refreshChildrenObservable}
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

function useHandleImagePaste(partId?: number, onSuccess?: () => void) {
  useEffect(() => {
    const handlePasteAnywhere = (ev: any) => {
      console.log(ev);
      const event = ev as ClipboardEvent;
      if (event.clipboardData === null || partId === undefined) return;

      for (let i = 0; i < event.clipboardData?.items.length ?? 0; i++) {
        const item = event.clipboardData.items[i];
        if (item.type.startsWith("image")) {
          const file = item.getAsFile();
          if (file !== null) uploadFile(partId, file, onSuccess);
        }
      }
    };
    window.addEventListener("paste", handlePasteAnywhere);
    return () => {
      window.removeEventListener("paste", handlePasteAnywhere);
    };
  }, [partId, onSuccess]);
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
          post("api/photo/currentPart")
            .query({ part: "" + part.id })
            .success(() => {})
            .send();
        })
        .error("Error while adding part")
        .send();
    },
    edit: (id, onModified) => {
      if (edit !== undefined) edit.onModified();
      setEdit({ id, onModified });
      post("api/photo/currentPart")
        .query({ part: "" + id })
        .success(() => {})
        .send();
    },
  };

  const dragEnterCount = useRef(0);
  const [dragHovering, setDragHovering] = useState(false);
  const [refreshDocumentsObservable, refreshDocuments] = useObservable();

  useHandleImagePaste(edit?.id, refreshDocuments);
  return (
    <WithData<SubTree>
      url="api/part/roots"
      render={(rootTree, trigger) => (
        <div
          className={
            "partsPage" +
            (dragHovering && edit !== undefined ? " fileHovering" : "")
          }
          style={{
            display: "flex",
            columnGap: "10px",
            marginLeft: "4px",
            marginRight: "4px",
          }}
          onDrop={(ev) => {
            console.log(ev.dataTransfer.items);
            ev.preventDefault();
            setDragHovering(false);
            dragEnterCount.current = 0;

            if (edit === undefined) return;

            if (ev.dataTransfer.items) {
              // Use DataTransferItemList interface to access the file(s)
              for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                const item = ev.dataTransfer.items[i];
                // If dropped items aren't files, reject them
                if (item.kind === "file") {
                  const file = item.getAsFile()!;
                  uploadFile(edit.id, file, () => refreshDocuments());
                }
              }
            } else {
              // Use DataTransfer interface to access the file(s)
              for (let i = 0; i < ev.dataTransfer.files.length; i++) {
                const file = ev.dataTransfer.files[i];
                uploadFile(edit.id, file, () => refreshDocuments());
              }
            }
          }}
          onDragEnter={(e) => {
            if (dragEnterCount.current === 0) setDragHovering(true);
            dragEnterCount.current++;
            e.preventDefault();
          }}
          onDragLeave={(e) => {
            dragEnterCount.current--;
            if (dragEnterCount.current === 0) setDragHovering(false);
            e.preventDefault();
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
        >
          <div style={{ flex: "0 0 50%" }}>
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
            <div style={{ flex: "0 0 50%" }}>
              <EditPart
                {...edit}
                close={() => setEdit(undefined)}
                refreshDocuments={refreshDocumentsObservable}
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
function uploadFile(partId: number, file: File, onSuccess?: () => void) {
  const toastId = toast.loading(`uploading ${file.name}`, {
    progress: 0,
    hideProgressBar: false,
  });
  post("api/part/" + partId + "/document")
    .bodyRaw(file)
    .query({ name: file.name })
    .success((data) => {
      toast.dismiss(toastId);
      toast.success("uploaded " + file.name);
      if (onSuccess !== undefined) onSuccess();
    })
    .upload(({ loaded, total }) => {
      if (loaded < total)
        toast.update(toastId, {
          progress: total === 0 ? 0 : loaded / total,
        });
    });
}
