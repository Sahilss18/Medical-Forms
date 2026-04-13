import { DataSource } from 'typeorm';

type AssignmentDocRow = {
  inspection_id: string;
  application_id: string;
  documents_to_verify: unknown;
  app_docs_count: number;
};

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'Sahil18&',
    database: 'medical_forms',
  });

  await ds.initialize();

  const rows = await ds.query<AssignmentDocRow[]>(`
    SELECT
      ia.id AS inspection_id,
      ia.application_id,
      ia.documents_to_verify,
      COUNT(d.id)::int AS app_docs_count
    FROM inspection_assignments ia
    LEFT JOIN documents d ON d.application_id = ia.application_id
    GROUP BY ia.id, ia.application_id, ia.documents_to_verify
    ORDER BY ia.created_at DESC
    LIMIT 20
  `);

  console.log('assignments with doc counts:');
  for (const row of rows) {
    const assignmentDocsCount = Array.isArray(row.documents_to_verify)
      ? row.documents_to_verify.length
      : 0;
    console.log({
      inspection_id: row.inspection_id,
      application_id: row.application_id,
      app_docs_count: row.app_docs_count,
      assignment_docs_count: assignmentDocsCount,
    });
  }

  await ds.destroy();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
