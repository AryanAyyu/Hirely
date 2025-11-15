import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../utils/api';

const Home = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await apiService.getJobs({ page: 1, limit: 6 });
        setFeaturedJobs(data.jobs || []);
      } catch (error) {
        console.error('Error loading featured jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Find Your Dream Job
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Connect with top employers and discover opportunities that match your skills
        </p>
        <Link to="/jobs" className="btn btn-primary text-lg px-8">
          Browse Jobs
        </Link>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured Jobs</h2>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <Link
                  key={job._id}
                  to={`/jobs/${job._id}`}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="badge badge-info">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{job.location}</span>
                    <span className="font-semibold">
                      ${job.salaryRange.min}K - ${job.salaryRange.max}K
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No jobs available at the moment.</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">1000+</div>
          <div className="text-gray-600 dark:text-gray-400">Active Jobs</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
          <div className="text-gray-600 dark:text-gray-400">Companies</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">5000+</div>
          <div className="text-gray-600 dark:text-gray-400">Job Seekers</div>
        </div>
      </div>
    </div>
  );
};

export default Home;

