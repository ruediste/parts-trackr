import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import { useNavigate, useParams, useRoutes } from "react-router-dom";
import { toast } from "react-toastify";
import { EditList } from "./EditList";
import { EditParameterDefinitions } from "./EditParameterDefinitions";
import EditParameterValues from "./EditParameterValues";
import Input, { Select } from "./Input";
import { InventoryEntryPMod } from "./InventoryEntry";
import { SelectLocation } from "./Location";
import PartPMod, { PartList, PartListItem } from "./Part";
import { Observable, post, req, useObservable } from "./useData";
import WithData from "./WithData";
import { RenderEdit, WithEdit } from "./WithEdit";

interface PartPageCtx {
  add: (parentId: number | undefined, onModified: () => void) => void;
  edit: (id: number, onModified: () => void) => void;
  editId?: number;
  initialEditId?: number;
}

export default function PartsPage() {
  const navigate = useNavigate();
  const navigateToPart = (id?: number) => navigate("" + (id ?? ""));
  return useRoutes([
    {
      path: ":id/*",
      element: <PartsPageWithId navigateToPart={navigateToPart} />,
    },
    {
      path: "*",
      element: <PartsPageInner navigateToPart={navigateToPart} />,
    },
  ]);
}

function PartsPageWithId({
  navigateToPart,
}: {
  navigateToPart: (id?: number) => void;
}) {
  const { id } = useParams();

  return (
    <WithData<PartList>
      url={"api/part/" + id + "/treeFromRoot"}
      render={(parts) => (
        <PartsPageInner
          treeFromRoot={parts}
          navigateToPart={navigateToPart}
          initialEditId={parseInt(id!)}
        />
      )}
    />
  );
}
function PartsPageInner({
  treeFromRoot,
  navigateToPart,
  initialEditId,
}: {
  treeFromRoot?: PartList;
  navigateToPart: (id?: number) => void;
  initialEditId?: number;
}) {
  const [edit, setEdit] = useState<{
    id: number;
    onModified: () => void;
  }>();

  const [initialEditIdState, setInitialEditIdState] = useState(initialEditId);

  const ctx: PartPageCtx = {
    add: (parentId, onModified) => {
      post("api/part")
        .body({ parentId } as Partial<PartPMod>)
        .success((part: PartPMod) => {
          toast.success("Saved");
          if (edit !== undefined) edit.onModified();
          setEdit({
            id: part.id,
            onModified,
          });
          navigateToPart(part.id);
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
      setInitialEditIdState(undefined);
      navigateToPart(id);
      post("api/photo/currentPart")
        .query({ part: "" + id })
        .success(() => {})
        .send();
    },
    editId: edit?.id,
    initialEditId: initialEditIdState,
  };

  const dragEnterCount = useRef(0);
  const [dragHovering, setDragHovering] = useState(false);
  const [refreshDocumentsObservable, refreshDocuments] = useObservable();

  useHandleImagePaste(edit?.id, refreshDocuments);
  return (
    <WithData<PartList>
      url="api/part/roots"
      initialData={treeFromRoot}
      render={(rootPartList, trigger) => (
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
            <DisplayPartList
              ctx={ctx}
              refreshSubtree={trigger}
              refreshParent={trigger}
              partList={rootPartList}
              isRoot
            />
          </div>
          {edit === undefined ? null : (
            <div style={{ flex: "0 0 50%" }}>
              <EditPart
                {...edit}
                close={() => {
                  navigateToPart();
                  return setEdit(undefined);
                }}
                refreshDocuments={refreshDocumentsObservable}
              />
            </div>
          )}
        </div>
      )}
    />
  );
}

function DisplayPartList({
  ctx,
  refreshParent,
  refreshSubtree,
  isRoot = false,
  partList,
}: {
  ctx: PartPageCtx;
  partList: PartList;
  refreshParent: () => void;
  refreshSubtree: () => void;
  isRoot?: boolean;
}) {
  return (
    <table className={"table partTree" + (isRoot ? " root" : "")}>
      {partList.columns.length === 0 ? null : (
        <thead>
          <tr>
            <th>{/* chevron */}</th>
            <th>{/* name */}</th>

            {partList.columns.map((c, idx) => (
              <th key={idx}>{c.label}</th>
            ))}
            <th>{/* inventory */}</th>
            <th>{/* actions */}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {partList.items.map((part) => (
          <DisplayPartListItem
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

function DisplayPartListItem({
  part,
  ctx,
  refreshSiblings,
  refreshParent,
}: {
  part: PartListItem;
  ctx: PartPageCtx;
  refreshSiblings: () => void;
  refreshParent: () => void;
}) {
  const [refreshChildrenObservable, refreshChildren] = useObservable();
  const [expanded, setExpanded] = useState(part.children !== null);
  useEffect(() => {
    if (!part.hasChildren) setExpanded(false);
  }, [part.hasChildren]);
  const editRefresh = () => {
    refreshSiblings();
  };
  useEffect(() => {
    if (ctx.initialEditId !== undefined) {
      ctx.edit(ctx.initialEditId, editRefresh);
    }
  });
  return (
    <>
      <tr
        className={ctx.editId === part.id ? "table-active" : undefined}
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
            <WithData<PartList>
              initialData={part.children == null ? undefined : part.children}
              url={"api/part/" + part.id + "/children"}
              refresh={refreshChildrenObservable}
              render={(subTree, refreshSubtree) => (
                <DisplayPartList
                  ctx={ctx}
                  refreshSubtree={refreshSubtree}
                  refreshParent={() => {
                    refreshSiblings();
                    refreshSubtree();
                  }}
                  partList={subTree}
                />
              )}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function EditPart({
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
    <WithEdit<PartPMod>
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
        return (
          <Form>
            <Input type="number" label="Count" {...bind("count")} />
            <Form.Label>Location</Form.Label>
            <SelectLocation {...bind("locationId")} />
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

interface UploadingFile {
  name: string;
  progress: number;
}

interface PartDocument {
  id: number;
  name: string;
  fileName: string;
  mimeType: string;
  primaryPhoto: boolean;
}

export function FileUploadInput({
  url,
  refresh,
  accept,
}: {
  url: string;
  refresh: () => void;
  accept?: string;
}) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Upload Document</Form.Label>
        <Form.Control
          type="file"
          multiple
          accept={accept}
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
                  uploadingFile.progress = Math.round((100 * loaded) / total);
                  setUploadingFiles((old) => [...old]); // force refresh
                });
            }
            setUploadingFiles((old) => [...old, ...tmp]);

            // clear the selected files
            e.target.value = "";
          }}
        />
      </Form.Group>
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
    </Form>
  );
}

function EditDocuments({ url, refresh }: { url: string; refresh: Observable }) {
  return (
    <WithData<PartDocument[]>
      refresh={refresh}
      url={url}
      render={(documents, refresh) => (
        <>
          <Form>
            <FileUploadInput {...{ url, refresh }} />
          </Form>
          <Table bordered hover style={{ height: "1px" /* ignored */ }}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Mime Type</th>
                <th>Primary</th>
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
                        <Input noMarginBottom {...bind("name")} />
                      </td>
                      <td>
                        <Input noMarginBottom {...bind("mimeType")} />
                      </td>
                      <td>
                        <Input
                          noMarginBottom
                          type="boolean"
                          {...bind("primaryPhoto")}
                        />
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

function useHandleImagePaste(partId?: number, onSuccess?: () => void) {
  useEffect(() => {
    const handlePasteAnywhere = (ev: any) => {
      console.log(ev);
      const event = ev as ClipboardEvent;
      if (event.clipboardData === null || partId === undefined) return;

      for (let i = 0; i < event.clipboardData?.items.length ?? 0; i++) {
        const item = event.clipboardData.items[i];
        console.log(item);
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
