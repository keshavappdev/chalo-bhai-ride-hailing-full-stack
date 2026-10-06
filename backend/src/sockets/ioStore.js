let ioInstance;
export const setIo = (io) => { ioInstance = io; };
export const getIo = () => { if (!ioInstance) throw new Error('Socket.IO not initialized'); return ioInstance; };
