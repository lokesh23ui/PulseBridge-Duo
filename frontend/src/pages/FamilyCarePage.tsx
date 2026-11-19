import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Shield, Key, Check, X, AlertCircle, RefreshCw, 
  ChevronRight, HeartPulse, Clock, Copy, CheckCheck, Trash2, Sliders, FileText, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Relationship, AccessPermissions, CaregiverInvitation, ConnectedPatientCard } from '../types/family';

export const FamilyCarePage: React.FC = () => {
  const { user, role, token, isAuthenticated, loginAsDemoPatient, loginAsDemoCaregiver } = useAuth();
  const navigate = useNavigate();

  // State for Patient View
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [invitations, setInvitations] = useState<CaregiverInvitation[]>([]);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingRelationshipId, setEditingRelationshipId] = useState<number | null>(null);
  const [tempPermissions, setTempPermissions] = useState<AccessPermissions | null>(null);

  // State for Caregiver View
  const [connectedPatients, setConnectedPatients] = useState<ConnectedPatientCard[]>([]);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [relationshipLabelInput, setRelationshipLabelInput] = useState('Son');
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (role === 'patient') {
        const [rels, invites] = await Promise.all([
          api.getRelationships(token),
          api.getInvitations(token)
        ]);
        setRelationships(rels);
        setInvitations(invites);
      } else if (role === 'caregiver') {
        const patients = await api.getConnectedPatients(token);
        setConnectedPatients(patients);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load family connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [token, role, isAuthenticated]);

  // --- Patient Actions ---
  const handleGenerateInvitation = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.createInvitation(token);
      setNewInviteCode(res.invitation_code);
      setSuccessMsg(`New invitation code generated: ${res.invitation_code}`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApproveRequest = async (relId: number) => {
    if (!token) return;
    try {
      await api.approveRelationship(token, relId);
      setSuccessMsg('Caregiver request approved successfully');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve caregiver');
    }
  };

  const handleRejectRequest = async (relId: number) => {
    if (!token) return;
    try {
      await api.rejectRelationship(token, relId);
      setSuccessMsg('Caregiver request rejected');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject caregiver');
    }
  };

  const handleSavePermissions = async (relId: number) => {
    if (!token || !tempPermissions) return;
    try {
      await api.updateRelationshipPermissions(token, relId, tempPermissions as unknown as Record<string, boolean>);
      setSuccessMsg('Permissions updated successfully');
      setEditingRelationshipId(null);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    }
  };

  const handleRevoke = async (relId: number) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to revoke this caregiver’s access? They will immediately lose access to your data.')) return;
    try {
      await api.revokeRelationship(token, relId);
      setSuccessMsg('Caregiver access revoked');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke caregiver');
    }
  };

  // --- Caregiver Actions ---
  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !redeemCodeInput) return;
    setError(null);
    setLoading(true);
    try {
      await api.redeemInvitation(token, redeemCodeInput.trim().toUpperCase(), relationshipLabelInput);
      setSuccessMsg('Invitation redeemed! Pending approval from patient.');
      setShowRedeemModal(false);
      setRedeemCodeInput('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to redeem invitation code');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, prompt sign in
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center bg-slate-50 text-slate-900">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-teal-700 mx-auto flex items-center justify-center mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Family Care & Shared Monitoring</h2>
        <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
          PulseBridge Duo enables granular, patient-controlled telemetry sharing between patients and authorized family caregivers.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={async () => {
              await loginAsDemoPatient();
              loadData();
            }}
            className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HeartPulse className="w-4 h-4" />
            Sign in as Patient (Eleanor Vance)
          </button>
          <button
            onClick={async () => {
              await loginAsDemoCaregiver();
              loadData();
            }}
            className="w-full sm:w-auto px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            Sign in as Caregiver (Marcus Vance)
          </button>
        </div>
        <div className="mt-4">
          <Link to="/login" className="text-xs font-semibold text-teal-700 hover:text-teal-800 underline">
            Or sign in with custom email address →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold ${
              role === 'patient' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}>
              {role === 'patient' ? 'Patient Portal' : 'Caregiver Portal'}
            </span>
            <span className="text-xs text-slate-500">Logged in as <strong className="text-slate-900">{user?.full_name}</strong></span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            {role === 'patient' ? 'Caregiver Network & Permissions' : 'Connected Family & Patients'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            {role === 'patient' 
              ? 'You own your medical data. Invite family members and customize exactly what health information each caregiver is allowed to see.'
              : 'Review authorized telemetry, configure personalized alert thresholds, and monitor connected family members.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'patient' ? (
            <button
              onClick={handleGenerateInvitation}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              Invite Caregiver
            </button>
          ) : (
            <button
              onClick={() => setShowRedeemModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Patient via Code
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Connections"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* PATIENT VIEW                                                   */}
      {/* ============================================================== */}
      {role === 'patient' && (
        <div className="space-y-8">
          {/* Active Invitation Code Banner */}
          {newInviteCode && (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                  Single-Use Caregiver Invitation Token
                </span>
                <p className="text-sm text-slate-900 font-medium mt-0.5">
                  Share this code with your family member or caregiver to link their account:
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-emerald-900 tracking-wider bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 shadow-xs">
                    {newInviteCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(newInviteCode)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Code expires in 48 hours and can only be used once.
                </p>
              </div>
            </div>
          )}

          {/* Pending Approval Requests */}
          {relationships.filter(r => r.status === 'pending_approval').length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-amber-950">
                  Pending Caregiver Requests ({relationships.filter(r => r.status === 'pending_approval').length})
                </h3>
              </div>
              <p className="text-xs text-slate-700">
                The following caregivers have entered your invitation code and are requesting access to your health telemetry:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.filter(r => r.status === 'pending_approval').map((req) => (
                  <div key={req.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{req.caregiver_name}</p>
                        <p className="text-xs text-slate-500">{req.caregiver_email}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                        {req.relationship_label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Access
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Caregivers & Granular Permissions */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  Connected Caregivers & Access Permissions
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Configure granular permissions for each caregiver. You can grant or revoke telemetry, trends, reports, and alert rules individually.
                </p>
              </div>
            </div>

            {relationships.filter(r => r.status === 'active').length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-2xl">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                No active caregivers connected yet. Click <strong>"Invite Caregiver"</strong> above to generate an invitation code.
              </div>
            ) : (
              <div className="space-y-4">
                {relationships.filter(r => r.status === 'active').map((rel) => {
                  const isEditing = editingRelationshipId === rel.id;
                  const perms = isEditing ? tempPermissions : rel.permissions;

                  return (
                    <div key={rel.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      {/* Caregiver header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-sm">
                            {rel.caregiver_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{rel.caregiver_name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                                {rel.relationship_label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{rel.caregiver_email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSavePermissions(rel.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save Permissions
                              </button>
                              <button
                                onClick={() => setEditingRelationshipId(null)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingRelationshipId(rel.id);
                                setTempPermissions(rel.permissions ? { ...rel.permissions } : {
                                  view_live_readings: true,
                                  view_historical_readings: true,
                                  view_medical_reports: false,
                                  view_health_trends: true,
                                  create_manage_alert_rules: false,
                                  acknowledge_alerts: true,
                                  view_device_status: true
                                });
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 flex items-center gap-1 transition cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5 text-teal-600" />
                              Customize Permissions
                            </button>
                          )}

                          <button
                            onClick={() => handleRevoke(rel.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Revoke All Access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Granular 7 Permission Toggles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {[
                          { key: 'view_live_readings', label: 'Live Vitals', desc: 'Real-time HR, SpO2 & BP' },
                          { key: 'view_historical_readings', label: 'History Telemetry', desc: 'Up to 30 days charts' },
                          { key: 'view_health_trends', label: 'Health Trends', desc: 'Longitudinal risk summaries' },
                          { key: 'view_device_status', label: 'Device Status', desc: 'Ring/Watch battery & signal' },
                          { key: 'view_medical_reports', label: 'Medical Reports', desc: 'Doctor notes & clinical vault' },
                          { key: 'create_manage_alert_rules', label: 'Alert Rules', desc: 'Configure custom thresholds' },
                          { key: 'acknowledge_alerts', label: 'Acknowledge', desc: 'Mark health alerts verified' }
                        ].map((item) => {
                          const isEnabled = perms ? (perms as any)[item.key] : false;

                          return (
                            <div
                              key={item.key}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isEnabled
                                  ? 'bg-teal-50/80 border-teal-200'
                                  : 'bg-white border-slate-200 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">{item.label}</span>
                                {isEditing ? (
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      if (tempPermissions) {
                                        setTempPermissions({
                                          ...tempPermissions,
                                          [item.key]: e.target.checked
                                        });
                                      }
                                    }}
                                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                                  />
                                ) : (
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                    isEnabled
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {isEnabled ? 'ALLOWED' : 'LOCKED'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CAREGIVER VIEW                                                 */}
      {/* ============================================================== */}
      {role === 'caregiver' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedPatients.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm space-y-3">
                <HeartPulse className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">No Patients Connected Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ask the patient to generate an invitation code from their dashboard, then click "Add Patient via Code" to connect.
                </p>
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Connect Patient with Invitation Code
                </button>
              </div>
            ) : (
              connectedPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="bg-white border border-slate-200 hover:border-teal-300 p-6 rounded-3xl shadow-sm space-y-5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Patient Card Top */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                          {patient.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{patient.full_name}</h3>
                          <span className="text-[10px] font-mono text-teal-800 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 font-bold">
                            {patient.relationship_label}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        patient.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {patient.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Vitals preview */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Heart Rate</span>
                        <p className="text-xl font-black text-rose-600 mt-0.5 font-mono">
                          {patient.latest_heart_rate ? `${Math.round(patient.latest_heart_rate)} bpm` : '--'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">SpO2 Oxygen</span>
                        <p className="text-xl font-black text-teal-600 mt-0.5 font-mono">
                          {patient.latest_spo2 ? `${Math.round(patient.latest_spo2)}%` : '--'}
                        </p>
                      </div>
                    </div>

                    {/* Active Alerts Badge */}
                    <div className="mt-3.5 flex items-center justify-between text-xs text-slate-600">
                      <span>Active Health Alerts:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        patient.active_alert_count > 0 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {patient.active_alert_count} active
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    to={`/patient-monitor/${patient.patient_id}`}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Open Live Care Dashboard
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* REDEEM INVITATION MODAL (Caregiver)                           */}
      {/* ============================================================== */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Connect to a Patient
              </h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the 12-character invitation code generated by the patient (e.g. <code>PBD-XXXX-XXXX</code>).
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invitation Code</label>
                <input
                  type="text"
                  required
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="PBD-7K92-AX51"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono uppercase tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Relationship to Patient</label>
                <select
                  value={relationshipLabelInput}
                  onChange={(e) => setRelationshipLabelInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition"
                >
                  {['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling', 'Primary Physician', 'Visiting Nurse', 'Guardian', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Redeeming...' : 'Connect to Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
