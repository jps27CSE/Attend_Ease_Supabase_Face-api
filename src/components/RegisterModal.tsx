"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import * as faceapi from "face-api.js";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import Webcam to avoid SSR issues
const Webcam = dynamic(() => import("react-webcam"), {
  ssr: false, // Disable server-side rendering
});

const RegisterModal = ({ open, setOpen }) => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState(""); // State for role/designation
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null); // Store File object
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const webcamRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const recognitionInterval = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
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
    startRecognition();
  };

  const handleStopRecognition = () => {
    setIsRecognizing(false);
    clearInterval(recognitionInterval.current);
  };

  const startRecognition = () => {
    recognitionInterval.current = setInterval(async () => {
      if (!modelsLoaded || !webcamRef.current?.video) return;

      try {
        const detections = await faceapi
          .detectAllFaces(
            webcamRef.current.video,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }), // Adjust confidence threshold
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          setFaceDetected(true);
          setFaceDescriptor(detections[0].descriptor);
          console.log("Face Descriptor:", Array.from(detections[0].descriptor)); // Log descriptor
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }, 500); // Run every 500ms
  };

  const handleSubmit = async () => {
    if (!username || !profilePicFile || !faceDescriptor || !role) {
      console.log("Missing required fields");
      return;
    }

    try {
      // Upload profile picture to Supabase Storage
      const filePath = `${username}/${Date.now()}_${profilePicFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile_pictures")
        .upload(filePath, profilePicFile);

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Insert user data into Supabase database
      const { data: user, error: dbError } = await supabase
        .from("users")
        .insert([
          {
            username,
            role, // Include role/designation in the insert
            profile_picture: filePath,
            face_data: Array.from(faceDescriptor), // Convert Float32Array to array
          },
        ])
        .select();

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log("Registration successful:", user);
      setOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error during registration:", error);
    }
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
              className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
              placeholder="Enter username"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Role/Designation
            </label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
              placeholder="Enter role/designation (e.g., Software Engineer)"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setProfilePic(URL.createObjectURL(e.target.files[0]));
                setProfilePicFile(e.target.files[0]); // Store the file object
              }}
              className="w-full mt-2 p-2 border border-gray-300 rounded-md text-black"
            />
            {profilePic && (
              <img
                src={profilePic}
                alt="Profile"
                className="mt-2 w-24 h-24 rounded-full object-cover"
              />
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
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  videoConstraints={{ facingMode: "user" }}
                />
                <div
                  className={`mt-2 ${faceDetected ? "text-green-600" : "text-red-600"}`}
                >
                  {faceDetected ? "Face Detected" : "No Face Detected"}
                </div>
                <Button
                  variant="destructive"
                  onClick={handleStopRecognition}
                  className="mt-2 w-full text-black"
                >
                  Stop Recognition
                </Button>
              </div>
            )}
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
