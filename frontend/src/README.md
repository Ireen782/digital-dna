# Digital DNA — Frontend Prototype

A React + Vite frontend for the Digital DNA hackathon concept.

## Run it

1. Install Node.js (LTS) if it is not already installed.
2. Extract this ZIP and open the `digital-dna-frontend` folder in VS Code.
3. Open the VS Code terminal in that folder and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local address Vite prints (normally `http://localhost:5173`).

To create a production build:

```bash
npm run build
```

## Included frontend features

- Responsive Digital DNA landing page and upload workspace.
- PDF and image file selection, drag-and-drop, and file-size/type validation.
- Browser-side SHA-256 fingerprint generation.
- Simulated analysis progress and explainable sample report.
- Print/save report using the browser print dialog.
- Clear notice that the prototype report is illustrative.

## Important integration note

This is the **frontend only**. The current analysis is a demo simulation; it does not run real OCR, ELA, metadata forensics, AI-generation detection, or university verification. The project brief describes those as backend/integration capabilities. The frontend is structured so a real FastAPI backend can later replace the demo logic in `src/App.jsx`.

For the demo, filenames containing `edited` show a "Potentially Manipulated" illustrative result; filenames containing `unknown` show "Unverified"; other supported files show "Likely Authentic". These are demo paths only and must not be presented as real detection.
