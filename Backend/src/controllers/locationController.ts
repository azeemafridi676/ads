import {Request, Response} from "express";
import {ApiResponse} from "../types/apiResponse";
import {validateRequiredFields} from "../lib/validation";
import Location, { ILocation } from "../models/locationModel";
import AvailableStates from "../models/availableStatesModel";
import mongoose from "mongoose";
import Campaign, { ICampaign } from "../models/campaignModel";

export const addAvailableStates = async (req: Request, res: Response) => {
    try {
        const states = req.body; 
        const result = await AvailableStates.insertMany(states);
        res.status(201).json({
            status: 201,
            message: "States added successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: 500,
            message: "Failed to add states",
        });
    }
}
export const deleteAvailableState = async (req: Request, res: Response) => {
    const {id} = req.params;
    const result = await AvailableStates.findByIdAndDelete(id);
    res.status(200).json(result);
}

export const getAvailableStates = async (req: Request, res: Response) => {
    const result = await AvailableStates.find();
    res.status(200).json(result);
}

// //Create a location
export const addLocation = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const locationData = {
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            locationName: req.body.locationName,
            radius: req.body.radius,
            state: req.body.state,
            userId: (req as any).user._id
        };
        const subscription = (req as any).user.currentSubscription;
        
        // Check radius limit
        if(!subscription.allowedRadius) {
            subscription.allowedRadius = 500;
        }
        if(subscription.allowedRadius < req.body.radius) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "You have exceeded your allowed radius",
            };
            res.status(400).json(response);
            return;
        }

        // Check location limit
        const userLocations = await Location.find({ userId: (req as any).user._id });
        if (userLocations.length >= subscription.locationLimit) {
            const response: ApiResponse<null> = {
                status: 400,
                message: `You have reached your plan's limit of ${subscription.locationLimit} locations`,
            };
            res.status(400).json(response);
            return;
        }

        const savedLocation = await Location.create(locationData);
        const response: ApiResponse<typeof savedLocation> = {
            status: 201,
            message: "Location created successfully",
            data: savedLocation,
        };
        res.status(201).json(response);
        return;
    } catch (error) {
        console.error("Error creating location:", error);
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server error",
        };
        res.status(500).json(response);
        return;
    }
};

export const getAllLocations = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        const locations = await Location.find({userId});
        const response: ApiResponse<typeof locations> = {
            status: 200,
            message: "Locations retrieved successfully",
            data: locations || [],
        };
        res.status(200).json(response);
        return;
    } catch (error) {
        console.error("Error retrieving locations:", error);
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server error",
        };
        res.status(500).json(response);
        return;
    }
};

export const updateLocation = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const locationData = req.body;
    try {
        if (!mongoose.isValidObjectId(id)) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid id format",
            };
            res.status(400).json(response);
            return;
        }

        const exist = await Location.findById(id);
        if (!exist) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Location not found",
            };
            res.status(404).json(response);
            return;
        }
        
        // Check if user owns this location
        if (exist.userId.toString() !== (req as any).user._id.toString()) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Not authorized to update this location",
            };
            res.status(403).json(response);
            return;
        }

        // Check radius against subscription limit
        const subscription = (req as any).user.currentSubscription;
        if (!subscription.allowedRadius) {
            subscription.allowedRadius = 500;
        }
        if (subscription.allowedRadius < locationData.radius) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "You have exceeded your allowed radius",
            };
            res.status(400).json(response);
            return;
        }

        // Update the location
        const result = await Location.findByIdAndUpdate(id, {
            locationName: locationData.name,
            state: locationData.state,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            radius: locationData.radius
        }, {
            new: true,
            runValidators: true,
        });

        if (!result) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Location not updated",
            };
            res.status(404).json(response);
            return;
        }

        const response: ApiResponse<typeof result> = {
            status: 200,
            message: "Location updated successfully",
            data: result,
        };
        res.status(200).json(response);
        return;
    } catch (error) {
        console.error("Error updating location:", error);
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server error",
        };
        res.status(500).json(response);
        return;
    }
};

export const deleteLocation = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {id} = req.params;
    try {
        if (!mongoose.isValidObjectId(id)) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid id format",
            };
            res.status(400).json(response);
            return;
        }

        const location = await Location.findById(id);
        if (!location) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Location not found",
            };
            res.status(404).json(response);
            return;
        }

        // Check if user owns this location
        if (location.userId.toString() !== (req as any).user._id.toString()) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Not authorized to delete this location",
            };
            res.status(403).json(response);
            return;
        }

        const result = await Location.findByIdAndDelete(id);
        const response: ApiResponse<any> = {
            status: 200,
            message: "Location deleted successfully",
            data: result,
        };
        res.status(200).json(response);
        return;
    } catch (error) {
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server Error",
        };
        res.status(500).json(response);
        return;
    }
};

export const getLocationById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {id} = req.params;
    try {
        if (!mongoose.isValidObjectId(id)) {
            const response: ApiResponse<null> = {
                status: 400,
                message: "Invalid id format",
            };
            res.status(400).json(response);
            return;
        }

        const location = await Location.findById(id);
        if (!location) {
            const response: ApiResponse<null> = {
                status: 404,
                message: "Location not found",
            };
            res.status(404).json(response);
            return;
        }
        
        // Check if user owns this location
        if (location.userId.toString() !== (req as any).user._id.toString()) {
            const response: ApiResponse<null> = {
                status: 403,
                message: "Not authorized to view this location",
            };
            res.status(403).json(response);
            return;
        }

        const response: ApiResponse<any> = {
            status: 200,
            message: "Location retrieved successfully",
            data: location,
        };
        res.status(200).json(response);
        return;
    } catch (error) {
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server Error",
        };
        res.status(500).json(response);
        return;
    }
};

