import { ReactNode, useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Observable, post, QueryStringObj, req } from "./useData";
import WithData from "./WithData";
import { EditRenderFunction, WithEdit } from "./WithEdit";

interface EditListColumn<T> {
  label: string;
  render: (item: T) => ReactNode;
}

type MultiEditSelection<TListItem> = "all" | Set<TListItem>;

export function EditList<
  TListItem extends { id: number | null },
  TEdit
>(props: {
  columns: EditListColumn<TListItem>[];
  url: string;
  createAddValue: () => any;
  renderEdit: EditRenderFunction<TEdit>;
  onPreSave?: (value: TEdit) => void;
  onPostSave?: () => void;
  refresh?: Observable;
  queryParams?: QueryStringObj;
  horizontal?: boolean;
  renderMultiEdit?: (args: {
    selection: MultiEditSelection<TListItem>;
    refresh: () => void;
    close: () => void;
  }) => JSX.Element;
}) {
  const [selected, setSelected] = useState<number>();
  const [multiSelection, setMultiSelection] = useState(
    new Set() as MultiEditSelection<TListItem>
  );

  useEffect(() => {
    setSelected(undefined);
  }, [props.url]);

  const horizontal = props.horizontal === true;
  const hasMultiEdit = props.renderMultiEdit !== undefined;
  const multiSelectionEmpty =
    !hasMultiEdit || (multiSelection !== "all" && multiSelection.size == 0);

  return (
    <WithData<TListItem[]>
      url={props.url}
      queryParams={props.queryParams}
      refresh={props.refresh}
      render={(listItems, refresh) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: horizontal ? "row" : "column",
              columnGap: horizontal ? "10px" : undefined,
              alignItems: "start",
            }}
          >
            <Table
              bordered
              hover
              style={{
                flex: horizontal ? "0 0 50%" : undefined,
              }}
            >
              <thead>
                <tr>
                  {!hasMultiEdit ? null : (
                    <th>
                      {multiSelection === "all" ? (
                        <i
                          className="bi bi-check-square"
                          onClick={() => {
                            setSelected(undefined);
                            setMultiSelection(new Set());
                          }}
                        ></i>
                      ) : (
                        <i
                          className="bi bi-square"
                          onClick={() => {
                            setSelected(undefined);
                            setMultiSelection("all");
                          }}
                        ></i>
                      )}
                    </th>
                  )}
                  {props.columns.map((c, idx) => (
                    <th key={idx}>{c.label}</th>
                  ))}
                  <th>
                    {" "}
                    <Button
                      onClick={() =>
                        post(props.url)
                          .body(props.createAddValue())
                          .success((d) => {
                            refresh();
                            setSelected(d.id);
                          })
                          .send()
                      }
                    >
                      Add
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {listItems.map((p, idx) => {
                  const toggleMultiSelection = () => {
                    setSelected(undefined);
                    setMultiSelection((x) => {
                      if (multiSelection === "all" || multiSelection.has(p)) {
                        const result = new Set(x === "all" ? listItems : x);
                        result.delete(p);
                        return result;
                      } else {
                        const result = new Set(x as Set<TListItem>);
                        result.add(p);
                        return result;
                      }
                    });
                  };
                  return (
                    <tr
                      className={
                        selected === p.id ||
                        multiSelection == "all" ||
                        multiSelection.has(p)
                          ? "table-active"
                          : undefined
                      }
                      key={idx}
                      onClick={() => {
                        if (!multiSelectionEmpty) toggleMultiSelection();
                        else if (p.id != null) setSelected(p.id);
                      }}
                    >
                      {!hasMultiEdit ? null : (
                        <td
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMultiSelection();
                          }}
                        >
                          {multiSelection === "all" || multiSelection.has(p) ? (
                            <i className="bi bi-check-square"></i>
                          ) : (
                            <i className="bi bi-square"></i>
                          )}
                        </td>
                      )}
                      {props.columns.map((c, idx) => (
                        <td key={idx}>{c.render(p)}</td>
                      ))}
                      <td>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(undefined);
                            req(props.url + "/" + p.id)
                              .method("DELETE")
                              .success(refresh)
                              .send();
                          }}
                        >
                          <i className="bi bi-trash"></i>{" "}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            {selected === undefined || !multiSelectionEmpty ? null : (
              <div
                style={{
                  flex: horizontal ? "0 0 50%" : undefined,
                }}
              >
                <WithEdit<TEdit>
                  url={props.url + "/" + selected}
                  onSuccess={() => {
                    refresh();
                    props.onPostSave?.call(null);
                  }}
                  onPreSave={props.onPreSave}
                  render={(args) => (
                    <>
                      <Button onClick={() => setSelected(undefined)}>
                        Close
                      </Button>
                      {props.renderEdit(args)}
                    </>
                  )}
                />
              </div>
            )}
            {multiSelectionEmpty ? null : (
              <div
                style={{
                  flex: horizontal ? "0 0 50%" : undefined,
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setMultiSelection(new Set())}
                  style={{ marginRight: "8px" }}
                >
                  {" "}
                  Close{" "}
                </Button>

                {props.renderMultiEdit!({
                  selection: multiSelection,
                  refresh,
                  close: () => setMultiSelection(new Set()),
                })}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
