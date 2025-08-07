import express from 'express';
import { addAvailableStates, deleteAvailableState, getAvailableStates, addLocation, getAllLocations, updateLocation, deleteLocation, getLocationById, getLocationsWithCampaignStatus } from '../controllers/locationController';
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();

// router.post('/create', authMiddleware, createLocation);
// router.put('/update', authMiddleware,updateLocation);
// router.delete('/delete-by-id/:id', authMiddleware, deleteLocation);
// router.get('/get-by-id/:id', authMiddleware, getLocationById);
router.get('/get-all-locations', authMiddleware, getAllLocations);
router.get('/get-by-id/:id', authMiddleware, getLocationById);
router.post('/add', authMiddleware, addLocation);
router.put('/update/:id', authMiddleware, updateLocation);
router.delete('/delete/:id', authMiddleware, deleteLocation);
router.post('/add-available-states', authMiddleware, addAvailableStates);
router.delete('/delete-available-state/:id', authMiddleware, deleteAvailableState);
router.get('/get-available-states', authMiddleware, getAvailableStates);
router.get('/get-locations-with-campaign-status', authMiddleware, getLocationsWithCampaignStatus);
export default router;