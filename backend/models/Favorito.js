const pool = require('../config/database');

class Favorito {
  static async findByUsuarioId(usuario_id) {
    const result = await pool.query(
      `SELECT f.*, 
              COALESCE(a.titulo, m.titulo) as titulo,
              COALESCE(a.imagen_url, m.imagen_portada) as imagen
       FROM favoritos f
       LEFT JOIN animes a ON f.anime_id = a.id
       LEFT JOIN mangas m ON f.manga_id = m.id
       WHERE f.usuario_id = $1`,
      [usuario_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM favoritos WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUsuarioAndAnime(usuario_id, anime_id) {
    const result = await pool.query(
      'SELECT * FROM favoritos WHERE usuario_id = $1 AND anime_id = $2',
      [usuario_id, anime_id]
    );
    return result.rows[0];
  }

  static async findByUsuarioAndManga(usuario_id, manga_id) {
    const result = await pool.query(
      'SELECT * FROM favoritos WHERE usuario_id = $1 AND manga_id = $2',
      [usuario_id, manga_id]
    );
    return result.rows[0];
  }

  static async create({ usuario_id, anime_id = null, manga_id = null }) {
    const result = await pool.query(
      'INSERT INTO favoritos (usuario_id, anime_id, manga_id) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, anime_id, manga_id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM favoritos WHERE id = $1', [id]);
  }

  static async deleteByUsuarioAndAnime(usuario_id, anime_id) {
    await pool.query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND anime_id = $2',
      [usuario_id, anime_id]
    );
  }

  static async deleteByUsuarioAndManga(usuario_id, manga_id) {
    await pool.query(
      'DELETE FROM favoritos WHERE usuario_id = $1 AND manga_id = $2',
      [usuario_id, manga_id]
    );
  }
}

module.exports = Favorito;