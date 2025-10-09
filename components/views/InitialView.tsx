/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { UploadIcon, CameraIcon, PdfIcon, TargetIcon, AdviceIcon, TrashIcon, HistoryIcon, CloudIcon, CloudCheckIcon, CloudErrorIcon } from '../ui/Icons';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import './InitialView.css';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../ui/Logo';
import UserMenu from '../ui/UserMenu';
import { useAppSettings } from '../../hooks/useAppSettings';
import type { StoredPdf } from '../../lib/types';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { authService } from '../../lib/authService';

type AppSettingsHook = ReturnType<typeof useAppSettings>;

// A sample chess position in Forsyth-Edwards Notation (FEN) to demonstrate the app's functionality.
const SAMPLE_FEN = 'r1b1kbnr/pp3ppp/2n5/1Bpp4/3P4/5N2/PPP2PPP/RNBQK2R w KQkq - 0 7';

// A pre-generated base64 encoded SVG thumbnail for the sample FEN.
const SAMPLE_IMAGE_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIyNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNTAiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9Ijc1IiB5PSIwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIxMDAiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjEyNSIgeT0iMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTUwIiB5PSIwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIxNzUiIHk9IjAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjAiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIyNSIgeT0iMjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjUwIiB5PSIyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNzUiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIxMDAiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIxMjUiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIxNTAiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIxNzUiIHk9IjI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIwIiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMjUiIHk9IjUwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9Ijc1IiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTAwIiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTI1IiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTUwIiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTc1IiB5PSI1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMCIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjI1IiB5PSI3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iNTAiIHk9Ijc1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSI3NSIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjEwMCIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjEyNSIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjE1MCIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjE3NSIgeT0iNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjAiIHk9IjEwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMjUiIHk9IjEwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNTAiIHk9IjEwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iNzUiIHk9IjEwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTAwIiB5PSIxMDAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjEyNSIgeT0iMTAwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIxNTAiIHk9IjEwMCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTc1IiB5PSIxMDAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjAiIHk9IjEyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMjUiIHk9IjEyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iNTAiIHk9IjEyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNzUiIHk9IjEyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTAwIiB5PSIxMjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjEyNSIgeT0iMTI1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIxNTAiIHk9IjEyNSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTc1IiB5PSIxMjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjAiIHk9IjE1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMjUiIHk9IjE1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNTAiIHk9IjE1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iNzUiIHk9IjE1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTAwIiB5PSIxNTAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjxyZWN0IHg9IjEyNSIgeT0iMTUwIiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNmMGQ5YjUiLz48cmVjdCB4PSIxNTAiIHk9IjE1MCIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTc1IiB5PSIxNTAiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjAiIHk9IjE3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMjUiIHk9IjE3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iNTAiIHk9IjE3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iNzUiIHk9IjE3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjYjU4ODYzIi8+PHJlY3QgeD0iMTAwIiB5PSIxNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2YwZDliNSIvPjxyZWN0IHg9IjEyNSIgeT0iMTc1IiB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNiNTg4NjMiLz48cmVjdCB4PSIxNTAiIHk9IjE3NSIgd2lkdGg9IjI1IiBoZWlnaHQ9IjI1IiBmaWxsPSIjZjBkOWI1Ii8+PHJlY3QgeD0iMTc1IiB5PSIxNzUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI2I1ODg2MyIvPjx0ZXh0IHg9IjEyLjUiIHk9IjE4LjUiIGZvbnQtc2l6ZT0iMjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgc3R5bGU9InBhaW50LW9yZGVyOiBzdHJva2U7Ij7imqQ8L3RleHQ+PHRleHQgeD0iMzcuNSIgeT0iMTguNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKarzwvdGV4dD48dGV4dCB4PSI4Ny41IiB5PSIxOC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqpPC90ZXh0Pjx0ZXh0IHg9IjExMi41IiB5PSIxOC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqrPC90ZXh0Pjx0ZXh0IHg9IjE2Mi41IiB5PSIxOC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqtPC90ZXh0Pjx0ZXh0IHg9IjE4Ny41IiB5PSIxOC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqcPC90ZXh0Pjx0ZXh0IHg9IjEyLjUiIHk9IjQzLjUiIGZvbnQtc2l6ZT0iMjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgc3R5bGU9InBhaW50LW9yZGVyOiBzdHJva2U7Ij7imq88L3RleHQ+PHRleHQgeD0iMzcuNSIgeT0iNDMuNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiMwMDAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKarzwvdGV4dD48dGV4dCB4PSI4Ny41IiB5PSI0My41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pivPC90ZXh0Pjx0ZXh0IHg9IjE4Ny41IiB5PSI0My41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqvPC90ZXh0Pjx0ZXh0IHg9IjYyLjUiIHk9IjY4LjUiIGZvbnQtc2l6ZT0iMjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgc3R5bGU9InBhaW50LW9yZGVyOiBzdHJva2U7Ij7imq08L3RleHQ+PHRleHQgeD0iMzcuNSIgeT0iOTMuNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYsjwvdGV4dD48dGV4dCB4PSI4Ny41IiB5PSI5My41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzAwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pqvPC90ZXh0Pjx0ZXh0IHg9IjEzNy41IiB5PSIxMTguNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYrzwvdGV4dD48dGV4dCB4PSIxNjIuNSIgeT0iMTQzLjUiIGZvbnQtc2l6ZT0iMjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjMDAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIgc3R5bGU9InBhaW50LW9yZGVyOiBzdHJva2U7Ij7imq88L3RleHQ+PHRleHQgeD0iMTg3LjUiIHk9IjE0My41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pivPC90ZXh0Pjx0ZXh0IHg9IjEyLjUiIHk9IjE2OC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pivPC90ZXh0Pjx0ZXh0IHg9IjM3LjUiIHk9IjE2OC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pivPC90ZXh0Pjx0ZXh0IHg9IjYyLjUiIHk9IjE2OC41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pivPC90ZXh0Pjx0ZXh0IHg9IjE4Ny41IiB5PSIxNjguNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYrjwvdGV4dD48dGV4dCB4PSIxMi41IiB5PSIxOTMuNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYrjwvdGV4dD48dGV4dCB4PSIzNy41IiB5PSIxOTMuNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYqzwvdGV4dD48dGV4dCB4PSI2Mi41IiB5PSIxOTMuNSIgZm9udC1zaXplPSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHlsZT0icGFpbnQtb3JkZXI6IHN0cm9rZTsiPuKYrjwvdGV4dD48dGV4dCB4PSIxMTIuNSIgeT0iMTkzLjUiIGZvbnQtc2l6ZT0iMjIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiBmaWxsPSIjZmZmIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3R5bGU9InBhaW50LW9yZGVyOiBzdHJva2U7Ij7imKQ8L3RleHQ+PHRleHQgeD0iMTg3LjUiIHk9IjE5My41IiBmb250LXNpemU9IjIyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0eWxlPSJwYWludC1vcmRlcjogc3Ryb2tlOyI+4pitPC90ZXh0Pjwvc3ZnPg==';

