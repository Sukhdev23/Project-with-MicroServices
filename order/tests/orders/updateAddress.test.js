const request = require('supertest');
const app = require('../../src/app');
const { getAuthCookie } = require('../setup/auth');
const orderModel = require('../../src/models/order.model');


describe('PATCH /api/orders/:id/address — Update delivery address prior to payment capture', () => {
    const orderId = '507f1f77bcf86cd799439012';
    const userId = '68bc6369c17579622cbdd9fe'; // keep user id consistent with auth token

    beforeEach(async () => {
        // ensure a clean state for this specific order id between tests
        await orderModel.deleteMany({ _id: orderId });
    });

    const newAddress = {
        street: '456 Second St',
        city: 'Gotham',
        state: 'NY',
        pincode: '10001',
        country: 'USA',
    };

    it('updates shipping address and returns updated order', async () => {

        const order = await orderModel.create({
            _id: orderId,
            user: userId,
            items: [],
            status: 'PENDING',
            totalPrice: {
                amount: 0,
                currency: 'USD'
            },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                zip: '10001',
                country: 'USA'
            }
        });

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie({ userId }))
            .send({ shippingAddress: newAddress })
            .expect('Content-Type', /json/)
            .expect(200);




        const orderResponse = res.body.order || res.body.data || res.body;
        console.log(orderResponse.shippingAddress);
        expect(orderResponse.shippingAddress).toMatchObject({
            street: newAddress.street,
            city: newAddress.city,
            state: newAddress.state,
            zip: newAddress.pincode,
            country: newAddress.country,
        });
    });

    it('returns 409 when address update is not allowed (e.g., after capture/shipping)', async () => {

        const order = await orderModel.create({
            _id: orderId,
            user: userId,
            items: [],
            status: 'SHIPPED',
            totalPrice: {
                amount: 0,
                currency: 'USD'
            },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                zip: '10001',
                country: 'USA'
            }
        });

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie({ userId }))
            .send({ shippingAddress: newAddress })
            .expect('Content-Type', /json/)
            .expect(409);

        expect(res.body.error || res.body.message).toMatch(/not.*allowed|cannot/i);
    });

    it('returns 400 when address is invalid', async () => {
        const order = await orderModel.create({
            _id: orderId,
            user: userId,
            items: [],
            status: 'PENDING',
            totalPrice: {
                amount: 0,
                currency: 'USD'
            },
            shippingAddress: {
                street: '123 Main St',
                city: 'Metropolis',
                state: 'NY',
                country: 'USA'
            }
        });

        const res = await request(app)
            .patch(`/api/orders/${orderId}/address`)
            .set('Cookie', getAuthCookie({ userId }))
            .send({ shippingAddress: { city: 'Nowhere' } })
            .expect('Content-Type', /json/)
            .expect(400);

        expect(res.body.errors || res.body.message).toBeDefined();
    });
});