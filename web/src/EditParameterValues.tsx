import { Button, InputGroup, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import Input from "./Input";
import { ParameterDefinitionBase } from "./Location";
import { ParameterValuePMod } from "./Part";
import { SiPrefixInput } from "./siPrefix";
import { Binding } from "./useBinding";
import { Observable, post, req } from "./useData";
import WithData from "./WithData";

function EditParameterValue({
  url,
  value,
  update,
}: {
  url: string;
  value: ParameterValuePMod;
  update: () => void;
}) {
  return (
    <EditParameterValueNoLoad
      definition={value.definition}
      value={value.value}
      setValue={(v) => {
        value.value = v;
        post(url)
          .body(value)
          .success(() => {
            toast.success(value.definition.name + " updated");
            update();
          })
          .send();
      }}
    />
  );
}

export function EditParameterValueNoLoad({
  definition,
  value,
  setValue,
}: {
  definition: ParameterDefinitionBase;
  value: string | null;
  setValue: (value: string | null) => void;
}) {
  const stringBinding: () => { binding: any } = () => ({
    binding: {
      get: () => value,
      set: async (v) => {
        setValue(v);
      },
    } as Binding<string | null>,
  });
  const numberBinding: () => { binding: any } = () => ({
    binding: {
      get: () => (value == null ? null : parseFloat(value)),
      set: async (v) => {
        setValue("" + v ?? "");
      },
    } as Binding<number | null>,
  });

  switch (definition.type) {
    case "TEXT":
      return <Input {...stringBinding()} />;
    case "NUMBER":
      return <Input type="number" {...numberBinding()} />;
    case "VALUE":
      return (
        <SiPrefixInput
          {...numberBinding()}
          afterElement={<InputGroup.Text>{definition.unit}</InputGroup.Text>}
        />
      );
    case "CHOICE":
      return <span>TODO</span>;
  }
}

export default function EditParameterValues({
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
