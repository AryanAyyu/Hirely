import { useState, useEffect } from 'react';
import apiService from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, usersData, jobsData] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAllUsers(),
        apiService.getAllJobs(),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users);
      setJobs(jobsData.jobs);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      await apiService.blockUser(userId);
      loadData();
      alert('User status updated!');
    } catch (error) {
      alert(error.message || 'Failed to update user');
    }
  };

  const handleJobStatus = async (jobId, status) => {
    try {
      await apiService.updateJobStatus(jobId, status);
      loadData();
      alert('Job status updated!');
    } catch (error) {
      alert(error.message || 'Failed to update job');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Jobs
        </button>
      </div>

      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalUsers}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Total Jobs</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalJobs}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Total Applications</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalApplications}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.activeJobs}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Pending Jobs</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendingJobs}
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Blocked Users</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.blockedUsers}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <span className="badge badge-info">{user.role}</span>
                    </td>
                    <td className="p-2">
                      <span className={user.isBlocked ? 'badge badge-danger' : 'badge badge-success'}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleBlockUser(user._id)}
                        className="btn btn-secondary text-sm"
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">All Jobs</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {job.location} • {job.jobType} • {job.employerId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: <span className="badge badge-info">{job.status}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={job.status}
                      onChange={(e) => handleJobStatus(job._id, e.target.value)}
                      className="input text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

