const pool = require('../config/database');

class Carrito {
  static async findByUsuarioId(usuario_id) {
    const result = await pool.query(
      `SELECT c.*, m.titulo, m.precio, m.imagen_portada 
       FROM carrito c
       JOIN mangas m ON c.manga_id = m.id
       WHERE c.usuario_id = $1`,
      [usuario_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM carrito WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUsuarioAndManga(usuario_id, manga_id) {
    const result = await pool.query(
      'SELECT * FROM carrito WHERE usuario_id = $1 AND manga_id = $2',
      [usuario_id, manga_id]
    );
    return result.rows[0];
  }

  static async create({ usuario_id, manga_id, cantidad = 1 }) {
    const result = await pool.query(
      'INSERT INTO carrito (usuario_id, manga_id, cantidad) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, manga_id, cantidad]
    );
    return result.rows[0];
  }

  static async update(id, { cantidad }) {
    const result = await pool.query(
      'UPDATE carrito SET cantidad = $1 WHERE id = $2 RETURNING *',
      [cantidad, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM carrito WHERE id = $1', [id]);
  }

  static async deleteByUsuarioAndManga(usuario_id, manga_id) {
    await pool.query(
      'DELETE FROM carrito WHERE usuario_id = $1 AND manga_id = $2',
      [usuario_id, manga_id]
    );
  }

  static async clearByUsuarioId(usuario_id) {
    await pool.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);
  }
}

module.exports = Carrito;