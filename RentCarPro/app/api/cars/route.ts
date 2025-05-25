import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Import the global Prisma instance
import { CarStatus } from '@prisma/client';

// GET /api/cars - Fetch all cars
export async function GET() {
  try {
    const cars = await prisma.car.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching cars:", error);
    return NextResponse.json({ message: 'Error fetching cars', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/cars - Create a new car
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brand, model, plate_number, status, daily_rate, image_url } = body;

    if (!brand || !model || !plate_number || !daily_rate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (status && !Object.values(CarStatus).includes(status as CarStatus)) {
        return NextResponse.json({ message: 'Invalid status value for car' }, { status: 400 });
    }

    const newCar = await prisma.car.create({
      data: {
        brand,
        model,
        plate_number,
        daily_rate: parseFloat(daily_rate as string),
        status: status as CarStatus,
        image_url,
      },
    });
    return NextResponse.json(newCar, { status: 201 });
  } catch (error) {
    console.error("Error creating car:", error);
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('plate_number')) {
      return NextResponse.json({ message: 'Car with this plate number already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating car', error: (error as Error).message }, { status: 500 });
  }
}
