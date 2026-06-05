const pool = require('../config/database');

class Role {
  static async findAll() {
    const result = await pool.query('SELECT * FROM roles ORDER BY nombre');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(nombre) {
    const result = await pool.query('SELECT * FROM roles WHERE nombre = $1', [nombre]);
    return result.rows[0];
  }

  static async create({ nombre }) {
    const result = await pool.query(
      'INSERT INTO roles (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    return result.rows[0];
  }

  static async update(id, { nombre }) {
    const result = await pool.query(
      'UPDATE roles SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM roles WHERE id = $1', [id]);
  }
}

module.exports = Role;