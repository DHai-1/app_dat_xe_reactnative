import { request } from '@/lib/api';
import { customerApi } from '@/lib/customerApi';
import { uploadCustomerImage } from '@/lib/uploadImage';
import type { CustomerImageFile,CustomerVehicle,CustomerVehicleCreate } from '@datxe/shared';
export async function createCustomerVehicle(vehicle: CustomerVehicleCreate): Promise<CustomerVehicle> {
  return (await request<CustomerVehicle>('/customer/vehicles', {
    method: 'POST',
    body: vehicle,
  })) as CustomerVehicle;
}

export async function deleteCustomerVehicleImage(vehicleId: number, imageId: number): Promise<void> {
  await request(`/customer/vehicles/${vehicleId}/images/${imageId}`, { method: 'DELETE', allowNull: true });
}

export const getCustomerVehicles = customerApi.getCustomerVehicles;

export async function updateCustomerVehicle(id: number, vehicle: CustomerVehicleCreate): Promise<CustomerVehicle> {
  return (await request<CustomerVehicle>(`/customer/vehicles/${id}`, {
    method: 'PUT',
    body: vehicle,
  })) as CustomerVehicle;
}

export async function uploadCustomerVehicleImage(vehicleId: number, file: CustomerImageFile): Promise<void> {
  const uploaded = await uploadCustomerImage(file);
  await request(`/customer/vehicles/${vehicleId}/images`, {
    method: 'POST',
    body: { secure_url: uploaded.secureUrl, public_id: uploaded.publicId },
  });
}

export async function deleteCustomerVehicle(id: number): Promise<void> {
  await request(`/customer/vehicles/${id}`, { method: 'DELETE', allowNull: true });
}

export async function confirmCustomerHandover(id: number, phase: 'pickup' | 'dropoff'): Promise<void> {
  await request(`/customer/rides/${id}/handover/${phase}/confirm`, {
    method: 'POST',
    body: { confirmed: true },
    allowNull: true,
  });
}

export const getCustomerRide = customerApi.getCustomerRide;
