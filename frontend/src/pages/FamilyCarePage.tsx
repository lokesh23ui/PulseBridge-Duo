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
      setSuccessMsg(`New invitation code created: ${res.invitation_code}`);
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
      setRedeemCodeInput('');
      setShowRedeemModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Redemption failed. Check your invitation code.');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, prompt sign in or 1-click demo
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Family Care & Shared Monitoring</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          PulseBridge Duo enables granular, patient-controlled telemetry sharing between patients and authorized family caregivers.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={async () => {
              await loginAsDemoPatient();
              loadData();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <HeartPulse className="w-4 h-4" />
            Sign in as Demo Patient (Eleanor Vance)
          </button>
          <button
            onClick={async () => {
              await loginAsDemoCaregiver();
              loadData();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Sign in as Demo Caregiver (Marcus Vance)
          </button>
        </div>
        <div className="mt-4">
          <Link to="/login" className="text-xs text-blue-400 hover:underline">
            Or sign in with custom account →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold ${
              role === 'patient' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {role === 'patient' ? 'Patient Portal' : 'Caregiver Portal'}
            </span>
            <span className="text-xs text-slate-400">Logged in as <strong className="text-white">{user?.full_name}</strong></span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1.5 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            {role === 'patient' ? 'Caregiver Network & Permissions' : 'Connected Family & Patients'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Key className="w-4 h-4" />
              Invite Caregiver
            </button>
          ) : (
            <button
              onClick={() => setShowRedeemModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              Add Patient via Code
            </button>
          )}

          <button
            onClick={loadData}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            title="Refresh Connections"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ============================================================== */}
      {/* PATIENT VIEW                                                   */}
      {/* ============================================================== */}
      {role === 'patient' && (
        <div className="space-y-8">
          {/* Active Invitation Code Banner */}
          {newInviteCode && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Single-Use Caregiver Invitation Token
                </span>
                <p className="text-sm text-white font-medium mt-0.5">
                  Share this code with your family member or caregiver to link their account:
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300 tracking-wider bg-slate-950 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    {newInviteCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(newInviteCode)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Code expires in 48 hours and can only be used once.
                </p>
              </div>
            </div>
          )}

          {/* Pending Approval Requests */}
          {relationships.filter(r => r.status === 'pending_approval').length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-amber-300">
                  Pending Caregiver Requests ({relationships.filter(r => r.status === 'pending_approval').length})
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                The following caregivers have entered your invitation code and are requesting access to your health telemetry:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.filter(r => r.status === 'pending_approval').map((req) => (
                  <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{req.caregiver_name}</p>
                        <p className="text-xs text-slate-400">{req.caregiver_email}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {req.relationship_label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Access
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1"
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
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  Connected Caregivers & Access Permissions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure granular permissions for each caregiver. You can grant or revoke telemetry, trends, reports, and alert rules individually.
                </p>
              </div>
            </div>

            {relationships.filter(r => r.status === 'active').length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No active caregivers connected yet. Click <strong>"Invite Caregiver"</strong> above to generate an invitation code.
              </div>
            ) : (
              <div className="space-y-4">
                {relationships.filter(r => r.status === 'active').map((rel) => {
                  const isEditing = editingRelationshipId === rel.id;
                  const perms = isEditing ? tempPermissions : rel.permissions;

                  return (
                    <div key={rel.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
                      {/* Caregiver header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {rel.caregiver_name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{rel.caregiver_name}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {rel.relationship_label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{rel.caregiver_email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSavePermissions(rel.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save Permissions
                              </button>
                              <button
                                onClick={() => setEditingRelationshipId(null)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
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
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors"
                            >
                              <Sliders className="w-3.5 h-3.5 text-blue-400" />
                              Customize Permissions
                            </button>
                          )}

                          <button
                            onClick={() => handleRevoke(rel.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
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
                          { key: 'view_health_trends', label: 'Health Trends', desc: 'AI summary & risk scores' },
                          { key: 'view_device_status', label: 'Device Status', desc: 'Ring/Watch battery & signal' },
                          { key: 'view_medical_reports', label: 'Medical Reports', desc: 'Doctor notes & summaries' },
                          { key: 'create_manage_alert_rules', label: 'Alert Rules', desc: 'Configure custom thresholds' },
                          { key: 'acknowledge_alerts', label: 'Acknowledge', desc: 'Mark health alerts verified' }
                        ].map((item) => {
                          const isEnabled = perms ? (perms as any)[item.key] : false;

                          return (
                            <div
                              key={item.key}
                              className={`p-3 rounded-lg border transition-all ${
                                isEnabled
                                  ? 'bg-blue-950/20 border-blue-500/30'
                                  : 'bg-slate-900/40 border-slate-800 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-200">{item.label}</span>
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
                                    className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700 focus:ring-blue-500"
                                  />
                                ) : (
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                    isEnabled
                                      ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {isEnabled ? 'ALLOWED' : 'LOCKED'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">{item.desc}</p>
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
              <div className="col-span-full p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
                <HeartPulse className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-200">No Patients Connected Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Ask the patient to generate an invitation code from their dashboard, then click "Add Patient via Code" to connect.
                </p>
                <button
                  onClick={() => setShowRedeemModal(true)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-semibold shadow-lg transition-all"
                >
                  Connect Patient with Invitation Code
                </button>
              </div>
            ) : (
              connectedPatients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl shadow-xl space-y-5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Patient Card Top */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                          {patient.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">{patient.full_name}</h3>
                          <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                            {patient.relationship_label}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        patient.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {patient.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Vitals preview */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">Heart Rate</span>
                        <p className="text-xl font-black text-rose-400 mt-0.5">
                          {patient.latest_heart_rate ? `${Math.round(patient.latest_heart_rate)} bpm` : '--'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono">SpO2 Oxygen</span>
                        <p className="text-xl font-black text-blue-400 mt-0.5">
                          {patient.latest_spo2 ? `${Math.round(patient.latest_spo2)}%` : '--'}
                        </p>
                      </div>
                    </div>

                    {/* Active Alerts Badge */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>Active Health Alerts:</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        patient.active_alert_count > 0 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {patient.active_alert_count} active
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    to={`/patient-monitor/${patient.patient_id}`}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                Connect to a Patient
              </h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter the 12-character invitation code generated by the patient (e.g. <code>PBD-XXXX-XXXX</code>).
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invitation Code</label>
                <input
                  type="text"
                  required
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="PBD-7K92-AX51"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base font-mono uppercase tracking-wider text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Relationship to Patient</label>
                <select
                  value={relationshipLabelInput}
                  onChange={(e) => setRelationshipLabelInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  {['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling', 'Primary Physician', 'Visiting Nurse', 'Guardian', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-purple-600/20 disabled:opacity-50"
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
