import { useState } from "react";
import Camera from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { toast } from "react-toastify";
import PartPMod from "./Part";
import { FileUploadInput } from "./PartsPage";
import { post } from "./useData";
import WithData from "./WithData";

export default function PhotoUpload() {
  const [showInput, setShowInput] = useState(false);
  return (
    <div>
      <WithData<number | null>
        url="api/photo/currentPart"
        refreshMs={500}
        render={(partId) => {
          const documentUrl = "api/part/" + partId + "/document";
          return (
            <div>
              {partId === null ? null : (
                <WithData<PartPMod>
                  url={"api/part/" + partId}
                  render={(part) => (
                    <div>
                      {part.name}
                      {showInput ? (
                        <FileUploadInput
                          url={documentUrl}
                          refresh={() => {}}
                          accept="image/jpg"
                        />
                      ) : (
                        <Camera
                          imageType="jpg"
                          onCameraError={() => setShowInput(true)}
                          onTakePhoto={async (dataUri) => {
                            const toastId = toast.loading(`uploading photo`, {
                              progress: 0,
                              hideProgressBar: false,
                            });
                            const blob = await (await fetch(dataUri)).blob();
                            post(documentUrl)
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
                                    progress: total === 0 ? 0 : loaded / total,
                                  });
                              });
                          }}
                        />
                      )}
                    </div>
                  )}
                />
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
