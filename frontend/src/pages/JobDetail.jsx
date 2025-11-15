import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../utils/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({ resume: null, coverLetter: '' });

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const data = await apiService.getJob(id);
      setJob(data.job);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resume) {
      alert('Please select a resume file');
      return;
    }

    setApplying(true);
    try {
      const applicationFormData = new FormData();
      applicationFormData.append('jobId', id);
      applicationFormData.append('resume', formData.resume);
      applicationFormData.append('coverLetter', formData.coverLetter);

      await apiService.applyForJob(applicationFormData);
      alert('Application submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert(error.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <p className="text-red-600 dark:text-red-400">Job not found</p>
        </div>
      </div>
    );
  }

  // If job is closed and user is not the employer or admin, show message
  if (job.status === 'closed' && user?.role !== 'employer' && user?.role !== 'admin' && user?.id !== job.employerId?._id) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-semibold mb-4">Job No Longer Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This job posting has been marked as completed by the employer and is no longer accepting applications.
          </p>
          <Link to="/jobs" className="btn btn-primary">
            Browse Other Jobs
          </Link>
        </div>
      </div>
    );
  }

  const isJobSeeker = user?.role === 'jobseeker';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card mb-6">
        <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
        <div className="flex flex-wrap gap-4 mb-6 text-gray-600 dark:text-gray-400">
          <span>📍 {job.location}</span>
          <span>💼 {job.jobType}</span>
          <span>
            💰 ${job.salaryRange.min}K - ${job.salaryRange.max}K
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Skills Required</h2>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill, idx) => (
              <span key={idx} className="badge badge-info">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {job.description}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Employer</h2>
          <p className="text-gray-700 dark:text-gray-300">{job.employerId?.name || 'N/A'}</p>
          <p className="text-gray-600 dark:text-gray-400">{job.employerId?.email || ''}</p>
        </div>

        {isJobSeeker && job.status === 'active' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Apply for this Job</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Resume (PDF or Word)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, resume: e.target.files[0] })}
                  className="input"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Tell us why you're a good fit..."
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={applying}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;

