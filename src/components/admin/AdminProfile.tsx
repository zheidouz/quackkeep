import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import type { FarmerProfile } from '../../types';
import { fetchProfile, saveProfile } from '../../services/profile';

const DEFAULT_PROFILE: FarmerProfile = {
  farmName: '', farmerName: '', location: '',
  farmGoal: '', breed: '', since: '', customFields: {},
};

export default function AdminProfile() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<FarmerProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetchProfile()
      .then((data) => setProfile({ ...data, customFields: data.customFields || {} }))
      .catch(() => { /* ignore */ })
      .finally(() => setLoading(false));
  }, []);

  const addCustomField = () => {
    const key = newKey.trim();
    if (!key) return;
    setProfile((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [key]: newValue },
    }));
    setNewKey('');
    setNewValue('');
  };

  const removeCustomField = (key: string) => {
    setProfile((prev) => {
      const next = { ...prev.customFields };
      delete next[key];
      return { ...prev, customFields: next };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile(profile);
      showToast('Profile saved! AI will use it.');
    } catch {
      showToast('Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-homestead-green/10 rounded w-1/3 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-homestead-green/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-homestead-green opacity-75">
        🧑‍🌾 Farm Profile
      </h3>
      <p className="text-xs text-homestead-green/70">
        This tells QuackKeep AI who you are. Add any custom data below to feed your AI.
      </p>

      {/* Standard fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Your Name</label>
          <input
            value={profile.farmerName}
            onChange={(e) => setProfile({ ...profile, farmerName: e.target.value })}
            placeholder="e.g. Juan"
            className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Farm Name</label>
          <input
            value={profile.farmName}
            onChange={(e) => setProfile({ ...profile, farmName: e.target.value })}
            placeholder="e.g. Itik Gulaman Farm"
            className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">Location</label>
        <input
          value={profile.location}
          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          placeholder="e.g. Nueva Ecija, Philippines"
          className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Duck Breed</label>
          <input
            value={profile.breed}
            onChange={(e) => setProfile({ ...profile, breed: e.target.value })}
            placeholder="e.g. Itik, Pekin, Muscovy"
            className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Farming Since</label>
          <input
            value={profile.since}
            onChange={(e) => setProfile({ ...profile, since: e.target.value })}
            placeholder="e.g. 2020"
            className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">Farm Goal</label>
        <input
          value={profile.farmGoal}
          onChange={(e) => setProfile({ ...profile, farmGoal: e.target.value })}
          placeholder="e.g. Sell 5000 eggs per month"
          className="w-full bg-homestead-beige/50 border border-homestead-green rounded-lg px-3 py-2 text-sm font-bold"
        />
      </div>

      {/* Custom Fields */}
      <div className="border-t border-homestead-green/20 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-homestead-green mb-2">
          🧩 Custom Data (fed to AI)
        </h4>
        <p className="text-xs text-homestead-green/60 mb-3">
          Add any extra info about your farm. The AI will see it as context.
        </p>

        {Object.entries(profile.customFields || {}).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-homestead-green bg-homestead-beige/50 px-2 py-1.5 rounded-lg border border-homestead-green/30 min-w-[80px] shrink-0">
              {key}
            </span>
            <input
              value={value}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  customFields: { ...prev.customFields, [key]: e.target.value },
                }))
              }
              className="flex-1 text-sm text-homestead-green bg-white px-3 py-1.5 rounded-lg border border-homestead-green/30 focus:outline-none focus:border-homestead-green"
            />
            <button
              type="button"
              onClick={() => removeCustomField(key)}
              className="w-7 h-7 rounded-full bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
              aria-label="Remove field"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Add new custom field */}
        <div className="flex items-center gap-2 mt-3">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Field name"
            className="w-[120px] bg-white border border-homestead-green/30 rounded-lg px-3 py-2 text-xs font-bold"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1 bg-white border border-homestead-green/30 rounded-lg px-3 py-2 text-xs font-bold"
          />
          <button
            type="button"
            onClick={addCustomField}
            disabled={!newKey.trim()}
            className="px-3 py-2 bg-homestead-green text-white text-xs font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
          >
            + Add
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-homestead-green text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
      >
        💾 Save Profile
      </button>
    </form>
  );
}
