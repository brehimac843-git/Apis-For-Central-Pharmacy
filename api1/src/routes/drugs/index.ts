import { Router } from 'express';
import { listDrugs, getSuggestions } from './drugcontroller';

const router = Router();

router.get('/public-stock', listDrugs);
router.get('/suggestions', getSuggestions);

export default router;
