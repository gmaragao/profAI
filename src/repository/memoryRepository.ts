import pg, { Pool } from "pg";

class MemoryRepository {
  private pool: Pool;

  constructor() {
    this.pool = new pg.Pool({
      user: "your_username",
      host: "localhost",
      database: "your_database",
      password: "your_password",
      port: 5432, // Default PostgreSQL port
    });
  }

  async getCourseInformation(courseId: string): Promise<any> {
    /*   const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM courses WHERE course_id = $1`,
        [courseId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    } */

    return "The course is related to Cinema and Psychology and the date of the exam is 2024-01-01";
  }

  async getAll(tableName: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${tableName}`);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getById(tableName: string, id: number): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM ${tableName} WHERE id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async insert(tableName: string, data: Record<string, any>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");

      await client.query(
        `INSERT INTO ${tableName} (${keys.join(
          ", "
        )}) VALUES (${placeholders})`,
        values
      );
    } finally {
      client.release();
    }
  }

  async update(
    tableName: string,
    id: number,
    data: Record<string, any>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      await client.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1}`,
        [...values, id]
      );
    } finally {
      client.release();
    }
  }

  async delete(tableName: string, id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default MemoryRepository;
