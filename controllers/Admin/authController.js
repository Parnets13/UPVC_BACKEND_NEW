const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin@123';

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
 
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });
 
  return res.status(200).json({ message: 'Login successful', token });
};

exports.adminRegister = async (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.status(200).json({ message: 'Registration successful' } );
};  
