// _components/UserSyncProvider.jsx
"use client";

import useUserSync from "../hooks/useUserSync";



export default function UserSyncProvider({ children }) {
  // Utiliser notre hook centralisé qui gère tout
  const { isSyncing, isReady } = useUserSync();

  // Afficher un spinner pendant la synchronisation initiale si nécessaire
  if (isSyncing && !isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return children;
}
