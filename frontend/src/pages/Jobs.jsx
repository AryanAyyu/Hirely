import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../utils/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    minSalary: '',
    skills: '',
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    loadJobs(1);
  }, []);

  const loadJobs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      };

      const data = await apiService.getJobs(params);
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, pages: 1 });
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    loadJobs(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: '',
      minSalary: '',
      skills: '',
    });
    setTimeout(() => loadJobs(1), 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Jobs</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="input"
                placeholder="Search jobs..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="input"
                placeholder="City, State"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Job Type</label>
              <select
                name="jobType"
                value={filters.jobType}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Remote">Remote</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Min Salary (K)</label>
              <input
                type="number"
                name="minSalary"
                value={filters.minSalary}
                onChange={handleFilterChange}
                className="input"
                placeholder="0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Skills</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                className="input"
                placeholder="JavaScript, React, Node.js"
              />
            </div>

            <button onClick={applyFilters} className="btn btn-primary w-full mb-2">
              Apply Filters
            </button>
            <button onClick={clearFilters} className="btn btn-secondary w-full">
              Clear
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : jobs.length > 0 ? (
            <>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job._id}
                    to={`/jobs/${job._id}`}
                    className="card hover:shadow-lg transition-shadow cursor-pointer block"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          {job.employerId?.name || 'Company'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="badge badge-info">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>📍 {job.location}</span>
                        <span>💼 {job.jobType}</span>
                        <span>
                          💰 ${job.salaryRange.min}K - ${job.salaryRange.max}K
                        </span>
                      </div>
                      <span className="btn btn-primary text-sm">View Details</span>
                    </div>
                  </Link>
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  {pagination.page > 1 && (
                    <button
                      onClick={() => loadJobs(pagination.page - 1)}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                  )}
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.page - 2 && page <= pagination.page + 2)
                    )
                    .map((page, idx, arr) => {
                      if (idx > 0 && arr[idx - 1] !== page - 1) {
                        return (
                          <span key={`ellipsis-${page}`} className="px-4 py-2">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => loadJobs(page)}
                          className={`btn ${
                            page === pagination.page ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  {pagination.page < pagination.pages && (
                    <button
                      onClick={() => loadJobs(pagination.page + 1)}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">No jobs found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;

