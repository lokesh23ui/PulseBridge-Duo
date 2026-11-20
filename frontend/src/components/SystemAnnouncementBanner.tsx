import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Wrench, AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

export const SystemAnnouncementBanner: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    let isMounted = true;
    api.getActiveAnnouncements(token).then((data) => {
      if (isMounted && Array.isArray(data)) {
        setAnnouncements(data);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  const activeToShow = announcements.filter(a => !dismissed.includes(a.id));
  if (activeToShow.length === 0) return null;

  return (
    <div className="bg-slate-900 border-b border-purple-500/30 text-white text-xs">
      {activeToShow.map((ann) => (
        <div key={ann.id} className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {ann.announcement_type === 'maintenance' && <Wrench className="w-4 h-4 text-amber-400 shrink-0" />}
            {ann.announcement_type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />}
            {ann.announcement_type === 'urgent' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
            {ann.announcement_type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
            <span>
              <strong>{ann.title}:</strong> {ann.message}
            </span>
          </div>
          <button
            onClick={() => setDismissed(prev => [...prev, ann.id])}
            className="text-slate-400 hover:text-white p-1"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
