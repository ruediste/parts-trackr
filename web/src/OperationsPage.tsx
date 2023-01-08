import { Button } from "react-bootstrap";
import { post } from "./useData";

export default function OperationsPage() {
  return (
    <>
      <Button
        onClick={() =>
          post("api/document/_updateAllPrimaryPhotos")
            .success("Photos Updated")
            .send()
        }
      >
        Update All Primary Photos
      </Button>
    </>
  );
}
