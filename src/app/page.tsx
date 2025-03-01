"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import UserInfo from "@/components/UserInfo";
import ActionButtons from "@/components/ActionButtons";
import AttendanceTable from "@/components/AttendanceTable";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

export default function Home() {
  const [matchedUser, setMatchedUser] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);

  // Fetch the matched user's attendance data
  const fetchUserAttendanceData = async (username) => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_name", username) // Filter by the matched user's username
        .order("date", { ascending: false }) // Sort by date (newest first)
        .order("start_time", { ascending: false }); // Sort by start_time (newest first)

      if (error)
        throw new Error(`Error fetching attendance data: ${error.message}`);
      setAttendanceData(data); // Update state with the user's attendance data
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  // Handle user match (e.g., after face scan)
  const handleUserMatch = (user) => {
    setMatchedUser(user); // Set the matched user
    fetchUserAttendanceData(user.username); // Fetch the user's attendance data
  };

  // Handle attendance update (e.g., after marking present or ending duty)
  const handleAttendanceUpdate = async (username) => {
    await fetchUserAttendanceData(username); // Refetch the user's attendance data
  };

  return (
    <div>
      <Toaster />
      <Navbar />
      <div className="p-10 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex justify-between items-center lg:col-span-2">
            <ActionButtons
              onUserMatch={handleUserMatch} // Pass the updated handler
              onAttendanceUpdate={handleAttendanceUpdate} // Pass the updated handler
            />
          </div>
          <div className="lg:col-span-1">
            <UserInfo user={matchedUser} />
          </div>
        </div>
        <div className="mt-6">
          <AttendanceTable attendanceData={attendanceData} />
        </div>
      </div>
    </div>
  );
}
