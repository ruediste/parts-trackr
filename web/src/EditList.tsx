import { ReactNode, useEffect, useState } from "react";
import { Button, Table } from "react-bootstrap";
import { Observable, post, req } from "./useData";
import WithData from "./WithData";
import { EditRenderFunction, WithEdit } from "./WithEdit";

interface EditListColumn<T> {
  label: string;
  render: (item: T) => ReactNode;
}
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
}) {
  const [selected, setSelected] = useState<number>();

  useEffect(() => {
    setSelected(undefined);
  }, [props.url]);

  return (
    <WithData<TListItem[]>
      url={props.url}
      refresh={props.refresh}
      render={(listItems, refresh) => {
        return (
          <>
            <Table bordered hover>
              <thead>
                <tr>
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
                {listItems.map((p, idx) => (
                  <tr
                    className={selected === p.id ? "table-active" : undefined}
                    key={idx}
                    onClick={() => {
                      if (p.id != null) setSelected(p.id);
                    }}
                  >
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
                ))}
              </tbody>
            </Table>
            {selected === undefined ? null : (
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
            )}
          </>
        );
      }}
    />
  );
}
