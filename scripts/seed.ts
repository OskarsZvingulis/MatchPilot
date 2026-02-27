import { getDb } from '../lib/db';

async function seed() {
  const sql = getDb();
  let insertedCount = 0;

  const jobs = [
    {
      external_id: '1001',
      company: 'Tech Solutions Inc.',
      title: 'Senior Software Engineer',
      location: 'New York, NY',
      remote: false,
      url: 'https://example.com/job/1001',
      description: 'Develop and maintain web applications.',
      posted_at_offset_days: 1,
    },
    {
      external_id: '1002',
      company: 'Innovate Corp.',
      title: 'Product Manager',
      location: 'Remote',
      remote: true,
      url: 'https://example.com/job/1002',
      description: 'Lead product development lifecycle.',
      posted_at_offset_days: 3,
    },
    {
      external_id: '1003',
      company: 'Global Fintech',
      title: 'Data Scientist',
      location: 'London, UK',
      remote: false,
      url: 'https://example.com/job/1003',
      description: 'Analyze large datasets and build predictive models.',
      posted_at_offset_days: 5,
    },
    {
      external_id: '1004',
      company: 'E-commerce Giants',
      title: 'UX/UI Designer',
      location: 'San Francisco, CA',
      remote: false,
      url: 'https://example.com/job/1004',
      description: 'Design user-friendly interfaces.',
      posted_at_offset_days: 2,
    },
    {
      external_id: '1005',
      company: 'Cloud Innovators',
      title: 'DevOps Engineer',
      location: 'Remote',
      remote: true,
      url: 'https://example.com/job/1005',
      description: 'Manage and optimize cloud infrastructure.',
      posted_at_offset_days: 6,
    },
  ];

  for (const job of jobs) {
    const result = await sql`
      INSERT INTO jobs_raw (external_id, company, title, location, remote, url, description, posted_at, content_hash, source)
      VALUES (
        ${job.external_id},
        ${job.company},
        ${job.title},
        ${job.location},
        ${job.remote},
        ${job.url},
        ${job.description},
        now() - INTERVAL '${job.posted_at_offset_days} day',
        md5(${job.external_id}),
        'seed'
      )
      ON CONFLICT (content_hash) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) {
      insertedCount++;
    }
  }

  console.log(`Seed complete. Inserted ${insertedCount} jobs.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
