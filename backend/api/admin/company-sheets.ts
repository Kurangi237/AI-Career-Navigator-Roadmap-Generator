/**
 * Company Interview Sheets Admin API
 * Manage company-specific problem lists for interview prep
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/database';

const router = Router();

/**
 * Create a new company interview sheet
 * POST /api/admin/company-sheets
 * Body: { company, problems: [...], difficulty, estimatedHours }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { company, problems, difficulty = 'mixed', estimatedHours = 40 } = req.body;

    if (!company || !Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({ error: 'Company and problems required' });
    }

    // Verify all problems exist
    const { data: existingProblems, error: verifyError } = await supabase
      .from('problems')
      .select('id')
      .in('id', problems);

    if (verifyError || !existingProblems || existingProblems.length !== problems.length) {
      return res.status(400).json({ error: 'Some problems not found' });
    }

    // Create or update sheet
    const { data, error } = await supabase
      .from('company_sheets')
      .upsert(
        [
          {
            company_name: company,
            problem_ids: problems,
            difficulty,
            estimated_hours: estimatedHours,
          },
        ],
        { onConflict: 'company_name' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ sheet: data });
  } catch (err) {
    console.error('Create sheet error:', err);
    res.status(500).json({ error: 'Failed to create company sheet' });
  }
});

/**
 * Get all company sheets
 * GET /api/admin/company-sheets?limit=100
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.query;

    const { data, error } = await supabase
      .from('company_sheets')
      .select('*')
      .order('company_name')
      .limit(parseInt(limit as string));

    if (error) throw error;

    res.json({ sheets: data });
  } catch (err) {
    console.error('Fetch sheets error:', err);
    res.status(500).json({ error: 'Failed to fetch company sheets' });
  }
});

/**
 * Get specific company sheet
 * GET /api/admin/company-sheets/:company
 */
router.get('/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;

    const { data, error } = await supabase
      .from('company_sheets')
      .select('*')
      .eq('company_name', company)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Company sheet not found' });
    }

    // Get statistics for the sheet
    const { data: problemData, error: problemError } = await supabase
      .from('problems')
      .select('difficulty, acceptance_rate')
      .in('id', data.problem_ids);

    const stats = {
      totalProblems: data.problem_ids.length,
      easyCount: problemData?.filter((p: any) => p.difficulty === 'easy').length || 0,
      mediumCount: problemData?.filter((p: any) => p.difficulty === 'medium').length || 0,
      hardCount: problemData?.filter((p: any) => p.difficulty === 'hard').length || 0,
      averageAcceptanceRate: problemData
        ? (problemData.reduce((sum: number, p: any) => sum + (p.acceptance_rate || 0), 0) / problemData.length).toFixed(2)
        : 0,
    };

    res.json({
      sheet: data,
      stats,
    });
  } catch (err) {
    console.error('Fetch sheet error:', err);
    res.status(500).json({ error: 'Failed to fetch company sheet' });
  }
});

/**
 * Update company sheet problems
 * PATCH /api/admin/company-sheets/:company
 * Body: { problems: [...], difficulty, estimatedHours }
 */
router.patch('/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const { problems, difficulty, estimatedHours } = req.body;

    const updateData: Record<string, any> = {};

    if (Array.isArray(problems)) {
      updateData.problem_ids = problems;
    }
    if (difficulty) {
      updateData.difficulty = difficulty;
    }
    if (estimatedHours) {
      updateData.estimated_hours = estimatedHours;
    }

    const { data, error } = await supabase
      .from('company_sheets')
      .update(updateData)
      .eq('company_name', company)
      .select()
      .single();

    if (error) throw error;

    res.json({ sheet: data });
  } catch (err) {
    console.error('Update sheet error:', err);
    res.status(500).json({ error: 'Failed to update company sheet' });
  }
});

/**
 * Delete company sheet
 * DELETE /api/admin/company-sheets/:company
 */
router.delete('/:company', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;

    const { error } = await supabase
      .from('company_sheets')
      .delete()
      .eq('company_name', company);

    if (error) throw error;

    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete sheet error:', err);
    res.status(500).json({ error: 'Failed to delete company sheet' });
  }
});

/**
 * Get problems by company (for users)
 * GET /api/company-sheets/:company/problems?sort=difficulty
 */
router.get('/:company/problems', async (req: Request, res: Response) => {
  try {
    const { company } = req.params;
    const { sort = 'difficulty' } = req.query;

    // Get sheet
    const { data: sheet, error: sheetError } = await supabase
      .from('company_sheets')
      .select('*')
      .eq('company_name', company)
      .single();

    if (sheetError || !sheet) {
      return res.status(404).json({ error: 'Company sheet not found' });
    }

    // Get problems
    const { data: problems, error: problemError } = await supabase
      .from('problems')
      .select('*')
      .in('id', sheet.problem_ids)
      .order(sort === 'difficulty' ? 'difficulty' : 'title');

    if (problemError) throw problemError;

    res.json({
      company,
      estimatedHours: sheet.estimated_hours,
      problems,
    });
  } catch (err) {
    console.error('Fetch problems error:', err);
    res.status(500).json({ error: 'Failed to fetch company problems' });
  }
});

/**
 * Get company statistics
 * GET /api/admin/company-sheets/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { data: sheets, error } = await supabase
      .from('company_sheets')
      .select('*');

    if (error) throw error;

    const stats = {
      totalCompanies: sheets?.length || 0,
      totalProblems: sheets?.reduce((sum: number, s: any) => sum + (s.problem_ids?.length || 0), 0) || 0,
      averageProblemsPerCompany: sheets
        ? Math.round((sheets.reduce((sum: number, s: any) => sum + (s.problem_ids?.length || 0), 0) / sheets.length) * 10) / 10
        : 0,
      companies: sheets?.map((s: any) => ({
        name: s.company_name,
        problemCount: s.problem_ids?.length || 0,
        estimatedHours: s.estimated_hours,
      })) || [],
    };

    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
