export type DbProvider = "mysql" | "postgres";

/** Neon/Vercel pode injetar DATABASE_URL (pooler) ou só DATABASE_URL_UNPOOLED. */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    undefined
  );
}

export function isDatabaseConfigured(): boolean {
  if (resolveDatabaseUrl()) return true;

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const database = process.env.DB_NAME?.trim();
  return Boolean(host && user && database);
}

/** Força armazenamento em arquivo (sem MySQL/Postgres). Padrão quando banco não está configurado. */
export function memoryStoreInDev(): boolean {
  if (process.env.USE_MEMORY_DB === "true") return true;
  return !isDatabaseConfigured();
}

export function getDbProvider(): DbProvider {
  const url = resolveDatabaseUrl() ?? "";
  if (url.startsWith("mysql://") || url.startsWith("mysql2://")) return "mysql";
  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) return "postgres";

  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
    return "mysql";
  }

  if (process.env.DB_PROVIDER === "postgres") return "postgres";
  if (process.env.DB_PROVIDER === "mysql" && isDatabaseConfigured()) return "mysql";

  if (url) return "postgres";
  throw new Error(
    "Banco não configurado. Defina DATABASE_URL (ou DATABASE_URL_UNPOOLED) ou DB_HOST/DB_USER/DB_NAME/DB_PASSWORD.",
  );
}

