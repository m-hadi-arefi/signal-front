"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { X, Upload, Loader2 } from "lucide-react";

interface Props {
  username: string;
  initialBio: string | null;
  initialAvatar: string | null;
  onClose: () => void;
  onSaved: (data: { bio: string | null; avatar: string | null }) => void;
}

export function ProfileEditModal({ username, initialBio, initialAvatar, onClose, onSaved }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(initialBio || "");
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setAvatar(url);
        toast.success("Image uploaded");
      } else {
        const { error } = await res.json().catch(() => ({ error: "Upload failed" }));
        toast.error(error || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || undefined,
          avatar: avatar || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated");
        onSaved({ bio: bio || null, avatar });
        onClose();
      } else {
        const { error } = await res.json().catch(() => ({ error: "Failed to save" }));
        toast.error(error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <Avatar src={avatar} username={username} size="xl" />
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload avatar"}
              </Button>
              <p className="text-xs text-white/40 mt-1.5">JPG, PNG, WEBP. Max 5MB.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Bio</label>
            <Textarea
              rows={3}
              maxLength={500}
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="text-xs text-white/30 mt-1 text-right">{bio.length}/500</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="flex-1">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
