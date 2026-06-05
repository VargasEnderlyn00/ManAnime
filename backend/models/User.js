const pool = require('../config/database');

class User {
  static async findAll() {
    const result = await pool.query('SELECT id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo FROM usuarios ORDER BY fecha_registro DESC');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await pool.query('SELECT id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo FROM usuarios WHERE username = $1', [username]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query('SELECT id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo, password_hash FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create({ username, email, password_hash, nombre_completo, rol_id = 1 }) {
    const result = await pool.query(
      'INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo',
      [username, email, password_hash, nombre_completo, rol_id]
    );
    return result.rows[0];
  }

  static async update(id, { username, email, nombre_completo, avatar_url, rol_id, activo }) {
    const result = await pool.query(
      'UPDATE usuarios SET username = $1, email = $2, nombre_completo = $3, avatar_url = $4, rol_id = $5, activo = $6 WHERE id = $7 RETURNING id, username, email, nombre_completo, fecha_registro, avatar_url, rol_id, activo',
      [username, email, nombre_completo, avatar_url, rol_id, activo, id]
    );
    return result.rows[0];
  }

  static async updatePassword(id, password_hash) {
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id',
      [password_hash, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }

  static async count() {
    const result = await pool.query('SELECT COUNT(*) as total FROM usuarios');
    return parseInt(result.rows[0].total);
  }
}

module.exports = User;