export function getDatabaseUrl(): string {
  const direct = resolveDatabaseUrl();
  if (direct) return direct;

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const database = process.env.DB_NAME?.trim();
  const port = process.env.DB_PORT?.trim() || "3306";

  if (host && user && database) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    return `mysql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
  }

  throw new Error(
    "DATABASE_URL não configurada. Na Vercel/Neon use DATABASE_URL ou DATABASE_URL_UNPOOLED.",
  );
}

export function isHostingerMysqlSetup() {
  return getDbProvider() === "mysql" && Boolean(process.env.DB_HOST || resolveDatabaseUrl()?.includes("mysql"));
}

function convertPlaceholders(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

let mysqlPool: import("mysql2/promise").Pool | null = null;
let neonPool: import("@neondatabase/serverless").Pool | null = null;

async function getMysqlPool() {
  if (!mysqlPool) {
    const mysql = await import("mysql2/promise");
    mysqlPool = mysql.createPool({
      uri: getDatabaseUrl(),
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
    });
  }
  return mysqlPool;
}

async function getNeonPool() {
  if (!neonPool) {
    const { Pool } = await import("@neondatabase/serverless");
    neonPool = new Pool({ connectionString: getDatabaseUrl() });
  }
  return neonPool;
}

export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const provider = getDbProvider();
  if (provider === "mysql") {
    const pool = await getMysqlPool();
    const [rows] = await pool.query(sql, params as (string | number | boolean | Date | null)[]);
    return rows as T[];
  }

  const pgSql = convertPlaceholders(sql);
  const pool = await getNeonPool();
  const result = await pool.query(pgSql, params);
  return result.rows as T[];
}

export async function dbExecute(sql: string, params: unknown[] = []): Promise<number> {
  const provider = getDbProvider();
  if (provider === "mysql") {
    const pool = await getMysqlPool();
    const [result] = await pool.execute(sql, params as (string | number | boolean | Date | null)[]);
    return (result as { affectedRows?: number }).affectedRows ?? 0;
  }

  const pgSql = convertPlaceholders(sql);
  const pool = await getNeonPool();
  const result = await pool.query(pgSql, params);
  return result.rowCount ?? 0;
}

export async function createSchema() {
  const provider = getDbProvider();

  if (provider === "mysql") {
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL DEFAULT '',
        location_full VARCHAR(255) NOT NULL DEFAULT '',
        city VARCHAR(120) NOT NULL DEFAULT '',
        neighborhood VARCHAR(120) NOT NULL DEFAULT '',
        state VARCHAR(8) NOT NULL DEFAULT '',
        cep VARCHAR(16) NOT NULL DEFAULT '',
        address VARCHAR(255) NOT NULL DEFAULT '',
        number VARCHAR(32) NOT NULL DEFAULT '',
        complement VARCHAR(64) NOT NULL DEFAULT '',
        floors INT NOT NULL DEFAULT 0,
        units INT NOT NULL DEFAULT 0,
        towers INT NOT NULL DEFAULT 0,
        address_display VARCHAR(32) NOT NULL DEFAULT 'street',
        latitude VARCHAR(32) NOT NULL DEFAULT '',
        longitude VARCHAR(32) NOT NULL DEFAULT '',
        type VARCHAR(64) NOT NULL DEFAULT 'Casa',
        type_label VARCHAR(64) NOT NULL DEFAULT 'Casa',
        price DECIMAL(14,2) NOT NULL DEFAULT 0,
        price_label VARCHAR(64) NOT NULL DEFAULT '',
        ref VARCHAR(32) NOT NULL DEFAULT '',
        status VARCHAR(32) NOT NULL DEFAULT 'Rascunho',
        bedrooms INT NOT NULL DEFAULT 0,
        suites INT NOT NULL DEFAULT 0,
        bathrooms INT NOT NULL DEFAULT 0,
        social_bathrooms INT NOT NULL DEFAULT 0,
        parking INT NOT NULL DEFAULT 0,
        area DECIMAL(14,2) NOT NULL DEFAULT 0,
        built_area DECIMAL(14,2) NOT NULL DEFAULT 0,
        land_area DECIMAL(14,2) NOT NULL DEFAULT 0,
        image TEXT NOT NULL,
        images JSON NOT NULL,
        featured TINYINT(1) NOT NULL DEFAULT 0,
        highlight TINYINT(1) NOT NULL DEFAULT 0,
        description JSON NOT NULL,
        condo VARCHAR(64) NOT NULL DEFAULT '',
        condo_exempt TINYINT(1) NOT NULL DEFAULT 0,
        iptu VARCHAR(64) NOT NULL DEFAULT '',
        iptu_period VARCHAR(16) NOT NULL DEFAULT 'anual',
        iptu_exempt TINYINT(1) NOT NULL DEFAULT 0,
        rooms JSON NOT NULL,
        leisure JSON NOT NULL,
        extras JSON NOT NULL,
        proximities JSON NOT NULL,
        custom_fields JSON NOT NULL,
        rooms_custom_fields JSON NULL,
        location_custom_fields JSON NULL,
        broker JSON NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_properties_status (status),
        INDEX idx_properties_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'Editor',
        status VARCHAR(16) NOT NULL DEFAULT 'Ativo',
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_admin_users_email (email),
        INDEX idx_admin_users_default (is_default)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await dbExecute(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id VARCHAR(64) PRIMARY KEY,
        company_name VARCHAR(160) NOT NULL DEFAULT '',
        email VARCHAR(255) NOT NULL DEFAULT '',
        emails JSON NULL,
        phone_display VARCHAR(64) NOT NULL DEFAULT '',
        phones JSON NULL,
        whatsapp_display VARCHAR(64) NOT NULL DEFAULT '',
        whatsapp_e164 VARCHAR(32) NOT NULL DEFAULT '',
        instagram_handle VARCHAR(120) NOT NULL DEFAULT '',
        instagram_url VARCHAR(255) NOT NULL DEFAULT '',
        facebook_url VARCHAR(255) NOT NULL DEFAULT '',
        cep VARCHAR(16) NOT NULL DEFAULT '',
        address VARCHAR(255) NOT NULL DEFAULT '',
        number VARCHAR(32) NOT NULL DEFAULT '',
        complement VARCHAR(64) NOT NULL DEFAULT '',
        neighborhood VARCHAR(120) NOT NULL DEFAULT '',
        city VARCHAR(120) NOT NULL DEFAULT '',
        state VARCHAR(8) NOT NULL DEFAULT '',
        listing_visibility JSON NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    return;
  }

  await dbExecute(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      location_full TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      neighborhood TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      cep TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      number TEXT NOT NULL DEFAULT '',
      complement TEXT NOT NULL DEFAULT '',
      floors INTEGER NOT NULL DEFAULT 0,
      units INTEGER NOT NULL DEFAULT 0,
      towers INTEGER NOT NULL DEFAULT 0,
      address_display TEXT NOT NULL DEFAULT 'street',
      latitude TEXT NOT NULL DEFAULT '',
      longitude TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'Casa',
      type_label TEXT NOT NULL DEFAULT 'Casa',
      price NUMERIC NOT NULL DEFAULT 0,
      price_label TEXT NOT NULL DEFAULT '',
      ref TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Rascunho',
      bedrooms INTEGER NOT NULL DEFAULT 0,
      suites INTEGER NOT NULL DEFAULT 0,
      bathrooms INTEGER NOT NULL DEFAULT 0,
      social_bathrooms INTEGER NOT NULL DEFAULT 0,
      parking INTEGER NOT NULL DEFAULT 0,
      area NUMERIC NOT NULL DEFAULT 0,
      built_area NUMERIC NOT NULL DEFAULT 0,
      land_area NUMERIC NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      highlight BOOLEAN NOT NULL DEFAULT FALSE,
      description JSONB NOT NULL DEFAULT '[]'::jsonb,
      condo TEXT NOT NULL DEFAULT '',
      condo_exempt BOOLEAN NOT NULL DEFAULT FALSE,
      iptu TEXT NOT NULL DEFAULT '',
      iptu_period TEXT NOT NULL DEFAULT 'anual',
      iptu_exempt BOOLEAN NOT NULL DEFAULT FALSE,
      rooms JSONB NOT NULL DEFAULT '[]'::jsonb,
      leisure JSONB NOT NULL DEFAULT '[]'::jsonb,
      extras JSONB NOT NULL DEFAULT '[]'::jsonb,
      proximities JSONB NOT NULL DEFAULT '[]'::jsonb,
      custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      rooms_custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      location_custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      broker JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await dbExecute(`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status)`);
  await dbExecute(`CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties (slug)`);
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Editor',
      status TEXT NOT NULL DEFAULT 'Ativo',
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await dbExecute(`CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email)`);
  await dbExecute(`CREATE INDEX IF NOT EXISTS idx_admin_users_default ON admin_users (is_default)`);
  await dbExecute(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      emails JSONB NOT NULL DEFAULT '[]'::jsonb,
      phone_display TEXT NOT NULL DEFAULT '',
      phones JSONB NOT NULL DEFAULT '[]'::jsonb,
      whatsapp_display TEXT NOT NULL DEFAULT '',
      whatsapp_e164 TEXT NOT NULL DEFAULT '',
      instagram_handle TEXT NOT NULL DEFAULT '',
      instagram_url TEXT NOT NULL DEFAULT '',
      facebook_url TEXT NOT NULL DEFAULT '',
      cep TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      number TEXT NOT NULL DEFAULT '',
      complement TEXT NOT NULL DEFAULT '',
      neighborhood TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      listing_visibility JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensurePropertyColumnUpgrades() {
  const provider = getDbProvider();

  if (provider === "postgres") {
    await dbExecute(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS complement TEXT NOT NULL DEFAULT ''`);
    await dbExecute(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS floors INTEGER NOT NULL DEFAULT 0`);
    await dbExecute(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS units INTEGER NOT NULL DEFAULT 0`);
    await dbExecute(`ALTER TABLE properties ADD COLUMN IF NOT EXISTS towers INTEGER NOT NULL DEFAULT 0`);
    // address_display DEFAULT 'all' na migração: imóveis antigos mantêm endereço completo
    // no público até o admin escolher outra política. Novos cadastros usam "street" no form.
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_display TEXT NOT NULL DEFAULT 'all'`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS iptu_period TEXT NOT NULL DEFAULT 'anual'`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS location_custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms_custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS condo_exempt BOOLEAN NOT NULL DEFAULT FALSE`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS iptu_exempt BOOLEAN NOT NULL DEFAULT FALSE`,
    );
    await dbExecute(
      `ALTER TABLE properties ADD COLUMN IF NOT EXISTS social_bathrooms INTEGER NOT NULL DEFAULT 0`,
    );
    await dbExecute(`UPDATE properties SET complement = '' WHERE complement IS NULL`);
    await dbExecute(`UPDATE properties SET floors = 0 WHERE floors IS NULL`);
    await dbExecute(`UPDATE properties SET units = 0 WHERE units IS NULL`);
    await dbExecute(`UPDATE properties SET towers = 0 WHERE towers IS NULL`);
    await dbExecute(`UPDATE properties SET social_bathrooms = 0 WHERE social_bathrooms IS NULL`);
    await dbExecute(`UPDATE properties SET condo_exempt = FALSE WHERE condo_exempt IS NULL`);
    await dbExecute(`UPDATE properties SET iptu_exempt = FALSE WHERE iptu_exempt IS NULL`);
    await dbExecute(`UPDATE properties SET iptu_period = 'anual' WHERE iptu_period IS NULL OR iptu_period = ''`);
    await dbExecute(
      `UPDATE properties SET custom_fields = '[]'::jsonb WHERE custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET location_custom_fields = '[]'::jsonb WHERE location_custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET rooms_custom_fields = '[]'::jsonb WHERE rooms_custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET address_display = 'all' WHERE address_display IS NULL OR address_display = ''`,
    );
    return;
  }

  const columns = [
    ["complement", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["floors", "INT NOT NULL DEFAULT 0"],
    ["units", "INT NOT NULL DEFAULT 0"],
    ["towers", "INT NOT NULL DEFAULT 0"],
    ["address_display", "VARCHAR(32) NOT NULL DEFAULT 'all'"],
    ["iptu_period", "VARCHAR(16) NOT NULL DEFAULT 'anual'"],
    ["custom_fields", "JSON NULL"],
    ["rooms_custom_fields", "JSON NULL"],
    ["location_custom_fields", "JSON NULL"],
    ["condo_exempt", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["iptu_exempt", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["social_bathrooms", "INT NOT NULL DEFAULT 0"],
  ] as const;

  for (const [name, definition] of columns) {
    try {
      await dbExecute(`ALTER TABLE properties ADD COLUMN ${name} ${definition}`);
    } catch {
      // coluna já existe
    }
  }

  try {
    await dbExecute(`UPDATE properties SET complement = '' WHERE complement IS NULL`);
    await dbExecute(`UPDATE properties SET floors = 0 WHERE floors IS NULL`);
    await dbExecute(`UPDATE properties SET units = 0 WHERE units IS NULL`);
    await dbExecute(`UPDATE properties SET towers = 0 WHERE towers IS NULL`);
    await dbExecute(`UPDATE properties SET social_bathrooms = 0 WHERE social_bathrooms IS NULL`);
    await dbExecute(`UPDATE properties SET condo_exempt = 0 WHERE condo_exempt IS NULL`);
    await dbExecute(`UPDATE properties SET iptu_exempt = 0 WHERE iptu_exempt IS NULL`);
    await dbExecute(
      `UPDATE properties SET iptu_period = 'anual' WHERE iptu_period IS NULL OR iptu_period = ''`,
    );
    await dbExecute(
      `UPDATE properties SET custom_fields = JSON_ARRAY() WHERE custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET location_custom_fields = JSON_ARRAY() WHERE location_custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET rooms_custom_fields = JSON_ARRAY() WHERE rooms_custom_fields IS NULL`,
    );
    await dbExecute(
      `UPDATE properties SET address_display = 'all' WHERE address_display IS NULL OR address_display = ''`,
    );
  } catch {
    // backfill best-effort
  }
}

let dbReady: Promise<void> | null = null;

export async function ensureDbReady() {
  if (!dbReady) {
    dbReady = (async () => {
      await createSchema();
      await ensurePropertyColumnUpgrades();
    })();
  }
  await dbReady;
}

export function resetDbReady() {
  dbReady = null;
  mysqlPool = null;
  neonPool = null;
}
