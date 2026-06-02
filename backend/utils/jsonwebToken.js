const jwt = require('jsonwebtoken');

const generateToken = (_id, role) => {
    return jwt.sign({ _id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;