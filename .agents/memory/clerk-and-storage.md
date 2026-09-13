---
name: Clerk and storage integration
description: Replit-specific authentication and upload constraints for this product.
---

Clerk must be initialized with the host-aware publishable-key helper and the optional proxy URL so sign-in works through the Replit preview proxy. Uploaded profile photos use a two-step flow: obtain an App Storage upload URL, upload the bytes, then persist validated metadata through the API.

**Why:** The preview host and object storage are managed by Replit, so treating either as a direct local service breaks authenticated previews or leaves orphaned uploads.

**How to apply:** Keep auth identity server-derived from Clerk sessions and keep object paths out of public responses unless the server has applied the profile visibility rules.