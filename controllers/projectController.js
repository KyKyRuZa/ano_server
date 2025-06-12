const Project = require('../models/Project');
const { upload } = require('../middleware/upload');

const createProject = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.single('media_path')(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('req.file:', req.file);

    const { title, description, media_type } = req.body;
    const mediaPath = req.file ? `/uploads/server/${req.file.filename}` : null;

    // Определить media_type из файла, если не передан
    let finalMediaType = media_type;
    if (req.file && !finalMediaType) {
      if (req.file.mimetype.startsWith('image/')) {
        finalMediaType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        finalMediaType = 'video';
      } else {
        finalMediaType = 'document';
      }
    }

    const project = await Project.create({
      title,
      description,
      mediaPath,
      mediaType: finalMediaType
    });

    res.status(201).json(project);

  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  upload.single('media_path')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { title, description, media_type } = req.body;
      const mediaPath = req.file ? `/uploads/server/${req.file.filename}` : undefined;

      const updateData = {};
      
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (mediaPath !== undefined) updateData.mediaPath = mediaPath;
      
      // Определяем media_type из файла или используем переданный
      if (req.file) {
        if (req.file.mimetype.startsWith('image/')) {
          updateData.mediaType = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
          updateData.mediaType = 'video';
        } else {
          updateData.mediaType = 'document';
        }
      } else if (media_type) {
        updateData.mediaType = media_type;
      }

      const project = await Project.update(id, updateData);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
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
        updates.mediaPath = `/uploads/server/${req.file.filename}`;
        
        // Определяем media_type из файла
        if (req.file.mimetype.startsWith('image/')) {
          updates.mediaType = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
          updates.mediaType = 'video';
        } else {
          updates.mediaType = 'document';
        }
      }

      const fields = ['title', 'description'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (req.body.media_type !== undefined) {
        updates.mediaType = req.body.media_type;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const project = await Project.update(id, updates);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
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
    const project = await Project.findById(id);

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