export const getLocationsWithCampaignStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        
        // Get all locations for the user
        const locations = await Location.find({ userId });

        // Get all approved campaigns that use these locations
        const approvedCampaigns = await Campaign.find({
            selectedLocations: { $in: locations.map(loc => loc._id) },
            'approvalStatus.isApproved': true,
            status: { $in: ['approved', 'active', 'scheduled'] }
        });

        // Create a set of location IDs that are used in approved campaigns
        const locationsInApprovedCampaigns = new Set(
            approvedCampaigns.flatMap((campaign: ICampaign) => 
                (campaign.selectedLocations as mongoose.Types.ObjectId[]).map(locId => locId.toString())
            )
        );

        // Add the isUsedInApprovedCampaign flag to each location
        const locationsWithStatus = locations.map((location: any) => ({
            ...location.toObject(),
            isUsedInApprovedCampaign: locationsInApprovedCampaigns.has(location._id.toString())
        }));

        const response: ApiResponse<typeof locationsWithStatus> = {
            status: 200,
            message: "Locations retrieved successfully",
            data: locationsWithStatus,
        };

        res.status(200).json(response);
        return;
    } catch (error) {
        console.error("Error retrieving locations with campaign status:", error);
        const response: ApiResponse<null> = {
            status: 500,
            message: "Internal server error",
        };
        res.status(500).json(response);
        return;
    }
};

// export const getLocationsByLongitudeAndLatitude = async (
//     req: Request,
//     res: Response
// ): Promise<void> => {
//     const {longitude, latitude} = req.body;
//     try {
//         const result = await Location.find(latitude, longitude).select("-_id");
//         if (!result || result.length === 0) {
//             const response: ApiResponse<null> = {
//                 status: 404,
//                 message:
//                     "No locations found near the provided coordinates.",
//             };
//             res.status(404).json(response);
//             return;
//         }
//         const response: ApiResponse<any> = {
//             status: 200,
//             message: "Locations retrieved successfully",
//             data: result,
//         };
//         res.status(200).json(response);
//         return;
//     } catch (error) {
//         const response: ApiResponse<null> = {
//             status: 500,
//             message: "Internal server Error",
//         };
//         res.status(500).json(response);
//         return;
//     }
// };

// export const updateLocationByLatitudeAndLongitude = async (
//     req: Request,
//     res: Response
// ): Promise<void> => {
//     const {longitude, latitude, location} = req.body;
//     try {
//         const result = await Location.findOneAndUpdate(
//             {latitude, longitude},
//             location,
//             {
//                 new: true,
//                 runValidators: true,
//             }
//         ).select("-_id");
//         if (!result) {
//             const response: ApiResponse<null> = {
//                 status: 404,
//                 message: "Location not updated",
//             };
//             res.status(404).json(response);
//             return;
//         }
//         const response: ApiResponse<any> = {
//             status: 200,
//             message: "Location updated successfully",
//             data: result,
//         };
//         res.status(200).json(response);
//         return;
//     } catch (error) {
//         const response: ApiResponse<null> = {
//             status: 500,
//             message: "Internal server Error",
//         };
//         res.status(500).json(response);
//         return;
//     }
// };

// //Please remove this function Malik Ahsan
// export const getLocationsByRestaurantId1 = async (
//     req: Request,
//     res: Response
// ): Promise<void> => {
//     try {
//         const restaurantId = (req as any).user.restaurantId;
//         if (!mongoose.isValidObjectId(restaurantId)) {
//             const response: ApiResponse<null> = {
//                 status: 400,
//                 message: "Invalid restaurantId format",
//             };
//             res.status(400).json(response);
//             return;
//         }
//         const result = await Location.aggregate([
//             {$match: {restaurantId: new mongoose.Types.ObjectId(restaurantId)}},
//             ...commonPipeLookup,
//         ]);
//         if (!result || result.length === 0) {
//             const response: ApiResponse<null> = {
//                 status: 404,
//                 message:
//                     "No locations found for this restaurant.",
//             };
//             res.status(404).json(response);
//             return;
//         }

//         const response: ApiResponse<any> = {
//             status: 200,
//             message: "Locations retrieved successfully",
//             data: result,
//         };
//         res.status(200).json(response);
//         return;
//     } catch (error) {
//         const response: ApiResponse<null> = {
//             status: 500,
//             message: "Internal server Error",
//         };
//         res.status(500).json(response);
//         return;
//     }
// };
// export const getLocationsByRestaurantId = async (
//     req: Request,
//     res: Response
// ): Promise<void> => {
//     try {
//         const restaurantId = (req as any).user.restaurantId;
//         if (!mongoose.isValidObjectId(restaurantId)) {
//             throw "Invalid restaurantId format";
//         }
//         const result = await Location.aggregate([
//             {
//               $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } // Filter by restaurantId
//             },{
//                 $lookup: {
//                     from : "stores",
//                     localField : "_id",
//                     foreignField : "locationId",
//                     as : "stores"
//                 }
//             }
//           ]);
//         // const result = await Location.find({restaurantId: new mongoose.Types.ObjectId(restaurantId)});
//         if (!result || result.length === 0) {
//             const response: ApiResponse<null> = {
//                 status: 404,
//                 message:
//                     "No locations found for this restaurant.",
//             };
//             res.status(404).json(response);
//             return;
//         }

//         const response: ApiResponse<any> = {
//             status: 200,
//             message: "Locations retrieved successfully",
//             data: result,
//         };
//         res.status(200).json(response);
//         return;
//     } catch (error) {
//         const response: ApiResponse<null> = {
//             status: 500,
//             message: "Internal server Error",
//         };
//         res.status(500).json(response);
//         return;
//     }
// };
