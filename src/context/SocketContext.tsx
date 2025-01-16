"use client";
import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import io, { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {

  const socket = useMemo(() => io(`http://localhost:8080`,{
      reconnectionAttempts: 10,
      reconnectionDelay: 1000    
  }), []);
  const {toast} = useToast();

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      toast({
        title: "Connected to server",
        description: "You are now connected to the server",
      })

    });
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);