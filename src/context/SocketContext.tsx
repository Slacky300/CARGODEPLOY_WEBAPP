"use client";
import React, { createContext, useContext, useMemo } from "react";
import io, { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {

  const socket = useMemo(() => io("http://localhost:8080",{
      reconnectionAttempts: 2,
      reconnectionDelay: 10000    
  }), []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);