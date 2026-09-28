# Restaurant Aid — Phase 1 (Local App)

An order and booking platform for a local restaurant. FastAPI backend, React/Vite frontend.

## Open it in VS Code

1. Download and unzip `restaurant-aid-app.zip` anywhere on your computer.
2. Open VS Code.
3. File > Open Folder... > select the unzipped `order-platform` folder.
4. VS Code will show `app/backend` and `app/frontend` in the sidebar.
5. Install these VS Code extensions if you don't have them (search in the Extensions tab, Ctrl+Shift+X):
   - Python (by Microsoft)
   - ES7+ React/Redux/JS snippets (optional, nice to have)
6. Open a terminal in VS Code: Terminal > New Terminal (or Ctrl+`).

You'll run the backend and frontend in two separate terminals, side by side.

## Backend (FastAPI)

In a VS Code terminal:

```bash
cd app/backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Leave this terminal running. Check it worked: open http://localhost:8000/health in your browser — you should see `{"status":"ok"}`.

Run the automated tests any time:
```bash
pip install pytest httpx
pytest test_main.py -v
```

## Frontend (React + Vite)

Open a SECOND terminal in VS Code (click the `+` in the terminal panel):

```bash
cd app/frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Using the app

1. Register — the FIRST account created automatically becomes admin.
2. As admin: add a few menu items.
3. Log out, register a second (customer) account.
4. As customer: place an order, watch it show under "Your orders".
5. Log back in as admin: change the order's status, e.g. to "ready".

## Notes

- Backend uses SQLite (`orders.db`, a local file) — no database install needed for Phase 1.
- Never commit a real `.env` file — `.env.example` is just a template.
- `VITE_API_URL` env var controls what backend URL the frontend calls (defaults to `http://localhost:8000`).
- If VS Code's Python extension asks you to select an interpreter, pick the one inside `app/backend/venv`.
