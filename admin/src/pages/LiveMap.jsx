import React, { useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Card, Header } from '../components/UI';
import { api } from '../lib/api';
import { createAdminSocket } from '../lib/socket';

export default function LiveMap() {
  const [drivers, setDrivers] = useState([]);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    api.get('/admin/live-drivers').then((response) => setDrivers(response.data.drivers));

    const socket = createAdminSocket();
    socket.on('admin:driver_location', (event) => {
      setDrivers((previous) => {
        const index = previous.findIndex((driver) => driver._id === event.driverId);
        const item = {
          ...(index >= 0 ? previous[index] : { _id: event.driverId, name: 'Driver' }),
          currentLocation: { coordinates: [event.lng, event.lat] },
          heading: event.heading,
          lastLocationAt: event.at,
        };

        return index >= 0
          ? previous.map((driver, currentIndex) => (currentIndex === index ? item : driver))
          : [...previous, item];
      });
    });

    return () => socket.disconnect();
  }, []);

  const center = useMemo(() => {
    const coordinates = drivers[0]?.currentLocation?.coordinates;
    return coordinates
      ? { lat: coordinates[1], lng: coordinates[0] }
      : { lat: 23.2599, lng: 77.4126 };
  }, [drivers]);

  return (
    <>
      <Header title="Live Driver Map" sub={`${drivers.length} online drivers`} />
      <Card>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '70vh', borderRadius: 16 }}
            center={center}
            zoom={12}
          >
            {drivers.map((driver) => {
              const coordinates = driver.currentLocation?.coordinates;
              if (!coordinates) return null;
              return (
                <MarkerF
                  key={driver._id}
                  position={{ lat: coordinates[1], lng: coordinates[0] }}
                  title={`${driver.name}${driver.isBusy ? ' • busy' : ''}`}
                />
              );
            })}
          </GoogleMap>
        ) : (
          <div className="empty">Set VITE_GOOGLE_MAPS_API_KEY to render Google Maps.</div>
        )}
      </Card>
    </>
  );
}
