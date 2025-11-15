import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../utils/api';

const JobSeekerDashboard = () => {
  const { user, updateUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadApplications();
    loadProfile();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await apiService.getMyApplications();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile();
      const profile = data.user;
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.profile?.phone || '',
        location: profile.profile?.location || '',
        bio: profile.profile?.bio || '',
        skills: profile.profile?.skills?.join(', ') || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('profile[phone]', profileData.phone);
      formData.append('profile[location]', profileData.location);
      formData.append('profile[bio]', profileData.bio);

      const skills = profileData.skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      formData.append('profile[skills]', JSON.stringify(skills));

      const resumeFile = document.getElementById('resume').files[0];
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const data = await apiService.updateProfile(formData);
      updateUser(data.user);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === 'pending').length,
    accepted: applications.filter((app) => app.status === 'accepted').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Job Seeker Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">My Applications</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.pending}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Accepted</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.accepted}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Applications</h2>
          <Link to="/jobs" className="btn btn-primary">
            Browse Jobs
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusColors = {
                pending: 'badge-warning',
                reviewed: 'badge-info',
                shortlisted: 'badge-info',
                accepted: 'badge-success',
                rejected: 'badge-danger',
              };

              return (
                <div
                  key={app._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {app.jobId?.title || 'Job'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {app.jobId?.location || ''} • {app.jobId?.jobType || ''}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        statusColors[app.status] || 'badge-info'
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      to={`/jobs/${app.jobId?._id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Job Details
                    </Link>
                    {app.jobId?.employerId && (
                      <Link
                        to={`/chat/${app.jobId.employerId._id || app.jobId.employerId}?jobId=${app.jobId._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        💬 Chat with Employer
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No applications yet.
          </p>
        )}
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Profile</h2>
        <form onSubmit={handleProfileUpdate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              className="input"
              rows="3"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Skills (comma-separated)</label>
            <input
              type="text"
              value={profileData.skills}
              onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
              className="input"
              placeholder="JavaScript, React, Node.js"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Resume</label>
            <input type="file" id="resume" className="input" accept=".pdf,.doc,.docx" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;

