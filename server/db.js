import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ MONGODB_URI is missing in .env file");
}

const client = new MongoClient(uri);
let db;


export async function connectToDB() {
  try {
    await client.connect();
    db = client.db("realTimeApp");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

export function getDB() {
  if (!db) {
    throw new Error("❌ Database not connected. Call connectToDB() first.");
  }
  return db;
}

async function isEmailExist(email) {
  const usersCollection = db.collection("users");
  const existingUser = await usersCollection.findOne({ email });
  return existingUser !== null;
}

export async function insertUser(user) {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");

    const emailExists = await isEmailExist(user.email);

    if (!emailExists) {
      user.password = await bcrypt.hash(user.password, 10);
      const result = await usersCollection.insertOne(user);
      console.log("Document inserted with _id:", result.insertedId);

      return {
        _id: result.insertedId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || null,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error inserting document:", error);
    throw error;
  }
}

export async function saveUserLocation(userId, lat, lng) {
  const db = getDB();
  const locations = db.collection("locations");

  const _id = new ObjectId(userId);

  const result = await locations.updateOne(
    { userId: _id },
    {
      $set: {
        userId: _id,
        lat,
        lng,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );

  return result;
}

export async function findUserByEmail(email) {
  const db = getDB();
  const usersCollection = db.collection("users");
  return usersCollection.findOne({ email });
}

export async function closeConnection() {
  if (client && client.isConnected && client.isConnected()) {
    await client.close();
    console.log("✅ MongoDB connection closed");
  }
}

export async function validateUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  delete user.password;
  return user;
}

export async function createGroup(groupName, ownerId) {
  const db = getDB();
  const groups = db.collection("groups");

  const result = await groups.insertOne({
    name: groupName,
    ownerId,
    members: [ownerId],
    createdAt: new Date(),
  });

  return result.insertedId;
}

export async function joinGroup(groupId, userId) {
  const db = getDB();
  const groups = db.collection("groups");

  await groups.updateOne(
    { _id: new ObjectId(groupId) },
    { $addToSet: { members: new ObjectId(userId) } }
  );
}


export async function getGroupLocations(groupId) {
  const db = getDB();
  const groups = db.collection("groups");
  const locations = db.collection("locations");
  const users = db.collection("users");

  if (!ObjectId.isValid(groupId)) {
    throw new Error("Invalid groupId: " + groupId);
  }

  const group = await groups.findOne({ _id: new ObjectId(groupId) });
  if (!group) return [];

  const members = group.members;

  const locationData = await locations
    .find({ userId: { $in: members } })
    .toArray();

  const enriched = await Promise.all(
    locationData.map(async (loc) => {
      const user = await users.findOne({ _id: loc.userId });
      return {
        name: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        lat: loc.lat,
        lng: loc.lng,
        userId: loc.userId.toString(),
        updatedAt: loc.updatedAt,
      };
    })
  );

  return enriched;
}
