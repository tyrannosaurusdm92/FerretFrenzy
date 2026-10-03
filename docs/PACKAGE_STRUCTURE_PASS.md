# Final package structure

The ZIP root intentionally contains only these folders: `css`, `js`, `json`, `docs`, and `assets`, plus operational root files `lobby.html`, `manifest.webmanifest`, and `service-worker.js`.

Only `assets` contains subfolders: `assets/images`, `assets/audio`, and `assets/code`. `assets/code` contains only `frenzy.html`. Role-card images were moved from the old nested `assets/images/cards` directory directly into `assets/images`, and the runtime paths were updated. All prior nested documentation and QA files were preserved as flat files in `docs` with their former path encoded in the filename.
