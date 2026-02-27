/**
 * Face Detection Service for Proctor System
 * Uses face-api.js (TensorFlow.js-based) to detect faces, head pose, and eye gaze
 * GDPR-compliant: Only stores metadata, not actual face images
 */

import * as faceapi from 'face-api.js';

export interface FaceDetectionResult {
  faceCount: number;
  confidence: number; // 0.0 - 1.0
  headPose: {
    yaw: number; // -90 to 90 degrees (left-right)
    pitch: number; // -90 to 90 degrees (up-down)
    roll: number; // -45 to 45 degrees (tilt)
  };
  eyeGaze: 'straight_ahead' | 'away_from_screen' | 'left' | 'right' | 'down' | 'unknown';
  faceVisible: boolean;
  anomalies: string[]; // e.g., ['multiple_faces', 'head_turned_away']
  timestamp: number;
}

export interface FaceDetectionConfig {
  modelPath?: string;
  detectionInterval?: number; // ms between detections (default 1000)
  requiredConfidenceThreshold?: number; // 0.0-1.0, default 0.5
  anomalyFlags?: {
    allowMultipleFaces?: boolean;
    headTurnThreshold?: number; // degrees, default 45
    gazeAwayThreshold?: number; // ms of gaze away before flag, default 3000
  };
}

class FaceDetectionService {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;
  private isRunning = false;
  private detectionInterval: number = 1000;
  private detectionLoop: number | null = null;
  private config: Required<FaceDetectionConfig>;
  private onDetectionCallback: ((result: FaceDetectionResult) => void) | null = null;
  private lastGazeAwayTime = 0;
  private consecutiveFramesAwayFromScreen = 0;

  constructor(config: FaceDetectionConfig = {}) {
    this.config = {
      modelPath: config.modelPath || 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/',
      detectionInterval: config.detectionInterval || 1000,
      requiredConfidenceThreshold: config.requiredConfidenceThreshold || 0.5,
      anomalyFlags: {
        allowMultipleFaces: config.anomalyFlags?.allowMultipleFaces ?? false,
        headTurnThreshold: config.anomalyFlags?.headTurnThreshold ?? 45,
        gazeAwayThreshold: config.anomalyFlags?.gazeAwayThreshold ?? 3000,
      },
    };
  }

  /**
   * Initialize face detection models (one-time setup)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing face detection models...');

      // Load face-api models from CDN
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.config.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.config.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.config.modelPath),
        faceapi.nets.faceExpressionNet.loadFromUri(this.config.modelPath),
      ]);

      this.isInitialized = true;
      console.log('Face detection models loaded successfully');
    } catch (error) {
      console.error('Failed to initialize face detection models:', error);
      throw new Error('Face detection initialization failed');
    }
  }

  /**
   * Start face detection with video stream
   */
  async startDetection(
    videoElement: HTMLVideoElement,
    onDetection: (result: FaceDetectionResult) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Face detection not initialized. Call initialize() first.');
    }

    this.video = videoElement;
    this.onDetectionCallback = onDetection;

    // Create canvas for face detection analysis
    this.canvas = document.createElement('canvas');
    if (this.video.width && this.video.height) {
      this.canvas.width = this.video.width;
      this.canvas.height = this.video.height;
    }

    this.isRunning = true;

    // Start detection loop
    this.detectionLoop = window.setInterval(() => {
      this.detectFace().catch((err) => {
        console.error('Face detection error:', err);
      });
    }, this.config.detectionInterval);

