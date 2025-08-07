import { Request, Response } from 'express';
import User from '../models/userModel'
import { ApiResponse } from '../types/apiResponse';  // Import the ApiResponse type
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendResetPasswordEmail } from '../services/emailService';
import { generateResetToken } from '../lib/tokenUtils';
import { uploadFileToS3 } from '../services/fileUploadService';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService';
import { disconnectSocket, markUserStatus } from '../lib/socketConfig';
import passport from 'passport';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phoneNumber, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { verificationId, otp } = generateRandomIdAndOtp()
    
    await sendOtpEmail({
      email,
      otp,
      userName: firstName + ' ' + lastName
    });
   
    let data = { firstName, lastName, phoneNumber, email, password: hashedPassword, otp, role:'user', verificationId };
    await User.create(data);
    await sendWelcomeEmail(email, firstName + ' ' + lastName);
    
    const response: ApiResponse<{ verificationId: string }> = {
      status: 200,
      data: { verificationId },
      message: 'User otp sent successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.log('error in signup:', error)
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error in signup',
    };
    res.status(500).json(response);
  }
};
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    await disconnectSocket(userId);
    res.status(200).json({
      status: 200,
      message: 'Logout successful',
      data: null,
    });
  } catch (error) {
    console.error('Error in logout:', error);
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password, email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Check if user is banned
    if (user.isBanned) {
      res.status(403).json({
        status: 403,
        message: 'Your account has been banned',
        data: {
          isBanned: true,
          banReason: user.banReason,
          bannedAt: user.bannedAt
        }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        status: 400,
        message: 'Invalid credentials',
        data: null,
      });
      return;
    }
    const { verificationId, otp } = generateRandomIdAndOtp()
    console.log('email:', email);
    await sendOtpEmail({
      email,
      otp,
      userName: user.firstName + ' ' + user.lastName
    });
    
    user.verificationId = verificationId;
    user.otp = otp;
    await user.save();
    const response: ApiResponse<{ verificationId: string }> = {
      status: 200,
      data: { verificationId },
      message: 'User OTP and verification ID generated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in login:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error processing login',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        status: 400,
        message: 'Invalid requests',
        data: null,
      });
      return;
    }
    const { verificationId, otp } = generateRandomIdAndOtp()
    await sendOtpEmail({
      email,
      otp,
      userName: user.firstName + ' ' + user.lastName
    });
    
    user.verificationId = verificationId;
    user.otp = otp;
    await user.save();
    const response: ApiResponse<{ verificationId: string }> = {
      status: 200,
      data: { verificationId },
      message: 'User OTP generated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in login:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error processing login',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationId, otp } = req.body;
    const user = await User.findOne({ verificationId });

    if (!user) {
      const response: ApiResponse<null> = {
        status: 404,
        message: 'User not found',
      };
      res.status(404).json(response);
      return;
    }

    if (user.otp !== otp) {
      const response: ApiResponse<null> = {
        status: 400,
        message: 'Invalid OTP',
      };
      res.status(400).json(response);
      return;
    }

    user.otp = null;
    await user.save();

    // Generate tokens
    const tokens = await issueTokens(user);
    const response: ApiResponse<{ accessToken: string, refreshToken: string }> = {
      status: 200,
      message: 'OTP verified successfully',
      data: tokens,
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error verifying OTP',
    };
    res.status(500).json(response);
  }
};
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken, refreshToken } = req.body;
    if (!accessToken || !refreshToken) {

      const response: ApiResponse<null> = {
        status: 400,
        message: 'Tokens are required',
      };
      res.status(400).json(response);
      return;
    }
    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decoded) => {
      if (!err) {
        const user = await User.findById((decoded as any).userId);
        if (user) {
          const response: ApiResponse<{ valid: true }> = {
            status: 200,
            message: 'Access token is valid',
            data: { valid: true }
          };
          res.status(200).json(response);
        } else {
          const response: ApiResponse<null> = {
            status: 404,
            message: 'User not found',
          };
          res.status(404).json(response);
        }
        return;
      }
      jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          const response: ApiResponse<null> = {
            status: 401,
            message: 'Invalid refresh token',
          };
          res.status(401).json(response);
          return;
        }
        const user = await User.findById((decoded as any).userId);
        if (!user) {
          const response: ApiResponse<null> = {
            status: 404,
            message: 'User not found',
          };
          res.status(404).json(response);
          return;
        }
        const tokens = await issueTokens(user);
        const response: ApiResponse<{ valid: true; accessToken?: string; refreshToken?: string }> = {
          status: 200,
          message: 'Tokens refreshed successfully',
          data: { valid: true, ...tokens }
        };
        res.status(200).json(response);
      });
    });
  } catch (error) {
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error verifying tokens',
    };
    res.status(500).json(response);
  }
};
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Generate a reset token
    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 300000; // Token expires in 5 minute
    await user.save();

    // Send password reset email
    await sendResetPasswordEmail({ email, resetToken });

    res.status(200).json({
      status: 200,
      message: 'Password reset link sent to your email',
      data: null,
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({
      status: 500,
      message: 'Error processing forgot password request',
      data: null,
    });
  }
};
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
    if (!user) {
      res.status(400).json({
        status: 400,
        message: 'Invalid or expired reset token',
        data: null,
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({
      status: 200,
      message: 'Password successfully reset',
      data: null,
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({
      status: 500,
      message: 'Error processing reset password request',
      data: null,
    });
  }
};
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, Dob, phoneNumber, _id } = req.body;
    const updateFields: any = {};
    if (req.file) {
      updateFields.profileImage = await uploadFileToS3(req.file);
    }
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (Dob && Dob !== 'null' && Dob !== '') {
      const date = new Date(Dob);
      if (!isNaN(date.getTime())) {
        updateFields.Dob = date;
      }
    }
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;

    const updatedUser = await User.findOneAndUpdate(
      { _id },
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    const response: ApiResponse<any> = {
      status: 201,
      data: updatedUser,
      message: 'Profile updated successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 500,
      message: 'Error updating profile',
      data: null,
    });
  }
};
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userData = await User.findById(id).populate('currentSubscription');
    if (!userData) {
       res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
    }
    // mark user as online
    await User.findByIdAndUpdate(id, { status: 'online' });
    markUserStatus(userData, 'online');
    const response: ApiResponse<any> = {
      status: 200,
      data: userData, 
      message: 'Data fetched successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in fetching data:', error);
    res.status(500).json({
      status: 500,
      message: 'Error in fetching data',
      data: null,
    });
  }
};
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'admin') {
      res.status(403).json({
        status: 403,
        message: 'Unauthorized. Only admin can access this resource.',
        data: null,
      });
      return;
    }

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Search parameters
    const searchTerm = (req.query.search as string) || '';
    
    // Build search query
    const searchQuery = searchTerm ? {
      $and: [
        { role: { $in: ['driver', 'user'] } },
        {
          $or: [
            { firstName: { $regex: searchTerm, $options: 'i' } },
            { lastName: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    } : { role: { $in: ['driver', 'user'] } };

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    // Get paginated users
    const users = await User.find(searchQuery)
      .select('-password -otp -resetToken -resetTokenExpiry')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalPages = Math.ceil(total / limit);

    const response: ApiResponse<any> = {
      status: 200,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit
        }
      },
      message: 'Users fetched successfully',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error fetching users',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUser = (req as any).user;
    const userId = req.params.id;
    const { reason } = req.body;
    
    // Check if the requester is an admin
    if (adminUser.role !== 'admin') {
      res.status(403).json({
        status: 403,
        message: 'Unauthorized. Only admin can ban users.',
        data: null,
      });
      return;
    }

    // Find the user to ban
    const userToBan = await User.findById(userId);
    
    if (!userToBan) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Cannot ban admin users
    if (userToBan.role === 'admin') {
      res.status(400).json({
        status: 400,
        message: 'Cannot ban admin users',
        data: null,
      });
      return;
    }

    // Update user's ban status
    userToBan.isBanned = true;
    userToBan.bannedAt = new Date();
    userToBan.bannedBy = adminUser._id;
    userToBan.banReason = reason || null; // Set reason if provided
    await userToBan.save();

    // Force logout the banned user by disconnecting their socket
    await disconnectSocket(userId);

    const response: ApiResponse<null> = {
      status: 200,
      message: 'User has been banned successfully',
      data: null,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error banning user:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error banning user',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminUser = (req as any).user;
    const userId = req.params.id;
    
    // Check if the requester is an admin
    if (adminUser.role !== 'admin') {
      res.status(403).json({
        status: 403,
        message: 'Unauthorized. Only admin can unban users.',
        data: null,
      });
      return;
    }

    // Find the user to unban
    const userToUnban = await User.findById(userId);
    
    if (!userToUnban) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Update user's ban status
    userToUnban.isBanned = false;
    userToUnban.bannedAt = null;
    userToUnban.bannedBy = null;
    userToUnban.banReason = null;
    await userToUnban.save();

    const response: ApiResponse<null> = {
      status: 200,
      message: 'User has been unbanned successfully',
      data: null,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error unbanning user:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error unbanning user',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({
        status: 400,
        message: 'Current password is incorrect',
        data: null,
      });
      return;
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    const response: ApiResponse<null> = {
      status: 200,
      message: 'Password changed successfully',
      data: null,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error changing password:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error changing password',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      res.status(404).json({
        status: 404,
        message: 'User not found',
        data: null,
      });
      return;
    }

    // Disconnect user's socket if connected
    await disconnectSocket(userId);

    const response: ApiResponse<null> = {
      status: 200,
      message: 'Account deleted successfully',
      data: null,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting account:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error deleting account',
      data: null,
    };
    res.status(500).json(response);
  }
};
export const checkAdminStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Find any admin user who is online
    const admin = await User.findOne({ 
      role: 'admin',
      status: 'online'
    });

    const response: ApiResponse<{ isOnline: boolean }> = {
      status: 200,
      data: { isOnline: !!admin },
      message: 'Admin status checked successfully'
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Error checking admin status:', error);
    const response: ApiResponse<null> = {
      status: 500,
      message: 'Error checking admin status',
      data: null
    };
    res.status(500).json(response);
  }
};
export const issueTokens = async (user: any) => {
  const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
  const refreshToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY });
  return { accessToken, refreshToken };
};
const generateRandomIdAndOtp = () => {
  const verificationId = crypto.randomBytes(16).toString('hex');
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp = '123456';
  console.log('otp:', otp);
  return { verificationId, otp };
};

export const googleAuth = (req: Request, res: Response, next: Function) => {
  // Store the purpose in the session
  const purpose = req.query.purpose as string;
  console.log("Google auth purpose:", purpose);
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: purpose // Pass purpose as state
  })(req, res, next);
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("came to googleCallback here is the state", req.query.state);
    const user = req.user as any;
    const purpose = req.query.state as string;
    
    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server`);
      return;
    }

    // If this is a signup flow, always create a new user
    if (purpose === 'signup') {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const newUser = await User.create({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: hashedPassword,
        role: 'user',
        profileImage: user.profileImage
      });
      
      const tokens = await issueTokens(newUser);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
      return;
    }

    // For login flow, check if user exists
    if (user.isNewUser) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=notfound&email=${encodeURIComponent(user.email)}&firstName=${encodeURIComponent(user.firstName)}&lastName=${encodeURIComponent(user.lastName)}&profileImage=${encodeURIComponent(user.profileImage || '')}`);
      return;
    }

    // Generate tokens for existing user
    const tokens = await issueTokens(user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  } catch (error) {
    console.error('Error in googleCallback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=server`);
  }
};