import type { SupportTicketStatus } from './support';

export type TicketStatus = SupportTicketStatus;

export type TicketSummary = {
  id: number;
  code: string;
  rideId: number | null;
  category: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  ownerRole: string;
};

export type TicketMessage = {
  id: number;
  ticketId: number;
  senderId: number;
  senderRole: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';
  body: string;
  imageUrl: string | null;
  createdAt: string;
};

export type TicketDetail = { ticket: TicketSummary; messages: TicketMessage[] };

export type CreateTicketInput = {
  category: string;
  rideId?: number | null;
  description: string;
  clientRequestId?: string;
};

export type SendTicketMessageInput = { body: string; status?: TicketStatus; imageUrl?: string };