    console.log('Face detection started');
  }

  /**
   * Stop face detection
   */
  stopDetection(): void {
    this.isRunning = false;

    if (this.detectionLoop !== null) {
      clearInterval(this.detectionLoop);
      this.detectionLoop = null;
    }

    this.video = null;
    this.canvas = null;
    this.onDetectionCallback = null;

    console.log('Face detection stopped');
  }

  /**
   * Perform single face detection frame
   */
  private async detectFace(): Promise<void> {
    if (!this.video || !this.canvas || !this.isRunning) return;

    try {
      const ctx = this.canvas.getContext('2d');
      if (!ctx) return;

      // Draw video frame to canvas
      ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Detect faces with landmarks
      const detections = await faceapi
        .detectAllFaces(this.canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const result = this.processFaceDetections(detections);
      this.onDetectionCallback?.(result);
    } catch (error) {
      console.error('Face detection frame error:', error);
    }
  }

  /**
   * Process detected faces and extract relevant metrics
   */
  private processFaceDetections(detections: any[]): FaceDetectionResult {
    const timestamp = Date.now();
    const anomalies: string[] = [];

    // Face count check
    if (detections.length === 0) {
      return {
        faceCount: 0,
        confidence: 0,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        eyeGaze: 'unknown',
        faceVisible: false,
        anomalies: ['no_face_detected'],
        timestamp,
      };
    }

    // Check for multiple faces (anomaly)
    if (detections.length > 1 && !this.config.anomalyFlags.allowMultipleFaces) {
      anomalies.push('multiple_faces');
    }

    // Use first detected face
    const face = detections[0];
    const confidence = this.calculateConfidence(face);

    // Calculate head pose (yaw, pitch, roll)
    const headPose = this.calculateHeadPose(face.landmarks);

    // Check for excessive head turning
    if (Math.abs(headPose.yaw) > this.config.anomalyFlags.headTurnThreshold) {
      anomalies.push('head_turned_away');
    }

    // Estimate eye gaze direction
    const eyeGaze = this.estimateEyeGaze(face.landmarks, headPose);

    // Track gaze away from screen
    if (eyeGaze !== 'straight_ahead') {
      this.consecutiveFramesAwayFromScreen++;

      const msAwayFromScreen =
        this.consecutiveFramesAwayFromScreen * this.config.detectionInterval;
      if (msAwayFromScreen > this.config.anomalyFlags.gazeAwayThreshold) {
        anomalies.push('gaze_aversion');
        this.lastGazeAwayTime = timestamp;
      }
    } else {
      this.consecutiveFramesAwayFromScreen = 0;
    }

    return {
      faceCount: detections.length,
      confidence,
      headPose,
      eyeGaze,
      faceVisible: true,
      anomalies,
      timestamp,
    };
  }

  /**
   * Calculate confidence from detection score
   */
  private calculateConfidence(face: any): number {
    // Use detection score normalized to 0-1
    const detectionScore = face.detection.score;
    return Math.min(1, Math.max(0, detectionScore));
  }

  /**
   * Calculate head pose using landmark positions
   * Uses eye and nose positions to estimate yaw, pitch, roll
   */
  private calculateHeadPose(landmarks: any): {
    yaw: number;
    pitch: number;
    roll: number;
  } {
    // Key landmark indices
    const leftEye = landmarks.getLeftEye(); // indices 36-41
    const rightEye = landmarks.getRightEye(); // indices 42-47
    const nose = landmarks.getNose(); // indices 27-35
    const mouth = landmarks.getMouth(); // indices 48-68

    // Calculate center positions
    const leftEyeCenter = this.getPointCenter(leftEye);
    const rightEyeCenter = this.getPointCenter(rightEye);
    const noseCenter = this.getPointCenter(nose);
    const mouthCenter = this.getPointCenter(mouth);

    // Calculate yaw (left-right head rotation)
    const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const noseCenterX = noseCenter.x;
    const yaw = this.mapToDegreesX(noseCenterX - eyeCenterX, 30); // ±30 degrees max

    // Calculate pitch (up-down head tilt)
    const noseY = noseCenter.y;
    const mouthY = mouthCenter.y;
    const pitch = this.mapToDegreesY(mouthY - noseY, 30); // ±30 degrees

    // Calculate roll (head tilt)
    const eyeAngle = Math.atan2(rightEyeCenter.y - leftEyeCenter.y, rightEyeCenter.x - leftEyeCenter.x);
    const roll = (eyeAngle * 180) / Math.PI; // Convert radians to degrees

    return {
      yaw: Math.round(yaw),
      pitch: Math.round(pitch),
      roll: Math.round(roll),
    };
  }

  /**
   * Estimate eye gaze direction from eye landmarks
   */
  private estimateEyeGaze(
    landmarks: any,
    headPose: { yaw: number; pitch: number; roll: number }
  ): 'straight_ahead' | 'away_from_screen' | 'left' | 'right' | 'down' | 'unknown' {
    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      if (leftEye.length < 6 || rightEye.length < 6) {
        return 'unknown';
      }

      // Get iris/pupil position (estimate from eye center)
      const leftEyeCenter = this.getPointCenter(leftEye);
      const rightEyeCenter = this.getPointCenter(rightEye);

      // Get eye bounds
      const leftEyeTop = Math.min(...leftEye.map((p) => p.y));
      const leftEyeBottom = Math.max(...leftEye.map((p) => p.y));
      const leftEyeLeft = Math.min(...leftEye.map((p) => p.x));
      const leftEyeRight = Math.max(...leftEye.map((p) => p.x));

      // Estimate pupil vertical position ratio (0-1 in eye bounds)
      const pupilYRatio =
        (leftEyeCenter.y - leftEyeTop) / (leftEyeBottom - leftEyeTop);
      const pupilXRatio =
        (leftEyeCenter.x - leftEyeLeft) / (leftEyeRight - leftEyeLeft);

      // Thresholds for gaze direction
      const horizontalThreshold = 0.35; // 35% to either side
      const verticalThreshold = 0.3; // 30% down

      // Determine gaze direction
      if (pupilYRatio > 1 - verticalThreshold) {
        return 'down';
      }

      if (pupilXRatio < horizontalThreshold) {
        return 'left';
      }

      if (pupilXRatio > 1 - horizontalThreshold) {
        return 'right';
      }

      // If head is turned significantly, might be looking away
      if (Math.abs(headPose.yaw) > 30 || Math.abs(headPose.pitch) > 30) {
        return 'away_from_screen';
      }

      return 'straight_ahead';
    } catch (error) {
      console.error('Error estimating eye gaze:', error);
      return 'unknown';
    }
  }

  /**
   * Helper: Get center point of landmark array
   */
  private getPointCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }

    const sum = points.reduce(
      (acc, p) => ({
        x: acc.x + p.x,
        y: acc.y + p.y,
      }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  /**
   * Helper: Map distance to degrees (X axis)
   */
  private mapToDegreesX(distance: number, maxDegrees: number): number {
    // Normalize to typical face detection canvas width
    const maxDistance = 50; // pixels
    return (distance / maxDistance) * maxDegrees;
  }

  /**
   * Helper: Map distance to degrees (Y axis)
   */
  private mapToDegreesY(distance: number, maxDegrees: number): number {
    // Normalize to typical face detection canvas height
    const maxDistance = 50; // pixels
    return (distance / maxDistance) * maxDegrees;
  }

  /**
   * Get current status
   */
  getStatus(): {
    initialized: boolean;
    running: boolean;
    modelPath: string;
  } {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      modelPath: this.config.modelPath,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopDetection();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;
