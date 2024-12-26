"use client";
import React, { createContext, useContext, useMemo } from "react";
import io, { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

// Create a context for socket
const SocketContext = createContext<SocketContextValue>({ socket: null });

// Export a provider that sets up the socket
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // Memoize the socket instance so it doesn't reconnect unnecessarily
  const socket = useMemo(() => io("http://localhost:8080"), []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to easily consume the socket in any component
export const useSocketContext = () => useContext(SocketContext);