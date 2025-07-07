import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  connectToDB,
  insertUser,
  validateUser,
  saveUserLocation,
  createGroup,
  joinGroup,
  getGroupLocations,
  getDB,
} from "./db.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./authMiddleware.js";
import { ObjectId } from "mongodb";
import { Server } from "socket.io";
import http from "http";
import fs from "fs";
import uploadRoutes, { upload } from "./upload.js";
import cloudinary from "./cloudinary.js";

const app = express();
app.use("/api/upload", uploadRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

await connectToDB();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ---------------------------
//       API ROUTES
// ---------------------------

app.post("/api/register", upload.single("avatar"), async (req, res) => {
  try {
    let avatarUrl = null;

    if (req.file) {
      const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
      });
      fs.unlinkSync(req.file.path);
      avatarUrl = cloudinaryResult.secure_url;
    }

    const user = {
      ...req.body,
      avatar: avatarUrl,
    };

    const insertedUser = await insertUser(user);

    if (!insertedUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const payload = {
      id: insertedUser._id,
      email: insertedUser.email,
      name: `${insertedUser.firstName} ${insertedUser.lastName}`,
      avatar: insertedUser.avatar,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax", 
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Registration and login successful", user: payload });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/login", upload.none(), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await validateUser(email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const payload = {
      id: user._id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful", user: payload });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json({ user });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.post("/api/location", authMiddleware, async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ message: "Missing coordinates" });
  }

  try {
    const result = await saveUserLocation(req.user.id, lat, lng);
    res.json({ message: "Location saved", location: result });

    const db = getDB();
    const users = db.collection("users");
    const user = await users.findOne({ _id: new ObjectId(req.user.id) });
    const groups = db.collection("groups");
    const groupDocs = await groups.find({ members: new ObjectId(req.user.id) }).toArray();
    groupDocs.forEach((group) => {
      io.to(group._id.toString()).emit("location-update", {
        lat,
        lng,
        userId: req.user.id,
        name: user.firstName + " " + user.lastName,
        avatar: user.avatar,
      });
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save location" });
  }
});

app.post("/api/group", authMiddleware, async (req, res) => {
  const { name } = req.body;
  try {
    const groupId = await createGroup(name, new ObjectId(req.user.id));
    res.json({ message: "Group created", groupId: groupId.toString() });
  } catch (err) {
    res.status(500).json({ message: "Failed to create group" });
  }
});

app.get("/api/groups", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const db = getDB();
    const groups = db.collection("groups");
    const userGroups = await groups.find({ members: new ObjectId(userId) }).toArray();
    res.json({ groups: userGroups });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch groups" });
  }
});

app.post("/api/group/:groupId/join", authMiddleware, async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user.id;

  if (!ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: "Invalid group ID" });
  }

  try {
    await joinGroup(groupId, userId);
    res.json({ message: "Joined group successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to join group" });
  }
});

app.get("/api/group/:groupId/locations", authMiddleware, async (req, res) => {
  const groupId = req.params.groupId;

  if (!ObjectId.isValid(groupId)) {
    return res.status(400).json({ message: "Invalid groupId" });
  }

  try {
    const locations = await getGroupLocations(groupId);
    res.json({ locations });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

app.patch("/api/userSettings", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;
    const db = getDB();
    const users = db.collection("users");

    const updateData = {};

    if (firstName?.trim()) updateData.firstName = firstName.trim();
    if (lastName?.trim()) updateData.lastName = lastName.trim();

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
      });
      fs.unlinkSync(req.file.path);
      updateData.avatar = result.secure_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No changes provided" });
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateData },
      { returnDocument: "after", projection: { password: 0 } }
    );

    const updatedUser = result;
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const payload = {
      id: updatedUser._id,
      email: updatedUser.email,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      avatar: updatedUser.avatar,
    };

    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2d" });

    res.cookie("token", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Profile updated successfully", user: payload });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// ---------------------------
//       SOCKET.IO
// ---------------------------
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-group", (groupId) => {
    socket.join(groupId);
    console.log(`✅ Socket ${socket.id} joined group ${groupId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ---------------------------
//     SERVE REACT BUILD
// ---------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const clientBuildPath = path.join(__dirname, "client", "dist"); 


app.use(express.static(clientBuildPath));

app.get("/", function (req, res) {
  res.sendFile(path.resolve(clientBuildPath, "index.html"));
});


// ---------------------------
//         START SERVER
// ---------------------------

server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
