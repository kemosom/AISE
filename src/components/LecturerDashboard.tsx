import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Eye,
  FileDown,
  UserPlus,
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import type { AuthUserPublic } from '../../lib/auth/types';
import { apiClient, apiFetch } from '../lib/api-client';

interface StudentRosterItem {
  id: string;
  name: string;
  email: string;
  studentId: string;
  mustChangePassword: boolean;
  createdAt: string;
  labs: Record<string, { status: string; progress: number; submittedAt?: string; hasSubmission: boolean }>;
}

interface LecturerDashboardProps {
  user: AuthUserPublic;
  onPreviewLab: (labId: string) => void;
  onViewSubmissions: (labId: string) => void;
}

export const LecturerDashboard: React.FC<LecturerDashboardProps> = ({
  user,
  onPreviewLab,
  onViewSubmissions,
}) => {
  const [activeTab, setActiveTab] = useState<'labs' | 'students' | 'submissions'>('labs');
  const [labs, setLabs] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [downloadingZipLabId, setDownloadingZipLabId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [labsData, studentsData] = await Promise.all([
        apiClient.get('/api/labs'),
        apiClient.get('/api/lecturer/students'),
      ]);

      setLabs(labsData.labs || []);
      setStudents(studentsData.students || []);
    } catch (err: any) {
      setError(err.message || 'Error loading lecturer records');
    } finally {
      setLoading(false);
    }
  };

  const toggleLabLock = async (labId: string, currentUnlocked: boolean) => {
    try {
      await apiClient.fetch(`/api/lecturer/labs/${labId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUnlocked: !currentUnlocked }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleExamMode = async (labId: string, currentExamMode: boolean) => {
    try {
      await apiClient.fetch(`/api/lecturer/labs/${labId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examMode: !currentExamMode }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/lecturer/students', {
        name: newStudentName,
        studentId: newStudentId,
        email: newStudentEmail,
      });

      setIsAddStudentOpen(false);
      setNewStudentName('');
      setNewStudentId('');
      setNewStudentEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus('Processing CSV roster...');
    try {
      const data = await apiClient.post('/api/lecturer/students/import-csv', { csvText });

      setImportStatus(`Successfully imported ${data.importedCount} student accounts.`);
      setTimeout(() => {
        setIsCsvModalOpen(false);
        setCsvText('');
        setImportStatus(null);
        fetchData();
      }, 1200);
    } catch (err: any) {
      setImportStatus(`Import Error: ${err.message}`);
    }
  };

  const handleDownloadAllZip = async (labId: string, labTitle: string) => {
    setDownloadingZipLabId(labId);
    try {
      const res = await apiFetch(`/api/lecturer/labs/${labId}/download-all`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to download reports archive');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAI5124_${labId}_Submissions.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloadingZipLabId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Course Lecturer Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">
            <span>Instructor Administration</span>
            <span>•</span>
            <span>MAI5124 Course Governance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Lecturer Control & Laboratory Orchestration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control module availability, import student cohorts, inspect code/reports, and download
            academic DOCX submissions.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('labs')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'labs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Lab Availability</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'students' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Student Roster ({students.length})</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'submissions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Submissions & ZIP</span>
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* TAB 1: LABS AVAILABILITY */}
      {activeTab === 'labs' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Laboratory Release Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Unlock laboratories to make them available for students. Locked labs block both UI
                and direct URL requests.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 border border-slate-200 rounded cursor-pointer"
            >
              Refresh Status
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Lab #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4">Exam Mode</th>
                  <th className="py-3 px-4 text-right">Instructor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {lab.labNumber === 12 ? 'EXAM' : `Lab ${String(lab.labNumber).padStart(2, '0')}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{lab.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{lab.shortDescription}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleLabLock(lab.id, lab.isUnlocked)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer border transition-colors ${
                          lab.isUnlocked
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {lab.isUnlocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Unlocked (Active)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Locked (Hidden)</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleExamMode(lab.id, lab.examMode)}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer ${
                          lab.examMode
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{lab.examMode ? 'Exam Active' : 'Off'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onPreviewLab(lab.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium cursor-pointer"
                        title="Preview as student"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => onViewSubmissions(lab.id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium cursor-pointer"
                      >
                        <span>Submissions</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT ROSTER */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Enrolled Class Roster
              </h2>
              <p className="text-xs text-slate-500">
                Manage cohort members. Initial password for students is their Student ID with
                mandatory password reset on first login.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV Roster</span>
              </button>
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Lab 01 Status</th>
                  <th className="py-3 px-4">Password State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const lab01Info = st.labs['lab01-behavioral-programming'];
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {st.studentId || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{st.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{st.email}</td>
                      <td className="py-3.5 px-4">
                        {lab01Info?.hasSubmission ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lab01Info?.progress ? `${lab01Info.progress}% In Progress` : 'Not Started'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {st.mustChangePassword ? (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Initial (Student ID)
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Secure Hash Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBMISSIONS & ZIP DOWNLOAD */}
      {activeTab === 'submissions' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student Laboratory Submissions & Bulk Export
            </h2>
            <p className="text-xs text-slate-500">
              Download native Word reports for individual students or export all reports in a ZIP
              archive for offline academic grading.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {labs.map((lab) => (
              <div key={lab.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-800 text-xs">
                    {lab.labNumber === 12 ? 'EX' : `L${String(lab.labNumber).padStart(2, '0')}`}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{lab.title}</h3>
                    <p className="text-[11px] text-slate-500">{lab.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadAllZip(lab.id, lab.title)}
                    disabled={downloadingZipLabId === lab.id}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-medium rounded cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-900" />
                    <span>
                      {downloadingZipLabId === lab.id ? 'Packaging ZIP...' : 'Download All (.zip)'}
                    </span>
                  </button>
                  <button
                    onClick={() => onViewSubmissions(lab.id)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded cursor-pointer"
                  >
                    <span>View Submissions</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Add Student to Roster</h3>
            <p className="text-xs text-slate-500 mb-4">
              Initial password will be set to the student's ID automatically.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Johnathan Tan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="e.g. 24012350"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. student@imail.sunway.edu.my"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded cursor-pointer"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Import Class Roster from CSV</h3>
            <p className="text-xs text-slate-500 mb-3">
              Paste CSV text formatted as: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">name,student_id,email</code>
            </p>

            <form onSubmit={handleImportCsv} className="space-y-3">
              <textarea
                rows={6}
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="name,student_id,email&#10;Muhammad Hafiz,24012351,hafiz@imail.sunway.edu.my&#10;Chloe Lim,24012352,chloe@imail.sunway.edu.my"
                className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded outline-none"
              />

              {importStatus && (
                <div className="p-2 bg-slate-100 text-slate-800 text-xs rounded font-medium">
                  {importStatus}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCsvText(
                      'name,student_id,email\nMuhammad Hafiz,24012351,hafiz@imail.sunway.edu.my\nChloe Lim,24012352,chloe@imail.sunway.edu.my'
                    );
                  }}
                  className="text-xs text-blue-900 underline hover:text-blue-700 cursor-pointer"
                >
                  Load Sample Roster
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded cursor-pointer"
                  >
                    Import Students
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
