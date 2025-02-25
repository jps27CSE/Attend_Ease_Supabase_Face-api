import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as faceapi from "face-api.js";

const WebcamWithNoSSR = dynamic(() => import("react-webcam"), { ssr: false });

const RegisterModal = ({ open, setOpen }) => {
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const webcamRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        console.log("Models loaded successfully");
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    if (typeof window !== "undefined") {
      loadModels();
    }
  }, []);

  const handleWebcamCapture = () => {
    setIsWebcamActive(true);
    setIsRecognizing(true);
  };

  const handleStopRecognition = () => {
    setIsRecognizing(false);
  };

  const handleWebcamFrame = async () => {
    if (modelsLoaded && webcamRef.current?.video && isRecognizing) {
      try {
        const detections = await faceapi
          .detectAllFaces(
            webcamRef.current.video,
            new faceapi.SsdMobilenetv1Options(),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        setFaceDetected(detections.length > 0);
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }
  };

  useEffect(() => {
    let intervalId;
    if (isRecognizing) {
      intervalId = setInterval(handleWebcamFrame, 100);
    }
    return () => clearInterval(intervalId);
  }, [isRecognizing, modelsLoaded]);

  const handleSubmit = () => {
    console.log({ username, profilePic, faceDetected });
    setOpen(false);
  };

  return (
    open && (
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-black">
              Register New User
            </h2>
            <Button
              className="text-black"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
          <div className="mt-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
              placeholder="Enter username"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 ">
              Upload Profile Picture
            </label>
            <input
              type="file"
              onChange={(e) =>
                setProfilePic(URL.createObjectURL(e.target.files[0]))
              }
              className="w-full mt-2 p-2 border border-gray-300 rounded-md"
            />
            {profilePic && (
              <div className="mt-2">
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={handleWebcamCapture}
              className="w-full text-black"
            >
              {isWebcamActive ? "Webcam Active" : "Open Webcam"}
            </Button>
            {isWebcamActive && (
              <div className="mt-4">
                <WebcamWithNoSSR
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  videoConstraints={{
                    facingMode: "user",
                  }}
                />
                {faceDetected ? (
                  <div className="mt-2 text-green-600">Face Detected</div>
                ) : (
                  isRecognizing && (
                    <div className="mt-2 text-red-600">No Face Detected</div>
                  )
                )}
              </div>
            )}
          </div>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={handleStopRecognition}
              className="w-full text-black"
            >
              Stop Recognition
            </Button>
          </div>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="w-full text-black"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    )
  );
};

export default RegisterModal;
