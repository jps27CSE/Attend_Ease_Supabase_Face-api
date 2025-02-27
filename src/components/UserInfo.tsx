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
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Employee Info</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="space-y-4">
            {/* Profile Picture */}
            {profilePicUrl && (
              <div className="flex justify-center">
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
            {/* User Information */}
            <p>
              <strong>Name:</strong> {user.username}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>
        ) : (
          <p>No employee data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default UserInfo;