const DriveStatusIcon = ({ status, onRetry, disabled }: { status: StoredPdf['syncStatus'], onRetry: (e: React.MouseEvent) => void, disabled: boolean }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (!disabled) {
            onRetry(e);
        }
    };
    
    const isClickable = !disabled && (status === 'local' || status === 'error');
    
    switch (status) {
        case 'syncing':
            return <div className="drive-status-icon syncing"><div className="spinner-small"></div></div>;
        case 'synced':
            return <div className="drive-status-icon synced"><CloudCheckIcon /></div>;
        case 'error':
            return <div className={`drive-status-icon error ${!isClickable ? 'disabled' : ''}`} onClick={handleClick}><CloudErrorIcon /></div>;
        case 'local':
        default:
            return <div className={`drive-status-icon local ${!isClickable ? 'disabled' : ''}`} onClick={handleClick}><CloudIcon /></div>;
    }
};

const getTooltipTextForStatus = (status: StoredPdf['syncStatus'], isGoogleUser: boolean) => {
    if (!isGoogleUser) {
        return "Log in with Google to enable Drive sync.";
    }
    switch (status) {
        case 'syncing': return "Syncing to Google Drive...";
        case 'synced': return "Synced to 'AAA Chess to Scan' folder in your Google Drive.";
        case 'error': return "Sync failed. Click to retry.";
        case 'local':
        default: return "Click to sync to Google Drive.";
    }
};


