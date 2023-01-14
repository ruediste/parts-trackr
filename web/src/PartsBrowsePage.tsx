import { NavLink, useParams, useRoutes } from "react-router-dom";
import { PartReference } from "./InventoryEntry";
import { LinkToPart } from "./Part";
import WithData from "./WithData";

export default function PartsBrowsePage() {
  return useRoutes([
    {
      path: ":id/*",
      element: <PartsBrowsePageInner />,
    },
    {
      path: "*",
      element: <PartsBrowsePageInner />,
    },
  ]);
}

interface PartBrowseChildPMod {
  id: number;
  name: string;
  photoId: string;
  photoName: string;
}
interface PartBrowsePMod {
  id: number;
  name: string;
  parameterValues: string;
  isRoot: boolean;

  path: PartReference[];
  children: PartBrowseChildPMod[];
}
function PartsBrowsePageInner({}: {}) {
  const { id } = useParams();
  return (
    <WithData<PartBrowsePMod>
      url={"api/browse" + (id === undefined ? "" : "/" + id)}
      render={(pMod) => (
        <>
          {pMod.isRoot ? null : (
            <>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <NavLink to="/parts/browse">Root</NavLink>
                </li>
                {pMod.path.map((parent) => (
                  <li className="breadcrumb-item" key={parent.id}>
                    <LinkToPart browse sameWindow part={parent} />
                  </li>
                ))}
              </ol>
              <h1 style={{ display: "inline-block" }}> {pMod.name}</h1>{" "}
              <NavLink
                className="btn btn-link"
                to={"/parts/tree/" + +pMod.id}
                role="button"
              >
                Tree
              </NavLink>
              <div>{pMod.parameterValues}</div>
            </>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {pMod.children.map((child) => (
              <LinkToPart key={child.id} browse sameWindow part={child}>
                <div
                  className="card"
                  style={{ width: "18rem", height: "18rem" }}
                >
                  {child.photoId === null ? (
                    <div
                      className="card-img-top"
                      style={{ height: "13rem" }}
                    ></div>
                  ) : (
                    <img
                      alt=""
                      className="card-img-top"
                      style={{ height: "13rem", objectFit: "scale-down" }}
                      src={
                        "/api/document/" + child.photoId + "/" + child.photoName
                      }
                    />
                  )}
                  <div className="card-body">
                    <p className="card-text">{child.name}</p>
                  </div>
                </div>
              </LinkToPart>
            ))}
          </div>
        </>
      )}
    />
  );
}
