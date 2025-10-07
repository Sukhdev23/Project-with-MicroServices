const request = require('supertest');
const app = require('../../src/app');
const { getAuthCookie } = require('../setup/auth');

// Mock external HTTP calls (cart & product services)
jest.mock('axios');
const axios = require('axios');
// Mock broker so publishing doesn't attempt real RabbitMQ connection
jest.mock('../../src/broker/borker', () => ({
    publishToQueue: jest.fn().mockResolvedValue(undefined)
}));


describe('POST /api/orders — Create order from current cart', () => {
    const sampleAddress = {
        street: '123 Main St',
        city: 'Metropolis',
        state: 'CA',
        pincode: '90210',
        country: 'USA',
    };

    beforeEach(() => {
        // Provide deterministic mock responses
        axios.get.mockImplementation((url) => {
            if (url.includes('/api/cart')) {
                return Promise.resolve({
                    data: {
                        cart: {
                            items: [
                                { productId: '507f191e810c19729de860ea', quantity: 2 },
                                { productId: '507f191e810c19729de860eb', quantity: 1 },
                            ]
                        }
                    }
                });
            }
            if (url.includes('/api/products/507f191e810c19729de860ea')) {
                return Promise.resolve({
                    data: {
                        data: {
                            _id: '507f191e810c19729de860ea',
                            stock: 10,
                            price: { amount: 50, currency: 'INR' },
                            title: 'Sample Product A'
                        }
                    }
                });
            }
            if (url.includes('/api/products/507f191e810c19729de860eb')) {
                return Promise.resolve({
                    data: {
                        data: {
                            _id: '507f191e810c19729de860eb',
                            stock: 5,
                            price: { amount: 30, currency: 'INR' },
                            title: 'Sample Product B'
                        }
                    }
                });
            }
            return Promise.reject(new Error('Unexpected axios URL in test: ' + url));
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('creates order from current cart, computes totals, sets status=PENDING, reserves inventory', async () => {
        // Example: Provide any inputs the API expects (headers/cookies/body). Adjust when auth is wired.
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', getAuthCookie())
            .send({ shippingAddress: sampleAddress })
            .expect('Content-Type', /json/)
            .expect(201);

        // Response shape assertions (adjust fields as you implement)
        expect(res.body).toBeDefined();
        expect(res.body.order).toBeDefined();
        const { order } = res.body;
        expect(order._id).toBeDefined();
        expect(order.user).toBeDefined();
        expect(order.status).toBe('PENDING');

        // Items copied from priced cart
        expect(Array.isArray(order.items)).toBe(true);
        expect(order.items.length).toBeGreaterThan(0);
        for (const it of order.items) {
            expect(it.product).toBeDefined();
            expect(it.quantity).toBeGreaterThan(0);
            expect(it.price).toBeDefined();
            expect(typeof it.price.amount).toBe('number');
            expect([ 'USD', 'INR' ]).toContain(it.price.currency);
        }

        // Totals include taxes + shipping
        expect(order.totalPrice).toBeDefined();
        expect(typeof order.totalPrice.amount).toBe('number');
        expect([ 'USD', 'INR' ]).toContain(order.totalPrice.currency);


        // Shipping address persisted
        expect(order.shippingAddress).toMatchObject({
            street: sampleAddress.street,
            city: sampleAddress.city,
            state: sampleAddress.state,
            zip: sampleAddress.pincode,
            country: sampleAddress.country,
        });

        // Inventory reservation acknowledgement (shape up to you)
        // For example, you might include a flag or reservation id
        // expect(res.body.inventoryReservation).toEqual({ success: true })
    });


    it('returns 422 when shipping address is missing/invalid', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Cookie', getAuthCookie())
            .send({})
            .expect('Content-Type', /json/)
            .expect(400);

        expect(res.body.errors || res.body.message).toBeDefined();
    });
});