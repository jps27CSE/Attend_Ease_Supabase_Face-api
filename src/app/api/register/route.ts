import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import Busboy from "busboy";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default body parser
  },
};

export async function POST(req: Request) {
  try {
    // Check if the Content-Type header is set to multipart/form-data
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      throw new Error("Invalid Content-Type. Expected multipart/form-data");
    }

    const busboy = Busboy({ headers: req.headers });
    const formData: { [key: string]: any } = {};

    // Handle file uploads and fields
    const fileUploadPromise = new Promise<Buffer>((resolve, reject) => {
      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname === "profilePic") {
          const chunks: Buffer[] = [];
          file.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });
          file.on("end", () => {
            formData.profilePic = {
              buffer: Buffer.concat(chunks),
              filename,
              mimetype,
            };
            resolve(Buffer.concat(chunks));
          });
        } else {
          file.resume(); // Ignore other files
        }
      });

      busboy.on("field", (fieldname, value) => {
        formData[fieldname] = value;
      });

      busboy.on("finish", () => {
        resolve(Buffer.from([])); // Resolve with empty buffer if no file is uploaded
      });

      busboy.on("error", (err) => {
        reject(err);
      });

      // Pipe the request body to busboy
      if (req.body) {
        (req.body as ReadableStream).pipeTo(
          new WritableStream({
            write(chunk) {
              busboy.write(chunk);
            },
            close() {
              busboy.end();
            },
          }),
        );
      } else {
        reject(new Error("Request body is missing"));
      }
    });

    // Wait for file upload to complete
    await fileUploadPromise;

    // Extract form fields
    const { username, faceData } = formData;
    const profilePic = formData.profilePic;

    if (!username || !faceData || !profilePic) {
      throw new Error("Missing required fields");
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile_pictures")
      .upload(
        `${username}/${Date.now()}_${profilePic.filename}`,
        profilePic.buffer,
        {
          contentType: profilePic.mimetype,
        },
      );

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Insert user data into database
    const { data: user, error: dbError } = await supabase
      .from("users")
      .insert([
        {
          username,
          profile_picture: uploadData?.path,
          face_data: JSON.parse(faceData),
        },
      ])
      .select();

    if (dbError) {
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
