const pool = require('../config/database');

class Plataforma {
  static async findAll() {
    const result = await pool.query('SELECT * FROM plataformas ORDER BY nombre');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM plataformas WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByName(nombre) {
    const result = await pool.query('SELECT * FROM plataformas WHERE nombre = $1', [nombre]);
    return result.rows[0];
  }

  static async create({ nombre, url_base }) {
    const result = await pool.query(
      'INSERT INTO plataformas (nombre, url_base) VALUES ($1, $2) RETURNING *',
      [nombre, url_base]
    );
    return result.rows[0];
  }

  static async update(id, { nombre, url_base }) {
    const result = await pool.query(
      'UPDATE plataformas SET nombre = $1, url_base = $2 WHERE id = $3 RETURNING *',
      [nombre, url_base, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM plataformas WHERE id = $1', [id]);
  }
}

module.exports = Plataforma;