"use client";
import { useState } from "react";
import UserInfo from "@/components/UserInfo";
import ActionButtons from "@/components/ActionButtons";
import AttendanceTable from "@/components/AttendanceTable";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [matchedUser, setMatchedUser] = useState(null);

  return (
    <div>
      <Navbar />
      <div className="p-10 bg-gray-100 dark:bg-gray-900 min-h-screen space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex justify-between items-center lg:col-span-2">
            <ActionButtons onUserMatch={setMatchedUser} />
          </div>
          <div className="lg:col-span-1">
            <UserInfo user={matchedUser} />
          </div>
        </div>
        <div className="mt-6">
          <AttendanceTable />
        </div>
      </div>
    </div>
  );
}
