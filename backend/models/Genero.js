const pool = require('../config/database');

class Genero {
  static async findAll() {
    const result = await pool.query('SELECT * FROM generos ORDER BY nombre');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM generos WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(nombre) {
    const result = await pool.query('SELECT * FROM generos WHERE nombre = $1', [nombre]);
    return result.rows[0];
  }

  static async create({ nombre }) {
    const result = await pool.query(
      'INSERT INTO generos (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    return result.rows[0];
  }

  static async update(id, { nombre }) {
    const result = await pool.query(
      'UPDATE generos SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM generos WHERE id = $1', [id]);
  }
}

module.exports = Genero;