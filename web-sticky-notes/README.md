# Web Sticky Notes

A tiny Chrome extension for placing draggable notes directly on web pages.

## Features

- Click the extension icon, then click anywhere on a page to add a note.
- Notes are saved per page using `chrome.storage.local`.
- Drag notes by the dotted handle.
- Resize notes from the lower-right corner.
- Change note color with the swatches.
- Delete notes with the close button.

## Install locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this `web-sticky-notes` folder.

## Notes

The first version saves notes by `origin + pathname`, so query strings and hash fragments share the same note board for a page.
