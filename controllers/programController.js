const Program = require('../models/Program');
const { upload } = require('../middleware/upload');

const createProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, media_type } = req.body; // Добавить media_type
      const file = req.file ? `/uploads/server/${req.file.filename}` : null;

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

      const program = await Program.create({
        file,
        title,
        description,
        media_type: finalMediaType // Добавить в создание
      });

      res.status(201).json(program);
    } catch (error) {
      console.error('Error creating program:', error); // Добавить логирование
      res.status(500).json({ error: error.message });
    }
  });
};

const updateProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { title, description, media_type } = req.body;
      
      const updateData = { title, description };
      
      // Обновляем файл только если он загружен
      if (req.file) {
        updateData.file = `/uploads/server/${req.file.filename}`;
        
        // Определяем media_type из файла
        if (req.file.mimetype.startsWith('image/')) {
          updateData.media_type = 'image';
        } else if (req.file.mimetype.startsWith('video/')) {
          updateData.media_type = 'video';
        } else {
          updateData.media_type = 'document';
        }
      } else if (media_type) {
        updateData.media_type = media_type;
      }

      const program = await Program.update(id, updateData);

      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }

      res.json(program);
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({ error: error.message });
    }
  });
};

const partialUpdateProgram = async (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const updates = {}; 

      if (req.file) {
        updates.file = `/uploads/server/${req.file.filename}`;
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

      const program = await Program.update(id, updates);

      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }

      res.json(program);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.delete(id);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll();
    res.json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await Program.getById(id);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createProgram,
  updateProgram,
  partialUpdateProgram,
  deleteProgram,
  getAllPrograms,
  getProgramById
};
