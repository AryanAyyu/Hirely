import express from 'express';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, authorize('jobseeker'), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ message: 'This job is not accepting applications' });
    }

    const existingApplication = await Application.findOne({
      jobId,
      userId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = await Application.create({
      jobId,
      userId: req.user._id,
      resume: req.file.path,
      coverLetter: coverLetter || ''
    });

    job.applications.push(application._id);
    await job.save();

    req.io.to(job.employerId.toString()).emit('new_application', {
      jobId: job._id,
      employerId: job.employerId,
      applicationId: application._id,
      applicantName: req.user.name,
      jobTitle: job.title
    });

    const populatedApplication = await Application.findById(application._id)
      .populate('jobId', 'title')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      application: populatedApplication
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-applications', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('jobId', 'title location jobType salaryRange employerId')
      .populate('jobId.employerId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/job/:jobId', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate({
        path: 'userId',
        select: 'name email profile resume',
        populate: {
          path: 'profile',
          select: 'phone location bio skills experience education'
        }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/status', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.jobId.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    req.io.to(application.userId.toString()).emit('application_status_changed', {
      applicationId: application._id,
      userId: application.userId,
      jobTitle: application.jobId.title,
      status: status
    });

    res.json({
      success: true,
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

