import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
    getCompainsForScreen,
    getCompainsForDriver,
    updateCampaignDownloadStatus
} from '../controllers/DriverController';

const router = express.Router();

router.get('/get-compaigns-for-screen', authMiddleware, getCompainsForScreen);
router.get('/get-compaigns-for-electron', authMiddleware, getCompainsForDriver);
router.post('/update-campaign-download', authMiddleware, updateCampaignDownloadStatus);

export default router;
