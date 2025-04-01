import { Server } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import docModel from "./document.model.js";
dotenv.config();


async function connectDB() {
    await mongoose.connect(process.env.DB_URL).then(() => {
        console.log('Connected to MongoDB');
    })
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
        });
}
await connectDB();
const io = new Server(3000, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"]
    }
})

io.on("connection", socket => {
    socket.on('get-document', async (documentId) => {
        console.log("id: ", documentId);
        const document = await findOrCreateDoc(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.doc);
        socket.on("send-changes", (delta) => {
            socket.broadcast.to(documentId).emit("receive-changes", delta);
        })
        socket.on("save-changes", async (doc) => {
            await docModel.findByIdAndUpdate(documentId, { doc });
        })
    })
})

async function findOrCreateDoc(docid) {
    if (!docid) return;
    const findDoc = await docModel.findById(docid).lean().exec();
    if (findDoc) return findDoc;
    const createdDoc = await docModel.create({
        _id: docid,
        doc: ""
    });
    return createdDoc;
}
