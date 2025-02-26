"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaPlay, FaStop } from "react-icons/fa";
import * as faceapi from "face-api.js";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// Dynamically import Webcam to avoid SSR issues
const Webcam = dynamic(() => import("react-webcam"), {
  ssr: false,
});

function ActionButtons() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const webcamRef = useRef(null);
  const recognitionInterval = useRef(null);

  // Load face-api.js models
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

  // Start face recognition
  const startRecognition = () => {
    recognitionInterval.current = setInterval(async () => {
      if (!modelsLoaded || !webcamRef.current?.video) return;

      try {
        const detections = await faceapi
          .detectAllFaces(
            webcamRef.current.video,
            new faceapi.SsdMobilenetv1Options(),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length > 0) {
          setFaceDetected(true);
          const faceDescriptor = detections[0].descriptor;
          await matchFaceData(faceDescriptor); // Match face data with Supabase
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }, 500); // Run every 500ms
  };

  // Match face data with Supabase users table
  const matchFaceData = async (faceDescriptor) => {
    try {
      // Fetch all users from the database
      const { data: users, error } = await supabase.from("users").select("*");

      if (error) {
        throw new Error(`Database fetch failed: ${error.message}`);
      }

      // Compare face descriptors
      if (users && users.length > 0) {
        for (const user of users) {
          // Decode the hexadecimal face_data
          const hexString = user.face_data.slice(2); // Remove the \x prefix
          const decodedString = Buffer.from(hexString, "hex").toString("utf-8");
          const faceDataArray = JSON.parse(decodedString);

          // Ensure the face_data is an array and convert it to Float32Array
          if (Array.isArray(faceDataArray)) {
            const storedDescriptor = new Float32Array(faceDataArray);

            // Ensure both descriptors have the same length
            if (storedDescriptor.length === faceDescriptor.length) {
              const distance = faceapi.euclideanDistance(
                storedDescriptor,
                faceDescriptor,
              );

              // If the distance is below a threshold, it's a match
              if (distance < 0.6) {
                console.log("User matched:", user);
                return; // Exit after finding a match
              }
            } else {
              console.error("Descriptor length mismatch:", {
                stored: storedDescriptor.length,
                detected: faceDescriptor.length,
              });
            }
          } else {
            console.error("Invalid face_data format for user:", user.username);
          }
        }
      }

      console.log("No matching user found.");
    } catch (error) {
      console.error("Error matching face data:", error);
    }
  };

  // Handle Start Duty button click
  const handleStartDuty = () => {
    setIsModalOpen(true);
    setIsWebcamActive(true);
    setIsRecognizing(true);
    startRecognition();
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsWebcamActive(false);
    setIsRecognizing(false);
    clearInterval(recognitionInterval.current);
  };

  return (
    <>
      <div className="p-6 bg-gray-200 rounded-lg shadow-lg flex justify-center items-center space-x-6">
        <Button
          variant="outline"
          className="flex items-center space-x-2 px-6 py-3 text-lg font-semibold bg-blue-100 hover:bg-blue-200 focus:ring-2 ring-blue-500"
          onClick={handleStartDuty}
        >
          <FaPlay className="text-blue-500" />
          <span>Start Duty</span>
        </Button>
        <Button
          variant="destructive"
          className="flex items-center space-x-2 px-6 py-3 text-lg font-semibold bg-red-100 hover:bg-red-200 focus:ring-2 ring-red-500"
        >
          <FaStop className="text-red-500" />
          <span className="text-black">End Duty</span>
        </Button>
      </div>

      {/* Webcam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">
                Face Recognition
              </h2>
              <Button
                className="text-black"
                variant="outline"
                onClick={handleCloseModal}
              >
                Close
              </Button>
            </div>
            <div className="mt-4">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActionButtons;
