import { Router, Request, Response } from 'express';
import { Provider } from '../models/Provider';

const router = Router();

// Temporary migration endpoint - DELETE AFTER USE
router.post('/migrate-provider-types', async (req: Request, res: Response) => {
  try {
    // Update all 'therapist' -> 'psychologist'
    const result = await Provider.updateMany(
      { type: 'therapist' as any },
      { $set: { type: 'psychologist' } }
    );

    res.json({
      success: true,
      message: 'Migration completed successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message,
    });
  }
});

export default router;
