const Staff = require('../models/Staff');
const { upload } = require('../middleware/upload');

const createStaff = async (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      const { name, position, callsign, about, external_texts } = req.body;
      const photo = req.file ? `/uploads/server/${req.file.filename}` : null;

      console.log('Creating staff with data:', {
        name,
        position,
        callsign,
        about,
        external_texts,
        photo
      });

      const staff = await Staff.create({
        photo,
        name,
        position,
        callsign,
        about,
        external_texts
      });

      console.log('Staff created successfully:', staff);
      res.status(201).json(staff);
    } catch (error) {
      console.error('Error creating staff:', error);
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
      const { name, position, callsign, about, external_texts } = req.body;
      const photo = req.file ? `/uploads/server/${req.file.filename}` : undefined;

      console.log('Updating staff with data:', {
        id,
        name,
        position,
        callsign,
        about,
        external_texts,
        photo
      });

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (position !== undefined) updateData.position = position;
      if (callsign !== undefined) updateData.callsign = callsign;
      if (about !== undefined) updateData.about = about;
      if (external_texts !== undefined) updateData.external_texts = external_texts;
      if (photo !== undefined) updateData.photo = photo;

      const staff = await Staff.update(id, updateData);

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      console.log('Staff updated successfully:', staff);
      res.json(staff);
    } catch (error) {
      console.error('Error updating staff:', error);
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
        updates.photo = `/uploads/server/${req.file.filename}`;
      }

      const fields = ['name', 'position', 'callsign', 'about', 'external_texts'];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      console.log('Partial update with data:', { id, updates });

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const staff = await Staff.update(id, updates);

      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      console.log('Staff partially updated successfully:', staff);
      res.json(staff);
    } catch (error) {
      console.error('Error partially updating staff:', error);
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
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.getAll();
    res.json(staff);
  } catch (error) {
    console.error('Error getting all staff:', error);
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
    console.error('Error getting staff by id:', error);
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
