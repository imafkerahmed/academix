# PocketBase Docker Setup

This folder contains the configuration to run [PocketBase](https://pocketbase.io/) as a local database using Docker.

## Usage

1. **Build and start PocketBase:**

   ```bash
   cd pocktbase
   docker-compose up --build -d
   ```

   PocketBase will be available at [http://localhost:8090](http://localhost:8090).

2. **Data Persistence:**
   - All PocketBase data is stored in the `pb_data` folder.
   - This ensures your collections, users, and records are NOT lost when the container restarts or is removed.

3. **Stop PocketBase:**

   ```bash
   docker-compose down
   ```

   Data will remain safe in `pb_data`.

4. **Access Admin UI:**
   - Open [http://127.0.0.1:8090/\_/#/login](http://127.0.0.1:8090/_/#/login) in your browser.

## Notes

- If you want to reset all data, delete the `pb_data` folder (this will remove all collections and users).
- You can change the PocketBase version in the `Dockerfile` if needed.
