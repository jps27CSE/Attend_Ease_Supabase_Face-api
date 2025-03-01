"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function UserInfo({ user }) {
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  // Fetch the profile picture URL from Supabase Storage
  useEffect(() => {
    if (user?.profile_picture) {
      const fetchProfilePic = async () => {
        try {
          const { data, error } = await supabase.storage
            .from("profile_pictures") // Replace with your bucket name
            .createSignedUrl(user.profile_picture, 3600); // URL expires in 1 hour

          if (error) {
            throw new Error(`Error fetching profile picture: ${error.message}`);
          }

          setProfilePicUrl(data?.signedUrl);
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      };

      fetchProfilePic();
    }
  }, [user]);

  return (
    <Card className="shadow-lg rounded-lg max-w-sm mx-auto bg-white border-2 border-gray-200">
      <CardHeader className="bg-blue-600 p-4 rounded-t-lg">
        <CardTitle className="text-xl font-bold text-white text-center">
          Employee ID Card
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {user ? (
          <div className="space-y-4">
            {/* Profile Picture */}
            {profilePicUrl && (
              <div className="flex justify-center">
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              </div>
            )}

            {/* User Information */}
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-gray-800">
                {user.username}
              </p>
              <p className="text-lg text-gray-600">{user.role}</p>
            </div>

            {/* Additional Details (Optional) */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                <strong>Employee ID:</strong>{" "}
                {user.id
                  ? `${user.id.substring(0, 6)}...` // Truncate the ID and add ellipsis
                  : "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center">
            No employee data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default UserInfo;
