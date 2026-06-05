const pool = require('../config/database');

class ListaUsuario {
  static async findByUsuarioId(usuario_id) {
    const result = await pool.query(
      'SELECT * FROM listas_usuario WHERE usuario_id = $1 ORDER BY creado_en DESC',
      [usuario_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM listas_usuario WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create({ usuario_id, nombre_lista, tipo }) {
    const result = await pool.query(
      'INSERT INTO listas_usuario (usuario_id, nombre_lista, tipo) VALUES ($1, $2, $3) RETURNING *',
      [usuario_id, nombre_lista, tipo]
    );
    return result.rows[0];
  }

  static async update(id, { nombre_lista, tipo }) {
    const result = await pool.query(
      'UPDATE listas_usuario SET nombre_lista = $1, tipo = $2 WHERE id = $3 RETURNING *',
      [nombre_lista, tipo, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM listas_usuario WHERE id = $1', [id]);
  }
}

module.exports = ListaUsuario;