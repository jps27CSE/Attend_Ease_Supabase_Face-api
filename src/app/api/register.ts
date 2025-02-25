import { supabase } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { username, profilePicture, faceData } = req.body;

    // Save the image (profile picture) to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from("profile_pictures")
      .upload(
        `${username}/${Date.now()}.jpg`,
        Buffer.from(profilePicture.split(",")[1], "base64"),
        {
          contentType: "image/jpeg",
        },
      );

    if (uploadError) {
      return res
        .status(500)
        .json({ error: "Error uploading profile picture." });
    }

    const profilePicUrl = data?.path; // URL of the uploaded picture

    // Save user to the users table in Supabase
    const { data: user, error } = await supabase
      .from("users")
      .insert([
        { username, profile_picture: profilePicUrl, face_data: faceData },
      ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res
      .status(200)
      .json({ message: "User registered successfully", user });
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
