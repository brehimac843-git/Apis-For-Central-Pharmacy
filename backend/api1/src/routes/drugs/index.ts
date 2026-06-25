import { Router } from 'express';
import { listDrugs, getSuggestions } from '../../controller/drugcontroller';
import {
  verifyLocalAgent,
  createLocalAgent,
  updateLocalAgent,
  deleteLocalAgent,
} from '../../controller/authController';

const router = Router();

router.get('/public-stock', listDrugs);
router.get('/suggestions', getSuggestions);

router.post('/internal/verify-agent', verifyLocalAgent);
router.post('/internal/agents', createLocalAgent);
router.put('/internal/agents/:agentNumber', updateLocalAgent);
router.delete('/internal/agents/:agentNumber', deleteLocalAgent);

export default router;