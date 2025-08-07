import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { createCampaign, getCampaigns, getCampaignById, updateCampaign, deleteCampaign, getCampaignsToReview, getCampaignDetails, approveCampaign, rejectCampaign, generateUploadUrl, updateCampaignCycleAndLocation, checkCampaignLimit } from '../controllers/campaignController';
import multer from 'multer';
const router = express.Router();

router.post('/generate-upload-url', authMiddleware, generateUploadUrl);
router.post('/create-campaign',authMiddleware,multer().single('mediaFile'), createCampaign);
router.get('/get-campaigns',authMiddleware, getCampaigns);
router.get('/get-campaigns-to-review',authMiddleware, getCampaignsToReview);
router.get('/get-campaign-by-id/:id',authMiddleware, getCampaignById);
router.put('/update-campaign/:id',authMiddleware, multer().single('mediaFile'), updateCampaign);
router.delete('/delete-campaign/:id',authMiddleware, deleteCampaign);
router.get('/get-campaign-details/:id',authMiddleware, getCampaignDetails);
router.put('/approve-campaign/:id',authMiddleware, approveCampaign);
router.put('/reject-campaign/:id',authMiddleware, rejectCampaign);
router.put('/update-campaign-cycle-location/:id', updateCampaignCycleAndLocation);
router.get('/check-campaign-limit', authMiddleware, checkCampaignLimit);
export default router;
