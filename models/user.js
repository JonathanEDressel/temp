const { DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')

const { extractValidFields } = require('../lib/validation')
const sequelize = require('../lib/sequelize')

const User = sequelize.define('user', {
    name: { 
        type: DataTypes.STRING, 
        allowNull: false
    },
    email: {  
        type: DataTypes.STRING, 
        allowNull: false
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false,
        set(value) {
            const hash = bcrypt.hashSync(value, 8)
            this.setDataValue('password', hash)
        }
    },
    isAdmin: { 
        type: DataTypes.BOOLEAN,
        allowNull: false 
    }
  })
exports.User = User
exports.UserClientFields = [
    'name',
    'email',
    'password',
    'isAdmin'
]
  

exports.getUserById = async function (id, includePassword = false) {
    if(includePassword) {
        const list = await User.findByPk(id)
        return list
    } else {
        return null
    }
}
