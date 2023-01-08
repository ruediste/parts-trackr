import { Form } from "react-bootstrap";
import { EditList } from "./EditList";
import Input from "./Input";
import { LinkToPart } from "./InventoryEntriesPage";
import PartPMod from "./Part";
import { EditPart } from "./PartsPage";
import { useStateAndBind } from "./useBinding";
import { useObservable } from "./useData";

export default function SearchPartPage() {
  const [filter, , bindFilter] = useStateAndBind("");
  const [refreshListObservable, refreshList] = useObservable();
  const [refreshDocumentsObservable] = useObservable();
  return (
    <>
      <Form
        onSubmit={(e) => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          return e.preventDefault();
        }}
      >
        <Input {...bindFilter} />
      </Form>
      <EditList<PartPMod, PartPMod>
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
            render: (p) => <LinkToPart part={p} />,
          },
        ]}
        createAddValue={() => ({})}
        url="api/part"
        queryParams={{
          maxResults: 20,
          filter,
        }}
        refresh={refreshListObservable}
        renderEdit={({ bind, value }) => (
          <EditPart
            close={() => {}}
            id={value.id}
            onModified={() => refreshList()}
            refreshDocuments={refreshDocumentsObservable}
          />
        )}
      />
    </>
  );
}
