//use this case for naming routes user-create
import { Router } from "express";
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  verifyToken,
  getUserProfile,
  forgotPassword,
  resetPassword,
  updateProfile,
  logout,
  getAllUsers,
  banUser,
  unbanUser,
  changePassword,
  deleteAccount,
  googleAuth,
  googleCallback,
  checkAdminStatus,
} from "../controllers/userController";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();
import { authMiddleware } from "../middleware/authMiddleware";
import passport from "../config/passport";

// User Auth Routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/resend-otp", resendOtp);
router.post("/auth/verify-token", verifyToken);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.post("/auth/change-password", authMiddleware, changePassword);

// Google OAuth Routes
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", passport.authenticate("google", { session: false }), googleCallback);

router.get("/profile/detail/:id", authMiddleware, getUserProfile);
router.post(
  "/profile/update-profile",
  upload.single("profileImage"),
  authMiddleware,
  updateProfile
);
router.delete("/profile/delete-account", authMiddleware, deleteAccount);
router.post("/auth/logout", authMiddleware, logout);
router.get("/users/list", authMiddleware, getAllUsers);
router.post("/users/ban/:id", authMiddleware, banUser);
router.post("/users/unban/:id", authMiddleware, unbanUser);
router.get("/admin/status", authMiddleware, checkAdminStatus);

export default router;
