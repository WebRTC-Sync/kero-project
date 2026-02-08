import { Server, Socket } from "socket.io";
import { songService } from "../../services/SongService";
import { roomService } from "../../services/RoomService";
import { RoomStatus } from "../../entities";
import { redis } from "../../config/redis";

interface PitchData {
  time: number;
  frequency: number;
  confidence: number;
}

interface TurnState {
  currentSingerId: number | null;
  turnOrder: number[];
  currentTurnIndex: number;
  sungSingerIds: Set<number>;
  isFinishing: boolean;
}

export class PerfectScoreHandler {
  private turnStates = new Map<string, TurnState>();

  constructor(private io: Server) {}

  private toParticipantId(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private async emitTurnChanged(roomCode: string): Promise<void> {
    const turnState = this.turnStates.get(roomCode);
    if (!turnState || turnState.currentSingerId === null) return;

    const room = await roomService.getRoomByCode(roomCode);
    const currentSinger = room?.participants.find((participant) => participant.id === turnState.currentSingerId);

    this.io.to(roomCode).emit("perfect:turn-changed", {
      currentSingerId: turnState.currentSingerId,
      currentSingerNickname: currentSinger?.nickname ?? "Unknown",
    });
  }

  private initializeTurnState(roomCode: string, participantIds: number[]): void {
    const turnOrder = [...participantIds];
    const currentTurnIndex = 0;

    this.turnStates.set(roomCode, {
      currentSingerId: turnOrder.length > 0 ? turnOrder[currentTurnIndex] : null,
      turnOrder,
      currentTurnIndex,
      sungSingerIds: new Set<number>(),
      isFinishing: false,
    });
  }

  private async advanceTurnOrFinish(roomCode: string, options?: { markCurrentAsSung?: boolean }): Promise<void> {
    const turnState = this.turnStates.get(roomCode);
    if (!turnState || turnState.isFinishing) return;

    if (options?.markCurrentAsSung && turnState.currentSingerId !== null) {
      turnState.sungSingerIds.add(turnState.currentSingerId);
    }

    if (turnState.turnOrder.length === 0 || turnState.sungSingerIds.size >= turnState.turnOrder.length) {
      turnState.isFinishing = true;
      await this.calculateFinalScores(roomCode);
      this.turnStates.delete(roomCode);
      return;
    }

    for (let offset = 1; offset <= turnState.turnOrder.length; offset++) {
      const nextIndex = (turnState.currentTurnIndex + offset) % turnState.turnOrder.length;
      const nextSingerId = turnState.turnOrder[nextIndex];
      if (!turnState.sungSingerIds.has(nextSingerId)) {
        turnState.currentTurnIndex = nextIndex;
        turnState.currentSingerId = nextSingerId;
        this.turnStates.set(roomCode, turnState);
        await this.emitTurnChanged(roomCode);
        return;
      }
    }

    turnState.isFinishing = true;
    await this.calculateFinalScores(roomCode);
    this.turnStates.delete(roomCode);
  }

  async handleParticipantLeave(roomCode: string, participantId: number): Promise<void> {
    const turnState = this.turnStates.get(roomCode);
    if (!turnState) return;

    const removedIndex = turnState.turnOrder.findIndex((id) => id === participantId);
    if (removedIndex === -1) return;

    turnState.turnOrder.splice(removedIndex, 1);
    turnState.sungSingerIds.delete(participantId);

    if (turnState.turnOrder.length === 0) {
      this.turnStates.delete(roomCode);
      return;
    }

    const currentSingerLeft = turnState.currentSingerId === participantId;
    if (removedIndex < turnState.currentTurnIndex) {
      turnState.currentTurnIndex = Math.max(0, turnState.currentTurnIndex - 1);
    }

    if (!currentSingerLeft) {
      this.turnStates.set(roomCode, turnState);
      return;
    }

    const nextIndex = turnState.currentTurnIndex % turnState.turnOrder.length;
    turnState.currentTurnIndex = nextIndex;
    turnState.currentSingerId = turnState.turnOrder[nextIndex] ?? null;

    if (turnState.sungSingerIds.size >= turnState.turnOrder.length) {
      turnState.isFinishing = true;
      this.turnStates.set(roomCode, turnState);
      await this.calculateFinalScores(roomCode);
      this.turnStates.delete(roomCode);
      return;
    }

    this.turnStates.set(roomCode, turnState);
    await this.emitTurnChanged(roomCode);
  }

  clearRoomTurnState(roomCode: string): void {
    this.turnStates.delete(roomCode);
  }

  registerEvents(socket: Socket): void {
    socket.on("perfect:pitch-data", async (data: { roomCode: string; pitchData: PitchData }) => {
      const participantId = this.toParticipantId(socket.data.participantId);
      if (participantId === null) return;

      const turnState = this.turnStates.get(data.roomCode);
      if (turnState && turnState.currentSingerId !== participantId) {
        return;
      }

      const scoreKey = `score:${data.roomCode}:${participantId}`;

      const currentData = await redis.get(scoreKey);
      const scores: PitchData[] = currentData ? JSON.parse(currentData) : [];
      scores.push(data.pitchData);
      await redis.set(scoreKey, JSON.stringify(scores), "EX", 3600);

      const score = this.calculateScore(data.pitchData);

      socket.to(data.roomCode).emit("perfect:participant-score", {
        participantId,
        nickname: socket.data.nickname,
        pitchData: data.pitchData,
        currentScore: score,
      });

      this.io.to(data.roomCode).emit("game:pitchUpdate", {
        participantId,
        pitch: data.pitchData,
        score,
      });
    });

    socket.on("perfect:pass-turn", async (data: { roomCode: string }) => {
      const participantId = this.toParticipantId(socket.data.participantId);
      if (participantId === null) return;

      const turnState = this.turnStates.get(data.roomCode);
      if (!turnState || turnState.currentSingerId !== participantId) return;

      await this.advanceTurnOrFinish(data.roomCode, { markCurrentAsSung: true });
    });

    socket.on("perfect:end-song", async (data: { roomCode: string }) => {
      const participantId = this.toParticipantId(socket.data.participantId);
      if (participantId === null) return;

      const turnState = this.turnStates.get(data.roomCode);
      if (!turnState || turnState.currentSingerId !== participantId) return;

      await this.advanceTurnOrFinish(data.roomCode, { markCurrentAsSung: true });
    });
  }

  async startGame(roomCode: string, songId: string, songData?: Record<string, unknown>, queueItemId?: string): Promise<void> {
    let broadcastSongData = songData;
    if (!broadcastSongData) {
      const song = await songService.getSongById(songId);
      if (!song) return;

      broadcastSongData = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        instrumentalUrl: song.instrumentalUrl,
        duration: song.duration,
        lyrics: song.lyrics,
      };
    }

    await roomService.updateRoomStatus(roomCode, RoomStatus.PLAYING);

    const participants = await this.getParticipants(roomCode);
    for (const p of participants) {
      await redis.del(`score:${roomCode}:${p.id}`);
    }

    this.initializeTurnState(roomCode, participants.map((participant) => participant.id));

    this.io.to(roomCode).emit("game:started", {
      song: broadcastSongData,
      queueItemId,
    });

    await this.emitTurnChanged(roomCode);
  }

