import express from 'express';
import { body, validationResult } from 'express-validator';
import Job from '../models/Job.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };

    if (req.query.skills) {
      const skills = req.query.skills.split(',').map(s => s.trim());
      filter.skills = { $in: skills };
    }

    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: 'i' };
    }

    if (req.query.jobType) {
      filter.jobType = req.query.jobType;
    }

    if (req.query.minSalary) {
      filter['salaryRange.max'] = { $gte: parseInt(req.query.minSalary) };
    }

    if (req.query.maxSalary) {
      filter['salaryRange.min'] = { $lte: parseInt(req.query.maxSalary) };
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const jobs = await Job.find(filter)
      .populate('employerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(filter);

    res.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/jobs/my-jobs
// @desc    Get jobs created by current employer
// @access  Private (Employer)
router.get('/my-jobs', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id })
      .populate('employerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employerId', 'name email profile')
      .populate('applications');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, authorize('employer', 'admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('jobType').isIn(['Full-time', 'Part-time', 'Remote', 'Contract']).withMessage('Invalid job type'),
  body('salaryRange.min').isNumeric().withMessage('Min salary must be a number'),
  body('salaryRange.max').isNumeric().withMessage('Max salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const job = await Job.create({
      ...req.body,
      employerId: req.user._id,
      status: 'active' // Set jobs to active by default for employers
    });

    const populatedJob = await Job.findById(job._id)
      .populate('employerId', 'name email');

    res.status(201).json({
      success: true,
      job: populatedJob
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('employerId', 'name email');

    res.json({
      success: true,
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.employerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

