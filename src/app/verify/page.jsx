"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import axios from "axios";

const DOCUMENT_TYPES = [
  "National ID",
  "Passport",
  "Driver's License",
];

export default function VerifyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.verified === "verified") {
      router.push("/");
    }
  }, [status, session]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    const toBase64 = (f) =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result.replace(/data:.*base64,/, ""));
        r.onerror = reject;
        r.readAsDataURL(f);
      });

    try {
      const base64 = await toBase64(file);
      const res = await fetch("/api/UploadImage", {
        method: "POST",
        body: JSON.stringify({ image: base64, type: "verification" }),
      });
      const data = await res.json();
      if (data.image) {
        setUploadedUrl(data.image);
      } else {
        Swal.fire({ title: "Upload Failed", text: data.message || "Try again.", icon: "error" });
        setPreviewSrc(null);
      }
    } catch (err) {
      Swal.fire({ title: "Upload Failed", text: "Something went wrong.", icon: "error" });
      setPreviewSrc(null);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleSubmit = async () => {
    if (!uploadedUrl) {
      Swal.fire({ title: "No Document", text: "Please upload an identity document first.", icon: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/SubmitVerification", {
        documentUrl: uploadedUrl,
        documentType,
      });

      await update({ verified: "pending" });

      Swal.fire({
        title: "Submitted!",
        text: "Your document is under review. We'll notify you once approved.",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => router.push("/"));

    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.error || "Something went wrong.",
        icon: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Icon icon="eva:loader-outline" className="animate-spin text-gray-400" width={48} />
      </div>
    );
  }

  const verifiedStatus = session?.user?.verified;

  return (
    <div className="max-w-lg mx-auto mt-[100px] px-4 pb-12">
      <div className="bg-white rounded-2xl shadow-lg p-8">

        <div className="flex items-center gap-3 mb-2">
          <Icon icon="mdi:shield-account" width={32} className="text-red-500" />
          <h1 className="text-2xl font-extrabold text-gray-900">Identity Verification</h1>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          To book items or post listings, you must verify your identity. Upload a clear photo of a valid government-issued ID.
        </p>

        {/* Pending */}
        {verifiedStatus === "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <Icon icon="mdi:clock-outline" width={22} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-700">Under Review</p>
              <p className="text-sm text-yellow-600 mt-0.5">
                Your document has been submitted and is being reviewed. This usually takes 1–2 business days.
              </p>
            </div>
          </div>
        )}

        {/* Rejected */}
        {verifiedStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
            <Icon icon="mdi:shield-remove-outline" width={22} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-600">Verification Rejected</p>
              <p className="text-sm text-red-500 mt-0.5">
                Your previous submission was rejected. Please upload a valid document and resubmit.
              </p>
            </div>
          </div>
        )}

        {/* Upload form — for unverified and rejected */}
        {(verifiedStatus === "unverified" || verifiedStatus === "rejected") && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="select select-bordered w-full rounded-xl"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Upload Document *
              </label>
              <label
                htmlFor="doc-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all
                  ${uploading ? "border-gray-300 bg-gray-50" : "border-red-300 hover:border-red-400 hover:bg-red-50"}`}
              >
                {uploading ? (
                  <>
                    <Icon icon="line-md:uploading-loop" width={48} className="text-gray-400" />
                    <p className="text-sm text-gray-400 mt-2">Uploading...</p>
                  </>
                ) : previewSrc ? (
                  <img src={previewSrc} alt="Preview" className="h-full w-full object-contain rounded-xl p-2" />
                ) : (
                  <>
                    <Icon icon="mdi:file-upload-outline" width={48} className="text-red-400" />
                    <p className="text-sm text-gray-500 mt-2">Click to upload ID document</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
                  </>
                )}
              </label>
              <input
                id="doc-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </div>

            {uploadedUrl && !uploading && (
              <p
                className="text-xs text-red-500 hover:underline cursor-pointer mb-4 -mt-4"
                onClick={() => { setUploadedUrl(null); setPreviewSrc(null); }}
              >
                Remove and upload a different document
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || uploading || !uploadedUrl}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 hover:scale-[1.02] hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Icon icon="eva:loader-outline" width={20} className="animate-spin" /> Submitting…</>
              ) : (
                <><Icon icon="mdi:shield-check" width={20} /> Submit for Verification</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}