  private calculateScore(pitchData: PitchData): number {
    if (pitchData.confidence < 0.5) return 0;

    const baseScore = Math.round(pitchData.confidence * 100);
    return Math.min(100, baseScore);
  }

  private async calculateFinalScores(roomCode: string): Promise<void> {
    const room = await roomService.getRoomByCode(roomCode);
    if (!room) return;

    const results: Array<{ participantId: number; nickname: string; totalScore: number; accuracy: number }> = [];

    for (const participant of room.participants) {
      const scoreKey = `score:${roomCode}:${participant.id}`;
      const data = await redis.get(scoreKey);
      const pitchDataArray: PitchData[] = data ? JSON.parse(data) : [];

      let totalScore = 0;
      let validPitches = 0;

      for (const pd of pitchDataArray) {
        if (pd.confidence > 0.5) {
          totalScore += this.calculateScore(pd);
          validPitches++;
        }
      }

      const accuracy = validPitches > 0 ? totalScore / validPitches : 0;

      await roomService.updateParticipantScore(participant.id, Math.round(accuracy));

      results.push({
        participantId: participant.id,
        nickname: participant.nickname,
        totalScore: Math.round(accuracy),
        accuracy: Math.round(accuracy),
      });
    }

    results.sort((a, b) => b.totalScore - a.totalScore);

    this.io.to(roomCode).emit("game:finished");
    this.io.to(roomCode).emit("game:scoresUpdate", results);

    await roomService.updateRoomStatus(roomCode, RoomStatus.WAITING);
    this.turnStates.delete(roomCode);
  }

  private async getParticipants(roomCode: string): Promise<Array<{ id: number }>> {
    const room = await roomService.getRoomByCode(roomCode);
    return room?.participants || [];
  }
}
