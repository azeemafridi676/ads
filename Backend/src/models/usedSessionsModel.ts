import mongoose, { Schema, Document } from 'mongoose';

interface IUsedSession extends Document {
    sessionId: string;
    usedAt: Date;
}

const usedSessionSchema = new Schema<IUsedSession>({
    sessionId: { type: String, required: true },
    usedAt: { type: Date, required: true },
});

const UsedSession = mongoose.model<IUsedSession>('UsedSession', usedSessionSchema);

export default UsedSession;
