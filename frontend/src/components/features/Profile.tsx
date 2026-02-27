import React, { useEffect, useMemo, useState } from 'react';
import { UserProfile, SocialMediaProfile } from '@shared/types';
import { updateUserProfile, logoutUser } from '../../services/authService';
import { getSavedRoadmaps, getSavedCourses } from '../../services/storageService';
import { getAllCodeSubmissions } from '../../services/codeIntegrityService';
import { getProblemById, getProblemCountLive } from '../../services/problemLibraryService';

interface Props {
  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  onBack: () => void;
}

const Profile: React.FC<Props> = ({ user, setUser, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  const [stats, setStats] = useState({ roadmaps: 0, courses: 0 });
  const [saveMsg, setSaveMsg] = useState('');
  const [savePulse, setSavePulse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user.avatarImage || null);

  useEffect(() => {
    setFormData(user);
    setImagePreview(user.avatarImage || null);
  }, [user]);

  useEffect(() => {
    setStats({ roadmaps: getSavedRoadmaps().length, courses: getSavedCourses().length });
  }, []);

  const coding = useMemo(() => {
    const totals = getProblemCountLive();
    const submissions = getAllCodeSubmissions(user.email);
    const acceptedIds = new Set(submissions.filter((s) => s.status === 'accepted').map((s) => s.problemId));
    const attemptedIds = new Set(submissions.map((s) => s.problemId));
    const diff = { Easy: 0, Medium: 0, Hard: 0 };
    acceptedIds.forEach((id) => {
      const p = getProblemById(id);
      if (p) diff[p.difficulty] += 1;
    });

    const totalCatalog = totals.Easy + totals.Medium + totals.Hard;
    const percent = Math.round((acceptedIds.size / Math.max(1, totalCatalog)) * 100);

    const byDay: Record<string, number> = {};
    submissions.forEach((s) => {
      const day = new Date(s.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const last70: Array<{ day: string; count: number }> = [];
    for (let i = 69; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      last70.push({ day, count: byDay[day] || 0 });
    }

    let streak = 0;
    for (let i = last70.length - 1; i >= 0; i--) {
      if (last70[i].count > 0) streak += 1;
      else break;
    }

    return {
      totals,
      solved: acceptedIds.size,
      attempted: attemptedIds.size,
      percent,
      diff,
      streak,
      last70,
    };
  }, [user.email, savePulse]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB before compression)
    if (file.size > 2 * 1024 * 1024) {
      setSaveMsg('❌ Image too large (max 2MB). Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      let base64 = reader.result as string;

      // If image is still too large as base64, try to compress
      if (base64.length > 500000) { // ~500KB base64
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Calculate dimensions (max 800px)
          let width = img.width;
          let height = img.height;
          const maxSize = 800;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress as JPEG
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressed);
          setFormData((prev) => ({ ...prev, avatarImage: compressed }));
          setSaveMsg('');
        };
        img.src = base64;
      } else {
        setImagePreview(base64);
        setFormData((prev) => ({ ...prev, avatarImage: base64 }));
        setSaveMsg('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    setSaveMsg('');

    try {
      // Validate and prepare data
      const payload = {
        name: formData.name?.trim() || user.name,
        avatarImage: formData.avatarImage,
        targetRole: formData.targetRole?.trim() || '',
        skills: formData.skills?.trim() || '',
        socialMedia: formData.socialMedia || [],
      } as Partial<UserProfile>;

      // Check localStorage size before saving large images
      const serialized = JSON.stringify(payload);
      if (serialized.length > 4000000) { // ~4MB limit
        setSaveMsg('❌ Image file too large. Please use a smaller image.');
        setTimeout(() => setSaving(false), 350);
        return;
      }

      // Use updateUserProfile which handles both current and legacy keys
      const updated = updateUserProfile(payload);

      if (!updated) {
        setSaveMsg('❌ Failed to save profile. Please try again.');
        setTimeout(() => setSaving(false), 350);
        return;
      }

      // Verify localStorage persistence
      const stored = localStorage.getItem('KBV_user_profile');
      if (!stored) {
        setSaveMsg('❌ Storage error. Check browser storage settings.');
        setTimeout(() => setSaving(false), 350);
        return;
      }

      // Update component state with actual persisted data
      setUser(updated);
      setFormData(updated);
      setIsEditing(false);
      setSaveMsg('✓ Profile saved successfully');
      setSavePulse(true);
      setTimeout(() => setSavePulse(false), 900);
      setTimeout(() => setSaveMsg(''), 2200);
    } catch (error) {
      setSaveMsg(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => setSaving(false), 350);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-2">
        Back to Dashboard
      </button>

      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${savePulse ? 'scale-[1.01] ring-2 ring-orange-300' : ''}`}>
        <div className="h-32 bg-gradient-to-r from-orange-600 to-orange-700" />

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-white bg-slate-500">
                  {imagePreview ? <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" /> : formData.name.charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-orange-600 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-orange-700">
                    Edit
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="mb-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-2xl font-bold text-slate-900 border-b border-slate-300 focus:outline-none focus:border-orange-600 bg-transparent"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-slate-900">{formData.name}</h1>
                )}
                <p className="text-slate-500">{formData.email}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Edit Profile</button>
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100">Sign Out</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {saveMsg && <p className="text-sm text-emerald-600 mb-3">{saveMsg}</p>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Career Goals</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Account Role</label>
                    <p className="text-slate-900 font-medium capitalize">{formData.role}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Subscription Plan</label>
                    <p className="text-slate-900 font-medium capitalize">{formData.subscriptionPlan}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Target Role</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.targetRole || ''}
                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{formData.targetRole || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current Skills</label>
                    {isEditing ? (
                      <textarea
                        rows={3}
                        value={formData.skills || ''}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-slate-900">{formData.skills || 'No skills listed yet.'}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Social Profiles</h3>
                  <p className="text-sm text-slate-500 mb-3">Add your professional and coding profile links.</p>

                  {[
                    { key: 'professional', label: 'Professional Profile', placeholder: 'https://your-professional-profile' },
                    { key: 'code_repo', label: 'Code Repository', placeholder: 'https://your-code-repository' },
                    { key: 'practice_profile', label: 'Practice Profile', placeholder: 'https://your-practice-profile' },
                    { key: 'learning_profile', label: 'Learning Profile', placeholder: 'https://your-learning-profile' },
                  ].map((item) => {
                    const existing = formData.socialMedia?.find((s) => s.platform === item.key as any)?.url || '';
                    return (
                      <div key={item.key} className="mb-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">{item.label}</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={existing}
                            onChange={(e) => {
                              const url = e.target.value;
                              const copy: SocialMediaProfile[] = formData.socialMedia ? [...formData.socialMedia] : [];
                              const idx = copy.findIndex((s) => s.platform === item.key as any);
                              if (idx !== -1) copy[idx] = { ...copy[idx], url };
                              else copy.push({ platform: item.key as any, username: '', url });
                              setFormData({ ...formData, socialMedia: copy });
                            }}
                            placeholder={item.placeholder}
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-orange-500"
                          />
                        ) : (
                          <p className="text-slate-700 text-sm">
                            {existing ? <a href={existing} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Visit profile</a> : 'Not added'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Coding Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full grid place-items-center text-xs font-bold text-slate-900" style={{ background: `conic-gradient(#ea580c ${coding.percent}%, #e2e8f0 0)` }}>
                    <div className="w-14 h-14 rounded-full bg-white grid place-items-center">{coding.percent}%</div>
                  </div>
                  <div className="text-sm text-slate-700">
                    <p>Solved: <span className="font-semibold text-slate-900">{coding.solved}</span></p>
                    <p>Attempted: <span className="font-semibold text-slate-900">{coding.attempted}</span></p>
                    <p>Streak: <span className="font-semibold text-orange-600">{coding.streak} days</span></p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-800">Easy {coding.diff.Easy}/{coding.totals.Easy}</div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-800">Med {coding.diff.Medium}/{coding.totals.Medium}</div>
                  <div className="p-2 rounded bg-rose-50 border border-rose-100 text-rose-800">Hard {coding.diff.Hard}/{coding.totals.Hard}</div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Submission Heatmap (70 days)</p>
                  <div className="grid grid-cols-10 gap-1">
                    {coding.last70.map((d) => (
                      <div key={d.day} title={`${d.day}: ${d.count}`} className={`h-3 rounded ${d.count === 0 ? 'bg-slate-100' : d.count < 3 ? 'bg-orange-200' : d.count < 6 ? 'bg-orange-400' : 'bg-orange-600'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Your Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <span className="font-medium text-orange-800">Saved Roadmaps</span>
                    <span className="text-2xl font-bold text-orange-600">{stats.roadmaps}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="font-medium text-blue-800">Saved Courses</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.courses}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-400 rounded-xl p-6 text-sm">
                <p>Member since:</p>
                <p className="text-white font-medium">{new Date(formData.joinedDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
