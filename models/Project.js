const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    media: {
        type: DataTypes.STRING, // Путь к медиафайлу
        allowNull: true
    }
}, {
    tableName: 'projects',
    timestamps: true
});

module.exports = Project;