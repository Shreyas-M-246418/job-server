const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'https://job-portal-six-kappa.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Helper function to read/write jobs data
const JOBS_FILE = path.join(__dirname, 'data', 'jobs.json');

async function readJobsFile() {
  try {
    const data = await fs.readFile(JOBS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with empty array
      await fs.writeFile(JOBS_FILE, '[]');
      return [];
    }
    throw error;
  }
}

async function writeJobsFile(jobs) {
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

// Routes
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await readJobsFile();
    res.json(jobs);
  } catch (error) {
    console.error('Error reading jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { title, description, location, salary } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const jobs = await readJobsFile();
    const newJob = {
      id: jobs.length > 0 ? Math.max(...jobs.map(job => job.id)) + 1 : 1,
      title,
      description,
      location,
      salary,
      createdAt: new Date().toISOString()
    };

    jobs.push(newJob);
    await writeJobsFile(jobs);
    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});