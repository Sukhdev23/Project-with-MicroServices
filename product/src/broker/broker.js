const amqplib = require('amqplib');



let channel, connection;
let connectAttempted = false;


async function connect() {
    if (connection || connectAttempted) return connection;
    connectAttempted = true;
    // Allow disabling broker via env or during tests
    if (process.env.NODE_ENV === 'test' || process.env.RABBIT_DISABLED === 'true') {
        console.log('RabbitMQ connection skipped (test or disabled)');
        return null;
    }
    try {
        const url = process.env.RABBIT_URL || 'amqp://localhost';
        connection = await amqplib.connect(url);
        console.log('Connected to RabbitMQ');
        channel = await connection.createChannel();
    }
    catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
        connection = null;
        channel = null;
    }
    return connection;
}


async function publishToQueue(queueName, data = {}) {
    try {
        if (!channel || !connection) await connect();

        // In test or if connection failed, silently skip
        if (!channel) {
            if (process.env.NODE_ENV !== 'test') {
                console.warn('RabbitMQ channel unavailable, skipping publish:', queueName);
            }
            return;
        }

        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
        if (process.env.NODE_ENV !== 'test') {
            console.log('Message sent to queue:', queueName, data);
        }
    }
    catch (err) {
        console.error('Failed to publish to queue:', queueName, err.message || err);
    }
}


async function subscribeToQueue(queueName, callback) {

    if (!channel || !connection) await connect();

    await channel.assertQueue(queueName, {
        durable: true
    });

    channel.consume(queueName, async (msg) => {
        if (msg !== null) {
            const data = JSON.parse(msg.content.toString());
            await callback(data);
            channel.ack(msg);
        }
    })

}





module.exports = {
    connect,
    channel,
    connection,
    publishToQueue,
    subscribeToQueue
}