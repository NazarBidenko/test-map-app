import React, { useState, useEffect } from 'react';
import _debounce from 'lodash/debounce';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import "leaflet/dist/leaflet.css";

import { markersCollection } from './../firebase';
import { addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

type LatLngExpression = [number, number];

interface FirestoreMarkerData {
  geocode: LatLngExpression;
  popUp: string;
  number: number;
  type: string;
}

export type MarkerData = FirestoreMarkerData & { id: string };

const baseIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/8259/8259448.png',
  iconSize: [40, 40],
});

const officeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/9428/9428240.png',
  iconSize: [40, 40],
});

const homeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/9079/9079350.png',
  iconSize: [40, 40],
});

const pubIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1257/1257680.png',
  iconSize: [40, 40],
});

const officeLocation: LatLngExpression = [49.8162194129655, 23.995099340015823];

const officeMark: MarkerData = {
  id: 'office',
  geocode: officeLocation as LatLngExpression,
  popUp: "Hi, I'm an example of a popup at the office",
  number: 0,
  type: 'office',
};

const MapComponent: React.FC = () => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedType, setSelectedType] = useState('base');

  // додає маркери приймаючи параметр "маркер" при натисканні
  const addMarker = async (newMarker: FirestoreMarkerData) => {
    try {
      // додаємо маркер до колекції та зберігаємо посилання на цей маркер
      const docRef = await addDoc(markersCollection, newMarker);
      console.log(`Marker added with ID: ${docRef.id}`);

      // задаємо новий список маркерів
      setMarkers((prevMarkers) => [
        ...prevMarkers,
        // беремо дані маркера з мапи та додаємо унікалький id з firebase
        { ...newMarker, id: docRef.id },
      ]);
    } catch (error) {
      console.error('Error adding marker to Firestore: ', error);
    }
  };

  // видаляємо маркер приймаючи параметри маркера при повторному натисканні
  const removeMarker = async (clickedMarker: MarkerData) => {
    try {
      // задаємо новий список маркерів
      setMarkers((prevMarkers) =>
        prevMarkers.filter((marker) => marker.id !== clickedMarker.id)
      );
      // видаляємо маркер за унікальним id з firebase
      await deleteDoc(doc(markersCollection, clickedMarker.id));
      console.log(`Marker with ID ${clickedMarker.id} deleted from Firestore`);
    } catch (error) {
      console.error('Error removing marker from Firestore: ', error);
    }
  };

  // оновдюємо параметри маркеру після переміщення
  const updateMarker = async (updatedMarker: MarkerData) => {
    try {
      // змінюємо параметр geocode у firebase
      await updateDoc(doc(markersCollection, updatedMarker.id), {
        geocode: updatedMarker.geocode,
      });

      // задаємо новий масив зі зміненим параметром маркера
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

  // видалення всіх маркерів перебором існуючих в масиві
  const removeAllMarkers = async () => {
    try {
      for (const marker of markers) {
        await deleteDoc(doc(markersCollection, marker.id));
        console.log(`Marker with ID ${marker.id} deleted from Firestore`);
      }

      setMarkers([]);
    } catch (error) {
      console.error('Error removing markers from Firestore: ', error);
    }
  };

  // отримання даних при завантаженні сторінки
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        // отримуємо колекцію 
        const querySnapshot = await getDocs(markersCollection);
        // створюємо масив маркерів за даними з колекції
        const loadedMarkers: MarkerData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data() as FirestoreMarkerData,
        }));
        // задаємо цей масив як базовий
        setMarkers(loadedMarkers);
      } catch (error) {
        console.error('Error fetching markers from Firestore: ', error);
      }
    };
  
    fetchMarkers();
  }, []);

  // для нумерації маркерів
  let markersCounter = markers.length;
  // для оптимізації запитів на оновлення 
  const updateMarkerDebounced = _debounce(updateMarker, 1000);

  // компонент для обробки кліків у компоненті мапи
  const MyComponent: React.FC<{ addMarker: (newMarker: FirestoreMarkerData) => void }> = ({ addMarker }) => {
    useMapEvents({
      // на клік збільшуємо лічільник та додаємо маркер в масив і до firebase
      click: (e) => {
        markersCounter++;
        addMarker({
          geocode: [e.latlng.lat, e.latlng.lng],
          popUp: `Hello, I am example pop up ${markersCounter}`,
          number: markersCounter,
          type: selectedType,
        });
        console.log(markers);
      },
    });

    return null;
  };

  return (
    <div className='map-container'>
      <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
        <option value="base">Base Marks</option>
        <option value="home">Home Marks</option>
        <option value="bar">Bar Marks</option>
        {/* Додайте інші варіанти типів маркерів за необхідністю */}
      </select>

      <button className="remove-button" onClick={removeAllMarkers}>
        Remove All Markers
      </button>

      <MapContainer center={officeLocation} zoom={13} className='map'>
        {/* підложка мапи */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* мапимо маркери отримані при завантаженні сторінки */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            icon={getMarkerIcon(marker.type)}
            position={marker.geocode as LatLngExpression}
            draggable={true}
            eventHandlers={{
              click: () => removeMarker(marker),
              contextmenu: () => console.log('sasi'),
              dragend: (e) =>
                updateMarkerDebounced({
                  ...marker,
                  geocode: [e.target._latlng.lat, e.target._latlng.lng],
                }),
            }}
          >
            <Popup>
              {marker.popUp}
            </Popup>
          </Marker>
        ))}

        <Marker
          icon={officeIcon}
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

// Допоміжна функція для отримання іконки в залежності від типу маркера
const getMarkerIcon = (type: string): Icon => {
  switch (type) {
    case 'home':
      return homeIcon;
    case 'bar':
      return pubIcon;
    default:
      return baseIcon;
  }
};

export default MapComponent;
