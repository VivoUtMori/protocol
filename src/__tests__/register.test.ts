import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/register/route';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn(),
    },
}));

describe('Register API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockRequest = (body: any) => {
        return {
            json: vi.fn().mockResolvedValue(body),
        } as unknown as Request;
    };

    it('should return 400 if email or password is missing', async () => {
        const req = mockRequest({ name: 'Test' });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.message).toBe('Email and password are required');
    });

    it('should return 409 if user already exists', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: '1', email: 'test@test.com' } as any);

        const req = mockRequest({ email: 'test@test.com', password: 'password' });
        const res = await POST(req);

        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.message).toBe('User with this email already exists');
    });

    it('should create a new user and return 201', async () => {
        vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
        vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashed_password' as never);
        vi.mocked(prisma.user.create).mockResolvedValueOnce({ id: '1', email: 'new@test.com' } as any);

        const req = mockRequest({ name: 'New User', email: 'new@test.com', password: 'password123' });
        const res = await POST(req);

        expect(res.status).toBe(201);
        expect(prisma.user.create).toHaveBeenCalled();
        const data = await res.json();
        expect(data.message).toBe('User registered successfully');
    });
});
