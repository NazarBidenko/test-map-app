import React, { useState, useEffect } from 'react';

import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import "leaflet/dist/leaflet.css";

import { colRef } from './../firebase';
import { addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

type LatLngExpression = [number, number];

interface FirestoreMarkerData {
  geocode: LatLngExpression;
  popUp: string;
  number: number;
}

export type MarkerData = FirestoreMarkerData & { id: string };

const newIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8259/8259448.png',
  iconSize: [40, 40],
});

const homeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/9079/9079736.png',
  iconSize: [40, 40],
});

const officeLocation: LatLngExpression = [49.8162194129655, 23.995099340015823];

const officeMark: MarkerData = {
  id: 'office',
  geocode: officeLocation as LatLngExpression,
  popUp: "Hi, I'm an example of a popup at the office",
  number: 0,
};

const MapComponent: React.FC = () => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const addMarker = async (newMarker: Omit<MarkerData, 'id'>) => {
    try {
      const docRef = await addDoc(colRef, newMarker);
      console.log(`Marker added with ID: ${docRef.id}`);

      setMarkers((prevMarkers) => [
        ...prevMarkers,
        { ...newMarker, id: docRef.id },
      ]);
    } catch (error) {
      console.error('Error adding marker to Firestore: ', error);
    }
  };

  const removeMarker = async (docId: string, clickedMarker: MarkerData) => {
    try {
      setMarkers((prevMarkers) =>
        prevMarkers.filter((marker) => marker.id !== clickedMarker.id)
      );

      await deleteDoc(doc(colRef, docId));
      console.log(`Marker with ID ${docId} deleted from Firestore`);
    } catch (error) {
      console.error('Error removing marker from Firestore: ', error);
    }
  };

  const updateMarker = async (updatedMarker: MarkerData) => {
    try {
      await updateDoc(doc(colRef, updatedMarker.id), {
        geocode: updatedMarker.geocode,
      });

      setMarkers((prevMarkers) =>
        prevMarkers.map((marker) =>
          marker.id === updatedMarker.id ? updatedMarker : marker
        )
      );

      console.log(`Marker with ID ${updatedMarker.id} updated in Firestore`);
    } catch (error) {
      console.error('Error updating marker in Firestore: ', error);
    }
  };

  const removeAllMarkers = async () => {
    try {
      for (const marker of markers) {
        await deleteDoc(doc(colRef, marker.id));
        console.log(`Marker with ID ${marker.id} deleted from Firestore`);
      }

      setMarkers([]);
    } catch (error) {
      console.error('Error removing markers from Firestore: ', error);
    }
  };

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const querySnapshot = await getDocs(colRef);
        const loadedMarkers: MarkerData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as FirestoreMarkerData,
        }));
        setMarkers(loadedMarkers);
      } catch (error) {
        console.error('Error fetching markers from Firestore: ', error);
      }
    };
  
    fetchMarkers();
  }, []);

  let markersCounter = markers.length;

  const MyComponent: React.FC<{ addMarker: (newMarker: Omit<MarkerData, 'id'>) => void }> = ({ addMarker }) => {
    useMapEvents({
      click: (e) => {
        markersCounter++;
        addMarker({
          geocode: [e.latlng.lat, e.latlng.lng],
          popUp: `Hello, I am example pop up ${markersCounter}`,
          number: markersCounter,
        });
        console.log(markers);
      },
    });

    return null;
  };

  return (
    <div className='map-container'>
      <button className="remove-button" onClick={removeAllMarkers}>
        Remove All Markers
      </button>

      <MapContainer center={officeLocation} zoom={13} className='map'>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            icon={newIcon}
            position={marker.geocode as LatLngExpression}
            draggable={true}
            eventHandlers={{
              click: () => removeMarker(marker.id, marker),
              dragend: (e) =>
                updateMarker({
                  ...marker,
                  geocode: [e.target._latlng.lat, e.target._latlng.lng],
                }),
            }}
          >
            {marker.number}
          </Marker>
        ))}

        <Marker
          icon={homeIcon}
          position={officeMark.geocode as LatLngExpression}
        >
          <Popup>
            {officeMark.popUp}
          </Popup>
        </Marker>

        <MyComponent addMarker={addMarker} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
