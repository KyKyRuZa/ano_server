const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      isUrl: true,
      notEmpty: true
    }
  }
}, {
  tableName: 'articles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['url']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = Article;