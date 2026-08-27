import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  secure: true,
});
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const validateFile = (file: File): void => {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, WEBP, GIF, and PDF files are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File exceeds 5 MB limit");
  }
};

const uploadToCloudinary = async (
  file: File,
  publicId?: string,
): Promise<UploadApiResponse> => {
  validateFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const resourceType = file.type === "application/pdf" ? "raw" : "auto";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "emca",
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

const uploadBufferToCloudinary = async (
  buffer: Buffer,
  publicId?: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "emca",
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

export { uploadToCloudinary, uploadBufferToCloudinary };
