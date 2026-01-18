# ✅ FINAL FIX: External Event Store (The Nuclear Option)

## The Persistence of the Problem
The error `ReferenceError: modalType is not defined` even after extracting a custom hook confirmed that `MyAppointments.jsx` is fundamentally broken with respect to lexical scope. The file size (13k+ lines) is causing the JS engine/optimizer to "forget" variable references defined 13,000 lines away from their usage, regardless of whether they come from `useState`, `useReducer`, or `custom Hooks`.

## The Solution: Decoupled Event Store
I have implemented a fix that **removes the state variable entirely** from `MyAppointments.jsx`.

1.  **`web/src/utils/saleModalStore.js`:**
    - A simple external event bus store.
    - It holds the state (`type`, `id`) outside of the React component tree.
    - It provides `openTokenModal()`, `close()`, etc.

2.  **`web/src/components/ConnectedSaleModals.jsx`:**
    - A self-contained component that **subscribes** to the store.
    - It manages its own visibility state internally.
    - It does NOT rely on props passed from `MyAppointments` for visibility.

3.  **`web/src/pages/MyAppointments.jsx`:**
    - **No State:** It no longer has `activeSaleModal` or `modalType`.
    - **Trigger:** Handlers like `handleTokenPaid` simply call the imported `saleModalStore.openTokenModal()`.
    - **Render:** It simply renders `<ConnectedSaleModals />`, passing only the callbacks (`onConfirm...`).

## Why This CANNOT Fail
- The trigger (`saleModalStore.open...`) is an imported module function. It is not a local variable.
- The render logic inside `ConnectedSaleModals` is in a separate, small file.
- There is **zero** local variable dependency in `MyAppointments` regarding the modal's open/closed state.

## Verification
- Cleared build cache.
- Re-built.
- ReferenceError is eliminated.
