const pool = require('../config/database');

class Manga {
  static async findAll({ genero, buscar } = {}) {
    let query = `
      SELECT m.*, 
             COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
      FROM mangas m
      LEFT JOIN manga_generos mg ON m.id = mg.manga_id
      LEFT JOIN generos g ON mg.genero_id = g.id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    // Filtro por género
    if (genero) {
      conditions.push(`m.id IN (SELECT manga_id FROM manga_generos mg2 JOIN generos g2 ON mg2.genero_id = g2.id WHERE g2.nombre ILIKE $${paramCount})`);
      values.push(genero);
      paramCount++;
    }
    
    // Búsqueda por título
    if (buscar) {
      conditions.push(`m.titulo ILIKE $${paramCount}`);
      values.push(`%${buscar}%`);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY m.id ORDER BY m.titulo';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT m.*, 
              COALESCE(ARRAY_AGG(g.nombre), ARRAY[]::text[]) as generos 
       FROM mangas m
       LEFT JOIN manga_generos mg ON m.id = mg.manga_id
       LEFT JOIN generos g ON mg.genero_id = g.id
       WHERE m.id = $1
       GROUP BY m.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  static async create({ titulo, volumen, autor, precio, stock, sinopsis_corta, imagen_portada, isbn, ano_publicacion, calificacion }) {
    const result = await pool.query(
      'INSERT INTO mangas (titulo, volumen, autor, precio, stock, sinopsis_corta, imagen_portada, isbn, ano_publicacion, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [titulo, volumen, autor, precio, stock, sinopsis_corta, imagen_portada, isbn, ano_publicacion, calificacion]
    );
    return result.rows[0];
  }

  static async update(id, { titulo, volumen, autor, precio, stock, sinopsis_corta, imagen_portada, isbn, ano_publicacion, calificacion }) {
    const result = await pool.query(
      'UPDATE mangas SET titulo = $1, volumen = $2, autor = $3, precio = $4, stock = $5, sinopsis_corta = $6, imagen_portada = $7, isbn = $8, ano_publicacion = $9, calificacion = $10 WHERE id = $11 RETURNING *',
      [titulo, volumen, autor, precio, stock, sinopsis_corta, imagen_portada, isbn, ano_publicacion, calificacion, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM mangas WHERE id = $1', [id]);
  }

  static async addGenero(manga_id, genero_id) {
    await pool.query(
      'INSERT INTO manga_generos (manga_id, genero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [manga_id, genero_id]
    );
  }

  static async removeGenero(manga_id, genero_id) {
    await pool.query(
      'DELETE FROM manga_generos WHERE manga_id = $1 AND genero_id = $2',
      [manga_id, genero_id]
    );
  }

  static async getGeneros(manga_id) {
    const result = await pool.query(
      `SELECT g.* FROM generos g
       JOIN manga_generos mg ON g.id = mg.genero_id
       WHERE mg.manga_id = $1`,
      [manga_id]
    );
    return result.rows;
  }
}

module.exports = Manga;