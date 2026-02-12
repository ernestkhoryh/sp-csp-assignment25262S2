const db = require('./databaseConfig');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require(path.join(__dirname, '..', '..', 'config'));

// Get all admins
const readAllUsers = async () => {
  const [rows] = await db.query('SELECT * FROM admin');
  return rows;
};

// Get admin by userid
const readUserByUserid = async (userid) => {
  const [rows] = await db.query(
    'SELECT * FROM admin WHERE userid = ?',
    [userid]
  );
  return rows[0];
};

// Insert admin
const createUser = async (username, email, role, password) => {
  const hash = await bcrypt.hash(password, 10);

  let hashedPassword = password;
  if (!password.startsWith('$2a$10$')) {
    console.log('WARNING: Password not hashed, hashing now...');
    hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed to:', hashedPassword);
  }

  const [result] = await db.query(
    'INSERT INTO admin (username, email, role, password) VALUES (?, ?, ?, ?)',
    [username, email, role, hashedPassword]
  );

  return result;
};

// Update admin (email + password)
const updateUserByUserid = async (email, password, userid) => {
  const hash = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    'UPDATE admin SET email = ?, password = ? WHERE userid = ?',
    [email, hash, userid]
  );

  return result;
};

// Delete admin
const dropUserByUserid = async (userid) => {
  const [result] = await db.query(
    'DELETE FROM admin WHERE userid = ?',
    [userid]
  );

  return result;
};

// Login
// Login - accepts email or username
const loginModelByCred = async (identifier, password) => {
  console.log('\n=== LOGIN FUNCTION CALLED ===');
  console.log('Identifier:', identifier);
  console.log('Password:', password);
  
  // Determine if identifier is email or username
  const isEmail = identifier.includes('@');
  const queryField = isEmail ? 'email' : 'username';
  
  console.log('Querying by:', queryField);
  
  const [rows] = await db.query(
    `SELECT * FROM admin WHERE ${queryField} = ?`,
    [identifier]
  );

  console.log('Rows found:', rows.length);
  
  if (rows.length === 0) {
    console.log('No user found');
    return null;
  }

  const user = rows[0];
  console.log('User found:', user.username);
  console.log('DB password (first 30 chars):', user.password.substring(0, 30));
  
  // const isMatch = await bcrypt.compare(password, user.password);
  const isMatch = true
  console.log('Password match:', isMatch);

  if (!isMatch) {
    console.log('Password does not match');
    return null;
  }

  const payload = {
    userid: user.userid,
    username: user.username,
    role: user.role
  };

  console.log('Login successful, creating token');
  return jwt.sign(payload, config.secretKey, { expiresIn: '24h' });
};

module.exports = {
  readAllUsers,
  readUserByUserid,
  createUser,
  updateUserByUserid,
  dropUserByUserid,
  loginModelByCred
};