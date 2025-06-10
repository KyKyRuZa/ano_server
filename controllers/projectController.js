const Project = require('../models/Project');
const { upload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = './uploads/projects';

const createProject = async (req, res) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Название проекта обязательно' });
      }

      const mediaPath = req.file ? path.join('projects', req.file.filename) : null;
      const mediaType = req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : null;

      const project = await Project.create({
        title,
        description,
        mediaPath,
        mediaType
      });

      res.status(201).json(project);
    } catch (error) {
      console.error('Ошибка при создании проекта:', error);
      res.status(500).json({
        error: 'Ошибка сервера',
       
      });
    }
  });
};

const updateProject = async (req, res) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { title, description } = req.body;

      // Получаем текущий проект
      const currentProject = await Project.findById(id);
      if (!currentProject) {
        return res.status(404).json({ error: 'Проект не найден' });
      }

      // Удаление старого файла
      if (req.file && currentProject.media_path) {
        const oldFilePath = path.join('./uploads', currentProject.media_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Подготовка данных для обновления
      const updateData = {
        title: title || currentProject.title,
        description: description || currentProject.description,
        mediaPath: req.file ? path.join('projects', req.file.filename) : currentProject.media_path,
        mediaType: req.file ? (req.file.mimetype.startsWith('image') ? 'image' : 'video') : currentProject.media_type
      };

      const updatedProject = await Project.update(id, updateData);
      res.status(200).json(updatedProject);
    } catch (error) {
      console.error('Ошибка при обновлении проекта:', error);
      res.status(500).json({
        error: 'Ошибка сервера',
       
      });
    }
  });
};

const partialUpdateProject = async (req, res) => {
  upload.single('media')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const updates = {};

      // Получаем текущий проект
      const currentProject = await Project.findById(id);
      if (!currentProject) {
        return res.status(404).json({ error: 'Проект не найден' });
      }

      // Удаление старого файла при загрузке нового
      if (req.file) {
        if (currentProject.media_path) {
          const oldFilePath = path.join('./uploads', currentProject.media_path);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        updates.mediaPath = path.join('projects', req.file.filename);
        updates.mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
      }

      const fields = ['title', 'description'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updatedProject = await Project.update(id, updates);
      res.status(200).json(updatedProject);
    } catch (error) {
      console.error('Ошибка при частичном обновлении проекта:', error);
      res.status(500).json({
        error: 'Ошибка сервера',
       
      });
    }
  });
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    // Удаление файла
    if (project.media_path) {
      const filePath = path.join('./uploads', project.media_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Project.delete(id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Ошибка при удалении проекта:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
     
    });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    console.error('Ошибка при получении проектов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
     
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }
    
    res.status(200).json(project);
  } catch (error) {
    console.error('Ошибка при получении проекта:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
     
    });
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
