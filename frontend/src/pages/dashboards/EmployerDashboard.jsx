import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    skills: '',
    location: '',
    jobType: 'Full-time',
    salaryRange: { min: '', max: '' },
  });
  const [applications, setApplications] = useState({});
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await apiService.getMyJobs();
      console.log('Loaded jobs:', data);
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      alert('Error loading jobs: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId) => {
    try {
      const data = await apiService.getJobApplications(jobId);
      console.log('Loaded applications:', data);
      setApplications((prev) => ({ ...prev, [jobId]: data.applications || [] }));
    } catch (error) {
      console.error('Error loading applications:', error);
      alert('Error loading applications: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        ...jobFormData,
        skills: jobFormData.skills.split(',').map((s) => s.trim()),
        salaryRange: {
          min: parseInt(jobFormData.salaryRange.min),
          max: parseInt(jobFormData.salaryRange.max),
        },
      };

      await apiService.createJob(jobData);
      setShowJobForm(false);
      setJobFormData({
        title: '',
        description: '',
        skills: '',
        location: '',
        jobType: 'Full-time',
        salaryRange: { min: '', max: '' },
      });
      loadJobs();
      alert('Job created successfully!');
    } catch (error) {
      alert(error.message || 'Failed to create job');
    }
  };

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await apiService.updateApplicationStatus(applicationId, status);
      if (selectedJob) {
        loadApplications(selectedJob);
      }
      alert('Application status updated!');
    } catch (error) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleMarkAsCompleted = async (jobId) => {
    if (!window.confirm('Are you sure you want to mark this job as completed? It will be hidden from all job seekers.')) {
      return;
    }

    try {
      await apiService.updateJob(jobId, { status: 'closed' });
      alert('Job marked as completed! It will no longer appear in job listings.');
      loadJobs(); // Reload jobs to reflect the change
    } catch (error) {
      alert(error.message || 'Failed to mark job as completed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employer Dashboard</h1>
        <button onClick={() => setShowJobForm(!showJobForm)} className="btn btn-primary">
          {showJobForm ? 'Cancel' : 'Create Job'}
        </button>
      </div>

      {showJobForm && (
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold mb-4">Create New Job</h2>
          <form onSubmit={handleCreateJob}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={jobFormData.location}
                  onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <select
                  value={jobFormData.jobType}
                  onChange={(e) => setJobFormData({ ...jobFormData, jobType: e.target.value })}
                  className="input"
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={jobFormData.skills}
                  onChange={(e) => setJobFormData({ ...jobFormData, skills: e.target.value })}
                  className="input"
                  placeholder="JavaScript, React, Node.js"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Min Salary (K)</label>
                <input
                  type="number"
                  value={jobFormData.salaryRange.min}
                  onChange={(e) =>
                    setJobFormData({
                      ...jobFormData,
                      salaryRange: { ...jobFormData.salaryRange, min: e.target.value },
                    })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Salary (K)</label>
                <input
                  type="number"
                  value={jobFormData.salaryRange.max}
                  onChange={(e) =>
                    setJobFormData({
                      ...jobFormData,
                      salaryRange: { ...jobFormData.salaryRange, max: e.target.value },
                    })
                  }
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={jobFormData.description}
                onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                className="input"
                rows="5"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Create Job
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">My Job Postings</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {job.location} • {job.jobType}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      Status: <span className={`badge ${
                        job.status === 'closed' ? 'badge-danger' : 
                        job.status === 'active' ? 'badge-success' : 
                        'badge-info'
                      }`}>
                        {job.status === 'closed' ? 'Completed' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </p>
                    {job.status === 'closed' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        This job is no longer visible to job seekers
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      if (selectedJob === job._id) {
                        setSelectedJob(null);
                      } else {
                        setSelectedJob(job._id);
                        loadApplications(job._id);
                      }
                    }}
                    className={`btn text-sm ${selectedJob === job._id ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {selectedJob === job._id ? 'Hide Applications' : `View Applications (${job.applications?.length || 0})`}
                  </button>
                  <Link to={`/jobs/${job._id}`} className="btn btn-secondary text-sm">
                    View Job
                  </Link>
                  {job.status !== 'closed' && (
                    <button
                      onClick={() => handleMarkAsCompleted(job._id)}
                      className="btn btn-danger text-sm"
                      title="Mark as completed - will hide from job seekers"
                    >
                      ✓ Mark as Completed
                    </button>
                  )}
                  {job.status === 'closed' && (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Reopen this job? It will become visible to job seekers again.')) {
                          return;
                        }
                        try {
                          await apiService.updateJob(job._id, { status: 'active' });
                          alert('Job reopened successfully!');
                          loadJobs();
                        } catch (error) {
                          alert(error.message || 'Failed to reopen job');
                        }
                      }}
                      className="btn btn-primary text-sm"
                    >
                      ↻ Reopen Job
                    </button>
                  )}
                </div>

                {selectedJob === job._id && applications[job._id] && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold mb-4">Applications ({applications[job._id].length})</h4>
                    {applications[job._id].length > 0 ? (
                      <div className="space-y-3">
                        {applications[job._id].map((app) => (
                          <div
                            key={app._id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-lg mb-1">{app.userId?.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  📧 {app.userId?.email}
                                </p>
                                {app.userId?.profile?.phone && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    📞 {app.userId.profile.phone}
                                  </p>
                                )}
                                {app.userId?.profile?.location && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    📍 {app.userId.profile.location}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Applied: {new Date(app.createdAt).toLocaleDateString()} at {new Date(app.createdAt).toLocaleTimeString()}
                                </p>
                                {app.coverLetter && (
                                  <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-sm">
                                    <p className="font-medium mb-1">Cover Letter:</p>
                                    <p className="text-gray-700 dark:text-gray-300">{app.coverLetter}</p>
                                  </div>
                                )}
                                {app.resume && (
                                  <div className="mt-2">
                                    <a 
                                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${app.resume}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                      📄 View Resume
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`badge ${
                                  app.status === 'accepted' ? 'badge-success' : 
                                  app.status === 'rejected' ? 'badge-danger' : 
                                  app.status === 'shortlisted' ? 'badge-info' : 
                                  'badge-warning'
                                }`}>
                                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                </span>
                                <select
                                  value={app.status}
                                  onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                                  className="input text-sm w-auto"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="reviewed">Reviewed</option>
                                  <option value="shortlisted">Shortlisted</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => navigate(`/chat/${app.userId?._id || app.userId?.id}?jobId=${job._id}`)}
                                className="btn btn-primary text-sm"
                              >
                                💬 Chat with Applicant
                              </button>
                              {app.userId?.profile?.skills && app.userId.profile.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">Skills:</span>
                                  {app.userId.profile.skills.slice(0, 5).map((skill, idx) => (
                                    <span key={idx} className="badge badge-info text-xs">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-center py-4">No applications yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No jobs posted yet. Create your first job!
          </p>
        )}
      </div>
    </div>
  );
};

export default EmployerDashboard;

