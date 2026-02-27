/**
 * Bulk Import Admin API
 * Import problems, test cases, and content from JSON/CSV
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../../../lib/database';

const router = Router();

/**
 * Import problems from JSON
 * POST /api/admin/import/problems
 * Body: { problems: [...], testCases: [...] }
 */
router.post('/problems', async (req: Request, res: Response) => {
  try {
    const { problems, testCases } = req.body;

    if (!Array.isArray(problems)) {
      return res.status(400).json({ error: 'Problems must be an array' });
    }

    if (problems.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 problems per import' });
    }

    let insertedCount = 0;
    const errors: string[] = [];

    // Insert in batches of 100
    for (let i = 0; i < problems.length; i += 100) {
      const batch = problems.slice(i, i + 100);

      const { data, error } = await supabase
        .from('problems')
        .insert(batch)
        .select();

      if (error) {
        errors.push(`Batch ${i}: ${error.message}`);
      } else {
        insertedCount += data?.length || 0;

        // Insert test cases if provided
        if (testCases && Array.isArray(testCases)) {
          const testsForBatch = testCases.filter((tc: any) =>
            batch.some((p: any) => p.unique_id === tc.problem_id)
          );

          if (testsForBatch.length > 0) {
            const { error: testError } = await supabase
              .from('test_cases')
              .insert(testsForBatch);

            if (testError) {
              errors.push(`Test cases for batch ${i}: ${testError.message}`);
            }
          }
        }
      }
    }

    res.json({
      imported: insertedCount,
      total: problems.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import problems' });
  }
});

/**
 * Import from CSV file
 * POST /api/admin/import/csv
 */
router.post('/csv', async (req: Request, res: Response) => {
  try {
    const { csvContent, type } = req.body;

    if (!csvContent || !type) {
      return res.status(400).json({ error: 'CSV content and type required' });
    }

    // Parse CSV (simple implementation)
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());

    const records = lines.slice(1).map((line: string) => {
      const values = line.split(',').map((v: string) => v.trim());
      const record: Record<string, string> = {};

      headers.forEach((header: string, idx: number) => {
        record[header] = values[idx] || '';
      });

      return record;
    });

    if (type === 'problems') {
      // Map CSV to problem format
      const problems = records.map((row: Record<string, string>) => ({
        unique_id: row.id || `p-${Date.now()}`,
        title: row.title || '',
        slug: (row.title || '').toLowerCase().replace(/\s+/g, '-'),
        difficulty: row.difficulty || 'medium',
        topic: row.topic || 'Arrays',
        statement: row.statement || '',
        constraints: row.constraints || '',
        mode: row.mode || 'function',
        visibility: row.visibility || 'public',
        tags: row.tags ? row.tags.split(';') : [],
        company_tags: row.companies ? row.companies.split(';') : [],
      }));

      const { data, error } = await supabase
        .from('problems')
        .insert(problems)
        .select();

      if (error) throw error;

      return res.json({
        imported: data?.length || 0,
        type: 'problems',
      });
    }

    res.status(400).json({ error: 'Unknown import type' });
  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
});

/**
 * Import company sheets
 * POST /api/admin/import/company-sheets
 * Body: { sheets: [{ company: 'Amazon', problemIds: [...] }] }
 */
router.post('/company-sheets', async (req: Request, res: Response) => {
  try {
    const { sheets } = req.body;

    if (!Array.isArray(sheets)) {
      return res.status(400).json({ error: 'Sheets must be an array' });
    }

    let insertedCount = 0;

    for (const sheet of sheets) {
      const { company, problemIds, difficulty = 'mixed', estimatedHours = 40 } = sheet;

      if (!company || !Array.isArray(problemIds)) {
        continue;
      }

      const { data, error } = await supabase
        .from('company_sheets')
        .insert([
          {
            company_name: company,
            problem_ids: problemIds,
            difficulty,
            estimated_hours: estimatedHours,
          },
        ])
        .select();

      if (error) {
        console.error(`Error importing ${company}:`, error);
      } else {
        insertedCount++;
      }
    }

    res.json({
      imported: insertedCount,
      total: sheets.length,
    });
  } catch (err) {
    console.error('Company sheets import error:', err);
    res.status(500).json({ error: 'Failed to import company sheets' });
  }
});

/**
 * Get import status/history
 * GET /api/admin/import/history?limit=50
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    // Log imports in a table (would track all import operations)
    const { data, error } = await supabase
      .from('bulk_imports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({ imports: data });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

export default router;
