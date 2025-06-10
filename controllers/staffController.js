const Staff = require('../models/Staff');
const { upload } = require('../middleware/upload');

const createStaff = async (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { name, position, callsign, about, external_texts } = req.body;
      const photo = req.file ? `/uploads/server_img/${req.file.filename}` : null;

      const staff = await Staff.create({
        photo,
        name,
        position,
        callsign,
        about,
        external_texts
      });

      res.status(201).json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const updateStaff = async (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const { name, position, callsign, about} = req.body;
      const photo = req.file ? `/uploads/server_img/${req.file.filename}` : undefined;

      const staff = await Staff.update(id, {
        photo,
        name,
        position,
        callsign,
        about
      });

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const partialUpdateStaff = async (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { id } = req.params;
      const updates = {}; 

      if (req.file) {
        updates.photo = `/uploads/server_img/${req.file.filename}`;
      }

      const fields = ['name', 'position', 'callsign', 'about'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const staff = await Staff.update(id, updates);

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.delete(id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.getAll();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.getById(id);

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStaff,
  updateStaff,
  partialUpdateStaff,
  deleteStaff,
  getAllStaff,
  getStaffById
};
