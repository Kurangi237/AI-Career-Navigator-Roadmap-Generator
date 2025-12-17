import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, logoutUser } from '../services/authService';
import { getSavedRoadmaps, getSavedCourses } from '../services/storageService';

interface Props {
  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  onBack: () => void;
}

const Profile: React.FC<Props> = ({ user, setUser, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  const [stats, setStats] = useState({ roadmaps: 0, courses: 0 });

  // ✅ Always derive preview from formData
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.avatarImage || null
  );

  // 🔁 Sync when user updates (IMPORTANT FIX)
  useEffect(() => {
    setFormData(user);
    setImagePreview(user.avatarImage || null);
  }, [user]);

  useEffect(() => {
    const r = getSavedRoadmaps();
    const c = getSavedCourses();
    setStats({ roadmaps: r.length, courses: c.length });
  }, []);

  // ✅ Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setFormData({ ...formData, avatarImage: base64 });
    };
    reader.readAsDataURL(file);
  };

  // 🔒 Existing save logic (unchanged)
  const handleSave = () => {
    const updated = updateUserProfile(formData);
    if (updated) {
      setUser(updated); // header + reload fix
      setIsEditing(false);
    }
  };

  // 🔒 Existing logout logic (unchanged)
  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={onBack}
        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-4"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#2f8d46] to-[#1e6b30]"></div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              {/* ✅ FIXED HEADER PROFILE IMAGE */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-white bg-slate-500">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.name.charAt(0).toUpperCase()
                  )}
                </div>

                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-[#2f8d46] text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-[#1e6b30]">
                    Edit
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* ✅ Name Edit */}
              <div className="mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="text-2xl font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-[#2f8d46] bg-transparent"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-slate-900">
                    {formData.name}
                  </h1>
                )}
                <p className="text-slate-500">{formData.email}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-[#2f8d46] text-white rounded-lg font-medium hover:bg-[#1e6b30]"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  🎯 Career Goals
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Target Role
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.targetRole || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            targetRole: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2f8d46]"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">
                        {formData.targetRole || 'Not set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Current Skills
                    </label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={formData.skills || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            skills: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2f8d46]"
                      />
                    ) : (
                      <p className="text-slate-900">
                        {formData.skills || 'No skills listed yet.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">
                  Your Activity
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="font-medium text-green-800">
                      Saved Roadmaps
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {stats.roadmaps}
                    </span>
                  </div>

                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="font-medium text-blue-800">
                      Saved Courses
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.courses}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-400 rounded-xl p-6 text-sm">
                <p>Member since:</p>
                <p className="text-white font-medium">
                  {new Date(formData.joinedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
