"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaPlay, FaStop } from "react-icons/fa";
import * as faceapi from "face-api.js";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

const Webcam = dynamic(() => import("react-webcam"), { ssr: false });

function ActionButtons({ onUserMatch, onAttendanceUpdate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [isEndDutyModal, setIsEndDutyModal] = useState(false); // New state for End Duty modal
  const isProcessing = useRef(false);
  const webcamRef = useRef(null);
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

  const startRecognition = () => {
    recognitionInterval.current = setInterval(async () => {
      if (!modelsLoaded || !webcamRef.current?.video || isProcessing.current)
        return;

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

          isProcessing.current = true; // Prevent multiple matches at once
          await matchFaceData(faceDescriptor);
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Error during face detection:", error);
      }
    }, 500);
  };

  const matchFaceData = async (faceDescriptor) => {
    try {
      const { data: users, error } = await supabase.from("users").select("*");
      if (error) throw new Error(`Database fetch failed: ${error.message}`);

      for (const user of users) {
        const hexString = user.face_data.slice(2);
        const decodedString = Buffer.from(hexString, "hex").toString("utf-8");
        const faceDataArray = JSON.parse(decodedString);
        if (!Array.isArray(faceDataArray)) continue;

        const storedDescriptor = new Float32Array(faceDataArray);
        if (storedDescriptor.length !== faceDescriptor.length) continue;

        const distance = faceapi.euclideanDistance(
          storedDescriptor,
          faceDescriptor,
        );
        if (distance < 0.5) {
          // Adjusted threshold
          console.log("User matched:", user);
          setMatchedUser(user);
          onUserMatch(user);
          clearInterval(recognitionInterval.current);
          return;
        }
      }

      console.log("No matching user found.");
      isProcessing.current = false;
    } catch (error) {
      console.error("Error matching face data:", error);
      isProcessing.current = false;
    }
  };

  const handleStartDuty = () => {
    setIsModalOpen(true);
    setIsWebcamActive(true);
    setMatchedUser(null); // Reset matched user
    isProcessing.current = false;
    startRecognition();
  };

  const handleEndDuty = () => {
    setIsEndDutyModal(true); // Open End Duty modal
    setIsWebcamActive(true);
    setMatchedUser(null); // Reset matched user
    isProcessing.current = false;
    startRecognition();
  };

  const handleMarkAttendance = async () => {
    if (!matchedUser) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existingEntry, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_name", matchedUser.username)
        .eq("date", today)
        .is("end_time", null);

      if (fetchError)
        throw new Error(`Fetching attendance failed: ${fetchError.message}`);
      if (existingEntry && existingEntry.length > 0) {
        alert(
          "You already have an active duty today. Please end your duty before starting a new one.",
        );
        return;
      }

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .insert([
          {
            user_name: matchedUser.username,
            date: today,
            start_time: new Date().toLocaleTimeString(),
            status: "Present",
          },
        ])
        .select();

      if (attendanceError)
        throw new Error(`Attendance update failed: ${attendanceError.message}`);

      console.log("Attendance updated:", attendanceData);
      onAttendanceUpdate(matchedUser.username); // Pass the username to refetch data
      handleCloseModal();
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleEndDutyUpdate = async () => {
    if (!matchedUser) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existingEntry, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_name", matchedUser.username)
        .eq("date", today)
        .is("end_time", null);

      if (fetchError)
        throw new Error(`Fetching attendance failed: ${fetchError.message}`);
      if (!existingEntry || existingEntry.length === 0) {
        alert("No active duty found for today.");
        return;
      }

      const { data: updatedEntry, error: updateError } = await supabase
        .from("attendance")
        .update({ end_time: new Date().toLocaleTimeString() })
        .eq("id", existingEntry[0].id)
        .select();

      if (updateError)
        throw new Error(`Updating attendance failed: ${updateError.message}`);

      console.log("Duty ended:", updatedEntry);
      onAttendanceUpdate(matchedUser.username); // Pass the username to refetch data
      handleCloseModal();
    } catch (error) {
      console.error("Error ending duty:", error);
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEndDutyModal(false);
    setIsWebcamActive(false);
    setMatchedUser(null);
    isProcessing.current = false;
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
          onClick={handleEndDuty}
        >
          <FaStop className="text-red-500" />
          <span className="text-black">End Duty</span>
        </Button>
      </div>

      {(isModalOpen || isEndDutyModal) && (
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
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width="100%"
                  videoConstraints={{ facingMode: "user" }}
                />
              )}
              <div
                className={`mt-2 ${faceDetected ? "text-green-600" : "text-red-600"}`}
              >
                {faceDetected ? "Face Detected" : "No Face Detected"}
              </div>

              {matchedUser && (
                <div className="mt-4 text-center">
                  <p className="text-green-600 font-semibold">
                    User Matched: {matchedUser.username}
                  </p>
                  {isModalOpen && (
                    <Button
                      onClick={handleMarkAttendance}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                      Mark Present
                    </Button>
                  )}
                  {isEndDutyModal && (
                    <Button
                      onClick={handleEndDutyUpdate}
                      className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md"
                    >
                      End Duty
                    </Button>
                  )}
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
