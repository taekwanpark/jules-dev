'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Define a client-side Car type
interface Car {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  status: string; // AVAILABLE, RENTED, MAINTENANCE
  daily_rate: number;
  image_url?: string | null;
}

export default function AdminCarsPage() { // Renamed component for clarity
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCars() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/cars');
        if (!response.ok) {
          throw new Error(`Failed to fetch cars: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setCars(data);
      } catch (err) {
        setError((err as Error).message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/cars/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete car: ${response.status}`);
      }
      setCars(cars.filter(car => car.id !== id));
      alert('Car deleted successfully.'); // Provide feedback
    } catch (err) {
      setError((err as Error).message); // Show error to user
      alert(`Error deleting car: ${(err as Error).message}`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <p className="text-xl text-gray-700">Loading cars...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-xl text-red-500">Error: {error}</p>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            // Re-trigger fetchCars by changing a dependency or calling it directly if it's memoized
            // For simplicity here, we'll just reload, but a state update to re-trigger useEffect is better
            window.location.reload(); 
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Car Management</h1>
        <Link href="/admin/cars/new" legacyBehavior>
          <a className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition ease-in-out duration-150">
            + Add New Car
          </a>
        </Link>
      </div>

      {cars.length === 0 && !loading ? ( // Ensure not to show "no cars" during initial load
        <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cars</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new car.</p>
        </div>
      ) : (
        <div className="shadow-lg overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Brand</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Model</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">Plate No.</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Daily Rate</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{car.brand}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{car.model}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden md:table-cell">{car.plate_number}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${car.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                        car.status === 'RENTED' ? 'bg-yellow-100 text-yellow-800' :
                        car.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-800' : // Changed red to orange for maintenance
                        'bg-gray-100 text-gray-800'}`}>
                      {car.status.charAt(0) + car.status.slice(1).toLowerCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${car.daily_rate.toFixed(2)}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/admin/cars/${car.id}/edit`} legacyBehavior>
                      <a className="text-indigo-600 hover:text-indigo-900 mr-3">Edit<span className="sr-only">, {car.brand} {car.model}</span></a>
                    </Link>
                    <button
                      onClick={() => handleDelete(car.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete<span className="sr-only">, {car.brand} {car.model}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
