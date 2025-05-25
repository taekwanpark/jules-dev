import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CarStatus } from '@prisma/client';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET /api/cars/[id] - Fetch a single car by ID
export async function GET(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const car = await prisma.car.findUnique({
      where: { id },
    });
    if (!car) {
      return NextResponse.json({ message: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json(car);
  } catch (error) {
    console.error(`Error fetching car ${id}:`, error);
    return NextResponse.json({ message: `Error fetching car ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/cars/[id] - Update a car by ID
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const body = await request.json();
    const { brand, model, plate_number, status, daily_rate, image_url } = body;

    if (!brand && !model && !plate_number && !status && !daily_rate && image_url === undefined) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    if (status && !Object.values(CarStatus).includes(status as CarStatus)) {
        return NextResponse.json({ message: 'Invalid status value for car' }, { status: 400 });
    }
    
    const dataToUpdate: any = {};
    if (brand) dataToUpdate.brand = brand;
    if (model) dataToUpdate.model = model;
    if (plate_number) dataToUpdate.plate_number = plate_number;
    if (status) dataToUpdate.status = status as CarStatus;
    if (daily_rate) dataToUpdate.daily_rate = parseFloat(daily_rate as string);
    if (image_url !== undefined) dataToUpdate.image_url = image_url;


    const updatedCar = await prisma.car.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedCar);
  } catch (error) {
    console.error(`Error updating car ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Car not found for update' }, { status: 404 });
    }
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('plate_number')) {
      return NextResponse.json({ message: 'Another car with this plate number already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: `Error updating car ${id}`, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/cars/[id] - Delete a car by ID
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    await prisma.car.delete({
      where: { id },
    });
    return NextResponse.json({ message: `Car ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting car ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Car not found for deletion' }, { status: 404 });
    }
    if ((error as any).code === 'P2003') { // Foreign key constraint failed
        return NextResponse.json({ message: 'Cannot delete car with existing reservations or maintenance records. Please remove them first.' }, { status: 409 });
    }
    return NextResponse.json({ message: `Error deleting car ${id}`, error: (error as Error).message }, { status: 500 });
  }
}
