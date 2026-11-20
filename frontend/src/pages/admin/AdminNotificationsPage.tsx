import React, { useEffect, useState } from 'react';
import { 
  Bell, Plus, RefreshCw, AlertTriangle, CheckCircle2, 
  X, Info, Wrench, ShieldAlert, AlertCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AdminAnnouncement } from '../../types/admin';

export const AdminNotificationsPage: React.FC = () => {
  const { token } = useAuth();
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [annType, setAnnType] = useState<'info' | 'warning' | 'maintenance' | 'urgent'>('info');
  const [audience, setAudience] = useState<'all' | 'patient' | 'caregiver'>('all');
  const [creating, setCreating] = useState(false);

  const fetchAnnouncements = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminAnnouncements(token);
      setAnnouncements(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [token]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await api.createAdminAnnouncement(token, {
        title,
        message,
        announcement_type: annType,
        target_audience: audience
      });
      setIsCreateOpen(false);
      setTitle('');
      setMessage('');
      await fetchAnnouncements();
    } catch (err: any) {
      alert(`Error creating announcement: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: number, currentActive: boolean) => {
    if (!token) return;
    try {
      await api.toggleAdminAnnouncementStatus(token, id, !currentActive);
      await fetchAnnouncements();
    } catch (err: any) {
      alert(`Error updating announcement status: ${err.message}`);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Wrench className="w-3 h-3" /> MAINTENANCE</span>;
      case 'warning':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200"><AlertTriangle className="w-3 h-3" /> WARNING</span>;
      case 'urgent':
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"><ShieldAlert className="w-3 h-3" /> URGENT</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><Info className="w-3 h-3" /> INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
              Broadcast System Notices
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-500 font-mono">Separate from Clinical Threshold Alerts</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            System Announcements & Maintenance Notices
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Broadcast platform updates, scheduled maintenance notices, and clinical alerts to patients and caregivers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Notice
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Notice</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Toggle Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{a.title}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{a.message}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {getTypeBadge(a.announcement_type)}
                    </td>

                    <td className="py-3.5 px-4 font-mono uppercase text-[10px] font-bold text-slate-700">
                      {a.target_audience}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        a.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {a.is_active ? 'BROADCASTING' : 'INACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(a.id, a.is_active)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          a.is_active
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {a.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-mono text-xs">
                    {loading ? 'Querying announcements...' : 'No system announcements created yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Announcement Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                Create System Announcement
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance or Feature Release"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details of the announcement for platform users..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Type</label>
                  <select
                    value={annType}
                    onChange={(e: any) => setAnnType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="info">General Info</option>
                    <option value="maintenance">Maintenance Notice</option>
                    <option value="warning">System Warning</option>
                    <option value="urgent">Urgent Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e: any) => setAudience(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                  >
                    <option value="all">All Users (Global)</option>
                    <option value="patient">Patients Only</option>
                    <option value="caregiver">Caregivers Only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
              >
                {creating ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
