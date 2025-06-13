const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Program = sequelize.define('Program', {
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
    tableName: 'programs',
    timestamps: true
});

module.exports = Program;