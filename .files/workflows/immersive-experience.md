---
description: Implementation plan for Immersive Experience features (360° Virtual Tours & Virtual Staging)
---

# Immersive Experience Implementation Plan

This workflow outlines the steps to upgrade UrbanSetu with cutting-edge PropTech features: **360° Virtual Tours** and **Virtual Staging**.

## Phase 1: 360° Image Viewer (Virtual Tours)

This phase focuses on enabling users to upload and view equirectangular 360° images.

### 1.1 Backend Updates
- [ ] **Update Listing Model**: Add `virtualTourImages` field to `api/models/listing.model.js`.
- [ ] **Update Controllers**: Ensure `createListing` and `updateListing` in `listing.controller.js` handle this new field.

### 1.2 Frontend - Upload Interface
- [ ] **Update Create/Edit Listing**: Modify `web/src/pages/CreateListing.jsx` and `web/src/pages/EditListing.jsx`.
    - Add a dedicated upload section for "360° Views".
    - Alternatively, allow tagging uploaded images as "360".

### 1.3 Frontend - Viewer Component
- [ ] **Create Component**: Build `web/src/components/VirtualTourViewer.jsx`.
    - Use `react-pannellum` or `aframe` (wrapped) to render the 360° view.
    - Support mouse drag, zoom, and fullscreen.
    - **Note:** Ensure it is mobile responsive.

### 1.4 Frontend - Integration
- [ ] **Update Listing Page**: Integrate `VirtualTourViewer` into `web/src/pages/Listing.jsx`.
    - Add a tab or toggle: "Photos" | "360° Tour" | "Videos".
- [ ] **Update Preview**: Ensure `web/src/components/ImagePreview.jsx` can detect and render 360 images appropriately (or launch the viewer).

## Phase 2: Virtual Staging (2D "AR")

This phase enables users to overlay furniture on empty room photos.

### 2.1 Virtual Staging Tool
- [ ] **Create Component**: Build `web/src/components/VirtualStagingEditor.jsx`.
    - **Canvas**: Use `fabric.js` or `react-konva` for the workspace.
    - **Assets**: Create a library of transparent PNG assets (couches, tables, plants).
    - **Features**: Drag, drop, resize, rotate, delete assets.
    - **Export**: Ability to save the staged image as a composite or save the state.

### 2.2 Integration
- [ ] **Admin/Owner Tools**: Add a "Stage This Photo" button in `MyListings.jsx` or `EditListing.jsx`.
- [ ] **User Experience**: (Optional) Allow potential buyers to "Stage" a room themselves on the `Listing.jsx` page to visualize potential.

## Phase 3: "AR" Furniture Placement (Mobile)

*Future Scope: True AR using WebXR for mobile devices.*

---

## Action Plan for Phase 1 (Immediate Start)

1.  **Modify API**: Update `listing.model.js` to schema support.
2.  **Create Viewer**: Implement the reusable `VirtualTourViewer` component.
3.  **Update Pages**: rolling out changes to `CreateListing`, `EditListing`, and `Listing`.
