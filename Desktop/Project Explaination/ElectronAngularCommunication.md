# Electron-Angular Communication Architecture

This document explains the architecture and flow of communication between the Angular frontend and the Electron backend in this project. It details the roles and interactions of `main.js`, `preload.js`, and `electron.service.ts`, and describes how all privileged operations, events, and data are securely and efficiently passed between the renderer (Angular) and the main process (Electron).

---

## Overview

The communication stack is designed for security, modularity, and robust feature support. It consists of three main layers:

1. **main.js (Electron Main Process)**
2. **preload.js (Context Bridge)**
3. **electron.service.ts (Angular Service Layer)**

---

## 1. main.js (Electron Main Process)
- Acts as the backend for all system-level operations: window management, file downloads, network communication, display detection, and inter-window messaging.
- Registers IPC (inter-process communication) handlers and listeners using `ipcMain.handle` and `ipcMain.on` for all supported actions (e.g., file download, get displays, sync video actions, campaign updates, location updates).
- Manages the lifecycle of the main and external windows, including their creation, destruction, and communication.
- Handles requests from the renderer (Angular) via IPC, performs the requested operation, and returns results or emits events.
- Ensures that all privileged operations (filesystem, network, OS APIs) are only accessible via explicit IPC calls.

---

## 2. preload.js (Context Bridge)
- Runs in the isolated context between the Electron main process and the Angular renderer.
- Uses `contextBridge.exposeInMainWorld` to safely expose a curated API (`electronAPI`) to the Angular app.
- Each method in `electronAPI` wraps an IPC call (invoke or send) to the main process, returning a Promise or setting up an event listener as appropriate.
- Exposes all supported features: file download, window management, display selection, campaign sync, external display actions, location and download progress events, etc.
- Ensures that the Angular app cannot access Node.js or Electron internals directly, maintaining security boundaries.

---

## 3. electron.service.ts (Angular Service Layer)
- Provides a TypeScript/Angular-friendly API for the rest of the app.
- Detects if running in Electron and, if so, calls the exposed `electronAPI` methods.
- Wraps event-based APIs (like download progress, location updates) in RxJS Observables for Angular idiomatic usage.
- Handles all Electron-related features: file downloads, campaign management, window and display control, external display sync, etc.
- Provides error handling, logging, and fallback logic for non-Electron environments.
- Ensures all Electron interactions are promise-based or observable-based, making them easy to use in Angular components and services.

---

## Communication Flow Example

**File Download:**
1. Angular calls `ElectronService.downloadFile()` (returns a Promise).
2. This calls `window.electronAPI.downloadFile()` (from preload.js), which invokes the IPC handler in main.js.
3. main.js performs the download, emits progress events, and returns the result.
4. Progress events are sent via IPC and received in Angular as Observables.

**Real-Time Events:**
- For events like location updates, download progress, or sync actions, the main process emits events via IPC, which are bridged to Angular via event listeners in preload.js and exposed as Observables in electron.service.ts.

**Window and Display Management:**
- The Angular app calls ElectronService methods, which in turn call the appropriate IPC handlers via the bridge for actions like creating or closing windows, selecting displays, or synchronizing external display playback.

---

## Security and Structure
- **Context isolation is enforced:** Angular cannot access Node.js or Electron internals directly.
- **Only explicitly exposed APIs in preload.js are available to Angular, reducing attack surface.**
- **All privileged operations are performed in the main process, never in the renderer.**
- **The bridge (preload.js) is the only communication channel, and is tightly controlled.**

---

## Supported Features via IPC
- File download and progress tracking
- Window management (main and external)
- Display detection and thumbnail capture
- Campaign data fetch and update
- Location updates from Traccar client
- External display synchronization (media load, play, pause, clear, etc.)
- Logging and error reporting

---

## Summary

This architecture ensures a secure, robust, and maintainable communication stack between Angular and Electron. All system-level and privileged operations are handled in the main process, with a tightly controlled bridge (preload.js) exposing only the necessary APIs to the Angular app. All communication is promise-based or observable-based, making it easy to use in Angular services and components, and ensuring real-time, reliable operation for all core features of the desktop application. 