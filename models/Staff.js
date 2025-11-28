const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Staff = sequelize.define('Staff', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING,
        allowNull: false
    },
    callsign: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    media: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'staff',
    timestamps: true
});

module.exports = Staff;