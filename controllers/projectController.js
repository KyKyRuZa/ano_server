const Project = require('../models/Project');
const { upload } = require('../middleware/upload');

const createProject = async (req, res) => {
  upload.single('media_path')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, media_type } = req.body;

      // Путь должен соответствовать месту сохранения файла
      const media_path = req.file 
        ? `/uploads/server/${req.file.filename}` 
        : null;

      console.log('req.file:', req.file);
      console.log('media_path:', media_path);

      const project = await Project.create({
        media_path,
        title,
        description,
        media_type
      });

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const updateProject = async (req, res) => {
  upload.single('media_path')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { title, description, media_type } = req.body;
      const media_path = req.file ? `/uploads/server/projects/${req.file.filename}` : undefined;

      const project = await Project.update(id, {
        media_path,
        title,
        description,
        media_type
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const partialUpdateProject = async (req, res) => {
  upload.single('media_path')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const updates = {}; 

      if (req.file) {
        updates.media_path = `/uploads/server/projects/${req.file.filename}`;
      }

      const fields = ['title', 'description', 'media_type'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const project = await Project.update(id, updates);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.delete(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.getById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProject,
  updateProject,
  partialUpdateProject,
  deleteProject,
  getAllProjects,
  getProjectById
};
