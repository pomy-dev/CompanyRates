import { supabase } from "./supabaseService";

export async function uploadFileToStorage(path, file) {
  try {
    // Fetch the file as a Blob
    const response = await fetch(file.uri);
    const blob = await response.blob();

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("company-logos") // Replace with your actual bucket name
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false, // Set to true if you want to overwrite existing files
        contentType: file.mimeType || "application/octet-stream",
      });

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }

    // Retrieve the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("company-logos")
      .getPublicUrl(path);

    return publicUrlData.publicUrl;

  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
}