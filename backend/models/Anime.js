const pool = require('../config/database');

class Anime {
  static async findAll({ genero, ano, buscar, limit } = {}) {
    let query = `
      SELECT a.*, 
             COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
      FROM animes a
      LEFT JOIN anime_generos ag ON a.id = ag.anime_id
      LEFT JOIN generos g ON ag.genero_id = g.id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    // Filtro por género
    if (genero) {
      conditions.push(`a.id IN (SELECT anime_id FROM anime_generos ag2 JOIN generos g2 ON ag2.genero_id = g2.id WHERE g2.nombre ILIKE $${paramCount})`);
      values.push(genero);
      paramCount++;
    }
    
    // Filtro por año
    if (ano) {
      conditions.push(`a.ano_lanzamiento = $${paramCount}`);
      values.push(ano);
      paramCount++;
    }
    
    // Búsqueda por título
    if (buscar) {
      conditions.push(`a.titulo ILIKE $${paramCount}`);
      values.push(`%${buscar}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY a.id ORDER BY a.titulo';
    
    // Límite para animes populares
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT a.*, 
              COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
       FROM animes a
       LEFT JOIN anime_generos ag ON a.id = ag.anime_id
       LEFT JOIN generos g ON ag.genero_id = g.id
       WHERE a.id = $1
       GROUP BY a.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  static async create({ titulo, titulo_japones, sinopsis, ano_lanzamiento, temporadas, episodios, estado, calificacion_promedio, imagen_url, trailer_url }) {
    const result = await pool.query(
      'INSERT INTO animes (titulo, titulo_japones, sinopsis, ano_lanzamiento, temporadas, episodios, estado, calificacion_promedio, imagen_url, trailer_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [titulo, titulo_japones, sinopsis, ano_lanzamiento, temporadas, episodios, estado, calificacion_promedio, imagen_url, trailer_url]
    );
    return result.rows[0];
  }

  static async update(id, { titulo, titulo_japones, sinopsis, ano_lanzamiento, temporadas, episodios, estado, calificacion_promedio, imagen_url, trailer_url }) {
    const result = await pool.query(
      'UPDATE animes SET titulo = $1, titulo_japones = $2, sinopsis = $3, ano_lanzamiento = $4, temporadas = $5, episodios = $6, estado = $7, calificacion_promedio = $8, imagen_url = $9, trailer_url = $10 WHERE id = $11 RETURNING *',
      [titulo, titulo_japones, sinopsis, ano_lanzamiento, temporadas, episodios, estado, calificacion_promedio, imagen_url, trailer_url, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM animes WHERE id = $1', [id]);
  }

  static async addGenero(anime_id, genero_id) {
    await pool.query(
      'INSERT INTO anime_generos (anime_id, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [anime_id, genero_id]
    );
  }

  static async removeGenero(anime_id, genero_id) {
    await pool.query(
      'DELETE FROM anime_generos WHERE anime_id = $1 AND genero_id = $2',
      [anime_id, genero_id]
    );
  }

  static async getGeneros(anime_id) {
    const result = await pool.query(
      `SELECT g.* FROM generos g
       JOIN anime_generos ag ON g.id = ag.genero_id
       WHERE ag.anime_id = $1`,
      [anime_id]
    );
    return result.rows;
  }
}

module.exports = Anime;