interface InitialViewProps {
    onFileSelect: (file: File) => void;
    onPdfSelect: (file: File) => void;
    onCameraSelect: () => void;
    onFenLoad: (fen: string, imageUrl: string) => void;
    onStoredPdfSelect: (id: number) => void;
    onDeletePdf: (id: number) => void;
    onSyncRetry: (id: number) => void;
    onSavedGamesClick: () => void;
    onHistoryClick: () => void;
    onProfileClick: () => void;
    storedPdfs: StoredPdf[];
    isProcessingPdf: boolean;
    onAuthRequired: () => void;
    appSettings: AppSettingsHook;
    onAdminPanelClick: () => void;
    isCameraAvailable: boolean;
    triggerUpload: boolean;
    onUploadTriggered: () => void;
}

export const InitialView = ({
    onFileSelect, onPdfSelect, onCameraSelect, onFenLoad, onSavedGamesClick, onHistoryClick, onProfileClick, storedPdfs,
    isProcessingPdf, onAuthRequired, appSettings, onAdminPanelClick, onStoredPdfSelect, onDeletePdf, onSyncRetry,
    isCameraAvailable, triggerUpload, onUploadTriggered
}: InitialViewProps) => {
    const { user, isLoggedIn, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [pdfToDelete, setPdfToDelete] = useState<StoredPdf | null>(null);
    const [isUserGoogle, setIsUserGoogle] = useState(false);
    const version = "1.3.0";
    const build = "20240923.1";

    useEffect(() => {
        if (user) {
            authService.isGoogleUser(user).then(setIsUserGoogle);
        } else {
            setIsUserGoogle(false);
        }
    }, [user]);

    useEffect(() => {
        if (triggerUpload) {
            fileInputRef.current?.click();
            onUploadTriggered(); // Reset the trigger
        }
    }, [triggerUpload, onUploadTriggered, fileInputRef]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, handler: (file: File) => void) => {
        if (e.target.files && e.target.files[0]) {
            handler(e.target.files[0]);
        }
    };

    const { isDragging, ...dragHandlers } = useDragAndDrop({
        onDrop: onFileSelect,
    });
    
    const handleDeletePdfClick = (e: React.MouseEvent, pdf: StoredPdf) => {
        e.stopPropagation(); // Prevent the li's onClick from firing
        setPdfToDelete(pdf);
    };

    const confirmDeletePdf = () => {
        if (pdfToDelete) {
            onDeletePdf(pdfToDelete.id);
            setPdfToDelete(null);
        }
    };
    
    const handleRetryClick = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        onSyncRetry(id);
    };

    return (
        <div className="card initial-view-card" {...dragHandlers}>
            <header className="initial-view-header">
                 {isLoggedIn ? (
                    <UserMenu user={user!} onLogout={logout} onAdminPanelClick={onAdminPanelClick} onSavedGamesClick={onSavedGamesClick} onHistoryClick={onHistoryClick} onProfileClick={onProfileClick} appSettings={appSettings} />
                 ) : (
                    <button className="btn btn-secondary" onClick={onAuthRequired}>Login / Sign Up</button>
                 )}
            </header>

            <div className="logo-container">
                <Logo />
            </div>
            
            <h1 className="main-title">Nandan's - Scan to Play Chess</h1>
            <p className="subtitle">Bring every chess position to life.</p>
            
            <ul className="feature-list">
                <li><CameraIcon /><span>Scan from a book, PDF, photo, or clipboard.</span></li>
                <li><TargetIcon /><span>Instant setup on the board.</span></li>
                <li><AdviceIcon /><span>Analyze, solve, and train with AI guidance.</span></li>
            </ul>

            <div className="button-group">
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} title="Upload an image of a chessboard from your device">
                    <UploadIcon /> Upload Image
                </button>
                <button className="btn btn-primary" onClick={() => pdfInputRef.current?.click()} disabled={isProcessingPdf} title="Upload a PDF with chess diagrams from your device">
                    {isProcessingPdf ? <div className="spinner-small"></div> : <PdfIcon />}
                    {isProcessingPdf ? 'Processing...' : 'Upload PDF'}
                </button>
                <button 
                    className="btn btn-primary" 
                    onClick={onCameraSelect} 
                    disabled={!isCameraAvailable}
                    title={isCameraAvailable ? "Use your device's camera to scan a board" : "No camera detected on this device"}
                >
                    <CameraIcon /> Use Camera
                </button>
            </div>

            {!isCameraAvailable && (
                <p className="camera-unavailable-message">
                    Camera support is not available on this device.
                </p>
            )}
            
            <p className="sample-link-container">
                Or, <a href="#" onClick={(e) => { e.preventDefault(); onFenLoad(SAMPLE_FEN, SAMPLE_IMAGE_DATA_URL); }}>try a sample position</a>, or paste an image (Ctrl+V).
            </p>

            <div className="stored-files-section">
                <h2>Recent PDFs</h2>
                {storedPdfs.length > 0 ? (
                    <ul className="stored-files-list">
                        {storedPdfs.map(pdf => (
                            <li key={pdf.id} onClick={() => onStoredPdfSelect(pdf.id)} title={`Open ${pdf.name}`}>
                                <div className="pdf-thumbnail-preview">
                                    {pdf.thumbnail ? (
                                        <img src={pdf.thumbnail} alt={`Thumbnail for ${pdf.name}`} />
                                    ) : (
                                        <div className="pdf-thumbnail-placeholder-icon"><PdfIcon /></div>
                                    )}
                                </div>
                                <div className="pdf-info">
                                    {isLoggedIn && user && (
                                        <div className="tooltip-container">
                                            <DriveStatusIcon status={pdf.syncStatus} onRetry={(e) => handleRetryClick(e, pdf.id)} disabled={!isUserGoogle} />
                                            <span className="tooltip-text">{getTooltipTextForStatus(pdf.syncStatus, isUserGoogle)}</span>
                                        </div>
                                    )}
                                    <span>{pdf.name}</span>
                                    <div className="tooltip-container">
                                        <button 
                                            onClick={(e) => handleDeletePdfClick(e, pdf)} 
                                            aria-label={`Delete ${pdf.name}`}>
                                            <TrashIcon />
                                        </button>
                                        <span className="tooltip-text">Delete PDF</span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="empty-state">
                       <PdfIcon />
                       <p>Your uploaded PDFs will appear here.</p>
                       <span>Upload a PDF to get started!</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, onFileSelect)}
                accept="image/*"
                style={{ display: 'none' }}
            />
             <input
                type="file"
                ref={pdfInputRef}
                onChange={(e) => handleFileChange(e, onPdfSelect)}
                accept=".pdf"
                style={{ display: 'none' }}
            />
            {isDragging && <div className="drag-overlay"></div>}
            
            <ConfirmationDialog
                isOpen={!!pdfToDelete}
                title="Delete PDF"
                message={`Are you sure you want to permanently delete "${pdfToDelete?.name}"? This action cannot be undone.`}
                onConfirm={confirmDeletePdf}
                onClose={() => setPdfToDelete(null)}
            />

            <footer className="initial-view-footer">
                Version {version} (Build {build})
            </footer>
        </div>
    );
};