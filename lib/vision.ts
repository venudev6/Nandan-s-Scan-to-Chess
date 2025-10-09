/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BoardFeatures } from './types';

declare global {
  interface Window {
    cv: any;
    cvReady: Promise<void>;
  }
}

/**
 * Detects the chessboard boundary by finding the largest quadrilateral contour.
 */
export const detectBoardFeaturesCV = async (imageFile: File): Promise<BoardFeatures> => {
  const mats: any[] = []; // Array to track all created Mats for easy cleanup.
  
  try {
    await window.cvReady;
    const cv = window.cv;

    const image = new Image();
    const objectUrl = URL.createObjectURL(imageFile);
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
    });
    URL.revokeObjectURL(objectUrl);

    const src = cv.imread(image);
    mats.push(src);

    const gray = new cv.Mat();
    mats.push(gray);
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    const blurred = new cv.Mat();
    mats.push(blurred);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    const canny = new cv.Mat();
    mats.push(canny);
    cv.Canny(blurred, canny, 75, 200);

    const contours = new cv.MatVector();
    mats.push(contours);
    const hierarchy = new cv.Mat();
    mats.push(hierarchy);
    cv.findContours(canny, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let largestArea = 0;
    let boardContour: any = null;

    for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
      
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

        if (approx.rows === 4) {
            const area = cv.contourArea(approx);
            // Ensure the contour is reasonably large
            if (area > (src.cols * src.rows * 0.1) && area > largestArea) {
                largestArea = area;
                if (boardContour) boardContour.delete(); // delete previous largest
                boardContour = approx.clone();
            }
        }
        cnt.delete();
        approx.delete();
    }
    
    if (boardContour) {
        mats.push(boardContour);
    }


    if (!boardContour) {
      throw new Error("Could not find a quadrilateral contour. Please ensure the board's outer edges are clearly visible.");
    }
    
    // Convert Mat to an array of points
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < boardContour.data32S.length; i += 2) {
      points.push({ x: boardContour.data32S[i], y: boardContour.data32S[i + 1] });
    }

    if (points.length !== 4) {
        throw new Error("Contour is not a quadrilateral.");
    }

    // Order points using the sum/difference heuristic, which is robust to rotation and perspective.
    // tl has smallest sum(x+y), br has largest sum.
    // tr has smallest diff(y-x), bl has largest diff.
    const sums = points.map(p => p.x + p.y);
    const diffs = points.map(p => p.y - p.x);

    const tlPoint = points[sums.indexOf(Math.min(...sums))];
    const brPoint = points[sums.indexOf(Math.max(...sums))];
    const trPoint = points[diffs.indexOf(Math.min(...diffs))];
    const blPoint = points[diffs.indexOf(Math.max(...diffs))];


    const corners: BoardFeatures['corners'] = {
        top_left: [tlPoint.x, tlPoint.y],
        top_right: [trPoint.x, trPoint.y],
        bottom_right: [brPoint.x, brPoint.y],
        bottom_left: [blPoint.x, blPoint.y],
    };

    return {
      auto_detect: true,
      corners,
      boundary_confidence: 0.95,
      active_turn: 'w',
      turn_confidence: 0,
      homography: [],
      labels: [],
      reference_map: null,
      reference_confidence: 0,
      notes: 'Client-side detection via OpenCV.js (Contour finding)',
    };
  } catch (e) {
    console.error('Client-side board detection failed:', e);
    return {
      auto_detect: false,
      corners: { top_left: [0, 0], top_right: [0, 0], bottom_right: [0, 0], bottom_left: [0, 0] },
      boundary_confidence: 0,
      active_turn: 'w',
      turn_confidence: 0,
      homography: [],
      labels: [],
      reference_map: null,
      reference_confidence: 0,
      notes: `Client-side detection failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  } finally {
    mats.forEach(mat => {
        if (mat && !mat.isDeleted()) {
            mat.delete();
        }
    });
  }
};