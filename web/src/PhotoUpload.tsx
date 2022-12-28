import Camera from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { toast } from "react-toastify";
import Part from "./Part";
import { post } from "./useData";
import WithData from "./WithData";

export default function PhotoUpload() {
  return (
    <div>
      {/* <img src="/api/photo/qrCode" /> */}
      <WithData<number | null>
        url="api/photo/currentPart"
        refreshMs={500}
        render={(partId) => (
          <div>
            {partId === null ? null : (
              <WithData<Part>
                url={"api/part/" + partId}
                render={(part) => (
                  <div>
                    {part.name}
                    <Camera
                      imageType="jpg"
                      onTakePhoto={async (dataUri) => {
                        const toastId = toast.loading(`uploading photo`, {
                          progress: 0,
                          hideProgressBar: false,
                        });
                        const blob = await (await fetch(dataUri)).blob();
                        post("api/part/" + partId + "/document")
                          .bodyRaw(blob)
                          .query({ name: "photo.jpg" })
                          .error((e) => {
                            toast.dismiss(toastId);
                            toast.error("photo upload failed");
                          })
                          .success((data) => {
                            toast.dismiss(toastId);
                            toast.success("uploaded photo");
                          })
                          .upload(({ loaded, total }) => {
                            if (loaded < total)
                              toast.update(toastId, {
                                progress: total == 0 ? 0 : loaded / total,
                              });
                          });
                      }}
                    />
                  </div>
                )}
              />
            )}
          </div>
        )}
      />
    </div>
  );
}
