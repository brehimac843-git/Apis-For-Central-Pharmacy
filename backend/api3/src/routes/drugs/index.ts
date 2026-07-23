import { Router } from 'express';
import { listDrugs, getSuggestions } from '../../controller/drugcontroller.js';
import {
  verifyLocalAgent,
  createLocalAgent,
  updateLocalAgent,
  deleteLocalAgent,
} from '../../controller/authController.js';

const router = Router();

router.get('/', (req, res) => res.status(200).json({ status: 'ok', service: 'api3' }));
router.get('/public-stock', listDrugs);
router.get('/suggestions', getSuggestions);

router.post('/internal/verify-agent', verifyLocalAgent);
router.post('/internal/agents', createLocalAgent);
router.put('/internal/agents/:agentNumber', updateLocalAgent);
router.delete('/internal/agents/:agentNumber', deleteLocalAgent);

export default router;